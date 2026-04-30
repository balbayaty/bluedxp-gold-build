/**
 * 📚 PERMISSION VERSIONING SYSTEM
 *
 * Mind-blowing versioning capabilities:
 * - Permission version history
 * - Version comparison
 * - Rollback to any version
 * - Version diff visualization
 * - Change tracking
 * - Version tags
 */

import type { User, HierarchicalPermission } from "@/types/user";
import { userService } from "@/lib/services/user";

// ============================================================================
// TYPES
// ============================================================================

export interface PermissionVersion {
  id: string;
  userId: string;
  version: number;
  permissions: HierarchicalPermission[];
  createdAt: Date;
  createdBy: string;
  tag?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface VersionDiff {
  added: HierarchicalPermission[];
  removed: HierarchicalPermission[];
  modified: Array<{
    before: HierarchicalPermission;
    after: HierarchicalPermission;
  }>;
}

// ============================================================================
// VERSIONING SERVICE
// ============================================================================

class PermissionVersioningService {
  private versions = new Map<string, PermissionVersion[]>();

  /**
   * Create version snapshot
   */
  async createVersion(
    user: User,
    createdBy: User,
    tag?: string,
    description?: string,
  ): Promise<PermissionVersion> {
    const userVersions = this.versions.get(user.id) || [];
    const nextVersion = userVersions.length + 1;

    const version: PermissionVersion = {
      id: `version-${user.id}-${nextVersion}`,
      userId: user.id,
      version: nextVersion,
      permissions: [...(user.hierarchicalPermissions || [])],
      createdAt: new Date(),
      createdBy: createdBy.id,
      tag,
      description,
    };

    userVersions.push(version);
    this.versions.set(user.id, userVersions);

    return version;
  }

  /**
   * Get version history
   */
  async getVersionHistory(userId: string): Promise<PermissionVersion[]> {
    return this.versions.get(userId) || [];
  }

  /**
   * Get specific version
   */
  async getVersion(
    userId: string,
    version: number,
  ): Promise<PermissionVersion | null> {
    const history = this.versions.get(userId) || [];
    return history.find((v) => v.version === version) || null;
  }

  /**
   * Compare versions
   */
  async compareVersions(
    userId: string,
    version1: number,
    version2: number,
  ): Promise<VersionDiff> {
    const v1 = await this.getVersion(userId, version1);
    const v2 = await this.getVersion(userId, version2);

    if (!v1 || !v2) {
      throw new Error("One or both versions not found");
    }

    const added: HierarchicalPermission[] = [];
    const removed: HierarchicalPermission[] = [];
    const modified: VersionDiff["modified"] = [];

    // Find added
    v2.permissions.forEach((perm2) => {
      const exists = v1.permissions.some((perm1) =>
        this.permissionsEqual(perm1, perm2),
      );
      if (!exists) {
        added.push(perm2);
      }
    });

    // Find removed
    v1.permissions.forEach((perm1) => {
      const exists = v2.permissions.some((perm2) =>
        this.permissionsEqual(perm1, perm2),
      );
      if (!exists) {
        removed.push(perm1);
      }
    });

    // Find modified
    v1.permissions.forEach((perm1) => {
      const perm2 = v2.permissions.find(
        (p) =>
          p.moduleId === perm1.moduleId &&
          p.featureId === perm1.featureId &&
          p.tabId === perm1.tabId,
      );
      if (perm2 && !this.permissionsEqual(perm1, perm2)) {
        modified.push({ before: perm1, after: perm2 });
      }
    });

    return { added, removed, modified };
  }

  /**
   * Rollback to version
   */
  async rollbackToVersion(
    userId: string,
    version: number,
    rolledBackBy: User,
  ): Promise<PermissionVersion> {
    const targetVersion = await this.getVersion(userId, version);
    if (!targetVersion) {
      throw new Error(`Version ${version} not found`);
    }

    // Create new version with rolled back permissions
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const rollbackVersion = await this.createVersion(
      { ...user, hierarchicalPermissions: targetVersion.permissions },
      rolledBackBy,
      `rollback-${version}`,
      `Rolled back to version ${version}`,
    );

    // Apply rollback
    await userService.updateUserPermissions(userId, targetVersion.permissions);

    return rollbackVersion;
  }

  /**
   * Check if permissions are equal
   */
  private permissionsEqual(
    p1: HierarchicalPermission,
    p2: HierarchicalPermission,
  ): boolean {
    return (
      p1.moduleId === p2.moduleId &&
      p1.featureId === p2.featureId &&
      p1.tabId === p2.tabId &&
      p1.moduleAccess === p2.moduleAccess &&
      p1.featureAccess === p2.featureAccess &&
      p1.tabAccess === p2.tabAccess
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const permissionVersioning = new PermissionVersioningService();
