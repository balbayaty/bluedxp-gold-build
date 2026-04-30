"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ModuleId } from "@/types/user";
import { hasModuleAccess } from "@/utils/permissions";

interface ModuleGuardProps {
  moduleId: ModuleId;
  requiredAccess?: "full" | "partial" | "read_only";
  children: ReactNode;
  fallback?: ReactNode;
  context?: { customerId?: string; warehouseId?: string };
}

/**
 * ModuleGuard - Protects content based on module-level access
 *
 * Usage:
 * <ModuleGuard moduleId="wms" requiredAccess="read_only">
 *   <WMSContent />
 * </ModuleGuard>
 */
export default function ModuleGuard({
  moduleId,
  requiredAccess = "read_only",
  children,
  fallback = null,
  context,
}: ModuleGuardProps) {
  const { user } = useAuth();

  if (!user || !hasModuleAccess(user, moduleId, requiredAccess, context)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
