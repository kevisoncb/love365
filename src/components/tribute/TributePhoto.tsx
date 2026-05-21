"use client";

import { useEffect, useState } from "react";

import {
  getPhotoLayoutMode,
  getPhotoObjectClasses,
  isLandscapeMode,
  type PhotoLayoutMode,
} from "@/lib/photo-aspect";

type TributePhotoProps = {
  src: string;
  layoutMode?: PhotoLayoutMode;
  alt?: string;
};

export function TributePhoto({
  src,
  layoutMode: layoutModeProp,
  alt = "",
}: TributePhotoProps) {
  const [layoutMode, setLayoutMode] = useState<PhotoLayoutMode | null>(
    layoutModeProp ?? null
  );

  useEffect(() => {
    setLayoutMode(layoutModeProp ?? null);
  }, [src, layoutModeProp]);

  const handleLoad = (
    e: React.SyntheticEvent<HTMLImageElement>
  ) => {
    const img = e.currentTarget;
    setLayoutMode(
      getPhotoLayoutMode(img.naturalWidth, img.naturalHeight)
    );
  };

  const mode = layoutMode ?? "square-cover";
  const landscape = isLandscapeMode(mode);
  const ready = layoutMode !== null;
  const objectClasses = getPhotoObjectClasses(mode);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {landscape && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-[1.15] object-cover blur-3xl brightness-[0.4] saturate-[1.25] opacity-90"
            draggable={false}
          />
          <span
            className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/40 to-zinc-950/90"
            aria-hidden
          />
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={alt}
        onLoad={handleLoad}
        draggable={false}
        className={`absolute inset-0 h-full w-full transition-all duration-700 ease-out ${objectClasses} ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
