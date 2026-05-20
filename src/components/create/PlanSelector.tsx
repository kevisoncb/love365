"use client";

import { AnalyticsEvents, trackEvent } from "@/lib/analytics";

type Plan = "BASIC" | "PREMIUM";

const PLANS = [
  {
    id: "BASIC" as const,
    label: "Essencial",
    price: "R$ 29,90",
    tag: null,
    perks: "3 fotos · contador eterno · link na hora",
  },
  {
    id: "PREMIUM" as const,
    label: "Premium",
    price: "R$ 49,90",
    tag: "Mais escolhido",
    perks: "5 fotos · música · corações · impacto máximo",
  },
];

type PlanSelectorProps = {
  value: Plan;
  onChange: (plan: Plan) => void;
};

export function PlanSelector({
  value,
  onChange,
}: PlanSelectorProps) {
  const handleSelect = (plan: Plan) => {
    onChange(plan);
    trackEvent(AnalyticsEvents.PLAN_SELECTED, { plan });
    if (plan === "BASIC") {
      trackEvent(AnalyticsEvents.UPSELL_VIEWED, {
        context: "selected_basic",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PLANS.map((p) => {
          const selected = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p.id)}
              className={[
                "love-btn love-card-hover relative rounded-2xl border-2 p-5 text-left transition-all",
                selected
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] premium-glow"
                  : "border-[var(--border)] bg-white/[0.02]",
                p.id === "PREMIUM" && !selected
                  ? "ring-1 ring-[var(--accent)]/20"
                  : "",
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
              <span className="mt-1 block font-display text-2xl text-white">
                {p.price}
              </span>
              <span className="mt-2 block text-xs text-[var(--text-muted)]">
                {p.perks}
              </span>
            </button>
          );
        })}
      </div>

      {value === "BASIC" && (
        <button
          type="button"
          onClick={() => handleSelect("PREMIUM")}
          className="w-full rounded-xl border border-dashed border-[var(--border-accent)] bg-[var(--accent-soft)] px-4 py-3 text-left text-xs text-[var(--text-secondary)] transition hover:bg-[var(--accent-soft)]"
        >
          <span className="font-semibold text-[var(--accent)]">
            Quer música e corações animados?
          </span>{" "}
          Toque aqui e upgrade para Premium — a experiência que mais emociona.
        </button>
      )}
    </div>
  );
}
