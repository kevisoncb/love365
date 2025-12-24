import { NextResponse } from "next/server";
import { connectToDatabase, Page } from "@/lib/db";
import { sendSuccessEmail } from "@/lib/mail-service";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    // 1. Captura o corpo da requisição
    const body = await req.json();
    
    // LOG DE SEGURANÇA: Para você ver a estrutura real no console da Vercel
    console.log(" [DEBUG] Payload Completo:", JSON.stringify(body));

    // 2. Mapeamento de dados (AbacatePay envia dentro de .data)
    const eventData = body.data;
    const status = eventData?.status || body.status; // Tenta pegar de dentro ou de fora
    
    // Tenta pegar o token (externalId) de todos os lugares possíveis
    const token = 
      eventData?.externalId || 
      eventData?.products?.[0]?.externalId || 
      body.externalId;

    console.log(`[Webhook AbacatePay] Token: ${token} | Status: ${status}`);

    if (!token) {
      console.error("❌ Erro: Token não identificado no JSON recebido.");
      return NextResponse.json({ error: "Token ausente" }, { status: 200 });
    }

    // 3. Verificação de pagamento aprovado
    if (status === "PAID" || status === "CONFIRMED") {
      const result = await Page.findOneAndUpdate(
        { token: token },
        { status: "APPROVED" },
        { new: true } 
      );

      if (result) {
        console.log(`✅ Página ${token} ativada no banco com sucesso!`);

        // AJUSTE: No seu Schema o campo é 'contact' e não 'email'
        const emailDestino = result.contact || result.email;

        if (emailDestino) {
          try {
            await sendSuccessEmail(emailDestino, result.names, token);
            console.log(`📧 E-mail enviado para: ${emailDestino}`);
          } catch (mailError) {
            console.error("❌ Erro ao disparar e-mail:", mailError);
          }
        }
      } else {
        console.warn(`⚠️ Token ${token} não encontrado na coleção 'pages'.`);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erro Crítico no Webhook:", error);
    return NextResponse.json({ error: "Erro Interno" }, { status: 200 });
  }
}