type CreateLoadingOverlayProps = {
  phase: "creating" | "redirecting";
};

const copy = {
  creating: {
    title: "Preparando seu presente",
    subtitle: "Estamos montando sua página com carinho…",
  },
  redirecting: {
    title: "Quase pronto",
    subtitle: "Abrindo PIX seguro — sua página libera na hora após confirmar",
  },
};

export function CreateLoadingOverlay({ phase }: CreateLoadingOverlayProps) {
  const { title, subtitle } = copy[phase];

  return (
    <div
      className="love-overlay-in fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(8,8,12,0.88)] backdrop-blur-xl"
      role="alert"
      aria-live="polite"
    >
      <article className="love-glass mx-6 max-w-sm rounded-3xl px-8 py-10 text-center premium-glow">
        <span className="love-spinner mx-auto block h-8 w-8 border-[2.5px]" aria-hidden />
        <h2 className="font-display mt-6 text-2xl text-white">{title}</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{subtitle}</p>
        <ul className="mt-6 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <span
                className="block h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
