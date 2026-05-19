"use client";

import { useEffect, useState } from "react";
import { PreviewTile } from "@/components/create/PreviewTile";
import { pad2 } from "@/lib/date-utils";

type PhonePreviewProps = {
  names: string;
  photoUrl?: string;
  time: {
    years: number;
    months: number;
    days: number;
    hours: number;
    mins: number;
    secs: number;
  };
  showHearts?: boolean;
};

export function PhonePreview({ names, photoUrl, time, showHearts }: PhonePreviewProps) {
  const [hearts, setHearts] = useState<{ left: string; delay: string }[]>([]);

  useEffect(() => {
    setHearts(
      [...Array(8)].map(() => ({
        left: `${Math.random() * 90}%`,
        delay: `${Math.random() * 5}s`,
      }))
    );
  }, []);

  return (
    <aside className="sticky top-28 hidden flex-col items-center lg:flex">
      <div className="relative h-[520px] w-[260px] overflow-hidden rounded-[2.8rem] border-[3px] border-zinc-800 bg-zinc-950 shadow-2xl premium-glow sm:h-[580px] sm:w-[285px] love-fade-up">
        <span
          className="absolute left-1/2 top-0 z-50 block h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-zinc-900"
          aria-hidden
        />

        {showHearts && (
          <span className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
            {hearts.map((heart, i) => (
              <span
                key={i}
                className="absolute animate-love-fall text-lg text-[var(--accent)]/50"
                style={{ left: heart.left, animationDelay: heart.delay }}
              >
                ♥
              </span>
            ))}
          </span>
        )}

        <div className="relative flex h-full w-full flex-col bg-black">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-600">
              <span className="text-3xl opacity-30">♥</span>
              <span className="mt-2 text-[8px] font-semibold uppercase tracking-widest">Sua foto principal</span>
            </span>
          )}

          <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25" aria-hidden />

          <header className="relative z-10 px-6 pt-14 text-center">
            <h2 className="font-display break-words text-[1.65rem] font-medium italic leading-tight text-white drop-shadow-lg">
              {names || "Seus nomes"}
            </h2>
          </header>

          <footer className="relative z-10 mt-auto w-full px-5 pb-12">
            <ul className="grid list-none grid-cols-3 gap-2 p-0">
              <PreviewTile label="Anos" value={time.years} />
              <PreviewTile label="Meses" value={time.months} />
              <PreviewTile label="Dias" value={time.days} />
              <PreviewTile label="Hrs" value={pad2(time.hours)} />
              <PreviewTile label="Min" value={pad2(time.mins)} />
              <PreviewTile label="Seg" value={pad2(time.secs)} />
            </ul>
          </footer>
        </div>
      </div>

      <p className="mt-8 flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/[0.04] px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
        Preview em tempo real
      </p>
    </aside>
  );
}
