/**
 * MSDS Lifecycle Configuration
 * Tenant-safe by using composite entityId at call sites (tenantId::msdsId).
 */

import type { LifecycleConfig } from "@/types/lifecycle";

export const msdsLifecycleConfig: LifecycleConfig = {
  entityType: "MSDS",
  name: "MSDS Lifecycle",
  description:
    "MSDS processing from receipt to approval/rejection and publication",
  version: "1.0.0",
  stages: [
    {
      id: "MSDS_RECEIVED",
      code: "MSDS_RECEIVED",
      name: "Received",
      description: "MSDS received and queued for extraction",
      icon: "ri-inbox-archive-line",
      color: "#6b7280",
      order: 1,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 0,
      slaTarget: 0,
      requiresApproval: false,
      approvalRoles: [],
      autoTransition: { enabled: false },
      conditions: [],
      moduleLinks: [
        {
          module: "msds",
          action: "view_msds",
          label: "Open MSDS Module",
          href: "/msds",
        },
      ],
      actions: [
        {
          id: "start_extraction",
          label: "Start Extraction",
          type: "button",
          icon: "ri-magic-line",
        },
      ],
    },
    {
      id: "MSDS_EXTRACTED",
      code: "MSDS_EXTRACTED",
      name: "Extracted",
      description: "Key fields extracted (AI/ML) and ready for review",
      icon: "ri-brain-line",
      color: "#3b82f6",
      order: 2,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 300,
      slaTarget: 1800,
      requiresApproval: false,
      approvalRoles: [],
      moduleLinks: [
        {
          module: "msds",
          action: "review_msds",
          label: "Review in MSDS",
          href: "/msds",
        },
        {
          module: "compliance",
          action: "check_compliance",
          label: "Compliance Tools",
          href: "/compliance",
        },
      ],
      actions: [
        {
          id: "run_compliance",
          label: "Run Compliance Check",
          type: "button",
          icon: "ri-shield-check-line",
        },
      ],
    },
    {
      id: "MSDS_IN_REVIEW",
      code: "MSDS_IN_REVIEW",
      name: "In Review",
      description:
        "Reviewer validating extracted data and deciding approve/reject",
      icon: "ri-search-eye-line",
      color: "#f59e0b",
      order: 3,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 1800,
      slaTarget: 14400,
      requiresApproval: true,
      approvalRoles: ["COMPLIANCE_OFFICER", "QHSE_MANAGER", "SYSTEM_ADMIN"],
      moduleLinks: [
        {
          module: "msds",
          action: "approve_reject",
          label: "Approve/Reject",
          href: "/msds",
        },
      ],
      actions: [
        {
          id: "approve",
          label: "Approve",
          type: "button",
          icon: "ri-check-line",
        },
        {
          id: "reject",
          label: "Reject",
          type: "button",
          icon: "ri-close-line",
        },
      ],
    },
    {
      id: "MSDS_APPROVED",
      code: "MSDS_APPROVED",
      name: "Approved",
      description: "MSDS approved and available for cross-module usage",
      icon: "ri-verified-badge-line",
      color: "#10b981",
      order: 4,
      isRequired: true,
      isOptional: false,
      canSkip: false,
      estimatedDuration: 0,
      slaTarget: 0,
      requiresApproval: false,
      approvalRoles: [],
      moduleLinks: [
        {
          module: "wms",
          action: "assign_msds",
          label: "Assign to SKU/Warehouse",
          href: "/wms",
        },
        {
          module: "tms",
          action: "use_transport_rules",
          label: "Use for Transportation",
          href: "/tms",
        },
      ],
      actions: [],
    },
    {
      id: "MSDS_REJECTED",
      code: "MSDS_REJECTED",
      name: "Rejected",
      description: "MSDS rejected, awaiting additional info or resubmission",
      icon: "ri-forbid-2-line",
      color: "#ef4444",
      order: 5,
      isRequired: false,
      isOptional: true,
      canSkip: true,
      estimatedDuration: 0,
      slaTarget: 0,
      requiresApproval: false,
      approvalRoles: [],
      moduleLinks: [
        {
          module: "msds",
          action: "request_info",
          label: "Request Info",
          href: "/msds",
        },
      ],
      actions: [],
    },
  ],
};
