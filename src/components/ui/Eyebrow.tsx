type EyebrowProps = {
  children: React.ReactNode;
  tone?: "light" | "dark";
  className?: string;
};

export function Eyebrow({ children, tone = "light", className = "" }: EyebrowProps) {
  const palette =
    tone === "light"
      ? "text-sky-deep ring-sky/30 bg-sky-soft/60"
      : "text-sky ring-white/12 bg-white/5";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.22em] ring-1 ${palette} ${className}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}
