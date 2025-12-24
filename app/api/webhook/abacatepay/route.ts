import { NextResponse } from "next/server";
import { connectToDatabase, Page } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    // O AbacatePay envia os dados dentro de body.data
    const eventData = body.data;
    const status = eventData?.status;
    
    // Tenta pegar o token de dois lugares possíveis para garantir
    const token = eventData?.products?.[0]?.externalId || eventData?.externalId;

    console.log(`[Webhook AbacatePay] Token: ${token} | Status: ${status}`);

    if (!token) {
      return NextResponse.json({ error: "Token não encontrado no payload" }, { status: 200 });
    }

    // AbacatePay usa PAID ou CONFIRMED para pagamentos aprovados
    if (status === "PAID" || status === "CONFIRMED") {
      const result = await Page.findOneAndUpdate(
        { token: token },
        { status: "APPROVED" },
        { new: true }
      );

      if (result) {
        console.log(`✅ Página ${token} ativada!`);
      } else {
        console.warn(`⚠️ Token ${token} recebido mas não encontrado no banco.`);
      }
    }

    // Retornamos 200 sempre para evitar que o AbacatePay fique repetindo o POST
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erro no Webhook:", error);
    // Mesmo em erro, retornamos 200 para evitar loop de retentativas do gateway
    // a menos que seja um erro crítico de infraestrutura.
    return NextResponse.json({ error: "Erro Interno" }, { status: 200 });
  }
}