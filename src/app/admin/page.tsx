"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, signInWithGoogle, signOutUser } from "@/lib/firebase";
import { ADMIN_EMAIL } from "@/lib/event-config";
import { seedQuestions, subscribeAdminRsvps, type RsvpRecord } from "@/lib/rsvp";
import {
  addQuestion,
  deleteQuestion,
  subscribeQuestions,
  type QuestionRecord,
} from "@/lib/questions";
import {
  addWishlistItem,
  deleteWishlistItem,
  subscribeWishlist,
  type WishlistItem,
} from "@/lib/wishlist";

const CONFIRMATION_LABEL: Record<RsvpRecord["confirmation"], string> = {
  si: "Sí",
  no: "No",
};

export default function AdminPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [authError, setAuthError] = useState("");
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [seedStatus, setSeedStatus] = useState<string>("");
  const [seeding, setSeeding] = useState(false);

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishTitle, setWishTitle] = useState("");
  const [wishUrl, setWishUrl] = useState("");
  const [wishImageUrl, setWishImageUrl] = useState("");
  const [addingWish, setAddingWish] = useState(false);
  const [wishError, setWishError] = useState("");

  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return;
    return subscribeAdminRsvps(setRsvps);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    return subscribeWishlist(setWishlist);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    return subscribeQuestions(setQuestions);
  }, [isAdmin]);

  async function handleAddWish(e: FormEvent) {
    e.preventDefault();
    if (!wishTitle.trim() || !wishUrl.trim()) return;

    setAddingWish(true);
    setWishError("");
    try {
      await addWishlistItem(wishTitle, wishUrl, wishImageUrl);
      setWishTitle("");
      setWishUrl("");
      setWishImageUrl("");
    } catch {
      setWishError("No se pudo agregar la evidencia. Intenta de nuevo.");
    } finally {
      setAddingWish(false);
    }
  }

  async function handleDeleteWish(id: string) {
    try {
      await deleteWishlistItem(id);
    } catch {
      setWishError("No se pudo eliminar la evidencia.");
    }
  }

  async function handleLogin() {
    setAuthError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("signInWithGoogle failed", err);
      setAuthError("No se pudo iniciar sesión. Intenta de nuevo.");
    }
  }

  async function handleSeed() {
    setSeeding(true);
    setSeedStatus("");
    try {
      const result = await seedQuestions();
      setSeedStatus(
        result.seeded > 0
          ? `Se sembraron ${result.seeded} preguntas.`
          : `El banco ya tenía ${result.alreadyExisted} preguntas — no se duplicó nada.`
      );
    } catch {
      setSeedStatus("No se pudo sembrar el banco de preguntas.");
    } finally {
      setSeeding(false);
    }
  }

  async function handleAddQuestion(e: FormEvent) {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    setAddingQuestion(true);
    setQuestionError("");
    try {
      await addQuestion(newQuestionText);
      setNewQuestionText("");
    } catch {
      setQuestionError("No se pudo agregar la pregunta. Intenta de nuevo.");
    } finally {
      setAddingQuestion(false);
    }
  }

  async function handleDeleteQuestion(id: string) {
    try {
      await deleteQuestion(id);
    } catch {
      setQuestionError("No se pudo eliminar la pregunta.");
    }
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
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-amber-bright"
        >
          ← Volver al expediente
        </Link>
        <span className="stamp text-red-bright text-xs">Acceso restringido</span>
        <h1 className="font-stencil text-2xl text-foreground">Panel del investigador</h1>
        {user && (
          <p className="max-w-sm text-sm text-muted">
            La cuenta {user.email} no está autorizada para este expediente.
          </p>
        )}
        {authError && <p className="text-sm text-red-bright">{authError}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleLogin}
            className="border border-amber px-6 py-3 font-mono text-sm uppercase tracking-widest text-amber-bright transition-colors hover:bg-amber hover:text-background"
          >
            Iniciar sesión con Google
          </button>
          {user && (
            <button
              type="button"
              onClick={() => signOutUser()}
              className="border border-paper-border px-6 py-3 font-mono text-sm uppercase tracking-widest text-muted transition-colors hover:border-amber hover:text-amber-bright"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </main>
    );
  }

  const counts = {
    total: rsvps.length,
    si: rsvps.filter((r) => r.confirmation === "si").length,
    no: rsvps.filter((r) => r.confirmation === "no").length,
  };

  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link
          href="/"
          className="inline-block font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-amber-bright"
        >
          ← Volver al expediente
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="stamp text-amber-bright text-xs">Acceso concedido</span>
            <h1 className="mt-3 font-stencil text-2xl text-foreground">
              Panel del investigador
            </h1>
            <p className="text-sm text-muted">Sesión: {user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => signOutUser()}
            className="border border-paper-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-amber hover:text-amber-bright"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: counts.total },
            { label: "Sí", value: counts.si },
            { label: "No", value: counts.no },
          ].map((c) => (
            <div key={c.label} className="case-card px-4 py-4 text-center">
              <div className="font-mono text-2xl text-amber-bright">{c.value}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted">{c.label}</div>
            </div>
          ))}
        </div>

        <div className="case-card px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Sembrar el banco de 30 preguntas en Firestore (no duplica si ya existen).
            </p>
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="shrink-0 border border-amber px-4 py-2 font-mono text-xs uppercase tracking-widest text-amber-bright transition-colors hover:bg-amber hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              {seeding ? "Sembrando..." : "Sembrar preguntas"}
            </button>
          </div>
          {seedStatus && <p className="mt-2 text-xs text-muted">{seedStatus}</p>}
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="font-stencil text-xl text-amber-bright">Banco de preguntas</h2>
            <p className="text-sm text-muted">
              Agrega o elimina preguntas del interrogatorio. Eliminar una pregunta ya asignada
              no borra la declaración del testigo — solo la saca del banco disponible.
            </p>
          </div>

          <form onSubmit={handleAddQuestion} className="case-card flex flex-wrap gap-3 px-5 py-4">
            <input
              type="text"
              required
              maxLength={200}
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="Escribe una nueva pregunta..."
              className="min-w-[200px] flex-1 border border-paper-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-amber"
            />
            <button
              type="submit"
              disabled={!newQuestionText.trim() || addingQuestion}
              className="shrink-0 border border-amber px-4 py-2 font-mono text-xs uppercase tracking-widest text-amber-bright transition-colors hover:bg-amber hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              {addingQuestion ? "Agregando..." : "Agregar pregunta"}
            </button>
            {questionError && <p className="w-full text-xs text-red-bright">{questionError}</p>}
          </form>

          <div className="case-card max-h-96 divide-y divide-paper-border overflow-y-auto">
            {questions.map((q) => (
              <div key={q.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{q.text}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {q.taken ? `Asignada a ${q.assignedToName ?? "—"}` : "Disponible"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="shrink-0 border border-paper-border px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-red-bright hover:text-red-bright"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted">
                Aún no hay preguntas en el banco.
              </p>
            )}
          </div>
        </div>

        <div className="case-card overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-paper-border text-xs uppercase tracking-widest text-muted">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Confirmación</th>
                <th className="px-4 py-3">Pregunta asignada</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-border">
              {rsvps.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-foreground">
                    <div className="flex items-center gap-2">
                      <Avatar photoURL={r.photoURL} name={r.name} size={28} />
                      {r.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {CONFIRMATION_LABEL[r.confirmation]}
                  </td>
                  <td className="px-4 py-3 text-muted">{r.questionText ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {r.createdAt ? r.createdAt.toDate().toLocaleString("es-PE") : "—"}
                  </td>
                </tr>
              ))}
              {rsvps.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    Aún no hay declaraciones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="font-stencil text-xl text-amber-bright">Catálogo de evidencia</h2>
            <p className="text-sm text-muted">
              Lo que agregues aquí aparece en &ldquo;Evidencia requerida&rdquo; de la página
              pública.
            </p>
          </div>

          <form onSubmit={handleAddWish} className="case-card grid gap-3 px-5 py-4 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-1">
              <label htmlFor="wish-title" className="font-mono text-xs uppercase tracking-widest text-muted">
                Nombre de la prueba
              </label>
              <input
                id="wish-title"
                type="text"
                required
                maxLength={120}
                value={wishTitle}
                onChange={(e) => setWishTitle(e.target.value)}
                placeholder="Ej. Vinilo de..."
                className="w-full border border-paper-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-amber"
              />
            </div>
            <div className="space-y-1 sm:col-span-1">
              <label htmlFor="wish-url" className="font-mono text-xs uppercase tracking-widest text-muted">
                Enlace a la evidencia
              </label>
              <input
                id="wish-url"
                type="url"
                required
                value={wishUrl}
                onChange={(e) => setWishUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-paper-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-amber"
              />
            </div>
            <div className="space-y-1 sm:col-span-1">
              <label htmlFor="wish-image" className="font-mono text-xs uppercase tracking-widest text-muted">
                Imagen (opcional)
              </label>
              <input
                id="wish-image"
                type="url"
                value={wishImageUrl}
                onChange={(e) => setWishImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-paper-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-amber"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={!wishTitle.trim() || !wishUrl.trim() || addingWish}
                className="border border-amber px-4 py-2 font-mono text-xs uppercase tracking-widest text-amber-bright transition-colors hover:bg-amber hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
              >
                {addingWish ? "Agregando..." : "Agregar evidencia"}
              </button>
              {wishError && <span className="ml-3 text-xs text-red-bright">{wishError}</span>}
            </div>
          </form>

          <div className="case-card divide-y divide-paper-border">
            {wishlist.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden bg-background">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg text-muted">
                      🎁
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{item.title}</p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-xs text-amber-bright underline underline-offset-4"
                  >
                    {item.url}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteWish(item.id)}
                  className="shrink-0 border border-paper-border px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-red-bright hover:text-red-bright"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {wishlist.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted">
                Aún no has catalogado evidencia.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
