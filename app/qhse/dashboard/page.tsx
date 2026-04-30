/**
 * QHSE Dashboard Page
 * Main dashboard for Quality, Health, Safety, and Environment management
 * Enhanced with comprehensive RealTimeQHSEDashboard component
 * Production-ready with error boundaries and loading states
 */

"use client";

import RealTimeQHSEDashboard from "@/components/qhse/RealTimeQHSEDashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import { Suspense } from "react";

export default function QHSEDashboardPage() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <PremiumLoader
              message="Loading QHSE Dashboard..."
              size="xl"
              variant="default"
            />
          </div>
        }
      >
        <RealTimeQHSEDashboard
          autoRefresh={true}
          refreshInterval={30000}
          showKnowledgeBaseInsights={true}
          showCrossModuleConnections={true}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
