export function CaseLoader({ label }: { label: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-24 text-center">
      {/* Carpeta con el sello girando: puro CSS, sin dependencias */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-paper-border border-t-amber" />
        <span className="text-xl">🗂️</span>
      </div>

      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber-bright">{label}</p>

      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1 w-1 animate-pulse rounded-full bg-muted"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </main>
  );
}
