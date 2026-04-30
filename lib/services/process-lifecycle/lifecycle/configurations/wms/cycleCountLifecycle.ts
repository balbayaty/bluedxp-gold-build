/**
 * Cycle Count Lifecycle Configuration
 * Complete lifecycle for cycle counting operations
 */

import type { LifecycleConfig } from "@/types/lifecycle";

export const cycleCountLifecycleConfig: LifecycleConfig = {
  entityType: "CYCLE_COUNT",
  name: "Cycle Count Lifecycle",
  description:
    "Complete lifecycle for cycle counting operations from planning to reconciliation",
  version: "1.0.0",

  stages: [
    {
      id: "CYCLE_COUNT_PLANNED",
      code: "CYCLE_COUNT_PLANNED",
      name: "Cycle Count Planned",
      description: "Cycle count scheduled and planned",
      icon: "ri-calendar-todo-line",
      color: "#6b7280",
      order: 1,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [
        {
          module: "wms",
          action: "view_cycle_count",
          label: "View Cycle Count",
          href: "/cycle-counting",
        },
      ],
    },
    {
      id: "CYCLE_COUNT_ASSIGNED",
      code: "CYCLE_COUNT_ASSIGNED",
      name: "Cycle Count Assigned",
      description: "Cycle count assigned to counter",
      icon: "ri-user-line",
      color: "#3b82f6",
      order: 2,
      isRequired: true,
      estimatedDuration: 300, // 5 minutes
      slaTarget: 600, // 10 minutes
      moduleLinks: [
        {
          module: "wms",
          action: "start_counting",
          label: "Start Counting",
          href: "/cycle-counting",
        },
      ],
    },
    {
      id: "COUNTING_IN_PROGRESS",
      code: "COUNTING_IN_PROGRESS",
      name: "Counting in Progress",
      description: "Physical counting in progress",
      icon: "ri-loader-4-line",
      color: "#f59e0b",
      order: 3,
      isRequired: true,
      estimatedDuration: 3600, // 1 hour
      slaTarget: 7200, // 2 hours
      moduleLinks: [
        {
          module: "wms",
          action: "update_count",
          label: "Update Count",
          href: "/cycle-counting",
        },
      ],
    },
    {
      id: "COUNTING_COMPLETED",
      code: "COUNTING_COMPLETED",
      name: "Counting Completed",
      description: "Physical counting completed",
      icon: "ri-checkbox-circle-line",
      color: "#10b981",
      order: 4,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [
        {
          module: "wms",
          action: "view_count_results",
          label: "View Count Results",
          href: "/cycle-counting",
        },
      ],
    },
    {
      id: "RECONCILIATION_REQUIRED",
      code: "RECONCILIATION_REQUIRED",
      name: "Reconciliation Required",
      description: "Discrepancies found, reconciliation required",
      icon: "ri-alert-line",
      color: "#ef4444",
      order: 5,
      isRequired: false,
      isOptional: true,
      canSkip: true,
      estimatedDuration: 1800, // 30 minutes
      slaTarget: 3600, // 1 hour
      requiresApproval: true,
      approvalRoles: ["supervisor", "warehouse_head"],
      moduleLinks: [
        {
          module: "wms",
          action: "reconcile",
          label: "Reconcile",
          href: "/cycle-counting",
        },
      ],
    },
    {
      id: "RECONCILIATION_COMPLETED",
      code: "RECONCILIATION_COMPLETED",
      name: "Reconciliation Completed",
      description: "Discrepancies reconciled and inventory adjusted",
      icon: "ri-check-double-line",
      color: "#10b981",
      order: 6,
      isRequired: false,
      isOptional: true,
      canSkip: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [
        {
          module: "wms",
          action: "view_adjustments",
          label: "View Adjustments",
          href: "/inventory",
        },
      ],
    },
    {
      id: "INVENTORY_ADJUSTED",
      code: "INVENTORY_ADJUSTED",
      name: "Inventory Adjusted",
      description: "Inventory system updated with count results",
      icon: "ri-stack-line",
      color: "#10b981",
      order: 7,
      isRequired: true,
      estimatedDuration: 300, // 5 minutes
      slaTarget: 600, // 10 minutes
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
      id: "CYCLE_COUNT_CLOSED",
      code: "CYCLE_COUNT_CLOSED",
      name: "Cycle Count Closed",
      description: "Cycle count completed and closed",
      icon: "ri-archive-line",
      color: "#6b7280",
      order: 8,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [],
    },
  ],

  defaultStage: "CYCLE_COUNT_PLANNED",
  finalStage: "CYCLE_COUNT_CLOSED",

  slaRules: [
    {
      stageId: "COUNTING_IN_PROGRESS",
      targetDuration: 7200, // 2 hours
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
    },
    {
      stageId: "RECONCILIATION_REQUIRED",
      targetDuration: 3600, // 1 hour
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
    },
  ],
};
