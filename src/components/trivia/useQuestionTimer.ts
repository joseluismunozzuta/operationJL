"use client";

import { useEffect, useState } from "react";
import type { Timestamp } from "firebase/firestore";

// Segundos restantes de la pregunta actual. El display se calcula con el reloj
// local (puede desviarse un segundo), pero el puntaje real se computa en el
// admin con timestamps del servidor — el reloj del jugador no afecta la
// justicia del juego.
export function useQuestionTimer(
  startedAt: Timestamp | null,
  deadlineSeconds: number
): number | null {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    // Todo el trabajo va dentro del callback diferido: nunca se llama setState
    // de forma síncrona durante la ejecución del efecto.
    const tick = () => {
      if (!startedAt) {
        setRemaining(null);
        return;
      }
      const endMs = startedAt.toMillis() + deadlineSeconds * 1000;
      setRemaining(Math.max(0, Math.ceil((endMs - Date.now()) / 1000)));
    };
    const timeoutId = setTimeout(tick, 0);
    const intervalId = setInterval(tick, 250);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [startedAt, deadlineSeconds]);

  return remaining;
}
