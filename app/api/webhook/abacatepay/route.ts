import { NextResponse } from "next/server";
import { connectToDatabase, Page } from "@/lib/db";
import { sendSuccessEmail } from "@/lib/mail-service";

export const dynamic = 'force-dynamic'; 

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    console.log(" [DEBUG] Payload Recebido:", JSON.stringify(body));

    const eventData = body.data;
    
    // CAPTURA DO STATUS (Forçamos para maiúsculo para comparar sem erro)
    const statusRaw = eventData?.status || body.status || "";
    const status = statusRaw.toUpperCase(); 

    // CAPTURA DO TOKEN
    const token = 
      eventData?.externalId || 
      eventData?.products?.[0]?.externalId || 
      body.externalId ||
      (body.metadata && body.metadata.externalId);

    console.log(`[Webhook] Processando Token: ${token} | Status Original: ${statusRaw} | Status Normalizado: ${status}`);

    if (!token) {
      console.error("❌ Webhook falhou: Token não encontrado.");
      return NextResponse.json({ error: "Token não encontrado" }, { status: 200 });
    }

    // AQUI ESTAVA O ERRO: Agora aceita "paid", "PAID", "confirmed" ou "CONFIRMED"
    if (status === "PAID" || status === "CONFIRMED") {
      const result = await Page.findOneAndUpdate(
        { token: token.trim() }, 
        { $set: { status: "APPROVED" } }, 
        { new: true } 
      );

      if (result) {
        console.log(`✅ SUCESSO: Página ${token} agora é APPROVED!`);

        const emailDestino = result.contact;
        if (emailDestino && emailDestino.includes('@')) {
          try {
            await sendSuccessEmail(emailDestino, result.names, token);
            console.log(`📧 E-mail enviado para ${emailDestino}`);
          } catch (e) {
            console.error("❌ Falha no e-mail:", e);
          }
        }
      } else {
        console.warn(`⚠️ ALERTA: Token ${token} não encontrado no banco.`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erro Crítico no Webhook:", error);
    return NextResponse.json({ error: "Erro Interno" }, { status: 200 });
  }
}