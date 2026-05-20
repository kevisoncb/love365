import { buildTaxIdForCustomer } from "@/lib/cpf";
import { fetchWithTimeout } from "@/lib/fetch-safe";
import { createLogger } from "@/lib/logger";
import type {
  AbacateApiEnvelope,
  AbacateCustomerCreateBody,
  JsonObject,
} from "@/types/abacatepay";

const ABACATEPAY_API_BASE = "https://api.abacatepay.com/v1";

export function getAbacateApiKey(): string | null {
  const key =
    process.env.ABACATEPAY_KEY ||
    process.env.ABACATEPAY_API_KEY ||
    null;
  return key && key.trim() ? key.trim() : null;
}

/**
 * URL pública do site (returnUrl / completionUrl).
 * Ordem: NEXT_PUBLIC_URL → NEXT_PUBLIC_BASE_URL → https://VERCEL_URL
 */
export function getSiteBaseUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined,
  ];

  for (const raw of candidates) {
    if (typeof raw === "string" && raw.trim()) {
      const normalized = raw.trim().replace(/\/$/, "");
      if (
        !normalized.includes("undefined") &&
        !normalized.startsWith("http://undefined") &&
        !normalized.startsWith("https://undefined")
      ) {
        return normalized;
      }
    }
  }

  return "";
}

export function logAbacateEnvDiagnostics(
  logPrefix: string
): void {
  const apiKey = getAbacateApiKey();
  const baseUrl = getSiteBaseUrl();

  console.log(`${logPrefix} [ENV]`, {
    hasAbacateApiKey: Boolean(apiKey),
    abacateKeySource: process.env.ABACATEPAY_KEY
      ? "ABACATEPAY_KEY"
      : process.env.ABACATEPAY_API_KEY
        ? "ABACATEPAY_API_KEY"
        : "NONE",
    apiKeyPreview: apiKey
      ? `${apiKey.slice(0, 8)}…${apiKey.slice(-4)}`
      : null,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL
      ? "set"
      : "MISSING",
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL
      ? "set"
      : "MISSING",
    VERCEL_URL: process.env.VERCEL_URL || "missing",
    resolvedSiteBaseUrl: baseUrl || "MISSING",
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME
      ? "set"
      : "MISSING",
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL
      ? "set"
      : "MISSING",
    MONGODB_URI: process.env.MONGODB_URI
      ? "set"
      : "MISSING",
  });
}

export function formatCellphoneForAbacate(
  input: string
): string {
  let digits = (input || "").replace(/\D/g, "");

  if (digits.startsWith("55") && digits.length >= 12) {
    digits = digits.slice(2);
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return "(11) 99999-9999";
}

/** @deprecated use buildCustomerPayload */
export function formatTaxIdForAbacate(
  raw?: string
): string {
  return buildTaxIdForCustomer(raw).masked;
}

export function buildCustomerPayload(input: {
  name: string;
  email: string;
  whatsapp?: string;
  seed?: string;
}): AbacateCustomerCreateBody {
  const cellphone = formatCellphoneForAbacate(
    input.whatsapp || ""
  );
  const tax = buildTaxIdForCustomer(
    input.seed || input.email
  );

  console.log("[CELLPHONE]", {
    raw: input.whatsapp ? "***" : "fallback",
    formatted: cellphone,
  });
  console.log("[TAXID]", {
    digits: `${tax.digits.slice(0, 3)}***${tax.digits.slice(-2)}`,
    masked: tax.masked,
  });

  const payload: AbacateCustomerCreateBody = {
    name: input.name,
    email: input.email,
    cellphone,
    taxId: tax.masked,
  };

  console.log("[CUSTOMER_PAYLOAD]", {
    name: payload.name,
    email: `${payload.email.slice(0, 3)}…`,
    cellphone: payload.cellphone,
    taxId: payload.taxId,
  });

  return payload;
}

export function extractCustomerId(
  payload: unknown
): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as JsonObject;

  if (typeof root.id === "string" && root.id.trim()) {
    return root.id.trim();
  }

  const data = root.data;
  if (data && typeof data === "object") {
    const dataObj = data as JsonObject;

    if (
      typeof dataObj.id === "string" &&
      dataObj.id.trim()
    ) {
      return dataObj.id.trim();
    }

    const nestedCustomer = dataObj.customer;
    if (
      nestedCustomer &&
      typeof nestedCustomer === "object"
    ) {
      const customerObj = nestedCustomer as JsonObject;
      if (
        typeof customerObj.id === "string" &&
        customerObj.id.trim()
      ) {
        return customerObj.id.trim();
      }
    }
  }

  const customer = root.customer;
  if (customer && typeof customer === "object") {
    const customerObj = customer as JsonObject;
    if (
      typeof customerObj.id === "string" &&
      customerObj.id.trim()
    ) {
      return customerObj.id.trim();
    }
  }

  return null;
}

