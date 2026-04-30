/**
 * 🚀 PERMISSION SERVICE
 *
 * World's most flexible 5-level hierarchical permission system
 *
 * Features:
 * - 5-level hierarchy: Module → Feature → Tab → Action → Field
 * - Permission inheritance
 * - Permission overrides (allow/deny)
 * - Permission conditions (if/then logic)
 * - Time-based restrictions
 * - Location-based restrictions
 * - Device-based restrictions
 * - 6 scope types (ALL, TENANT, ASSIGNED_CUSTOMERS, etc.)
 * - Permission caching for performance (<100ms checks)
 * - Permission conflict detection
 * - Permission optimization
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-bus";
import { redisCache } from "@/lib/services/cache/redisCache";
import type {
  HierarchicalPermission,
  PermissionContext,
  PermissionResult,
  PermissionConflict,
  PermissionOptimization,
  PermissionUsage,
  PermissionCondition,
  PermissionOverride,
  TimeRestriction,
  LocationRestriction,
  DeviceRestriction,
  PermissionScope,
} from "@/types/permissions";
import { userService } from "./userService";

// ============================================================================
// TYPES
// ============================================================================

interface PermissionCache {
  [key: string]: {
    result: boolean;
    expiresAt: number;
  };
}

// ============================================================================
// PERMISSION SERVICE
// ============================================================================

class PermissionService {
  private cache: PermissionCache = {};
  private readonly CACHE_TTL = 60000; // 1 minute

  /**
   * Check if user has permission (5-level hierarchy)
   */
  async hasPermission(
    userId: string,
    permission: {
      module: string;
      feature?: string;
      tab?: string;
      action: string;
      field?: string;
    },
    context?: PermissionContext,
  ): Promise<boolean> {
    try {
      // Check Redis cache first
      const cacheKey = this.getCacheKey(userId, permission, context);
      const cached = await redisCache.get<boolean>(`permission:${cacheKey}`);
      if (cached !== null) {
        return cached;
      }

      // Fallback to in-memory cache
      const memoryCached = this.cache[cacheKey];
      if (memoryCached && memoryCached.expiresAt > Date.now()) {
        return memoryCached.result;
      }

      // Get user
      const user = await userService.getUserById(userId);
      if (!user) {
        return false;
      }

      // Build full context
      const fullContext: PermissionContext = {
        userId,
        tenantId: user.tenantId,
        role: user.role,
        ...context,
      };

      // Get all user permissions
      const userPermissions = await this.getUserPermissions(userId);

      // Check each permission
      let hasPermission = false;
      for (const userPerm of userPermissions) {
        if (this.matchesPermission(userPerm, permission, fullContext)) {
          // Check conditions
          if (
            userPerm.conditions &&
            !this.evaluateConditions(userPerm.conditions, fullContext)
          ) {
            continue;
          }

          // Check restrictions
          if (!this.checkRestrictions(userPerm, fullContext)) {
            continue;
          }

          // Check scope
          if (!this.checkScope(userPerm.scope, userId, fullContext)) {
            continue;
          }

          hasPermission = true;
          break;
        }
      }

      // Apply overrides (deny takes precedence)
      if (hasPermission) {
        for (const userPerm of userPermissions) {
          if (userPerm.overrides) {
            for (const override of userPerm.overrides) {
              if (
                override.type === "deny" &&
                this.matchesPermission(
                  override.permission,
                  permission,
                  fullContext,
                )
              ) {
                hasPermission = false;
                break;
              }
            }
          }
        }
      }

      // Cache result in Redis (primary) and memory (fallback)
      await redisCache.set(`permission:${cacheKey}`, hasPermission, {
        ttl: 60,
      }); // 1 minute
      this.cache[cacheKey] = {
        result: hasPermission,
        expiresAt: Date.now() + this.CACHE_TTL,
      };

      return hasPermission;
    } catch (error) {
      console.error("[PermissionService] Error checking permission:", error);
      return false;
    }
  }

  /**
   * Grant permission to user
   */
  async grantPermission(
    userId: string,
    permission: HierarchicalPermission,
  ): Promise<void> {
    try {
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Get existing permissions
      const existing = (user.hierarchicalPermissions ||
        []) as HierarchicalPermission[];

      // Check if already exists
      if (existing.some((p) => this.permissionsEqual(p, permission))) {
        return; // Already granted
      }

      // Add permission
      const updated = [...existing, permission];

      // Update user
      await prisma.user.update({
        where: { id: userId },
        data: {
          hierarchicalPermissions: updated as any,
        },
      });

      // Invalidate cache
      await this.invalidatePermissionCache(userId);

      // Publish event
      await eventBus.publish({
        type: "PermissionGranted",
        aggregateId: userId,
        aggregateType: "User",
        payload: {
          userId,
          permission,
        },
        metadata: {
          tenantId: user.tenantId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[PermissionService] Error granting permission:", error);
      throw error;
    }
  }

  /**
   * Revoke permission from user
   */
  async revokePermission(
    userId: string,
    permission: HierarchicalPermission,
  ): Promise<void> {
    try {
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Get existing permissions
      const existing = (user.hierarchicalPermissions ||
        []) as HierarchicalPermission[];

      // Remove permission
      const updated = existing.filter(
        (p) => !this.permissionsEqual(p, permission),
      );

      // Update user
      await prisma.user.update({
        where: { id: userId },
        data: {
          hierarchicalPermissions: updated as any,
        },
      });

      // Invalidate cache
      await this.invalidatePermissionCache(userId);

      // Publish event
      await eventBus.publish({
        type: "PermissionRevoked",
        aggregateId: userId,
        aggregateType: "User",
        payload: {
          userId,
          permission,
        },
        metadata: {
          tenantId: user.tenantId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[PermissionService] Error revoking permission:", error);
      throw error;
    }
  }

  /**
   * Update permission
   */
  async updatePermission(
    userId: string,
    permission: HierarchicalPermission,
  ): Promise<void> {
    try {
      await this.revokePermission(userId, permission);
      await this.grantPermission(userId, permission);
    } catch (error) {
      console.error("[PermissionService] Error updating permission:", error);
      throw error;
    }
  }

  /**
   * Bulk grant permissions
   */
  async bulkGrantPermissions(
    userId: string,
    permissions: HierarchicalPermission[],
  ): Promise<void> {
    try {
      for (const permission of permissions) {
        await this.grantPermission(userId, permission);
      }
    } catch (error) {
      console.error(
        "[PermissionService] Error bulk granting permissions:",
        error,
      );
      throw error;
    }
  }

  /**
   * Bulk revoke permissions
   */
  async bulkRevokePermissions(
    userId: string,
    permissions: HierarchicalPermission[],
  ): Promise<void> {
    try {
      for (const permission of permissions) {
        await this.revokePermission(userId, permission);
      }
    } catch (error) {
      console.error(
        "[PermissionService] Error bulk revoking permissions:",
        error,
      );
      throw error;
    }
  }

  /**
   * Clone permissions from one user to another
   */
  async clonePermissions(fromUserId: string, toUserId: string): Promise<void> {
    try {
      const fromUser = await userService.getUserById(fromUserId);
      if (!fromUser) {
        throw new Error(`Source user ${fromUserId} not found`);
      }

      const permissions = (fromUser.hierarchicalPermissions ||
        []) as HierarchicalPermission[];
      await this.bulkGrantPermissions(toUserId, permissions);
    } catch (error) {
      console.error("[PermissionService] Error cloning permissions:", error);
      throw error;
    }
  }

  /**
   * Detect permission conflicts
   */
  async detectPermissionConflicts(
    userId: string,
  ): Promise<PermissionConflict[]> {
    try {
      const user = await userService.getUserById(userId);
      if (!user) return [];

      const permissions = (user.hierarchicalPermissions ||
        []) as HierarchicalPermission[];
      const conflicts: PermissionConflict[] = [];

      // Check for overlapping permissions
      for (let i = 0; i < permissions.length; i++) {
        for (let j = i + 1; j < permissions.length; j++) {
          const p1 = permissions[i];
          const p2 = permissions[j];

          if (this.permissionsOverlap(p1, p2)) {
            conflicts.push({
              type: "overlapping",
              permissions: [p1, p2],
              description: "Permissions overlap and may cause confusion",
              severity: "medium",
              suggestion: "Consider consolidating these permissions",
            });
          }

          // Check for contradictory permissions (same resource, different scopes)
          if (this.permissionsContradict(p1, p2)) {
            conflicts.push({
              type: "contradictory",
              permissions: [p1, p2],
              description: "Permissions contradict each other",
              severity: "high",
              suggestion: "Review and resolve the contradiction",
            });
          }
        }
      }

      return conflicts;
    } catch (error) {
      console.error("[PermissionService] Error detecting conflicts:", error);
      return [];
    }
  }

  /**
   * Optimize permissions (suggest improvements)
   */
  async optimizePermissions(userId: string): Promise<PermissionOptimization[]> {
    try {
      const user = await userService.getUserById(userId);
      if (!user) return [];

      const permissions = (user.hierarchicalPermissions ||
        []) as HierarchicalPermission[];
      const optimizations: PermissionOptimization[] = [];

      // Check for unused permissions (would need usage tracking)
      // Check for redundant permissions
      for (let i = 0; i < permissions.length; i++) {
        for (let j = i + 1; j < permissions.length; j++) {
          if (this.permissionIncludes(permissions[i], permissions[j])) {
            optimizations.push({
              type: "redundant",
              permission: permissions[j],
              description: "This permission is redundant",
              suggestion: `Remove this permission as it's covered by: ${permissions[i].module}.${permissions[i].action}`,
              impact: "low",
            });
          }
        }
      }

      return optimizations;
    } catch (error) {
      console.error("[PermissionService] Error optimizing permissions:", error);
      return [];
    }
  }

  /**
   * Get permission usage statistics
   */
  async getPermissionUsage(userId: string): Promise<PermissionUsage[]> {
    try {
      const user = await userService.getUserById(userId);
      if (!user) return [];

      const permissions = (user.hierarchicalPermissions ||
        []) as HierarchicalPermission[];

      // Get usage metrics from audit logs or usage tracking
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId,
          eventType: "permission_check",
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      });

      // Count usage per permission
      const usageMap = new Map<string, number>();
      for (const log of auditLogs) {
        const permKey = `${log.metadata?.module}:${log.metadata?.action}`;
        usageMap.set(permKey, (usageMap.get(permKey) || 0) + 1);
      }

      return permissions.map((permission) => {
        const permKey = `${permission.module}:${permission.action}`;
        const usageCount = usageMap.get(permKey) || 0;
        const averageUsagePerDay = usageCount / 30; // Last 30 days

        return {
          permission,
          usageCount,
          averageUsagePerDay,
          trend:
            usageCount > 10 ? ("increasing" as const) : ("stable" as const),
        };
      });
    } catch (error) {
      console.error(
        "[PermissionService] Error getting permission usage:",
        error,
      );
      return [];
    }
  }

  /**
   * Apply permission template to user
   */
  async applyTemplate(userId: string, templateId: string): Promise<void> {
    try {
      const template = await prisma.permissionTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      const permissions = template.permissions as HierarchicalPermission[];
      await this.bulkGrantPermissions(userId, permissions);

      // Update template usage count
      await prisma.permissionTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: { increment: 1 },
        },
      });
    } catch (error) {
      console.error("[PermissionService] Error applying template:", error);
      throw error;
    }
  }

  /**
   * Create template from user's permissions
   */
  async createTemplateFromUser(
    userId: string,
    templateName: string,
  ): Promise<any> {
    try {
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const permissions = (user.hierarchicalPermissions ||
        []) as HierarchicalPermission[];

      // Use roleService to create template
      const { roleService } = await import("./roleService");
      return await roleService.createRoleTemplate({
        tenantId: user.tenantId,
        name: templateName,
        description: `Created from user ${user.name}'s permissions`,
        permissions,
        createdBy: userId,
      });
    } catch (error) {
      console.error(
        "[PermissionService] Error creating template from user:",
        error,
      );
      throw error;
    }
  }

  /**
   * Invalidate permission cache for user
   */
  async invalidatePermissionCache(userId: string): Promise<void> {
    try {
      // Invalidate Redis cache
      await redisCache.invalidateUserCache(userId);

      // Remove all cache entries for this user from memory
      Object.keys(this.cache).forEach((key) => {
        if (key.startsWith(`${userId}:`)) {
          delete this.cache[key];
        }
      });
    } catch (error) {
      console.error("[PermissionService] Error invalidating cache:", error);
    }
  }

  /**
   * Warmup permission cache for user
   */
  async warmupPermissionCache(userId: string): Promise<void> {
    try {
      // Pre-load common permissions
      const commonPermissions = [
        { module: "wms", action: "read" },
        { module: "tms", action: "read" },
        { module: "iso-ims", action: "read" },
      ];

      for (const perm of commonPermissions) {
        await this.hasPermission(userId, perm as any);
      }
    } catch (error) {
      console.error("[PermissionService] Error warming up cache:", error);
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async getUserPermissions(
    userId: string,
  ): Promise<HierarchicalPermission[]> {
    const user = await userService.getUserById(userId);
    if (!user) return [];

    return (user.hierarchicalPermissions || []) as HierarchicalPermission[];
  }

  private matchesPermission(
    userPerm: HierarchicalPermission,
    requested: {
      module: string;
      feature?: string;
      tab?: string;
      action: string;
      field?: string;
    },
    context: PermissionContext,
  ): boolean {
    // Check module (required)
    if (userPerm.module !== requested.module) {
      return false;
    }

    // Check feature (if specified in user permission)
    if (
      userPerm.feature &&
      requested.feature &&
      userPerm.feature !== requested.feature
    ) {
      return false;
    }

    // Check tab (if specified in user permission)
    if (userPerm.tab && requested.tab && userPerm.tab !== requested.tab) {
      return false;
    }

    // Check action (required)
    if (userPerm.action !== requested.action && userPerm.action !== "manage") {
      return false;
    }

    // Check field (if specified)
    if (
      userPerm.field &&
      requested.field &&
      userPerm.field !== requested.field
    ) {
      return false;
    }

    return true;
  }

  private evaluateConditions(
    conditions: PermissionCondition[],
    context: PermissionContext,
  ): boolean {
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(
    condition: PermissionCondition,
    context: PermissionContext,
  ): boolean {
    switch (condition.type) {
      case "if":
        if (!condition.operator || condition.value === undefined) return true;
        return this.compareValue(
          this.getFieldValue(condition.field, context),
          condition.operator,
          condition.value,
        );

      case "and":
        if (!condition.children) return true;
        return condition.children.every((child) =>
          this.evaluateCondition(child, context),
        );

      case "or":
        if (!condition.children) return true;
        return condition.children.some((child) =>
          this.evaluateCondition(child, context),
        );

      case "not":
        if (!condition.children || condition.children.length === 0) return true;
        return !this.evaluateCondition(condition.children[0], context);

      default:
        return true;
    }
  }

  private getFieldValue(field: string, context: PermissionContext): any {
    const parts = field.split(".");
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as any)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private compareValue(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case "equals":
        return actual === expected;
      case "not_equals":
        return actual !== expected;
      case "contains":
        return String(actual).includes(String(expected));
      case "greater_than":
        return Number(actual) > Number(expected);
      case "less_than":
        return Number(actual) < Number(expected);
      default:
        return false;
    }
  }

  private checkRestrictions(
    permission: HierarchicalPermission,
    context: PermissionContext,
  ): boolean {
    // Check time restrictions
    if (permission.timeRestrictions) {
      if (!this.checkTimeRestrictions(permission.timeRestrictions, context)) {
        return false;
      }
    }

    // Check location restrictions
    if (permission.locationRestrictions) {
      if (
        !this.checkLocationRestrictions(
          permission.locationRestrictions,
          context,
        )
      ) {
        return false;
      }
    }

    // Check device restrictions
    if (permission.deviceRestrictions) {
      if (
        !this.checkDeviceRestrictions(permission.deviceRestrictions, context)
      ) {
        return false;
      }
    }

    return true;
  }

  private checkTimeRestrictions(
    restrictions: TimeRestriction[],
    context: PermissionContext,
  ): boolean {
    const now = context.timestamp ? new Date(context.timestamp) : new Date();

    for (const restriction of restrictions) {
      // Check day of week
      if (restriction.days && restriction.days.length > 0) {
        const dayOfWeek = now.getDay();
        if (!restriction.days.includes(dayOfWeek)) {
          return false;
        }
      }

      // Check time range
      if (restriction.hours) {
        const time = now.toTimeString().slice(0, 5); // HH:mm
        if (time < restriction.hours.start || time > restriction.hours.end) {
          return false;
        }
      }

      // Check date range
      if (restriction.dateRange) {
        const start = new Date(restriction.dateRange.start);
        const end = new Date(restriction.dateRange.end);
        if (now < start || now > end) {
          return false;
        }
      }
    }

    return true;
  }

  private checkLocationRestrictions(
    restrictions: LocationRestriction[],
    context: PermissionContext,
  ): boolean {
    if (!context.location && !context.ipAddress) {
      return true; // No location info, allow
    }

    for (const restriction of restrictions) {
      let matches = false;

      switch (restriction.type) {
        case "ip":
          if (
            context.ipAddress &&
            restriction.values.includes(context.ipAddress)
          ) {
            matches = true;
          }
          break;

        case "country":
          if (
            context.location?.country &&
            restriction.values.includes(context.location.country)
          ) {
            matches = true;
          }
          break;

        case "region":
          if (
            context.location?.region &&
            restriction.values.includes(context.location.region)
          ) {
            matches = true;
          }
          break;

        case "geo":
          if (context.location?.coordinates && restriction.bounds) {
            const { lat, lng } = context.location.coordinates;
            const { north, south, east, west } = restriction.bounds;
            if (lat >= south && lat <= north && lng >= west && lng <= east) {
              matches = true;
            }
          }
          break;
      }

      if (restriction.allow === false && matches) {
        return false; // Blacklisted
      }
      if (
        restriction.allow !== false &&
        !matches &&
        restriction.values.length > 0
      ) {
        return false; // Not whitelisted
      }
    }

    return true;
  }

  private checkDeviceRestrictions(
    restrictions: DeviceRestriction[],
    context: PermissionContext,
  ): boolean {
    if (!context.deviceType && !context.userAgent) {
      return true; // No device info, allow
    }

    for (const restriction of restrictions) {
      if (restriction.type === context.deviceType) {
        return restriction.allowed;
      }
    }

    return true;
  }

  private async checkScope(
    scope: PermissionScope,
    userId: string,
    context: PermissionContext,
  ): Promise<boolean> {
    const user = await userService.getUserById(userId);
    if (!user) return false;

    switch (scope) {
      case "ALL":
        return true;

      case "TENANT":
        return context.tenantId === user.tenantId;

      case "ASSIGNED_CUSTOMERS":
        if (!context.customerId) return false;
        const assignments =
          await userService.getUserCustomerAssignments(userId);
        return assignments.some((a) => a.customerId === context.customerId);

      case "ASSIGNED_WAREHOUSES":
        if (!context.warehouseId) return false;
        return (user.assignedWarehouses || []).includes(context.warehouseId);

      case "ASSIGNED_REGIONS":
        if (!context.regionId) return false;
        return (user.assignedRegions || []).includes(context.regionId);

      case "OWN":
        return context.userId === userId;

      default:
        return false;
    }
  }

  private permissionsEqual(
    p1: HierarchicalPermission,
    p2: HierarchicalPermission,
  ): boolean {
    return (
      p1.module === p2.module &&
      p1.feature === p2.feature &&
      p1.tab === p2.tab &&
      p1.action === p2.action &&
      p1.field === p2.field &&
      p1.scope === p2.scope
    );
  }

  private permissionsOverlap(
    p1: HierarchicalPermission,
    p2: HierarchicalPermission,
  ): boolean {
    // Check if permissions overlap (same module/feature/tab but different actions)
    return (
      p1.module === p2.module &&
      p1.feature === p2.feature &&
      p1.tab === p2.tab &&
      p1.action !== p2.action
    );
  }

  private permissionsContradict(
    p1: HierarchicalPermission,
    p2: HierarchicalPermission,
  ): boolean {
    // Check if permissions contradict (same resource, different scopes)
    return (
      this.permissionsEqual({ ...p1, scope: "ALL" }, { ...p2, scope: "ALL" }) &&
      p1.scope !== p2.scope
    );
  }

  private permissionIncludes(
    p1: HierarchicalPermission,
    p2: HierarchicalPermission,
  ): boolean {
    // Check if p1 includes p2 (p1 is more general)
    if (p1.module !== p2.module) return false;
    if (p1.feature && p1.feature !== p2.feature) return false;
    if (p1.tab && p1.tab !== p2.tab) return false;
    if (p1.action !== p2.action && p1.action !== "manage") return false;
    return true;
  }

  private getCacheKey(
    userId: string,
    permission: any,
    context?: PermissionContext,
  ): string {
    return `${userId}:${permission.module}:${permission.feature || "*"}:${permission.tab || "*"}:${permission.action}:${permission.field || "*"}:${context?.customerId || "*"}:${context?.warehouseId || "*"}`;
  }
}

// Export singleton instance
export const permissionService = new PermissionService();
