import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

export async function GET(request: Request) {
  // Extrai o token diretamente da URL
  const url = new URL(request.url);
  const token = url.pathname.split("/").pop();

  if (!token) {
    return NextResponse.json(
      { error: "Token inválido." },
      { status: 400 }
    );
  }

  const filePath = path.join(process.cwd(), "data", `page-${token}.json`);

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const page = JSON.parse(raw);

    delete page.contact;

    return NextResponse.json(page, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Página não encontrada.",
        debug: {
          token,
          attemptedPath: filePath,
          code: e?.code ?? null,
        },
      },
      { status: 404 }
    );
  }
}
