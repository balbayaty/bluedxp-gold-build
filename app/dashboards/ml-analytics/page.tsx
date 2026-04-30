/**
 * ML Analytics Dashboard Page
 * PRODUCTION READY - Error boundary protection
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import MLAnalyticsDashboard from "@/components/dashboards/MLAnalyticsDashboard";

export default function MLAnalyticsDashboardPage() {
  return (
    <ErrorBoundary>
      <PageTemplate
        title="ML Analytics"
        description="Machine Learning model performance and analytics"
        icon="ri-brain-line"
      >
        <MLAnalyticsDashboard />
      </PageTemplate>
    </ErrorBoundary>
  );
}
