"use client";

import { useCallback, useState } from "react";

type ShareFeedback = "idle" | "copied" | "error";

type TributeShareActionsProps = {
  names: string;
  shareUrl: string;
  onShared?: () => void;
};

function buildWhatsAppUrl(names: string, url: string): string {
  const text = `✨ ${names} — nossa homenagem no Love365\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function TributeShareActions({
  names,
  shareUrl,
  onShared,
}: TributeShareActionsProps) {
  const [feedback, setFeedback] = useState<ShareFeedback>("idle");

  const canNativeShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function";

  const flash = useCallback((kind: ShareFeedback) => {
    setFeedback(kind);
    window.setTimeout(() => setFeedback("idle"), 2400);
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      flash("copied");
      onShared?.();
    } catch {
      flash("error");
    }
  }, [shareUrl, onShared, flash]);

  const nativeShare = useCallback(async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: names,
        text: `Nossa homenagem no Love365 — ${names}`,
        url: shareUrl,
      });
      onShared?.();
    } catch {
      /* cancelado */
    }
  }, [canNativeShare, names, shareUrl, onShared]);

  const btnClass =
    "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/90 backdrop-blur-md transition hover:border-[var(--accent)]/40 hover:bg-black/55 active:scale-[0.98] max-w-[8.5rem]";

  return (
    <div className="mt-4 w-full max-w-md px-1">
      {feedback === "copied" && (
        <p
          className="love-fade-up mb-2.5 text-center text-[11px] font-medium text-emerald-400/95"
          role="status"
        >
          Link copiado com sucesso ♥
        </p>
      )}
      {feedback === "error" && (
        <p
          className="mb-2.5 text-center text-[11px] text-amber-400/90"
          role="alert"
        >
          Não foi possível copiar. Tente novamente.
        </p>
      )}

      <div className="flex items-center justify-center gap-2">
        <a
          href={buildWhatsAppUrl(names, shareUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          onClick={() => onShared?.()}
        >
          WhatsApp
        </a>

        <button
          type="button"
          className={btnClass}
          onClick={() => void copyLink()}
        >
          Copiar link
        </button>

        {canNativeShare && (
          <button
            type="button"
            className={`${btnClass} max-w-[3.25rem] flex-none px-0`}
            onClick={() => void nativeShare()}
            aria-label="Compartilhar"
            title="Compartilhar"
          >
            ↗
          </button>
        )}
      </div>
    </div>
  );
}
