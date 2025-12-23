import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // O AbacatePay envia o status no campo data.status ou similar
    // Vamos capturar o status e o token (que enviamos no externalId do produto)
    const status = body.data?.status;
    const products = body.data?.billing?.products || [];
    const token = products[0]?.externalId;

    console.log(`Recebido Webhook: Status ${status} para o Token ${token}`);

    if (status === "PAID" || status === "CONFIRMED") {
      if (!token) return NextResponse.json({ error: "Token não encontrado" }, { status: 400 });

      const filePath = path.join(process.cwd(), "data", `${token}.json`);

      if (fs.existsSync(filePath)) {
        // 1. Ler o arquivo atual
        const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        // 2. Atualizar o status
        fileData.status = "APPROVED";

        // 3. Salvar de volta
        fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
        
        console.log(`Página ${token} aprovada com sucesso!`);
        return NextResponse.json({ message: "Status atualizado" });
      }
    }

    return NextResponse.json({ message: "Webhook processado" });
  } catch (error) {
    console.error("Erro no Webhook:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}