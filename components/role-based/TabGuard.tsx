"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TabId } from "@/types/user";
import { hasTabAccess } from "@/utils/permissions";

interface TabGuardProps {
  tabId: TabId;
  requiredAccess?: "full" | "partial" | "read_only";
  children: ReactNode;
  fallback?: ReactNode;
  context?: { customerId?: string; warehouseId?: string };
}

/**
 * TabGuard - Protects content based on tab-level access
 *
 * Usage:
 * <TabGuard tabId="wms.inbound.asn" requiredAccess="read_write">
 *   <ASNManagement />
 * </TabGuard>
 */
export default function TabGuard({
  tabId,
  requiredAccess = "read_only",
  children,
  fallback = null,
  context,
}: TabGuardProps) {
  const { user } = useAuth();

  if (!user || !hasTabAccess(user, tabId, requiredAccess, context)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
