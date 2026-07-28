"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, signInWithGoogle, signOutUser } from "@/lib/firebase";
import { ADMIN_EMAIL } from "@/lib/event-config";
import {
  getMyRsvp,
  rerollQuestion,
  submitRsvp,
  type Confirmation,
  type RsvpRecord,
} from "@/lib/rsvp";
import { getQuestionText } from "@/lib/questions";

// Resuelve el rsvp con el texto de la pregunta en vivo (por id) en vez de la
// copia congelada, para que una corrección posterior en el banco se refleje
// también aquí. Si la pregunta ya no existe, cae de vuelta a la copia.
async function resolveMyRsvp(uid: string): Promise<RsvpRecord | null> {
  const record = await getMyRsvp(uid);
  if (!record?.questionId) return record;
  const liveText = await getQuestionText(record.questionId);
  return liveText ? { ...record, questionText: liveText } : record;
}

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
  const [rerolling, setRerolling] = useState(false);
  const [rerollNotice, setRerollNotice] = useState("");

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
      const record = await resolveMyRsvp(guestUser.uid);
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
    } catch (err) {
      console.error("signInWithGoogle failed", err);
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
      setMyRsvp(await resolveMyRsvp(guestUser.uid));
    } catch {
      setError("No se pudo registrar tu declaración. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReroll() {
    if (!guestUser) return;
    setRerolling(true);
    setError("");
    setRerollNotice("");
    try {
      const assigned = await rerollQuestion();
      if (!assigned) {
        setRerollNotice("No hay más preguntas libres en el banco — te quedas con esta.");
        return;
      }
      setMyRsvp(await resolveMyRsvp(guestUser.uid));
    } catch {
      setError("No se pudo cambiar la pregunta. Intenta de nuevo.");
    } finally {
      setRerolling(false);
    }
  }

  let body: React.ReactNode;

  if (guestUser === undefined) {
    body = <p className="text-sm text-muted">Verificando sesión...</p>;
  } else if (guestUser === null) {
    body = (
      <div className="case-card px-6 py-8 text-center">
        <span className="stamp text-red-bright text-xs">Identificación requerida</span>

        <p className="mt-8 text-base text-foreground">
          Todo testigo debe identificarse antes de declarar.
        </p>

        <p className="mt-3 text-sm text-muted">
          Al confirmar tu asistencia, el expediente te asigna{" "}
          <span className="text-amber-bright">una pregunta secreta</span> — esa es tu parte en
          el interrogatorio grupal del día del caso.
        </p>

        <div className="mt-6 border-2 border-red-bright bg-red-bright/10 px-4 py-3 text-left">
          <p className="text-sm text-foreground">
            <strong>Importante:</strong> si no confirmas, no se te asigna pregunta y quedas
            fuera del interrogatorio. Sin declaración no hay caso.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={signingIn}
          className="mt-6 w-full border border-amber bg-amber py-3 font-mono text-sm uppercase tracking-widest text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {signingIn ? "Conectando..." : "Identificarme y declarar"}
        </button>

        <p className="mt-3 text-xs text-muted">
          Solo se usa tu cuenta de Google para saber quién declara. Nada más.
        </p>

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
            {!envelopeOpen && (
              <p className="mb-4 text-sm text-foreground">
                Tienes una pregunta secreta para el interrogatorio grupal.
                <br />
                <span className="text-amber-bright">Toca el sobre para abrirlo 👇</span>
              </p>
            )}
            <button
              type="button"
              onClick={() => setEnvelopeOpen(true)}
              className={`group relative mx-auto flex h-28 w-44 items-center justify-center border-2 border-dashed border-amber transition-opacity ${
                envelopeOpen ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
              aria-label="Toca para abrir el sobre sellado y revelar tu pregunta"
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

              <button
                type="button"
                onClick={handleReroll}
                disabled={rerolling}
                className="mt-4 border border-paper-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-amber hover:text-amber-bright disabled:cursor-not-allowed disabled:opacity-40"
              >
                {rerolling ? "Reasignando..." : "Cambiar mi testimonio"}
              </button>
              <p className="mt-2 text-xs text-muted">
                ¿No te convence? Te damos otra del expediente.
              </p>
              {rerollNotice && (
                <p className="mt-2 text-xs text-amber-bright">{rerollNotice}</p>
              )}
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
          {guestUser
            ? "Toda declaración queda archivada en el expediente. Puedes actualizarla cuando quieras."
            : "Este es el paso obligatorio del expediente: sin tu registro, no hay pregunta asignada ni lugar en el interrogatorio."}
        </p>
        <div className="mt-8">{body}</div>
      </div>
    </section>
  );
}
