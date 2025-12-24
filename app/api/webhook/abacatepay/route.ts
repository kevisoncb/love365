import { NextResponse } from "next/server";
import { connectToDatabase, Page } from "@/lib/db";
import { sendSuccessEmail } from "@/lib/mail-service";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    console.log(" [DEBUG] Payload Recebido:", JSON.stringify(body));

    const eventData = body.data;
    
    // CAPTURA DO STATUS
    const status = eventData?.status || body.status;

    // CAPTURA DO TOKEN (Múltiplas tentativas para não vir undefined)
    const token = 
      eventData?.externalId || 
      eventData?.products?.[0]?.externalId || 
      body.externalId ||
      (body.metadata && body.metadata.externalId);

    console.log(`[Webhook] Processando Token: ${token} | Status: ${status}`);

    if (!token) {
      console.error("❌ Webhook falhou: Token não encontrado no corpo da requisição.");
      return NextResponse.json({ error: "Token não encontrado" }, { status: 200 });
    }

    // 3. Se aprovado, atualiza o banco
    if (status === "PAID" || status === "CONFIRMED") {
      // Usamos updateOne ou findOneAndUpdate para garantir a troca de status
      const result = await Page.findOneAndUpdate(
        { token: token.trim() }, // trim para evitar espaços vazios
        { $set: { status: "APPROVED" } }, 
        { new: true } 
      );

      if (result) {
        console.log(`✅ SUCESSO: Página ${token} agora é APPROVED!`);

        // Disparo de e-mail
        const emailDestino = result.contact;
        if (emailDestino && emailDestino.includes('@')) {
          try {
            await sendSuccessEmail(emailDestino, result.names, token);
            console.log(`📧 E-mail de confirmação enviado.`);
          } catch (e) {
            console.error("❌ Falha ao enviar e-mail:", e);
          }
        }
      } else {
        console.warn(`⚠️ ALERTA: Token ${token} recebido, mas não existe no banco.`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erro Crítico no Webhook:", error);
    return NextResponse.json({ error: "Erro Interno" }, { status: 200 });
  }
}