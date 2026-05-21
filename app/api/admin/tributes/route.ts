import { NextResponse } from "next/server";

import { NO_STORE_HEADERS } from "@/lib/api-config";
import { requireAdmin, parsePagination } from "@/lib/admin-guard";
import { serializeTributeRow } from "@/lib/admin-serializers";
import {
  countTributes,
  listTributes,
  normalizeStatusFilter,
} from "@/lib/admin-tributes-query";
import { getSiteBaseUrl } from "@/lib/abacatepay";
import { connectToDatabase } from "@/lib/db";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("ADMIN");

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const { page, limit, skip } = parsePagination(
      url.searchParams
    );

    const filters = {
      q: url.searchParams.get("q") || undefined,
      status: normalizeStatusFilter(
        url.searchParams.get("status")
      ),
      plan: url.searchParams.get("plan") || undefined,
      dateFrom: url.searchParams.get("dateFrom") || undefined,
      dateTo: url.searchParams.get("dateTo") || undefined,
    };

    const [total, items] = await Promise.all([
      countTributes(filters),
      listTributes(filters, skip, limit),
    ]);

    const siteBase = getSiteBaseUrl();
    const rows = items.map((p) =>
      serializeTributeRow(p, siteBase)
    );

    log.done("tributes list", {
      meta: { page, total, count: rows.length },
    });

    return NextResponse.json(
      {
        items: rows,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    log.error("tributes list failed", { error: err });
    return NextResponse.json(
      { error: "Erro ao listar homenagens" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
