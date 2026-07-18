"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type StoreAnalyticsEventType = "page_view" | "product_view" | "product_click" | "add_to_cart" | "heartbeat";

let lastPageViewKey = "";

function currentPath(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

function shouldTrack(path: string) {
  return !["/admin", "/api", "/login", "/cambiar-contrasena"].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function trackStoreAnalytics(eventType: StoreAnalyticsEventType, productSkuId?: number, path = window.location.pathname + window.location.search) {
  if (!shouldTrack(path)) return;

  const payload = JSON.stringify({ eventType, productSkuId, path });
  if (eventType === "product_click" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/store/analytics", new Blob([payload], { type: "application/json" }));
    return;
  }

  fetch("/api/store/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true
  }).catch(() => {});
}

export function StoreAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const path = currentPath(pathname, searchParams.toString());
    if (!shouldTrack(path)) return;

    if (lastPageViewKey !== path) {
      lastPageViewKey = path;
      trackStoreAnalytics("page_view", undefined, path);
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") trackStoreAnalytics("heartbeat", undefined, path);
    }, 45000);

    return () => window.clearInterval(interval);
  }, [pathname, searchParams]);

  return null;
}

export function ProductViewTracker({ productSkuId }: { productSkuId: number }) {
  useEffect(() => {
    trackStoreAnalytics("product_view", productSkuId);
  }, [productSkuId]);

  return null;
}
