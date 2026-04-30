/**
 * 🧠 INTELLIGENT DASHBOARD
 * Simplified version to fix import issues
 */

"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import UltimateConsolidatedDashboard
const UltimateConsolidatedDashboard = dynamic(
  () => import("./UltimateConsolidatedDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-[#111827]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white/70">Loading Dashboard...</div>
        </div>
      </div>
    ),
  },
);

interface IntelligentDashboardProps {
  tenantId?: string;
  userId?: string;
  userRole?: string;
  enabledModules?: string[];
  initialLayout?: string;
}

const IntelligentDashboard: React.FC<IntelligentDashboardProps> = ({
  tenantId = "default",
  userId = "anonymous",
  userRole = "user",
  enabledModules = [],
  initialLayout = "executive-overview",
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <UltimateConsolidatedDashboard
        tenantId={tenantId}
        userId={userId}
        userRole={userRole}
        enabledModules={enabledModules}
        initialLayout={initialLayout}
      />
    </div>
  );
};

export default IntelligentDashboard;
