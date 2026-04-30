/**
 * 👥 IoT Device Groups Page
 * Manage device groups for collective operations
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import DeviceGroupManager from "@/components/iot/DeviceGroupManager";

export default function DeviceGroupsPage() {
  return (
    <PageTemplate
      title="Device Groups"
      description="Create and manage device groups for collective operations and automation"
      icon="ri-group-line"
    >
      <DeviceGroupManager />
    </PageTemplate>
  );
}
