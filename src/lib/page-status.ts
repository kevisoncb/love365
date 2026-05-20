/** Statuses que indicam página liberada para o casal. */
export const PAID_PAGE_STATUSES = new Set([
  "PAID",
  "APPROVED",
  "CONFIRMED",
  "SUCCEEDED",
  "SUCCESS",
]);

export function isPaidPageStatus(
  status?: string | null
): boolean {
  if (!status || typeof status !== "string") {
    return false;
  }
  return PAID_PAGE_STATUSES.has(
    status.trim().toUpperCase()
  );
}

/** Status canônico gravado no Mongo após confirmação. */
export const CANONICAL_PAID_STATUS = "PAID";

export function normalizeIncomingPaymentStatus(
  raw?: string | null
): string | null {
  if (!raw || typeof raw !== "string") {
    return null;
  }
  return raw.trim().toUpperCase();
}

export function isAbacatePaymentApproved(
  status?: string | null,
  event?: string | null
): boolean {
  const normalized = normalizeIncomingPaymentStatus(
    status
  );
  const ev = (event || "").trim().toLowerCase();

  if (
    ev === "checkout.completed" ||
    ev === "billing.paid" ||
    ev === "payment.paid"
  ) {
    return true;
  }

  if (!normalized) {
    return false;
  }

  return (
    normalized === "PAID" ||
    normalized === "APPROVED" ||
    normalized === "CONFIRMED" ||
    normalized === "SUCCEEDED" ||
    normalized === "SUCCESS"
  );
}
