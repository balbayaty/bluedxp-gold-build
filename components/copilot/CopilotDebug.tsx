"use client";

/**
 * Copilot Debug Component
 * Shows debug info about why copilot might not be visible
 * Only shows in development mode
 */

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export function CopilotDebug() {
  const { user, tenant, isAuthenticated, isLoading, isHydrated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== "development" || !mounted) {
    return null;
  }

  const canRender =
    mounted &&
    isHydrated &&
    !isLoading &&
    isAuthenticated &&
    !!user &&
    !!tenant;

  return (
    <div className="fixed top-20 right-4 z-[10000] bg-yellow-900/90 text-yellow-100 p-4 rounded-lg text-xs max-w-sm">
      <div className="font-bold mb-2">🔍 Copilot Debug Info</div>
      <div className="space-y-1">
        <div>Mounted: {mounted ? "✅" : "❌"}</div>
        <div>Hydrated: {isHydrated ? "✅" : "❌"}</div>
        <div>Loading: {isLoading ? "⏳" : "✅"}</div>
        <div>Authenticated: {isAuthenticated ? "✅" : "❌"}</div>
        <div>User: {user ? `✅ (${user.id})` : "❌"}</div>
        <div>Tenant: {tenant ? `✅ (${tenant.id})` : "❌"}</div>
        <div className="mt-2 pt-2 border-t border-yellow-700">
          <strong>Can Render: {canRender ? "✅ YES" : "❌ NO"}</strong>
        </div>
        {!canRender && (
          <div className="mt-2 text-yellow-300">
            {!mounted && "• Waiting for mount"}
            {!isHydrated && "• Waiting for hydration"}
            {isLoading && "• Still loading auth"}
            {!isAuthenticated && "• Not authenticated"}
            {!user && "• No user"}
            {!tenant && "• No tenant"}
          </div>
        )}
      </div>
    </div>
  );
}
