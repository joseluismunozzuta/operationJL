"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IDLE_GAME, subscribeGame, type GameState } from "@/lib/trivia";

export function Kahoot() {
  const [game, setGame] = useState<GameState>(IDLE_GAME);

  useEffect(() => subscribeGame(setGame), []);

  const live = game.status !== "idle";

  return (
    <section id="interrogatorio" className="scroll-mt-20 px-6 py-20">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="font-stencil text-2xl text-amber-bright">Interrogatorio grupal</h2>
        <p className="mt-2 text-sm text-muted">
          Al final de la reunión, se someterá a los testigos a un cuestionario colectivo.
          Nadie sale ileso.
        </p>

        <div className="case-card mt-8 flex flex-col items-center gap-4 px-6 py-10">
          {live ? (
            <>
              <span className="stamp text-amber-bright text-xs">En curso</span>
              <p className="text-sm text-muted">
                El interrogatorio ya comenzó. Entra y responde desde tu celular.
              </p>
              <Link
                href="/interrogatorio"
                className="border border-amber bg-amber px-6 py-3 font-mono text-sm uppercase tracking-widest text-background transition-opacity hover:opacity-90"
              >
                Entrar al interrogatorio →
              </Link>
            </>
          ) : (
            <>
              <span className="stamp text-red-bright text-xs">Se revela el día del caso</span>
              <p className="text-sm text-muted">
                El día del evento, aquí mismo se habilita el acceso para responder desde tu
                celular.
              </p>
              <Link
                href="/interrogatorio"
                className="border border-paper-border px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-amber hover:text-amber-bright"
              >
                Ir a la sala de espera
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
