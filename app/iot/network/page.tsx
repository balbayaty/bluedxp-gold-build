/**
 * IoT Network Page
 * Network topology and visualization
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import IoTNetworkMap from "@/components/iot/IoTNetworkMap";

export default function IoTNetworkPage() {
  return (
    <PageTemplate
      title="IoT Network"
      description="Network topology and device connections"
      icon="ri-node-tree"
    >
      <IoTNetworkMap />
    </PageTemplate>
  );
}
