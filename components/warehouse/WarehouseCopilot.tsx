/**
 * Warehouse Copilot Component
 * AI assistant for warehouse operations - Now uses the widget system
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import { useAuth } from "@/contexts/AuthContext";
import { HazalyzeCopilotWidget } from "@/components/copilot/HazalyzeCopilotWidget";
import { useEffect, useState } from "react";

interface WarehouseCopilotProps {
  warehouseId: string;
}

export default function WarehouseCopilot({
  warehouseId,
}: WarehouseCopilotProps) {
  const { user, tenant } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) return null;

  const tenantId =
    tenant?.id || user.tenantId || `tenant-${user.id}` || "default-tenant";
  const userId = user.id || "default-user";

  // Calculate position - TOP-LEFT to avoid overlap with main copilot (top-right)
  const getDefaultPosition = () => {
    if (typeof window === "undefined") return { x: 100, y: 100 };

    // Warehouse copilot: TOP-LEFT corner (completely different from main)
    return {
      x: 100, // Left side
      y: 100, // Top area
    };
  };

  return (
    <HazalyzeCopilotWidget
      tenantId={tenantId}
      userId={userId}
      defaultPosition={getDefaultPosition()}
      defaultSize={{ width: 420, height: 600 }}
      widgetId="warehouse-copilot"
      title="Warehouse Copilot"
    />
  );
}
