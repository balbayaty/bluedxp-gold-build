/**
 * Picking Task Lifecycle Configuration
 * Complete lifecycle for order picking operations
 */

import type { LifecycleConfig } from "@/types/lifecycle";

export const pickingLifecycleConfig: LifecycleConfig = {
  entityType: "PICKING",
  name: "Picking Lifecycle",
  description:
    "Complete lifecycle for order picking operations from wave release to completion",
  version: "1.0.0",

  stages: [
    {
      id: "PICK_RELEASED",
      code: "PICK_RELEASED",
      name: "Pick Released",
      description: "Pick task released from wave planning",
      icon: "ri-play-circle-line",
      color: "#3b82f6",
      order: 1,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 300, // 5 minutes
      moduleLinks: [
        {
          module: "wms",
          action: "view_pick",
          label: "View Pick Task",
          href: "/picking",
        },
      ],
    },
    {
      id: "PICK_ASSIGNED",
      code: "PICK_ASSIGNED",
      name: "Pick Assigned",
      description: "Pick task assigned to picker",
      icon: "ri-user-line",
      color: "#3b82f6",
      order: 2,
      isRequired: true,
      estimatedDuration: 300, // 5 minutes
      slaTarget: 600, // 10 minutes
      moduleLinks: [
        {
          module: "wms",
          action: "start_picking",
          label: "Start Picking",
          href: "/picking",
        },
      ],
    },
    {
      id: "PICKING_STARTED",
      code: "PICKING_STARTED",
      name: "Picking Started",
      description: "Picker has started picking items",
      icon: "ri-handbag-line",
      color: "#f59e0b",
      order: 3,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [
        {
          module: "wms",
          action: "view_pick_list",
          label: "View Pick List",
          href: "/picking",
        },
      ],
    },
    {
      id: "PICKING_IN_PROGRESS",
      code: "PICKING_IN_PROGRESS",
      name: "Picking in Progress",
      description: "Items being picked from locations",
      icon: "ri-loader-4-line",
      color: "#3b82f6",
      order: 4,
      isRequired: true,
      estimatedDuration: 1800, // 30 minutes
      slaTarget: 3600, // 1 hour
      moduleLinks: [
        {
          module: "wms",
          action: "update_pick",
          label: "Update Pick",
          href: "/picking",
        },
      ],
    },
    {
      id: "PICKING_COMPLETED",
      code: "PICKING_COMPLETED",
      name: "Picking Completed",
      description: "All items picked and ready for packing",
      icon: "ri-checkbox-circle-line",
      color: "#10b981",
      order: 5,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [
        {
          module: "wms",
          action: "view_picked_items",
          label: "View Picked Items",
          href: "/picking",
        },
      ],
    },
    {
      id: "PICK_VERIFIED",
      code: "PICK_VERIFIED",
      name: "Pick Verified",
      description: "Pick accuracy verified",
      icon: "ri-shield-check-line",
      color: "#10b981",
      order: 6,
      isRequired: false,
      isOptional: true,
      canSkip: true,
      estimatedDuration: 600, // 10 minutes
      slaTarget: 1800, // 30 minutes
      moduleLinks: [
        {
          module: "wms",
          action: "verify_pick",
          label: "Verify Pick",
          href: "/picking",
        },
      ],
    },
    {
      id: "READY_FOR_PACKING",
      code: "READY_FOR_PACKING",
      name: "Ready for Packing",
      description: "Picked items ready for packing",
      icon: "ri-box-line",
      color: "#8b5cf6",
      order: 7,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [
        {
          module: "wms",
          action: "view_packing",
          label: "View Packing",
          href: "/outbound",
        },
      ],
    },
  ],

  defaultStage: "PICK_RELEASED",
  finalStage: "READY_FOR_PACKING",

  slaRules: [
    {
      stageId: "PICK_ASSIGNED",
      targetDuration: 600, // 10 minutes
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
    },
    {
      stageId: "PICKING_IN_PROGRESS",
      targetDuration: 3600, // 1 hour
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
    },
  ],
};
