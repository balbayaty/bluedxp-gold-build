/**
 * Route Optimization Dashboard Page
 *
 * High-level overview of route optimization
 * Journey time analysis, bottlenecks, optimization strategy, and business impact
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import RouteOptimizationDashboard from "@/components/transportation/RouteOptimizationDashboard";

export default function RouteOptimizationPage() {
  return (
    <PageTemplate
      title="Route Optimization Dashboard"
      description="High-level overview of route optimization with journey analysis and business impact"
      icon="ri-route-line"
    >
      <RouteOptimizationDashboard />
    </PageTemplate>
  );
}
