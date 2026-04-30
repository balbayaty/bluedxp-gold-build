/**
 * Network Analytics Page
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import NetworkAnalyticsDashboard from "@/components/transportation/analytics/NetworkAnalyticsDashboard";
import type {
  NetworkModel,
  NetworkOptimizationResult,
} from "@/lib/services/transportation";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";
import { PremiumLoader } from "@/components/loading";

export default function NetworkAnalyticsPage() {
  const [models, setModels] = useState<NetworkModel[]>([]);
  const [optimizations, setOptimizations] = useState<
    NetworkOptimizationResult[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const res = await apiFetch("/api/transportation/network-modeling");
      if (!res.ok)
        throw new Error(`Failed to load network models (${res.status})`);
      const json = (await res.json()) as {
        models?: NetworkModel[];
        optimizations?: NetworkOptimizationResult[];
      };
      setModels(Array.isArray(json.models) ? json.models : []);
      setOptimizations(
        Array.isArray(json.optimizations) ? json.optimizations : [],
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading data", err, {
        module: "transportation",
        service: "network-analytics",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "network-analytics",
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Network Analytics"
        description="Loading..."
        icon="ri-bar-chart-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Analyzing network performance..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Network Analytics"
      description="Comprehensive insights into network performance and optimization"
      icon="ri-bar-chart-line"
    >
      {error && (
        <div className="text-red-300 mb-4">
          Failed to load network analytics: {error}
        </div>
      )}
      <NetworkAnalyticsDashboard
        models={models}
        optimizations={optimizations}
      />
    </PageTemplate>
  );
}
