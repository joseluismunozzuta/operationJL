export function Avatar({
  photoURL,
  name,
  size = 32,
}: {
  photoURL: string | null;
  name: string;
  size?: number;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className="shrink-0 overflow-hidden rounded-full border border-paper-border bg-paper"
      style={{ width: size, height: size }}
    >
      {photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoURL} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-mono text-amber-bright"
          style={{ fontSize: size * 0.45 }}
        >
          {initial}
        </div>
      )}
    </div>
  );
}
