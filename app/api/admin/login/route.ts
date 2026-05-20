import { NextResponse } from "next/server";

import { NO_STORE_HEADERS } from "@/lib/api-config";
import {
  buildAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("ADMIN");

export async function POST(req: Request) {
  try {
    if (!process.env.ADMIN_SECRET?.trim()) {
      return NextResponse.json(
        { error: "Painel não configurado" },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    const body = (await req.json()) as { password?: string };
    const password = body.password ?? "";

    if (!verifyAdminPassword(password)) {
      log.warn("login failed");
      return NextResponse.json(
        { error: "Senha inválida" },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const cookie = await buildAdminSessionCookie();
    if (!cookie) {
      return NextResponse.json(
        { error: "Sessão indisponível" },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    log.info("login ok");

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          ...NO_STORE_HEADERS,
          "Set-Cookie": cookie,
        },
      }
    );
  } catch (err) {
    log.error("login error", { error: err });
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
