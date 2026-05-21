import { NextResponse } from "next/server";

import { NO_STORE_HEADERS } from "@/lib/api-config";
import { requireAdmin } from "@/lib/admin-guard";
import { buildDashboardPayload } from "@/lib/admin-dashboard";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("ADMIN");

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const payload = await buildDashboardPayload();
    log.done("dashboard");
    return NextResponse.json(payload, {
      headers: NO_STORE_HEADERS,
    });
  } catch (err) {
    log.error("dashboard failed", { error: err });
    return NextResponse.json(
      { error: "Erro ao carregar dashboard" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
