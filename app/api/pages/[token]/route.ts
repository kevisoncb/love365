import { NextResponse } from "next/server";
import { connectToDatabase, Page } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.pathname.split("/").pop();

  if (!token) return NextResponse.json({ error: "Token inválido." }, { status: 400 });

  try {
    await connectToDatabase();
    // Use .lean() para performance, mas garanta que o schema tenha os campos certos
    const page = await Page.findOne({ token }).lean();

    if (!page) {
      return NextResponse.json({ error: "Página não encontrada." }, { status: 404 });
    }

    // AJUSTE AQUI: Mapeando os campos do MongoDB para o que o seu frontend espera
    return NextResponse.json({
      token: page.token,
      plan: page.plan,
      names: page.names,
      startDate: page.date, 
      // Verificamos se photoUrls existe (array) caso contrário usamos o antigo photoUrl
      photos: page.photoUrls || (page.photoUrl ? [page.photoUrl] : []), 
      yt: page.music,
      status: page.status,
    }, { status: 200 });

  } catch (e: any) {
    console.error("Erro na busca da página:", e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}