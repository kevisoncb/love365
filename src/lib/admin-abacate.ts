import {
  abacateApiRequest,
  extractBillingUrl,
  getAbacateApiKey,
} from "@/lib/abacatepay";
import { fetchWithTimeout } from "@/lib/fetch-safe";

/** Snapshot sanitizado do AbacatePay para o admin (sem secrets) */
export async function fetchAbacateBillingSnapshot(
  billingId: string | null | undefined
): Promise<{
  billingId: string | null;
  checkoutUrl: string | null;
  raw: unknown;
  error?: string;
}> {
  if (!billingId?.trim()) {
    return {
      billingId: null,
      checkoutUrl: null,
      raw: null,
      error: "Sem billing ID",
    };
  }

  const apiKey = getAbacateApiKey();
  if (!apiKey) {
    return {
      billingId,
      checkoutUrl: null,
      raw: null,
      error: "API AbacatePay não configurada",
    };
  }

  try {
    const v2Url = `https://api.abacatepay.com/v2/checkouts/get?id=${encodeURIComponent(billingId)}`;
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
      { label: "admin:v2/checkout", timeoutMs: 15_000 }
    );
    const json: unknown = await res.json().catch(() => ({}));
    const checkoutUrl = extractBillingUrl(json);

    if (res.ok && checkoutUrl) {
      return { billingId, checkoutUrl, raw: json };
    }

    const list = await abacateApiRequest(
      "/billing/list",
      { method: "GET" },
      "[ADMIN][BILLING-LIST]"
    );

    return {
      billingId,
      checkoutUrl: extractBillingUrl(list.body),
      raw: list.ok ? list.body : json,
      error: list.ok ? undefined : "Falha ao consultar billing",
    };
  } catch (e) {
    return {
      billingId,
      checkoutUrl: null,
      raw: null,
      error:
        e instanceof Error ? e.message : "Erro ao consultar AbacatePay",
    };
  }
}
