import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Estado del interrogatorio de testigos (el de las preguntas personales, no
// el trivia). Vive en Firestore y no en el componente porque la proyección
// corre en la TV mientras JL la controla desde su celular: son navegadores
// distintos y deben ver lo mismo.
const REF = () => doc(db, "counters", "interrogation");

export function subscribeInterrogation(
  callback: (started: boolean) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    REF(),
    (snap) => callback((snap.data()?.started as boolean) ?? false),
    (err) => onError?.(err)
  );
}

export async function setInterrogationStarted(started: boolean) {
  await setDoc(REF(), { started }, { merge: true });
}
