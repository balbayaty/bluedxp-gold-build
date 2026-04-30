/**
 * Bottleneck Analysis Page
 *
 * Identify primary bottlenecks and vulnerability scores
 * Analyze arrival timing impact and operating hours constraints
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import { BottleneckAnalysis } from "@/components/analytics";

export default function BottleneckAnalysisPage() {
  return (
    <PageTemplate
      title="Bottleneck Analysis"
      description="Identify primary bottlenecks, vulnerability scores, and arrival timing impact analysis"
      icon="ri-alert-line"
    >
      <BottleneckAnalysis />
    </PageTemplate>
  );
}
