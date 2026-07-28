const NOTES = [
  { label: "Código de vestimenta", value: "Colores neutros." },
  { label: "Qué llevar", value: "Tu mejor testimonio y algo de hambre." },
  { label: "Puntualidad", value: "Se recomienda llegar antes de la hora — los testigos tardíos serán interrogados primero." },
];

export function Notes() {
  return (
    <section id="notas" className="scroll-mt-20 px-6 py-20">
      <div className="mx-auto max-w-lg">
        <h2 className="font-stencil text-2xl text-amber-bright">Notas del caso</h2>
        <p className="mt-2 text-sm text-muted">Detalles logísticos anexos al expediente.</p>

        <dl className="case-card mt-8 divide-y divide-paper-border">
          {NOTES.map((note) => (
            <div key={note.label} className="flex flex-col gap-1 px-5 py-4">
              <dt className="font-mono text-xs uppercase tracking-widest text-muted">
                {note.label}
              </dt>
              <dd className="text-sm text-foreground">{note.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
