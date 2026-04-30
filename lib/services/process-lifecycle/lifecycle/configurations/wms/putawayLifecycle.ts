/**
 * Putaway Task Lifecycle Configuration
 * Complete lifecycle for putaway operations
 */

import type { LifecycleConfig } from "@/types/lifecycle";

export const putawayLifecycleConfig: LifecycleConfig = {
  entityType: "PUTAWAY",
  name: "Putaway Lifecycle",
  description:
    "Complete lifecycle for putaway operations from goods receipt to storage",
  version: "1.0.0",

  stages: [
    {
      id: "PUTAWAY_CREATED",
      code: "PUTAWAY_CREATED",
      name: "Putaway Created",
      description: "Putaway task created after goods receipt",
      icon: "ri-file-add-line",
      color: "#6b7280",
      order: 1,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 300, // 5 minutes
      moduleLinks: [
        {
          module: "wms",
          action: "view_putaway",
          label: "View Putaway",
          href: "/putaway",
        },
      ],
    },
    {
      id: "LOCATION_ASSIGNED",
      code: "LOCATION_ASSIGNED",
      name: "Location Assigned",
      description: "Storage location assigned for putaway",
      icon: "ri-map-pin-line",
      color: "#3b82f6",
      order: 2,
      isRequired: true,
      estimatedDuration: 300, // 5 minutes
      slaTarget: 600, // 10 minutes
      moduleLinks: [
        {
          module: "wms",
          action: "view_location",
          label: "View Location",
          href: "/storage-locations",
        },
      ],
    },
    {
      id: "PUTAWAY_ASSIGNED",
      code: "PUTAWAY_ASSIGNED",
      name: "Putaway Assigned",
      description: "Putaway task assigned to operator",
      icon: "ri-user-line",
      color: "#3b82f6",
      order: 3,
      isRequired: true,
      estimatedDuration: 300, // 5 minutes
      slaTarget: 600, // 10 minutes
      moduleLinks: [
        {
          module: "wms",
          action: "start_putaway",
          label: "Start Putaway",
          href: "/putaway",
        },
      ],
    },
    {
      id: "PUTAWAY_IN_PROGRESS",
      code: "PUTAWAY_IN_PROGRESS",
      name: "Putaway in Progress",
      description: "Items being moved to storage locations",
      icon: "ri-loader-4-line",
      color: "#f59e0b",
      order: 4,
      isRequired: true,
      estimatedDuration: 1800, // 30 minutes
      slaTarget: 3600, // 1 hour
      moduleLinks: [
        {
          module: "wms",
          action: "update_putaway",
          label: "Update Putaway",
          href: "/putaway",
        },
      ],
    },
    {
      id: "PUTAWAY_COMPLETED",
      code: "PUTAWAY_COMPLETED",
      name: "Putaway Completed",
      description: "All items put away to storage locations",
      icon: "ri-checkbox-circle-line",
      color: "#10b981",
      order: 5,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [
        {
          module: "wms",
          action: "view_inventory",
          label: "View Inventory",
          href: "/inventory",
        },
      ],
    },
    {
      id: "INVENTORY_UPDATED",
      code: "INVENTORY_UPDATED",
      name: "Inventory Updated",
      description: "Inventory system updated with new stock",
      icon: "ri-stack-line",
      color: "#10b981",
      order: 6,
      isRequired: true,
      estimatedDuration: 300, // 5 minutes
      slaTarget: 600, // 10 minutes
      moduleLinks: [
        {
          module: "wms",
          action: "view_stock",
          label: "View Stock",
          href: "/inventory",
        },
      ],
    },
  ],

  defaultStage: "PUTAWAY_CREATED",
  finalStage: "INVENTORY_UPDATED",

  slaRules: [
    {
      stageId: "PUTAWAY_ASSIGNED",
      targetDuration: 600, // 10 minutes
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
    },
    {
      stageId: "PUTAWAY_IN_PROGRESS",
      targetDuration: 3600, // 1 hour
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
    },
  ],
};
