type TimerTileProps = {
  label: string;
  value: number | string;
  premium?: boolean;
};

export function TimerTile({ label, value, premium = false }: TimerTileProps) {
  return (
    <article
      className={[
        "rounded-2xl px-3 py-3 text-center backdrop-blur-xl border transition-all duration-300",
        premium
          ? "border-[var(--border-accent)] bg-white/12 shadow-[0_0_32px_rgba(255,47,146,0.12)]"
          : "border-white/10 bg-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
      ].join(" ")}
    >
      <p className="text-[10px] tracking-[0.22em] uppercase text-white/60">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</p>
    </article>
  );
}
