import { NextResponse } from "next/server";
import { connectToDatabase, Page } from "@/lib/db";

export const runtime = "nodejs";

// No Next.js 15, params precisa ser tratado como Promise
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    // 1. Aguarda o recebimento do token (correção para Next.js 15)
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Token inválido." }, { status: 400 });
    }

    await connectToDatabase();
    
    // 2. Busca no banco
    const page = await Page.findOne({ token }).lean();

    if (!page) {
      return NextResponse.json({ error: "Página não encontrada." }, { status: 404 });
    }

    // 3. Retorna os dados com mapeamento de nomes (mantendo compatibilidade)
    return NextResponse.json({
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