"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Avatar } from "@/components/Avatar";
import { TriviaBoard } from "@/components/trivia/TriviaBoard";
import { auth } from "@/lib/firebase";
import { ADMIN_EMAIL, CASE_NUMBER } from "@/lib/event-config";
import { setDeclared, subscribeAllRsvps, type RsvpRecord } from "@/lib/rsvp";
import { getQuestionsMap } from "@/lib/questions";
import { setInterrogationStarted, subscribeInterrogation } from "@/lib/interrogation";
import {
  IDLE_GAME,
  subscribeGame,
  subscribeScores,
  type GameState,
  type TriviaScore,
} from "@/lib/trivia";

// "Diego Gonzales Zuta" -> "Diego Gonzales". En la TV el apellido materno
// solo estorba y hace que los nombres largos se corten.
function shortName(fullName: string): string {
  return fullName.trim().split(/\s+/).slice(0, 2).join(" ");
}

function WitnessCard({
  rsvp,
  isNext,
  isAdmin,
  busy,
  onToggleDeclared,
}: {
  rsvp: RsvpRecord;
  isNext: boolean;
  isAdmin: boolean;
  busy: boolean;
  onToggleDeclared: (rsvp: RsvpRecord) => void;
}) {
  const declared = rsvp.declaredAt !== null;

  return (
    <div
      className={`case-card relative flex flex-col items-center gap-3 px-4 py-6 transition-all duration-500 ${
        declared
          ? "opacity-35 grayscale"
          : isNext
            ? "border-amber shadow-[0_0_0_2px_var(--amber)]"
            : ""
      }`}
    >
      {/* Número de turno, sin perderlo pero sin robarle protagonismo a la foto */}
      <span className="absolute left-3 top-3 font-stencil text-2xl leading-none text-amber-bright">
        {rsvp.turn}
      </span>

      {declared && (
        <span className="stamp absolute right-2 top-4 text-red-bright text-[10px]">
          Declaró
        </span>
      )}

      <Avatar photoURL={rsvp.photoURL} name={rsvp.name} size={132} />

      <p className="max-w-full truncate text-center text-xl text-foreground">
        {shortName(rsvp.name)}
      </p>

      {isNext && !declared && (
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-bright">
          Siguiente en declarar
        </span>
      )}

      {isAdmin && (
        <button
          type="button"
          onClick={() => onToggleDeclared(rsvp)}
          disabled={busy}
          className={`mt-1 w-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors disabled:opacity-40 ${
            declared
              ? "border-paper-border text-muted hover:border-amber hover:text-amber-bright"
              : "border-amber text-amber-bright hover:bg-amber hover:text-background"
          }`}
        >
          {declared ? "Deshacer" : "Ya declaró"}
        </button>
      )}
    </div>
  );
}

