/**
 * Scenario Analytics Page
 *
 * Comprehensive analytics dashboard for scenario simulation
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import ScenarioAnalyticsDashboard from "@/components/transportation/analytics/ScenarioAnalyticsDashboard";
import type { ScenarioSimulation } from "@/lib/services/transportation";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";
import { PremiumLoader } from "@/components/loading";

export default function ScenarioAnalyticsPage() {
  const [simulations, setSimulations] = useState<ScenarioSimulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimulations();
  }, []);

  const loadSimulations = async () => {
    try {
      const response = await apiFetch(
        "/api/transportation/scenario-simulation?action=list",
      );
      const data = await response.json();
      setSimulations(data.simulations || []);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading simulations", err, {
        module: "transportation",
        service: "scenario-analytics",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "scenario-analytics",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDrillDown = (simulationId: string) => {
    window.location.href = `/transportation/scenario-simulation?id=${simulationId}`;
  };

  if (loading) {
    return (
      <PageTemplate
        title="Scenario Analytics"
        description="Loading..."
        icon="ri-bar-chart-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading scenario simulations..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Scenario Analytics"
      description="Comprehensive insights into scenario performance and optimization"
      icon="ri-bar-chart-line"
    >
      <ScenarioAnalyticsDashboard
        simulations={simulations}
        onDrillDown={handleDrillDown}
      />
    </PageTemplate>
  );
}
