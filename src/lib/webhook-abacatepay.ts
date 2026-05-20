import crypto from "crypto";
import { NextResponse } from "next/server";

import {
  connectToDatabase,
  Page,
  ProcessedWebhookEvent,
} from "@/lib/db";
import { sendSuccessEmail } from "@/lib/mail-service";
import {
  isAbacatePaymentApproved,
  isPaidPageStatus,
  CANONICAL_PAID_STATUS,
} from "@/lib/page-status";

const LOG = "[WEBHOOK]";

/** Chave pública documentada em https://docs.abacatepay.com/pages/webhooks/security */
const DEFAULT_ABACATEPAY_WEBHOOK_PUBLIC_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

export type WebhookHandleResult = {
  response: NextResponse;
  logSummary: Record<string, unknown>;
};

function pickFirstString(
  ...values: unknown[]
): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
  }
  return null;
}

function getWebhookPublicKey(): string {
  return (
    process.env.ABACATEPAY_WEBHOOK_PUBLIC_KEY ||
    DEFAULT_ABACATEPAY_WEBHOOK_PUBLIC_KEY
  );
}

function getWebhookSecret(): string | null {
  const secret =
    process.env.ABACATEPAY_WEBHOOK_SECRET ||
    process.env.WEBHOOK_SECRET ||
    null;
  return secret && secret.trim()
    ? secret.trim()
    : null;
}