export default function ProyeccionPage() {
  const [all, setAll] = useState<RsvpRecord[] | null>(null);
  const [error, setError] = useState(false);
  const [game, setGame] = useState<GameState>(IDLE_GAME);
  const [scores, setScores] = useState<TriviaScore[]>([]);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [declareError, setDeclareError] = useState("");
  const [started, setStarted] = useState(false);
  const [questionTextById, setQuestionTextById] = useState<Map<string, string>>(new Map());

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(
    () =>
      subscribeAllRsvps(
        (records) => {
          setAll(records);
          setError(false);
        },
        () => setError(true)
      ),
    []
  );

  useEffect(() => subscribeGame(setGame), []);
  useEffect(() => subscribeScores(setScores), []);
  useEffect(() => subscribeInterrogation(setStarted), []);

  // Texto en vivo de las preguntas: si JL corrige una desde el panel, la
  // proyección lo refleja sin depender de la copia guardada en el rsvp.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const map = await getQuestionsMap();
        if (!cancelled) setQuestionTextById(map);
      } catch {
        // Sin el mapa se usa la copia guardada en cada declaración.
      }
    };
    const timeoutId = setTimeout(run, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [started]);

  const isAdmin = user?.email === ADMIN_EMAIL;

  async function handleToggleDeclared(rsvp: RsvpRecord) {
    setBusyUid(rsvp.id);
    setDeclareError("");
    try {
      await setDeclared(rsvp.id, rsvp.declaredAt === null);
    } catch (err) {
      // El error se muestra solo al admin: un fallo silencioso hacía
      // imposible saber por qué la tarjeta no cambiaba.
      console.error("setDeclared failed", err);
      const code = (err as { code?: string })?.code ?? "";
      setDeclareError(
        code.includes("permission-denied")
          ? "Permiso denegado: falta publicar las reglas actualizadas de Firestore."
          : `No se pudo marcar (${code || "error desconocido"}).`
      );
    } finally {
      setBusyUid(null);
    }
  }

  // Orden descendente: el último en registrarse va primero, porque es quien
  // declara a continuación. Además así queda arriba a la izquierda y se ve en
  // la TV sin tener que scrollear.
  const present = (all ?? [])
    .filter((r) => r.turn !== null)
    .sort((a, b) => (b.turn ?? 0) - (a.turn ?? 0));
  const expected = (all ?? []).filter((r) => r.confirmation === "si").length;

  // El siguiente en declarar es el último registrado que aún no ha declarado.
  const nextUp = present.find((r) => r.declaredAt === null) ?? null;
  const declaredCount = present.filter((r) => r.declaredAt !== null).length;

  // La pregunta del testigo en turno: se resuelve en vivo por id y cae de
  // vuelta a la copia guardada si esa pregunta ya no existe en el banco.
  const nextQuestion = nextUp
    ? ((nextUp.questionId && questionTextById.get(nextUp.questionId)) ??
      nextUp.questionText ??
      null)
    : null;

  const triviaMode = game.status !== "idle";

  return (
    <main className="flex h-screen flex-col overflow-hidden px-8 py-6">
      <header className="flex shrink-0 items-end justify-between gap-6 border-b border-paper-border pb-5">
        <div className="flex items-center gap-4">
          <span className="block h-14 w-1.5 shrink-0 bg-amber" />
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
              Caso N.° {CASE_NUMBER}
            </p>
            <h1 className="mt-1 font-stencil text-4xl text-foreground">
              {triviaMode ? "Interrogatorio" : "Sala de testigos"}
            </h1>
          </div>
        </div>

        {!triviaMode && (
          <div className="flex items-end gap-8 text-right">
            {declaredCount > 0 && (
              <div>
                <p className="font-stencil text-4xl leading-none text-foreground">
                  {declaredCount}
                  <span className="text-xl text-muted">/{present.length}</span>
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  Declararon
                </p>
              </div>
            )}
            <div>
              <p className="font-stencil text-5xl leading-none text-amber-bright">
                {present.length}
                <span className="text-2xl text-muted"> / {expected || "—"}</span>
              </p>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-muted">
                Presentes
              </p>
            </div>
          </div>
        )}
      </header>

      {triviaMode ? (
        <TriviaBoard game={game} scores={scores} />
      ) : (
        <>
          {/* Aviso de a quién le toca: es el punto de la pantalla */}
          {nextUp && (
            <p className="shrink-0 pt-4 text-center text-2xl text-foreground">
              Turno de{" "}
              <span className="text-amber-bright">{shortName(nextUp.name)}</span>
            </p>
          )}
          {!nextUp && present.length > 0 && (
            <p className="shrink-0 py-4 text-center text-2xl text-amber-bright">
              Todos los testigos han declarado.
            </p>
          )}

          {/* Panel de la pregunta: el foco de la pantalla durante el
              interrogatorio. Solo aparece cuando JL lo inicia. */}
          {present.length > 0 && (
            <div className="shrink-0 py-4">
              {started ? (
                nextUp ? (
                  <div className="case-card mx-auto flex min-h-[9rem] max-w-5xl flex-col items-center justify-center gap-3 border-amber px-8 py-7 text-center">
                    <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-amber-bright">
                      Pregunta para el testigo
                    </p>
                    <p className="text-3xl leading-snug text-foreground lg:text-4xl">
                      &ldquo;{nextQuestion ?? "Sin pregunta asignada"}&rdquo;
                    </p>
                  </div>
                ) : (
                  <div className="case-card mx-auto flex min-h-[9rem] max-w-5xl items-center justify-center px-8 py-7">
                    <span className="stamp text-amber-bright text-base">
                      Interrogatorio concluido
                    </span>
                  </div>
                )
              ) : (
                <div className="mx-auto flex min-h-[9rem] max-w-5xl flex-col items-center justify-center gap-4">
                  <span className="stamp text-red-bright text-sm">Expediente sellado</span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setInterrogationStarted(true)}
                      className="border border-amber bg-amber px-8 py-3 font-mono text-sm uppercase tracking-widest text-background transition-opacity hover:opacity-90"
                    >
                      Iniciar interrogatorio
                    </button>
                  )}
                </div>
              )}

              {isAdmin && started && (
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setInterrogationStarted(false)}
                    className="font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-amber-bright"
                  >
                    Ocultar preguntas
                  </button>
                </div>
              )}
            </div>
          )}

          {isAdmin && declareError && (
            <p className="mx-auto mb-3 shrink-0 border border-red-bright bg-red-bright/10 px-4 py-2 text-center text-sm text-red-bright">
              {declareError}
            </p>
          )}

          {all === null && !error && (
            <p className="mt-16 text-center text-lg text-muted">
              Conectando con el expediente...
            </p>
          )}

          {error && (
            <p className="mx-auto mt-16 max-w-md text-center text-lg text-muted">
              Sin acceso al expediente todavía. Inicia sesión como investigador en{" "}
              <span className="text-amber-bright">/admin</span> o espera a la hora del caso.
            </p>
          )}

          {all !== null && present.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <span className="stamp text-red-bright text-sm">Sala vacía</span>
              <p className="text-lg text-muted">Esperando al primer testigo...</p>
            </div>
          )}

          {present.length > 0 && (
            <div className="min-h-0 flex-1 overflow-y-auto pb-4">
              <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {present.map((r) => (
                  <WitnessCard
                    key={r.id}
                    rsvp={r}
                    isNext={nextUp?.id === r.id}
                    isAdmin={isAdmin}
                    busy={busyUid === r.id}
                    onToggleDeclared={handleToggleDeclared}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <footer className="shrink-0 pt-4 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted">
        {triviaMode
          ? "Responde desde tu celular en /interrogatorio"
          : "El último en llegar es el siguiente en declarar"}
      </footer>
    </main>
  );
}
