"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";

const faqs = [
  {
    q: "O que é a Love365?",
    a: "Uma página exclusiva para o seu relacionamento: contador em tempo real, fotos e, no Premium, música personalizada.",
  },
  {
    q: "Quais métodos de pagamento estão disponíveis?",
    a: "PIX e cartão de crédito, processados com segurança. A liberação é imediata após a confirmação.",
  },
  {
    q: "Quanto tempo a página fica no ar?",
    a: "Para sempre. Sem assinatura e sem taxas escondidas.",
  },
  {
    q: "Posso editar depois de pronta?",
    a: "Ainda não — mas estamos preparando um painel de edição para todos os clientes.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
      <header className="mb-12 text-center">
        <h2 className="font-display text-3xl font-medium text-white">Perguntas frequentes</h2>
      </header>

      <ul className="space-y-3">
        {faqs.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={item.q}>
              <GlassCard className={`!p-0 overflow-hidden transition-all ${isOpen ? "premium-border" : ""}`}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-sm font-semibold text-white"
                >
                  {item.q}
                  <span
                    className={`shrink-0 text-[var(--accent)] transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  >
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <p className="border-t border-[var(--border)] px-6 pb-5 pt-4 text-sm leading-relaxed text-[var(--text-muted)]">
                    {item.a}
                  </p>
                )}
              </GlassCard>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
