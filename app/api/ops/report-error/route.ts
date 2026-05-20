import { NextResponse } from "next/server";

import {
  API_DYNAMIC,
  API_RUNTIME,
  NO_STORE_HEADERS,
} from "@/lib/api-config";
import { captureServerErrorAsync } from "@/lib/error-tracking";
import { createLogger } from "@/lib/logger";

export const runtime = API_RUNTIME;
export const dynamic = API_DYNAMIC;

const log = createLogger("ERROR");

type ClientReportBody = {
  message?: string;
  scope?: string;
  route?: string;
  token?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ClientReportBody;
    const message =
      typeof body.message === "string"
        ? body.message.slice(0, 500)
        : "client_error";

    log.warn("client report", {
      route: body.route,
      token: body.token,
      meta: { message },
    });

    captureServerErrorAsync(new Error(message), {
      scope: "TRIBUTE",
      route: body.route || "client",
      token: body.token,
    });

    return NextResponse.json(
      { ok: true },
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { ok: false },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
