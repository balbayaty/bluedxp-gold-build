/**
 * Optimization Center Page
 *
 * What-If Scenario Builder for journey optimization
 * Real-time impact analysis on journey time, sustainability, and ROI
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import { OptimizationCenter } from "@/components/analytics";

export default function OptimizationCenterPage() {
  return (
    <PageTemplate
      title="Optimization Center"
      description="What-If Scenario Builder for journey optimization with real-time impact analysis"
      icon="ri-settings-3-line"
    >
      <OptimizationCenter />
    </PageTemplate>
  );
}
