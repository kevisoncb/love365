import { GlassCard } from "@/components/ui/GlassCard";
import { PLAN_PRICING } from "@/lib/pricing";

const passos = [
  {
    numero: "01",
    titulo: "Conte sua história",
    desc: "Nomes, data especial e as fotos que resumem vocês dois.",
  },
  {
    numero: "02",
    titulo: "Escolha o plano",
    desc: `Premium recomendado (${PLAN_PRICING.PREMIUM.priceDisplay}) — PIX confirma em segundos.`,
  },
  {
    numero: "03",
    titulo: "Link na hora",
    desc: "Assim que o pagamento confirma, seu link exclusivo é liberado.",
  },
  {
    numero: "04",
    titulo: "Surpreenda",
    desc: "Envie o link e veja a emoção de reviver cada segundo juntos.",
  },
];

export function StepsSection() {
  return (
    <section id="como-fazer" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <header className="mb-14 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
          Simples assim
        </p>
        <h2 className="font-display mt-3 text-3xl font-medium text-white sm:text-4xl">
          Como funciona
        </h2>
      </header>

      <ol className="grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {passos.map((p) => (
          <li key={p.numero}>
            <GlassCard interactive className="group relative h-full">
              <span className="font-display text-5xl font-medium text-white/10">{p.numero}</span>
              <h3 className="mt-4 text-lg font-semibold text-white">{p.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{p.desc}</p>
            </GlassCard>
          </li>
        ))}
      </ol>
    </section>
  );
}
