"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Metrics = {
  totalCreated: number;
  totalPaid: number;
  totalPending: number;
  conversionPct: number;
  plans: { BASIC: number; PREMIUM: number };
  recentTributes: Array<{
    token: string;
    names: string;
    plan: string;
    status: string;
    createdAt?: string;
    paidAt?: string | null;
  }>;
  recentPending: Array<{
    token: string;
    names: string;
    plan: string;
    status: string;
    createdAt?: string;
  }>;
  recentErrors: Array<{
    scope: string;
    message: string;
    route?: string;
    token?: string | null;
    createdAt?: string;
  }>;
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-wider text-white/45">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {hint && (
        <p className="mt-1 text-xs text-white/40">{hint}</p>
      )}
    </article>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/metrics", {
        cache: "no-store",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        throw new Error("Falha ao carregar métricas");
      }
      setData(await res.json());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro desconhecido"
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  if (loading && !data) {
    return (
      <main className="flex min-h-screen items-center justify-center text-white/50">
        Carregando painel…
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-400">{error}</p>
        <button
          type="button"
          className="rounded-full border border-white/20 px-4 py-2 text-sm"
          onClick={load}
        >
          Tentar novamente
        </button>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Operações Love365</h1>
          <p className="mt-1 text-sm text-white/50">
            Atualiza a cada 60s · últimas 500 páginas
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-white/30"
        >
          Atualizar
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Criadas" value={data.totalCreated} />
        <StatCard label="Pagas" value={data.totalPaid} />
        <StatCard
          label="Conversão"
          value={`${data.conversionPct}%`}
          hint={`${data.totalPending} pendentes`}
        />
        <StatCard
          label="Planos pagos"
          value={`${data.plans.PREMIUM} P / ${data.plans.BASIC} E`}
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-white/10 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            Últimas homenagens
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {data.recentTributes.map((t) => (
              <li
                key={t.token}
                className="flex justify-between gap-2 border-b border-white/5 pb-2"
              >
                <span>
                  {t.names}{" "}
                  <span className="text-white/40">({t.plan})</span>
                </span>
                <span
                  className={
                    t.status === "PAID" || t.status === "APPROVED"
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }
                >
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-white/10 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            Pagamentos pendentes
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {data.recentPending.length === 0 ? (
              <li className="text-white/40">Nenhum pendente recente</li>
            ) : (
              data.recentPending.map((t) => (
                <li
                  key={t.token}
                  className="flex justify-between gap-2 border-b border-white/5 pb-2"
                >
                  <span>{t.names}</span>
                  <a
                    href={`/p/${t.token}`}
                    className="text-[var(--accent)] hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ver
                  </a>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="mt-8 rounded-xl border border-white/10 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
          Erros recentes
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {data.recentErrors.length === 0 ? (
            <li className="text-white/40">Nenhum erro registrado</li>
          ) : (
            data.recentErrors.map((e, i) => (
              <li
                key={`${e.createdAt}-${i}`}
                className="rounded-lg bg-white/[0.02] p-3"
              >
                <p className="font-mono text-xs text-[var(--accent)]">
                  [{e.scope}] {e.route || "—"}
                </p>
                <p className="mt-1 text-white/80">{e.message}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
