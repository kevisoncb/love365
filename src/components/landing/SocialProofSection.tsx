import { GlassCard } from "@/components/ui/GlassCard";

const testimonials = [
  {
    quote:
      "Ela chorou quando viu o contador. Foi o presente mais emocionante que já dei.",
    author: "Rafael, SP",
  },
  {
    quote:
      "Em 10 minutos estava pronto. O link ficou lindo no WhatsApp.",
    author: "Camila, RJ",
  },
  {
    quote:
      "O Premium com a música da nossa história foi o presente mais emocionante — e saiu mais barato que sair pra jantar.",
    author: "Lucas & Ju, MG",
  },
];

export function SocialProofSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <header className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
          Quem já surpreendeu
        </p>
        <h2 className="font-display mt-3 text-2xl font-medium text-white sm:text-3xl">
          Histórias reais de quem usou o Love365
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--text-muted)]">
          Mais de 2.400 casais já criaram sua página — presente digital
          entregue na hora, sem complicação.
        </p>
      </header>

      <ul className="grid list-none gap-4 p-0 md:grid-cols-3">
        {testimonials.map((t) => (
          <li key={t.author}>
            <GlassCard className="h-full">
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {t.author}
              </p>
            </GlassCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
