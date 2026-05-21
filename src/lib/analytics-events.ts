/** Funil — constantes estáveis; tipos leves (evita unions gigantes no tsc) */
export const FunnelEvents = {
  LANDING_VIEW: "landing_view",
  CREATE_STARTED: "create_started",
  STEP_1_COMPLETED: "step_1_completed",
  STEP_2_COMPLETED: "step_2_completed",
  STEP_3_COMPLETED: "step_3_completed",
  STEP_4_COMPLETED: "step_4_completed",
  PAYMENT_REDIRECT: "payment_redirect",
  PAYMENT_PENDING: "payment_pending",
  PAYMENT_APPROVED: "payment_approved",
  TRIBUTE_OPENED: "tribute_opened",
  TRIBUTE_SHARED: "tribute_shared",
  PLAN_SELECTED: "plan_selected",
  UPSELL_VIEWED: "upsell_viewed",
} as const;

export type FunnelEventName = string;
export type AnalyticsEventName = string;

/** Aliases legados */
export const AnalyticsEvents = {
  ...FunnelEvents,
  VIEW_LANDING: FunnelEvents.LANDING_VIEW,
  START_CREATE: FunnelEvents.CREATE_STARTED,
  STEP_COMPLETED: "step_completed",
  PAYMENT_REDIRECT: FunnelEvents.PAYMENT_REDIRECT,
  PAYMENT_APPROVED: FunnelEvents.PAYMENT_APPROVED,
  TRIBUTE_OPENED: FunnelEvents.TRIBUTE_OPENED,
  PLAN_SELECTED: FunnelEvents.PLAN_SELECTED,
  UPSELL_VIEWED: FunnelEvents.UPSELL_VIEWED,
} as const;

export type AnalyticsPayload = Record<
  string,
  string | number | boolean | undefined
>;

export function funnelStepEvent(step: number): string | null {
  switch (step) {
    case 1:
      return FunnelEvents.STEP_1_COMPLETED;
    case 2:
      return FunnelEvents.STEP_2_COMPLETED;
    case 3:
      return FunnelEvents.STEP_3_COMPLETED;
    case 4:
      return FunnelEvents.STEP_4_COMPLETED;
    default:
      return null;
  }
}
