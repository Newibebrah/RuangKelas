"use client";

import { usePageViewAnalytics } from "@/lib/analytics";

export function AnalyticsTracker() {
  usePageViewAnalytics();
  return null;
}
