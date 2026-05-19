"use client";

type PhotoUploaderProps = {
  previews: string[];
  maxPhotos: number;
  uploading: boolean;
  onPick: (files: FileList | null) => void;
  onRemove: (index: number) => void;
};

export function PhotoUploader({ previews, maxPhotos, uploading, onPick, onRemove }: PhotoUploaderProps) {
  const slots = Array.from({ length: maxPhotos }, (_, i) => previews[i] ?? null);

  return (
    <fieldset className="space-y-4 border-0 p-0" disabled={uploading}>
      <ul className="grid list-none grid-cols-3 gap-2.5 p-0 sm:grid-cols-4">
        {slots.map((src, i) => (
          <li key={i}>
            {src ? (
              <figure className="group relative aspect-square overflow-hidden rounded-2xl border border-[var(--border)] bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="absolute inset-0 flex items-center justify-center bg-black/55 text-[10px] font-semibold uppercase tracking-wider text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                >
                  Remover
                </button>
              </figure>
            ) : (
              <label
                className={[
                  "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300",
                  uploading
                    ? "border-[var(--border)] opacity-60"
                    : "border-[var(--border)] hover:border-[var(--border-accent)] hover:bg-[var(--accent-soft)] love-card-hover",
                ].join(" ")}
              >
                <span className="text-xl text-[var(--accent)]">+</span>
                <span className="mt-1 text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Foto {i + 1}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    onPick(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </li>
        ))}
      </ul>

      {previews.length < maxPhotos && (
        <label
          className={[
            "love-card-hover flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border)] px-4 py-5 transition-all",
            uploading ? "pointer-events-none opacity-60" : "hover:border-[var(--border-accent)] hover:bg-[var(--accent-soft)]",
          ].join(" ")}
        >
          {uploading && <span className="love-spinner shrink-0" aria-hidden />}
          <span className="text-center">
            <span className="block text-sm font-medium text-white">
              {uploading ? "Otimizando fotos…" : "Adicionar mais fotos"}
            </span>
            <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
              Toque ou arraste · até {maxPhotos} imagens
            </span>
          </span>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              onPick(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}

      <p className="text-center text-[10px] text-[var(--text-muted)]">
        {previews.length}/{maxPhotos} · compressão automática para carregar mais rápido
      </p>
    </fieldset>
  );
}
