"use client";

import { adminTheme } from "@/components/admin/admin-theme";

type Bar = {
  label: string;
  value: number;
  subLabel?: string;
};

export function SimpleBarChart({
  title,
  bars,
  valueFormatter = (n) => String(n),
}: {
  title: string;
  bars: Bar[];
  valueFormatter?: (n: number) => string;
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <article className={adminTheme.card}>
      <h3 className={adminTheme.label}>{title}</h3>
      <div className="mt-5 flex h-44 items-end gap-1.5 border-t border-zinc-800/80 pt-4 sm:gap-2">
        {bars.map((b) => (
          <div
            key={b.label}
            className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
            title={`${b.label}: ${valueFormatter(b.value)}`}
          >
            <div
              className="w-full max-w-[32px] rounded-t-md bg-zinc-600/80 transition-colors group-hover:bg-[var(--accent)]/90"
              style={{
                height: `${Math.max(6, (b.value / max) * 100)}%`,
              }}
            />
            <span className="hidden max-w-full truncate text-[9px] text-zinc-500 sm:block">
              {b.label.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}
