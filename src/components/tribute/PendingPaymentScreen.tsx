"use client";

import { useEffect, useState } from "react";
import { PremiumButton } from "@/components/ui/PremiumButton";

type PendingPaymentScreenProps = {
  token?: string;
  pollAttempt?: number;
  onRefresh?: () => void;
  syncing?: boolean;
};

export function PendingPaymentScreen({
  token,
  pollAttempt = 0,
  onRefresh,
  syncing = false,
}: PendingPaymentScreenProps) {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setDots((d) => (d + 1) % 4),
      500
    );
    return () => clearInterval(id);
  }, []);

  const attemptLabel =
    pollAttempt > 0
      ? `Verificação ${pollAttempt}`
      : "Iniciando verificação";

  return (
    <main className="love-cinematic-bg love-grain flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
      <article className="love-fade-up love-glass max-w-md rounded-3xl px-8 py-10 premium-glow">
        <span
          className="relative mx-auto flex h-20 w-20 items-center justify-center"
          aria-hidden
        >
          <span className="absolute inset-0 rounded-full border border-[var(--border-accent)] animate-ping opacity-30" />
          <span className="absolute inset-2 rounded-full border border-[var(--border-accent)]/60 animate-pulse" />
          <span className="relative text-4xl text-[var(--accent)]">
            ♥
          </span>
        </span>

        <h1 className="font-display mt-8 text-3xl font-medium text-white sm:text-4xl">
          Quase lá
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          Confirmando seu pagamento com segurança
          {".".repeat(dots)}
          <span className="invisible">...</span>
        </p>

        <p className="mt-2 text-xs text-[var(--text-muted)]">
          {attemptLabel}
          {syncing ? " · consultando AbacatePay" : ""}
        </p>

        <div className="love-progress-track mt-8 overflow-hidden">
          <span
            className="love-progress-fill block h-full animate-pulse"
            style={{
              width: `${Math.min(90, 35 + pollAttempt * 8)}%`,
            }}
          />
        </div>

        <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Atualiza automaticamente a cada poucos segundos
        </p>

        {token && onRefresh && (
          <div className="mt-6">
            <PremiumButton
              type="button"
              variant="ghost"
              className="w-full"
              loading={syncing}
              onClick={onRefresh}
            >
              Atualizar agora
            </PremiumButton>
          </div>
        )}

        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Já pagou? Esta tela libera sozinha em instantes. Se demorar,
          toque em atualizar.
        </p>
      </article>
    </main>
  );
}
