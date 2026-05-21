export type DeliveryStatus =
  | "pending"
  | "sent"
  | "failed"
  | "skipped";

export type DeliveryChannel = "email" | "whatsapp";

export type BuyerContact = {
  email: string | null;
  whatsapp: string | null;
};
