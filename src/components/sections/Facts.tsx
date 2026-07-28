import { EVENT_ADDRESS, EVENT_DATE, EVENT_MAPS_URL } from "@/lib/event-config";

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Lima",
});

const timeFormatter = new Intl.DateTimeFormat("es-PE", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "America/Lima",
});

export function Facts() {
  const formattedDate = dateFormatter.format(EVENT_DATE);
  const formattedTime = timeFormatter.format(EVENT_DATE);

  return (
    <section id="citacion" className="scroll-mt-20 px-6 py-20">
      <div className="mx-auto max-w-lg">
        <h2 className="font-stencil text-2xl text-amber-bright">La citación</h2>
        <p className="mt-2 text-sm text-muted">
          Estos son los datos de tu citación: fecha, hora y lugar donde debes presentarte a
          declarar. Sin excusas.
        </p>

        <dl className="case-card mt-8 divide-y divide-paper-border">
          <div className="flex flex-col gap-1 px-5 py-4">
            <dt className="font-mono text-xs uppercase tracking-widest text-muted">Fecha</dt>
            <dd className="capitalize text-foreground">{formattedDate}</dd>
          </div>
          <div className="flex flex-col gap-1 px-5 py-4">
            <dt className="font-mono text-xs uppercase tracking-widest text-muted">Hora</dt>
            <dd className="text-foreground">{formattedTime}</dd>
          </div>
          <div className="flex flex-col gap-1 px-5 py-4">
            <dt className="font-mono text-xs uppercase tracking-widest text-muted">Ubicación</dt>
            <dd className="text-foreground">{EVENT_ADDRESS}</dd>
            <a
              href={EVENT_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex w-fit items-center gap-1 text-sm text-amber-bright underline underline-offset-4"
            >
              Ver en Google Maps →
            </a>
          </div>
        </dl>
      </div>
    </section>
  );
}
