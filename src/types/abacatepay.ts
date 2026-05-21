/** Tipos defensivos para respostas/webhooks AbacatePay v1/v2 */

export type JsonObject = Record<string, unknown>;

export type AbacateCheckoutPayload = {
  id?: string;
  externalId?: string;
  status?: string;
  url?: string;
  products?: Array<{ externalId?: string }>;
};

export type AbacateWebhookBody = {
  id?: string;
  eventId?: string;
  event?: string;
  type?: string;
  status?: string;
  externalId?: string;
  data?: AbacateWebhookData;
  _parseError?: boolean;
};

export type AbacateWebhookData = {
  id?: string;
  eventId?: string;
  logId?: string;
  status?: string;
  externalId?: string;
  checkout?: AbacateCheckoutPayload;
  billing?: AbacateCheckoutPayload;
  payment?: { status?: string };
  metadata?: { externalId?: string; token?: string };
  products?: Array<{ externalId?: string }>;
};

export type AbacateCustomerCreateBody = {
  name: string;
  email: string;
  cellphone: string;
  taxId: string;
};

export type AbacateApiEnvelope = {
  data?: JsonObject;
  error?: string | null;
  message?: string;
};
