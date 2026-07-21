"use client";

import { useReportWebVitals } from "next/web-vitals";

const ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (!ANALYTICS_ENDPOINT) return;

    const body = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon(ANALYTICS_ENDPOINT, JSON.stringify(body));
    }
  });

  return null;
}
