import { NextResponse } from "next/server";

import { NO_STORE_HEADERS } from "@/lib/api-config";
import { requireAdmin, parsePagination } from "@/lib/admin-guard";
import { connectToDatabase, OpsErrorLog } from "@/lib/db";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("ADMIN");

const SCOPE_SEVERITY: Record<string, "error" | "warn" | "info"> = {
  ERROR: "error",
  WEBHOOK: "warn",
  PAYMENT: "warn",
  UPLOAD: "warn",
  SYNC: "warn",
  CREATE_PAGE: "warn",
  TRIBUTE: "info",
  ADMIN: "info",
  ANALYTICS: "info",
};

function deriveSeverity(scope: string): string {
  return SCOPE_SEVERITY[scope] ?? "info";
}

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const { page, limit, skip } = parsePagination(
      url.searchParams
    );

    const q = url.searchParams.get("q")?.trim();
    const scope = url.searchParams.get("scope")?.trim();
    const severity = url.searchParams.get("severity")?.trim();

    const parts: Record<string, unknown>[] = [];

    if (q) {
      const regex = new RegExp(
        q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      parts.push({
        $or: [
          { message: regex },
          { route: regex },
          { scope: regex },
          { token: regex },
        ],
      });
    }

    if (scope) {
      parts.push({ scope: scope.toUpperCase() });
    }

    if (severity === "error") {
      parts.push({ scope: "ERROR" });
    } else if (severity === "warn") {
      parts.push({
        scope: {
          $in: [
            "WEBHOOK",
            "PAYMENT",
            "UPLOAD",
            "SYNC",
            "CREATE_PAGE",
          ],
        },
      });
    } else if (severity === "info") {
      parts.push({
        scope: {
          $in: ["TRIBUTE", "ADMIN", "ANALYTICS", "client"],
        },
      });
    }

    const filter: Record<string, unknown> =
      parts.length === 0
        ? {}
        : parts.length === 1
          ? parts[0]
          : { $and: parts };

    const [total, items] = await Promise.all([
      OpsErrorLog.countDocuments(filter),
      OpsErrorLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const rows = items.map((e) => ({
      id: String(e._id),
      scope: e.scope,
      severity: deriveSeverity(e.scope),
      message: e.message,
      route: e.route ?? null,
      token: e.token
        ? `${e.token.slice(0, 2)}…${e.token.slice(-2)}`
        : null,
      createdAt: e.createdAt
        ? new Date(e.createdAt).toISOString()
        : null,
      meta: e.meta ?? null,
    }));

    log.done("logs list");

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
    log.error("logs list failed", { error: err });
    return NextResponse.json(
      { error: "Erro ao carregar logs" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
