"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { CASE_NUMBER } from "@/lib/event-config";
import { subscribeAllRsvps, type RsvpRecord } from "@/lib/rsvp";

export default function ProyeccionPage() {
  const [all, setAll] = useState<RsvpRecord[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(
    () =>
      subscribeAllRsvps(
        (records) => {
          setAll(records);
          setError(false);
        },
        () => setError(true)
      ),
    []
  );

  const present = (all ?? [])
    .filter((r) => r.turn !== null)
    .sort((a, b) => (a.turn ?? 0) - (b.turn ?? 0));
  const expected = (all ?? []).filter((r) => r.confirmation === "si").length;

  return (
    <main className="flex flex-1 flex-col px-8 py-8">
      <header className="flex items-end justify-between gap-6 border-b border-paper-border pb-6">
        <div className="flex items-center gap-4">
          <span className="block h-14 w-1.5 shrink-0 bg-amber" />
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
              Caso N.° {CASE_NUMBER}
            </p>
            <h1 className="mt-1 font-stencil text-4xl text-foreground">Sala de testigos</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="font-stencil text-5xl leading-none text-amber-bright">
            {present.length}
            <span className="text-2xl text-muted"> / {expected || "—"}</span>
          </p>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Presentes
          </p>
        </div>
      </header>

      {all === null && !error && (
        <p className="mt-16 text-center text-lg text-muted">Conectando con el expediente...</p>
      )}

      {error && (
        <p className="mx-auto mt-16 max-w-md text-center text-lg text-muted">
          Sin acceso al expediente todavía. Inicia sesión como investigador en{" "}
          <span className="text-amber-bright">/admin</span> o espera a la hora del caso.
        </p>
      )}

      {all !== null && present.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <span className="stamp text-red-bright text-sm">Sala vacía</span>
          <p className="text-lg text-muted">Esperando al primer testigo...</p>
        </div>
      )}

      {present.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {present.map((r) => (
            <div key={r.id} className="case-card flex items-center gap-4 px-5 py-4">
              <span className="font-stencil text-3xl leading-none text-amber-bright">
                {r.turn}
              </span>
              <Avatar photoURL={r.photoURL} name={r.name} size={48} />
              <p className="min-w-0 flex-1 truncate text-lg text-foreground">{r.name}</p>
            </div>
          ))}
        </div>
      )}

      <footer className="mt-auto pt-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted">
        Declaran en el orden de llegada
      </footer>
    </main>
  );
}
