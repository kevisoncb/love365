type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  interactive?: boolean;
};

export function GlassCard({ children, className = "", glow, interactive }: GlassCardProps) {
  return (
    <article
      className={[
        "love-glass rounded-3xl p-6 sm:p-8",
        glow ? "premium-glow premium-border" : "",
        interactive ? "love-card-hover" : "",
        className,
      ].join(" ")}
    >
      {children}
    </article>
  );
}
