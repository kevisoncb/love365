import { NextResponse } from "next/server";
import { connectToDatabase, Page } from "@/lib/db";

export async function POST(req: Request) {
  try {
    // 1. Conectar ao Banco de Dados
    await connectToDatabase();

    const body = await req.json();

    // No AbacatePay, o evento de pagamento confirmado costuma ser 'billing.paid'
    // Mas vamos checar tanto o campo 'event' quanto o 'data.status' para garantir
    const event = body.event;
    const status = body.data?.status;
    
    // O token que enviamos está dentro de metadata ou products
    // Pegando do local onde a API do AbacatePay costuma enviar
    const products = body.data?.products || [];
    const token = products[0]?.externalId;

    console.log(`[Webhook] Evento: ${event} | Status: ${status} | Token: ${token}`);

    // Se o evento for de pagamento confirmado ou o status for PAID
    if (event === "billing.paid" || status === "PAID" || status === "CONFIRMED") {
      
      if (!token) {
        console.error("❌ Webhook recebido, mas token (externalId) não encontrado.");
        return NextResponse.json({ error: "Token não encontrado" }, { status: 400 });
      }

      // 2. Atualizar o status no MongoDB de PENDING para APPROVED
      const updatedPage = await Page.findOneAndUpdate(
        { token: token },
        { status: "APPROVED" },
        { new: true } // Retorna o documento atualizado no log
      );

      if (updatedPage) {
        console.log(`✅ Página ${token} APROVADA no banco de dados!`);
        return NextResponse.json({ message: "Status atualizado para APPROVED" });
      } else {
        console.error(`⚠️ Página com token ${token} não encontrada no banco.`);
        return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
      }
    }

    return NextResponse.json({ message: "Webhook recebido, mas não era um evento de pagamento." });
  } catch (error: any) {
    console.error("❌ Erro no Webhook:", error.message);
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}