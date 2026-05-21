"use client";



import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useParams, useSearchParams } from "next/navigation";

import { TimerTile } from "@/components/tribute/TimerTile";

import { HeartsOverlay } from "@/components/tribute/HeartsOverlay";

import { PendingPaymentScreen } from "@/components/tribute/PendingPaymentScreen";
import { TributePhoto } from "@/components/tribute/TributePhoto";
import { TributeShareActions } from "@/components/tribute/TributeShareActions";
import { usePhotoLayouts } from "@/components/tribute/usePhotoLayouts";

import { TributePageSkeleton } from "@/components/ui/Skeleton";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

import { pad2, diffParts } from "@/lib/date-utils";

import { extractYouTubeId } from "@/lib/youtube";

import { isPaidPageStatus } from "@/lib/page-status";

import {
  AnalyticsEvents,
  FunnelEvents,
  trackEvent,
} from "@/lib/analytics";
import { toUserFacingMessage } from "@/lib/client-errors";
import { clientFetch } from "@/lib/client-fetch";



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

  paid?: boolean;

};



const POLL_MS_INITIAL = 4000;

const POLL_MS_STEADY = 8000;

const SYNC_EVERY_N_POLLS = 4;

const MAX_POLL_ATTEMPTS = 90;



function isPageUnlocked(data: PageDTO | null): boolean {

  if (!data) return false;

  if (data.token === "preview") return true;

  if (data.paid === true) return true;

  return isPaidPageStatus(data.status);

}



