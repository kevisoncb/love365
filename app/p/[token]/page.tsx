"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type Plan = "BASIC" | "PREMIUM";

type PageDTO = {
  token: string;
  plan: Plan;
  names: string;
  date?: string; 
  startDate?: string; // Compatibilidade antigo
  photoUrls?: string[]; 
  photos?: string[]; // Compatibilidade antigo
  youtubeUrl?: string | null; 
  yt?: string | null; // Compatibilidade antigo
  createdAt?: string;
  status?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function diffParts(from: Date, to: Date) {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(to.getFullYear(), to.getMonth(), 0);
    days += lastMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const diffMs = Math.max(0, to.getTime() - from.getTime());
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diffMs / (1000 * 60)) % 60);
  const secs = Math.floor((diffMs / 1000) % 60);

  return { years, months, days, hours, mins, secs };
}

function extractYouTubeId(input: string): string | null {
  const s = (input || "").trim();
  if (!s) return null;
  if (!s.includes("http") && /^[a-zA-Z0-9_-]{11}$/.test(s)) return s;

  try {
    const url = new URL(s);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "").trim();
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    const v = url.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "shorts" || p === "embed");
    if (idx >= 0 && parts[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[idx + 1])) {
      return parts[idx + 1];
    }
    return null;
  } catch {
    return null;
  }
}

