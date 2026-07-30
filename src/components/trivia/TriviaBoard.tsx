"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { optionStyle } from "@/components/trivia/options";
import { useQuestionTimer } from "@/components/trivia/useQuestionTimer";
import { getQuestion, type GameState, type TriviaQuestion, type TriviaScore } from "@/lib/trivia";

// Carousel de evidencia fotográfica de la pregunta (daisyUI): avanza solo
// cada 1.5 s y al llegar a la última vuelve a la primera (loop infinito).
// Con una sola imagen no hay nada que rotar; sin imágenes no se renderiza
// (el padre lo omite).
function QuestionCarousel({ urls }: { urls: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    trackRef.current?.scrollTo({ left: 0, behavior: "auto" });
    if (urls.length <= 1) return;

    const id = setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      indexRef.current = (indexRef.current + 1) % urls.length;
      track.scrollTo({
        left: indexRef.current * track.clientWidth,
        // El salto de vuelta al inicio va sin animación: un smooth-scroll
        // rebobinando todas las diapositivas se ve mareado en la TV.
        behavior: indexRef.current === 0 ? "auto" : "smooth",
      });
    }, 1500);

    return () => clearInterval(id);
  }, [urls]);

  return (
    <div
      ref={trackRef}
      className="carousel mx-auto h-108 w-full max-w-2xl rounded-2xl shadow-xl shadow-gray-800"
    >
      {urls.map((src, i) => (
        <div key={i} className="carousel-item w-full justify-center bg-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-108 w-full object-contain" />
        </div>
      ))}
    </div>
  );
}

// Tablero del interrogatorio para la TV: la pregunta y las alternativas se
// leen acá, mientras los celulares solo muestran los botones de color.
export function TriviaBoard({ game, scores }: { game: GameState; scores: TriviaScore[] }) {
  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const remaining = useQuestionTimer(game.questionStartedAt, game.deadlineSeconds);

  useEffect(() => {
    const questionId = game.currentQuestionId;
    let cancelled = false;
    const run = async () => {
      if (!questionId) return;
      const q = await getQuestion(questionId);
      if (!cancelled) setQuestion(q);
    };
    const timeoutId = setTimeout(run, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [game.currentQuestionId]);

  if (game.status === "finished") {
    const [first, second, third] = scores;

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-10 py-12">
        <span className="stamp text-amber-bright text-lg">Caso cerrado</span>
        <div className="flex w-full max-w-3xl items-end justify-center gap-6">
          {[second, first, third].map((s, i) => {
            if (!s) return null;
            const place = i === 1 ? 1 : i === 0 ? 2 : 3;
            const height = place === 1 ? "h-48" : place === 2 ? "h-36" : "h-28";
            return (
              <div key={s.id} className="flex flex-1 flex-col items-center gap-3">
                <Avatar photoURL={s.photoURL} name={s.name} size={place === 1 ? 88 : 64} />
                <p className="max-w-full truncate text-center text-xl text-foreground">
                  {s.name}
                </p>
                <div
                  className={`${height} flex w-full flex-col items-center justify-center border border-paper-border bg-paper`}
                >
                  <span className="font-stencil text-5xl text-amber-bright">{place}</span>
                  <span className="mt-2 font-mono text-lg text-foreground">
                    {s.totalPoints}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (game.status === "results" && game.lastResult) {
    const correct = optionStyle(game.lastResult.correctIndex);
    const totalAnswers = game.lastResult.counts.reduce((a, b) => a + b, 0);
    return (
      <div className="flex flex-1 flex-col gap-8 py-8">
        <div className="text-center">
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted">
            Respuesta correcta
          </p>
          <p className={`mt-4 text-7xl ${correct.text}`}>{correct.shape}</p>
          {question && (
            <p className="mt-4 text-3xl text-foreground">
              {question.options[game.lastResult.correctIndex]}
            </p>
          )}
        </div>

        <div className="mx-auto flex w-full max-w-4xl items-end justify-center gap-6">
          {game.lastResult.counts.map((count, i) => {
            const style = optionStyle(i);
            const pct = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <span className="font-mono text-lg text-foreground">{count}</span>
                <div
                  className={`${style.bg} w-full transition-all`}
                  style={{ height: `${Math.max(pct * 1.6, 8)}px` }}
                />
                <span className={`text-2xl ${style.text}`}>{style.shape}</span>
              </div>
            );
          })}
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <p className="text-center font-mono text-xs uppercase tracking-[0.3em] text-muted">
            Marcador
          </p>
          <ul className="mt-4 divide-y divide-paper-border">
            {scores.slice(0, 5).map((s, i) => (
              <li key={s.id} className="flex items-center gap-4 py-3">
                <span className="w-8 font-stencil text-2xl text-amber-bright">{i + 1}</span>
                <Avatar photoURL={s.photoURL} name={s.name} size={40} />
                <span className="min-w-0 flex-1 truncate text-xl text-foreground">{s.name}</span>
                {s.streak > 1 && <span className="text-lg text-amber-bright">🔥{s.streak}</span>}
                <span className="font-mono text-xl text-amber-bright">{s.totalPoints}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (game.status === "question" && question) {
    const timeUp = remaining !== null && remaining <= 0;
    return (
      <div className="flex flex-1 flex-col gap-5 py-8">
        <div className="flex items-center justify-between gap-6">
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted">
            Pregunta {game.currentIndex + 1} / {game.totalQuestions}
          </p>
          <span
            className={`font-stencil text-7xl leading-none ${timeUp ? "text-red-bright" : "text-amber-bright"
              }`}
          >
            {remaining ?? "--"}
          </span>
        </div>

        <h2 className="text-center font-semibold text-4xl leading-tight text-foreground lg:text-5xl">
          {question.text}
        </h2>

        {question.imageUrls.length > 0 && <QuestionCarousel urls={question.imageUrls} />}

        <div className="mt-auto grid grid-cols-2 gap-4">
          {question.options.map((opt, i) => {
            const style = optionStyle(i);
            return (
              <div
                key={i}
                className={`${style.bg} flex items-center gap-4 px-6 py-6 text-background`}
              >
                <span className="text-4xl">{style.shape}</span>
                <span className="text-3xl leading-tight text-white font-bold">{opt}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <span className="stamp text-amber-bright text-sm">Interrogatorio por comenzar</span>
      <p className="text-lg text-muted">Los testigos ya pueden entrar desde su celular.</p>
    </div>
  );
}
