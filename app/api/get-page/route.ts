import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import {
  API_DYNAMIC,
  API_RUNTIME,
  NO_STORE_HEADERS,
} from "@/lib/api-config";

/** Legado: leitura local JSON (dev). Produção usa /api/pages/[token]. */
export const runtime = API_RUNTIME;
export const dynamic = API_DYNAMIC;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token obrigatório" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const filePath = path.join(
    process.cwd(),
    "data",
    `page-${token}.json`
  );

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: "Não encontrado" },
      { status: 404, headers: NO_STORE_HEADERS }
    );
  }

  const data = JSON.parse(
    fs.readFileSync(filePath, "utf-8")
  ) as Record<string, unknown>;

  return NextResponse.json(data, {
    headers: NO_STORE_HEADERS,
  });
}
