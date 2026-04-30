/**
 * 🔍 IoT Device Discovery Page
 * Multi-protocol device discovery
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import DeviceDiscoveryPanel from "@/components/iot/DeviceDiscoveryPanel";

export default function DeviceDiscoveryPage() {
  return (
    <PageTemplate
      title="Device Discovery"
      description="Discover IoT devices across multiple protocols (WiFi, LoRa, Zigbee, Bluetooth, 5G, Satellite)"
      icon="ri-radar-line"
    >
      <DeviceDiscoveryPanel />
    </PageTemplate>
  );
}
