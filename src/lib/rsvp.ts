import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { QUESTION_BANK } from "./questions";

export type Confirmation = "si" | "no";

export type RsvpRecord = {
  id: string;
  name: string;
  confirmation: Confirmation;
  questionId: string | null;
  questionText: string | null;
  uid: string;
  photoURL: string | null;
  createdAt: Timestamp | null;
};

type AssignedQuestion = { id: string; text: string };

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function assignRandomQuestion(
  name: string,
  excludeQuestionId?: string | null
): Promise<AssignedQuestion | null> {
  const availableSnap = await getDocs(
    query(collection(db, "questions"), where("taken", "==", false))
  );
  const candidates = shuffle(
    availableSnap.docs.map((d) => d.id).filter((id) => id !== excludeQuestionId)
  );

  for (const questionId of candidates) {
    try {
      const assigned = await runTransaction(db, async (tx) => {
        const ref = doc(db, "questions", questionId);
        const snap = await tx.get(ref);
        if (!snap.exists() || snap.data().taken) {
          throw new Error("question-already-taken");
        }
        tx.update(ref, { taken: true, assignedToName: name });
        return { id: questionId, text: snap.data().text as string };
      });
      return assigned;
    } catch {
      // Otro invitado ganó la carrera por esta pregunta — probar la siguiente.
      continue;
    }
  }

  // Banco agotado por una condición de carrera entre el query y las transacciones.
  return null;
}

async function releaseQuestion(questionId: string) {
  await updateDoc(doc(db, "questions", questionId), {
    taken: false,
    assignedToName: null,
  });
}

// El documento de cada testigo vive en rsvps/{uid}, donde uid es su cuenta
// de Google (Firebase Auth). Como la identidad ya no depende del navegador,
// reenviar el formulario desde cualquier dispositivo — con la misma cuenta —
// actualiza su propia declaración en vez de crear un duplicado.
// Si el testigo cambia de "sí" a "no", su pregunta se libera de vuelta al
// banco. Si confirma "sí" de nuevo sin haber cambiado, conserva la misma
// pregunta (no se reasigna).
export async function submitRsvp(rawName: string, confirmation: Confirmation) {
  const user = auth.currentUser;
  if (!user) throw new Error("not-authenticated");
  const name = rawName.trim();
  const rsvpRef = doc(db, "rsvps", user.uid);

  const existingSnap = await getDoc(rsvpRef);
  const existing = existingSnap.exists()
    ? (existingSnap.data() as { confirmation: Confirmation; questionId: string | null; questionText: string | null; createdAt: Timestamp })
    : null;

  let assigned: AssignedQuestion | null = null;

  if (confirmation === "si") {
    if (existing?.confirmation === "si" && existing.questionId && existing.questionText) {
      assigned = { id: existing.questionId, text: existing.questionText };
    } else {
      assigned = await assignRandomQuestion(name);
    }
  } else if (existing?.confirmation === "si" && existing.questionId) {
    await releaseQuestion(existing.questionId);
  }

  await setDoc(rsvpRef, {
    name,
    confirmation,
    uid: user.uid,
    photoURL: user.photoURL ?? null,
    questionId: assigned?.id ?? null,
    questionText: assigned?.text ?? null,
    createdAt: existing?.createdAt ?? serverTimestamp(),
  });

  return assigned;
}

// Cambia la pregunta asignada a un testigo por otra del banco. Primero se
// reclama la nueva (transacción atómica, igual que en la asignación inicial)
// y recién entonces se libera la anterior — así, si el banco está agotado o
// alguien gana la carrera, el testigo conserva la que ya tenía en vez de
// quedarse sin ninguna. La pregunta actual queda excluida de los candidatos
// para que "cambiar" siempre entregue una distinta.
export async function rerollQuestion(): Promise<AssignedQuestion | null> {
  const user = auth.currentUser;
  if (!user) throw new Error("not-authenticated");

  const rsvpRef = doc(db, "rsvps", user.uid);
  const existingSnap = await getDoc(rsvpRef);
  if (!existingSnap.exists()) throw new Error("rsvp-not-found");

  const existing = existingSnap.data() as {
    name: string;
    confirmation: Confirmation;
    questionId: string | null;
  };
  if (existing.confirmation !== "si") throw new Error("not-attending");

  const assigned = await assignRandomQuestion(existing.name, existing.questionId);
  if (!assigned) return null; // Banco agotado: conserva la pregunta actual.

  if (existing.questionId) {
    await releaseQuestion(existing.questionId);
  }

  await updateDoc(rsvpRef, {
    questionId: assigned.id,
    questionText: assigned.text,
  });

  return assigned;
}

export async function seedQuestions(): Promise<{ seeded: number; alreadyExisted: number }> {
  const existing = await getDocs(collection(db, "questions"));
  if (!existing.empty) {
    return { seeded: 0, alreadyExisted: existing.size };
  }

  const batch = writeBatch(db);
  for (const q of QUESTION_BANK) {
    batch.set(doc(db, "questions", q.id), {
      text: q.text,
      taken: false,
      assignedToName: null,
    });
  }
  await batch.commit();
  return { seeded: QUESTION_BANK.length, alreadyExisted: 0 };
}

function toRsvpRecord(
  id: string,
  data: Record<string, unknown>
): RsvpRecord {
  return {
    id,
    name: (data.name as string) ?? "",
    confirmation: (data.confirmation as Confirmation) ?? "no",
    questionId: (data.questionId as string | null) ?? null,
    questionText: (data.questionText as string | null) ?? null,
    uid: (data.uid as string) ?? "",
    photoURL: (data.photoURL as string | null) ?? null,
    createdAt: (data.createdAt as Timestamp | null) ?? null,
  };
}

export async function getMyRsvp(uid: string): Promise<RsvpRecord | null> {
  const snap = await getDoc(doc(db, "rsvps", uid));
  if (!snap.exists()) return null;
  return toRsvpRecord(snap.id, snap.data());
}

export function subscribeAdminRsvps(callback: (rsvps: RsvpRecord[]) => void) {
  const q = query(collection(db, "rsvps"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => toRsvpRecord(d.id, d.data())));
  });
}

export async function getRevealedRsvps(): Promise<RsvpRecord[]> {
  // Orden en el cliente (en vez de orderBy en el query) para no depender de
  // un índice compuesto en Firestore.
  const q = query(collection(db, "rsvps"), where("confirmation", "==", "si"));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => toRsvpRecord(d.id, d.data()))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
