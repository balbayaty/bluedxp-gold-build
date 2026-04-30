/**
 * MaaS Dashboard
 *
 * Comprehensive Manufacturing as a Service dashboard
 * Shows overview metrics, 12 pillars, revenue, and utilization
 *
 * @module maas
 */

"use client";

import { useEffect, useState } from "react";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import MaaSDashboard from "@/components/maas/MaaSDashboard";
import EnhancedMaaSDashboard from "@/components/maas/EnhancedMaaSDashboard";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

interface MaaSDashboardData {
  totalTenants: number;
  activePillars: number;
  totalRevenue: number;
  utilizationRate: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
  pillars: Array<{
    id: string;
    name: string;
    utilization: number;
    revenue: number;
    status: "active" | "inactive" | "pending";
  }>;
  revenueByPillar: Array<{
    pillar: string;
    revenue: number;
    percentage: number;
  }>;
  utilizationTrend: Array<{
    date: string;
    utilization: number;
  }>;
}

function MaasPageContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MaaSDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/maas");

        if (!response.ok) {
          throw new Error(
            `Failed to fetch MaaS dashboard (${response.status})`,
          );
        }

        const result = await response.json();

        // Transform API response to match component expectations
        const dashboardData: MaaSDashboardData = {
          totalTenants: result.dashboard?.totalTenants || 0,
          activePillars: result.dashboard?.activePillars || 12,
          totalRevenue: result.dashboard?.totalRevenue || 0,
          utilizationRate: result.dashboard?.utilizationRate || 0,
          recentActivity: result.dashboard?.recentActivity || [],
          pillars: result.dashboard?.pillars || [],
          revenueByPillar: result.dashboard?.revenueByPillar || [],
          utilizationTrend: result.dashboard?.utilizationTrend || [],
        };

        setData(dashboardData);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error("Error fetching MaaS dashboard data", err, {
          module: "maas",
          service: "dashboard",
        });
        errorTrackingService.captureException(err, {
          module: "maas",
          service: "dashboard",
        });
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <PageTemplate
        title="MaaS Dashboard"
        description="Manufacturing as a Service - 12 Shared Services Pillars"
        icon="ri-factory-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading MaaS Dashboard..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="MaaS Dashboard"
        description="Manufacturing as a Service - 12 Shared Services Pillars"
        icon="ri-factory-line"
      >
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
          >
            Retry
          </button>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="MaaS Dashboard"
      description="Manufacturing as a Service - 12 Shared Services Pillars"
      icon="ri-factory-line"
    >
      <div className="space-y-6">
        {/* Enhanced Dashboard with Multi-Layer Architecture */}
        <EnhancedMaaSDashboard />

        {/* Legacy Dashboard (can be toggled) */}
        {/* <MaaSDashboard data={data || undefined} loading={loading} /> */}
      </div>
    </PageTemplate>
  );
}

export default function MaasPagePage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="MaaS Dashboard"
          description="MaaS Dashboard - maas module"
          icon="ri-factory-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <MaasPageContent />
    </ErrorBoundary>
  );
}
