import { NextResponse } from "next/server";

import {
  API_DYNAMIC,
  API_RUNTIME,
  NO_STORE_HEADERS,
} from "@/lib/api-config";
import {
  checkRateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { connectToDatabase, Page } from "@/lib/db";
import { syncPagePaymentStatus } from "@/lib/payment-sync";
import { isPaidPageStatus } from "@/lib/page-status";
import type { PageDocument } from "@/types/page";
import { createLogger } from "@/lib/logger";
import { captureServerErrorAsync } from "@/lib/error-tracking";
import { toApiClientError } from "@/lib/client-errors";

export const runtime = API_RUNTIME;
export const dynamic = API_DYNAMIC;

const log = createLogger("SYNC");
const MIN_SYNC_INTERVAL_MS = 8_000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const rate = await checkRateLimit(
      request,
      "sync-payment",
      30,
      10 * 60 * 1000
    );
    if (!rate.ok) {
      return rateLimitResponse(rate.retryAfterSec);
    }

    const { token } = await params;

    if (!token?.trim()) {
      return NextResponse.json(
        { error: "Token inválido." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    await connectToDatabase();

    const page = await Page.findOne({
      token: token.trim(),
    }).lean<PageDocument>();

    if (!page) {
      return NextResponse.json(
        { error: "Página não encontrada." },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (isPaidPageStatus(page.status)) {
      return NextResponse.json(
        {
          token,
          status: page.status,
          updated: false,
          paid: true,
        },
        { headers: NO_STORE_HEADERS }
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
          status: page.status ?? "PENDING",
          updated: false,
          throttled: true,
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    await Page.updateOne(
      { token: token.trim() },
      { $set: { lastPaymentSyncAt: new Date() } }
    );

    const result = await syncPagePaymentStatus(
      token.trim()
    );

    log.done("sync route", { token: token.trim(), status: result.status });

    return NextResponse.json(
      {
        ...result,
        paid: isPaidPageStatus(result.status),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (e: unknown) {
    captureServerErrorAsync(e, {
      scope: "SYNC",
      route: "/api/pages/[token]/sync-payment",
    });
    log.error("sync route failed", { error: e });
    return NextResponse.json(
      { error: toApiClientError(e) },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
