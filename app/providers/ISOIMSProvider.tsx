/**
 * ISO IMS Provider
 *
 * Initializes ISO IMS services and agents on client-side
 */

"use client";

import { useEffect } from "react";

export function ISOIMSProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let mounted = true;

    async function initializeISOIMS() {
      try {
        // Initialize ISO IMS Edge Service (client-side)
        const { isoIMSEdgeService } =
          await import("@/lib/services/iso-ims/edge/isoIMSEdgeService");
        await isoIMSEdgeService.initialize();

        if (!mounted) return;

        console.log("✅ ISO IMS Client-side services initialized");
      } catch (error) {
        // Fail gracefully - don't break the app
        console.warn("⚠️ ISO IMS client-side initialization failed:", error);
      }
    }

    initializeISOIMS();

    return () => {
      mounted = false;
    };
  }, []);

  return <>{children}</>;
}
