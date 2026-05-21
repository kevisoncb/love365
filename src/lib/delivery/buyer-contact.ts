import type { PageDocument } from "@/types/page";
import type { BuyerContact } from "@/types/delivery";

/** Apenas contato do comprador — nunca destinatário da homenagem */
export function resolveBuyerContact(
  page: PageDocument
): BuyerContact {
  const email =
    page.buyerEmail?.trim() ||
    (page.contact?.includes("@") ? page.contact.trim() : null) ||
    null;

  const whatsapp =
    page.buyerWhatsapp?.trim() ||
    (page.contact && !page.contact.includes("@")
      ? page.contact.trim()
      : null) ||
    null;

  return {
    email: email || null,
    whatsapp: whatsapp ? normalizeWhatsApp(whatsapp) : null,
  };
}

/** Dígitos E.164 Brasil (55 + DDD + número) */
export function normalizeWhatsApp(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;

  if (digits.startsWith("55") && digits.length >= 12) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  if (digits.length >= 12) {
    return digits;
  }
  return null;
}

export function formatWhatsAppDisplay(e164: string): string {
  if (e164.startsWith("55") && e164.length >= 12) {
    const rest = e164.slice(2);
    const ddd = rest.slice(0, 2);
    const num = rest.slice(2);
    return `+55 (${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
  }
  return `+${e164}`;
}
