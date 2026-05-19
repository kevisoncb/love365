type PreviewTileProps = {
  label: string;
  value: number | string;
};

export function PreviewTile({ label, value }: PreviewTileProps) {
  return (
    <article className="rounded-xl border border-white/15 bg-white/10 px-2 py-2.5 text-center backdrop-blur-md">
      <p className="text-[8px] font-semibold uppercase tracking-wider text-white/55">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums leading-none text-white">{value}</p>
    </article>
  );
}
