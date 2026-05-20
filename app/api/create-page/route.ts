import { NextResponse } from "next/server";
import crypto from "crypto";

import { connectToDatabase, Page } from "@/lib/db";
import { s3Client } from "@/lib/r2";

import { PutObjectCommand } from "@aws-sdk/client-s3";

function safeToken(len = 10) {
  return crypto
    .randomBytes(16)
    .toString("base64url")
    .slice(0, len);
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const form = await req.formData();

    // =========================
    // DADOS
    // =========================

    const plan = String(
      form.get("plan") || "BASIC"
    ).toUpperCase();

    const names = String(
      form.get("names") || ""
    ).trim();

    const startDate = String(
      form.get("startDate") || ""
    ).trim();

    const message = String(
      form.get("message") || ""
    ).trim();

    const musicField = String(
      form.get("yt") || ""
    ).trim();

    const email = String(
      form.get("email") ||
      form.get("contact") ||
      ""
    ).trim();

    const whatsapp = String(
      form.get("whatsapp") || ""
    ).trim();

    const files = form.getAll("photos") as File[];

    const token = safeToken(10);

    const photoUrls: string[] = [];

    // =========================
    // UPLOAD R2
    // =========================

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.name || file.size === 0) {
        continue;
      }

      const buf = Buffer.from(
        await file.arrayBuffer()
      );

      const ext =
        file.name.split(".").pop() || "png";

      const filename = `${token}/${i + 1}.${ext}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: filename,
          Body: buf,
          ContentType: file.type,
        })
      );

      photoUrls.push(
        `${process.env.R2_PUBLIC_URL}/${filename}`
      );
    }

    // =========================
    // SALVAR MONGO
    // =========================

    await Page.create({
      token,
      plan,
      names,
      date: startDate,
      message,
      youtubeUrl: musicField,
      photoUrls,
      status: "PENDING",
      contact: email || whatsapp,
    });

    // =========================
    // ABACATEPAY
    // =========================

    const price =
      plan === "PREMIUM"
        ? 4990
        : 2990;

    const apiKey =
      process.env.ABACATEPAY_KEY ||
      process.env.ABACATEPAY_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Chave da API do AbacatePay não configurada."
      );
    }

    // =========================
    // CRIAR CUSTOMER
    // =========================

    const customerResponse = await fetch(
      "https://api.abacatepay.com/v1/customer/create",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },

        body: JSON.stringify({
          name:
            names || "Cliente Love365",

          email:
            email ||
            `${token}@love365.com`,

          taxId: "00000000000",
        }),
      }
    );

    const customerData =
      await customerResponse.json();

    if (!customerResponse.ok) {
      console.error(
        "❌ ERRO CUSTOMER:",
        customerData
      );

      throw new Error(
        customerData?.error ||
        customerData?.message ||
        "Erro ao criar customer"
      );
    }

    const customerId =
      customerData?.data?.id ||
      customerData?.id;

    if (!customerId) {
      console.error(
        "❌ CUSTOMER INVÁLIDO:",
        customerData
      );

      throw new Error(
        "Customer not found"
      );
    }

    // =========================
    // CRIAR COBRANÇA
    // =========================

    const abacateResponse = await fetch(
      "https://api.abacatepay.com/v1/billing/create",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },

        body: JSON.stringify({
          frequency: "ONE_TIME",

          methods: ["PIX"],

          customerId,

          products: [
            {
              externalId: token,

              name: `Página Love365 - ${plan}`,

              quantity: 1,

              price,
            },
          ],

          returnUrl:
            `${process.env.NEXT_PUBLIC_URL}/p/${token}`,

          completionUrl:
            `${process.env.NEXT_PUBLIC_URL}/p/${token}`,
        }),
      }
    );

    const abacateData =
      await abacateResponse.json();

    if (
      !abacateResponse.ok ||
      !abacateData?.data?.url
    ) {
      console.error(
        "❌ ERRO ABACATEPAY:",
        abacateData
      );

      throw new Error(
        abacateData?.error ||
        abacateData?.message ||
        "Falha ao gerar pagamento"
      );
    }

    // =========================
    // SUCESSO
    // =========================

    return NextResponse.json({
      token,
      url: abacateData.data.url,
    });

  } catch (err: any) {
    console.error(
      "❌ ERRO NO SERVIDOR:",
      err
    );

    return NextResponse.json(
      {
        error:
          err?.message ||
          "Erro interno",
      },
      { status: 500 }
    );
  }
}