"use client";

import { useEffect, useState } from "react";
import { getWishlist, type WishlistItem } from "@/lib/wishlist";

export function Gifts() {
  const [items, setItems] = useState<WishlistItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWishlist()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

        {items && items.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="case-card group flex flex-col overflow-hidden text-left transition-colors hover:border-amber"
              >
                <div className="aspect-square w-full overflow-hidden bg-background">
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
                </div>
                <div className="flex flex-1 flex-col gap-1 px-3 py-3">
                  <p className="text-sm text-foreground">{item.title}</p>
                  <span className="mt-auto text-xs uppercase tracking-widest text-amber-bright">
                    Ver evidencia →
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
