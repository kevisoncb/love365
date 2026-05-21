import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { PLAN_PRICING } from "@/lib/pricing";

type SiteNavProps = {
  links?: { href: string; label: string }[];
  ctaHref?: string;
  ctaLabel?: string;
  backHref?: string;
  backLabel?: string;
};

const defaultLinks = [
  { href: "#inicio", label: "Início" },
  { href: "#como-fazer", label: "Como funciona" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "Dúvidas" },
];

export function SiteNav({
  links = defaultLinks,
  ctaHref = "/criar?plan=premium",
  ctaLabel = `Criar — ${PLAN_PRICING.PREMIUM.priceDisplay}`,
  backHref,
  backLabel = "Voltar",
}: SiteNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[rgba(10,10,15,0.75)] backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo />

        {backHref ? (
          <Link
            href={backHref}
            className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
          >
            {backLabel}
          </Link>
        ) : (
          <>
            <div className="hidden items-center gap-8 md:flex">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-white"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <Link
              href={ctaHref}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--glow)] transition-all hover:bg-[var(--accent-hover)] hover:scale-[1.02] active:scale-[0.98]"
            >
              {ctaLabel}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
