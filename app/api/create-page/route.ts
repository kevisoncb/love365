import { NextResponse } from "next/server";
import crypto from "crypto";

import { connectToDatabase, Page } from "@/lib/db";
import { s3Client } from "@/lib/r2";
import {
  abacateApiRequest,
  extractAbacateErrorMessage,
  extractBillingId,
  extractBillingUrl,
  extractCustomerId,
  formatCellphoneForAbacate,
  formatTaxIdForAbacate,
  getAbacateApiKey,
  getSiteBaseUrl,
  logAbacateEnvDiagnostics,
} from "@/lib/abacatepay";

import { PutObjectCommand } from "@aws-sdk/client-s3";

const LOG = "[CREATE-PAGE]";

function safeToken(len = 10) {
  return crypto
    .randomBytes(16)
    .toString("base64url")
    .slice(0, len);
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    console.log(`${LOG} [START] Nova requisição de criação`);

    await connectToDatabase();
    console.log(`${LOG} [MONGO] Conectado`);

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

    console.log(`${LOG} [INPUT]`, {
      token,
      plan,
      namesLength: names.length,
      startDate,
      email: email ? `${email.slice(0, 3)}…` : "empty",
      whatsappDigits: whatsapp.replace(/\D/g, "").length,
      photosCount: files.length,
    });

    const photoUrls: string[] = [];

    // =========================
    // UPLOAD R2
    // =========================

    if (!process.env.R2_BUCKET_NAME) {
      console.error(`${LOG} [R2] R2_BUCKET_NAME ausente`);
      throw new Error(
        "Configuração R2_BUCKET_NAME ausente."
      );
    }

    if (!process.env.R2_PUBLIC_URL) {
      console.error(`${LOG} [R2] R2_PUBLIC_URL ausente`);
      throw new Error(
        "Configuração R2_PUBLIC_URL ausente."
      );
    }

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

      console.log(`${LOG} [R2] Upload`, {
        token,
        filename,
        size: file.size,
        type: file.type,
      });

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

    console.log(`${LOG} [R2] Concluído`, {
      token,
      uploadedCount: photoUrls.length,
    });

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

    console.log(`${LOG} [MONGO] Page criada`, {
      token,
      plan,
      status: "PENDING",
    });

    // =========================
    // ABACATEPAY
    // =========================

    logAbacateEnvDiagnostics(LOG);

    const price =
      plan === "PREMIUM"
        ? 4990
        : 2990;

    const apiKey = getAbacateApiKey();

    if (!apiKey) {
      throw new Error(
        "Chave da API do AbacatePay não configurada."
      );
    }

    const siteBaseUrl = getSiteBaseUrl();

    if (!siteBaseUrl) {
      console.error(
        `${LOG} [ENV] NEXT_PUBLIC_URL / NEXT_PUBLIC_BASE_URL ausentes — billing exige returnUrl e completionUrl válidos`
      );
      throw new Error(
        "URL pública do site não configurada (NEXT_PUBLIC_URL ou NEXT_PUBLIC_BASE_URL)."
      );
    }

    const returnUrl = `${siteBaseUrl}/p/${token}`;
    const completionUrl = `${siteBaseUrl}/p/${token}`;

    const customerEmail =
      email || `${token}@love365.com`;

    const customerCellphone =
      formatCellphoneForAbacate(whatsapp);

    const customerTaxId = formatTaxIdForAbacate();

    const customerBody = {
      name: names || "Cliente Love365",
      email: customerEmail,
      cellphone: customerCellphone,
      taxId: customerTaxId,
    };

    console.log(`${LOG} [ABACATEPAY] Preparando customer`, {
      token,
      plan,
      priceCents: price,
      returnUrl,
      completionUrl,
      customerBody: {
        ...customerBody,
        email: `${customerEmail.slice(0, 3)}…`,
      },
    });

    // =========================
    // CRIAR CUSTOMER
    // =========================

    const customerParsed = await abacateApiRequest(
      "/customer/create",
      {
        method: "POST",
        body: JSON.stringify(customerBody),
      },
      `${LOG} [CUSTOMER]`
    );

    if (!customerParsed.ok) {
      const msg = extractAbacateErrorMessage(
        customerParsed.body
      );
      console.error(
        `${LOG} [CUSTOMER] Falha HTTP ${customerParsed.status}:`,
        msg,
        customerParsed.body
      );
      throw new Error(
        msg || "Erro ao criar customer"
      );
    }

    const customerId = extractCustomerId(
      customerParsed.body
    );

    if (!customerId) {
      console.error(
        `${LOG} [CUSTOMER] customerId ausente na resposta v1:`,
        customerParsed.body
      );
      throw new Error(
        "Customer not found (resposta AbacatePay sem data.id)"
      );
    }

    console.log(`${LOG} [CUSTOMER] OK`, {
      token,
      customerId,
    });

    // =========================
    // CRIAR COBRANÇA
    // =========================

    const billingBody = {
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
      returnUrl,
      completionUrl,
      externalId: token,
      metadata: {
        externalId: token,
        token,
        plan,
      },
    };

    console.log(`${LOG} [BILLING] Enviando cobrança`, {
      token,
      customerId,
      billingBody: {
        ...billingBody,
        metadata: billingBody.metadata,
      },
    });

    const billingParsed = await abacateApiRequest(
      "/billing/create",
      {
        method: "POST",
        body: JSON.stringify(billingBody),
      },
      `${LOG} [BILLING]`
    );

    const paymentUrl = extractBillingUrl(
      billingParsed.body
    );

    if (!billingParsed.ok || !paymentUrl) {
      const msg = extractAbacateErrorMessage(
        billingParsed.body
      );
      console.error(
        `${LOG} [BILLING] Falha HTTP ${billingParsed.status}:`,
        msg,
        billingParsed.body
      );
      throw new Error(
        msg || "Falha ao gerar pagamento"
      );
    }

    const abacateBillingId = extractBillingId(
      billingParsed.body
    );

    if (abacateBillingId) {
      await Page.updateOne(
        { token },
        { $set: { abacateBillingId } }
      );
      console.log(`${LOG} [MONGO] abacateBillingId salvo`, {
        token,
        abacateBillingId,
      });
    } else {
      console.warn(
        `${LOG} [BILLING] Resposta sem bill id — sync-payment usará billing/list`,
        { token }
      );
    }

    console.log(`${LOG} [SUCCESS]`, {
      token,
      customerId,
      abacateBillingId,
      paymentUrl,
      durationMs: Date.now() - startedAt,
    });

    // =========================
    // SUCESSO
    // =========================

    return NextResponse.json({
      token,
      url: paymentUrl,
      paymentUrl,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Erro interno";

    console.error(`${LOG} [ERROR]`, {
      message,
      err,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
