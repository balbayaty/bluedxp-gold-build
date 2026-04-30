/**
 * Warehouse Task Lifecycle Configuration
 * Complete lifecycle for warehouse tasks (picking, putaway, cycle count, etc.)
 */

import type { LifecycleConfig } from "@/types/lifecycle";

export const taskLifecycleConfig: LifecycleConfig = {
  entityType: "TASK",
  name: "Warehouse Task Lifecycle",
  description:
    "Complete lifecycle for warehouse tasks including picking, putaway, cycle counting, and transfers",
  version: "1.0.0",

  stages: [
    {
      id: "TASK_CREATED",
      code: "TASK_CREATED",
      name: "Task Created",
      description: "Task created and awaiting assignment",
      icon: "ri-file-add-line",
      color: "#6b7280",
      order: 1,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 300, // 5 minutes
      moduleLinks: [
        {
          module: "wms",
          action: "view_task",
          label: "View Task",
          href: "/tasks",
        },
      ],
    },
    {
      id: "TASK_ASSIGNED",
      code: "TASK_ASSIGNED",
      name: "Task Assigned",
      description: "Task assigned to warehouse operator",
      icon: "ri-user-line",
      color: "#3b82f6",
      order: 2,
      isRequired: true,
      estimatedDuration: 300, // 5 minutes
      slaTarget: 600, // 10 minutes
      moduleLinks: [
        {
          module: "wms",
          action: "view_assignment",
          label: "View Assignment",
          href: "/my-tasks",
        },
      ],
    },
    {
      id: "TASK_STARTED",
      code: "TASK_STARTED",
      name: "Task Started",
      description: "Operator has started working on the task",
      icon: "ri-play-circle-line",
      color: "#f59e0b",
      order: 3,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [
        {
          module: "wms",
          action: "view_progress",
          label: "View Progress",
          href: "/my-tasks",
        },
      ],
    },
    {
      id: "TASK_IN_PROGRESS",
      code: "TASK_IN_PROGRESS",
      name: "Task in Progress",
      description: "Task execution in progress",
      icon: "ri-loader-4-line",
      color: "#3b82f6",
      order: 4,
      isRequired: true,
      estimatedDuration: 1800, // 30 minutes (varies by task type)
      slaTarget: 3600, // 1 hour
      moduleLinks: [
        {
          module: "wms",
          action: "update_progress",
          label: "Update Progress",
          href: "/my-tasks",
        },
      ],
    },
    {
      id: "TASK_COMPLETED",
      code: "TASK_COMPLETED",
      name: "Task Completed",
      description: "Task completed successfully",
      icon: "ri-checkbox-circle-line",
      color: "#10b981",
      order: 5,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [
        {
          module: "wms",
          action: "view_completion",
          label: "View Completion",
          href: "/tasks",
        },
      ],
    },
    {
      id: "TASK_VERIFIED",
      code: "TASK_VERIFIED",
      name: "Task Verified",
      description: "Task completion verified by supervisor",
      icon: "ri-shield-check-line",
      color: "#10b981",
      order: 6,
      isRequired: false,
      isOptional: true,
      canSkip: true,
      estimatedDuration: 600, // 10 minutes
      slaTarget: 1800, // 30 minutes
      requiresApproval: true,
      approvalRoles: ["supervisor", "warehouse_head"],
      moduleLinks: [
        {
          module: "wms",
          action: "verify_task",
          label: "Verify Task",
          href: "/task-management",
        },
      ],
    },
    {
      id: "TASK_CLOSED",
      code: "TASK_CLOSED",
      name: "Task Closed",
      description: "Task closed and archived",
      icon: "ri-archive-line",
      color: "#6b7280",
      order: 7,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [],
    },
  ],

  defaultStage: "TASK_CREATED",
  finalStage: "TASK_CLOSED",

  slaRules: [
    {
      stageId: "TASK_ASSIGNED",
      targetDuration: 600, // 10 minutes
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
    },
    {
      stageId: "TASK_IN_PROGRESS",
      targetDuration: 3600, // 1 hour
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
    },
  ],
};
