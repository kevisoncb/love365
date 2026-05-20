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

/** CPF/CNPJ em formato aceito pela API v1 (com máscara quando possível). */
export function formatTaxIdForAbacate(
  raw?: string
): string {
  const digits = (raw || "11144477735").replace(/\D/g, "");

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  return "111.444.777-35";
}

/** Extrai id do cliente conforme OpenAPI v1: { data: { id }, error: null } */
export function extractCustomerId(
  payload: unknown
): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as Record<string, unknown>;

  if (typeof root.id === "string" && root.id.trim()) {
    return root.id.trim();
  }

  const data = root.data;
  if (data && typeof data === "object") {
    const dataObj = data as Record<string, unknown>;

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
      const customerObj =
        nestedCustomer as Record<string, unknown>;
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
    const customerObj = customer as Record<string, unknown>;
    if (
      typeof customerObj.id === "string" &&
      customerObj.id.trim()
    ) {
      return customerObj.id.trim();
    }
  }

  return null;
}

/** Extrai URL de pagamento conforme OpenAPI v1: { data: { url }, error: null } */
export function extractBillingUrl(
  payload: unknown
): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as Record<string, unknown>;

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
    const dataObj = data as Record<string, unknown>;

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
      const billingObj = billing as Record<string, unknown>;
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

/** Extrai id da cobrança (bill_…) conforme OpenAPI v1/v2. */
export function extractBillingId(
  payload: unknown
): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as Record<string, unknown>;

  if (typeof root.id === "string" && root.id.trim()) {
    return root.id.trim();
  }

  const data = root.data;
  if (data && typeof data === "object") {
    const dataObj = data as Record<string, unknown>;
    if (
      typeof dataObj.id === "string" &&
      dataObj.id.trim()
    ) {
      return dataObj.id.trim();
    }
    const billing = dataObj.billing;
    if (billing && typeof billing === "object") {
      const billingObj = billing as Record<string, unknown>;
      if (
        typeof billingObj.id === "string" &&
        billingObj.id.trim()
      ) {
        return billingObj.id.trim();
      }
    }
    const checkout = dataObj.checkout;
    if (checkout && typeof checkout === "object") {
      const checkoutObj = checkout as Record<string, unknown>;
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

  const root = payload as Record<string, unknown>;

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
    const dataObj = data as Record<string, unknown>;
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

  let bodyPreview: string | undefined;
  if (typeof init.body === "string") {
    try {
      const parsed = JSON.parse(init.body);
      bodyPreview = JSON.stringify(parsed).slice(0, 1200);
    } catch {
      bodyPreview = String(init.body).slice(0, 400);
    }
  }

  console.log(`${logPrefix} [REQUEST]`, {
    url,
    method,
    bodyPreview,
  });

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  const parsed = await parseAbacateResponse(res);

  console.log(`${logPrefix} [RESPONSE]`, {
    status: parsed.status,
    ok: parsed.ok,
    durationMs: Date.now() - startedAt,
    customerId: extractCustomerId(parsed.body),
    billingUrl: extractBillingUrl(parsed.body),
    errorMessage: parsed.ok
      ? null
      : extractAbacateErrorMessage(parsed.body),
    bodyPreview: JSON.stringify(parsed.body).slice(0, 2000),
  });

  return parsed;
}

const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY!;

const headers = {
  Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
  "Content-Type": "application/json",
};

export async function createPixPayment(data: {
  amount: number;
  description: string;
  customer: {
    name: string;
    cellphone: string;
    email: string;
  };
}) {
  const response = await fetch(
    "https://api.abacatepay.com/v1/pixQrCode/create",
    {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    console.error(result);
    throw new Error(result.message || "Erro ao criar pagamento");
  }

  return result;
}
