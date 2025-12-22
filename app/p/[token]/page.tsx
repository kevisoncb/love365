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
          ? "border-pink-500/30 bg-white/5 shadow-[0_0_30px_rgba(255,47,146,0.25)]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="text-xs text-white/70 tracking-widest">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-white">{value}</div>
    </div>
  );
}

/* ---------------- Premium Effects (SAFE) ---------------- */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  kind: "spark" | "heart";
  rot: number;
  vr: number;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alpha: number,
  rot: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;

  const s = size;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.25);
  ctx.bezierCurveTo(s * 0.5, -s * 0.35, s * 1.2, s * 0.2, 0, s);
  ctx.bezierCurveTo(-s * 1.2, s * 0.2, -s * 0.5, -s * 0.35, 0, s * 0.25);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function usePremiumEffects(enabled: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const phaseRef = useRef<"idle" | "fireworks" | "hearts">("idle");
  const startMsRef = useRef<number>(0);
  const lastHeartSpawnRef = useRef<number>(0);

  // Resize handler (safe)
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Main animation loop (safe)
  useEffect(() => {
    // Always stop if disabled
    if (!enabled || prefersReducedMotion()) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      phaseRef.current = "idle";
      particlesRef.current = [];
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    // If canvas still not mounted, retry on next tick (no crash)
    if (!canvas || !ctx) {
      const retry = requestAnimationFrame(() => {
        // trigger effect rerun by doing nothing; React won't rerun automatically
        // but the next render/paint usually attaches the ref quickly
      });
      return () => cancelAnimationFrame(retry);
    }

    phaseRef.current = "fireworks";
    startMsRef.current = performance.now();
    lastHeartSpawnRef.current = 0;
    particlesRef.current = [];

    function spawnFireworkBurst() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = rand(w * 0.2, w * 0.8);
      const cy = rand(h * 0.15, h * 0.45);
      const count = Math.floor(rand(55, 85));

      for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count + rand(-0.06, 0.06);
        const spd = rand(2.2, 5.2);
        particlesRef.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: rand(32, 56),
          size: rand(1.1, 2.2),
          kind: "spark",
          rot: rand(0, Math.PI * 2),
          vr: rand(-0.12, 0.12),
        });
      }
    }

    function spawnHeartsBatch() {
      const w = window.innerWidth;
      for (let i = 0; i < 2; i++) {
        particlesRef.current.push({
          x: rand(40,w - 40),
          y: -80,
          vx: rand(-0.35, 0.35),
          vy: rand(0.9, 1.7),
          life: 0,
          maxLife: rand(260, 420),
          size: rand(7, 13),
          kind: "heart",
          rot: rand(-0.6, 0.6),
          vr: rand(-0.01, 0.01),
        });
      }
    }

    // Bursts iniciais
    spawnFireworkBurst();
    setTimeout(spawnFireworkBurst, 240);
    setTimeout(spawnFireworkBurst, 520);

    function tick(ms: number) {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const elapsed = ms - startMsRef.current;

      // troca para hearts
      if (phaseRef.current === "fireworks" && elapsed > 1400) {
        phaseRef.current = "hearts";
      }

      // spawn hearts (throttle)
      if (phaseRef.current === "hearts") {
        if (ms - lastHeartSpawnRef.current > 90) {
          spawnHeartsBatch();
          lastHeartSpawnRef.current = ms;
        }
      }

      // update/draw particles
      const next: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        if (p.kind === "spark") {
          p.vy += 0.06;
          const t = p.life / p.maxLife;
          const alpha = Math.max(0, 1 - t);
          ctx.fillStyle = `rgba(255,47,146,${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const t = p.life / p.maxLife;
          const alpha = Math.max(0, 0.9 - t);

          p.vx += rand(-0.01, 0.01);
          p.vx = Math.max(-0.8, Math.min(0.8, p.vx));
          p.x += p.vx;

          ctx.fillStyle = `rgba(255,47,146,${alpha})`;
          drawHeart(ctx, p.x, p.y, p.size, alpha, p.rot);
        }

        const alive =
          p.life < p.maxLife && p.y < h + 60 && p.x > -80 && p.x < w + 80;
        if (alive) next.push(p);
      }
      particlesRef.current = next;

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      phaseRef.current = "idle";
      particlesRef.current = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [enabled]);

  return { canvasRef };
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

  // premium toggle
  const [effectsOn, setEffectsOn] = useState(true);

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

  // autoplay
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

  // effects hook (premium-only)
  const { canvasRef } = usePremiumEffects(premium && effectsOn);

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

  return (
    <main className="min-h-screen text-white bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(255,47,146,0.18),transparent_60%),radial-gradient(900px_500px_at_80%_20%,rgba(139,92,246,0.16),transparent_55%),linear-gradient(#0B0B10,#0B0B10)]">
      {/* Premium overlay */}
      {premium && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-50"
          aria-hidden="true"
        />
      )}

      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center gap-6">
          {/* Controls */}
          <div className="w-full max-w-md flex justify-end">
          </div>

          {/* Nome */}
          <header className="text-center">
            <h1 className="text-3xl font-semibold">{data.names}</h1>
            <p className="mt-2 text-sm text-white/70">
              Juntos desde {startDate.toLocaleDateString("pt-BR")}
            </p>
          </header>

          {/* Baralho */}
          <section
            className={`relative w-full max-w-md h-80 rounded-3xl overflow-hidden border ${
              premium
                ? "border-pink-500/30 shadow-[0_0_50px_rgba(255,47,146,0.35)]"
                : "border-white/10"
            } bg-white/5`}
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
                      transform: `translate(${pos * 14}px, ${pos * 10}px) scale(${1 - pos * 0.06}) rotate(${pos === 0 ? 0 : pos === 1 ? -3 : 3}deg)`,
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white"
                  aria-label="Anterior"
                >
                  ‹
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white"
                  aria-label="Próxima"
                >
                  ›
                </button>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs bg-black/60 text-white">
                  {index + 1}/{total}
                </div>
              </>
            )}
          </section>

          {/* Mensagem */}
          {data.message && data.message.trim() && (
            <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-5 text-center">
              <p className="text-sm text-white/90 whitespace-pre-wrap">
                {data.message}
              </p>
            </section>
          )}

          {/* Contador */}
          <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-sm font-semibold mb-3 text-center tracking-widest">
              TEMPO JUNTOS
            </h2>
            <div className="grid grid-cols-4 gap-2">
              <TimeBox label="DIAS" value={time.days} premium={premium} />
              <TimeBox label="HORAS" value={pad2(time.hours)} premium={premium} />
              <TimeBox label="MIN" value={pad2(time.mins)} premium={premium} />
              <TimeBox label="SEG" value={pad2(time.secs)} premium={premium} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
