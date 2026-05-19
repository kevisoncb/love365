"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { TimerTile } from "@/components/tribute/TimerTile";
import { HeartsOverlay } from "@/components/tribute/HeartsOverlay";
import { PendingPaymentScreen } from "@/components/tribute/PendingPaymentScreen";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { pad2, diffParts } from "@/lib/date-utils";
import { extractYouTubeId } from "@/lib/youtube";

type Plan = "BASIC" | "PREMIUM";

type PageDTO = {
  token: string;
  plan: Plan;
  names: string;
  date?: string;
  startDate?: string;
  photoUrls?: string[];
  photos?: string[];
  youtubeUrl?: string | null;
  yt?: string | null;
  createdAt?: string;
  status?: string;
};

export default function PublicCouplePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const token = useMemo(() => {
    if (!params?.token) return undefined;
    return Array.isArray(params.token) ? params.token[0] : params.token;
  }, [params?.token]);

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
        status: "APPROVED",
      });
      setLoading(false);
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    let alive = true;
    let timeoutId: ReturnType<typeof setTimeout>;

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
      } catch {
        if (alive) timeoutId = setTimeout(checkStatus, 10000);
      }
    }
    checkStatus();
    return () => {
      alive = false;
      clearTimeout(timeoutId);
    };
  }, [token, searchParams]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const premium = data?.plan === "PREMIUM";

  const photos = useMemo(() => {
    return data?.photoUrls || (data as PageDTO & { photos?: string[] })?.photos || [];
  }, [data]);

  const finalYoutubeUrl = useMemo(() => {
    return data?.youtubeUrl || data?.yt || null;
  }, [data]);

  const startDate = useMemo(() => {
    const s = data?.date || data?.startDate || "";
    if (!s) return new Date();
    try {
      const datePart = s.split("T")[0];
      const [year, month, day] = datePart.split("-").map(Number);
      const d = new Date(year, month - 1, day, 0, 0, 0);
      return isNaN(d.getTime()) ? new Date() : d;
    } catch {
      return new Date();
    }
  }, [data]);

  const total = photos.length;
  const time = useMemo(() => diffParts(startDate, now), [startDate, now]);

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), 4000);
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
    if (Math.abs(delta) > 40) delta < 0 ? next() : prev();
    touchStartX.current = null;
  }

  function tryStartMusic() {
    if (!premium || !finalYoutubeUrl || musicStarted) return;
    const id = extractYouTubeId(finalYoutubeUrl);
    if (!id || !ytIframeRef.current?.contentWindow) return;
    const post = (msg: object) =>
      ytIframeRef.current!.contentWindow!.postMessage(JSON.stringify(msg), "*");
    post({ event: "command", func: "setVolume", args: [100] });
    post({ event: "command", func: "unMute", args: [] });
    post({ event: "command", func: "playVideo", args: [] });
    setMusicStarted(true);
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (apiError) {
    return (
      <main className="love-cinematic-bg flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-2xl text-white">{apiError}</p>
      </main>
    );
  }

  if (!data || (data.status !== "APPROVED" && data.token !== "preview")) {
    return <PendingPaymentScreen />;
  }

  const currentPhoto = total > 0 ? photos[index] : null;
  const ytId = premium && finalYoutubeUrl ? extractYouTubeId(finalYoutubeUrl) : null;

  return (
    <main className="love-cinematic-bg min-h-[100svh]">
      <div className="flex min-h-[100svh] items-center justify-center px-4 py-8 sm:px-6">
        <article className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-[var(--border)] bg-black/40 shadow-2xl premium-glow sm:rounded-[2.25rem]">
          <section
            className="relative"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={tryStartMusic}
          >
            {ytId && (
              <iframe
                ref={ytIframeRef}
                title="Música"
                className="pointer-events-none absolute -left-[9999px] h-px w-px opacity-0"
                src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=0&controls=0&rel=0&playsinline=1&loop=1&playlist=${ytId}&mute=0&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`}
                allow="autoplay; encrypted-media"
              />
            )}

            <div className="relative h-[min(100svh,820px)] overflow-hidden bg-zinc-950 sm:aspect-[9/16] sm:h-auto sm:max-h-[85svh]">
              {currentPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentPhoto}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                  draggable={false}
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-xs uppercase tracking-[0.3em] text-zinc-600">
                  Sua foto
                </span>
              )}

              <span
                className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/85"
                aria-hidden
              />
              <HeartsOverlay enabled={premium} />

              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prev();
                    }}
                    className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-xl text-white backdrop-blur-md transition hover:bg-black/50"
                    aria-label="Foto anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      next();
                    }}
                    className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-xl text-white backdrop-blur-md transition hover:bg-black/50"
                    aria-label="Próxima foto"
                  >
                    ›
                  </button>
                  <ul className="absolute bottom-[11.5rem] left-0 right-0 z-20 flex justify-center gap-1.5">
                    {photos.map((_, i) => (
                      <li key={i}>
                        <span
                          className={`block h-1 rounded-full transition-all ${
                            i === index ? "w-6 bg-[var(--accent)]" : "w-1.5 bg-white/40"
                          }`}
                        />
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {premium && finalYoutubeUrl && !musicStarted && (
                <p className="absolute top-20 left-0 right-0 z-20 text-center text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Toque para iniciar a música
                </p>
              )}

              <header className="absolute inset-x-0 top-0 z-20 px-6 pt-14 text-center sm:pt-12">
                <h1 className="font-display text-4xl font-medium italic text-white drop-shadow-lg sm:text-5xl">
                  {data.names}
                </h1>
              </header>

              <footer className="absolute inset-x-0 bottom-0 z-20 px-5 pb-10 sm:pb-8">
                <ul className="mx-auto grid max-w-md list-none grid-cols-3 gap-2 p-0">
                  <TimerTile label="Anos" value={time.years} premium={premium} />
                  <TimerTile label="Meses" value={time.months} premium={premium} />
                  <TimerTile label="Dias" value={time.days} premium={premium} />
                  <TimerTile label="Horas" value={pad2(time.hours)} premium={premium} />
                  <TimerTile label="Min" value={pad2(time.mins)} premium={premium} />
                  <TimerTile label="Seg" value={pad2(time.secs)} premium={premium} />
                </ul>
              </footer>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
