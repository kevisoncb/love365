/** Preços canônicos — UI e APIs devem importar daqui */

export type PlanId = "BASIC" | "PREMIUM";

export const PLAN_PRICING = {
  PREMIUM: {
    id: "PREMIUM" as const,
    slug: "premium",
    label: "Premium",
    priceCents: 100,
    priceDisplay: "R$ 34,90",
    anchorLine: "Menos que um date — presente eterno",
    shortPerk: "5 fotos · música · corações · link vitalício",
  },
  BASIC: {
    id: "BASIC" as const,
    slug: "basic",
    label: "Essencial",
    priceCents: 100,
    priceDisplay: "R$ 19,90",
    anchorLine: "Surpresa rápida no celular",
    shortPerk: "3 fotos · contador · link na hora",
  },
} as const;

/** Diferença em reais (copy de upsell) */
export const PREMIUM_UPSELL_DELTA_DISPLAY = "R$ 15";

export function getPlanPriceCents(plan: PlanId): number {
  return PLAN_PRICING[plan].priceCents;
}

export function formatPlanPrice(plan: PlanId): string {
  return PLAN_PRICING[plan].priceDisplay;
}
