import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-[var(--border)] py-14 px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6">
        <Logo href="/" />
        <p className="text-center text-xs text-[var(--text-muted)]">
          Copyright © 2025 Love365.com.br — Todos os direitos reservados
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Feito com carinho para o seu amor
        </p>
      </div>
    </footer>
  );
}
