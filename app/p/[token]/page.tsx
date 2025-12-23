"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

type Plan = "BASIC" | "PREMIUM";

type PageDTO = {
  token: string;
  plan: Plan;
  names: string;
  startDate: string;
  photos: string[];
  yt?: string | null; // id ou link do youtube
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

/* ---------------- YouTube helpers ---------------- */

function extractYouTubeId(input?: string | null): string | null {
  if (!input) return null;
  const s = input.trim();

  // Se já parece um ID (11 chars típicos)
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;

  // Tenta pegar v=... ou youtu.be/...
  try {
    const url = new URL(s);
    // youtu.be/<id>
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    // youtube.com/watch?v=<id>
    const v = url.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

    // youtube.com/embed/<id>
    const parts = url.pathname.split("/").filter(Boolean);
    const embedIdx = parts.indexOf("embed");
    if (embedIdx >= 0 && parts[embedIdx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[embedIdx + 1])) {
      return parts[embedIdx + 1];
    }
  } catch {
    // não é URL válida, cai fora
  }
  return null;
}

/**
 * Player invisível: carrega o vídeo mutado e em loop.
 * Quando o usuário tocar/clique na página, tentamos unmute + play via postMessage.
 */
function YouTubeBackgroundAudio({
  enabled,
  youtubeId,
}: {
  enabled: boolean;
  youtubeId: string | null;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    if (!enabled || !youtubeId) return;

    // Mostra o aviso: precisa de 1 interação para sair do mute
    setNeedsTap(true);

    const tryEnableSound = () => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;

      // Tenta comandar o player do YouTube (enablejsapi=1)
      // 1) unmute 2) set volume 3) play
      const cmds = [
        { event: "command", func: "unMute", args: [] },
        { event: "command", func: "setVolume", args: [70] },
        { event: "command", func: "playVideo", args: [] },
      ];

      for (const c of cmds) {
        iframe.contentWindow.postMessage(JSON.stringify({ ...c }), "*");
      }

      // Esconde o aviso após a interação
      setNeedsTap(false);

      // Remove listeners (1 toque só)
      window.removeEventListener("pointerdown", tryEnableSound);
      window.removeEventListener("touchstart", tryEnableSound);
      window.removeEventListener("click", tryEnableSound);
    };

    // “Primeira interação” em qualquer lugar da página
    window.addEventListener("pointerdown", tryEnableSound, { once: true });
    window.addEventListener("touchstart", tryEnableSound, { once: true });
    window.addEventListener("click", tryEnableSound, { once: true });

    return () => {
      window.removeEventListener("pointerdown", tryEnableSound);
      window.removeEventListener("touchstart", tryEnableSound);
      window.removeEventListener("click", tryEnableSound);
    };
  }, [enabled, youtubeId]);

  if (!enabled || !youtubeId) return null;

  // Autoplay mutado + loop
  const src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`;

  return (
    <>
      {/* iframe invisível (só áudio) */}
      <iframe
        ref={iframeRef}
        title="Love365 Music"
        src={src}
        className="fixed -left-[9999px] -top-[9999px] w-[1px] h-[1px] opacity-0 pointer-events-none"
        allow="autoplay; encrypted-media"
      />

      {/* aviso minimalista (some depois do 1º toque) */}
      {needsTap && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full border border-white/10 bg-black/55 text-xs text-white/80 backdrop-blur-md">
          Toque na tela para ativar a música
        </div>
      )}
    </>
  );
}

/* ---------------- Hearts Overlay (scoped to hero) ---------------- */

type HeartSpec = {
  id: string;
  leftPct: number;
  sizePx: number;
  durationSec: number;
  negativeDelaySec: number;
  driftPx: number;
  opacity: number;
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function buildHearts(count: number): HeartSpec[] {
  return Array.from({ length: count }).map((_, i) => {
    const durationSec = rand(7, 13);
    return {
      id: `${Date.now()}-${i}-${Math.random().toString(16).slice(2)}`,
      leftPct: rand(0, 100),
      sizePx: rand(10, 18),
      durationSec,
      negativeDelaySec: -rand(0, durationSec),
      driftPx: rand(-45, 45),
      opacity: rand(0.35, 0.9),
    };
  });
}

function HeartsOverlayInHero({ enabled }: { enabled: boolean }) {
  const [hearts, setHearts] = useState<HeartSpec[]>([]);

  useEffect(() => {
    if (!enabled) {
      setHearts([]);
      return;
    }
    setHearts(buildHearts(55));
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes love365-fall-hero {
          0% {
            transform: translate3d(var(--drift), -12vh, 0) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: var(--op);
          }
          100% {
            transform: translate3d(calc(var(--drift) * -1), 110vh, 0) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {hearts.map((h) => (
          <span
            key={h.id}
            className="absolute top-0 select-none"
            style={
              {
                left: `${h.leftPct}%`,
                fontSize: `${h.sizePx}px`,
                animationName: "love365-fall-hero",
                animationDuration: `${h.durationSec}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationDelay: `${h.negativeDelaySec}s`,
                ["--drift" as any]: `${h.driftPx}px`,
                ["--op" as any]: h.opacity,
                color: "rgb(244,63,94)",
                filter: "drop-shadow(0 0 6px rgba(244,63,94,0.35))",
                willChange: "transform, opacity",
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

