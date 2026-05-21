export type PagePlan = "BASIC" | "PREMIUM";

import type { DeliveryStatus } from "@/types/delivery";

export type PageStatus =
  | "PENDING"
  | "PAID"
  | "APPROVED";

/** Documento Mongo enxuto (lean) usado em APIs e webhooks */
export interface PageDocument {
  token: string;
  plan: PagePlan | string;
  names: string;
  date: string;
  youtubeUrl?: string | null;
  message?: string | null;
  photoUrls?: string[];
  /** Legado: e-mail ou WhatsApp do comprador */
  contact?: string | null;
  buyerEmail?: string | null;
  buyerWhatsapp?: string | null;
  status?: PageStatus | string;
  abacateBillingId?: string | null;
  paidAt?: Date | null;
  emailSentAt?: Date | null;
  emailDeliveryStatus?: DeliveryStatus | string | null;
  whatsappDeliveryStatus?: DeliveryStatus | string | null;
  emailDeliveredAt?: Date | null;
  whatsappDeliveredAt?: Date | null;
  deliveredAt?: Date | null;
  deliveryError?: string | null;
  lastPaymentSyncAt?: Date | null;
  createdAt?: Date | null;
}
