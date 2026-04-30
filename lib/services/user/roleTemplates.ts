/**
 * 🎭 ROLE TEMPLATES SERVICE
 * 
 * Defines default permissions for each role type in the platform.
 * These templates are used when creating new users or resetting permissions.
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

import type { UserRole, ModuleId, Action, HierarchicalPermission } from "@/types/user";

// ============================================================================
// ROLE METADATA
// ============================================================================

export interface RoleMetadata {
  id: UserRole;
  name: string;
  description: string;
  category: "platform" | "operations" | "customer" | "partner" | "compliance" | "finance" | "manufacturing" | "technology" | "hr";
  level: number; // 1 = highest (admin), 10 = lowest (viewer)
  canCreateUsers: boolean;
  canAssignRoles: UserRole[]; // Which roles this role can assign
  defaultModules: ModuleId[];
  defaultActions: Action[];
}

export const ROLE_METADATA: Record<UserRole, RoleMetadata> = {
  // Platform Administrators
  SYSTEM_ADMIN: {
    id: "SYSTEM_ADMIN",
    name: "System Administrator",
    description: "Full platform access with all permissions",
    category: "platform",
    level: 1,
    canCreateUsers: true,
    canAssignRoles: ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN", "WAREHOUSE_HEAD", "TRANSPORT_GENERAL_MANAGER", "OPERATIONS_MANAGER", "BUSINESS_DEVELOPMENT_MANAGER", "CUSTOMER_ADMIN", "CARRIER_ADMIN", "VENDOR_ADMIN", "3PL_ADMIN", "4PL_ADMIN", "BROKER_ADMIN", "FINANCE_ADMIN", "PRODUCTION_MANAGER", "IT_ADMIN", "HR_MANAGER", "COMPLIANCE_OFFICER", "QUALITY_MANAGER", "AUDITOR"],
    defaultModules: ["wms", "tms", "finance", "crm", "hr", "settings", "reports", "analytics", "ai", "integration", "qhse", "iso-ims", "msds", "customs", "trade-compliance", "gcc-compliance", "maas", "proposals-rfq", "procurement", "marketplace", "facility-management", "warehouse-network", "project-management", "business-intelligence", "pulse", "truth-engine", "intelligence-analytics", "liability", "export-house", "etw", "external-integrations", "digital-signature", "ict-hardware", "dmarc-monitoring", "workspace", "chemical"],
    defaultActions: ["read", "read_write", "write", "delete", "approve", "export", "import", "manage", "configure", "assign", "execute"],
  },
  PLATFORM_ADMIN: {
    id: "PLATFORM_ADMIN",
    name: "Platform Administrator",
    description: "Platform-level management for multi-tenant operations",
    category: "platform",
    level: 2,
    canCreateUsers: true,
    canAssignRoles: ["TENANT_ADMIN", "WAREHOUSE_HEAD", "TRANSPORT_GENERAL_MANAGER", "OPERATIONS_MANAGER", "BUSINESS_DEVELOPMENT_MANAGER", "CUSTOMER_ADMIN", "CARRIER_ADMIN", "VENDOR_ADMIN"],
    defaultModules: ["wms", "tms", "finance", "crm", "hr", "settings", "reports", "analytics", "ai", "integration", "qhse", "iso-ims", "msds", "customs", "trade-compliance", "gcc-compliance", "maas", "proposals-rfq", "procurement", "marketplace", "facility-management", "warehouse-network", "project-management", "business-intelligence", "pulse"],
    defaultActions: ["read", "read_write", "write", "delete", "approve", "export", "import", "manage", "configure"],
  },
  TENANT_ADMIN: {
    id: "TENANT_ADMIN",
    name: "Tenant Administrator",
    description: "Organization-level administrator for a single tenant",
    category: "platform",
    level: 3,
    canCreateUsers: true,
    canAssignRoles: ["WAREHOUSE_HEAD", "WAREHOUSE_SUPERVISOR", "WAREHOUSE_OPERATOR", "TRANSPORT_GENERAL_MANAGER", "FLEET_MANAGER", "DISPATCHER", "DRIVER", "OPERATIONS_MANAGER", "BUSINESS_DEVELOPMENT_MANAGER", "CUSTOMER_ACCOUNT_MANAGER", "QUALITY_MANAGER", "INVENTORY_SPECIALIST", "FINANCE_ADMIN", "FINANCE_ANALYST", "BILLING_ADMIN", "PROCUREMENT_MANAGER", "PROCUREMENT_OFFICER", "HR_MANAGER", "HR_OFFICER", "TRAINING_COORDINATOR", "COMPLIANCE_OFFICER", "SAFETY_OFFICER"],
    defaultModules: ["wms", "tms", "finance", "crm", "hr", "settings", "reports", "analytics", "qhse", "iso-ims", "msds", "proposals-rfq", "procurement", "facility-management", "workspace"],
    defaultActions: ["read", "read_write", "write", "delete", "approve", "export", "import", "manage", "configure"],
  },

  // Warehouse Operations
  WAREHOUSE_HEAD: {
    id: "WAREHOUSE_HEAD",
    name: "Warehouse Director",
    description: "Director of warehouse operations",
    category: "operations",
    level: 4,
    canCreateUsers: true,
    canAssignRoles: ["WAREHOUSE_SUPERVISOR", "WAREHOUSE_OPERATOR", "INVENTORY_SPECIALIST", "PICKING_OPERATOR", "RECEIVING_CLERK", "SHIPPING_CLERK"],
    defaultModules: ["wms", "reports", "analytics", "qhse", "iso-ims", "msds", "workspace"],
    defaultActions: ["read", "read_write", "write", "approve", "export", "manage"],
  },
  WAREHOUSE_SUPERVISOR: {
    id: "WAREHOUSE_SUPERVISOR",
    name: "Warehouse Supervisor",
    description: "Floor supervisor for warehouse operations",
    category: "operations",
    level: 5,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["wms", "reports", "qhse", "msds", "workspace"],
    defaultActions: ["read", "read_write", "write", "approve", "export"],
  },
  WAREHOUSE_OPERATOR: {
    id: "WAREHOUSE_OPERATOR",
    name: "Warehouse Operator",
    description: "Floor staff for warehouse operations",
    category: "operations",
    level: 7,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["wms", "workspace"],
    defaultActions: ["read", "read_write", "write"],
  },
  INVENTORY_SPECIALIST: {
    id: "INVENTORY_SPECIALIST",
    name: "Inventory Specialist",
    description: "Specialist for inventory management",
    category: "operations",
    level: 6,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["wms", "reports", "analytics", "workspace"],
    defaultActions: ["read", "read_write", "write", "export"],
  },
  PICKING_OPERATOR: {
    id: "PICKING_OPERATOR",
    name: "Picking Operator",
    description: "Operator for picking operations",
    category: "operations",
    level: 8,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["wms", "workspace"],
    defaultActions: ["read", "read_write"],
  },
  RECEIVING_CLERK: {
    id: "RECEIVING_CLERK",
    name: "Receiving Clerk",
    description: "Clerk for receiving dock operations",
    category: "operations",
    level: 8,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["wms", "workspace"],
    defaultActions: ["read", "read_write"],
  },
  SHIPPING_CLERK: {
    id: "SHIPPING_CLERK",
    name: "Shipping Clerk",
    description: "Clerk for shipping dock operations",
    category: "operations",
    level: 8,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["wms", "tms", "workspace"],
    defaultActions: ["read", "read_write"],
  },

  // Transport Operations
  TRANSPORT_GENERAL_MANAGER: {
    id: "TRANSPORT_GENERAL_MANAGER",
    name: "Transport General Manager",
    description: "Head of transportation department",
    category: "operations",
    level: 4,
    canCreateUsers: true,
    canAssignRoles: ["FLEET_MANAGER", "DISPATCHER", "DRIVER", "ROUTE_PLANNER"],
    defaultModules: ["tms", "reports", "analytics", "customs", "trade-compliance", "gcc-compliance", "etw", "workspace"],
    defaultActions: ["read", "read_write", "write", "approve", "export", "manage"],
  },
  FLEET_MANAGER: {
    id: "FLEET_MANAGER",
    name: "Fleet Manager",
    description: "Manager for fleet operations",
    category: "operations",
    level: 5,
    canCreateUsers: true,
    canAssignRoles: ["DISPATCHER", "DRIVER"],
    defaultModules: ["tms", "reports", "workspace"],
    defaultActions: ["read", "read_write", "write", "approve", "export"],
  },
  DISPATCHER: {
    id: "DISPATCHER",
    name: "Dispatcher",
    description: "Dispatch operations coordinator",
    category: "operations",
    level: 6,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["tms", "workspace"],
    defaultActions: ["read", "read_write", "write"],
  },
  DRIVER: {
    id: "DRIVER",
    name: "Driver",
    description: "Individual driver",
    category: "operations",
    level: 8,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["tms", "workspace"],
    defaultActions: ["read", "read_write"],
  },
  ROUTE_PLANNER: {
    id: "ROUTE_PLANNER",
    name: "Route Planner",
    description: "Route planning specialist",
    category: "operations",
    level: 6,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["tms", "analytics", "workspace"],
    defaultActions: ["read", "read_write", "write", "export"],
  },

  // Customer-Facing
  BUSINESS_DEVELOPMENT_MANAGER: {
    id: "BUSINESS_DEVELOPMENT_MANAGER",
    name: "Business Development Manager",
    description: "Sales and business development",
    category: "customer",
    level: 5,
    canCreateUsers: true,
    canAssignRoles: ["CUSTOMER_ACCOUNT_MANAGER", "CUSTOMER_ADMIN"],
    defaultModules: ["crm", "proposals-rfq", "reports", "analytics", "marketplace", "workspace"],
    defaultActions: ["read", "read_write", "write", "export"],
  },
  CUSTOMER_ACCOUNT_MANAGER: {
    id: "CUSTOMER_ACCOUNT_MANAGER",
    name: "Customer Account Manager",
    description: "Manages customer relationships",
    category: "customer",
    level: 6,
    canCreateUsers: true,
    canAssignRoles: ["CUSTOMER_ADMIN", "CUSTOMER_USER", "CUSTOMER_VIEWER"],
    defaultModules: ["crm", "wms", "tms", "reports", "workspace"],
    defaultActions: ["read", "read_write", "write", "export"],
  },
  CUSTOMER_ADMIN: {
    id: "CUSTOMER_ADMIN",
    name: "Customer Administrator",
    description: "Administrator for customer organization",
    category: "customer",
    level: 4,
    canCreateUsers: true,
    canAssignRoles: ["CUSTOMER_USER", "CUSTOMER_VIEWER"],
    defaultModules: ["wms", "tms", "reports", "analytics", "workspace"],
    defaultActions: ["read", "read_write", "write", "export"],
  },
  CUSTOMER_USER: {
    id: "CUSTOMER_USER",
    name: "Customer User",
    description: "Standard customer user",
    category: "customer",
    level: 7,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["wms", "tms", "reports", "workspace"],
    defaultActions: ["read", "read_write", "export"],
  },
  CUSTOMER_VIEWER: {
    id: "CUSTOMER_VIEWER",
    name: "Customer Viewer",
    description: "Read-only customer access",
    category: "customer",
    level: 9,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["wms", "tms", "reports", "workspace"],
    defaultActions: ["read", "export"],
  },

  // Carrier & Partner
  CARRIER_ADMIN: {
    id: "CARRIER_ADMIN",
    name: "Carrier Administrator",
    description: "Administrator for carrier organization",
    category: "partner",
    level: 4,
    canCreateUsers: true,
    canAssignRoles: ["CARRIER_DISPATCHER", "CARRIER_DRIVER"],
    defaultModules: ["tms", "reports", "gcc-compliance", "etw", "workspace"],
    defaultActions: ["read", "read_write", "write", "export"],
  },
  CARRIER_DISPATCHER: {
    id: "CARRIER_DISPATCHER",
    name: "Carrier Dispatcher",
    description: "Dispatcher for carrier organization",
    category: "partner",
    level: 6,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["tms", "workspace"],
    defaultActions: ["read", "read_write", "write"],
  },
  CARRIER_DRIVER: {
    id: "CARRIER_DRIVER",
    name: "Carrier Driver",
    description: "Driver for carrier organization",
    category: "partner",
    level: 8,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["tms", "workspace"],
    defaultActions: ["read", "read_write"],
  },
  VENDOR_ADMIN: {
    id: "VENDOR_ADMIN",
    name: "Vendor Administrator",
    description: "Administrator for supplier organization",
    category: "partner",
    level: 4,
    canCreateUsers: true,
    canAssignRoles: ["VENDOR_SALES", "VENDOR_SUPPORT"],
    defaultModules: ["wms", "procurement", "marketplace", "reports", "workspace"],
    defaultActions: ["read", "read_write", "write", "export"],
  },
  VENDOR_SALES: {
    id: "VENDOR_SALES",
    name: "Vendor Sales",
    description: "Sales representative for supplier",
    category: "partner",
    level: 6,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["marketplace", "workspace"],
    defaultActions: ["read", "read_write", "write"],
  },
  VENDOR_SUPPORT: {
    id: "VENDOR_SUPPORT",
    name: "Vendor Support",
    description: "Support representative for supplier",
    category: "partner",
    level: 7,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["wms", "workspace"],
    defaultActions: ["read", "read_write"],
  },

  // 3PL/4PL Partners
  "3PL_ADMIN": {
    id: "3PL_ADMIN",
    name: "3PL Administrator",
    description: "Administrator for 3PL provider",
    category: "partner",
    level: 4,
    canCreateUsers: true,
    canAssignRoles: ["3PL_OPERATOR"],
    defaultModules: ["wms", "tms", "reports", "analytics", "workspace"],
    defaultActions: ["read", "read_write", "write", "export", "manage"],
  },
  "3PL_OPERATOR": {
    id: "3PL_OPERATOR",
    name: "3PL Operator",
    description: "Staff for 3PL provider",
    category: "partner",
    level: 7,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["wms", "tms", "workspace"],
    defaultActions: ["read", "read_write", "write"],
  },
  "4PL_ADMIN": {
    id: "4PL_ADMIN",
    name: "4PL Orchestrator",
    description: "Administrator for 4PL provider",
    category: "partner",
    level: 3,
    canCreateUsers: true,
    canAssignRoles: ["3PL_ADMIN", "3PL_OPERATOR", "CARRIER_ADMIN", "FREIGHT_FORWARDER"],
    defaultModules: ["wms", "tms", "finance", "reports", "analytics", "ai", "intelligence-analytics", "workspace"],
    defaultActions: ["read", "read_write", "write", "approve", "export", "manage", "configure"],
  },
  BROKER_ADMIN: {
    id: "BROKER_ADMIN",
    name: "Customs Broker Administrator",
    description: "Administrator for customs broker",
    category: "partner",
    level: 4,
    canCreateUsers: true,
    canAssignRoles: ["BROKER_AGENT"],
    defaultModules: ["customs", "trade-compliance", "gcc-compliance", "export-house", "etw", "reports", "workspace"],
    defaultActions: ["read", "read_write", "write", "export"],
  },
  BROKER_AGENT: {
    id: "BROKER_AGENT",
    name: "Customs Broker Agent",
    description: "Agent for customs broker",
    category: "partner",
    level: 6,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["customs", "trade-compliance", "workspace"],
    defaultActions: ["read", "read_write", "write"],
  },
  FREIGHT_FORWARDER: {
    id: "FREIGHT_FORWARDER",
    name: "Freight Forwarder",
    description: "Freight forwarding agent",
    category: "partner",
    level: 5,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["tms", "customs", "trade-compliance", "reports", "workspace"],
    defaultActions: ["read", "read_write", "write", "export"],
  },

  // Compliance & Quality
  QUALITY_MANAGER: {
    id: "QUALITY_MANAGER",
    name: "Quality Manager",
    description: "Head of quality control",
    category: "compliance",
    level: 5,
    canCreateUsers: true,
    canAssignRoles: ["QUALITY_INSPECTOR"],
    defaultModules: ["qhse", "iso-ims", "msds", "reports", "analytics", "workspace"],
    defaultActions: ["read", "read_write", "write", "approve", "export"],
  },
  QUALITY_INSPECTOR: {
    id: "QUALITY_INSPECTOR",
    name: "Quality Inspector",
    description: "Quality control staff",
    category: "compliance",
    level: 7,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["qhse", "iso-ims", "msds", "workspace"],
    defaultActions: ["read", "read_write", "write"],
  },
  COMPLIANCE_OFFICER: {
    id: "COMPLIANCE_OFFICER",
    name: "Compliance Officer",
    description: "Compliance team member",
    category: "compliance",
    level: 5,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["qhse", "iso-ims", "customs", "trade-compliance", "gcc-compliance", "reports", "analytics", "workspace"],
    defaultActions: ["read", "read_write", "write", "approve", "export"],
  },
  SAFETY_OFFICER: {
    id: "SAFETY_OFFICER",
    name: "Safety Officer",
    description: "Health, Safety, and Environment officer",
    category: "compliance",
    level: 5,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["qhse", "iso-ims", "msds", "chemical", "reports", "workspace"],
    defaultActions: ["read", "read_write", "write", "approve", "export"],
  },
  AUDITOR: {
    id: "AUDITOR",
    name: "Auditor",
    description: "Internal or external auditor",
    category: "compliance",
    level: 4,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["qhse", "iso-ims", "finance", "reports", "analytics", "truth-engine", "workspace"],
    defaultActions: ["read", "export"],
  },
  CUSTOMS_OFFICER: {
    id: "CUSTOMS_OFFICER",
    name: "Customs Officer",
    description: "Government customs official (external)",
    category: "compliance",
    level: 5,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["customs", "trade-compliance", "etw", "workspace"],
    defaultActions: ["read"],
  },

  // Finance & Commercial
  FINANCE_ADMIN: {
    id: "FINANCE_ADMIN",
    name: "Finance Director",
    description: "Head of finance department",
    category: "finance",
    level: 4,
    canCreateUsers: true,
    canAssignRoles: ["FINANCE_ANALYST", "BILLING_ADMIN", "PROCUREMENT_MANAGER", "PROCUREMENT_OFFICER"],
    defaultModules: ["finance", "reports", "analytics", "billing", "procurement", "workspace"],
    defaultActions: ["read", "read_write", "write", "approve", "export", "manage"],
  },
  FINANCE_ANALYST: {
    id: "FINANCE_ANALYST",
    name: "Finance Analyst",
    description: "Finance team member",
    category: "finance",
    level: 6,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["finance", "reports", "analytics", "workspace"],
    defaultActions: ["read", "read_write", "export"],
  },
  BILLING_ADMIN: {
    id: "BILLING_ADMIN",
    name: "Billing Administrator",
    description: "Billing management",
    category: "finance",
    level: 5,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["finance", "reports", "workspace"],
    defaultActions: ["read", "read_write", "write", "export"],
  },
  PROCUREMENT_MANAGER: {
    id: "PROCUREMENT_MANAGER",
    name: "Procurement Manager",
    description: "Head of procurement",
    category: "finance",
    level: 5,
    canCreateUsers: true,
    canAssignRoles: ["PROCUREMENT_OFFICER"],
    defaultModules: ["procurement", "marketplace", "reports", "analytics", "workspace"],
    defaultActions: ["read", "read_write", "write", "approve", "export", "manage"],
  },
  PROCUREMENT_OFFICER: {
    id: "PROCUREMENT_OFFICER",
    name: "Procurement Officer",
    description: "Procurement staff",
    category: "finance",
    level: 6,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["procurement", "marketplace", "workspace"],
    defaultActions: ["read", "read_write", "write", "export"],
  },
  OPERATIONS_MANAGER: {
    id: "OPERATIONS_MANAGER",
    name: "Operations Manager",
    description: "Head of operations",
    category: "operations",
    level: 4,
    canCreateUsers: true,
    canAssignRoles: ["WAREHOUSE_HEAD", "TRANSPORT_GENERAL_MANAGER", "QUALITY_MANAGER"],
    defaultModules: ["wms", "tms", "qhse", "iso-ims", "reports", "analytics", "ai", "pulse", "workspace"],
    defaultActions: ["read", "read_write", "write", "approve", "export", "manage"],
  },

  // Manufacturing
  PRODUCTION_MANAGER: {
    id: "PRODUCTION_MANAGER",
    name: "Production Manager",
    description: "Head of production",
    category: "manufacturing",
    level: 4,
    canCreateUsers: true,
    canAssignRoles: ["SHOP_FLOOR_SUPERVISOR", "MACHINE_OPERATOR", "QUALITY_INSPECTOR"],
    defaultModules: ["maas", "wms", "qhse", "reports", "analytics", "workspace"],
    defaultActions: ["read", "read_write", "write", "approve", "export", "manage"],
  },
  SHOP_FLOOR_SUPERVISOR: {
    id: "SHOP_FLOOR_SUPERVISOR",
    name: "Shop Floor Supervisor",
    description: "Manufacturing floor supervisor",
    category: "manufacturing",
    level: 6,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["maas", "wms", "qhse", "workspace"],
    defaultActions: ["read", "read_write", "write", "approve"],
  },
  MACHINE_OPERATOR: {
    id: "MACHINE_OPERATOR",
    name: "Machine Operator",
    description: "Equipment operator",
    category: "manufacturing",
    level: 8,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["maas", "workspace"],
    defaultActions: ["read", "read_write"],
  },

  // Technology & Integration
  IT_ADMIN: {
    id: "IT_ADMIN",
    name: "IT Administrator",
    description: "IT department administrator",
    category: "technology",
    level: 4,
    canCreateUsers: true,
    canAssignRoles: ["DEVELOPER", "INTEGRATOR"],
    defaultModules: ["settings", "integration", "external-integrations", "ict-hardware", "dmarc-monitoring", "reports", "workspace"],
    defaultActions: ["read", "read_write", "write", "manage", "configure"],
  },
  DEVELOPER: {
    id: "DEVELOPER",
    name: "Developer",
    description: "API developer",
    category: "technology",
    level: 6,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["integration", "external-integrations", "reports", "workspace"],
    defaultActions: ["read", "read_write", "write", "export"],
  },
  INTEGRATOR: {
    id: "INTEGRATOR",
    name: "Integration Partner",
    description: "Integration partner",
    category: "technology",
    level: 5,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["integration", "external-integrations", "reports", "workspace"],
    defaultActions: ["read", "read_write", "write", "export"],
  },

  // HR & Admin
  HR_MANAGER: {
    id: "HR_MANAGER",
    name: "HR Manager",
    description: "Head of HR",
    category: "hr",
    level: 4,
    canCreateUsers: true,
    canAssignRoles: ["HR_OFFICER", "TRAINING_COORDINATOR"],
    defaultModules: ["hr", "iso-ims", "reports", "analytics", "workspace"],
    defaultActions: ["read", "read_write", "write", "approve", "export", "manage"],
  },
  HR_OFFICER: {
    id: "HR_OFFICER",
    name: "HR Officer",
    description: "HR staff member",
    category: "hr",
    level: 6,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["hr", "iso-ims", "workspace"],
    defaultActions: ["read", "read_write", "write", "export"],
  },
  TRAINING_COORDINATOR: {
    id: "TRAINING_COORDINATOR",
    name: "Training Coordinator",
    description: "Training management",
    category: "hr",
    level: 6,
    canCreateUsers: false,
    canAssignRoles: [],
    defaultModules: ["hr", "iso-ims", "workspace"],
    defaultActions: ["read", "read_write", "write", "export"],
  },
};

// ============================================================================
// PERMISSION TEMPLATES
// ============================================================================

/**
 * Get default permissions for a role
 */
