"use client";

/**
 * HazalyzeCopilot Integration Component
 * Wraps the copilot widget and integrates with auth context
 * This is the component that Layout.tsx imports
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HazalyzeCopilotWidget } from "./copilot/HazalyzeCopilotWidget";

export default function HazalyzeCopilot() {
  const { user, tenant, isAuthenticated, isLoading, isHydrated } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Only render on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Silent operation - no debug logging

  // Don't render if:
  // - Not mounted (client-side only)
  // - Not hydrated (prevents hydration mismatch)
  // - Still loading auth
  // - Not authenticated
  // - Missing user (tenant can be optional with fallback)
  if (!mounted || !isHydrated || isLoading || !isAuthenticated || !user) {
    return null;
  }

  // Get tenantId and userId with fallbacks
  // Tenant is optional - use user's tenantId or create a default
  const tenantId =
    tenant?.id || user.tenantId || `tenant-${user.id}` || "default-tenant";
  const userId = user.id || "default-user";

  // Log in development if tenant is missing
  if (process.env.NODE_ENV === "development" && !tenant) {
    console.warn("[HazalyzeCopilot] Tenant not set, using fallback:", tenantId);
  }

  // Calculate position - DIFFERENT position to avoid overlap
  const getDefaultPosition = () => {
    if (typeof window === "undefined") return { x: 100, y: 100 };
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Main copilot: TOP-RIGHT corner (not bottom-right)
    return {
      x: width - 440, // Right side
      y: 100, // Top area, not bottom
    };
  };

  return (
    <HazalyzeCopilotWidget
      tenantId={tenantId}
      userId={userId}
      defaultPosition={getDefaultPosition()}
      defaultSize={{ width: 420, height: 600 }}
      widgetId="main-copilot"
    />
  );
}

// Named export for compatibility
export { HazalyzeCopilot };
