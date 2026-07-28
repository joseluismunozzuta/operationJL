"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, signInWithGoogle } from "@/lib/firebase";
import { ADMIN_EMAIL } from "@/lib/event-config";
import {
  getAllQuestions,
  IDLE_GAME,
  openQuestion,
  resetGame,
  seedTrivia,
  setGameStatus,
  subscribeGame,
  subscribeResponsesFor,
  subscribeScores,
  type GameState,
  type TriviaQuestion,
  type TriviaScore,
} from "@/lib/trivia";
import { gradeQuestion } from "@/lib/trivia-scoring";
import { optionStyle } from "@/components/trivia/options";
import { useQuestionTimer } from "@/components/trivia/useQuestionTimer";
import { Avatar } from "@/components/Avatar";

export default function AdminTriviaPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [game, setGame] = useState<GameState>(IDLE_GAME);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [scores, setScores] = useState<TriviaScore[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const isAdmin = user?.email === ADMIN_EMAIL;
  const remaining = useQuestionTimer(game.questionStartedAt, game.deadlineSeconds);

  useEffect(() => {
    if (!isAdmin) return;
    return subscribeGame(setGame);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    return subscribeScores(setScores);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const run = async () => {
      const list = await getAllQuestions();
      if (!cancelled) setQuestions(list);
    };
    const timeoutId = setTimeout(run, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isAdmin, game.status]);

  // Conteo en vivo de cuántos respondieron la pregunta abierta.
  useEffect(() => {
    if (!isAdmin || !game.currentQuestionId) return;
    return subscribeResponsesFor(game.currentQuestionId, (list) =>
      setAnsweredCount(list.length)
    );
  }, [isAdmin, game.currentQuestionId]);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true);
    setStatus("");
    try {
      await fn();
    } catch (err) {
      console.error(label, err);
      setStatus(`Falló: ${label}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleSeed() {
    await run("sembrar el banco", async () => {
      const res = await seedTrivia();
      setStatus(
        res.seeded > 0
          ? `Se sembraron ${res.seeded} preguntas.`
          : `Ya había ${res.alreadyExisted} preguntas — no se duplicó nada.`
      );
      setQuestions(await getAllQuestions());
    });
  }

  async function handleOpen(index: number) {
    const question = questions[index];
    if (!question) return;
    await run("abrir la pregunta", () =>
      openQuestion(question, index, questions.length)
    );
  }

  async function handleGrade() {
    if (!game.currentQuestionId || !game.questionStartedAt) return;
    await run("calificar", async () => {
      const summary = await gradeQuestion(
        game.currentQuestionId!,
        game.deadlineSeconds,
        game.optionCount,
        game.questionStartedAt!
      );
      setStatus(
        `Calificado: ${summary.correct}/${summary.answered} acertaron` +
          (summary.soloBonusFor ? ` · ¡${summary.soloBonusFor} fue el único, x2!` : "")
      );
    });
  }

  if (user === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24 text-sm text-muted">
        Verificando credenciales...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <span className="stamp text-red-bright text-xs">Acceso restringido</span>
        <h1 className="font-stencil text-2xl text-foreground">Control del interrogatorio</h1>
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="border border-amber px-6 py-3 font-mono text-sm uppercase tracking-widest text-amber-bright transition-colors hover:bg-amber hover:text-background"
        >
          Iniciar sesión con Google
        </button>
        <Link
          href="/admin"
          className="font-mono text-xs uppercase tracking-widest text-muted hover:text-amber-bright"
        >
          ← Panel del investigador
        </Link>
      </main>
    );
  }

  const current = questions[game.currentIndex];
  const isOpen = game.status === "question";
  const timeUp = remaining !== null && remaining <= 0;

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-stencil text-2xl text-amber-bright">
              Control del interrogatorio
            </h1>
            <p className="text-sm text-muted">
              Estado: <span className="text-foreground">{game.status}</span> ·{" "}
              {questions.length} preguntas en el banco
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/proyeccion"
              target="_blank"
              className="border border-amber px-4 py-2 font-mono text-xs uppercase tracking-widest text-amber-bright transition-colors hover:bg-amber hover:text-background"
            >
              Abrir proyección ↗
            </Link>
            <Link
              href="/admin"
              className="border border-paper-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-amber hover:text-amber-bright"
            >
              ← Panel
            </Link>
          </div>
        </div>

        {status && <p className="case-card px-4 py-3 text-sm text-amber-bright">{status}</p>}

        {questions.length === 0 && (
          <div className="case-card px-5 py-6 text-center">
            <p className="text-sm text-muted">
              El banco está vacío. Siembra las preguntas para empezar.
            </p>
            <button
              type="button"
              onClick={handleSeed}
              disabled={busy}
              className="mt-4 border border-amber px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-amber-bright transition-colors hover:bg-amber hover:text-background disabled:opacity-40"
            >
              Sembrar banco
            </button>
          </div>
        )}

        {/* Pregunta en curso */}
        {questions.length > 0 && (
          <div className="case-card px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Pregunta {game.currentIndex + 1} de {questions.length}
              </p>
              {isOpen && (
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-foreground">
                    {answeredCount} respondieron
                  </span>
                  <span
                    className={`font-stencil text-3xl leading-none ${
                      timeUp ? "text-red-bright" : "text-amber-bright"
                    }`}
                  >
                    {remaining ?? "--"}
                  </span>
                </div>
              )}
            </div>

            {current && (
              <>
                <p className="mt-4 text-lg text-foreground">{current.text}</p>
                <ul className="mt-3 space-y-1.5">
                  {current.options.map((opt, i) => {
                    const style = optionStyle(i);
                    const isCorrect =
                      game.status === "results" && game.lastResult?.correctIndex === i;
                    return (
                      <li
                        key={i}
                        className={`flex items-center gap-3 border px-3 py-2 text-sm ${
                          isCorrect
                            ? "border-amber bg-amber/10 text-foreground"
                            : "border-paper-border text-muted"
                        }`}
                      >
                        <span className={`text-lg ${style.text}`}>{style.shape}</span>
                        <span className="flex-1">{opt}</span>
                        {game.status === "results" && (
                          <span className="font-mono text-xs">
                            {game.lastResult?.counts[i] ?? 0}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {!isOpen && (
                <button
                  type="button"
                  onClick={() => handleOpen(game.currentIndex)}
                  disabled={busy || !current}
                  className="border border-amber bg-amber px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Abrir pregunta {game.currentIndex + 1}
                </button>
              )}

              {isOpen && (
                <button
                  type="button"
                  onClick={handleGrade}
                  disabled={busy}
                  className="border border-amber bg-amber px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Cerrar y calificar
                </button>
              )}

              {game.status === "results" && game.currentIndex + 1 < questions.length && (
                <button
                  type="button"
                  onClick={() => handleOpen(game.currentIndex + 1)}
                  disabled={busy}
                  className="border border-amber px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-amber-bright transition-colors hover:bg-amber hover:text-background disabled:opacity-40"
                >
                  Siguiente pregunta →
                </button>
              )}

              {game.status === "results" && (
                <button
                  type="button"
                  onClick={() => run("cerrar el caso", () => setGameStatus("finished"))}
                  disabled={busy}
                  className="border border-paper-border px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-amber hover:text-amber-bright disabled:opacity-40"
                >
                  Terminar juego
                </button>
              )}
            </div>
          </div>
        )}

        {/* Marcador */}
        {scores.length > 0 && (
          <div className="case-card divide-y divide-paper-border">
            {scores.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 font-stencil text-lg text-amber-bright">{i + 1}</span>
                <Avatar photoURL={s.photoURL} name={s.name} size={28} />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{s.name}</span>
                {s.streak > 1 && (
                  <span className="font-mono text-xs text-amber-bright">🔥{s.streak}</span>
                )}
                <span className="font-mono text-sm text-amber-bright">{s.totalPoints}</span>
              </div>
            ))}
          </div>
        )}

        {/* Zona de riesgo */}
        <div className="case-card px-5 py-4">
          <p className="text-xs text-muted">
            Reiniciar borra todas las respuestas y puntajes, pero conserva el banco de
            preguntas. Úsalo si haces una partida de prueba antes del evento.
          </p>
          <button
            type="button"
            onClick={() =>
              run("reiniciar", async () => {
                await resetGame();
                setStatus("Juego reiniciado: respuestas y puntajes borrados.");
              })
            }
            disabled={busy}
            className="mt-3 border border-paper-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-red-bright hover:text-red-bright disabled:opacity-40"
          >
            Reiniciar juego
          </button>
        </div>
      </div>
    </main>
  );
}
