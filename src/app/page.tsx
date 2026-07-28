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
      <nav className="sticky top-0 z-10 border-b border-paper-border bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-lg px-4 py-3 text-xs">
          <span className="font-mono uppercase tracking-widest text-muted">
            Caso {CASE_NUMBER}
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TABS.map((tab) => (
              <a
                key={tab.href}
                href={tab.href}
                className="whitespace-nowrap border border-paper-border px-3 py-1.5 uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber-bright"
              >
                {tab.label}
              </a>
            ))}
            <Link
              href="/admin"
              className="whitespace-nowrap border border-paper-border px-3 py-1.5 uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber-bright"
            >
              Admin
            </Link>
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
