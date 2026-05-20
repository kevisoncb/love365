import type { JsonObject } from "@/types/abacatepay";

export function asJsonObject(
  value: unknown
): JsonObject | null {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as JsonObject;
  }
  return null;
}

export function pickFirstString(
  ...values: unknown[]
): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
  }
  return null;
}

export function getNestedString(
  obj: JsonObject | null,
  key: string
): string | null {
  if (!obj) return null;
  const nested = obj[key];
  const record = asJsonObject(nested);
  if (!record) return null;
  return pickFirstString(record.status);
}
