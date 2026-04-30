/**
 * 🚀 ULTIMATE CONSOLIDATED DASHBOARD PAGE
 * The most advanced dashboard combining all best features
 */

"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";
import dynamic from "next/dynamic";

// Lazy load heavy dashboard component for faster navigation
const UltimateConsolidatedDashboard = dynamic(
  () => import("@/components/dashboards/UltimateConsolidatedDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-[#111827]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white/70">Loading Dashboard...</div>
        </div>
      </div>
    ),
  },
);

export default function UltimateDashboardPage() {
  const { user } = useAuth();
  const { currentCustomer } = useCustomer();

  return (
    <div className="min-h-screen">
      <UltimateConsolidatedDashboard
        tenantId={currentCustomer?.id || "default"}
        userId={user?.id || "anonymous"}
        userRole={user?.role || "user"}
        enabledModules={user?.enabledModules || []}
        initialLayout="executive-overview"
      />
    </div>
  );
}
