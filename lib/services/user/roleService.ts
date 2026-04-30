/**
 * 🚀 ROLE SERVICE
 *
 * Dynamic role management with inheritance, versioning, and templates
 * Supports custom role creation, role hierarchies, and temporary assignments
 *
 * Features:
 * - Dynamic role creation via UI/API
 * - Role templates and inheritance
 * - Role versioning and migration
 * - Temporary role assignments with expiration
 * - Role delegation and proxy access
 * - Role-based workflows and approval chains
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-bus";
import type { HierarchicalPermission } from "@/types/permissions";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateRoleInput {
  tenantId: string;
  name: string;
  displayName: string;
  description?: string;
  isSystemRole?: boolean;
  parentRoleId?: string;
  templateId?: string;
  permissions: HierarchicalPermission[];
  defaultScope?:
    | "ALL"
    | "TENANT"
    | "ASSIGNED_CUSTOMERS"
    | "ASSIGNED_WAREHOUSES"
    | "ASSIGNED_REGIONS"
    | "OWN";
  approvalChain?: any;
  metadata?: Record<string, any>;
  createdBy?: string;
}

export interface UpdateRoleInput {
  displayName?: string;
  description?: string;
  isActive?: boolean;
  permissions?: HierarchicalPermission[];
  defaultScope?: string;
  approvalChain?: any;
  metadata?: Record<string, any>;
  updatedBy?: string;
}

export interface RoleAssignmentOptions {
  delegatedFrom?: string;
  reason?: string;
  expiresAt?: Date | string;
  metadata?: Record<string, any>;
}

// ============================================================================
// ROLE SERVICE
// ============================================================================

class RoleService {
  /**
   * Create new role
   */
  async createRole(input: CreateRoleInput): Promise<any> {
    try {
      // Check if role name already exists for this tenant
      const existing = await prisma.role.findFirst({
        where: {
          tenantId: input.tenantId,
          name: input.name,
          version: 1, // Check latest version
        },
      });

      if (existing) {
        throw new Error(`Role ${input.name} already exists for this tenant`);
      }

      // Create role
      const role = await prisma.role.create({
        data: {
          tenantId: input.tenantId,
          name: input.name,
          displayName: input.displayName,
          description: input.description,
          isSystemRole: input.isSystemRole || false,
          isActive: true,
          version: 1,
          parentRoleId: input.parentRoleId || null,
          templateId: input.templateId || null,
          permissions: input.permissions as any,
          defaultScope: input.defaultScope || "TENANT",
          approvalChain: input.approvalChain || null,
          metadata: input.metadata || {},
          createdBy: input.createdBy,
        },
      });

      // Publish event
      await eventBus.publish({
        type: "RoleCreated",
        aggregateId: role.id,
        aggregateType: "Role",
        payload: {
          roleId: role.id,
          name: role.name,
          tenantId: role.tenantId,
        },
        metadata: {
          tenantId: role.tenantId,
          userId: input.createdBy,
          timestamp: new Date().toISOString(),
        },
      });

      return role;
    } catch (error) {
      console.error("[RoleService] Error creating role:", error);
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRole(roleId: string): Promise<any | null> {
    try {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          parentRole: true,
          childRoles: true,
          template: true,
        },
      });

      return role;
    } catch (error) {
      console.error("[RoleService] Error getting role:", error);
      throw error;
    }
  }

  /**
   * Update role
   */
  async updateRole(roleId: string, input: UpdateRoleInput): Promise<any> {
    try {
      const existing = await this.getRole(roleId);
      if (!existing) {
        throw new Error(`Role ${roleId} not found`);
      }

      // If permissions changed, create new version
      if (
        input.permissions &&
        JSON.stringify(input.permissions) !==
          JSON.stringify(existing.permissions)
      ) {
        // Create new version
        const newVersion = await prisma.role.create({
          data: {
            tenantId: existing.tenantId,
            name: existing.name,
            displayName: input.displayName || existing.displayName,
            description: input.description || existing.description,
            isSystemRole: existing.isSystemRole,
            isActive: true,
            version: existing.version + 1,
            parentRoleId: existing.parentRoleId,
            templateId: existing.templateId,
            permissions: input.permissions as any,
            defaultScope: input.defaultScope || existing.defaultScope,
            approvalChain: input.approvalChain || existing.approvalChain,
            metadata: { ...existing.metadata, ...input.metadata },
            createdBy: input.updatedBy,
          },
        });

        // Deactivate old version
        await prisma.role.update({
          where: { id: roleId },
          data: { isActive: false },
        });

        // Publish event
        await eventBus.publish({
          type: "RoleVersioned",
          aggregateId: newVersion.id,
          aggregateType: "Role",
          payload: {
            roleId: newVersion.id,
            oldVersionId: roleId,
            version: newVersion.version,
          },
          metadata: {
            tenantId: existing.tenantId,
            userId: input.updatedBy,
            timestamp: new Date().toISOString(),
          },
        });

        return newVersion;
      }

      // Update existing role
      const role = await prisma.role.update({
        where: { id: roleId },
        data: {
          ...(input.displayName && { displayName: input.displayName }),
          ...(input.description && { description: input.description }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
          ...(input.defaultScope && { defaultScope: input.defaultScope }),
          ...(input.approvalChain && { approvalChain: input.approvalChain }),
          ...(input.metadata && {
            metadata: { ...existing.metadata, ...input.metadata },
          }),
          updatedBy: input.updatedBy,
        },
      });

      // Publish event
      await eventBus.publish({
        type: "RoleUpdated",
        aggregateId: roleId,
        aggregateType: "Role",
        payload: {
          roleId,
          changes: input,
        },
        metadata: {
          tenantId: role.tenantId,
          userId: input.updatedBy,
          timestamp: new Date().toISOString(),
        },
      });

      return role;
    } catch (error) {
      console.error("[RoleService] Error updating role:", error);
      throw error;
    }
  }

  /**
   * Delete role (soft delete by setting isActive to false)
   */
  async deleteRole(roleId: string): Promise<boolean> {
    try {
      await prisma.role.update({
        where: { id: roleId },
        data: { isActive: false },
      });

      // Publish event
      const role = await this.getRole(roleId);
      if (role) {
        await eventBus.publish({
          type: "RoleDeleted",
          aggregateId: roleId,
          aggregateType: "Role",
          payload: {
            roleId,
          },
          metadata: {
            tenantId: role.tenantId,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return true;
    } catch (error) {
      console.error("[RoleService] Error deleting role:", error);
      throw error;
    }
  }

  /**
   * Clone role
   */
  async cloneRole(roleId: string, newName: string): Promise<any> {
    try {
      const source = await this.getRole(roleId);
      if (!source) {
        throw new Error(`Role ${roleId} not found`);
      }

      return await this.createRole({
        tenantId: source.tenantId,
        name: newName,
        displayName: `${source.displayName} (Copy)`,
        description: source.description || undefined,
        isSystemRole: false,
        parentRoleId: source.parentRoleId || undefined,
        templateId: source.templateId || undefined,
        permissions: source.permissions as HierarchicalPermission[],
        defaultScope: source.defaultScope as any,
        approvalChain: source.approvalChain,
        metadata: source.metadata as any,
        createdBy: source.createdBy || undefined,
      });
    } catch (error) {
      console.error("[RoleService] Error cloning role:", error);
      throw error;
    }
  }

  /**
   * Create role from template
   */
  async createRoleFromTemplate(
    templateId: string,
    tenantId: string,
    name: string,
  ): Promise<any> {
    try {
      const template = await prisma.permissionTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      return await this.createRole({
        tenantId,
        name,
        displayName: name,
        description: `Created from template: ${template.name}`,
        isSystemRole: false,
        templateId,
        permissions: template.permissions as HierarchicalPermission[],
        defaultScope: "TENANT",
      });
    } catch (error) {
      console.error("[RoleService] Error creating role from template:", error);
      throw error;
    }
  }

  /**
   * Get role hierarchy (parent and all ancestors)
   */
  async getRoleHierarchy(roleId: string): Promise<any[]> {
    try {
      const role = await this.getRole(roleId);
      if (!role) return [];

      const hierarchy: any[] = [role];

      // Get parent roles recursively
      let current = role;
      while (current.parentRoleId) {
        const parent = await this.getRole(current.parentRoleId);
        if (parent) {
          hierarchy.unshift(parent);
          current = parent;
        } else {
          break;
        }
      }

      return hierarchy;
    } catch (error) {
      console.error("[RoleService] Error getting role hierarchy:", error);
      return [];
    }
  }

  /**
   * Assign role to user (temporary assignment)
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    options?: RoleAssignmentOptions,
  ): Promise<any> {
    try {
      const assignment = await prisma.roleAssignment.create({
        data: {
          userId,
          roleId,
          assignedBy: options?.metadata?.assignedBy || "system",
          expiresAt: options?.expiresAt ? new Date(options.expiresAt) : null,
          delegatedFrom: options?.delegatedFrom || null,
          reason: options?.reason || null,
          metadata: options?.metadata || {},
        },
      });

      // Publish event
      await eventBus.publish({
        type: "RoleAssigned",
        aggregateId: assignment.id,
        aggregateType: "RoleAssignment",
        payload: {
          assignmentId: assignment.id,
          userId,
          roleId,
          expiresAt: assignment.expiresAt,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });

      return assignment;
    } catch (error) {
      console.error("[RoleService] Error assigning role to user:", error);
      throw error;
    }
  }

  /**
   * Revoke role from user
   */
  async revokeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      await prisma.roleAssignment.deleteMany({
        where: {
          userId,
          roleId,
          expiresAt: {
            gte: new Date(), // Only delete non-expired assignments
          },
        },
      });

      // Publish event
      await eventBus.publish({
        type: "RoleRevoked",
        aggregateId: userId,
        aggregateType: "User",
        payload: {
          userId,
          roleId,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[RoleService] Error revoking role from user:", error);
      throw error;
    }
  }

  /**
   * Get role templates
   */
  async getRoleTemplates(tenantId?: string): Promise<any[]> {
    try {
      const templates = await prisma.permissionTemplate.findMany({
        where: {
          ...(tenantId ? { tenantId } : { isSystemTemplate: true }),
        },
        orderBy: {
          usageCount: "desc",
        },
      });

      return templates;
    } catch (error) {
      console.error("[RoleService] Error getting role templates:", error);
      return [];
    }
  }

  /**
   * Create role template
   */
  async createRoleTemplate(input: {
    tenantId?: string;
    name: string;
    description?: string;
    permissions: HierarchicalPermission[];
    isSystemTemplate?: boolean;
    createdBy?: string;
  }): Promise<any> {
    try {
      const template = await prisma.permissionTemplate.create({
        data: {
          tenantId: input.tenantId || null,
          name: input.name,
          description: input.description,
          permissions: input.permissions as any,
          isSystemTemplate: input.isSystemTemplate || false,
          usageCount: 0,
          createdBy: input.createdBy,
        },
      });

      // Publish event
      await eventBus.publish({
        type: "RoleTemplateCreated",
        aggregateId: template.id,
        aggregateType: "PermissionTemplate",
        payload: {
          templateId: template.id,
          name: template.name,
        },
        metadata: {
          tenantId: template.tenantId,
          timestamp: new Date().toISOString(),
        },
      });

      return template;
    } catch (error) {
      console.error("[RoleService] Error creating role template:", error);
      throw error;
    }
  }

  /**
   * List roles for tenant
   */
  async listRoles(
    tenantId: string,
    filters?: {
      isSystemRole?: boolean;
      isActive?: boolean;
      parentRoleId?: string;
    },
  ): Promise<any[]> {
    try {
      const roles = await prisma.role.findMany({
        where: {
          tenantId,
          ...(filters?.isSystemRole !== undefined && {
            isSystemRole: filters.isSystemRole,
          }),
          ...(filters?.isActive !== undefined && {
            isActive: filters.isActive,
          }),
          ...(filters?.parentRoleId && { parentRoleId: filters.parentRoleId }),
        },
        include: {
          parentRole: true,
          childRoles: true,
        },
        orderBy: [{ isSystemRole: "desc" }, { displayName: "asc" }],
      });

      return roles;
    } catch (error) {
      console.error("[RoleService] Error listing roles:", error);
      return [];
    }
  }

  /**
   * Get user's active role assignments
   */
  async getUserRoleAssignments(userId: string): Promise<any[]> {
    try {
      const assignments = await prisma.roleAssignment.findMany({
        where: {
          userId,
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
        include: {
          role: true,
        },
        orderBy: {
          assignedAt: "desc",
        },
      });

      return assignments;
    } catch (error) {
      console.error(
        "[RoleService] Error getting user role assignments:",
        error,
      );
      return [];
    }
  }
}

// Export singleton instance
export const roleService = new RoleService();
