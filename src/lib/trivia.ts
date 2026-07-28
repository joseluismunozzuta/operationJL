import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { TRIVIA_BANK } from "./trivia-bank";

export type GameStatus = "idle" | "question" | "results" | "finished";

export type LastResult = {
  questionId: string;
  correctIndex: number;
  /** Cuántos eligieron cada alternativa. */
  counts: number[];
};

export type GameState = {
  status: GameStatus;
  currentQuestionId: string | null;
  currentIndex: number;
  totalQuestions: number;
  questionStartedAt: Timestamp | null;
  deadlineSeconds: number;
  optionCount: number;
  lastResult: LastResult | null;
};

export type TriviaQuestion = {
  id: string;
  order: number;
  text: string;
  imageUrl: string | null;
  options: string[];
  timeLimitSeconds: number;
};

export type TriviaResponse = {
  id: string;
  uid: string;
  name: string;
  photoURL: string | null;
  questionId: string;
  optionIndex: number;
  answeredAt: Timestamp | null;
};

export type TriviaScore = {
  id: string;
  name: string;
  photoURL: string | null;
  totalPoints: number;
  streak: number;
  correctCount: number;
};

const GAME_REF = () => doc(db, "triviaGame", "live");

export const IDLE_GAME: GameState = {
  status: "idle",
  currentQuestionId: null,
  currentIndex: 0,
  totalQuestions: 0,
  questionStartedAt: null,
  deadlineSeconds: 20,
  optionCount: 4,
  lastResult: null,
};

function toGameState(data: Record<string, unknown> | undefined): GameState {
  if (!data) return IDLE_GAME;
  return {
    status: (data.status as GameStatus) ?? "idle",
    currentQuestionId: (data.currentQuestionId as string | null) ?? null,
    currentIndex: (data.currentIndex as number) ?? 0,
    totalQuestions: (data.totalQuestions as number) ?? 0,
    questionStartedAt: (data.questionStartedAt as Timestamp | null) ?? null,
    deadlineSeconds: (data.deadlineSeconds as number) ?? 20,
    optionCount: (data.optionCount as number) ?? 4,
    lastResult: (data.lastResult as LastResult | null) ?? null,
  };
}

function toQuestion(id: string, data: Record<string, unknown>): TriviaQuestion {
  return {
    id,
    order: (data.order as number) ?? 0,
    text: (data.text as string) ?? "",
    imageUrl: (data.imageUrl as string | null) ?? null,
    options: (data.options as string[]) ?? [],
    timeLimitSeconds: (data.timeLimitSeconds as number) ?? 20,
  };
}

function toScore(id: string, data: Record<string, unknown>): TriviaScore {
  return {
    id,
    name: (data.name as string) ?? "",
    photoURL: (data.photoURL as string | null) ?? null,
    totalPoints: (data.totalPoints as number) ?? 0,
    streak: (data.streak as number) ?? 0,
    correctCount: (data.correctCount as number) ?? 0,
  };
}

export function toResponse(id: string, data: Record<string, unknown>): TriviaResponse {
  return {
    id,
    uid: (data.uid as string) ?? "",
    name: (data.name as string) ?? "",
    photoURL: (data.photoURL as string | null) ?? null,
    questionId: (data.questionId as string) ?? "",
    optionIndex: (data.optionIndex as number) ?? -1,
    answeredAt: (data.answeredAt as Timestamp | null) ?? null,
  };
}

// --- Lecturas en vivo -------------------------------------------------------

export function subscribeGame(
  callback: (state: GameState) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    GAME_REF(),
    (snap) => callback(toGameState(snap.data())),
    (err) => onError?.(err)
  );
}

