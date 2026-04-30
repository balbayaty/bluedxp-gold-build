/**
 * Last-Mile Analytics Page
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import LastMileAnalyticsDashboard from "@/components/transportation/analytics/LastMileAnalyticsDashboard";
import type { DeliveryRoute } from "@/lib/services/transportation";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";
import { PremiumLoader } from "@/components/loading";

export default function LastMileAnalyticsPage() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const res = await apiFetch("/api/transportation/last-mile");
      if (!res.ok)
        throw new Error(`Failed to load last-mile routes (${res.status})`);
      const json = (await res.json()) as { routes?: DeliveryRoute[] };
      setRoutes(Array.isArray(json.routes) ? json.routes : []);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading routes", err, {
        module: "transportation",
        service: "last-mile-analytics",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "last-mile-analytics",
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Last-Mile Analytics"
        description="Loading..."
        icon="ri-bar-chart-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Analyzing last-mile delivery performance..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Last-Mile Analytics"
      description="Comprehensive insights into last-mile delivery performance"
      icon="ri-bar-chart-line"
    >
      {error && (
        <div className="text-red-300 mb-4">
          Failed to load last-mile analytics: {error}
        </div>
      )}
      <LastMileAnalyticsDashboard routes={routes} />
    </PageTemplate>
  );
}
