/**
 * Sales Order Lifecycle Configuration
 * Complete sales order fulfillment lifecycle from creation to delivery
 */

import type { LifecycleConfig } from "@/types/lifecycle";

export const salesOrderLifecycleConfig: LifecycleConfig = {
  entityType: "SALES_ORDER",
  name: "Sales Order Lifecycle",
  description:
    "Complete sales order fulfillment lifecycle from order creation to delivery and invoicing",
  defaultView: "timeline",

  stages: [
    {
      id: "created",
      code: "CREATED",
      name: "Order Created",
      description: "Sales order has been created in the system",
      icon: "ri-file-add-line",
      color: "#06b6d4",
      order: 1,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 3600, // 1 hour
      requiresApproval: false,
      moduleLinks: [
        {
          module: "customers",
          action: "view",
          label: "View Customer",
          icon: "ri-user-line",
        },
        {
          module: "inventory",
          action: "check",
          label: "Check Stock Availability",
          icon: "ri-stack-line",
        },
        {
          module: "pricing",
          action: "view",
          label: "View Pricing",
          icon: "ri-money-dollar-circle-line",
        },
      ],
    },
    {
      id: "confirmed",
      code: "CONFIRMED",
      name: "Order Confirmed",
      description: "Customer has confirmed the order",
      icon: "ri-checkbox-circle-line",
      color: "#10b981",
      order: 2,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 7200, // 2 hours
      requiresApproval: false,
      moduleLinks: [
        {
          module: "order-confirmation",
          action: "view",
          label: "View Confirmation",
          icon: "ri-file-check-line",
        },
        {
          module: "customers",
          action: "view",
          label: "Customer Details",
          icon: "ri-user-line",
        },
      ],
    },
    {
      id: "pick_released",
      code: "PICK_RELEASED",
      name: "Pick Released",
      description: "Order has been released for picking",
      icon: "ri-play-circle-line",
      color: "#3b82f6",
      order: 3,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 1800, // 30 minutes
      requiresApproval: false,
      moduleLinks: [
        {
          module: "picking",
          action: "view",
          label: "View Picking Tasks",
          icon: "ri-handbag-line",
        },
        {
          module: "warehouse",
          action: "view",
          label: "Warehouse Operations",
          icon: "ri-building-line",
        },
      ],
    },
    {
      id: "picking",
      code: "PICKING",
      name: "Picking",
      description: "Items are being picked from warehouse",
      icon: "ri-handbag-line",
      color: "#f59e0b",
      order: 4,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 10800, // 3 hours
      slaTarget: 10800,
      requiresApproval: false,
      moduleLinks: [
        {
          module: "picking",
          action: "view",
          label: "View Picking Tasks",
          icon: "ri-handbag-line",
          required: true,
        },
        {
          module: "warehouse",
          action: "view",
          label: "Warehouse Operations",
          icon: "ri-building-line",
        },
        {
          module: "inventory",
          action: "view",
          label: "Inventory Movements",
          icon: "ri-stack-line",
        },
      ],
    },
    {
      id: "picked",
      code: "PICKED",
      name: "Picked",
      description: "Picking has been completed",
      icon: "ri-check-double-line",
      color: "#10b981",
      order: 5,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 1800, // 30 minutes
      requiresApproval: false,
      moduleLinks: [
        {
          module: "picking",
          action: "view",
          label: "View Picking Results",
          icon: "ri-handbag-line",
        },
        {
          module: "qc",
          action: "view",
          label: "Initiate Quality Check",
          icon: "ri-file-search-line",
        },
      ],
    },
    {
      id: "qc_in_progress",
      code: "QC_IN_PROGRESS",
      name: "Quality Check",
      description: "Quality check is in progress",
      icon: "ri-file-search-line",
      color: "#8b5cf6",
      order: 6,
      isRequired: false,
      isOptional: true,
      canSkip: true,
      estimatedDuration: 5400, // 1.5 hours
      requiresApproval: false,
      moduleLinks: [
        {
          module: "inspection-lots",
          action: "view",
          label: "View Inspection Lots",
          icon: "ri-file-search-line",
        },
        {
          module: "qc",
          action: "view",
          label: "QC Operations",
          icon: "ri-shield-check-line",
        },
      ],
    },
    {
      id: "qc_completed",
      code: "QC_COMPLETED",
      name: "QC Completed",
      description: "Quality check has been completed",
      icon: "ri-shield-check-line",
      color: "#10b981",
      order: 7,
      isRequired: false,
      isOptional: true,
      canSkip: true,
      estimatedDuration: 1800, // 30 minutes
      requiresApproval: false,
      moduleLinks: [
        {
          module: "inspection-lots",
          action: "view",
          label: "View QC Results",
          icon: "ri-file-search-line",
        },
        {
          module: "certificates",
          action: "view",
          label: "View Certificates",
          icon: "ri-file-text-line",
        },
      ],
    },
    {
      id: "ready_for_dispatch",
      code: "READY_FOR_DISPATCH",
      name: "Ready for Dispatch",
      description: "Order is ready to be dispatched",
      icon: "ri-truck-line",
      color: "#06b6d4",
      order: 8,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 3600, // 1 hour
      requiresApproval: false,
      moduleLinks: [
        {
          module: "load-planning",
          action: "view",
          label: "View Load Plan",
          icon: "ri-truck-line",
        },
        {
          module: "shipments",
          action: "create",
          label: "Create Shipment",
          icon: "ri-ship-line",
        },
      ],
    },
    {
      id: "dispatched",
      code: "DISPATCHED",
      name: "Dispatched",
      description: "Order has been dispatched/shipped",
      icon: "ri-ship-line",
      color: "#3b82f6",
      order: 9,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 1800, // 30 minutes
      requiresApproval: false,
      moduleLinks: [
        {
          module: "tracking",
          action: "view",
          label: "Track Shipment",
          icon: "ri-map-pin-line",
          required: true,
        },
        {
          module: "carriers",
          action: "view",
          label: "View Carrier",
          icon: "ri-truck-line",
        },
        {
          module: "routes",
          action: "view",
          label: "View Route",
          icon: "ri-route-line",
        },
      ],
    },
    {
      id: "in_transit",
      code: "IN_TRANSIT",
      name: "In Transit",
      description: "Order is in transit to customer",
      icon: "ri-road-map-line",
      color: "#6366f1",
      order: 10,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 86400, // 24 hours (varies by distance)
      requiresApproval: false,
      moduleLinks: [
        {
          module: "tracking",
          action: "view",
          label: "Real-time Tracking",
          icon: "ri-map-pin-line",
          required: true,
        },
        {
          module: "carriers",
          action: "view",
          label: "Carrier Updates",
          icon: "ri-truck-line",
        },
        {
          module: "routes",
          action: "view",
          label: "Route Status",
          icon: "ri-route-line",
        },
      ],
    },
    {
      id: "delivered",
      code: "DELIVERED",
      name: "Delivered",
      description: "Order has been delivered to customer",
      icon: "ri-checkbox-circle-fill",
      color: "#10b981",
      order: 11,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 1800, // 30 minutes
      requiresApproval: false,
      moduleLinks: [
        {
          module: "pod",
          action: "view",
          label: "View Proof of Delivery",
          icon: "ri-file-check-line",
          required: true,
        },
        {
          module: "tracking",
          action: "view",
          label: "Delivery Confirmation",
          icon: "ri-map-pin-line",
        },
        {
          module: "customers",
          action: "view",
          label: "Customer Acknowledgment",
          icon: "ri-user-line",
        },
      ],
    },
    {
      id: "delivery_note_issued",
      code: "DELIVERY_NOTE_ISSUED",
      name: "Delivery Note Issued",
      description: "Delivery note has been issued",
      icon: "ri-file-text-line",
      color: "#06b6d4",
      order: 12,
      isRequired: false,
      isOptional: true,
      canSkip: true,
      estimatedDuration: 1800, // 30 minutes
      requiresApproval: false,
      moduleLinks: [
        {
          module: "delivery-note",
          action: "view",
          label: "View Delivery Note",
          icon: "ri-file-text-line",
        },
        {
          module: "documents",
          action: "view",
          label: "Document Center",
          icon: "ri-folder-line",
        },
      ],
    },
    {
      id: "invoiced",
      code: "INVOICED",
      name: "Invoiced",
      description: "Invoice has been created",
      icon: "ri-money-dollar-circle-line",
      color: "#10b981",
      order: 13,
      isRequired: false,
      isOptional: true,
      canSkip: true,
      estimatedDuration: 3600, // 1 hour
      requiresApproval: false,
      moduleLinks: [
        {
          module: "invoicing",
          action: "view",
          label: "View Invoice",
          icon: "ri-file-list-3-line",
        },
        {
          module: "finance",
          action: "view",
          label: "Financial Records",
          icon: "ri-money-dollar-circle-line",
        },
      ],
    },
    {
      id: "completed",
      code: "COMPLETED",
      name: "Completed",
      description: "Order has been completed",
      icon: "ri-checkbox-circle-fill",
      color: "#10b981",
      order: 14,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 0,
      requiresApproval: false,
      moduleLinks: [
        {
          module: "reports",
          action: "view",
          label: "View Order Report",
          icon: "ri-bar-chart-line",
        },
        {
          module: "analytics",
          action: "view",
          label: "Performance Analytics",
          icon: "ri-line-chart-line",
        },
      ],
    },
  ],

  moduleIntegrations: [
    {
      stageId: "picking",
      modules: ["picking", "warehouse", "inventory"],
      realTimeSync: true,
      syncFields: ["status", "progress", "quantity"],
    },
    {
      stageId: "qc_in_progress",
      modules: ["inspection-lots", "qc", "certificates"],
      realTimeSync: true,
      syncFields: ["status", "results", "certificates"],
    },
    {
      stageId: "in_transit",
      modules: ["tracking", "carriers", "routes"],
      realTimeSync: true,
      syncFields: ["location", "eta", "status"],
    },
    {
      stageId: "delivered",
      modules: ["pod", "tracking", "customers"],
      realTimeSync: true,
      syncFields: ["delivery_confirmation", "pod", "customer_acknowledgment"],
    },
  ],

  evidenceRequired: ["qc_completed", "delivered"],

  slaRules: [
    {
      stageId: "picking",
      targetDuration: 10800, // 3 hours
      warningThreshold: 0.8, // Warn at 80% (2.4 hours)
      breachAction: "notify_warehouse_manager",
      escalationRoles: ["WAREHOUSE_MANAGER", "OPERATIONS_MANAGER"],
    },
    {
      stageId: "in_transit",
      targetDuration: 86400, // 24 hours
      warningThreshold: 0.9, // Warn at 90% (21.6 hours)
      breachAction: "notify_logistics_manager",
      escalationRoles: ["LOGISTICS_MANAGER", "OPERATIONS_MANAGER"],
    },
  ],

  autoTransitions: [
    {
      fromStageId: "picked",
      toStageId: "ready_for_dispatch",
      condition: "qc_completed === true || qc_skipped === true",
      delay: 0,
    },
  ],

  permissions: [
    {
      stageId: "created",
      roles: ["SALES_MANAGER", "ORDER_MANAGER", "ADMIN"],
      actions: ["view", "edit", "transition"],
    },
    {
      stageId: "picking",
      roles: ["WAREHOUSE_OPERATOR", "WAREHOUSE_MANAGER", "ADMIN"],
      actions: ["view", "transition"],
    },
    {
      stageId: "dispatched",
      roles: ["LOGISTICS_MANAGER", "SHIPMENT_MANAGER", "ADMIN"],
      actions: ["view", "transition"],
    },
  ],
};
