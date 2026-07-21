"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type EventPayload = Record<string, string | number | boolean>;

const queue: { name: string; payload?: EventPayload }[] = [];

function processQueue() {
  if (typeof window === "undefined") return;
  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  if (!endpoint) return;
  while (queue.length > 0) {
    const event = queue.shift();
    if (event) {
      navigator.sendBeacon(
        endpoint,
        JSON.stringify({ ...event, url: window.location.href, timestamp: new Date().toISOString() })
      );
    }
  }
}

export function track(name: string, payload?: EventPayload) {
  queue.push({ name, payload });
  processQueue();
}

export function usePageViewAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    track("page_view", {
      path: pathname,
      search: searchParams?.toString() || "",
    });
  }, [pathname, searchParams]);
}
