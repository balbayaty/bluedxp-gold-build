/**
 * Load Building Analytics Page
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import LoadBuildingAnalyticsDashboard from "@/components/transportation/analytics/LoadBuildingAnalyticsDashboard";
import type { LoadPlan } from "@/lib/services/transportation";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";
import { PremiumLoader } from "@/components/loading";

export default function LoadBuildingAnalyticsPage() {
  const [loadPlans, setLoadPlans] = useState<LoadPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const res = await apiFetch("/api/transportation/load-building");
      if (!res.ok) throw new Error(`Failed to load load plans (${res.status})`);
      const json = (await res.json()) as { loadPlans?: LoadPlan[] };
      setLoadPlans(Array.isArray(json.loadPlans) ? json.loadPlans : []);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading load plans", err, {
        module: "transportation",
        service: "load-building-analytics",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "load-building-analytics",
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Load Building Analytics"
        description="Loading..."
        icon="ri-bar-chart-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Analyzing load optimization..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Load Building Analytics"
      description="Comprehensive insights into load optimization and building performance"
      icon="ri-bar-chart-line"
    >
      {error && (
        <div className="text-red-300 mb-4">
          Failed to load load plan analytics: {error}
        </div>
      )}
      <LoadBuildingAnalyticsDashboard loadPlans={loadPlans} />
    </PageTemplate>
  );
}
