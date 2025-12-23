"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

type Plan = "BASIC" | "PREMIUM";

type PageDTO = {
  token: string;
  plan: Plan;
  names: string;
  startDate: string;
  message?: string;
  photos: string[];
  yt?: string | null;
  createdAt?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function diffParts(from: Date, to: Date) {
  const sec = Math.floor(Math.max(0, to.getTime() - from.getTime()) / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;
  return { days, hours, mins, secs };
}

function TimeBox({
  label,
  value,
  premium,
}: {
  label: string;
  value: number | string;
  premium: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-3 py-3 text-center border ${
        premium
          ? "border-rose-300/30 bg-rose-500/5 shadow-[0_0_30px_rgba(244,63,94,0.18)]"
          : "border-rose-300/15 bg-rose-500/5 shadow-[0_14px_45px_rgba(0,0,0,0.45)]"
      }`}
    >
      <div className="text-xs text-white/70 tracking-widest">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-white">{value}</div>
    </div>
  );
}

/* ---------------- Hearts Overlay via DOM/CSS ---------------- */

type HeartSpec = {
  id: string;
  leftPct: number;
  sizePx: number;
  durationSec: number;
  delaySec: number;
  driftPx: number;
  opacity: number;
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeHearts(count: number): HeartSpec[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${Date.now()}-${i}-${Math.random().toString(16).slice(2)}`,
    leftPct: rand(0, 100),
    sizePx: rand(10, 18),
    durationSec: rand(6, 12),
    delaySec: rand(0, 4),
    driftPx: rand(-40, 40),
    opacity: rand(0.35, 0.9),
  }));
}

