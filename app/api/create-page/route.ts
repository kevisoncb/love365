import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase, Page } from "@/lib/db";
import { s3Client } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

function safeToken(len = 10) {
  return crypto.randomBytes(16).toString("base64url").slice(0, len);
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const form = await req.formData();

    // Captura os dados do formulário
    const plan = String(form.get("plan") || "BASIC").toUpperCase();
    const names = String(form.get("names") || "").trim();
    const startDate = String(form.get("startDate") || "").trim();
    const email = String(form.get("email") || "").trim();
    const whatsapp = String(form.get("whatsapp") || "").trim();

    const files = form.getAll("photos") as File[];
    const token = safeToken(10);
    const photoUrls: string[] = [];

    // 1. Upload para o Cloudflare R2
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name) continue;
      const buf = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() || "png";
      const filename = `${token}/${i + 1}.${ext}`;

      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: filename,
        Body: buf,
        ContentType: file.type,
      }));
      photoUrls.push(`${process.env.R2_PUBLIC_URL}/${filename}`);
    }

    // 2. Salva no MongoDB com status PENDING
    await Page.create({
      token,
      plan,
      names,
      date: startDate,
      photoUrls,
      status: "PENDING",
      contact: email || whatsapp
    });

    // 3. Gerar link no AbacatePay (VERSÃO SEM ERRO DE CPF)
    const price = plan === "PREMIUM" ? 4990 : 2990;
    
    const abacateResponse = await fetch("https://api.abacatepay.com/v1/billing/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ABACATEPAY_KEY || process.env.ABACATEPAY_API_KEY}`
      },
      body: JSON.stringify({
        frequency: "ONE_TIME",
        methods: ["PIX"],
        products: [
          {
            externalId: token,
            name: `Página Love365 - ${plan}`,
            quantity: 1,
            price: price,
          },
        ],
        returnUrl: `${process.env.NEXT_PUBLIC_URL}/p/${token}`,
        completionUrl: `${process.env.NEXT_PUBLIC_URL}/p/${token}`,
        // NOTA: Não enviamos customerId nem o objeto customer aqui.
        // Isso obriga o AbacatePay a pedir os dados direto no checkout dele,
        // evitando o erro de CPF/taxId no seu servidor.
      }),
    });

    const abacateData = await abacateResponse.json();

    if (!abacateResponse.ok) {
      console.error("Erro AbacatePay:", abacateData);
      throw new Error("Erro ao gerar link de pagamento");
    }

    // Retorna a URL de pagamento para o frontend redirecionar
    return NextResponse.json({ 
      token, 
      paymentUrl: abacateData.data.url 
    });

  } catch (err: any) {
    console.error("❌ ERRO NO SERVIDOR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}