import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

export type QuestionSeed = {
  id: string;
  text: string;
};

export type QuestionRecord = {
  id: string;
  text: string;
  taken: boolean;
  assignedToName: string | null;
};

function toQuestionRecord(id: string, data: Record<string, unknown>): QuestionRecord {
  return {
    id,
    text: (data.text as string) ?? "",
    taken: (data.taken as boolean) ?? false,
    assignedToName: (data.assignedToName as string | null) ?? null,
  };
}

export function subscribeQuestions(callback: (questions: QuestionRecord[]) => void) {
  return onSnapshot(collection(db, "questions"), (snap) => {
    callback(
      snap.docs
        .map((d) => toQuestionRecord(d.id, d.data()))
        .sort((a, b) => a.id.localeCompare(b.id))
    );
  });
}

export async function addQuestion(text: string) {
  await addDoc(collection(db, "questions"), {
    text: text.trim(),
    taken: false,
    assignedToName: null,
  });
}

export async function deleteQuestion(id: string) {
  await deleteDoc(doc(db, "questions", id));
}

// Banco de 30 preguntas para el interrogatorio grupal. IDs fijos para que el
// sembrado (seedQuestions) sea idempotente.
export const QUESTION_BANK: QuestionSeed[] = [
  { id: "q01", text: "¿Cómo fue el primer día que hablaron?" },
  { id: "q02", text: "¿Cuál es el momento más divertido que recuerdas con él?" },
  { id: "q03", text: "Cuéntanos una anécdota vergonzosa de JL." },
  { id: "q04", text: "¿Cuál ha sido el mejor consejo que te ha dado?" },
  { id: "q05", text: "¿En qué situación viste a JL más nervioso de lo normal?" },
  { id: "q06", text: "¿Cuál es la manía o costumbre más graciosa que tiene?" },
  { id: "q07", text: "¿Cuál fue el viaje o salida más memorable que han tenido juntos?" },
  { id: "q08", text: "Si tuvieras que describir a JL en 3 palabras, ¿cuáles serían y por qué?" },
  { id: "q09", text: "¿Cuál fue la primera impresión que tuviste de él?" },
  { id: "q10", text: "Cuéntanos algo que JL haya hecho por ti que no olvides." },
  { id: "q11", text: "¿Cuál es el chiste interno o broma que solo ustedes dos entienden?" },
  { id: "q12", text: "¿En qué momento te reíste tanto con él que no podías parar?" },
  { id: "q13", text: "¿Cuál crees que es el mayor talento oculto de JL?" },
  { id: "q14", text: "¿Qué comida o restaurante asocias inmediatamente con él?" },
  { id: "q15", text: "Cuéntanos una vez que JL te haya sorprendido (para bien o para mal)." },
  { id: "q16", text: "¿Cuál ha sido la conversación más profunda que han tenido?" },
  { id: "q17", text: "¿Qué es lo que más admiras de JL?" },
  { id: "q18", text: "¿Cuál fue el plan o idea más loca que se les ocurrió juntos?" },
  { id: "q19", text: "¿Qué canción te recuerda a él o a algún momento con él?" },
  { id: "q20", text: "¿Cuál ha sido el regalo más memorable que te ha dado o le has dado?" },
  { id: "q21", text: "Si JL fuera un personaje de película o serie, ¿cuál sería y por qué?" },
  { id: "q22", text: "¿Cuál es la excusa más creativa que le has escuchado dar?" },
  { id: "q23", text: "¿Qué historia de JL cuentas siempre que hablas de él con otros?" },
  { id: "q24", text: "¿Cuál ha sido el mejor plan improvisado que han hecho juntos?" },
  { id: "q25", text: "¿Qué es algo que JL dice o hace que te hace acordarte de él al instante?" },
  { id: "q26", text: "¿Cuál ha sido la vez que más lo has visto emocionarse por algo?" },
  { id: "q27", text: "¿Qué apodo o sobrenombre le pondrías si pudieras elegir uno nuevo?" },
  { id: "q28", text: "¿Cuál fue el momento en que sentiste que su amistad/relación se afianzó?" },
  { id: "q29", text: "¿Qué crees que JL estará haciendo dentro de 10 años?" },
  { id: "q30", text: "Si tuvieras que sorprenderlo con algo mañana, ¿qué harías?" },
];
