import { NextResponse } from "next/server";
import { connectToDatabase, Page } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    // O AbacatePay envia o status e o ID externo (seu token)
    const status = body.data?.status;
    const token = body.data?.products?.[0]?.externalId;

    console.log(`[Webhook] Token: ${token} | Novo Status: ${status}`);

    // Se pago ou confirmado, atualizamos no MongoDB
    if (status === "PAID" || status === "CONFIRMED") {
      const result = await Page.findOneAndUpdate(
        { token: token },
        { status: "APPROVED" }
      );

      if (result) {
        console.log(`✅ Página ${token} aprovada com sucesso!`);
        return NextResponse.json({ success: true }, { status: 200 });
      }
    }

    // Sempre retornar 200 para o gateway não ficar tentando reenviar
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Erro no Webhook:", error);
    return NextResponse.json({ error: "Erro Interno" }, { status: 500 });
  }
}