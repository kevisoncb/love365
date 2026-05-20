import Link from "next/link";
import { PhoneMockup } from "@/components/landing/PhoneMockup";
import { PremiumButton } from "@/components/ui/PremiumButton";

export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-5 pb-8 pt-28 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:pt-32"
    >
      <header className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-accent)] bg-[var(--accent-soft)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          Presente que emociona de verdade
        </span>

        <h1 className="font-display text-4xl font-medium leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.35rem]">
          Surpreenda quem você ama com uma{" "}
          <span className="italic text-[var(--accent)]">
            página eterna
          </span>
        </h1>

        <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
          Fotos, contador ao vivo e a música de vocês — um presente digital
          cinematográfico, pronto em poucos minutos no celular.
        </p>

        <ul className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
          {[
            "+2.400 casais",
            "PIX seguro",
            "Link liberado na hora",
          ].map((badge) => (
            <li
              key={badge}
              className="rounded-full border border-[var(--border)] bg-white/[0.04] px-3 py-1 text-xs font-medium text-[var(--text-muted)]"
            >
              {badge}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs text-[var(--text-muted)]">
          Leva em média 4 minutos · sem app · funciona no WhatsApp
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <PremiumButton
            href="/criar?plan=premium"
            className="w-full sm:w-auto"
          >
            Quero criar agora — R$ 49,90
          </PremiumButton>
          <Link
            href="/criar"
            className="w-full rounded-full border border-[var(--border)] py-3.5 text-center text-sm font-semibold text-white transition hover:border-[var(--border-accent)] sm:w-auto"
          >
            Ver opção Essencial
          </Link>
        </div>

        <Link
          href="#planos"
          className="mt-4 text-center text-sm font-medium text-[var(--text-muted)] underline-offset-4 hover:text-white hover:underline lg:text-left"
        >
          Comparar planos
        </Link>
      </header>

      <PhoneMockup />
    </section>
  );
}
