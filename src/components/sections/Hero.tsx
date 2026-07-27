import { CaseStamp } from "@/components/CaseStamp";
import { Countdown } from "@/components/Countdown";
import { CASE_NUMBER, HONOREE_NAME } from "@/lib/event-config";

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <CaseStamp variant="red">Confidencial</CaseStamp>
        <CaseStamp variant="amber">Acceso restringido</CaseStamp>
      </div>

      <div className="space-y-3">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted">
          Caso N.° {CASE_NUMBER}
        </p>
        <h1 className="font-stencil text-4xl leading-tight text-foreground sm:text-6xl">
          Expediente {HONOREE_NAME}
        </h1>
        <p className="mx-auto max-w-sm text-balance text-sm text-muted sm:text-base">
          Se solicita tu presencia como testigo. La investigación comienza en:
        </p>
      </div>

      <div className="w-full max-w-sm">
        <Countdown />
      </div>

      <a
        href="#hechos"
        className="group inline-flex items-center gap-2 rounded-sm border border-amber px-6 py-3 font-mono text-sm uppercase tracking-widest text-amber-bright transition-colors hover:bg-amber hover:text-background"
      >
        Acceder al expediente
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </a>
    </section>
  );
}