export default function PublicCouplePage() {

  const params = useParams();

  const searchParams = useSearchParams();



  const token = useMemo(() => {

    if (!params?.token) return undefined;

    return Array.isArray(params.token)

      ? params.token[0]

      : params.token;

  }, [params?.token]);



  const [data, setData] = useState<PageDTO | null>(null);

  const [loading, setLoading] = useState(true);

  const [apiError, setApiError] = useState<string | null>(null);

  const [pollAttempt, setPollAttempt] = useState(0);

  const [syncing, setSyncing] = useState(false);

  const [now, setNow] = useState<Date | null>(null);

  const [index, setIndex] = useState(0);

  const touchStartX = useRef<number | null>(null);

  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  const [musicStarted, setMusicStarted] = useState(false);

  const [shareUrl, setShareUrl] = useState("");

  const pollAttemptRef = useRef(0);
  const tributeTrackedRef = useRef(false);
  const pendingTrackedRef = useRef(false);
  const paidTrackedRef = useRef(false);
  const pollStoppedRef = useRef(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);



  useEffect(() => {

    if (

      token?.startsWith("preview") ||

      searchParams.get("preview") === "true"

    ) {

      setData({

        token: "preview",

        plan:

          (searchParams.get("plan") as Plan) || "BASIC",

        names:

          searchParams.get("names") || "Exemplo Casal",

        date:

          searchParams.get("date") || "2024-01-01",

        photoUrls: [],

        youtubeUrl: searchParams.get("yt"),

        status: "PAID",

        paid: true,

      });

      setLoading(false);

      return;

    }



    if (!token) {

      setLoading(false);

      return;

    }



    let alive = true;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;



    const fetchPage = async (): Promise<PageDTO | null> => {

      const res = await clientFetch(

        `/api/pages/${token}?_t=${Date.now()}`,

        { cache: "no-store" }

      );

      const json = (await res.json()) as PageDTO & {

        error?: string;

      };

      if (!res.ok) {

        throw new Error(

          json?.error || "Erro ao buscar página"

        );

      }

      return json;

    };



    const syncPayment = async (): Promise<boolean> => {

      try {

        const res = await clientFetch(

          `/api/pages/${token}/sync-payment`,

          {

            method: "POST",

            cache: "no-store",

          }

        );

        const json = await res.json();

        return Boolean(json?.paid || json?.updated);

      } catch {

        return false;

      }

    };



    const runPoll = async (options?: {

      forceSync?: boolean;

    }) => {

      if (!alive || pollStoppedRef.current) return;



      pollAttemptRef.current += 1;

      const attempt = pollAttemptRef.current;

      setPollAttempt(attempt);

      if (attempt > MAX_POLL_ATTEMPTS) {
        pollStoppedRef.current = true;
        setPollTimedOut(true);
        setLoading(false);
        return;
      }



      const shouldSync =

        options?.forceSync ||

        attempt === 1 ||

        attempt % SYNC_EVERY_N_POLLS === 0;



      if (shouldSync) {

        setSyncing(true);

        await syncPayment();

        if (!alive) return;

        setSyncing(false);

      }



      try {

        const json = await fetchPage();

        if (!alive || !json) return;



        setData(json);

        setApiError(null);

        setLoading(false);

        if (
          isPageUnlocked(json) &&
          json.token !== "preview" &&
          !tributeTrackedRef.current
        ) {
          tributeTrackedRef.current = true;
          trackEvent(AnalyticsEvents.TRIBUTE_OPENED, {
            token: json.token,
            plan: json.plan,
          });
        }

        if (!isPageUnlocked(json)) {
          if (!pendingTrackedRef.current) {
            pendingTrackedRef.current = true;
            trackEvent(FunnelEvents.PAYMENT_PENDING, {
              token: json.token,
              plan: json.plan,
            });
          }

          const delay =

            attempt <= 2

              ? POLL_MS_INITIAL

              : POLL_MS_STEADY;

          timeoutId = setTimeout(

            () => runPoll(),

            delay

          );

        } else if (!paidTrackedRef.current) {
          paidTrackedRef.current = true;
          trackEvent(FunnelEvents.PAYMENT_APPROVED, {
            token: json.token,
            plan: json.plan,
          });
        }

      } catch (err: unknown) {

        if (!alive) return;

        setApiError(toUserFacingMessage(err));

        setLoading(false);

        timeoutId = setTimeout(

          () => runPoll(),

          10000

        );

      }

    };



    const returnedFromPayment =

      searchParams.get("paid") === "1" ||

      searchParams.get("status") === "paid";



    runPoll({ forceSync: returnedFromPayment });



    return () => {

      alive = false;

      if (timeoutId) clearTimeout(timeoutId);

    };

  }, [token, searchParams]);



  const handleManualRefresh = useCallback(async () => {

    if (!token || token.startsWith("preview")) {

      return;

    }



    setSyncing(true);

    pollAttemptRef.current += 1;

    setPollAttempt(pollAttemptRef.current);



    try {

      await clientFetch(`/api/pages/${token}/sync-payment`, {

        method: "POST",

        cache: "no-store",

      });

      const res = await clientFetch(

        `/api/pages/${token}?_t=${Date.now()}`,

        { cache: "no-store" }

      );

      const json = (await res.json()) as PageDTO;

      if (res.ok) {

        setData(json);

        setApiError(null);

      }

    } catch {

      /* polling continua */

    } finally {

      setSyncing(false);

    }

  }, [token]);



  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, [token]);



  const premium = data?.plan === "PREMIUM";



  const photos = useMemo(() => {

    return (

      data?.photoUrls ||

      (data as PageDTO & { photos?: string[] })

        ?.photos ||

      []

    );

  }, [data]);

  const photoLayouts = usePhotoLayouts(photos);

  const finalYoutubeUrl = useMemo(() => {

    return data?.youtubeUrl || data?.yt || null;

  }, [data]);



  const startDate = useMemo(() => {

    const s = data?.date || data?.startDate || "";

    if (!s) return new Date();

    try {

      const datePart = s.split("T")[0];

      const [year, month, day] = datePart

        .split("-")

        .map(Number);

      const d = new Date(

        year,

        month - 1,

        day,

        0,

        0,

        0

      );

      return isNaN(d.getTime()) ? new Date() : d;

    } catch {

      return new Date();

    }

  }, [data]);



  const total = photos.length;

  const time = useMemo(

    () => diffParts(startDate, now ?? startDate),

    [startDate, now]

  );



  useEffect(() => {

    if (total <= 1) return;

    const id = setInterval(

      () => setIndex((i) => (i + 1) % total),

      4000

    );

    return () => clearInterval(id);

  }, [total]);



  const next = () =>

    total > 1 && setIndex((i) => (i + 1) % total);

  const prev = () =>

    total > 1 &&

    setIndex((i) => (i - 1 + total) % total);



  function onTouchStart(e: React.TouchEvent) {

    touchStartX.current =

      e.touches[0]?.clientX ?? null;

  }

  function onTouchEnd(e: React.TouchEvent) {

    if (touchStartX.current === null || total <= 1)

      return;

    const endX =

      e.changedTouches[0]?.clientX ??

      touchStartX.current;

    const delta = endX - touchStartX.current;

    if (Math.abs(delta) > 40)

      delta < 0 ? next() : prev();

    touchStartX.current = null;

  }



  function tryStartMusic() {

    if (!premium || !finalYoutubeUrl || musicStarted)

      return;

    const id = extractYouTubeId(finalYoutubeUrl);

    if (!id || !ytIframeRef.current?.contentWindow)

      return;

    const post = (msg: object) =>

      ytIframeRef.current!.contentWindow!.postMessage(

        JSON.stringify(msg),

        "*"

      );

    post({ event: "command", func: "setVolume", args: [100] });

    post({ event: "command", func: "unMute", args: [] });

    post({ event: "command", func: "playVideo", args: [] });

    setMusicStarted(true);

  }

  const trackShare = useCallback(() => {
    if (!data?.token) return;
    trackEvent(FunnelEvents.TRIBUTE_SHARED, {
      token: data.token,
      plan: data.plan,
    });
  }, [data?.token, data?.plan]);

  if (loading) return <TributePageSkeleton />;



  if (apiError) {

    return (

      <main className="love-cinematic-bg flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">

        <p className="font-display text-2xl text-white">

          {apiError}

        </p>

      </main>

    );

  }



  if (!isPageUnlocked(data)) {

    return (

      <PendingPaymentScreen

        token={token}

        pollAttempt={pollAttempt}

        syncing={syncing}

        timedOut={pollTimedOut}

        onRefresh={handleManualRefresh}

      />

    );

  }



  if (!data) {

    return <LoadingScreen />;

  }



  const currentPhoto = total > 0 ? photos[index] : null;

  const ytId =

    premium && finalYoutubeUrl

      ? extractYouTubeId(finalYoutubeUrl)

      : null;



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



            <div className="relative h-[min(92svh,780px)] min-h-[480px] overflow-hidden bg-zinc-950 sm:aspect-[9/16] sm:h-auto sm:max-h-[85svh]">

              {currentPhoto ? (

                <TributePhoto

                  src={currentPhoto}

                  layoutMode={photoLayouts[currentPhoto]}

                  alt={data.names}

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

                  <ul className="absolute bottom-[15.5rem] left-0 right-0 z-20 flex justify-center gap-1.5 sm:bottom-[14.5rem]">

                    {photos.map((_, i) => (

                      <li key={i}>

                        <span

                          className={`block h-1 rounded-full transition-all ${

                            i === index

                              ? "w-6 bg-[var(--accent)]"

                              : "w-1.5 bg-white/40"

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



              <footer className="absolute inset-x-0 bottom-0 z-20 px-5 pb-8 pt-2 sm:pb-7">

                <ul className="mx-auto grid max-w-md list-none grid-cols-3 gap-2 p-0">

                  <TimerTile

                    label="Anos"

                    value={time.years}

                    premium={premium}

                  />

                  <TimerTile

                    label="Meses"

                    value={time.months}

                    premium={premium}

                  />

                  <TimerTile

                    label="Dias"

                    value={time.days}

                    premium={premium}

                  />

                  <TimerTile

                    label="Horas"

                    value={pad2(time.hours)}

                    premium={premium}

                  />

                  <TimerTile

                    label="Min"

                    value={pad2(time.mins)}

                    premium={premium}

                  />

                  <TimerTile

                    label="Seg"

                    value={pad2(time.secs)}

                    premium={premium}

                  />

                </ul>

                {shareUrl && (
                  <div
                    className="mx-auto max-w-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TributeShareActions
                      names={data.names}
                      shareUrl={shareUrl}
                      onShared={trackShare}
                    />
                  </div>
                )}

              </footer>

            </div>

          </section>

        </article>

      </div>

    </main>

  );

}

