"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FeatureId } from "@/types/user";
import { hasFeatureAccess } from "@/utils/permissions";

interface FeatureGuardProps {
  featureId: FeatureId;
  requiredAccess?: "full" | "partial" | "read_only";
  children: ReactNode;
  fallback?: ReactNode;
  context?: { customerId?: string; warehouseId?: string };
}

/**
 * FeatureGuard - Protects content based on feature-level access
 *
 * Usage:
 * <FeatureGuard featureId="wms.inbound" requiredAccess="read_write">
 *   <InboundOperations />
 * </FeatureGuard>
 */
export default function FeatureGuard({
  featureId,
  requiredAccess = "read_only",
  children,
  fallback = null,
  context,
}: FeatureGuardProps) {
  const { user } = useAuth();

  if (!user || !hasFeatureAccess(user, featureId, requiredAccess, context)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
