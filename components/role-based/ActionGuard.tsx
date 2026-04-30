"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ModuleId, FeatureId, TabId, Action } from "@/types/user";
import { canPerformAction } from "@/utils/permissions";

interface ActionGuardProps {
  moduleId: ModuleId;
  featureId?: FeatureId;
  tabId?: TabId;
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
  context?: { customerId?: string; warehouseId?: string };
}

/**
 * ActionGuard - Protects content based on specific action permissions
 *
 * Usage:
 * <ActionGuard moduleId="wms" featureId="wms.inbound" action="write">
 *   <CreateButton />
 * </ActionGuard>
 */
export default function ActionGuard({
  moduleId,
  featureId,
  tabId,
  action,
  children,
  fallback = null,
  context,
}: ActionGuardProps) {
  const { user } = useAuth();

  if (
    !user ||
    !canPerformAction(user, moduleId, featureId, tabId, action, context)
  ) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
