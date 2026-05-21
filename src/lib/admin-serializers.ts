import { resolveBuyerContact } from "@/lib/delivery/buyer-contact";
import { getPlanPriceCents, type PlanId } from "@/lib/pricing";
import { isPaidPageStatus } from "@/lib/page-status";
import type { PageDocument } from "@/types/page";
import type { DeliveryStatus } from "@/types/delivery";

export type AdminTributeRow = {
  token: string;
  names: string;
  plan: string;
  status: string;
  createdAt: string | null;
  paidAt: string | null;
  contact: string | null;
  email: string | null;
  whatsapp: string | null;
  photoCount: number;
  priceCents: number;
  priceDisplay: string;
  abacateBillingId: string | null;
  pageUrl: string;
  emailDeliveryStatus: DeliveryStatus | string | null;
  whatsappDeliveryStatus: DeliveryStatus | string | null;
  emailDeliveredAt: string | null;
  whatsappDeliveredAt: string | null;
  deliveredAt: string | null;
  deliveryError: string | null;
};

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function resolvePlanId(plan: string): PlanId {
  return String(plan).toUpperCase() === "PREMIUM"
    ? "PREMIUM"
    : "BASIC";
}

function iso(d?: Date | null): string | null {
  return d ? new Date(d).toISOString() : null;
}

export function serializeTributeRow(
  page: PageDocument,
  siteBase: string
): AdminTributeRow {
  const plan = String(page.plan || "BASIC").toUpperCase();
  const planId = resolvePlanId(plan);
  const paid = isPaidPageStatus(page.status);
  const priceCents = paid ? getPlanPriceCents(planId) : 0;
  const buyer = resolveBuyerContact(page);

  return {
    token: page.token,
    names: page.names,
    plan,
    status: page.status ?? "PENDING",
    createdAt: iso(page.createdAt),
    paidAt: iso(page.paidAt),
    contact: page.contact ?? null,
    email: buyer.email,
    whatsapp: buyer.whatsapp,
    photoCount: page.photoUrls?.length ?? 0,
    priceCents,
    priceDisplay: paid ? formatBRL(priceCents) : "—",
    abacateBillingId: page.abacateBillingId ?? null,
    pageUrl: siteBase
      ? `${siteBase}/p/${page.token}`
      : `/p/${page.token}`,
    emailDeliveryStatus: page.emailDeliveryStatus ?? null,
    whatsappDeliveryStatus: page.whatsappDeliveryStatus ?? null,
    emailDeliveredAt: iso(page.emailDeliveredAt),
    whatsappDeliveredAt: iso(page.whatsappDeliveredAt),
    deliveredAt: iso(page.deliveredAt),
    deliveryError: page.deliveryError ?? null,
  };
}