export function getDefaultPermissionsForRole(role: UserRole): HierarchicalPermission[] {
  const metadata = ROLE_METADATA[role];
  if (!metadata) return [];

  return metadata.defaultModules.map((moduleId) => ({
    moduleId,
    moduleAccess: metadata.level <= 3 ? "full" : metadata.level <= 5 ? "partial" : "read_only",
    actions: metadata.defaultActions,
    scope: "TENANT" as const,
  }));
}

/**
 * Get which roles a user can assign based on their role
 */
export function getAssignableRoles(userRole: UserRole): UserRole[] {
  const metadata = ROLE_METADATA[userRole];
  return metadata?.canAssignRoles || [];
}

/**
 * Check if a user can create other users
 */
export function canUserCreateUsers(userRole: UserRole): boolean {
  const metadata = ROLE_METADATA[userRole];
  return metadata?.canCreateUsers || false;
}

/**
 * Get role hierarchy level (lower = more privileged)
 */
export function getRoleLevel(role: UserRole): number {
  const metadata = ROLE_METADATA[role];
  return metadata?.level || 10;
}

/**
 * Check if sourceRole can assign targetRole
 */
export function canAssignRole(sourceRole: UserRole, targetRole: UserRole): boolean {
  const assignable = getAssignableRoles(sourceRole);
  return assignable.includes(targetRole);
}

/**
 * Get all roles by category
 */
export function getRolesByCategory(category: RoleMetadata["category"]): UserRole[] {
  return Object.entries(ROLE_METADATA)
    .filter(([_, meta]) => meta.category === category)
    .map(([role, _]) => role as UserRole);
}

/**
 * Get all role categories
 */
export function getAllCategories(): RoleMetadata["category"][] {
  return ["platform", "operations", "customer", "partner", "compliance", "finance", "manufacturing", "technology", "hr"];
}

export default {
  ROLE_METADATA,
  getDefaultPermissionsForRole,
  getAssignableRoles,
  canUserCreateUsers,
  getRoleLevel,
  canAssignRole,
  getRolesByCategory,
  getAllCategories,
};
