import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { Facts } from "@/components/sections/Facts";
import { RsvpForm } from "@/components/sections/RsvpForm";
import { Gifts } from "@/components/sections/Gifts";
import { Kahoot } from "@/components/sections/Kahoot";
import { Notes } from "@/components/sections/Notes";
import { GroupReveal } from "@/components/sections/GroupReveal";
import { CASE_NUMBER } from "@/lib/event-config";

const TABS = [
  { href: "#citacion", label: "Citación" },
  { href: "#registro", label: "Registro" },
  { href: "#evidencia", label: "Evidencia" },
  { href: "#interrogatorio", label: "Interrogatorio" },
  { href: "#notas", label: "Notas" },
  { href: "#revelacion", label: "Revelación" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <nav className="sticky top-0 z-10 border-b border-paper-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg px-4 py-3">
          {/* Cabecera: número de caso como etiqueta de carpeta */}
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="block h-9 w-1 shrink-0 bg-amber" />
              <span className="leading-none">
                <span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                  Caso N.°
                </span>
                <span className="mt-1 block font-stencil text-xl leading-none tracking-widest text-amber-bright">
                  {CASE_NUMBER}
                </span>
              </span>
            </div>
            <Link
              href="/admin"
              className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-amber-bright"
            >
              Admin ›
            </Link>
          </div>

          {/* Pestañas del expediente */}
          <div className="mt-3 flex flex-wrap gap-1">
            {TABS.map((tab) => (
              <a
                key={tab.href}
                href={tab.href}
                className="whitespace-nowrap border border-paper-border bg-paper/60 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-amber hover:bg-amber hover:text-background"
              >
                {tab.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1 divide-y divide-paper-border">
        <Hero />
        <Facts />
        <RsvpForm />
        <Gifts />
        <Kahoot />
        <Notes />
        <GroupReveal />
      </main>

      <footer className="px-6 py-10 text-center text-xs text-muted">
        Expediente {CASE_NUMBER} — archivado digitalmente. Toda declaración es voluntaria.
      </footer>
    </div>
  );
}
