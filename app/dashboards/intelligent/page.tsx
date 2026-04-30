/**
 * 🧠 INTELLIGENT DASHBOARD PAGE
 * The most intelligent, friendly, efficient, smart, resilient, and forward-thinking dashboard
 * AI-powered with context awareness, predictive insights, and adaptive layouts
 */

"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";
import dynamic from "next/dynamic";

// Lazy load intelligent dashboard component for faster navigation
const IntelligentDashboard = dynamic(
  () => import("@/components/dashboards/IntelligentDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="text-white/70 text-lg font-medium mb-2">
            Loading Intelligent Dashboard...
          </div>
          <div className="text-cyan-400/60 text-sm">
            Initializing AI intelligence
          </div>
        </div>
      </div>
    ),
  },
);

export default function IntelligentDashboardPage() {
  const { user } = useAuth();
  const { currentCustomer } = useCustomer();

  return (
    <div className="min-h-screen">
      <IntelligentDashboard
        tenantId={currentCustomer?.id || "default"}
        userId={user?.id || "anonymous"}
        userRole={user?.role || "user"}
        enabledModules={user?.enabledModules || []}
        initialLayout="executive-overview"
      />
    </div>
  );
}
