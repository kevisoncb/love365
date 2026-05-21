import { createLogger } from "@/lib/logger";
import type {
  AnalyticsEventName,
  AnalyticsPayload,
} from "@/lib/analytics-events";

const analyticsLog = createLogger("ANALYTICS");

function sanitizePayload(
  payload?: AnalyticsPayload
): Record<string, string | number | boolean> {
  if (!payload) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (
      v !== undefined &&
      (typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean")
    ) {
      out[k] = v;
    }
  }
  return out;
}

/** Apenas servidor — não importar em Client Components */
export function trackServerEvent(
  event: AnalyticsEventName,
  payload?: AnalyticsPayload
): void {
  analyticsLog.info("server event", {
    meta: {
      event,
      ...sanitizePayload(payload),
    },
  });
}
