"use client";

import { useEffect } from "react";

export function ClearFiltersOnReload({ basePath = "/tienda" }: { basePath?: string }) {
  useEffect(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === "reload" && window.location.pathname === basePath && window.location.search) {
      window.location.replace(basePath);
    }
  }, [basePath]);

  return null;
}
