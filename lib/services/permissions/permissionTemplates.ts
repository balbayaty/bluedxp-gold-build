/**
 * 📋 SMART PERMISSION TEMPLATES
 *
 * Pre-built permission templates for common roles:
 * - Role-based templates
 * - Department templates
 * - Custom templates
 * - Template inheritance
 * - One-click application
 */

import type {
  UserRole,
  HierarchicalPermission,
  ModuleId,
  FeatureId,
} from "@/types/user";

// ============================================================================
// TYPES
// ============================================================================

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  category: "ROLE" | "DEPARTMENT" | "CUSTOM" | "PROJECT";
  permissions: HierarchicalPermission[];
  applicableRoles?: UserRole[];
  tags: string[];
  createdBy?: string;
  createdAt?: Date;
  usageCount?: number;
  rating?: number;
}

// ============================================================================
// PERMISSION TEMPLATES
// ============================================================================

class PermissionTemplatesService {
  private templates: PermissionTemplate[] = [];

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    // Warehouse Head Template
    this.templates.push({
      id: "warehouse-head",
      name: "Warehouse Head",
      description:
        "Full access to warehouse operations, inventory, and management",
      category: "ROLE",
      applicableRoles: ["WAREHOUSE_HEAD"],
      tags: ["warehouse", "inventory", "operations", "management"],
      permissions: [
        {
          moduleId: "wms",
          moduleAccess: "full",
          actions: ["read", "write", "manage", "approve"],
          scope: "TENANT",
        },
        {
          moduleId: "wms",
          featureId: "wms.inventory",
          featureAccess: "full",
          actions: ["read", "write", "manage"],
          scope: "TENANT",
        },
        {
          moduleId: "wms",
          featureId: "wms.orders",
          featureAccess: "full",
          actions: ["read", "write", "manage", "approve"],
          scope: "TENANT",
        },
        {
          moduleId: "warehouse-network",
          moduleAccess: "full",
          actions: ["read", "write", "manage"],
          scope: "TENANT",
        },
      ],
    });

    // Operations Manager Template
    this.templates.push({
      id: "operations-manager",
      name: "Operations Manager",
      description: "Access to WMS and TMS operations",
      category: "ROLE",
      applicableRoles: ["OPERATIONS_MANAGER"],
      tags: ["operations", "wms", "tms", "management"],
      permissions: [
        {
          moduleId: "wms",
          moduleAccess: "full",
          actions: ["read", "write", "manage"],
          scope: "TENANT",
        },
        {
          moduleId: "tms",
          moduleAccess: "full",
          actions: ["read", "write", "manage"],
          scope: "TENANT",
        },
        {
          moduleId: "wms",
          featureId: "wms.orders",
          featureAccess: "full",
          actions: ["read", "write", "approve"],
          scope: "TENANT",
        },
        {
          moduleId: "tms",
          featureId: "tms.shipments",
          featureAccess: "full",
          actions: ["read", "write", "manage"],
          scope: "TENANT",
        },
      ],
    });

    // Quality Manager Template
    this.templates.push({
      id: "quality-manager",
      name: "Quality Manager",
      description: "Full access to quality, compliance, and safety modules",
      category: "ROLE",
      applicableRoles: ["QUALITY_MANAGER"],
      tags: ["quality", "compliance", "safety", "iso"],
      permissions: [
        {
          moduleId: "iso-ims",
          moduleAccess: "full",
          actions: ["read", "write", "manage", "approve"],
          scope: "TENANT",
        },
        {
          moduleId: "qhse",
          moduleAccess: "full",
          actions: ["read", "write", "manage"],
          scope: "TENANT",
        },
        {
          moduleId: "msds",
          moduleAccess: "full",
          actions: ["read", "write", "manage"],
          scope: "TENANT",
        },
      ],
    });

    // Customer Account Manager Template
    this.templates.push({
      id: "customer-account-manager",
      name: "Customer Account Manager",
      description: "Access to CRM, customers, and proposals",
      category: "ROLE",
      applicableRoles: ["CUSTOMER_ACCOUNT_MANAGER"],
      tags: ["crm", "customers", "sales", "proposals"],
      permissions: [
        {
          moduleId: "crm",
          moduleAccess: "full",
          actions: ["read", "write", "manage"],
          scope: "ASSIGNED_CUSTOMERS",
        },
        {
          moduleId: "proposals-rfq",
          moduleAccess: "full",
          actions: ["read", "write", "manage", "approve"],
          scope: "ASSIGNED_CUSTOMERS",
        },
        {
          moduleId: "wms",
          moduleAccess: "read_only",
          actions: ["read"],
          scope: "ASSIGNED_CUSTOMERS",
        },
      ],
    });

