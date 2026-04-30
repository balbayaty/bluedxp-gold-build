/**
 * Executive Dashboard Page
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import ExecutiveOverviewDashboard from "@/components/dashboards/ExecutiveOverviewDashboard";

export default function ExecutiveDashboardPage() {
  return (
    <PageTemplate
      title="Executive Overview"
      description="High-level metrics and KPIs for executives"
      icon="ri-dashboard-line"
    >
      <ExecutiveOverviewDashboard />
    </PageTemplate>
  );
}
