import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";

const plans = [
  {
    id: "basic",
    name: "Essencial",
    price: "R$ 29,90",
    desc: "Elegante e emocionante — ideal para surpreender rápido.",
    features: [
      "Até 3 fotos",
      "Contador em tempo real",
      "Link eterno",
      "Liberação após PIX",
    ],
    highlight: false,
    href: "/criar?plan=basic",
    cta: "Começar Essencial",
  },
  {
    id: "premium",
    name: "Premium",
    price: "R$ 49,90",
    desc: "A experiência completa — 73% escolhem este plano.",
    features: [
      "Até 5 fotos em alta qualidade",
      "Música da história (YouTube)",
      "Corações animados cinematográficos",
      "Contador ao vivo + link eterno",
      "Preview mais impactante no WhatsApp",
    ],
    highlight: true,
    href: "/criar?plan=premium",
    cta: "Quero o Premium",
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
          Escolha como emocionar
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-[var(--text-muted)]">
          Pagamento seguro via PIX. Página liberada automaticamente após a
          confirmação — sem burocracia.
        </p>
      </header>

      <ul className="grid list-none gap-6 p-0 md:grid-cols-2">
        {plans.map((plan) => (
          <li key={plan.id}>
            <GlassCard
              glow={plan.highlight}
              interactive
              className="relative flex h-full flex-col"
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Mais escolhido
                </span>
              )}
              <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
                {plan.name}
              </h3>
              <p className="font-display mt-2 text-4xl font-medium text-white">
                {plan.price}
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
                    ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
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
        Dúvida? Comece no Premium — você pode voltar ao Essencial no primeiro
        passo.
      </p>
    </section>
  );
}
