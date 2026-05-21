"use client";

import { AnalyticsEvents, trackEvent } from "@/lib/analytics";
import {
  PLAN_PRICING,
  PREMIUM_UPSELL_DELTA_DISPLAY,
  type PlanId,
} from "@/lib/pricing";

const PLANS = [
  {
    id: PLAN_PRICING.PREMIUM.id,
    label: PLAN_PRICING.PREMIUM.label,
    price: PLAN_PRICING.PREMIUM.priceDisplay,
    tag: "Presente eterno",
    perks: PLAN_PRICING.PREMIUM.shortPerk,
    sub: `Só +${PREMIUM_UPSELL_DELTA_DISPLAY} vs. Essencial`,
  },
  {
    id: PLAN_PRICING.BASIC.id,
    label: PLAN_PRICING.BASIC.label,
    price: PLAN_PRICING.BASIC.priceDisplay,
    tag: null,
    perks: PLAN_PRICING.BASIC.shortPerk,
    sub: "Entrada rápida · upgrade fácil",
  },
];

type PlanSelectorProps = {
  value: PlanId;
  onChange: (plan: PlanId) => void;
};

export function PlanSelector({
  value,
  onChange,
}: PlanSelectorProps) {
  const handleSelect = (plan: PlanId) => {
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
      <p className="text-center text-xs text-[var(--text-muted)] sm:text-left">
        Premium é o padrão — menos que um date, link vitalício e entrega na hora
        após o PIX.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PLANS.map((p) => {
          const selected = value === p.id;
          const isPremium = p.id === "PREMIUM";
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
                isPremium && !selected
                  ? "ring-1 ring-[var(--accent)]/30"
                  : "",
                isPremium ? "sm:order-first" : "sm:order-last",
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
              <span className="mt-1 block text-[10px] font-medium text-[var(--accent)]">
                {p.sub}
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
          className="w-full rounded-xl border border-dashed border-[var(--border-accent)] bg-[var(--accent-soft)] px-4 py-3.5 text-left text-xs text-[var(--text-secondary)] transition hover:border-[var(--accent)]/50"
        >
          <span className="font-semibold text-[var(--accent)]">
            Por só +{PREMIUM_UPSELL_DELTA_DISPLAY}:
          </span>{" "}
          música, corações e o “uau” completo no WhatsApp — a maioria escolhe
          Premium ({PLAN_PRICING.PREMIUM.priceDisplay}).
        </button>
      )}
    </div>
  );
}
