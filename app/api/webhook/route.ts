import { NextResponse } from "next/server";
import { connectToDatabase, Page } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Log para você debugar na Vercel se necessário
    console.log("📦 Webhook Body:", JSON.stringify(body));

    const event = body.event;
    const status = body.data?.status; // Ex: "confirmed"
    
    // CORREÇÃO AQUI: O caminho correto no AbacatePay é data -> billing -> products
    const billing = body.data?.billing;
    const products = billing?.products || body.data?.products || [];
    const token = products[0]?.externalId;

    console.log(`[Webhook] Evento: ${event} | Status: ${status} | Token: ${token}`);

    // AbacatePay envia 'confirmed' quando o Pix é pago
    const isPaid = event === "billing.paid" || status === "confirmed" || status === "PAID";

    if (isPaid) {
      if (!token) {
        console.error("❌ Token não encontrado no JSON do AbacatePay");
        return NextResponse.json({ error: "Token ausente" }, { status: 400 });
      }

      const updatedPage = await Page.findOneAndUpdate(
        { token: token },
        { status: "APPROVED" },
        { new: true }
      );

      if (updatedPage) {
        console.log(`✅ Página ${token} APROVADA!`);
        return NextResponse.json({ message: "APPROVED" });
      } else {
        console.error(`⚠️ Token ${token} não existe no MongoDB.`);
        return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
      }
    }

    return NextResponse.json({ message: "Evento ignorado" });
  } catch (error: any) {
    console.error("❌ Erro no Webhook:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}