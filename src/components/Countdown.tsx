"use client";

import { useEffect, useState } from "react";
import { EVENT_DATE } from "@/lib/event-config";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
};

function computeRemaining(): Remaining {
  const diff = EVENT_DATE.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isPast: false,
  };
}

export function Countdown() {
  // null hasta el primer efecto en cliente: evita mismatch de hidratación
  // entre el momento del render en servidor y el del cliente.
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(computeRemaining());
    // setTimeout(0) difiere la primera actualización a una tarea async,
    // en vez de llamar setState de forma síncrona dentro del efecto.
    const timeoutId = setTimeout(tick, 0);
    const intervalId = setInterval(tick, 1000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  if (remaining?.isPast) {
    return <p className="stamp text-red-bright text-sm">El caso ya está en curso</p>;
  }

  const units = [
    { label: "Días", value: remaining?.days },
    { label: "Horas", value: remaining?.hours },
    { label: "Min", value: remaining?.minutes },
    { label: "Seg", value: remaining?.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 text-center" role="timer" aria-live="polite">
      {units.map((u) => (
        <div key={u.label} className="case-card px-3 py-4">
          <div className="font-mono text-2xl tabular-nums text-amber-bright">
            {u.value === undefined ? "--" : String(u.value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-xs uppercase tracking-widest text-muted">{u.label}</div>
        </div>
      ))}
    </div>
  );
}
