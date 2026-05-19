const STEPS = [
  { id: 1, label: "Plano" },
  { id: 2, label: "História" },
  { id: 3, label: "Fotos" },
  { id: 4, label: "Entrega" },
] as const;

type CreateProgressBarProps = {
  currentStep: number;
  percent: number;
};

export function CreateProgressBar({ currentStep, percent }: CreateProgressBarProps) {
  const stepMeta = STEPS[currentStep - 1];

  return (
    <header className="mb-8 space-y-4" aria-label="Progresso do formulário">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Passo {currentStep} de {STEPS.length}
          </p>
          <p className="font-display mt-1 text-xl text-white">{stepMeta?.label}</p>
        </div>
        <p className="text-xs tabular-nums text-[var(--text-muted)]">{Math.round(percent)}%</p>
      </div>

      <div
        className="love-progress-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="love-progress-fill block" style={{ width: `${percent}%` }} />
      </div>

      <ol className="flex list-none justify-between gap-1 p-0">
        {STEPS.map((s) => {
          const done = s.id < currentStep;
          const active = s.id === currentStep;
          return (
            <li key={s.id} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300",
                  done
                    ? "bg-[var(--accent)] text-white"
                    : active
                      ? "border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] ring-2 ring-[var(--accent)]/20"
                      : "border border-[var(--border)] bg-white/[0.03] text-[var(--text-muted)]",
                ].join(" ")}
              >
                {done ? "✓" : s.id}
              </span>
              <span
                className={[
                  "hidden text-[9px] font-medium uppercase tracking-wider sm:block",
                  active ? "text-white" : "text-[var(--text-muted)]",
                ].join(" ")}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </header>
  );
}
