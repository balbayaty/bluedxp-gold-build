/**
 * FeatureGate Component
 *
 * Conditionally renders children based on module availability
 */

"use client";

import { ReactNode } from "react";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";

interface FeatureGateProps {
  moduleId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({
  moduleId,
  children,
  fallback = null,
}: FeatureGateProps) {
  const enabled = useModuleEnabled(moduleId);

  if (!enabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
