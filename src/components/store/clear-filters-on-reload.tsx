"use client";

import { useEffect } from "react";

export function ClearFiltersOnReload() {
  useEffect(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === "reload" && window.location.pathname === "/tienda" && window.location.search) {
      window.location.replace("/tienda");
    }
  }, []);

  return null;
}
