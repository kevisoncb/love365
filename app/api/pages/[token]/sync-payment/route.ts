import { NextResponse } from "next/server";

import { connectToDatabase, Page } from "@/lib/db";
import { syncPagePaymentStatus } from "@/lib/payment-sync";
import { isPaidPageStatus } from "@/lib/page-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOG = "[SYNC-PAYMENT]";
const MIN_SYNC_INTERVAL_MS = 8_000;

const NO_CACHE_HEADERS = {
  "Cache-Control":
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token?.trim()) {
      return NextResponse.json(
        { error: "Token inválido." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    await connectToDatabase();

    const page = await Page.findOne({
      token: token.trim(),
    }).lean();

    if (!page) {
      return NextResponse.json(
        { error: "Página não encontrada." },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    if (isPaidPageStatus(page.status as string)) {
      return NextResponse.json(
        {
          token,
          status: page.status,
          updated: false,
          paid: true,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const lastSync = page.lastPaymentSyncAt
      ? new Date(page.lastPaymentSyncAt).getTime()
      : 0;
    const now = Date.now();

    if (
      lastSync &&
      now - lastSync < MIN_SYNC_INTERVAL_MS
    ) {
      return NextResponse.json(
        {
          token,
          status: page.status,
          updated: false,
          throttled: true,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    await Page.updateOne(
      { token: token.trim() },
      { $set: { lastPaymentSyncAt: new Date() } }
    );

    const result = await syncPagePaymentStatus(
      token.trim()
    );

    console.log(`${LOG}`, result);

    return NextResponse.json(
      {
        ...result,
        paid: isPaidPageStatus(result.status),
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (e: unknown) {
    const message =
      e instanceof Error
        ? e.message
        : "Erro interno";
    console.error(`${LOG} [ERROR]`, message);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
