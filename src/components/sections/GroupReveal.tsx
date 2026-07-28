"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { EVENT_DATE } from "@/lib/event-config";
import { getRevealedRsvps, type RsvpRecord } from "@/lib/rsvp";
import { getQuestionsMap } from "@/lib/questions";

type Phase = "checking" | "locked" | "loading" | "loaded" | "error";

export function GroupReveal() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [questionTextById, setQuestionTextById] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;

    // Todo el trabajo (incluida la lectura de Date.now(), impura) vive
    // dentro de este callback diferido a una tarea async — nunca se llama
    // setState de forma síncrona durante la ejecución del efecto en sí.
    const run = async () => {
      if (Date.now() < EVENT_DATE.getTime()) {
        if (!cancelled) setPhase("locked");
        return;
      }
      if (!cancelled) setPhase("loading");
      try {
        const [records, questionsMap] = await Promise.all([
          getRevealedRsvps(),
          getQuestionsMap(),
        ]);
        if (!cancelled) {
          setRsvps(records);
          setQuestionTextById(questionsMap);
          setPhase("loaded");
        }
      } catch {
        // Firestore igual rechaza la lectura si aún no llega el instante
        // real del evento (regla basada en request.time), incluso si el
        // reloj del dispositivo estuviera adelantado.
        if (!cancelled) setPhase("error");
      }
    };

    const timeoutId = setTimeout(run, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  const isLocked = phase === "checking" || phase === "locked" || phase === "error";
  const isLoading = phase === "loading";

  return (
    <section id="revelacion" className="scroll-mt-20 px-6 py-20">
      <div className="mx-auto max-w-lg">
        <h2 className="font-stencil text-2xl text-amber-bright">Revelación del expediente</h2>
        <p className="mt-2 text-sm text-muted">
          El día del caso, aquí aparece quién declaró qué.
        </p>

        <div className="case-card mt-8 px-6 py-10 text-center">
          {isLocked && (
            <>
              <span className="stamp text-red-bright text-xs">Sellado hasta el caso</span>
              <p className="mt-4 text-sm text-muted">
                Vuelve el 5 de agosto a las 8:00 PM para ver la lista completa.
              </p>
            </>
          )}

          {isLoading && <p className="text-sm text-muted">Abriendo el expediente...</p>}

          {phase === "loaded" && rsvps.length === 0 && (
            <p className="text-sm text-muted">Aún no hay testigos confirmados.</p>
          )}

          {phase === "loaded" && rsvps.length > 0 && (
            <ul className="divide-y divide-paper-border text-left">
              {rsvps.map((r) => (
                <li key={r.id} className="flex items-start gap-3 py-4">
                  <Avatar photoURL={r.photoURL} name={r.name} size={36} />
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-amber-bright">
                      {r.name}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {(r.questionId && questionTextById.get(r.questionId)) ??
                        r.questionText ??
                        "Sin pregunta asignada"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
