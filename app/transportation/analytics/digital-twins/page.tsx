/**
 * Digital Twins Analytics Page
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import DigitalTwinsAnalyticsDashboard from "@/components/transportation/analytics/DigitalTwinsAnalyticsDashboard";
import type { DigitalTwin } from "@/lib/services/transportation";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { PremiumLoader } from "@/components/loading";

export default function DigitalTwinsAnalyticsPage() {
  const [twins, setTwins] = useState<DigitalTwin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // In production, fetch from API
      setTwins([]);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error loading twins", err, {
        module: "transportation",
        service: "digital-twins-analytics",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "digital-twins-analytics",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Digital Twins Analytics"
        description="Loading..."
        icon="ri-bar-chart-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading digital twins analytics..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Digital Twins Analytics"
      description="Comprehensive insights into digital twin health and predictions"
      icon="ri-bar-chart-line"
    >
      <DigitalTwinsAnalyticsDashboard twins={twins} />
    </PageTemplate>
  );
}
