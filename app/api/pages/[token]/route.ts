import { NextResponse } from "next/server";
import { connectToDatabase, Page } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { token: string } }) {
  const token = params.token;

  if (!token) return NextResponse.json({ error: "Token inválido." }, { status: 400 });

  try {
    await connectToDatabase();
    const page = await Page.findOne({ token }).lean();

    if (!page) {
      return NextResponse.json({ error: "Página não encontrada." }, { status: 404 });
    }

    // Retornamos os dados mapeados para os nomes que seu frontend usa
    return NextResponse.json({
      token: page.token,
      plan: page.plan,
      names: page.names,
      date: page.date,          // Campo novo
      startDate: page.date,     // Compatibilidade antigo
      photoUrls: page.photoUrls || [], 
      photos: page.photoUrls || [],    // Compatibilidade antigo
      youtubeUrl: page.youtubeUrl,     // Campo novo
      yt: page.youtubeUrl,             // Compatibilidade antigo
      status: page.status,
    }, { 
      status: 200,
      headers: { 
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      } 
    });

  } catch (e: any) {
    console.error("Erro na busca da página:", e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}