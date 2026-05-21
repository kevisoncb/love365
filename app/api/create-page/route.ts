import { NextResponse } from "next/server";
import crypto from "crypto";

import { connectToDatabase, Page } from "@/lib/db";
import { s3Client } from "@/lib/r2";
import {
  abacateApiRequest,
  buildCustomerPayload,
  extractAbacateErrorMessage,
  extractBillingId,
  extractBillingUrl,
  extractCustomerId,
  getAbacateApiKey,
  getSiteBaseUrl,
  logAbacateEnvDiagnostics,
} from "@/lib/abacatepay";

import {
  checkRateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import {
  validateImageFile,
  validatePhotoBatch,
} from "@/lib/upload-validation";
import { trackServerEvent } from "@/lib/analytics-server";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { createLogger } from "@/lib/logger";
import { captureServerErrorAsync } from "@/lib/error-tracking";
import { toApiClientError } from "@/lib/client-errors";
import { getPlanPriceCents } from "@/lib/pricing";

import { PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("CREATE_PAGE");

function safeToken(len = 10) {
  return crypto
    .randomBytes(16)
    .toString("base64url")
    .slice(0, len);
}

export async function POST(req: Request) {
  try {
    log.info("start", { route: "/api/create-page" });

    const rate = await checkRateLimit(
      req,
      "create-page",
      6,
      15 * 60 * 1000
    );
    if (!rate.ok) {
      return rateLimitResponse(rate.retryAfterSec);
    }

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

    const photoCheck = validatePhotoBatch(
      files,
      plan
    );
    if (!photoCheck.ok) {
      throw new Error(
        "error" in photoCheck ? photoCheck.error : "Fotos inválidas"
      );
    }

    const token = safeToken(10);

    log.info("input", {
      token,
      plan,
      meta: {
        namesLength: names.length,
        photosCount: files.length,
      },
    });

    const photoUrls: string[] = [];

    // =========================
    // UPLOAD R2
    // =========================

    if (!process.env.R2_BUCKET_NAME) {
      throw new Error(
        "Configuração R2_BUCKET_NAME ausente."
      );
    }

    if (!process.env.R2_PUBLIC_URL) {
      throw new Error(
        "Configuração R2_PUBLIC_URL ausente."
      );
    }

    const uploadStarted = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.name || file.size === 0) {
        continue;
      }

      const fileCheck = validateImageFile(file);
      if (!fileCheck.ok) {
        throw new Error(
          "error" in fileCheck ? fileCheck.error : "Arquivo inválido"
        );
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

    createLogger("UPLOAD").done("r2 batch", {
      token,
      status: "ok",
      meta: {
        uploadedCount: photoUrls.length,
        durationMs: Date.now() - uploadStarted,
      },
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

    log.info("page saved", { token, plan, status: "PENDING" });

    // =========================
    // ABACATEPAY
    // =========================

    logAbacateEnvDiagnostics("[CREATE_PAGE]");
    const billingStarted = Date.now();

    const price = getPlanPriceCents(
      plan === "PREMIUM" ? "PREMIUM" : "BASIC"
    );

    const apiKey = getAbacateApiKey();

    if (!apiKey) {
      throw new Error(
        "Chave da API do AbacatePay não configurada."
      );
    }

    const siteBaseUrl = getSiteBaseUrl();

    if (!siteBaseUrl) {
      throw new Error(
        "URL pública do site não configurada (NEXT_PUBLIC_URL ou NEXT_PUBLIC_BASE_URL)."
      );
    }

    const returnUrl = `${siteBaseUrl}/p/${token}`;
    const completionUrl = `${siteBaseUrl}/p/${token}`;

    const customerEmail =
      email || `${token}@love365.com`;

    const customerBody = buildCustomerPayload({
      name: names || "Cliente Love365",
      email: customerEmail,
      whatsapp,
      seed: token,
    });

    const customerParsed = await abacateApiRequest(
      "/customer/create",
      {
        method: "POST",
        body: JSON.stringify(customerBody),
      },
      "[CREATE_PAGE][CUSTOMER]"
    );

    if (!customerParsed.ok) {
      const msg = extractAbacateErrorMessage(
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
      throw new Error(
        "Customer not found (resposta AbacatePay sem data.id)"
      );
    }

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

    const billingParsed = await abacateApiRequest(
      "/billing/create",
      {
        method: "POST",
        body: JSON.stringify(billingBody),
      },
      "[CREATE_PAGE][BILLING]"
    );

    const paymentUrl = extractBillingUrl(
      billingParsed.body
    );

    if (!billingParsed.ok || !paymentUrl) {
      const msg = extractAbacateErrorMessage(
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
      log.info("billing id saved", { token, meta: { abacateBillingId } });
    } else {
      log.warn("billing id missing", { token });
    }

    createLogger("PAYMENT").done("billing created", {
      token,
      plan,
      status: billingParsed.status,
      meta: { durationMs: Date.now() - billingStarted },
    });

    trackServerEvent(
      AnalyticsEvents.PAYMENT_REDIRECT,
      { token, plan }
    );

    log.done("success", { token, plan, status: 200 });

    return NextResponse.json({
      token,
      url: paymentUrl,
      paymentUrl,
    });
  } catch (err: unknown) {
    captureServerErrorAsync(err, {
      scope: "CREATE_PAGE",
      route: "/api/create-page",
    });
    log.error("failed", { error: err, route: "/api/create-page" });

    return NextResponse.json(
      { error: toApiClientError(err) },
      { status: 500 }
    );
  }
}
