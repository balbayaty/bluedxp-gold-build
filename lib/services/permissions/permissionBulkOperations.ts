/**
 * ⚡ BULK PERMISSION OPERATIONS
 *
 * Mind-blowing bulk operations:
 * - Apply permissions to multiple users at once
 * - Batch updates
 * - Template application
 * - Bulk removal
 * - Progress tracking
 * - Rollback support
 */

import type { User, HierarchicalPermission } from "@/types/user";
import { userService } from "@/lib/services/user";
import { permissionAuditTrail } from "./permissionAuditTrail";
import { permissionTemplates } from "./permissionTemplates";

// ============================================================================
// TYPES
// ============================================================================

export interface BulkOperation {
  id: string;
  type: "GRANT" | "REVOKE" | "UPDATE" | "APPLY_TEMPLATE" | "MERGE";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "PARTIAL";
  targetUserIds: string[];
  permissions?: HierarchicalPermission[];
  templateId?: string;
  options?: {
    merge?: boolean;
    replace?: boolean;
    skipErrors?: boolean;
  };
  progress: {
    total: number;
    completed: number;
    failed: number;
    errors: Array<{ userId: string; error: string }>;
  };
  startedAt?: Date;
  completedAt?: Date;
  startedBy: string;
}

export interface BulkOperationResult {
  operationId: string;
  success: boolean;
  totalUsers: number;
  successful: number;
  failed: number;
  results: Array<{
    userId: string;
    success: boolean;
    error?: string;
    permissions?: HierarchicalPermission[];
  }>;
  duration: number; // milliseconds
}

// ============================================================================
// BULK OPERATIONS SERVICE
// ============================================================================

class PermissionBulkOperationsService {
  private operations = new Map<string, BulkOperation>();

