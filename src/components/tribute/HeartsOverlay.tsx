"use client";

import { useEffect, useState } from "react";

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

export function HeartsOverlay({ enabled }: { enabled: boolean }) {
  const [hearts, setHearts] = useState<HeartSpec[]>([]);

  useEffect(() => {
    if (!enabled) {
      setHearts([]);
      return;
    }
    setHearts(buildHearts(48));
  }, [enabled]);

  if (!enabled) return null;

  return (
    <span className="absolute inset-0 pointer-events-none z-10 overflow-hidden" aria-hidden>
      {hearts.map((h) => (
        <span
          key={h.id}
          className="absolute top-0 select-none"
          style={{
            left: `${h.leftPct}%`,
            fontSize: `${h.sizePx}px`,
            animation: `love-fall ${h.durationSec}s linear infinite`,
            animationDelay: `${h.negativeDelaySec}s`,
            ["--drift" as string]: `${h.driftPx}px`,
            ["--op" as string]: h.opacity,
            color: "var(--accent)",
            filter: "drop-shadow(0 0 8px var(--glow))",
            willChange: "transform, opacity",
          }}
        >
          ♥
        </span>
      ))}
    </span>
  );
}
