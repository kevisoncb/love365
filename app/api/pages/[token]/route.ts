import { NextResponse } from "next/server";

import { NO_STORE_HEADERS } from "@/lib/api-config";
import { connectToDatabase, Page } from "@/lib/db";
import { isPaidPageStatus } from "@/lib/page-status";
import type { PageDocument } from "@/types/page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Token inválido." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    await connectToDatabase();

    const page = await Page.findOne({ token }).lean<PageDocument>();

    if (!page) {
      return NextResponse.json(
        { error: "Página não encontrada." },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const paid = isPaidPageStatus(page.status);

    const url = new URL(request.url);
    const forceSync =
      url.searchParams.get("sync") === "1" ||
      url.searchParams.get("sync") === "true";

    return NextResponse.json(
      {
        token: page.token,
        plan: page.plan,
        names: page.names,
        date: page.date,
        startDate: page.date,
        photoUrls: page.photoUrls ?? [],
        photos: page.photoUrls ?? [],
        youtubeUrl: page.youtubeUrl ?? null,
        yt: page.youtubeUrl ?? null,
        status: page.status ?? "PENDING",
        paid,
        abacateBillingId: page.abacateBillingId ?? null,
        paidAt: page.paidAt ?? null,
        syncRecommended: !paid && !forceSync,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (e: unknown) {
    console.error("[GET-PAGE] Erro:", e);
    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
