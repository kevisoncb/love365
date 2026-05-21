import { NextResponse } from "next/server";

import { NO_STORE_HEADERS } from "@/lib/api-config";
import { fetchAbacateBillingSnapshot } from "@/lib/admin-abacate";
import { requireAdmin } from "@/lib/admin-guard";
import { serializeTributeRow } from "@/lib/admin-serializers";
import { getSiteBaseUrl } from "@/lib/abacatepay";
import { connectToDatabase, Page } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import type { PageDocument } from "@/types/page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("ADMIN");

type RouteCtx = { params: Promise<{ token: string }> };

export async function GET(req: Request, ctx: RouteCtx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { token } = await ctx.params;
    await connectToDatabase();

    const page = (await Page.findOne({
      token: token.trim(),
    }).lean()) as PageDocument | null;

    if (!page) {
      return NextResponse.json(
        { error: "Não encontrada" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const siteBase = getSiteBaseUrl();
    const abacate = await fetchAbacateBillingSnapshot(
      page.abacateBillingId
    );

    return NextResponse.json(
      {
        tribute: serializeTributeRow(page, siteBase),
        abacate: {
          billingId: abacate.billingId,
          checkoutUrl: abacate.checkoutUrl,
          error: abacate.error,
          payload: abacate.raw,
        },
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    log.error("tribute detail failed", { error: err });
    return NextResponse.json(
      { error: "Erro ao carregar homenagem" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function DELETE(req: Request, ctx: RouteCtx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { token } = await ctx.params;
    await connectToDatabase();

    const result = await Page.deleteOne({ token: token.trim() });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Não encontrada" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    log.warn("tribute deleted", { token: token.trim() });

    return NextResponse.json(
      { ok: true },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    log.error("tribute delete failed", { error: err });
    return NextResponse.json(
      { error: "Erro ao excluir" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
