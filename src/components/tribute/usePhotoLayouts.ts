"use client";

import { useEffect, useState } from "react";

import {
  getPhotoLayoutMode,
  type PhotoLayoutMode,
} from "@/lib/photo-aspect";

/** Pré-carrega dimensões de todas as fotos para troca sem flash de layout */
export function usePhotoLayouts(
  urls: string[]
): Record<string, PhotoLayoutMode> {
  const [layouts, setLayouts] = useState<
    Record<string, PhotoLayoutMode>
  >({});

  useEffect(() => {
    if (!urls.length) {
      setLayouts({});
      return;
    }

    let cancelled = false;

    for (const url of urls) {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        const mode = getPhotoLayoutMode(
          img.naturalWidth,
          img.naturalHeight
        );
        setLayouts((prev) =>
          prev[url] === mode ? prev : { ...prev, [url]: mode }
        );
      };
      img.onerror = () => {
        if (cancelled) return;
        setLayouts((prev) => ({
          ...prev,
          [url]: "square-cover",
        }));
      };
      img.src = url;
    }

    return () => {
      cancelled = true;
    };
  }, [urls.join("|")]);

  return layouts;
}
