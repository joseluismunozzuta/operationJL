"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, signInWithGoogle } from "@/lib/firebase";
import { CASE_NUMBER } from "@/lib/event-config";
import {
  getMyResponse,
  IDLE_GAME,
  submitAnswer,
  subscribeGame,
  subscribeScores,
  type GameState,
  type TriviaScore,
} from "@/lib/trivia";
import { optionStyle } from "@/components/trivia/options";
import { useQuestionTimer } from "@/components/trivia/useQuestionTimer";
import { Avatar } from "@/components/Avatar";

export default function InterrogatorioPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [game, setGame] = useState<GameState>(IDLE_GAME);
  const [scores, setScores] = useState<TriviaScore[]>([]);
  // Se guarda junto al id de la pregunta: así una respuesta vieja nunca se
  // interpreta como respuesta de la pregunta nueva al cambiar de ronda.
  const [answer, setAnswer] = useState<{ questionId: string; index: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => subscribeGame(setGame), []);
  useEffect(() => subscribeScores(setScores), []);

  const guestUser = user && !user.isAnonymous ? user : user === undefined ? undefined : null;
  const remaining = useQuestionTimer(game.questionStartedAt, game.deadlineSeconds);

  // Recupera la respuesta ya enviada (por si recargó el celular a mitad de la
  // pregunta). Todo diferido para no llamar setState dentro del efecto.
  useEffect(() => {
    const questionId = game.currentQuestionId;
    let cancelled = false;
    const run = async () => {
      if (!questionId || !guestUser) return;
      const existing = await getMyResponse(questionId);
      if (!cancelled && existing) {
        setAnswer({ questionId, index: existing.optionIndex });
      }
    };
    const timeoutId = setTimeout(run, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [game.currentQuestionId, guestUser]);

  async function handleAnswer(index: number) {
    const questionId = game.currentQuestionId;
    if (!questionId || myAnswer !== null) return;
    setSending(true);
    setError("");
    // Optimista: el botón se marca al instante porque el juego es a contrarreloj.
    setAnswer({ questionId, index });
    try {
      await submitAnswer(questionId, index);
    } catch {
      setAnswer(null);
      setError("No se registró tu respuesta. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

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

  // Solo cuenta si corresponde a la pregunta que está en pantalla.
  const myAnswer =
    answer && answer.questionId === game.currentQuestionId ? answer.index : null;
  const answerForResult =
    answer && game.lastResult && answer.questionId === game.lastResult.questionId
      ? answer.index
      : null;

  const myScore = guestUser ? scores.find((s) => s.id === guestUser.uid) : undefined;
  const myPosition = myScore ? scores.findIndex((s) => s.id === guestUser?.uid) + 1 : null;
  const wasCorrect =
    game.lastResult && answerForResult !== null
      ? answerForResult === game.lastResult.correctIndex
      : null;

  let body: React.ReactNode;

  if (guestUser === undefined) {
    body = <p className="text-sm text-muted">Verificando identidad...</p>;
  } else if (guestUser === null) {
    body = (
      <div className="case-card px-6 py-10 text-center">
        <span className="stamp text-red-bright text-xs">Identificación requerida</span>
        <p className="mt-8 text-sm text-muted">
          Identifícate para participar en el interrogatorio y aparecer en el marcador.
        </p>
        <button
          type="button"
          onClick={handleSignIn}
          disabled={signingIn}
          className="mt-6 w-full border border-amber bg-amber py-3 font-mono text-sm uppercase tracking-widest text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {signingIn ? "Conectando..." : "Entrar al interrogatorio"}
        </button>
        {error && <p className="mt-4 text-sm text-red-bright">{error}</p>}
      </div>
    );
  } else if (game.status === "question" && game.currentQuestionId) {
    const closed = remaining !== null && remaining <= 0;
    body = (
      <div>
        <div className="case-card flex items-center justify-between px-5 py-4">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            Pregunta {game.currentIndex + 1} de {game.totalQuestions}
          </span>
          <span
            className={`font-stencil text-3xl leading-none ${
              remaining !== null && remaining <= 5 ? "text-red-bright" : "text-amber-bright"
            }`}
          >
            {remaining ?? "--"}
          </span>
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          {myAnswer !== null
            ? "Respuesta registrada. Mira la pantalla."
            : closed
              ? "Tiempo agotado."
              : "Lee la pregunta en la pantalla y elige aquí 👇"}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {Array.from({ length: game.optionCount }, (_, i) => {
            const style = optionStyle(i);
            const isMine = myAnswer === i;
            const dim = myAnswer !== null && !isMine;
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleAnswer(i)}
                disabled={myAnswer !== null || sending || closed}
                aria-label={`Alternativa ${i + 1}`}
                className={`${style.bg} flex aspect-square items-center justify-center text-5xl text-background transition-all ${
                  dim ? "opacity-25" : "opacity-100"
                } ${isMine ? "ring-4 ring-foreground" : ""} disabled:cursor-not-allowed`}
              >
                {style.shape}
              </button>
            );
          })}
        </div>

        {error && <p className="mt-4 text-center text-sm text-red-bright">{error}</p>}
      </div>
    );
  } else if (game.status === "results" && game.lastResult) {
    const style = optionStyle(game.lastResult.correctIndex);
    body = (
      <div className="case-card px-6 py-8 text-center">
        {answerForResult === null ? (
          <p className="text-lg text-muted">No respondiste esta vez.</p>
        ) : wasCorrect ? (
          <>
            <span className="stamp text-amber-bright text-sm">Correcto</span>
            <p className="mt-6 text-sm text-muted">Buen ojo, testigo.</p>
          </>
        ) : (
          <>
            <span className="stamp text-red-bright text-sm">Incorrecto</span>
            <p className="mt-6 text-sm text-muted">La racha se corta aquí.</p>
          </>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
          <span>Respuesta correcta:</span>
          <span className={`text-2xl ${style.text}`}>{style.shape}</span>
        </div>

        {myScore && (
          <div className="mt-8 border-t border-paper-border pt-6">
            <p className="font-stencil text-4xl leading-none text-amber-bright">
              {myScore.totalPoints}
            </p>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">
              Puntos · Puesto {myPosition} de {scores.length}
            </p>
            {myScore.streak > 1 && (
              <p className="mt-2 text-sm text-amber-bright">
                🔥 Racha de {myScore.streak} aciertos
              </p>
            )}
          </div>
        )}
      </div>
    );
  } else if (game.status === "finished") {
    body = (
      <div className="case-card px-6 py-8 text-center">
        <span className="stamp text-amber-bright text-sm">Caso cerrado</span>
        <p className="mt-6 text-sm text-muted">Veredicto final del interrogatorio</p>
        <ul className="mt-6 divide-y divide-paper-border text-left">
          {scores.slice(0, 5).map((s, i) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <span className="w-6 font-stencil text-xl text-amber-bright">{i + 1}</span>
              <Avatar photoURL={s.photoURL} name={s.name} size={32} />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{s.name}</span>
              <span className="font-mono text-sm text-amber-bright">{s.totalPoints}</span>
            </li>
          ))}
        </ul>
        {myScore && (
          <p className="mt-6 text-sm text-muted">
            Terminaste en el puesto {myPosition} con {myScore.totalPoints} puntos.
          </p>
        )}
      </div>
    );
  } else {
    body = (
      <div className="case-card px-6 py-12 text-center">
        <span className="stamp text-amber-bright text-xs">Sala de espera</span>
        <p className="mt-8 text-sm text-muted">
          El interrogatorio aún no comienza. Deja esta pantalla abierta — arranca solo.
        </p>
        {myScore && (
          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-muted">
            Tus puntos: <span className="text-amber-bright">{myScore.totalPoints}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            Caso N.° {CASE_NUMBER}
          </p>
          <h1 className="mt-2 font-stencil text-2xl text-foreground">Interrogatorio</h1>
        </div>

        <div className="mt-8">{body}</div>

        <Link
          href="/"
          className="mt-8 block text-center font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-amber-bright"
        >
          ← Volver al expediente
        </Link>
      </div>
    </main>
  );
}
