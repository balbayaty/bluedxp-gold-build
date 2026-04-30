"use client";

import { useEffect, useMemo, useState } from "react";
import type { CapabilityStatus } from "@/types/capabilities";

export function useResolvedCapabilityStatus(
  pathname: string,
  base: CapabilityStatus | null,
): CapabilityStatus | null {
  const [resolved, setResolved] = useState<CapabilityStatus | null>(null);

  const shouldFetch = useMemo(() => {
    if (!base) return false;
    if (!(pathname || "").toLowerCase().startsWith("/transportation"))
      return false;
    // Only worth fetching if there's a chance it can change automatically.
    return base.maturity === "config_required" && !!base.autoUpgrade;
  }, [base, pathname]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!shouldFetch) {
        setResolved(null);
        return;
      }
      try {
        const res = await fetch(
          `/api/transportation/capabilities/status?path=${encodeURIComponent(pathname)}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
          },
        );
        if (!res.ok) return;
        const json = (await res.json()) as { status: CapabilityStatus | null };
        if (cancelled) return;
        if (json?.status) setResolved(json.status);
      } catch {
        // Silent: status dot should never crash a page
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [pathname, shouldFetch]);

  return resolved || base;
}
