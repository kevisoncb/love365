import crypto from "crypto";
import { NextResponse } from "next/server";

import {
  connectToDatabase,
  Page,
  ProcessedWebhookEvent,
} from "@/lib/db";
import { trackServerEvent } from "@/lib/analytics-server";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { sendSuccessEmail } from "@/lib/mail-service";
import {
  asJsonObject,
  getNestedString,
  pickFirstString,
} from "@/lib/safe-object";
import {
  isAbacatePaymentApproved,
  isPaidPageStatus,
  CANONICAL_PAID_STATUS,
} from "@/lib/page-status";
import type {
  AbacateCheckoutPayload,
  AbacateWebhookBody,
  AbacateWebhookData,
  JsonObject,
} from "@/types/abacatepay";
import type { PageDocument } from "@/types/page";
import { createLogger } from "@/lib/logger";
import { captureServerErrorAsync } from "@/lib/error-tracking";

const log = createLogger("WEBHOOK");

const DEFAULT_ABACATEPAY_WEBHOOK_PUBLIC_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

export type WebhookHandleResult = {
  response: NextResponse;
  logSummary: Record<string, unknown>;
};

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
  return secret?.trim() || null;
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

function parseWebhookData(
  raw: unknown
): AbacateWebhookData {
  const obj = asJsonObject(raw);
  if (!obj) {
    return {};
  }
  return obj as AbacateWebhookData;
}

export function parseAbacateWebhookPayload(
  rawText: string
): {
  body: AbacateWebhookBody;
  data: AbacateWebhookData;
} {
  let body: AbacateWebhookBody = {};

  try {
    const parsed: unknown = rawText
      ? JSON.parse(rawText)
      : {};
    body = asJsonObject(parsed) as AbacateWebhookBody;
  } catch {
    body = { _parseError: true } as AbacateWebhookBody;
  }

  const data =
    body.data && typeof body.data === "object"
      ? parseWebhookData(body.data)
      : parseWebhookData(body);

  return { body, data };
}

function extractProductExternalId(
  products: unknown
): string | null {
  if (!Array.isArray(products) || !products[0]) {
    return null;
  }
  const first = products[0];
  const record = asJsonObject(first);
  return pickFirstString(record?.externalId);
}

function checkoutRecord(
  data: AbacateWebhookData
): AbacateCheckoutPayload | null {
  if (data.checkout && typeof data.checkout === "object") {
    return data.checkout;
  }
  return null;
}

function billingRecord(
  data: AbacateWebhookData
): AbacateCheckoutPayload | null {
  if (data.billing && typeof data.billing === "object") {
    return data.billing;
  }
  return null;
}

export function extractWebhookEventId(
  body: AbacateWebhookBody,
  data: AbacateWebhookData
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
  body: AbacateWebhookBody,
  data: AbacateWebhookData
): string | null {
  const checkout = checkoutRecord(data);
  const billing = billingRecord(data);
  const metadata = data.metadata;

  const fromProducts = pickFirstString(
    extractProductExternalId(checkout?.products),
    extractProductExternalId(billing?.products),
    extractProductExternalId(data.products),
    extractProductExternalId(
      (body as JsonObject).products
    )
  );

  return pickFirstString(
    checkout?.externalId,
    billing?.externalId,
    data.externalId,
    metadata?.externalId,
    metadata?.token,
    body.externalId,
    fromProducts
  );
}

export function extractWebhookBillingId(
  body: AbacateWebhookBody,
  data: AbacateWebhookData
): string | null {
  const checkout = checkoutRecord(data);
  const billing = billingRecord(data);

  return pickFirstString(
    checkout?.id,
    billing?.id,
    data.id,
    body.id
  );
}

export function extractWebhookPaymentStatus(
  body: AbacateWebhookBody,
  data: AbacateWebhookData
): string | null {
  const checkout = checkoutRecord(data);
  const billing = billingRecord(data);
  const dataObj = data as JsonObject;

  return pickFirstString(
    checkout?.status,
    billing?.status,
    data.status,
    getNestedString(dataObj, "payment"),
    body.status
  );
}

