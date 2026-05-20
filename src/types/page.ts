export type PagePlan = "BASIC" | "PREMIUM";

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
  contact?: string | null;
  status?: PageStatus | string;
  abacateBillingId?: string | null;
  paidAt?: Date | null;
  emailSentAt?: Date | null;
  lastPaymentSyncAt?: Date | null;
  createdAt?: Date | null;
}
