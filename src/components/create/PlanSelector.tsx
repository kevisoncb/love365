type Plan = "BASIC" | "PREMIUM";

const PLANS = [
  { id: "BASIC" as const, label: "Essencial", price: "R$ 29,90", tag: null },
  { id: "PREMIUM" as const, label: "Premium", price: "R$ 49,90", tag: "Recomendado" },
];

type PlanSelectorProps = {
  value: Plan;
  onChange: (plan: Plan) => void;
};

export function PlanSelector({ value, onChange }: PlanSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {PLANS.map((p) => {
        const selected = value === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={[
              "love-btn love-card-hover relative rounded-2xl border-2 p-5 text-left",
              selected
                ? "border-[var(--accent)] bg-[var(--accent-soft)] premium-glow"
                : "border-[var(--border)] bg-white/[0.02]",
            ].join(" ")}
          >
            {p.tag && (
              <span className="absolute -top-2.5 right-3 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                {p.tag}
              </span>
            )}
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {p.label}
            </span>
            <span className="mt-1 block font-display text-2xl text-white">{p.price}</span>
            <span className="mt-2 block text-xs text-[var(--text-muted)]">
              {p.id === "PREMIUM" ? "Música + corações + 5 fotos" : "3 fotos · contador eterno"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
