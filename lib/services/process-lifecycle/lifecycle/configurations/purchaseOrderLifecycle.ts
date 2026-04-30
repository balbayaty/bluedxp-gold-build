/**
 * Purchase Order Lifecycle Configuration
 * Complete purchase order lifecycle from creation to goods receipt
 */

import type { LifecycleConfig } from "@/types/lifecycle";

export const purchaseOrderLifecycleConfig: LifecycleConfig = {
  entityType: "PURCHASE_ORDER",
  name: "Purchase Order Lifecycle",
  description:
    "Complete purchase order lifecycle from creation to goods receipt and invoicing",
  defaultView: "workflow",

  stages: [
    {
      id: "created",
      code: "CREATED",
      name: "PO Created",
      description: "Purchase order has been created",
      icon: "ri-file-add-line",
      color: "#06b6d4",
      order: 1,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 1800, // 30 minutes
      requiresApproval: false,
      moduleLinks: [
        {
          module: "vendors",
          action: "view",
          label: "View Vendor",
          icon: "ri-building-line",
        },
        {
          module: "inventory",
          action: "check",
          label: "Check Requirements",
          icon: "ri-stack-line",
        },
      ],
    },
    {
      id: "pending_approval",
      code: "PENDING_APPROVAL",
      name: "Pending Approval",
      description: "Purchase order is pending approval",
      icon: "ri-time-line",
      color: "#f59e0b",
      order: 2,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 86400, // 24 hours
      requiresApproval: true,
      approvalRoles: ["PURCHASING_MANAGER", "FINANCE_MANAGER"],
      moduleLinks: [
        {
          module: "approvals",
          action: "view",
          label: "View Approval Queue",
          icon: "ri-check-double-line",
        },
      ],
    },
    {
      id: "approved",
      code: "APPROVED",
      name: "Approved",
      description: "Purchase order has been approved",
      icon: "ri-checkbox-circle-line",
      color: "#10b981",
      order: 3,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 3600, // 1 hour
      requiresApproval: false,
      moduleLinks: [
        {
          module: "vendors",
          action: "view",
          label: "Send to Vendor",
          icon: "ri-send-plane-line",
        },
      ],
    },
    {
      id: "confirmed",
      code: "CONFIRMED",
      name: "Confirmed",
      description: "Vendor has confirmed the purchase order",
      icon: "ri-checkbox-circle-fill",
      color: "#10b981",
      order: 4,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 172800, // 48 hours
      requiresApproval: false,
      moduleLinks: [
        {
          module: "vendors",
          action: "view",
          label: "Vendor Confirmation",
          icon: "ri-building-line",
        },
        {
          module: "asn",
          action: "view",
          label: "Expected ASN",
          icon: "ri-file-list-line",
        },
      ],
    },
    {
      id: "goods_receipt",
      code: "GOODS_RECEIPT",
      name: "Goods Receipt",
      description: "Goods are being received",
      icon: "ri-inbox-line",
      color: "#3b82f6",
      order: 5,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 7200, // 2 hours
      requiresApproval: false,
      moduleLinks: [
        {
          module: "goods-receipt",
          action: "view",
          label: "View Goods Receipt",
          icon: "ri-inbox-line",
          required: true,
        },
        {
          module: "asn",
          action: "view",
          label: "View ASN",
          icon: "ri-file-list-line",
        },
        {
          module: "inventory",
          action: "view",
          label: "Stock Update",
          icon: "ri-stack-line",
        },
      ],
    },
    {
      id: "partially_received",
      code: "PARTIALLY_RECEIVED",
      name: "Partially Received",
      description: "Partial goods receipt has been posted",
      icon: "ri-file-list-2-line",
      color: "#f59e0b",
      order: 6,
      isRequired: false,
      isOptional: true,
      canSkip: true,
      estimatedDuration: 0,
      requiresApproval: false,
      moduleLinks: [
        {
          module: "goods-receipt",
          action: "view",
          label: "View Receipt Status",
          icon: "ri-inbox-line",
        },
      ],
    },
    {
      id: "received",
      code: "RECEIVED",
      name: "Received",
      description: "All goods have been received",
      icon: "ri-checkbox-circle-fill",
      color: "#10b981",
      order: 7,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 0,
      requiresApproval: false,
      moduleLinks: [
        {
          module: "goods-receipt",
          action: "view",
          label: "View Receipt Details",
          icon: "ri-inbox-line",
        },
        {
          module: "inventory",
          action: "view",
          label: "View Updated Stock",
          icon: "ri-stack-line",
        },
      ],
    },
    {
      id: "invoiced",
      code: "INVOICED",
      name: "Invoiced",
      description: "Vendor invoice has been received and matched",
      icon: "ri-money-dollar-circle-line",
      color: "#10b981",
      order: 8,
      isRequired: false,
      isOptional: true,
      canSkip: true,
      estimatedDuration: 259200, // 3 days
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
      description: "Purchase order has been completed",
      icon: "ri-checkbox-circle-fill",
      color: "#10b981",
      order: 9,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 0,
      requiresApproval: false,
      moduleLinks: [
        {
          module: "reports",
          action: "view",
          label: "View PO Report",
          icon: "ri-bar-chart-line",
        },
      ],
    },
  ],

  moduleIntegrations: [
    {
      stageId: "goods_receipt",
      modules: ["goods-receipt", "asn", "inventory"],
      realTimeSync: true,
      syncFields: ["status", "quantity", "location"],
    },
  ],

  evidenceRequired: ["goods_receipt", "received"],

  slaRules: [
    {
      stageId: "pending_approval",
      targetDuration: 86400, // 24 hours
      warningThreshold: 0.8,
      breachAction: "escalate",
      escalationRoles: ["PURCHASING_DIRECTOR"],
    },
  ],

  permissions: [
    {
      stageId: "pending_approval",
      roles: ["PURCHASING_MANAGER", "FINANCE_MANAGER", "ADMIN"],
      actions: ["view", "approve", "reject"],
    },
  ],
};
