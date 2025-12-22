"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

type Plan = "BASIC" | "PREMIUM";

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

function useAutoAdvance(enabled: boolean, intervalMs: number, onTick: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(onTick, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs, onTick]);
}

type PageDTO = {
  token: string;
  plan: Plan;
  names: string;
  startDate: string; // YYYY-MM-DD
  message?: string;
  photos: string[]; // URLs
  yt?: string | null; // não usado agora
  createdAt?: string;
};

export default function PublicPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  const [data, setData] = useState<PageDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // load from API
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const res = await fetch(`/api/pages/${token}`, { cache: "no-store" });
        const json = await res.json();

        if (!alive) return;

        if (!res.ok) {
          setNotFound(true);
          setData(null);
          return;
        }

        setData(json as PageDTO);
      } catch {
        if (!alive) return;
        setNotFound(true);
        setData(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [token]);

  const isPremium = data?.plan === "PREMIUM";
  const photos = data?.photos ?? [];
  const count = photos.length;

  // date
  const startDate = useMemo(() => {
    const s = data?.startDate || "";
    const d = s ? new Date(s + "T00:00:00") : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  }, [data?.startDate]);

  // counter
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = useMemo(() => diffParts(startDate, now), [startDate, now]);

  // deck carousel
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  const next = () => setIndex((i) => (count ? (i + 1) % count : 0));
  const prev = () => setIndex((i) => (count ? (i - 1 + count) % count : 0));

  useAutoAdvance(count > 1, 3000, next);

  // swipe
  const touchStartX = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || count <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;

    if (Math.abs(delta) < 40) return;

    if (delta < 0) next();
    else prev();

    touchStartX.current = null;
  }

  function stackPhotoIndex(k: number) {
    if (!count) return 0;
    return (index + k) % count;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-xl px-4 py-10">
          <div className="text-sm text-gray-600">Carregando…</div>
        </div>
      </main>
    );
  }

  if (notFound || !data) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-xl px-4 py-10">
          <h1 className="text-xl font-semibold">Página não encontrada</h1>
          <p className="mt-2 text-sm text-gray-600">Verifique se o link está correto.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${isPremium ? "bg-black text-white" : "bg-white text-gray-900"}`}>
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>

      <div className="mx-auto max-w-xl px-4 py-6">
        {/* 1) Nome do casal */}
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">{data.names}</h1>
          <p className={`mt-1 text-sm ${isPremium ? "text-white/70" : "text-gray-600"}`}>
            Juntos desde {startDate.toLocaleDateString("pt-BR")}
          </p>
        </header>

        {/* 2) Carrossel "baralho" */}
        <section
          className={`rounded-3xl border p-3 ${
            isPremium ? "border-white/15 bg-white/5" : "border-gray-200 bg-white"
          }`}
        >
          {count === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className={`text-sm ${isPremium ? "text-white/70" : "text-gray-600"}`}>Sem fotos.</p>
            </div>
          ) : (
            <div
              className="relative h-72 select-none"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              aria-label="Carrossel de fotos"
            >
              {/* Stack (3 cartas) */}
              <div className="absolute inset-0">
                {[2, 1, 0].map((k) => {
                  const pi = stackPhotoIndex(k);
                  const isFront = k === 0;

                  const offsetY = k * 10;
                  const offsetX = k * 8;
                  const scale = 1 - k * 0.06;
                  const opacity = 1 - k * 0.25;

                  return (
                    <div
                      key={`${index}-${k}`}
                      className="absolute inset-0 transition-transform duration-500 ease-out"
                      style={{
                        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                        opacity,
                        zIndex: isFront ? 30 : 10 + k,
                        pointerEvents: isFront ? "auto" : "none",
                      }}
                    >
                      <div
                        className={`h-full w-full overflow-hidden rounded-2xl border ${
                          isPremium ? "border-white/15" : "border-gray-200"
                        } shadow-sm`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photos[pi]}
                          alt={`Foto ${pi + 1}`}
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Setas */}
              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Foto anterior"
                    className={`absolute left-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 text-sm font-semibold backdrop-blur ${
                      isPremium ? "bg-white/10 text-white" : "bg-black/10 text-black"
                    }`}
                  >
                    {"<"}
                  </button>

                  <button
                    type="button"
                    onClick={next}
                    aria-label="Próxima foto"
                    className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 text-sm font-semibold backdrop-blur ${
                      isPremium ? "bg-white/10 text-white" : "bg-black/10 text-black"
                    }`}
                  >
                    {">"}
                  </button>
                </>
              )}

              {/* Indicadores */}
              {count > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={`h-2 w-2 rounded-full ${
                        i === index ? (isPremium ? "bg-white" : "bg-black") : isPremium ? "bg-white/40" : "bg-black/20"
                      }`}
                      aria-label={`Ir para foto ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 3) Texto */}
        {data.message && data.message.trim() && (
          <section
            className={`mt-4 rounded-3xl border p-5 ${
              isPremium ? "border-white/15 bg-white/5" : "border-gray-200 bg-gray-50"
            }`}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.message}</p>
          </section>
        )}

        {/* 4) Contador */}
        <section
          className={`mt-4 rounded-3xl border p-5 ${
            isPremium ? "border-white/15 bg-white/5" : "border-gray-200 bg-white"
          }`}
        >
          <h2 className={`text-sm font-semibold ${isPremium ? "text-white/90" : "text-gray-900"}`}>
            Dias juntos
          </h2>

          <div className="mt-4 grid grid-cols-4 gap-2">
            <TimeCard label="DIAS" value={String(time.days)} premium={isPremium} />
            <TimeCard label="HORAS" value={pad2(time.hours)} premium={isPremium} />
            <TimeCard label="MIN" value={pad2(time.mins)} premium={isPremium} />
            <TimeCard label="SEG" value={pad2(time.secs)} premium={isPremium} />
          </div>
        </section>

        {/* Token escondido: não renderiza nada */}
      </div>
    </main>
  );
}

function TimeCard({ label, value, premium }: { label: string; value: string; premium: boolean }) {
  return (
    <div className={`rounded-2xl border px-3 py-3 text-center ${premium ? "border-white/15 bg-white/5" : "border-gray-200 bg-white"}`}>
      <div className={`text-xs font-medium ${premium ? "text-white/70" : "text-gray-500"}`}>{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