export function subscribeScores(
  callback: (scores: TriviaScore[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    collection(db, "triviaScores"),
    (snap) =>
      callback(
        snap.docs
          .map((d) => toScore(d.id, d.data()))
          .sort((a, b) => b.totalPoints - a.totalPoints)
      ),
    (err) => onError?.(err)
  );
}

// Solo el admin puede leer las respuestas (para el conteo en vivo y calificar).
export function subscribeResponsesFor(
  questionId: string,
  callback: (responses: TriviaResponse[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    query(collection(db, "triviaResponses"), where("questionId", "==", questionId)),
    (snap) => callback(snap.docs.map((d) => toResponse(d.id, d.data()))),
    (err) => onError?.(err)
  );
}

// La lectura de la pregunta está restringida por reglas a la que esté activa.
export async function getQuestion(questionId: string): Promise<TriviaQuestion | null> {
  const snap = await getDoc(doc(db, "triviaQuestions", questionId));
  return snap.exists() ? toQuestion(snap.id, snap.data()) : null;
}

export async function getAllQuestions(): Promise<TriviaQuestion[]> {
  const snap = await getDocs(collection(db, "triviaQuestions"));
  return snap.docs.map((d) => toQuestion(d.id, d.data())).sort((a, b) => a.order - b.order);
}

// --- Acción del jugador -----------------------------------------------------

export async function submitAnswer(questionId: string, optionIndex: number) {
  const user = auth.currentUser;
  if (!user) throw new Error("not-authenticated");

  // El id fijo {pregunta}_{uid} + reglas de solo-create garantizan una única
  // respuesta por pregunta, imposible de cambiar después de ver el resultado.
  await setDoc(doc(db, "triviaResponses", `${questionId}_${user.uid}`), {
    uid: user.uid,
    name: user.displayName || user.email || "Testigo",
    photoURL: user.photoURL ?? null,
    questionId,
    optionIndex,
    answeredAt: serverTimestamp(),
  });
}

export async function getMyResponse(questionId: string): Promise<TriviaResponse | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, "triviaResponses", `${questionId}_${user.uid}`));
  return snap.exists() ? toResponse(snap.id, snap.data()) : null;
}

// --- Control del flujo (admin) ---------------------------------------------

export async function seedTrivia(): Promise<{ seeded: number; alreadyExisted: number }> {
  const existing = await getDocs(collection(db, "triviaQuestions"));
  if (!existing.empty) {
    return { seeded: 0, alreadyExisted: existing.size };
  }

  const batch = writeBatch(db);
  TRIVIA_BANK.forEach((q, index) => {
    batch.set(doc(db, "triviaQuestions", q.id), {
      order: index,
      text: q.text,
      imageUrl: q.imageUrl,
      options: q.options,
      timeLimitSeconds: q.timeLimitSeconds,
    });
    // La clave correcta vive aparte: los jugadores nunca pueden leerla.
    batch.set(doc(db, "triviaKeys", q.id), { correctIndex: q.correctIndex });
  });
  batch.set(GAME_REF(), { ...IDLE_GAME, totalQuestions: TRIVIA_BANK.length });
  await batch.commit();

  return { seeded: TRIVIA_BANK.length, alreadyExisted: 0 };
}

export async function openQuestion(question: TriviaQuestion, index: number, total: number) {
  await setDoc(GAME_REF(), {
    status: "question" satisfies GameStatus,
    currentQuestionId: question.id,
    currentIndex: index,
    totalQuestions: total,
    questionStartedAt: serverTimestamp(),
    deadlineSeconds: question.timeLimitSeconds,
    optionCount: question.options.length,
    lastResult: null,
  });
}

export async function setGameStatus(status: GameStatus) {
  await setDoc(GAME_REF(), { status }, { merge: true });
}

export async function resetGame() {
  const [responses, scores, questions] = await Promise.all([
    getDocs(collection(db, "triviaResponses")),
    getDocs(collection(db, "triviaScores")),
    getDocs(collection(db, "triviaQuestions")),
  ]);

  const batch = writeBatch(db);
  responses.docs.forEach((d) => batch.delete(d.ref));
  scores.docs.forEach((d) => batch.delete(d.ref));
  batch.set(GAME_REF(), { ...IDLE_GAME, totalQuestions: questions.size });
  await batch.commit();
}

export async function deleteTriviaBank() {
  const [questions, keys] = await Promise.all([
    getDocs(collection(db, "triviaQuestions")),
    getDocs(collection(db, "triviaKeys")),
  ]);
  const batch = writeBatch(db);
  questions.docs.forEach((d) => batch.delete(d.ref));
  keys.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  await deleteDoc(GAME_REF()).catch(() => {});
}
