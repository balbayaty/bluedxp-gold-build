/**
 * Sustainability Command Center Page
 *
 * ESG metrics, journey breakdown, and optimization potential
 * Compare current vs. optimized sustainability metrics
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import { SustainabilityCommandCenter } from "@/components/analytics";

export default function SustainabilityCommandCenterPage() {
  return (
    <PageTemplate
      title="Sustainability Command Center"
      description="ESG metrics, journey breakdown, and optimization potential analysis"
      icon="ri-leaf-line"
    >
      <SustainabilityCommandCenter />
    </PageTemplate>
  );
}
