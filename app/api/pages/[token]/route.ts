import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

export async function GET(_: Request, ctx: { params: { token: string } }) {
  const token = ctx.params.token;

  try {
    const file = path.join(process.cwd(), "data", `page-${token}.json`);
    const raw = await fs.readFile(file, "utf-8");
    const page = JSON.parse(raw);

    // não expor dados de contato publicamente
    delete page.contact;

    return NextResponse.json(page, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Página não encontrada." }, { status: 404 });
  }
}
