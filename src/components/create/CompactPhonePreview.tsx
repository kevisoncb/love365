"use client";

import { pad2 } from "@/lib/date-utils";

type CompactPhonePreviewProps = {
  names: string;
  photoUrl?: string;
  years: number;
  days: number;
  showHearts?: boolean;
};

export function CompactPhonePreview({ names, photoUrl, years, days, showHearts }: CompactPhonePreviewProps) {
  return (
    <aside
      className="love-fade-up lg:hidden"
      aria-label="Pré-visualização da página"
    >
      <article className="love-glass flex items-center gap-3 rounded-2xl border border-[var(--border)] p-2.5 premium-border">
        <figure className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-900">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg text-[var(--accent)]/40">♥</span>
          )}
          {showHearts && (
            <span className="absolute -right-0.5 -top-0.5 text-[10px] text-[var(--accent)]" aria-hidden>
              ♥
            </span>
          )}
        </figure>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base italic text-white">{names || "Seus nomes"}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            {years} anos · {days} dias juntos
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[9px] uppercase tracking-widest text-[var(--accent)]">Live</p>
          <p className="font-mono text-xs tabular-nums text-white">{pad2(new Date().getSeconds())}s</p>
        </div>
      </article>
    </aside>
  );
}
