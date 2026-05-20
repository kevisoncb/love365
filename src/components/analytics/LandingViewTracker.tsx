"use client";

import { useEffect } from "react";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics";

export function LandingViewTracker() {
  useEffect(() => {
    trackEvent(AnalyticsEvents.VIEW_LANDING, { page: "home" });
  }, []);
  return null;
}
