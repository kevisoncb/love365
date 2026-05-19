const timerLabels = ["Anos", "Meses", "Dias", "Horas", "Min", "Seg"] as const;

function calculateTime() {
  const startDate = new Date("2022-03-10T00:00:00");
  const now = new Date();

  let years = now.getFullYear() - startDate.getFullYear();
  let months = now.getMonth() - startDate.getMonth();
  let days = now.getDate() - startDate.getDate();

  if (days < 0) {
    months--;

    const prevMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0
    );

    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  return [
    String(years).padStart(2, "0"),
    String(months).padStart(2, "0"),
    String(days).padStart(2, "0"),
    hours,
    minutes,
    seconds,
  ];
}

const timerValues = calculateTime();

export function PhoneMockup() {
  return (
    <aside className="relative mx-auto w-full max-w-[320px]">
      <span
        className="pointer-events-none absolute -inset-8 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--glow) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative rounded-[2.75rem] border border-[var(--border)] bg-zinc-950 p-3 shadow-2xl premium-glow">
        <span
          className="absolute left-1/2 top-2 z-20 block h-5 w-24 -translate-x-1/2 rounded-full bg-black"
          aria-hidden
        />

        <div className="relative min-h-[480px] aspect-[9/16] overflow-hidden rounded-[2.25rem] bg-black">
          <span
            className="absolute inset-0 block bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(160deg, rgba(255,47,146,0.35) 0%, rgba(80,20,60,0.9) 40%, #0a0a0f 100%)",
            }}
            aria-hidden
          />

          <span
            className="absolute inset-0 block bg-gradient-to-t from-black via-black/20 to-black/40"
            aria-hidden
          />

          <div className="relative z-10 flex h-full min-h-[480px] flex-col px-5 pt-14 pb-10">
            <p className="text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-white/50">
              Nossa história
            </p>

            <h3 className="font-display mt-3 text-center text-3xl font-medium italic text-white drop-shadow-lg">
              Ana & Leo
            </h3>

            <p className="mt-1 text-center text-xs text-[var(--accent)]">
              Juntos há 842 dias
            </p>

            <ul className="mt-auto grid list-none grid-cols-3 gap-2 p-0">
              {timerValues.map((v, i) => (
                <li
                  key={timerLabels[i]}
                  className="rounded-2xl border border-white/10 bg-white/10 px-2 py-3 text-center backdrop-blur-md"
                >
                  <span className="block text-xl font-semibold tabular-nums text-white">
                    {v}
                  </span>

                  <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-wider text-white/55">
                    {timerLabels[i]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}