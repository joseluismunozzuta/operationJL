"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, signInWithGoogle, signOutUser } from "@/lib/firebase";
import { ADMIN_EMAIL } from "@/lib/event-config";
import { getMyRsvp, submitRsvp, type Confirmation, type RsvpRecord } from "@/lib/rsvp";

const OPTIONS: { value: Confirmation; label: string }[] = [
  { value: "si", label: "Sí, allí estaré" },
  { value: "no", label: "No podré" },
];

export function RsvpForm() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [myRsvp, setMyRsvp] = useState<RsvpRecord | null | undefined>(undefined);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [envelopeOpen, setEnvelopeOpen] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Este flujo es solo para cuentas de Google. Si quedó una sesión anónima
  // vieja (de antes de este cambio) persistida en el navegador, se trata
  // como "sin sesión" — no es una cuenta válida para el nuevo esquema.
  const guestUser = user && !user.isAnonymous ? user : user === undefined ? undefined : null;

  useEffect(() => {
    // Deferido a una tarea async: evita llamar setState de forma síncrona
    // dentro del cuerpo del efecto.
    let cancelled = false;
    const run = async () => {
      if (!guestUser) {
        if (!cancelled) setMyRsvp(null);
        return;
      }
      const record = await getMyRsvp(guestUser.uid);
      if (cancelled) return;
      setMyRsvp(record);
      setConfirmation(record?.confirmation ?? null);
    };
    const timeoutId = setTimeout(run, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [guestUser]);

  async function handleSignIn() {
    setError("");
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
    } finally {
      setSigningIn(false);
    }
  }

  async function handleSubmit() {
    if (!guestUser || !confirmation) return;
    setSubmitting(true);
    setError("");
    setEnvelopeOpen(false);
    try {
      const name = guestUser.displayName || guestUser.email || "Testigo";
      await submitRsvp(name, confirmation);
      setMyRsvp(await getMyRsvp(guestUser.uid));
    } catch {
      setError("No se pudo registrar tu declaración. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  let body: React.ReactNode;

  if (guestUser === undefined) {
    body = <p className="text-sm text-muted">Verificando sesión...</p>;
  } else if (guestUser === null) {
    body = (
      <div className="case-card px-6 py-10 text-center">
        <p className="text-sm text-muted">
          Inicia sesión con Google para dejar constancia de tu asistencia.
        </p>
        <button
          type="button"
          onClick={handleSignIn}
          disabled={signingIn}
          className="mt-6 border border-amber px-6 py-3 font-mono text-sm uppercase tracking-widest text-amber-bright transition-colors hover:bg-amber hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          {signingIn ? "Conectando..." : "Iniciar sesión con Google"}
        </button>
        {error && <p className="mt-4 text-sm text-red-bright">{error}</p>}
      </div>
    );
  } else if (guestUser.email === ADMIN_EMAIL) {
    body = (
      <div className="case-card px-6 py-10 text-center">
        <span className="stamp text-amber-bright text-xs">Sujeto del expediente</span>
        <p className="mt-6 text-sm text-muted">
          Eres JL — no necesitas testificar en tu propio caso. Revisa el panel del investigador
          para ver quién más ha declarado.
        </p>
        <button
          type="button"
          onClick={() => signOutUser()}
          className="mt-4 text-xs text-muted underline underline-offset-4 hover:text-amber-bright"
        >
          Cerrar sesión
        </button>
      </div>
    );
  } else {
    body = (
      <div className="case-card px-6 py-8">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-xs text-muted">Sesión: {guestUser.email}</p>
          <button
            type="button"
            onClick={() => signOutUser()}
            className="shrink-0 text-xs text-muted underline underline-offset-4 hover:text-amber-bright"
          >
            Cerrar sesión
          </button>
        </div>

        <fieldset className="mt-6 space-y-2">
          <legend className="font-mono text-xs uppercase tracking-widest text-muted">
            ¿Confirmas tu asistencia?
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setConfirmation(opt.value)}
                className={`border px-3 py-3 text-sm transition-colors ${
                  confirmation === opt.value
                    ? "border-amber bg-amber text-background"
                    : "border-paper-border text-foreground hover:border-amber"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        {error && <p className="mt-4 text-sm text-red-bright">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!confirmation || submitting}
          className="mt-6 w-full border border-amber py-3 font-mono text-sm uppercase tracking-widest text-amber-bright transition-colors hover:bg-amber hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting
            ? "Procesando declaración..."
            : myRsvp
              ? "Actualizar declaración"
              : "Registrar declaración"}
        </button>

        {myRsvp && (
          <p className="mt-3 text-center text-xs text-muted">
            Declaración actual: {myRsvp.confirmation === "si" ? "Sí, allí estaré" : "No podré"}
          </p>
        )}

        {myRsvp?.confirmation === "si" && myRsvp.questionText && (
          <div className="mt-6 border-t border-paper-border pt-6 text-center">
            <button
              type="button"
              onClick={() => setEnvelopeOpen(true)}
              className={`group relative mx-auto flex h-28 w-44 items-center justify-center border-2 border-dashed border-amber transition-opacity ${
                envelopeOpen ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
              aria-label="Abrir sobre sellado con tu pregunta asignada"
            >
              <span className="stamp text-red-bright text-xs">Sellado</span>
            </button>
            <div
              className={`mt-6 origin-top transition-all duration-700 ${
                envelopeOpen
                  ? "scale-100 opacity-100"
                  : "pointer-events-none h-0 scale-95 overflow-hidden opacity-0"
              }`}
            >
              <p className="font-mono text-xs uppercase tracking-widest text-amber-bright">
                Tu pregunta para el interrogatorio
              </p>
              <p className="mt-3 text-lg text-foreground">&ldquo;{myRsvp.questionText}&rdquo;</p>
              <p className="mt-4 text-xs text-muted">
                Guárdala en secreto hasta el día del caso.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section id="registro" className="scroll-mt-20 px-6 py-20">
      <div className="mx-auto max-w-lg">
        <h2 className="font-stencil text-2xl text-amber-bright">Registro de testigo</h2>
        <p className="mt-2 text-sm text-muted">
          Toda declaración queda archivada en el expediente. Puedes actualizarla cuando quieras.
        </p>
        <div className="mt-8">{body}</div>
      </div>
    </section>
  );
}