function HeartsOverlay({ enabled }: { enabled: boolean }) {
  const [hearts, setHearts] = useState<HeartSpec[]>([]);

  useEffect(() => {
    if (!enabled) {
      setHearts([]);
      return;
    }
    // 50 corações simultâneos (ajuste se quiser mais/menos)
    setHearts(makeHearts(50));

    // re-randomiza de tempos em tempos para variar
    const id = setInterval(() => setHearts(makeHearts(50)), 12000);
    return () => clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* CSS local para animação */}
      <style jsx global>{`
        @keyframes love365-fall {
          0% {
            transform: translate3d(var(--drift), -12vh, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--op);
          }
          100% {
            transform: translate3d(calc(var(--drift) * -1), 110vh, 0) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {hearts.map((h) => (
          <span
            key={h.id}
            className="absolute top-0 select-none"
            style={
              {
                left: `${h.leftPct}%`,
                fontSize: `${h.sizePx}px`,
                animation: `love365-fall ${h.durationSec}s linear ${h.delaySec}s infinite`,
                // variáveis CSS usadas no keyframe
                ["--drift" as any]: `${h.driftPx}px`,
                ["--op" as any]: h.opacity,
                color: "rgb(244,63,94)",
                filter: "drop-shadow(0 0 6px rgba(244,63,94,0.35))",
              } as React.CSSProperties
            }
            aria-hidden="true"
          >
            ♥
          </span>
        ))}
      </div>
    </>
  );
}

/* ---------------- Page ---------------- */

export default function PublicCouplePage() {
  const params = useParams();
  const tokenRaw = (params as any)?.token;
  const token = (Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw) as string | undefined;

  const [data, setData] = useState<PageDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [now, setNow] = useState(() => new Date());

  // baralho
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setData(null);
      setApiError("Token ausente.");
      return;
    }

    let alive = true;

    (async () => {
      try {
        const res = await fetch(`/api/pages/${token}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));

        if (!alive) return;

        if (!res.ok) {
          setData(null);
          setApiError(json?.error || "Erro ao buscar página");
          return;
        }

        setData(json as PageDTO);
      } catch {
        if (!alive) return;
        setApiError("Falha ao carregar página");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const premium = data?.plan === "PREMIUM";
  const photos = data?.photos ?? [];
  const total = photos.length;

  const startDate = useMemo(() => {
    const s = data?.startDate || "";
    const d = new Date(s ? s + "T00:00:00" : Date.now());
    return isNaN(d.getTime()) ? new Date() : d;
  }, [data?.startDate]);

  const time = useMemo(() => diffParts(startDate, now), [startDate, now]);

  // autoplay do carrossel
  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), 3000);
    return () => clearInterval(id);
  }, [total]);

  const next = () => total > 1 && setIndex((i) => (i + 1) % total);
  const prev = () => total > 1 && setIndex((i) => (i - 1 + total) % total);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || total <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    if (Math.abs(delta) < 40) return;
    delta < 0 ? next() : prev();
    touchStartX.current = null;
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0B0B10] text-white">
        <p className="text-sm text-white/70">Carregando…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0B0B10] text-white">
        <div className="text-center px-4">
          <h1 className="text-xl font-semibold">Página não encontrada</h1>
          <p className="mt-2 text-sm text-white/70">{apiError}</p>
        </div>
      </main>
    );
  }

  const roseCard =
    "rounded-3xl border border-rose-300/15 bg-rose-500/5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]";

  return (
    <main className="min-h-screen text-white bg-[#0B0B10]">
      {/* Corações: PREMIUM */}
      <HeartsOverlay enabled={premium} />

      <div className="relative z-10 mx-auto max-w-xl px-4 py-10">
        {/* Debug discreto */}
        <div className="fixed bottom-3 right-3 z-50 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-white/70">
          plan: <span className="text-white">{data.plan}</span>
        </div>

        <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center gap-6">
          <header className="text-center">
            <h1 className="text-4xl font-semibold tracking-tight">{data.names}</h1>
            <p className="mt-2 text-sm text-white/70">
              Juntos desde {startDate.toLocaleDateString("pt-BR")}
            </p>
          </header>

          {/* Fotos (baralho) */}
          <section
            className={`relative w-full max-w-md h-80 rounded-3xl overflow-hidden border ${
              premium
                ? "border-rose-300/30 shadow-[0_0_55px_rgba(244,63,94,0.22)]"
                : "border-rose-300/15 shadow-[0_14px_45px_rgba(0,0,0,0.45)]"
            } bg-rose-500/5`}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {total === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-white/70">
                Sem fotos
              </div>
            ) : (
              photos.map((src, i) => {
                const pos = (i - index + total) % total;
                if (pos > 2) return null;

                return (
                  <div
                    key={i}
                    className="absolute inset-0 transition-all duration-500 p-3"
                    style={{
                      transform: `translate(${pos * 14}px, ${pos * 10}px) scale(${1 - pos * 0.06}) rotate(${
                        pos === 0 ? 0 : pos === 1 ? -3 : 3
                      }deg)`,
                      zIndex: 10 - pos,
                      opacity: 1 - pos * 0.25,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Foto ${i + 1}`}
                      className="h-full w-full rounded-2xl object-cover"
                      draggable={false}
                    />
                  </div>
                );
              })
            )}

            {total > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 text-white border border-white/10"
                  aria-label="Anterior"
                >
                  ‹
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 text-white border border-white/10"
                  aria-label="Próxima"
                >
                  ›
                </button>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs bg-black/65 text-white border border-white/10">
                  {index + 1}/{total}
                </div>
              </>
            )}
          </section>

          {/* Timer abaixo das fotos */}
          <section className={`${roseCard} w-full max-w-md p-5`}>
            <h2 className="text-sm font-semibold mb-3 text-center tracking-widest text-white/90">
              TEMPO JUNTOS
            </h2>
            <div className="grid grid-cols-4 gap-2">
              <TimeBox label="DIAS" value={time.days} premium={premium} />
              <TimeBox label="HORAS" value={pad2(time.hours)} premium={premium} />
              <TimeBox label="MIN" value={pad2(time.mins)} premium={premium} />
              <TimeBox label="SEG" value={pad2(time.secs)} premium={premium} />
            </div>
          </section>

          {/* Texto com quebra forçada */}
          {data.message && data.message.trim() && (
            <section className={`${roseCard} w-full max-w-md p-5 text-center`}>
              <p className="text-sm text-white/90 whitespace-pre-wrap break-words break-all">
                {data.message}
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