export function extractWebhookEventName(
  body: AbacateWebhookBody
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
  page: PageDocument | null;
  newlyPaid: boolean;
}> {
  const now = new Date();
  const setFields: Partial<PageDocument> = {
    status: CANONICAL_PAID_STATUS,
    paidAt: now,
  };

  if (billingId) {
    setFields.abacateBillingId = billingId;
  }

  const updated = (await Page.findOneAndUpdate(
    {
      token,
      status: {
        $nin: [CANONICAL_PAID_STATUS, "APPROVED"],
      },
    },
    { $set: setFields },
    { new: true }
  ).lean()) as PageDocument | null;

  if (updated) {
    return { page: updated, newlyPaid: true };
  }

  const existing = (await Page.findOne({ token }).lean()) as PageDocument | null;

  if (existing && isPaidPageStatus(existing.status)) {
    return { page: existing, newlyPaid: false };
  }

  return { page: null, newlyPaid: false };
}

async function maybeSendPaidEmail(
  page: PageDocument
): Promise<void> {
  if (page.emailSentAt) {
    log.info("email skip", { token: page.token });
    return;
  }

  const contact = page.contact;
  if (
    typeof contact !== "string" ||
    !contact.includes("@")
  ) {
    return;
  }

  try {
    await sendSuccessEmail(
      contact,
      page.names || "Love365",
      page.token
    );
    await Page.updateOne(
      { token: page.token },
      { $set: { emailSentAt: new Date() } }
    );
    log.info("email sent", { token: page.token });
  } catch (e) {
    log.error("email failed", { token: page.token, error: e });
  }
}

export async function handleAbacatePayWebhook(
  req: Request
): Promise<WebhookHandleResult> {
  try {
    const rawText = await req.text();

    log.info("received", {
      route: req.url.split("?")[0],
      meta: { bodyLength: rawText.length },
    });

    const webhookSecret = getWebhookSecret();
    if (!webhookSecret) {
      log.error("secret missing", { route: "/api/webhook" });
      return {
        response: NextResponse.json(
          { error: "Webhook secret not configured" },
          { status: 503 }
        ),
        logSummary: { error: "missing_secret" },
      };
    }

    if (!verifyWebhookSecretParam(req.url)) {
      log.warn("invalid webhook secret param");
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
      !verifyAbacateWebhookSignature(rawText, signature)
    ) {
      log.warn("invalid hmac signature");
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

    const eventId = extractWebhookEventId(body, data);

    if (eventId) {
      const alreadyDone =
        await ProcessedWebhookEvent.exists({ eventId });
      if (alreadyDone) {
        log.info("duplicate", { meta: { eventId } });
        return {
          response: NextResponse.json({
            received: true,
            duplicate: true,
          }),
          logSummary: { duplicate: true, eventId },
        };
      }
    }

    const token = extractWebhookToken(body, data);
    const billingId = extractWebhookBillingId(body, data);
    const statusRaw = extractWebhookPaymentStatus(
      body,
      data
    );
    const eventName = extractWebhookEventName(body);

    log.info("parsed", {
      token,
      meta: { eventId, eventName, billingId, statusRaw },
    });

    if (!token) {
      log.warn("token_missing");
      return {
        response: NextResponse.json(
          { received: true, warning: "token_missing" },
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
      log.info("pending", {
        token,
        meta: { statusRaw, eventName },
      });
      return {
        response: NextResponse.json({
          received: true,
          status: statusRaw,
          pending: true,
        }),
        logSummary: { token, pending: true, statusRaw },
      };
    }

    log.info("payment confirmed", {
      token,
      meta: { billingId, statusRaw, eventName },
    });

    const { page, newlyPaid } = await markPageAsPaid(
      token,
      billingId
    );

    if (!page) {
      log.warn("page_not_found", { token });
      return {
        response: NextResponse.json(
          { received: true, warning: "page_not_found", token },
          { status: 200 }
        ),
        logSummary: { token, warning: "page_not_found" },
      };
    }

    log.done("db updated", {
      token,
      status: page.status,
      meta: { newlyPaid },
    });

    if (eventId) {
      await claimWebhookEvent(eventId, token);
    }

    if (newlyPaid) {
      trackServerEvent(AnalyticsEvents.PAYMENT_APPROVED, {
        token,
        billingId: billingId ?? undefined,
      });
      await maybeSendPaidEmail(page);
    }

    return {
      response: NextResponse.json({
        received: true,
        ok: true,
        token,
        newlyPaid,
      }),
      logSummary: { token, newlyPaid, ok: true },
    };
  } catch (error) {
    captureServerErrorAsync(error, {
      scope: "WEBHOOK",
      route: "/api/webhook/abacatepay",
    });
    log.error("handler failed", { error });

    return {
      response: NextResponse.json(
        { error: "internal" },
        { status: 500 }
      ),
      logSummary: { error: "internal" },
    };
  }
}
