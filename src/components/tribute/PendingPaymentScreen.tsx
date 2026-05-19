"use client";

import { useEffect, useState } from "react";

export function PendingPaymentScreen() {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="love-cinematic-bg love-grain flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
      <article className="love-fade-up love-glass max-w-sm rounded-3xl px-8 py-10 premium-glow">
        <span className="relative mx-auto flex h-16 w-16 items-center justify-center" aria-hidden>
          <span className="absolute inset-0 rounded-full border border-[var(--border-accent)] animate-pulse" />
          <span className="text-3xl text-[var(--accent)]">♥</span>
        </span>

        <h1 className="font-display mt-6 text-3xl font-medium text-white">Quase lá</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          Confirmando seu pagamento
          {".".repeat(dots)}
          <span className="invisible">...</span>
        </p>

        <div className="love-progress-track mt-8">
          <span className="love-progress-fill block w-2/3" />
        </div>

        <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Atualiza automaticamente
        </p>
      </article>
    </main>
  );
}
