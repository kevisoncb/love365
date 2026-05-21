import {
  abacateApiRequest,
  getAbacateApiKey,
} from "@/lib/abacatepay";
import {
  connectToDatabase,
  Page,
} from "@/lib/db";
import {
  asJsonObject,
  pickFirstString,
} from "@/lib/safe-object";
import {
  CANONICAL_PAID_STATUS,
  isAbacatePaymentApproved,
  isPaidPageStatus,
} from "@/lib/page-status";
import { deliverPremiumTributeAfterPayment } from "@/lib/delivery/tribute-delivery";
import { markPageAsPaid } from "@/lib/webhook-abacatepay";
import type { PageDocument } from "@/types/page";
import { fetchWithTimeout } from "@/lib/fetch-safe";
import { createLogger } from "@/lib/logger";

const syncLog = createLogger("SYNC");

function extractStatusFromBillingPayload(
  body: unknown
): string | null {
  const root = asJsonObject(body);
  if (!root) return null;
  const data = asJsonObject(root.data);
  if (data) {
    return pickFirstString(data.status);
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
    const res = await fetchWithTimeout(
      v2Url,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
      { label: "abacate:v2/checkout", retries: 1, timeoutMs: 20_000 }
    );
    const json: unknown = await res.json().catch(
      () => ({})
    );
    if (res.ok) {
      return extractStatusFromBillingPayload(json);
    }
  } catch (e) {
    syncLog.warn("v2 checkout failed", { error: e });
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
    "[SYNC][BILLING-LIST]"
  );

  if (!parsed.ok || !parsed.body) {
    return { status: null, billingId: null };
  }

  const root = asJsonObject(parsed.body);
  const list = Array.isArray(root?.data)
    ? root.data
    : [];

  for (const item of list) {
    const bill = asJsonObject(item);
    if (!bill) continue;

    const billExternalId =
      typeof bill.externalId === "string"
        ? bill.externalId
        : null;
    const billId =
      typeof bill.id === "string" ? bill.id : null;
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
        const p = asJsonObject(prod);
        if (p?.externalId === token) {
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
  const started = Date.now();
  await connectToDatabase();

  const page = (await Page.findOne({ token }).lean()) as PageDocument | null;

  if (!page) {
    throw new Error("Página não encontrada");
  }

  const currentStatus = page.status ?? "PENDING";

  if (isPaidPageStatus(currentStatus)) {
    return {
      token,
      status: currentStatus,
      updated: false,
      source: "db",
    };
  }

  const billingId = page.abacateBillingId ?? null;

  let remoteStatus: string | null = null;
  let remoteBillingId: string | null = billingId;

  if (billingId) {
    remoteStatus = await fetchBillingById(billingId);
  }

  if (!remoteStatus) {
    const found = await findBillingStatusByToken(token);
    remoteStatus = found.status;
    remoteBillingId = found.billingId ?? remoteBillingId;
  }

  if (!isAbacatePaymentApproved(remoteStatus, null)) {
    return {
      token,
      status: currentStatus,
      updated: false,
      source: "unchanged",
    };
  }

  const { page: paidPage, newlyPaid } = await markPageAsPaid(
    token,
    remoteBillingId
  );

  if (newlyPaid && paidPage) {
    await deliverPremiumTributeAfterPayment(paidPage, true);
  }

  syncLog.done("sync paid", {
    token,
    status: CANONICAL_PAID_STATUS,
    meta: {
      newlyPaid,
      durationMs: Date.now() - started,
    },
  });

  return {
    token,
    status: CANONICAL_PAID_STATUS,
    updated: newlyPaid,
    source: "abacate",
  };
}
