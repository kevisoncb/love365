import {
  abacateApiRequest,
  getAbacateApiKey,
} from "@/lib/abacatepay";
import {
  connectToDatabase,
  Page,
} from "@/lib/db";
import {
  CANONICAL_PAID_STATUS,
  isAbacatePaymentApproved,
  isPaidPageStatus,
} from "@/lib/page-status";
import { markPageAsPaid } from "@/lib/webhook-abacatepay";

const LOG = "[PAYMENT-SYNC]";

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

function extractStatusFromBillingPayload(
  body: unknown
): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const root = body as Record<string, unknown>;
  const data = root.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    return pickFirstString(d.status);
  }
  return pickFirstString(root.status);
}

async function fetchBillingById(
  billingId: string
): Promise<string | null> {
  const apiKey = getAbacateApiKey();
  if (!apiKey) {
    return null;
  }

  const v2Url = `https://api.abacatepay.com/v2/checkouts/get?id=${encodeURIComponent(billingId)}`;
  try {
    const res = await fetch(v2Url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    console.log(`${LOG} v2 checkouts/get`, {
      billingId,
      status: res.status,
      paymentStatus: extractStatusFromBillingPayload(
        json
      ),
    });
    if (res.ok) {
      return extractStatusFromBillingPayload(json);
    }
  } catch (e) {
    console.warn(`${LOG} v2 checkouts/get falhou`, e);
  }

  return null;
}

async function findBillingStatusByToken(
  token: string
): Promise<{
  status: string | null;
  billingId: string | null;
}> {
  const parsed = await abacateApiRequest(
    "/billing/list",
    { method: "GET" },
    `${LOG} [BILLING-LIST]`
  );

  if (!parsed.ok || !parsed.body) {
    return { status: null, billingId: null };
  }

  const root = parsed.body as Record<string, unknown>;
  const list = Array.isArray(root.data)
    ? root.data
    : [];

  for (const item of list) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const bill = item as Record<string, unknown>;
    const billExternalId =
      typeof bill.externalId === "string"
        ? bill.externalId
        : null;
    const billId =
      typeof bill.id === "string"
        ? bill.id
        : null;
    const billStatus =
      typeof bill.status === "string"
        ? bill.status
        : null;

    if (billExternalId === token) {
      return {
        status: billStatus,
        billingId: billId,
      };
    }

    const products = bill.products;
    if (Array.isArray(products)) {
      for (const prod of products) {
        if (
          prod &&
          typeof prod === "object" &&
          (prod as Record<string, unknown>)
            .externalId === token
        ) {
          return {
            status: billStatus,
            billingId: billId,
          };
        }
      }
    }
  }

  return { status: null, billingId: null };
}

export type SyncPaymentResult = {
  token: string;
  status: string;
  updated: boolean;
  source: "db" | "abacate" | "unchanged";
};

export async function syncPagePaymentStatus(
  token: string
): Promise<SyncPaymentResult> {
  await connectToDatabase();

  const page = await Page.findOne({ token }).lean();

  if (!page) {
    throw new Error("Página não encontrada");
  }

  const currentStatus =
    typeof page.status === "string"
      ? page.status
      : "PENDING";

  if (isPaidPageStatus(currentStatus)) {
    return {
      token,
      status: currentStatus,
      updated: false,
      source: "db",
    };
  }

  const billingId =
    typeof page.abacateBillingId === "string"
      ? page.abacateBillingId
      : null;

  let remoteStatus: string | null = null;
  let remoteBillingId: string | null = billingId;

  if (billingId) {
    remoteStatus = await fetchBillingById(
      billingId
    );
  }

  if (!remoteStatus) {
    const found = await findBillingStatusByToken(
      token
    );
    remoteStatus = found.status;
    remoteBillingId =
      found.billingId || remoteBillingId;
  }

  console.log(`${LOG}`, {
    token,
    remoteStatus,
    remoteBillingId,
  });

  if (
    !isAbacatePaymentApproved(
      remoteStatus,
      null
    )
  ) {
    return {
      token,
      status: currentStatus,
      updated: false,
      source: "unchanged",
    };
  }

  const { newlyPaid } = await markPageAsPaid(
    token,
    remoteBillingId
  );

  return {
    token,
    status: CANONICAL_PAID_STATUS,
    updated: newlyPaid,
    source: "abacate",
  };
}
