/**
 * ASN (Advanced Shipping Notice) Lifecycle Configuration
 * Complete lifecycle for inbound ASN processing
 */

import type { LifecycleConfig } from "@/types/lifecycle";

export const asnLifecycleConfig: LifecycleConfig = {
  entityType: "ASN",
  name: "ASN Lifecycle",
  description:
    "Complete lifecycle for Advanced Shipping Notice processing from creation to goods receipt completion",
  version: "1.0.0",

  stages: [
    {
      id: "ASN_CREATED",
      code: "ASN_CREATED",
      name: "ASN Created",
      description: "ASN document created and awaiting processing",
      icon: "ri-file-add-line",
      color: "#6b7280",
      order: 1,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 0, // Immediate
      slaTarget: 0,
      requiresApproval: false,
      approvalRoles: [],
      autoTransition: {
        enabled: false,
      },
      conditions: [],
      moduleLinks: [
        {
          module: "wms",
          action: "view_asn",
          label: "View ASN Details",
          href: "/inbound",
        },
      ],
      actions: [
        {
          id: "validate_asn",
          label: "Validate ASN",
          type: "button",
          icon: "ri-checkbox-circle-line",
        },
      ],
    },
    {
      id: "ASN_VALIDATED",
      code: "ASN_VALIDATED",
      name: "ASN Validated",
      description: "ASN validated and ready for scheduling",
      icon: "ri-checkbox-circle-line",
      color: "#3b82f6",
      order: 2,
      isRequired: true,
      estimatedDuration: 3600, // 1 hour
      slaTarget: 7200, // 2 hours
      requiresApproval: false,
      moduleLinks: [
        {
          module: "wms",
          action: "schedule_receiving",
          label: "Schedule Receiving",
          href: "/goods-receipt",
        },
      ],
    },
    {
      id: "RECEIVING_SCHEDULED",
      code: "RECEIVING_SCHEDULED",
      name: "Receiving Scheduled",
      description: "Goods receipt scheduled and dock assigned",
      icon: "ri-calendar-todo-line",
      color: "#3b82f6",
      order: 3,
      isRequired: true,
      estimatedDuration: 3600, // 1 hour
      slaTarget: 14400, // 4 hours
      moduleLinks: [
        {
          module: "wms",
          action: "view_schedule",
          label: "View Schedule",
          href: "/goods-receipt",
        },
      ],
    },
    {
      id: "IN_TRANSIT",
      code: "IN_TRANSIT",
      name: "In Transit",
      description: "Shipment in transit to warehouse",
      icon: "ri-truck-line",
      color: "#f59e0b",
      order: 4,
      isRequired: true,
      estimatedDuration: 86400, // 24 hours
      slaTarget: 172800, // 48 hours
      moduleLinks: [
        {
          module: "tms",
          action: "track_shipment",
          label: "Track Shipment",
          href: "/tracking",
        },
      ],
    },
    {
      id: "ARRIVED_AT_DOCK",
      code: "ARRIVED_AT_DOCK",
      name: "Arrived at Dock",
      description: "Shipment arrived at warehouse dock",
      icon: "ri-map-pin-line",
      color: "#10b981",
      order: 5,
      isRequired: true,
      estimatedDuration: 1800, // 30 minutes
      slaTarget: 3600, // 1 hour
      moduleLinks: [
        {
          module: "wms",
          action: "start_receiving",
          label: "Start Receiving",
          href: "/goods-receipt",
        },
      ],
    },
    {
      id: "RECEIVING_IN_PROGRESS",
      code: "RECEIVING_IN_PROGRESS",
      name: "Receiving in Progress",
      description: "Goods receipt process started",
      icon: "ri-loader-4-line",
      color: "#3b82f6",
      order: 6,
      isRequired: true,
      estimatedDuration: 3600, // 1 hour
      slaTarget: 7200, // 2 hours
      moduleLinks: [
        {
          module: "wms",
          action: "complete_receiving",
          label: "Complete Receiving",
          href: "/goods-receipt",
        },
      ],
    },
    {
      id: "QUALITY_INSPECTION",
      code: "QUALITY_INSPECTION",
      name: "Quality Inspection",
      description: "Quality inspection in progress",
      icon: "ri-search-line",
      color: "#8b5cf6",
      order: 7,
      isRequired: false,
      isOptional: true,
      canSkip: true,
      estimatedDuration: 7200, // 2 hours
      slaTarget: 14400, // 4 hours
      requiresApproval: false,
      moduleLinks: [
        {
          module: "iso-ims",
          action: "view_inspection",
          label: "View Inspection",
          href: "/inspection-lots",
        },
      ],
    },
    {
      id: "PUTAWAY_REQUIRED",
      code: "PUTAWAY_REQUIRED",
      name: "Putaway Required",
      description: "Goods received, putaway required",
      icon: "ri-stack-line",
      color: "#f59e0b",
      order: 8,
      isRequired: true,
      estimatedDuration: 7200, // 2 hours
      slaTarget: 14400, // 4 hours
      moduleLinks: [
        {
          module: "wms",
          action: "create_putaway_task",
          label: "Create Putaway Task",
          href: "/putaway",
        },
      ],
    },
    {
      id: "PUTAWAY_IN_PROGRESS",
      code: "PUTAWAY_IN_PROGRESS",
      name: "Putaway in Progress",
      description: "Putaway task in progress",
      icon: "ri-loader-4-line",
      color: "#3b82f6",
      order: 9,
      isRequired: true,
      estimatedDuration: 10800, // 3 hours
      slaTarget: 21600, // 6 hours
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
      id: "PUTAWAY_COMPLETED",
      code: "PUTAWAY_COMPLETED",
      name: "Putaway Completed",
      description: "All items put away to storage locations",
      icon: "ri-checkbox-circle-line",
      color: "#10b981",
      order: 10,
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
      id: "GOODS_RECEIPT_POSTED",
      code: "GOODS_RECEIPT_POSTED",
      name: "Goods Receipt Posted",
      description: "Goods receipt posted to inventory system",
      icon: "ri-file-check-line",
      color: "#10b981",
      order: 11,
      isRequired: true,
      estimatedDuration: 1800, // 30 minutes
      slaTarget: 3600, // 1 hour
      requiresApproval: false,
      moduleLinks: [
        {
          module: "wms",
          action: "view_gr",
          label: "View Goods Receipt",
          href: "/goods-receipt",
        },
      ],
    },
    {
      id: "ASN_COMPLETED",
      code: "ASN_COMPLETED",
      name: "ASN Completed",
      description: "ASN processing completed successfully",
      icon: "ri-check-double-line",
      color: "#10b981",
      order: 12,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [],
    },
  ],

  defaultStage: "ASN_CREATED",
  finalStage: "ASN_COMPLETED",

  slaRules: [
    {
      stageId: "ASN_VALIDATED",
      targetDuration: 7200, // 2 hours
      warningThreshold: 0.8, // 80% of target
      criticalThreshold: 0.95, // 95% of target
    },
    {
      stageId: "RECEIVING_SCHEDULED",
      targetDuration: 14400, // 4 hours
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
    },
    {
      stageId: "ARRIVED_AT_DOCK",
      targetDuration: 3600, // 1 hour
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
    },
    {
      stageId: "RECEIVING_IN_PROGRESS",
      targetDuration: 7200, // 2 hours
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
    },
    {
      stageId: "PUTAWAY_COMPLETED",
      targetDuration: 21600, // 6 hours
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
    },
  ],

  crossModuleLinks: [
    {
      sourceStage: "QUALITY_INSPECTION",
      targetModule: "iso-ims",
      targetEntityType: "INSPECTION",
      linkType: "triggers",
      condition: "quality_check_required",
    },
    {
      sourceStage: "PUTAWAY_REQUIRED",
      targetModule: "wms",
      targetEntityType: "TASK",
      linkType: "creates",
      condition: "always",
    },
  ],
};
