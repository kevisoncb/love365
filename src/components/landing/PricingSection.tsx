import Link from "next/link";

import { GlassCard } from "@/components/ui/GlassCard";
import {
  PLAN_PRICING,
  PREMIUM_UPSELL_DELTA_DISPLAY,
} from "@/lib/pricing";

const plans = [
  {
    id: PLAN_PRICING.PREMIUM.slug,
    name: PLAN_PRICING.PREMIUM.label,
    price: PLAN_PRICING.PREMIUM.priceDisplay,
    anchor: PLAN_PRICING.PREMIUM.anchorLine,
    desc: "A escolha de quem quer emocionar de verdade — 7 em cada 10 casais escolhem.",
    features: [
      "Até 5 fotos em alta qualidade",
      "Música da história de vocês",
      "Corações cinematográficos",
      "Contador ao vivo + link vitalício",
      "Preview impactante no WhatsApp",
    ],
    highlight: true,
    href: "/criar?plan=premium",
    cta: "Criar Premium agora",
    badge: "Presente eterno",
  },
  {
    id: PLAN_PRICING.BASIC.slug,
    name: PLAN_PRICING.BASIC.label,
    price: PLAN_PRICING.BASIC.priceDisplay,
    anchor: PLAN_PRICING.BASIC.anchorLine,
    desc: "Entrada perfeita para surpreender hoje — upgrade para Premium a qualquer momento.",
    features: [
      "Até 3 fotos",
      "Contador em tempo real",
      "Link vitalício",
      "PIX · libera na hora",
    ],
    highlight: false,
    href: "/criar?plan=basic",
    cta: "Começar Essencial",
    badge: null as string | null,
  },
];

export function PricingSection() {
  return (
    <section id="planos" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <header className="mb-14 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
          Planos
        </p>
        <h2 className="font-display mt-3 text-3xl font-medium text-white sm:text-4xl">
          Um presente eterno, no valor de um momento a dois
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-[var(--text-muted)]">
          Feito para casais no celular. PIX seguro, página liberada em segundos —
          sem mensalidade, sem pegadinha.
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs text-[var(--text-secondary)]">
          Premium por apenas{" "}
          <span className="font-semibold text-white">
            +{PREMIUM_UPSELL_DELTA_DISPLAY}
          </span>{" "}
          vs. Essencial — e entrega na hora.
        </p>
      </header>

      <ul className="grid list-none gap-6 p-0 md:grid-cols-2">
        {plans.map((plan) => (
          <li
            key={plan.id}
            className={plan.highlight ? "md:order-first" : "md:order-last"}
          >
            <GlassCard
              glow={plan.highlight}
              interactive
              className={`relative flex h-full flex-col ${
                plan.highlight ? "md:scale-[1.02]" : ""
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_0_24px_var(--glow)]">
                  {plan.badge}
                </span>
              )}
              {plan.highlight && (
                <span className="absolute right-4 top-4 rounded-full border border-[var(--border-accent)] bg-black/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                  Mais escolhido
                </span>
              )}
              <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
                {plan.name}
              </h3>
              <p className="font-display mt-2 text-4xl font-medium text-white">
                {plan.price}
              </p>
              <p className="mt-1 text-[11px] font-medium text-[var(--text-secondary)]">
                {plan.anchor}
              </p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {plan.desc}
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 border-t border-[var(--border)] pt-6">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                  >
                    <span
                      className="mt-0.5 text-[var(--accent)]"
                      aria-hidden
                    >
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-8 block w-full rounded-full py-3.5 text-center text-sm font-semibold transition-all ${
                  plan.highlight
                    ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] premium-glow"
                    : "border border-[var(--border)] text-white hover:border-[var(--border-accent)]"
                }`}
              >
                {plan.cta}
              </Link>
            </GlassCard>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
        Recomendamos começar no Premium — diferença de só{" "}
        {PREMIUM_UPSELL_DELTA_DISPLAY}, link vitalício e experiência completa.
        Você pode trocar no primeiro passo se preferir.
      </p>
    </section>
  );
}