/* ---------------- Timer Tile (refined) ---------------- */

function TimerTile({
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
      className={[
        "rounded-2xl px-3 py-3 text-center backdrop-blur-md",
        "border",
        premium
          ? "border-rose-300/25 bg-white/12 shadow-[0_0_30px_rgba(244,63,94,0.10)]"
          : "border-white/10 bg-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
      ].join(" ")}
    >
      <div className="text-[10px] text-white/65 tracking-[0.25em] uppercase">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</div>
    </div>
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

  // carrossel
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

  const ytId = useMemo(() => extractYouTubeId(data?.yt ?? null), [data?.yt]);

  const startDate = useMemo(() => {
    const s = data?.startDate || "";
    const d = new Date(s ? s + "T00:00:00" : Date.now());
    return isNaN(d.getTime()) ? new Date() : d;
  }, [data?.startDate]);

  const time = useMemo(() => diffParts(startDate, now), [startDate, now]);

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
      <main className="min-h-[100svh] flex items-center justify-center bg-[#0B0B10] text-white">
        <p className="text-sm text-white/70">Carregando…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-[100svh] flex items-center justify-center bg-[#0B0B10] text-white">
        <div className="text-center px-4">
          <h1 className="text-xl font-semibold">Página não encontrada</h1>
          <p className="mt-2 text-sm text-white/70">{apiError}</p>
        </div>
      </main>
    );
  }

  const currentPhoto = total > 0 ? photos[index] : null;

  return (
    <main className="bg-[#0B0B10] text-white min-h-[100svh]">
      {/* Música: SOMENTE Premium e somente se tiver ID/link válido */}
      <YouTubeBackgroundAudio enabled={premium && !!ytId} youtubeId={ytId} />

      <div className="mx-auto w-full max-w-xl sm:px-4 sm:py-10">
        <div className="relative sm:rounded-[36px] sm:border sm:border-white/10 sm:bg-white/5 sm:shadow-[0_30px_90px_rgba(0,0,0,0.55)] overflow-hidden">
          <section className="relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className="relative h-[100svh] sm:h-[560px] overflow-hidden">
              {currentPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentPhoto}
                  alt="Foto do casal"
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70 bg-white/5">
                  Sem fotos
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/75 z-[1]" />

              <HeartsOverlayInHero enabled={premium} />

              {total > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 text-white border border-white/10 z-20"
                    aria-label="Anterior"
                  >
                    ‹
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 text-white border border-white/10 z-20"
                    aria-label="Próxima"
                  >
                    ›
                  </button>
                </>
              )}

              <div className="absolute inset-x-0 top-0 pt-14 sm:pt-12 px-6 z-20 text-center">
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
                  {data.names}
                </h1>
              </div>

              <div className="absolute inset-x-0 bottom-0 pb-9 sm:pb-10 px-6 z-20">
                <div className="mx-auto max-w-md">
                  <div className="grid grid-cols-3 gap-2.5">
                    <TimerTile label="ANOS" value={Math.floor(time.days / 365)} premium={premium} />
                    <TimerTile label="MESES" value={Math.floor((time.days % 365) / 30)} premium={premium} />
                    <TimerTile label="DIAS" value={time.days} premium={premium} />

                    <TimerTile label="HORAS" value={pad2(time.hours)} premium={premium} />
                    <TimerTile label="MINUTOS" value={pad2(time.mins)} premium={premium} />
                    <TimerTile label="SEGUNDOS" value={pad2(time.secs)} premium={premium} />
                  </div>

                  {total > 1 && (
                    <div className="mt-3 text-center text-xs text-white/60">
                      {index + 1}/{total}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
