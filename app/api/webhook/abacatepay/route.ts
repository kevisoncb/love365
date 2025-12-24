import { NextResponse } from "next/server";
import { connectToDatabase, Page } from "@/lib/db";
import { sendSuccessEmail } from "@/lib/mail-service";

// Forçamos o Next.js a entender que essa rota é dinâmica e não precisa ser validada no build
export const dynamic = 'force-dynamic'; 

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    // Captura o corpo da requisição com segurança
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
      // Retornamos 200 para o AbacatePay não ficar tentando reenviar um erro sem solução
      return NextResponse.json({ error: "Token não encontrado" }, { status: 200 });
    }

    // 3. Se aprovado, atualiza o banco de dados
    if (status === "PAID" || status === "CONFIRMED") {
      const result = await Page.findOneAndUpdate(
        { token: token.trim() }, 
        { $set: { status: "APPROVED" } }, 
        { new: true } 
      );

      if (result) {
        console.log(`✅ SUCESSO: Página ${token} agora é APPROVED!`);

        // Disparo de e-mail usando o campo 'contact' do seu Schema
        const emailDestino = result.contact;
        if (emailDestino && emailDestino.includes('@')) {
          try {
            await sendSuccessEmail(emailDestino, result.names, token);
            console.log(`📧 E-mail de confirmação enviado para ${emailDestino}`);
          } catch (e) {
            console.error("❌ Falha ao disparar função de e-mail:", e);
          }
        }
      } else {
        console.warn(`⚠️ ALERTA: Token ${token} recebido, mas não existe no banco.`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erro Crítico no Webhook:", error);
    // Retornamos 200 mesmo no erro para evitar loops de retry do webhook se o erro for de lógica
    return NextResponse.json({ error: "Erro Interno" }, { status: 200 });
  }
}