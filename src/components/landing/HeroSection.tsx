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
          Presente que emociona
        </span>

        <h1 className="font-display text-4xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
          Eternize seu amor com uma{" "}
          <span className="italic text-[var(--accent)]">página única</span>
        </h1>

        <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
          Um presente digital cinematográfico: fotos, contador em tempo real e música da história de vocês — pronto em minutos.
        </p>

        <ul className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
          {["+2.400 casais", "Link na hora", "Página eterna"].map((badge) => (
            <li
              key={badge}
              className="rounded-full border border-[var(--border)] bg-white/[0.04] px-3 py-1 text-xs font-medium text-[var(--text-muted)]"
            >
              {badge}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <PremiumButton href="/criar" className="w-full sm:w-auto">
            Criar nossa página
          </PremiumButton>
          <Link
            href="#planos"
            className="text-center text-sm font-medium text-[var(--text-muted)] underline-offset-4 hover:text-white hover:underline"
          >
            Ver planos
          </Link>
        </div>
      </header>

      <PhoneMockup />
    </section>
  );
}
