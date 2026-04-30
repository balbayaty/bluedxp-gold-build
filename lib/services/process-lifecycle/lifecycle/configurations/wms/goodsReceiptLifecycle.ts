/**
 * Goods Receipt Lifecycle Configuration
 * Complete lifecycle for goods receipt processing
 */

import type { LifecycleConfig } from "@/types/lifecycle";

export const goodsReceiptLifecycleConfig: LifecycleConfig = {
  entityType: "GOODS_RECEIPT",
  name: "Goods Receipt Lifecycle",
  description:
    "Complete lifecycle for goods receipt processing from ASN to inventory posting",
  version: "1.0.0",

  stages: [
    {
      id: "GR_CREATED",
      code: "GR_CREATED",
      name: "Goods Receipt Created",
      description: "Goods receipt document created",
      icon: "ri-file-add-line",
      color: "#6b7280",
      order: 1,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 300, // 5 minutes
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
      id: "DOCK_ASSIGNED",
      code: "DOCK_ASSIGNED",
      name: "Dock Assigned",
      description: "Receiving dock assigned",
      icon: "ri-map-pin-line",
      color: "#3b82f6",
      order: 2,
      isRequired: true,
      estimatedDuration: 300, // 5 minutes
      slaTarget: 600, // 10 minutes
      moduleLinks: [
        {
          module: "wms",
          action: "view_dock",
          label: "View Dock",
          href: "/goods-receipt",
        },
      ],
    },
    {
      id: "RECEIVING_STARTED",
      code: "RECEIVING_STARTED",
      name: "Receiving Started",
      description: "Physical receiving process started",
      icon: "ri-play-circle-line",
      color: "#f59e0b",
      order: 3,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
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
      description: "Items being received and verified",
      icon: "ri-loader-4-line",
      color: "#3b82f6",
      order: 4,
      isRequired: true,
      estimatedDuration: 3600, // 1 hour
      slaTarget: 7200, // 2 hours
      moduleLinks: [
        {
          module: "wms",
          action: "update_receiving",
          label: "Update Receiving",
          href: "/goods-receipt",
        },
      ],
    },
    {
      id: "RECEIVING_COMPLETED",
      code: "RECEIVING_COMPLETED",
      name: "Receiving Completed",
      description: "Physical receiving completed",
      icon: "ri-checkbox-circle-line",
      color: "#10b981",
      order: 5,
      isRequired: true,
      estimatedDuration: 0,
      slaTarget: 0,
      moduleLinks: [
        {
          module: "wms",
          action: "view_received_items",
          label: "View Received Items",
          href: "/goods-receipt",
        },
      ],
    },
    {
      id: "GR_POSTED",
      code: "GR_POSTED",
      name: "Goods Receipt Posted",
      description: "Goods receipt posted to inventory system",
      icon: "ri-file-check-line",
      color: "#10b981",
      order: 6,
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
  ],

  defaultStage: "GR_CREATED",
  finalStage: "GR_POSTED",

  slaRules: [
    {
      stageId: "RECEIVING_IN_PROGRESS",
      targetDuration: 7200, // 2 hours
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
    },
  ],
};
