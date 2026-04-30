/**
 * Touchpoint Explorer Page
 *
 * Deep-dive analysis for individual journey touchpoints
 * Shipment-by-shipment comparison and efficiency metrics
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import { TouchpointExplorer } from "@/components/analytics";

export default function TouchpointExplorerPage() {
  return (
    <PageTemplate
      title="Touchpoint Explorer"
      description="Deep-dive analysis for individual journey touchpoints with shipment comparison"
      icon="ri-search-line"
    >
      <TouchpointExplorer />
    </PageTemplate>
  );
}
