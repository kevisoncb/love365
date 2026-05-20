import { createLogger } from "@/lib/logger";
import {
  AnalyticsEvents,
  FunnelEvents,
  type AnalyticsEventName,
  type AnalyticsPayload,
  type FunnelEventName,
} from "@/lib/analytics-events";

declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
    fbq?: (
      command: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
    ttq?: {
      track: (
        eventName: string,
        params?: Record<string, unknown>
      ) => void;
    };
    dataLayer?: Record<string, unknown>[];
  }
}

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

const META_MAP: Partial<Record<string, string>> = {
  [FunnelEvents.LANDING_VIEW]: "ViewContent",
  [FunnelEvents.CREATE_STARTED]: "InitiateCheckout",
  [FunnelEvents.PAYMENT_REDIRECT]: "AddPaymentInfo",
  [FunnelEvents.PAYMENT_APPROVED]: "Purchase",
  [FunnelEvents.TRIBUTE_OPENED]: "ViewContent",
};

const TIKTOK_MAP: Partial<Record<string, string>> = {
  [FunnelEvents.LANDING_VIEW]: "ViewContent",
  [FunnelEvents.CREATE_STARTED]: "InitiateCheckout",
  [FunnelEvents.PAYMENT_REDIRECT]: "AddPaymentInfo",
  [FunnelEvents.PAYMENT_APPROVED]: "CompletePayment",
  [FunnelEvents.TRIBUTE_OPENED]: "ViewContent",
};

/** Rastreio no browser — GA4, Meta, TikTok + dataLayer */
export function trackEvent(
  event: AnalyticsEventName,
  payload?: AnalyticsPayload
): void {
  if (typeof window === "undefined") return;

  const params = sanitizePayload(payload);

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event,
      event_id: `${event}_${Date.now()}`,
      ...params,
    });
  } catch {
    /* noop */
  }

  try {
    window.gtag?.("event", event, {
      ...params,
      send_to: process.env.NEXT_PUBLIC_GA_ID,
    });
  } catch {
    /* noop */
  }

  const metaEvent = META_MAP[event];
  if (metaEvent && window.fbq) {
    window.fbq("track", metaEvent, params);
  }

  const tiktokEvent = TIKTOK_MAP[event];
  if (tiktokEvent && window.ttq?.track) {
    window.ttq.track(tiktokEvent, params);
  }

  if (process.env.NODE_ENV === "development") {
    analyticsLog.info("client event", { meta: { event, ...params } });
  }
}

export function trackFunnelEvent(
  event: FunnelEventName,
  payload?: AnalyticsPayload
): void {
  trackEvent(event, payload);
}

/** Log estruturado no servidor (Vercel Logs) */
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

export { AnalyticsEvents, FunnelEvents };