export function verifyAbacateWebhookSignature(
  rawBody: string,
  signatureFromHeader: string | null
): boolean {
  if (!signatureFromHeader?.trim()) {
    return false;
  }

  const key = getWebhookPublicKey();
  const expectedSig = crypto
    .createHmac("sha256", key)
    .update(Buffer.from(rawBody, "utf8"))
    .digest("base64");

  try {
    const a = Buffer.from(expectedSig);
    const b = Buffer.from(signatureFromHeader.trim());
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyWebhookSecretParam(
  requestUrl: string
): boolean {
  const secret = getWebhookSecret();
  if (!secret) {
    return false;
  }

  const url = new URL(requestUrl);
  const fromQuery =
    url.searchParams.get("webhookSecret") ||
    url.searchParams.get("secret");

  if (!fromQuery) {
    return false;
  }

  try {
    const a = Buffer.from(fromQuery);
    const b = Buffer.from(secret);
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function parseAbacateWebhookPayload(
  rawText: string
): { body: Record<string, unknown>; data: Record<string, unknown> } {
  let body: Record<string, unknown> = {};
  try {
    body = rawText
      ? (JSON.parse(rawText) as Record<string, unknown>)
      : {};
  } catch {
    body = { _parseError: true };
  }

  const data =
    body.data &&
    typeof body.data === "object" &&
    !Array.isArray(body.data)
      ? (body.data as Record<string, unknown>)
      : body;

  return { body, data };
}

export function extractWebhookEventId(
  body: Record<string, unknown>,
  data: Record<string, unknown>
): string | null {
  return pickFirstString(
    body.id,
    body.eventId,
    data.id,
    data.eventId,
    data.logId
  );
}

export function extractWebhookToken(
  body: Record<string, unknown>,
  data: Record<string, unknown>
): string | null {
  const checkout =
    data.checkout &&
    typeof data.checkout === "object"
      ? (data.checkout as Record<string, unknown>)
      : null;

  const billing =
    data.billing &&
    typeof data.billing === "object"
      ? (data.billing as Record<string, unknown>)
      : null;

  const metadata =
    data.metadata &&
    typeof data.metadata === "object"
      ? (data.metadata as Record<string, unknown>)
      : null;

  const products = (() => {
    const lists = [
      checkout?.products,
      billing?.products,
      data.products,
      body.products,
    ];
    for (const list of lists) {
      if (Array.isArray(list) && list[0]) {
        const first = list[0];
        if (
          first &&
          typeof first === "object" &&
          "externalId" in first
        ) {
          const ext = (first as Record<string, unknown>)
            .externalId;
          if (typeof ext === "string" && ext.trim()) {
            return ext.trim();
          }
        }
      }
    }
    return null;
  })();

  return pickFirstString(
    checkout?.externalId,
    billing?.externalId,
    data.externalId,
    metadata?.externalId,
    metadata?.token,
    body.externalId,
    products
  );
}

export function extractWebhookBillingId(
  body: Record<string, unknown>,
  data: Record<string, unknown>
): string | null {
  const checkout =
    data.checkout &&
    typeof data.checkout === "object"
      ? (data.checkout as Record<string, unknown>)
      : null;

  const billing =
    data.billing &&
    typeof data.billing === "object"
      ? (data.billing as Record<string, unknown>)
      : null;

  return pickFirstString(
    checkout?.id,
    billing?.id,
    data.id,
    body.id
  );
}

export function extractWebhookPaymentStatus(
  body: Record<string, unknown>,
  data: Record<string, unknown>
): string | null {
  const checkout =
    data.checkout &&
    typeof data.checkout === "object"
      ? (data.checkout as Record<string, unknown>)
      : null;

  const billing =
    data.billing &&
    typeof data.billing === "object"
      ? (data.billing as Record<string, unknown>)
      : null;

  return pickFirstString(
    checkout?.status,
    billing?.status,
    data.status,
    data.payment?.status,
    body.status
  );
}

export function extractWebhookEventName(
  body: Record<string, unknown>
): string | null {
  return pickFirstString(body.event, body.type);
}

async function claimWebhookEvent(
  eventId: string,
  token: string | null
): Promise<boolean> {
  const result = await ProcessedWebhookEvent.updateOne(
    { eventId },
    {
      $setOnInsert: {
        eventId,
        token: token || undefined,
        processedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return result.upsertedCount === 1;
}

export async function markPageAsPaid(
  token: string,
  billingId?: string | null
): Promise<{
  page: Record<string, unknown> | null;
  newlyPaid: boolean;
}> {
  const now = new Date();
  const setFields: Record<string, unknown> = {
    status: CANONICAL_PAID_STATUS,
    paidAt: now,
  };

  if (billingId) {
    setFields.abacateBillingId = billingId;
  }

  const updated = await Page.findOneAndUpdate(
    {
      token,
      status: {
        $nin: [
          CANONICAL_PAID_STATUS,
          "APPROVED",
        ],
      },
    },
    { $set: setFields },
    { new: true }
  ).lean();

  if (updated) {
    return {
      page: updated as Record<string, unknown>,
      newlyPaid: true,
    };
  }

  const existing = await Page.findOne({ token }).lean();

  if (
    existing &&
    isPaidPageStatus(
      existing.status as string | undefined
    )
  ) {
    return {
      page: existing as Record<string, unknown>,
      newlyPaid: false,
    };
  }

  return { page: null, newlyPaid: false };
}

async function maybeSendPaidEmail(
  page: Record<string, unknown>
): Promise<void> {
  const contact = page.contact;
  const token = page.token;
  const names = page.names;
  const emailSentAt = page.emailSentAt;

  if (emailSentAt) {
    console.log(
      `${LOG} [EMAIL] Já enviado anteriormente`,
      { token }
    );
    return;
  }

  if (
    typeof contact !== "string" ||
    !contact.includes("@") ||
    typeof token !== "string"
  ) {
    return;
  }

  try {
    await sendSuccessEmail(
      contact,
      typeof names === "string"
        ? names
        : "Love365",
      token
    );
    await Page.updateOne(
      { token },
      { $set: { emailSentAt: new Date() } }
    );
    console.log(`${LOG} [EMAIL] Enviado`, {
      token,
      contact: `${contact.slice(0, 3)}…`,
    });
  } catch (e) {
    console.error(`${LOG} [EMAIL] Falha`, {
      token,
      error: e,
    });
  }
}

export async function handleAbacatePayWebhook(
  req: Request
): Promise<WebhookHandleResult> {
  const startedAt = Date.now();

  try {
    const rawText = await req.text();

    console.log(`${LOG} [RECEIVED]`, {
      method: req.method,
      url: req.url.split("?")[0],
      bodyLength: rawText.length,
      preview: rawText.slice(0, 500),
    });

    const webhookSecret = getWebhookSecret();
    if (!webhookSecret) {
      console.error(
        `${LOG} [ERROR] ABACATEPAY_WEBHOOK_SECRET / WEBHOOK_SECRET ausente`
      );
      return {
        response: NextResponse.json(
          { error: "Webhook secret not configured" },
          { status: 503 }
        ),
        logSummary: { error: "missing_secret" },
      };
    }

    if (!verifyWebhookSecretParam(req.url)) {
      console.error(
        `${LOG} [ERROR] webhookSecret inválido ou ausente na query`
      );
      return {
        response: NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        ),
        logSummary: { error: "invalid_secret" },
      };
    }

    const signature =
      req.headers.get("X-Webhook-Signature") ||
      req.headers.get("x-webhook-signature");

    if (
      !verifyAbacateWebhookSignature(
        rawText,
        signature
      )
    ) {
      console.error(
        `${LOG} [ERROR] Assinatura HMAC inválida`,
        { hasSignature: Boolean(signature) }
      );
      return {
        response: NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        ),
        logSummary: { error: "invalid_signature" },
      };
    }

    await connectToDatabase();

    const { body, data } =
      parseAbacateWebhookPayload(rawText);

    const eventId = extractWebhookEventId(
      body,
      data
    );

    if (eventId) {
      const alreadyDone =
        await ProcessedWebhookEvent.exists({
          eventId,
        });
      if (alreadyDone) {
        console.log(
          `${LOG} [RECEIVED] Evento já processado`,
          { eventId }
        );
        return {
          response: NextResponse.json({
            received: true,
            duplicate: true,
          }),
          logSummary: {
            duplicate: true,
            eventId,
          },
        };
      }
    }
    const token = extractWebhookToken(body, data);
    const billingId = extractWebhookBillingId(
      body,
      data
    );
    const statusRaw =
      extractWebhookPaymentStatus(body, data);
    const eventName =
      extractWebhookEventName(body);

    console.log(`${LOG} [RECEIVED] parsed`, {
      eventId,
      eventName,
      token,
      billingId,
      statusRaw,
    });

    if (!token) {
      console.warn(
        `${LOG} [ERROR] Token/externalId não encontrado no payload`
      );
      return {
        response: NextResponse.json(
          {
            received: true,
            warning: "token_missing",
          },
          { status: 200 }
        ),
        logSummary: { warning: "token_missing" },
      };
    }

    const approved = isAbacatePaymentApproved(
      statusRaw,
      eventName
    );

    if (!approved) {
      console.log(
        `${LOG} [RECEIVED] Pagamento ainda não confirmado`,
        { token, statusRaw, eventName }
      );
      return {
        response: NextResponse.json({
          received: true,
          status: statusRaw,
          pending: true,
        }),
        logSummary: {
          token,
          pending: true,
          statusRaw,
        },
      };
    }

    console.log(`${LOG} [PAYMENT_CONFIRMED]`, {
      token,
      billingId,
      statusRaw,
      eventName,
    });

    const { page, newlyPaid } = await markPageAsPaid(
      token,
      billingId
    );

    if (!page) {
      console.warn(
        `${LOG} [ERROR] Página não encontrada no Mongo`,
        { token }
      );
      return {
        response: NextResponse.json(
          {
            received: true,
            warning: "page_not_found",
            token,
          },
          { status: 200 }
        ),
        logSummary: {
          token,
          warning: "page_not_found",
        },
      };
    }

    console.log(`${LOG} [DB_UPDATED]`, {
      token,
      newlyPaid,
      status: page.status,
      durationMs: Date.now() - startedAt,
    });

    if (eventId) {
      const isFirst = await claimWebhookEvent(
        eventId,
        token
      );
      if (!isFirst) {
        console.log(
          `${LOG} [RECEIVED] Evento duplicado (pós-update)`,
          { eventId, token }
        );
      }
    }

    if (newlyPaid) {
      await maybeSendPaidEmail(page);
    }

    return {
      response: NextResponse.json({
        received: true,
        ok: true,
        token,
        newlyPaid,
      }),
      logSummary: {
        token,
        newlyPaid,
        ok: true,
      },
    };
  } catch (error) {
    console.error(`${LOG} [ERROR]`, {
      error,
      durationMs: Date.now() - startedAt,
    });

    return {
      response: NextResponse.json(
        { error: "internal" },
        { status: 500 }
      ),
      logSummary: { error: "internal" },
    };
  }
}