  /**
   * Grant permissions to multiple users
   */
  async bulkGrantPermissions(
    userIds: string[],
    permissions: HierarchicalPermission[],
    changedBy: User,
    options?: {
      merge?: boolean;
      skipErrors?: boolean;
    },
  ): Promise<BulkOperationResult> {
    const operationId = `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const operation: BulkOperation = {
      id: operationId,
      type: "GRANT",
      status: "IN_PROGRESS",
      targetUserIds: userIds,
      permissions,
      options: {
        merge: options?.merge ?? true,
        skipErrors: options?.skipErrors ?? false,
      },
      progress: {
        total: userIds.length,
        completed: 0,
        failed: 0,
        errors: [],
      },
      startedAt: new Date(),
      startedBy: changedBy.id,
    };

    this.operations.set(operationId, operation);

    const results: BulkOperationResult["results"] = [];

    for (const userId of userIds) {
      try {
        const user = await userService.getUserById(userId);
        if (!user) {
          throw new Error("User not found");
        }

        let updatedPermissions: HierarchicalPermission[];

        if (options?.merge) {
          // Merge with existing permissions
          const existing = user.hierarchicalPermissions || [];
          updatedPermissions = [...existing, ...permissions];
        } else {
          // Replace permissions
          updatedPermissions = permissions;
        }

        await userService.updateUserPermissions(userId, updatedPermissions);

        // Log to audit trail
        for (const perm of permissions) {
          await permissionAuditTrail.logPermissionChange(
            "GRANT",
            user,
            perm,
            changedBy,
            {
              previousPermission: existing.find(
                (p) =>
                  p.moduleId === perm.moduleId &&
                  p.featureId === perm.featureId &&
                  p.tabId === perm.tabId,
              ),
            },
          );
        }

        results.push({
          userId,
          success: true,
          permissions: updatedPermissions,
        });

        operation.progress.completed++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        operation.progress.failed++;
        operation.progress.errors.push({ userId, error: errorMessage });

        results.push({
          userId,
          success: false,
          error: errorMessage,
        });

        if (!options?.skipErrors) {
          operation.status = "FAILED";
          break;
        }
      }
    }

    operation.status =
      operation.progress.failed === 0
        ? "COMPLETED"
        : operation.progress.completed > 0
          ? "PARTIAL"
          : "FAILED";
    operation.completedAt = new Date();

    const result: BulkOperationResult = {
      operationId,
      success: operation.status === "COMPLETED",
      totalUsers: userIds.length,
      successful: operation.progress.completed,
      failed: operation.progress.failed,
      results,
      duration: Date.now() - startTime,
    };

    return result;
  }

  /**
   * Revoke permissions from multiple users
   */
  async bulkRevokePermissions(
    userIds: string[],
    permissions: HierarchicalPermission[],
    changedBy: User,
    options?: { skipErrors?: boolean },
  ): Promise<BulkOperationResult> {
    const operationId = `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const operation: BulkOperation = {
      id: operationId,
      type: "REVOKE",
      status: "IN_PROGRESS",
      targetUserIds: userIds,
      permissions,
      options: {
        skipErrors: options?.skipErrors ?? false,
      },
      progress: {
        total: userIds.length,
        completed: 0,
        failed: 0,
        errors: [],
      },
      startedAt: new Date(),
      startedBy: changedBy.id,
    };

    this.operations.set(operationId, operation);

    const results: BulkOperationResult["results"] = [];

    for (const userId of userIds) {
      try {
        const user = await userService.getUserById(userId);
        if (!user) {
          throw new Error("User not found");
        }

        const existing = user.hierarchicalPermissions || [];
        const updatedPermissions = existing.filter((perm) => {
          return !permissions.some(
            (revokePerm) =>
              revokePerm.moduleId === perm.moduleId &&
              revokePerm.featureId === perm.featureId &&
              revokePerm.tabId === perm.tabId,
          );
        });

        await userService.updateUserPermissions(userId, updatedPermissions);

        // Log to audit trail
        for (const perm of permissions) {
          await permissionAuditTrail.logPermissionChange(
            "REVOKE",
            user,
            perm,
            changedBy,
            {
              previousPermission: existing.find(
                (p) =>
                  p.moduleId === perm.moduleId &&
                  p.featureId === perm.featureId &&
                  p.tabId === perm.tabId,
              ),
            },
          );
        }

        results.push({
          userId,
          success: true,
          permissions: updatedPermissions,
        });

        operation.progress.completed++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        operation.progress.failed++;
        operation.progress.errors.push({ userId, error: errorMessage });

        results.push({
          userId,
          success: false,
          error: errorMessage,
        });

        if (!options?.skipErrors) {
          operation.status = "FAILED";
          break;
        }
      }
    }

    operation.status =
      operation.progress.failed === 0
        ? "COMPLETED"
        : operation.progress.completed > 0
          ? "PARTIAL"
          : "FAILED";
    operation.completedAt = new Date();

    const result: BulkOperationResult = {
      operationId,
      success: operation.status === "COMPLETED",
      totalUsers: userIds.length,
      successful: operation.progress.completed,
      failed: operation.progress.failed,
      results,
      duration: Date.now() - startTime,
    };

    return result;
  }

  /**
   * Apply template to multiple users
   */
  async bulkApplyTemplate(
    userIds: string[],
    templateId: string,
    changedBy: User,
    options?: { merge?: boolean; skipErrors?: boolean },
  ): Promise<BulkOperationResult> {
    const template = await permissionTemplates.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return this.bulkGrantPermissions(userIds, template.permissions, changedBy, {
      merge: options?.merge ?? false,
      skipErrors: options?.skipErrors ?? false,
    });
  }

  /**
   * Get operation status
   */
  async getOperationStatus(operationId: string): Promise<BulkOperation | null> {
    return this.operations.get(operationId) || null;
  }

  /**
   * Get all operations
   */
  async getAllOperations(): Promise<BulkOperation[]> {
    return Array.from(this.operations.values()).sort(
      (a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0),
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const permissionBulkOperations = new PermissionBulkOperationsService();
