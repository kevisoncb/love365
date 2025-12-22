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

function safePayload(raw: any) {
  const plan: Plan = raw?.plan === "BASIC" ? "BASIC" : "PREMIUM";
  const names = String(raw?.names ?? "").trim().slice(0, 60) || "Nosso Amor";
  const startDateStr = String(raw?.startDate ?? "");
  const messageMax = plan === "BASIC" ? 280 : 800;
  const message = String(raw?.message ?? "").trim().slice(0, messageMax);

  const photosLimit = plan === "BASIC" ? 3 : 5;
  const photos = Array.isArray(raw?.photos) ? raw.photos.slice(0, photosLimit) : [];

  return { plan, names, startDateStr, message, photos };
}

function useAutoAdvance(enabled: boolean, intervalMs: number, onTick: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(onTick, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs, onTick]);
}

export default function CouplePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  const [payload, setPayload] = useState<ReturnType<typeof safePayload> | null>(null);

  // Load sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`love365:${token}`);
      if (!raw) return;
      setPayload(safePayload(JSON.parse(raw)));
    } catch {
      // ignore
    }
  }, [token]);

  const isPremium = payload?.plan === "PREMIUM";
  const photos = payload?.photos ?? [];

  // Date
  const startDate = useMemo(() => {
    const s = payload?.startDateStr || "";
    const d = s ? new Date(s + "T00:00:00") : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  }, [payload?.startDateStr]);

  // Counter
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = useMemo(() => diffParts(startDate, now), [startDate, now]);

  // Deck carousel state
  const [index, setIndex] = useState(0);

  const count = photos.length;

  const next = () => setIndex((i) => (count ? (i + 1) % count : 0));
  const prev = () => setIndex((i) => (count ? (i - 1 + count) % count : 0));

  // Auto-advance every 3s
  useAutoAdvance(count > 1, 3000, next);

  // Swipe
  const touchStartX = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || count <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;

    if (Math.abs(delta) < 40) return; // threshold

    if (delta < 0) next();
    else prev();

    touchStartX.current = null;
  }

  // Helpers: return the photo index for the k-th card in the stack
  // k=0 => front card (current), k=1 => next behind, k=2 => next-next behind...
  function stackPhotoIndex(k: number) {
    if (!count) return 0;
    return (index + k) % count;
  }

  return (
    <main className={`min-h-screen ${isPremium ? "bg-black text-white" : "bg-white text-gray-900"}`}>
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>

      <div className="mx-auto max-w-xl px-4 py-6">
        {/* 1) Nome do casal */}
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">{payload?.names ?? "Carregando..."}</h1>
          <p className={`mt-1 text-sm ${isPremium ? "text-white/70" : "text-gray-600"}`}>
            Juntos desde {startDate.toLocaleDateString("pt-BR")}
          </p>
        </header>

        {/* 2) Carrossel em estilo "baralho" + setas */}
        <section
          className={`rounded-3xl border p-3 ${
            isPremium ? "border-white/15 bg-white/5" : "border-gray-200 bg-white"
          }`}
        >
          {count === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className={`text-sm ${isPremium ? "text-white/70" : "text-gray-600"}`}>
                Sem fotos carregadas. Gere a página pelo /criar.
              </p>
            </div>
          ) : (
            <div
              className="relative h-72 select-none"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              aria-label="Carrossel de fotos"
            >
              {/* Stack (3 cartas visíveis) */}
              <div className="absolute inset-0">
                {[2, 1, 0].map((k) => {
                  const pi = stackPhotoIndex(k);
                  const isFront = k === 0;

                  // offsets (baralho)
                  const offsetY = k * 10;     // px
                  const offsetX = k * 8;      // px
                  const scale = 1 - k * 0.06; // 1, 0.94, 0.88
                  const opacity = 1 - k * 0.25;

                  return (
                    <div
                      key={`${index}-${k}`}
                      className={`absolute inset-0 transition-transform duration-500 ease-out`}
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

              {/* Indicadores (bolinhas) */}
              {count > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {photos.map((_: string, i: number) => (
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
        {payload?.message && (
          <section
            className={`mt-4 rounded-3xl border p-5 ${
              isPremium ? "border-white/15 bg-white/5" : "border-gray-200 bg-gray-50"
            }`}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{payload.message}</p>
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

        {/* 5) Token escondido: não renderiza. */}
      </div>
    </main>
  );
}

function TimeCard({ label, value, premium }: { label: string; value: string; premium: boolean }) {
  return (
    <div
      className={`rounded-2xl border px-3 py-3 text-center ${
        premium ? "border-white/15 bg-white/5" : "border-gray-200 bg-white"
      }`}
    >
      <div className={`text-xs font-medium ${premium ? "text-white/70" : "text-gray-500"}`}>{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
