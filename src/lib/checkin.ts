import { doc, getDoc, runTransaction, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { ADMIN_EMAIL } from "./event-config";
import { assignRandomQuestion, type Confirmation } from "./rsvp";

export type CheckInResult = {
  turn: number;
  name: string;
  questionText: string | null;
  /** true si ya había escaneado antes: se le devuelve su mismo turno. */
  alreadyCheckedIn: boolean;
};

// El turno sale de un contador único en counters/checkin, incrementado dentro
// de una transacción — así dos personas que escanean el QR al mismo tiempo
// nunca reciben el mismo número.
async function claimNextTurn(): Promise<number> {
  const counterRef = doc(db, "counters", "checkin");
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const next = snap.exists() ? ((snap.data().lastTurn as number) ?? 0) + 1 : 1;
    tx.set(counterRef, { lastTurn: next });
    return next;
  });
}

// Registra la llegada del testigo (escaneo del QR en la puerta) y le asigna
// su turno de declaración según el orden de llegada.
//
// Casos que cubre:
// - Ya confirmó y tiene pregunta: solo se ficha y recibe turno.
// - Nunca confirmó, o había dicho que no: se le asigna pregunta en el acto y
//   su declaración pasa a "sí" — así el que aparece sin avisar queda cubierto.
// - Vuelve a escanear: conserva su turno original, no se reasigna nada.
export async function checkIn(): Promise<CheckInResult> {
  const user = auth.currentUser;
  if (!user) throw new Error("not-authenticated");
  // JL es el sujeto del expediente, no un testigo: nunca se ficha ni ocupa un
  // turno de declaración. Se corta acá y no solo en la UI, para que el guard
  // no dependa de la pantalla.
  if (user.email === ADMIN_EMAIL) throw new Error("admin-not-a-witness");

  const name = user.displayName || user.email || "Testigo";
  const rsvpRef = doc(db, "rsvps", user.uid);
  const snap = await getDoc(rsvpRef);
  const existing = snap.exists()
    ? (snap.data() as {
        name?: string;
        confirmation?: Confirmation;
        questionId?: string | null;
        questionText?: string | null;
        createdAt?: Timestamp;
        turn?: number | null;
      })
    : null;

  if (existing?.turn) {
    return {
      turn: existing.turn,
      name: existing.name ?? name,
      questionText: existing.questionText ?? null,
      alreadyCheckedIn: true,
    };
  }

  let questionId = existing?.questionId ?? null;
  let questionText = existing?.questionText ?? null;
  if (!questionId) {
    const assigned = await assignRandomQuestion(name);
    questionId = assigned?.id ?? null;
    questionText = assigned?.text ?? null;
  }

  const turn = await claimNextTurn();

  await setDoc(rsvpRef, {
    name,
    confirmation: "si" satisfies Confirmation,
    uid: user.uid,
    photoURL: user.photoURL ?? null,
    questionId,
    questionText,
    createdAt: existing?.createdAt ?? serverTimestamp(),
    turn,
    checkedInAt: serverTimestamp(),
  });

  return { turn, name, questionText, alreadyCheckedIn: false };
}
