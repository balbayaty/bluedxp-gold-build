/**
 * 🌐 IoT Network Topology Page
 * Visual network topology and optimization
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import NetworkTopologyVisualization from "@/components/iot/NetworkTopologyVisualization";

export default function NetworkTopologyPage() {
  return (
    <PageTemplate
      title="Network Topology"
      description="Visualize and analyze IoT network topology with optimization recommendations"
      icon="ri-node-tree"
    >
      <NetworkTopologyVisualization />
    </PageTemplate>
  );
}
