import { NextResponse } from "next/server";
import { connectToDatabase, Page } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    console.log("📦 Webhook Body:", JSON.stringify(body));

    const status = body.data?.status; 
    const billing = body.data?.billing;
    const products = billing?.products || body.data?.products || [];
    const token = products[0]?.externalId || body.data?.externalId;

    console.log(`[Webhook] Status: ${status} | Token: ${token}`);

    // Abrange todos os status de sucesso do AbacatePay
    const statusSucesso = ["confirmed", "paid", "PAID", "CONFIRMED"];

    if (statusSucesso.includes(status) && token) {
      const updatedPage = await Page.findOneAndUpdate(
        { token: token },
        { status: "APPROVED" },
        { new: true }
      );

      if (updatedPage) {
        console.log(`✅ Página ${token} APROVADA!`);
        return NextResponse.json({ message: "APPROVED" });
      } else {
        console.error(`⚠️ Token ${token} não encontrado no banco.`);
      }
    }

    return NextResponse.json({ message: "Processado" });
  } catch (error: any) {
    console.error("❌ Erro no Webhook:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}