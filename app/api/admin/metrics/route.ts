import { NextResponse } from "next/server";

import { NO_STORE_HEADERS } from "@/lib/api-config";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { connectToDatabase, OpsErrorLog, Page } from "@/lib/db";
import { isPaidPageStatus } from "@/lib/page-status";
import { createLogger } from "@/lib/logger";
import type { PageDocument } from "@/types/page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("ADMIN");

export async function GET(req: Request) {
  if (!(await isAdminAuthorized(req))) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    await connectToDatabase();
    const started = Date.now();

    const pages = await Page.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .lean<PageDocument[]>();

    const totalCreated = pages.length;
    const paidPages = pages.filter((p) =>
      isPaidPageStatus(p.status)
    );
    const totalPaid = paidPages.length;
    const pendingPages = pages.filter(
      (p) => !isPaidPageStatus(p.status)
    );

    const conversionPct =
      totalCreated > 0
        ? Math.round((totalPaid / totalCreated) * 1000) / 10
        : 0;

    const plans = { BASIC: 0, PREMIUM: 0 };
    for (const p of paidPages) {
      const plan = String(p.plan || "").toUpperCase();
      if (plan === "PREMIUM") plans.PREMIUM += 1;
      else plans.BASIC += 1;
    }

    const recentTributes = pages.slice(0, 12).map((p) => ({
      token: p.token,
      names: p.names,
      plan: p.plan,
      status: p.status ?? "PENDING",
      createdAt: p.createdAt,
      paidAt: p.paidAt ?? null,
    }));

    const recentPending = pendingPages
      .slice(0, 12)
      .map((p) => ({
        token: p.token,
        names: p.names,
        plan: p.plan,
        status: p.status ?? "PENDING",
        createdAt: p.createdAt,
      }));

    const recentErrors = await OpsErrorLog.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    log.done("metrics", { durationMs: Date.now() - started });

    return NextResponse.json(
      {
        totalCreated,
        totalPaid,
        totalPending: pendingPages.length,
        conversionPct,
        plans,
        recentTributes,
        recentPending,
        recentErrors: recentErrors.map((e) => ({
          scope: e.scope,
          message: e.message,
          route: e.route,
          token: e.token
            ? `${e.token.slice(0, 2)}…`
            : null,
          createdAt: e.createdAt,
        })),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    log.error("metrics failed", { error: err });
    return NextResponse.json(
      { error: "Erro ao carregar métricas" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
