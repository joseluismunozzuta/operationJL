import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { toResponse, type GameStatus, type LastResult, type TriviaResponse } from "./trivia";

const BASE_POINTS = 1000;
/** Porción del puntaje base que depende de la velocidad (el resto es fijo). */
const SPEED_WEIGHT = 0.5;
const STREAK_STEP = 100;
const STREAK_CAP = 500;

export type GradeSummary = {
  correctIndex: number;
  counts: number[];
  answered: number;
  correct: number;
  soloBonusFor: string | null;
};

function pointsFor(
  response: TriviaResponse,
  startedAt: Timestamp,
  timeLimitSeconds: number,
  newStreak: number
): number {
  // Sin answeredAt resuelto asumimos el peor caso (tiempo completo), en vez de
  // regalar el máximo.
  const elapsedMs = response.answeredAt
    ? response.answeredAt.toMillis() - startedAt.toMillis()
    : timeLimitSeconds * 1000;
  const ratio = Math.min(Math.max(elapsedMs / (timeLimitSeconds * 1000), 0), 1);

  const base = Math.round(BASE_POINTS * (1 - SPEED_WEIGHT * ratio));
  const streakBonus = Math.min(Math.max(newStreak - 1, 0) * STREAK_STEP, STREAK_CAP);
  return base + streakBonus;
}

// Corre en el navegador del admin: lee la clave correcta (que los jugadores no
// pueden leer), califica todas las respuestas y publica el resultado.
export async function gradeQuestion(
  questionId: string,
  timeLimitSeconds: number,
  optionCount: number,
  startedAt: Timestamp
): Promise<GradeSummary> {
  const keySnap = await getDoc(doc(db, "triviaKeys", questionId));
  if (!keySnap.exists()) throw new Error("key-not-found");
  const correctIndex = keySnap.data().correctIndex as number;

  const [responsesSnap, scoresSnap] = await Promise.all([
    getDocs(query(collection(db, "triviaResponses"), where("questionId", "==", questionId))),
    getDocs(collection(db, "triviaScores")),
  ]);

  const responses = responsesSnap.docs.map((d) => toResponse(d.id, d.data()));
  const correctOnes = responses.filter((r) => r.optionIndex === correctIndex);
  const isSolo = correctOnes.length === 1;

  const counts = Array.from({ length: optionCount }, (_, i) =>
    responses.filter((r) => r.optionIndex === i).length
  );

  const prevScores = new Map(
    scoresSnap.docs.map((d) => [
      d.id,
      {
        totalPoints: (d.data().totalPoints as number) ?? 0,
        streak: (d.data().streak as number) ?? 0,
        correctCount: (d.data().correctCount as number) ?? 0,
      },
    ])
  );

  const batch = writeBatch(db);

  for (const response of responses) {
    const prev = prevScores.get(response.uid);
    const wasCorrect = response.optionIndex === correctIndex;
    const newStreak = wasCorrect ? (prev?.streak ?? 0) + 1 : 0;

    let gained = 0;
    if (wasCorrect) {
      gained = pointsFor(response, startedAt, timeLimitSeconds, newStreak);
      if (isSolo) gained *= 2;
    }

    batch.set(doc(db, "triviaScores", response.uid), {
      name: response.name,
      photoURL: response.photoURL,
      totalPoints: (prev?.totalPoints ?? 0) + gained,
      streak: newStreak,
      correctCount: (prev?.correctCount ?? 0) + (wasCorrect ? 1 : 0),
    });
  }

  // Quien ya jugaba antes y no respondió esta pregunta pierde la racha.
  const respondedUids = new Set(responses.map((r) => r.uid));
  for (const [uid, prev] of prevScores) {
    if (respondedUids.has(uid) || prev.streak === 0) continue;
    batch.set(doc(db, "triviaScores", uid), { streak: 0 }, { merge: true });
  }

  await batch.commit();

  const lastResult: LastResult = { questionId, correctIndex, counts };
  await setDoc(
    doc(db, "triviaGame", "live"),
    { status: "results" satisfies GameStatus, lastResult },
    { merge: true }
  );

  return {
    correctIndex,
    counts,
    answered: responses.length,
    correct: correctOnes.length,
    soloBonusFor: isSolo ? correctOnes[0].name : null,
  };
}
