import { KAHOOT_URL } from "@/lib/event-config";

export function Kahoot() {
  return (
    <section id="interrogatorio" className="scroll-mt-20 px-6 py-20">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="font-stencil text-2xl text-amber-bright">Interrogatorio grupal</h2>
        <p className="mt-2 text-sm text-muted">
          Al final de la reunión, se someterá a los testigos a un cuestionario colectivo.
          Nadie sale ileso.
        </p>

        <div className="case-card mt-8 flex flex-col items-center gap-4 px-6 py-10">
          {KAHOOT_URL ? (
            <a
              href={KAHOOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-amber px-6 py-3 font-mono text-sm uppercase tracking-widest text-amber-bright transition-colors hover:bg-amber hover:text-background"
            >
              Unirse al Kahoot
            </a>
          ) : (
            <>
              <span className="stamp text-red-bright text-xs">Se revela el día del caso</span>
              <p className="text-sm text-muted">
                El link y el PIN aparecerán aquí mismo el 5 de agosto.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
