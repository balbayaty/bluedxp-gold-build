/**
 * Wave Planning Lifecycle Configuration
 * Complete lifecycle for wave planning operations
 */

import type { LifecycleConfig } from "@/types/lifecycle";

export const wavePlanningLifecycleConfig: LifecycleConfig = {
  entityType: "WAVE",
  name: "Wave Planning Lifecycle",
  description:
    "Complete lifecycle for wave planning from creation to pick release",
  version: "1.0.0",

  stages: [
    {
      id: "WAVE_CREATED",
      code: "WAVE_CREATED",
      name: "Wave Created",
      description: "Wave planning document created",
      icon: "ri-file-add-line",
      color: "#6b7280",
      order: 1,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [
        {
          module: "wms",
          action: "view_wave",
          label: "View Wave",
          href: "/wave-planning",
        },
      ],
    },
    {
      id: "WAVE_PLANNED",
      code: "WAVE_PLANNED",
      name: "Wave Planned",
      description: "Orders added to wave and optimized",
      icon: "ri-calendar-todo-line",
      color: "#3b82f6",
      order: 2,
      isRequired: true,
      estimatedDuration: 1800, // 30 minutes
      slaTarget: 3600, // 1 hour
      moduleLinks: [
        {
          module: "wms",
          action: "optimize_wave",
          label: "Optimize Wave",
          href: "/wave-planning",
        },
      ],
    },
    {
      id: "WAVE_APPROVED",
      code: "WAVE_APPROVED",
      name: "Wave Approved",
      description: "Wave approved for execution",
      icon: "ri-checkbox-circle-line",
      color: "#10b981",
      order: 3,
      isRequired: true,
      estimatedDuration: 600, // 10 minutes
      slaTarget: 1800, // 30 minutes
      requiresApproval: true,
      approvalRoles: ["supervisor", "warehouse_head"],
      moduleLinks: [
        {
          module: "wms",
          action: "approve_wave",
          label: "Approve Wave",
          href: "/wave-planning",
        },
      ],
    },
    {
      id: "PICK_TASKS_CREATED",
      code: "PICK_TASKS_CREATED",
      name: "Pick Tasks Created",
      description: "Pick tasks created from wave",
      icon: "ri-task-line",
      color: "#8b5cf6",
      order: 4,
      isRequired: true,
      estimatedDuration: 300, // 5 minutes
      slaTarget: 600, // 10 minutes
      moduleLinks: [
        {
          module: "wms",
          action: "view_pick_tasks",
          label: "View Pick Tasks",
          href: "/picking",
        },
      ],
    },
    {
      id: "WAVE_RELEASED",
      code: "WAVE_RELEASED",
      name: "Wave Released",
      description: "Wave released for picking",
      icon: "ri-play-circle-line",
      color: "#10b981",
      order: 5,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [
        {
          module: "wms",
          action: "view_picking",
          label: "View Picking",
          href: "/picking",
        },
      ],
    },
    {
      id: "WAVE_COMPLETED",
      code: "WAVE_COMPLETED",
      name: "Wave Completed",
      description: "All picks in wave completed",
      icon: "ri-check-double-line",
      color: "#10b981",
      order: 6,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [
        {
          module: "wms",
          action: "view_wave_summary",
          label: "View Wave Summary",
          href: "/wave-planning",
        },
      ],
    },
  ],

  defaultStage: "WAVE_CREATED",
  finalStage: "WAVE_COMPLETED",

  slaRules: [
    {
      stageId: "WAVE_PLANNED",
      targetDuration: 3600, // 1 hour
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
    },
  ],
};