/* ---------------- Hearts Overlay ---------------- */

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
          0% { transform: translate3d(var(--drift), -12vh, 0) rotate(0deg); opacity: 0; }
          12% { opacity: var(--op); }
          100% { transform: translate3d(calc(var(--drift) * -1), 110vh, 0) rotate(360deg); opacity: 0; }
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {hearts.map((h) => (
          <span
            key={h.id}
            className="absolute top-0 select-none"
            style={{
              left: `${h.leftPct}%`,
              fontSize: `${h.sizePx}px`,
              animationName: "love365-fall-hero",
              animationDuration: `${h.durationSec}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              animationDelay: `${h.negativeDelaySec}s`,
              "--drift": `${h.driftPx}px`,
              "--op": h.opacity,
              color: "rgb(244,63,94)",
              filter: "drop-shadow(0 0 6px rgba(244,63,94,0.35))",
              willChange: "transform, opacity",
            } as any}
            aria-hidden="true"
          >
            ♥
          </span>
        ))}
      </div>
    </>
  );
}

/* ---------------- Timer Tile ---------------- */

function TimerTile({ label, value, premium }: { label: string; value: number | string; premium: boolean }) {
  return (
    <div className={[
        "rounded-2xl px-3 py-3 text-center backdrop-blur-md border",
        premium ? "border-rose-300/25 bg-white/12 shadow-[0_0_30px_rgba(244,63,94,0.10)]" : "border-white/10 bg-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
      ].join(" ")}>
      <div className="text-[10px] text-white/65 tracking-[0.25em] uppercase">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</div>
    </div>
  );
}

/* ---------------- Main Page ---------------- */

export default function PublicCouplePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = (Array.isArray(params?.token) ? params.token[0] : params?.token) as string | undefined;

  const [data, setData] = useState<PageDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [musicStarted, setMusicStarted] = useState(false);

  useEffect(() => {
    if (token?.startsWith("preview") || searchParams.get("preview") === "true") {
      setData({
        token: "preview",
        plan: (searchParams.get("plan") as Plan) || "BASIC",
        names: searchParams.get("names") || "Exemplo Casal",
        date: searchParams.get("date") || "2024-01-01",
        photoUrls: [], 
        youtubeUrl: searchParams.get("yt"),
        status: "APPROVED"
      });
      setLoading(false);
      return;
    }

    if (!token) {
      setLoading(false);
      setApiError("Token ausente.");
      return;
    }

    let alive = true;
    let timeoutId: NodeJS.Timeout;

    async function checkStatus() {
      try {
        const res = await fetch(`/api/pages/${token}`, { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        if (!res.ok) {
          setApiError(json?.error || "Erro ao buscar página");
          setLoading(false);
          return;
        }
        setData(json);
        setLoading(false);
        if (json.status !== "APPROVED") {
          timeoutId = setTimeout(checkStatus, 5000);
        }
      } catch (err) {
        if (alive) timeoutId = setTimeout(checkStatus, 10000);
      }
    }
    checkStatus();
    return () => { alive = false; clearTimeout(timeoutId); };
  }, [token, searchParams]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // --- LÓGICA DE COMPATIBILIDADE ---
  const premium = data?.plan === "PREMIUM";
  const photos = useMemo(() => data?.photoUrls || data?.photos || [], [data]);
  const finalYoutubeUrl = useMemo(() => data?.youtubeUrl || data?.yt || null, [data]);
  const startDate = useMemo(() => {
    const s = data?.date || data?.startDate || ""; 
    const d = new Date(s ? s + "T00:00:00" : Date.now());
    return isNaN(d.getTime()) ? new Date() : d;
  }, [data]);

  const total = photos.length;
  const time = useMemo(() => diffParts(startDate, now), [startDate, now]);

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), 3000);
    return () => clearInterval(id);
  }, [total]);

  const next = () => total > 1 && setIndex((i) => (i + 1) % total);
  const prev = () => total > 1 && setIndex((i) => (i - 1 + total) % total);

  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0]?.clientX ?? null; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || total <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    if (Math.abs(delta) > 40) delta < 0 ? next() : prev();
    touchStartX.current = null;
  }

  function tryStartMusic() {
    if (!premium || !finalYoutubeUrl || musicStarted) return; 
    const id = extractYouTubeId(finalYoutubeUrl);
    if (!id || !ytIframeRef.current?.contentWindow) return;
    const post = (msg: any) => ytIframeRef.current!.contentWindow!.postMessage(JSON.stringify(msg), "*");
    post({ event: "command", func: "setVolume", args: [100] });
    post({ event: "command", func: "unMute", args: [] });
    post({ event: "command", func: "playVideo", args: [] });
    setMusicStarted(true);
  }

  if (loading) return <main className="min-h-[100svh] flex items-center justify-center bg-[#FDFCFB] text-red-600 font-bold">Carregando...</main>;
  
  if (!data || (data.status !== "APPROVED" && data.token !== "preview")) {
    return (
      <main className="min-h-[100svh] flex flex-col items-center justify-center bg-[#FDFCFB] text-center p-6">
        <div className="animate-bounce mb-4 text-5xl">❤️</div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">Quase lá!</h1>
        <p className="text-gray-500 max-w-xs">Estamos aguardando a confirmação do seu pagamento...</p>
      </main>
    );
  }

  const currentPhoto = total > 0 ? photos[index] : null;
  const ytId = premium && finalYoutubeUrl ? extractYouTubeId(finalYoutubeUrl) : null;

  return (
    <main className="bg-[#FDFCFB] min-h-[100svh]">
      <div className="min-h-[100svh] sm:flex sm:items-center sm:justify-center sm:px-6 sm:py-10">
        <div className="w-full sm:w-auto">
          <div className="relative sm:rounded-[36px] sm:border sm:border-gray-200 sm:bg-white sm:shadow-2xl overflow-hidden">
            <section className="relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClick={tryStartMusic}>
              {ytId && (
                <iframe
                  ref={ytIframeRef}
                  className="absolute -left-[9999px] -top-[9999px] w-[1px] h-[1px] opacity-0"
                  src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=0&controls=0&rel=0&playsinline=1&loop=1&playlist=${ytId}&mute=0&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`}
                  allow="autoplay; encrypted-media"
                />
              )}

              <div className="relative h-[100svh] sm:aspect-[9/16] sm:h-[720px] overflow-hidden bg-gray-100">
                {currentPhoto ? (
                  <img src={currentPhoto} alt="Foto" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-300 text-[10px] uppercase tracking-widest text-center px-4">
                    Sua foto aparecerá aqui
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 z-[1]" />
                <HeartsOverlayInHero enabled={premium} />

                {total > 1 && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 text-white z-20">‹</button>
                    <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 text-white z-20">›</button>
                  </>
                )}

                <div className="absolute inset-x-0 top-0 pt-14 sm:pt-10 px-6 z-20 text-center text-white">
                  <h1 className="text-4xl sm:text-5xl font-bold drop-shadow-md italic">{data.names}</h1>
                </div>

                <div className="absolute inset-x-0 bottom-0 pb-12 sm:pb-8 px-6 z-20">
                  <div className="mx-auto max-w-md">
                    <div className="grid grid-cols-3 gap-2.5">
                      <TimerTile label="ANOS" value={time.years} premium={premium} />
                      <TimerTile label="MESES" value={time.months} premium={premium} />
                      <TimerTile label="DIAS" value={time.days} premium={premium} />
                      <TimerTile label="HORAS" value={pad2(time.hours)} premium={premium} />
                      <TimerTile label="MIN" value={pad2(time.mins)} premium={premium} />
                      <TimerTile label="SEG" value={pad2(time.secs)} premium={premium} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}