    // Inventory Specialist Template
    this.templates.push({
      id: "inventory-specialist",
      name: "Inventory Specialist",
      description: "Focused access to inventory management",
      category: "ROLE",
      applicableRoles: ["INVENTORY_SPECIALIST"],
      tags: ["inventory", "wms", "specialist"],
      permissions: [
        {
          moduleId: "wms",
          featureId: "wms.inventory",
          featureAccess: "full",
          actions: ["read", "write"],
          scope: "TENANT",
        },
        {
          moduleId: "wms",
          featureId: "wms.cycle_counting",
          featureAccess: "full",
          actions: ["read", "write", "execute"],
          scope: "TENANT",
        },
        {
          moduleId: "wms",
          moduleAccess: "read_only",
          actions: ["read"],
          scope: "TENANT",
        },
      ],
    });

    // Read-Only Viewer Template
    this.templates.push({
      id: "read-only-viewer",
      name: "Read-Only Viewer",
      description: "Read-only access to all modules",
      category: "CUSTOM",
      tags: ["read-only", "viewer", "reporting"],
      permissions: [
        {
          moduleId: "wms",
          moduleAccess: "read_only",
          actions: ["read"],
          scope: "TENANT",
        },
        {
          moduleId: "tms",
          moduleAccess: "read_only",
          actions: ["read"],
          scope: "TENANT",
        },
        {
          moduleId: "reports",
          moduleAccess: "read_only",
          actions: ["read", "export"],
          scope: "TENANT",
        },
      ],
    });
  }

  /**
   * Get all templates
   */
  async getTemplates(filters?: {
    category?: PermissionTemplate["category"];
    role?: UserRole;
    tags?: string[];
  }): Promise<PermissionTemplate[]> {
    let templates = [...this.templates];

    if (filters?.category) {
      templates = templates.filter((t) => t.category === filters.category);
    }

    if (filters?.role) {
      templates = templates.filter(
        (t) => !t.applicableRoles || t.applicableRoles.includes(filters.role!),
      );
    }

    if (filters?.tags && filters.tags.length > 0) {
      templates = templates.filter((t) =>
        filters.tags!.some((tag) => t.tags.includes(tag)),
      );
    }

    return templates;
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<PermissionTemplate | null> {
    return this.templates.find((t) => t.id === id) || null;
  }

  /**
   * Create custom template
   */
  async createTemplate(
    template: Omit<PermissionTemplate, "id" | "createdAt" | "usageCount">,
  ): Promise<PermissionTemplate> {
    const newTemplate: PermissionTemplate = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      usageCount: 0,
    };

    this.templates.push(newTemplate);
    return newTemplate;
  }

  /**
   * Apply template to user
   */
  async applyTemplateToUser(
    templateId: string,
    userId: string,
    options?: {
      merge?: boolean; // Merge with existing permissions or replace
      excludePermissions?: HierarchicalPermission[]; // Permissions to exclude
    },
  ): Promise<HierarchicalPermission[]> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let permissions = [...template.permissions];

    // Exclude specified permissions
    if (options?.excludePermissions) {
      permissions = permissions.filter((perm) => {
        return !options.excludePermissions!.some((exclude) => {
          return (
            exclude.moduleId === perm.moduleId &&
            exclude.featureId === perm.featureId &&
            exclude.tabId === perm.tabId
          );
        });
      });
    }

    // In production, this would:
    // 1. Get user's current permissions
    // 2. Merge or replace based on options
    // 3. Update user permissions
    // 4. Log to audit trail

    // Increment usage count
    template.usageCount = (template.usageCount || 0) + 1;

    return permissions;
  }

  /**
   * Get recommended templates for role
   */
  async getRecommendedTemplatesForRole(
    role: UserRole,
  ): Promise<PermissionTemplate[]> {
    return this.getTemplates({ role });
  }

  /**
   * Search templates
   */
  async searchTemplates(query: string): Promise<PermissionTemplate[]> {
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const permissionTemplates = new PermissionTemplatesService();
