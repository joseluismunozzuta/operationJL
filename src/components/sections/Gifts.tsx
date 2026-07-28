"use client";

import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, signInWithGoogle } from "@/lib/firebase";
import { setWishlistItemPurchased, subscribeWishlist, type WishlistItem } from "@/lib/wishlist";

const URL_SPLIT_REGEX = /(https?:\/\/[^\s]+)/g;
const URL_TEST_REGEX = /^https?:\/\//;

// Convierte URLs sueltas dentro del texto en links reales y clicables — por
// si en la descripción se pega el link de una opción alternativa.
function linkify(text: string): ReactNode[] {
  return text.split(URL_SPLIT_REGEX).map((part, i) =>
    URL_TEST_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-amber-bright underline underline-offset-4"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

function WishlistCard({
  item,
  marking,
  currentUserUid,
  onMarkPurchased,
  onUnmarkPurchased,
}: {
  item: WishlistItem;
  marking: boolean;
  currentUserUid: string | null;
  onMarkPurchased: (item: WishlistItem) => void;
  onUnmarkPurchased: (item: WishlistItem) => void;
}) {
  const isLocked = item.lockable && item.purchased;
  const isOwnLock = isLocked && currentUserUid !== null && item.purchasedByUid === currentUserUid;

  const imageContent = (
    <>
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-3xl text-muted">
          🎁
        </div>
      )}
      {isLocked && (
        <span className="stamp absolute inset-0 m-auto flex h-fit w-fit items-center text-red-bright text-xs">
          Ya adquirido
        </span>
      )}
    </>
  );

  return (
    <div
      className={`case-card group flex flex-col overflow-hidden transition-colors ${
        isLocked ? "opacity-50" : "hover:border-amber"
      }`}
    >
      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block aspect-square w-full overflow-hidden bg-background"
        >
          {imageContent}
        </a>
      ) : (
        <div className="relative block aspect-square w-full overflow-hidden bg-background">
          {imageContent}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 px-3 py-3">
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-md text-foreground hover:text-amber-bright"
          >
            {item.title}
          </a>
        ) : (
          <p className="text-md text-foreground">{item.title}</p>
        )}
        {item.description && (
          <p className="whitespace-pre-wrap break-words text-xs text-muted">
            {linkify(item.description)}
          </p>
        )}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto text-xs uppercase tracking-widest text-amber-bright"
          >
            Ver detalle →
          </a>
        )}
        {item.lockable &&
          (isLocked ? (
            isOwnLock ? (
              <>
                <p className="text-xs text-muted">La marcaste tú como adquirida.</p>
                <button
                  type="button"
                  onClick={() => onUnmarkPurchased(item)}
                  disabled={marking}
                  className="mt-1 border border-paper-border px-2 py-1 text-xs uppercase tracking-widest text-muted transition-colors hover:border-red-bright hover:text-red-bright disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {marking ? "Liberando..." : "No la conseguí, liberar"}
                </button>
              </>
            ) : (
              <p className="text-xs text-muted">Alguien ya se encargó de esta.</p>
            )
          ) : (
            <button
              type="button"
              onClick={() => onMarkPurchased(item)}
              disabled={marking}
              className="mt-1 border border-paper-border px-2 py-1 text-xs uppercase tracking-widest text-muted transition-colors hover:border-amber hover:text-amber-bright disabled:cursor-not-allowed disabled:opacity-40"
            >
              {marking ? "Marcando..." : "Marcar como adquirido"}
            </button>
          ))}
      </div>
    </div>
  );
}

export function Gifts() {
  const [items, setItems] = useState<WishlistItem[] | null>(null);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => subscribeWishlist(setItems), []);

  // Igual que en el registro de testigo: una sesión anónima vieja no cuenta
  // como sesión válida para esta acción.
  const currentUser = user && !user.isAnonymous ? user : null;

  async function handleMarkPurchased(item: WishlistItem) {
    setError("");
    setMarkingId(item.id);
    try {
      let activeUser = currentUser;
      if (!activeUser) {
        const result = await signInWithGoogle();
        activeUser = result.user;
      }
      await setWishlistItemPurchased(item.id, true, {
        uid: activeUser.uid,
        name: activeUser.displayName || activeUser.email || "Testigo",
      });
    } catch {
      setError("No se pudo marcar como adquirido. Intenta de nuevo.");
    } finally {
      setMarkingId(null);
    }
  }

  async function handleUnmarkPurchased(item: WishlistItem) {
    setError("");
    setMarkingId(item.id);
    try {
      await setWishlistItemPurchased(item.id, false, null);
    } catch {
      setError("No se pudo liberar la evidencia. Intenta de nuevo.");
    } finally {
      setMarkingId(null);
    }
  }

  const lockableItems = items?.filter((item) => item.lockable) ?? [];
  const regularItems = items?.filter((item) => !item.lockable) ?? [];

  return (
    <section id="evidencia" className="scroll-mt-20 px-6 py-20">
      <div className="mx-auto max-w-lg">
        <h2 className="font-stencil text-2xl text-amber-bright">Evidencia requerida</h2>
        <p className="mt-2 text-sm text-muted">
          Se aceptan pruebas materiales de cariño 🎁. Ninguna es obligatoria — tu presencia ya
          es evidencia suficiente.
        </p>

        {items === null && (
          <p className="mt-8 text-sm text-muted">Consultando el catálogo de evidencia...</p>
        )}

        {items?.length === 0 && (
          <p className="mt-8 text-sm text-muted">
            Aún no se ha catalogado evidencia. Un sobre siempre es una prueba válida.
          </p>
        )}

        {lockableItems.length > 0 && (
          <div className="mt-8">
            <h3 className="mt-6 font-mono text-xs uppercase tracking-widest text-muted">
              Evidencia exclusiva — solo un ejemplar
            </h3>
            <div className="my-3 border-2 rounded-xl border-red-bright bg-red-bright/10 px-4 py-3">
              <p className="stamp text-red-bright text-xs">Pieza única</p>
              <p className="mt-2 text-sm text-foreground">
                Estas no se pueden repetir. Si decides adquirir una, márcala como{" "}
                <strong>&ldquo;ya adquirido&rdquo;</strong> apenas lo decidas, para que nadie más
                la duplique.
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {lockableItems.map((item) => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  marking={markingId === item.id}
                  currentUserUid={currentUser?.uid ?? null}
                  onMarkPurchased={handleMarkPurchased}
                  onUnmarkPurchased={handleUnmarkPurchased}
                />
              ))}
            </div>
          </div>
        )}

        {regularItems.length > 0 && (
          <div className="mt-10">
            {lockableItems.length > 0 && (
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted">
                Más ideas — sin límite de repetición
              </h3>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {regularItems.map((item) => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  marking={markingId === item.id}
                  currentUserUid={currentUser?.uid ?? null}
                  onMarkPurchased={handleMarkPurchased}
                  onUnmarkPurchased={handleUnmarkPurchased}
                />
              ))}
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-bright">{error}</p>}
      </div>
    </section>
  );
}
