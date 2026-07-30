"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, signInWithGoogle } from "@/lib/firebase";
import { checkIn, type CheckInResult } from "@/lib/checkin";
import { ADMIN_EMAIL, CASE_NUMBER } from "@/lib/event-config";

type Status = "auth" | "checking" | "done" | "error";

export default function IngresoPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [status, setStatus] = useState<Status>("auth");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const guestUser = user && !user.isAnonymous ? user : user === undefined ? undefined : null;
  const isAdmin = guestUser?.email === ADMIN_EMAIL;

  // Apenas hay sesión, se ficha automáticamente: el invitado no debería tener
  // que tocar nada más después de escanear. JL queda excluido: es el sujeto
  // del expediente, no un testigo.
  useEffect(() => {
    if (!guestUser || isAdmin) return;
    let cancelled = false;
    const run = async () => {
      if (!cancelled) setStatus("checking");
      try {
        const res = await checkIn();
        if (!cancelled) {
          setResult(res);
          setStatus("done");
        }
      } catch {
        if (!cancelled) {
          setError("No se pudo registrar tu ingreso. Intenta de nuevo.");
          setStatus("error");
        }
      }
    };
    const timeoutId = setTimeout(run, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [guestUser, isAdmin]);

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

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
          Caso N.° {CASE_NUMBER}
        </p>
        <h1 className="mt-2 font-stencil text-3xl text-foreground">Registro de ingreso</h1>

        {guestUser === undefined && (
          <p className="mt-8 text-sm text-muted">Verificando identidad...</p>
        )}

        {guestUser === null && (
          <div className="case-card mt-8 px-6 py-10">
            <p className="text-sm text-muted">
              Identifícate para dejar constancia de tu llegada al caso.
            </p>
            <button
              type="button"
              onClick={handleSignIn}
              disabled={signingIn}
              className="mt-6 w-full border border-amber px-6 py-3 font-mono text-sm uppercase tracking-widest text-amber-bright transition-colors hover:bg-amber hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              {signingIn ? "Conectando..." : "Iniciar sesión con Google"}
            </button>
            {error && <p className="mt-4 text-sm text-red-bright">{error}</p>}
          </div>
        )}

        {isAdmin && (
          <div className="case-card mt-8 px-6 py-10">
            <span className="stamp text-amber-bright text-xs">Sujeto del expediente</span>
            <p className="mt-8 text-lg text-foreground">Eres JL. Esta puerta no es para ti.</p>
            <p className="mt-3 text-sm text-muted">
              El registro de ingreso es solo para los testigos que llegan a declarar. Tú ya
              estás en el caso.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/proyeccion"
                className="border border-amber px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-amber-bright transition-colors hover:bg-amber hover:text-background"
              >
                Ver quiénes han llegado →
              </Link>
              <Link
                href="/admin"
                className="border border-paper-border px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-amber hover:text-amber-bright"
              >
                Panel del investigador
              </Link>
            </div>
          </div>
        )}

        {guestUser && !isAdmin && status === "checking" && (
          <p className="mt-8 text-sm text-muted">Sellando tu ingreso...</p>
        )}

        {guestUser && !isAdmin && status === "error" && (
          <p className="mt-8 text-sm text-red-bright">{error}</p>
        )}

        {guestUser && !isAdmin && status === "done" && result && (
          <div className="case-card mt-8 px-6 py-10">
            <span className="stamp text-amber-bright text-xs">
              {result.alreadyCheckedIn ? "Ya registrado" : "Presente"}
            </span>

            <p className="mt-8 text-lg text-foreground">Bienvenido, {result.name}.</p>

            <div className="mt-8 border-y border-paper-border py-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                Tu turno para declarar
              </p>
              <p className="mt-2 font-stencil text-6xl leading-none text-amber-bright">
                {result.turn}
              </p>
            </div>

            {result.questionText && (
              <div className="mt-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                  Tu pregunta
                </p>
                <p className="mt-2 text-sm text-foreground">
                  &ldquo;{result.questionText}&rdquo;
                </p>
              </div>
            )}

            <p className="mt-8 text-xs text-muted">
              Se te llamará a declarar en ese orden. Pasa, ponte cómodo.
            </p>
          </div>
        )}

        <Link
          href="/"
          className="mt-8 inline-block font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-amber-bright"
        >
          ← Volver al expediente
        </Link>
      </div>
    </main>
  );
}
