"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AdminButton,
  AdminPageHeader,
  AdminStatCard,
  formatBRL,
} from "@/components/admin/admin-ui";
import { SimpleBarChart } from "@/components/admin/SimpleBarChart";

type DashboardData = {
  cards: {
    salesToday: number;
    salesMonth: number;
    revenueTotalCents: number;
    revenueTotalDisplay: string;
    revenueTodayCents: number;
    revenueMonthCents: number;
    pixPending: number;
    pixApproved: number;
    conversionPct: number;
    totalCreated: number;
  };
  plans: { BASIC: number; PREMIUM: number };
  salesByDay: Array<{
    date: string;
    sales: number;
    revenueCents: number;
  }>;
  conversionDaily: Array<{
    date: string;
    created: number;
    paid: number;
    conversionPct: number;
  }>;
};

export function DashboardOperations() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/dashboard", {
        cache: "no-store",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Falha ao carregar dashboard");
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
    return <p className="py-20 text-center text-sm text-zinc-500">Carregando dashboard…</p>;
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-sm text-rose-400">{error}</p>
        <AdminButton onClick={load}>Tentar novamente</AdminButton>
      </div>
    );
  }

  if (!data) return null;

  const { cards, plans, salesByDay, conversionDaily } = data;
  const last7 = salesByDay.slice(-7);
  const conv7 = conversionDaily.slice(-7);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        subtitle="Atualiza a cada 60s · últimos 30 dias nos gráficos"
        action={
          <AdminButton onClick={load} disabled={loading}>
            {loading ? "Atualizando…" : "Atualizar"}
          </AdminButton>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <AdminStatCard
          label="Vendas hoje"
          value={cards.salesToday}
          hint={formatBRL(cards.revenueTodayCents)}
          highlight
        />
        <AdminStatCard
          label="Vendas mês"
          value={cards.salesMonth}
          hint={formatBRL(cards.revenueMonthCents)}
          highlight
        />
        <AdminStatCard
          label="Faturamento total"
          value={cards.revenueTotalDisplay}
          highlight
        />
        <AdminStatCard
          label="PIX pendentes"
          value={cards.pixPending}
        />
        <AdminStatCard
          label="PIX aprovados"
          value={cards.pixApproved}
        />
        <AdminStatCard
          label="Conversão"
          value={`${cards.conversionPct}%`}
        />
        <AdminStatCard
          label="Homenagens criadas"
          value={cards.totalCreated}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <SimpleBarChart
          title="Vendas por dia (7d)"
          bars={last7.map((d) => ({
            label: d.date,
            value: d.sales,
          }))}
        />
        <SimpleBarChart
          title="Planos vendidos (pagos)"
          bars={[
            { label: "Essencial", value: plans.BASIC },
            { label: "Premium", value: plans.PREMIUM },
          ]}
        />
        <SimpleBarChart
          title="Conversão diária % (7d)"
          bars={conv7.map((d) => ({
            label: d.date,
            value: d.conversionPct,
          }))}
          valueFormatter={(n) => `${n}%`}
        />
      </section>
    </div>
  );
}
