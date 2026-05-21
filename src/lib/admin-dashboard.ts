import { connectToDatabase, Page } from "@/lib/db";
import { getPlanPriceCents, type PlanId } from "@/lib/pricing";
import { isPaidPageStatus } from "@/lib/page-status";
import type { PageDocument } from "@/types/page";

const PAID_STATUSES = ["PAID", "APPROVED"];

function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function planRevenueCents(plan: string): number {
  const id: PlanId =
    String(plan).toUpperCase() === "PREMIUM" ? "PREMIUM" : "BASIC";
  return getPlanPriceCents(id);
}

function sumRevenue(pages: PageDocument[]): number {
  let total = 0;
  for (const p of pages) {
    if (isPaidPageStatus(p.status)) {
      total += planRevenueCents(String(p.plan));
    }
  }
  return total;
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export type DashboardPayload = {
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

export async function buildDashboardPayload(): Promise<DashboardPayload> {
  await connectToDatabase();

  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const chartStart = new Date(todayStart);
  chartStart.setDate(chartStart.getDate() - 29);

  const paidFilter = { status: { $in: PAID_STATUSES } };
  const pendingFilter = { status: { $nin: PAID_STATUSES } };

  const [
    totalCreated,
    pixApproved,
    pixPending,
    salesToday,
    salesMonth,
    paidPagesLean,
    createdByDay,
    paidByDay,
  ] = await Promise.all([
    Page.countDocuments({}),
    Page.countDocuments(paidFilter),
    Page.countDocuments(pendingFilter),
    Page.countDocuments({
      ...paidFilter,
      paidAt: { $gte: todayStart },
    }),
    Page.countDocuments({
      ...paidFilter,
      paidAt: { $gte: monthStart },
    }),
    Page.find(paidFilter)
      .select("plan status paidAt createdAt")
      .lean(),
    Page.aggregate([
      { $match: { createdAt: { $gte: chartStart } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Page.aggregate([
      {
        $match: {
          ...paidFilter,
          paidAt: { $gte: chartStart },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
          },
          count: { $sum: 1 },
          plans: { $push: "$plan" },
        },
      },
    ]),
  ]);

  const paidPages = paidPagesLean as PageDocument[];
  const revenueTotalCents = sumRevenue(paidPages);

  let revenueTodayCents = 0;
  let revenueMonthCents = 0;
  const plans = { BASIC: 0, PREMIUM: 0 };

  for (const p of paidPages) {
    const plan = String(p.plan || "").toUpperCase();
    if (plan === "PREMIUM") plans.PREMIUM += 1;
    else plans.BASIC += 1;

    const cents = planRevenueCents(plan);
    const paidAt = p.paidAt ? new Date(p.paidAt) : null;
    if (paidAt && paidAt >= todayStart) {
      revenueTodayCents += cents;
    }
    if (paidAt && paidAt >= monthStart) {
      revenueMonthCents += cents;
    }
  }

  const conversionPct =
    totalCreated > 0
      ? Math.round((pixApproved / totalCreated) * 1000) / 10
      : 0;

  const createdMap = new Map<string, number>();
  for (const row of createdByDay as Array<{
    _id: string;
    count: number;
  }>) {
    createdMap.set(row._id, row.count);
  }

  const paidMap = new Map<
    string,
    { count: number; plans: string[] }
  >();
  for (const row of paidByDay as Array<{
    _id: string;
    count: number;
    plans: string[];
  }>) {
    paidMap.set(row._id, {
      count: row.count,
      plans: row.plans || [],
    });
  }

  const salesByDay: DashboardPayload["salesByDay"] = [];
  const conversionDaily: DashboardPayload["conversionDaily"] = [];

  for (let i = 0; i < 30; i++) {
    const d = new Date(chartStart);
    d.setDate(chartStart.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const paidRow = paidMap.get(key);
    const sales = paidRow?.count ?? 0;
    let dayRevenue = 0;
    if (paidRow?.plans) {
      for (const pl of paidRow.plans) {
        dayRevenue += planRevenueCents(String(pl));
      }
    }
    const created = createdMap.get(key) ?? 0;
    const paid = sales;
    const dayConv =
      created > 0
        ? Math.round((paid / created) * 1000) / 10
        : 0;

    salesByDay.push({
      date: key,
      sales,
      revenueCents: dayRevenue,
    });
    conversionDaily.push({
      date: key,
      created,
      paid,
      conversionPct: dayConv,
    });
  }

  return {
    cards: {
      salesToday,
      salesMonth,
      revenueTotalCents,
      revenueTotalDisplay: formatBRL(revenueTotalCents),
      revenueTodayCents,
      revenueMonthCents,
      pixPending,
      pixApproved,
      conversionPct,
      totalCreated,
    },
    plans,
    salesByDay,
    conversionDaily,
  };
}
