"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Resource, Action } from "@/types/user";

interface PermissionGuardProps {
  resource: Resource;
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
  context?: { customerId?: string; warehouseId?: string };
}

export default function PermissionGuard({
  resource,
  action,
  children,
  fallback = null,
  context,
}: PermissionGuardProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(resource, action, context)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
