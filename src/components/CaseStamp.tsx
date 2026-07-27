type StampVariant = "amber" | "red";

export function CaseStamp({
  children,
  variant = "amber",
  className = "",
}: {
  children: React.ReactNode;
  variant?: StampVariant;
  className?: string;
}) {
  const colorClass = variant === "red" ? "text-red-bright" : "text-amber-bright";
  return <span className={`stamp ${colorClass} ${className}`}>{children}</span>;
}
