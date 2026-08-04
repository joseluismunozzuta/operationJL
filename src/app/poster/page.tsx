"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CASE_NUMBER } from "@/lib/event-config";

// Afiche A4 para la puerta: se imprime desde el navegador (Ctrl+P).
// El QR apunta siempre a /ingreso del sitio en producción, sin importar desde
// dónde se abra esta página (localhost incluido).
const INGRESO_URL = "https://operationjl.netlify.app/ingreso";

export default function PosterPage() {
  const [qr, setQr] = useState<string | null>(null);
  const [target, setTarget] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const url = INGRESO_URL;
      const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 720,
        color: { dark: "#0b0b0d", light: "#f0ebdd" },
      });
      if (!cancelled) {
        setQr(dataUrl);
        setTarget(url);
      }
    };
    const timeoutId = setTimeout(run, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <main className="poster-root paper-texture">
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          html, body { background: #0b0b0d !important; }
          .poster-root { width: 210mm; height: 297mm; }
          .no-print { display: none !important; }
        }
        .poster-root {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #0b0b0d;
          color: #f0ebdd;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 18mm 16mm;
          position: relative;
          overflow: hidden;
        }
      `}</style>

      {/* Aviso solo en pantalla */}
      <p className="no-print mb-6 border border-paper-border px-4 py-2 text-center font-mono text-xs uppercase tracking-widest text-muted">
        Imprime con Ctrl+P — tamaño A4, márgenes &ldquo;Ninguno&rdquo;, fondo activado
      </p>

      {/* Cabecera */}
      <div className="flex w-full items-start justify-between">
        <div className="stamp text-red-bright text-sm">Confidencial</div>
        <div className="stamp text-amber-bright text-sm">Solo testigos</div>
      </div>

      <p className="mt-10 font-mono text-sm uppercase tracking-[0.5em] text-muted">
        Caso N.° {CASE_NUMBER}
      </p>
      <h1 className="mt-3 text-center font-stencil text-6xl leading-none text-foreground">
        Expediente JL
      </h1>
      <p className="mt-4 text-center font-mono text-base uppercase tracking-[0.3em] text-amber-bright">
        Registro de ingreso
      </p>

      {/* QR central */}
      <div className="mt-10 border-4 border-amber p-4">
        <div className="border border-paper-border bg-[#f0ebdd] p-3">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={`QR hacia ${target}`} className="h-[88mm] w-[88mm]" />
          ) : (
            <div className="flex h-[88mm] w-[88mm] items-center justify-center text-sm text-[#0b0b0d]">
              Generando QR...
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 max-w-[150mm] text-center text-2xl leading-snug text-foreground">
        Todo testigo debe registrar su ingreso antes de pasar.
      </p>
      <p className="mt-4 max-w-[150mm] text-center text-lg leading-snug text-muted">
        Escanea el código, identifícate y recibirás tu número de turno para declarar. Sin
        registro no hay declaración; sin declaración no hay caso.
      </p>

      {/* Pie */}
      <div className="mt-auto w-full border-t border-paper-border pt-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
          El sujeto del expediente los espera adentro
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted/70">
          Documento clasificado — Caso {CASE_NUMBER} — Distribución restringida
        </p>
      </div>
    </main>
  );
}