export function extractBillingUrl(
  payload: unknown
): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as JsonObject;

  if (typeof root.url === "string" && root.url.trim()) {
    return root.url.trim();
  }

  if (
    typeof root.paymentUrl === "string" &&
    root.paymentUrl.trim()
  ) {
    return root.paymentUrl.trim();
  }

  const data = root.data;
  if (data && typeof data === "object") {
    const dataObj = data as JsonObject;

    if (
      typeof dataObj.url === "string" &&
      dataObj.url.trim()
    ) {
      return dataObj.url.trim();
    }

    if (
      typeof dataObj.paymentUrl === "string" &&
      dataObj.paymentUrl.trim()
    ) {
      return dataObj.paymentUrl.trim();
    }

    const billing = dataObj.billing;
    if (billing && typeof billing === "object") {
      const billingObj = billing as JsonObject;
      if (
        typeof billingObj.url === "string" &&
        billingObj.url.trim()
      ) {
        return billingObj.url.trim();
      }
    }
  }

  return null;
}

export function extractBillingId(
  payload: unknown
): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as JsonObject;

  if (typeof root.id === "string" && root.id.trim()) {
    return root.id.trim();
  }

  const data = root.data;
  if (data && typeof data === "object") {
    const dataObj = data as JsonObject;
    if (
      typeof dataObj.id === "string" &&
      dataObj.id.trim()
    ) {
      return dataObj.id.trim();
    }
    const billing = dataObj.billing;
    if (billing && typeof billing === "object") {
      const billingObj = billing as JsonObject;
      if (
        typeof billingObj.id === "string" &&
        billingObj.id.trim()
      ) {
        return billingObj.id.trim();
      }
    }
    const checkout = dataObj.checkout;
    if (checkout && typeof checkout === "object") {
      const checkoutObj = checkout as JsonObject;
      if (
        typeof checkoutObj.id === "string" &&
        checkoutObj.id.trim()
      ) {
        return checkoutObj.id.trim();
      }
    }
  }

  return null;
}

export function extractAbacateErrorMessage(
  payload: unknown
): string {
  if (!payload || typeof payload !== "object") {
    return "Erro desconhecido na API AbacatePay";
  }

  const root = payload as JsonObject;

  if (typeof root.error === "string" && root.error.trim()) {
    return root.error.trim();
  }

  if (typeof root.message === "string" && root.message.trim()) {
    return root.message.trim();
  }

  if (Array.isArray(root.errors) && root.errors.length > 0) {
    return JSON.stringify(root.errors);
  }

  const data = root.data;
  if (data && typeof data === "object") {
    const dataObj = data as JsonObject;
    if (
      typeof dataObj.error === "string" &&
      dataObj.error.trim()
    ) {
      return dataObj.error.trim();
    }
    if (
      typeof dataObj.message === "string" &&
      dataObj.message.trim()
    ) {
      return dataObj.message.trim();
    }
  }

  return "Erro desconhecido na API AbacatePay";
}

export type AbacateParsedResponse = {
  ok: boolean;
  status: number;
  body: unknown;
  rawText: string;
};

export async function parseAbacateResponse(
  res: Response
): Promise<AbacateParsedResponse> {
  const rawText = await res.text();
  let body: unknown = {};

  try {
    body = rawText ? JSON.parse(rawText) : {};
  } catch {
    body = {
      _parseError: true,
      rawText: rawText.slice(0, 800),
    };
  }

  return {
    ok: res.ok,
    status: res.status,
    body,
    rawText,
  };
}

export async function abacateApiRequest(
  path: string,
  init: RequestInit,
  logPrefix: string
): Promise<AbacateParsedResponse> {
  const apiKey = getAbacateApiKey();

  if (!apiKey) {
    throw new Error(
      "Chave da API do AbacatePay não configurada."
    );
  }

  const url = `${ABACATEPAY_API_BASE}${path}`;
  const method = init.method || "GET";
  const startedAt = Date.now();

  const paymentLog = createLogger("PAYMENT");

  const res = await fetchWithTimeout(
    url,
    {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(init.headers as Record<string, string> | undefined),
      },
    },
    {
      timeoutMs: 25_000,
      retries: 1,
      label: `abacate:${path}`,
    }
  );

  const parsed = await parseAbacateResponse(res);

  paymentLog.info("abacate response", {
    status: parsed.status,
    meta: {
      prefix: logPrefix,
      ok: parsed.ok,
      durationMs: Date.now() - startedAt,
      customerId: extractCustomerId(parsed.body),
      billingUrl: extractBillingUrl(parsed.body),
      errorMessage: parsed.ok
        ? null
        : extractAbacateErrorMessage(parsed.body),
    },
  });

  return parsed;
}

export async function createPixPayment(data: {
  amount: number;
  description: string;
  customer: {
    name: string;
    cellphone: string;
    email: string;
  };
}): Promise<AbacateApiEnvelope> {
  const apiKey = getAbacateApiKey();
  if (!apiKey) {
    throw new Error("ABACATEPAY_API_KEY não configurada");
  }

  const response = await fetchWithTimeout(
    `${ABACATEPAY_API_BASE}/pixQrCode/create`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
    { label: "abacate:pixQrCode/create", retries: 1 }
  );

  const result = (await response.json()) as AbacateApiEnvelope;

  if (!response.ok) {
    console.error(result);
    throw new Error(
      result.message ||
        (typeof result.error === "string"
          ? result.error
          : "Erro ao criar pagamento")
    );
  }

  return result;
}
