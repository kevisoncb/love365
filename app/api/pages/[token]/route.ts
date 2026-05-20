import { NextResponse } from "next/server";

import { connectToDatabase, Page } from "@/lib/db";
import { isPaidPageStatus } from "@/lib/page-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control":
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Token inválido." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    await connectToDatabase();

    const page = await Page.findOne({
      token,
    }).lean();

    if (!page) {
      return NextResponse.json(
        { error: "Página não encontrada." },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    const paid = isPaidPageStatus(
      page.status as string | undefined
    );

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
        photoUrls: page.photoUrls || [],
        photos: page.photoUrls || [],
        youtubeUrl: page.youtubeUrl,
        yt: page.youtubeUrl,
        status: page.status,
        paid,
        abacateBillingId: page.abacateBillingId || null,
        paidAt: page.paidAt || null,
        syncRecommended:
          !paid && forceSync === false,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      }
    );
  } catch (e: unknown) {
    console.error(
      "[GET-PAGE] Erro na busca da página:",
      e
    );
    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
