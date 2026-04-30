/**
 * 🛡️ PERMISSION VALIDATION SERVICE
 *
 * Intelligent permission validation that:
 * - Uses compliance engine to check feature health
 * - Validates tab-level permissions
 * - Prevents showing non-functional features
 * - Provides intelligent suggestions
 * - Real-time permission checking
 *
 * This is the MAIN service that pages should use to check permissions
 */

import { User, TabId, ModuleId, FeatureId } from "@/types/user";
import {
  intelligentComplianceEngine,
  TabComplianceResult,
} from "./intelligentComplianceEngine";

// ============================================================================
// TYPES
// ============================================================================

export interface PermissionCheckResult {
  allowed: boolean;
  canShow: boolean;
  canInteract: boolean;
  reason?: string;
  health?: {
    isFunctional: boolean;
    healthScore: number;
    reason?: string;
  };
  suggestions?: string[];
  requiredPermissions?: any[];
}

export interface TabPermissionCheck {
  tabId: TabId;
  result: PermissionCheckResult;
}

// ============================================================================
// PERMISSION VALIDATION SERVICE
// ============================================================================

class PermissionValidationService {
  /**
   * Check if user can access a tab
   * This is the MAIN function pages should use
   */
  async canAccessTab(
    user: User | null,
    tabId: TabId,
    context?: { customerId?: string; warehouseId?: string },
  ): Promise<PermissionCheckResult> {
    if (!user) {
      return {
        allowed: false,
        canShow: false,
        canInteract: false,
        reason: "User not authenticated",
      };
    }

    // Use intelligent compliance engine
    const compliance = await intelligentComplianceEngine.canShowTab(
      user,
      tabId,
      context,
    );

    return {
      allowed: compliance.canShow,
      canShow: compliance.canShow,
      canInteract: compliance.canInteract,
      reason: compliance.reason,
      health: {
        isFunctional: compliance.health.isFunctional,
        healthScore: compliance.health.healthScore,
        reason: compliance.health.reason,
      },
      suggestions: compliance.suggestions,
      requiredPermissions: compliance.requiredPermissions,
    };
  }

  /**
   * Check multiple tabs at once
   */
  async canAccessMultipleTabs(
    user: User | null,
    tabIds: TabId[],
    context?: { customerId?: string; warehouseId?: string },
  ): Promise<Map<TabId, PermissionCheckResult>> {
    if (!user) {
      const results = new Map<TabId, PermissionCheckResult>();
      tabIds.forEach((tabId) => {
        results.set(tabId, {
          allowed: false,
          canShow: false,
          canInteract: false,
          reason: "User not authenticated",
        });
      });
      return results;
    }

    const complianceResults =
      await intelligentComplianceEngine.checkMultipleTabs(
        user,
        tabIds,
        context,
      );

    const results = new Map<TabId, PermissionCheckResult>();
    complianceResults.forEach((compliance, tabId) => {
      results.set(tabId, {
        allowed: compliance.canShow,
        canShow: compliance.canShow,
        canInteract: compliance.canInteract,
        reason: compliance.reason,
        health: {
          isFunctional: compliance.health.isFunctional,
          healthScore: compliance.health.healthScore,
          reason: compliance.health.reason,
        },
        suggestions: compliance.suggestions,
        requiredPermissions: compliance.requiredPermissions,
      });
    });

    return results;
  }

  /**
   * Filter tabs based on permissions
   * Returns only tabs the user can access
   */
  async filterAccessibleTabs(
    user: User | null,
    tabIds: TabId[],
    context?: { customerId?: string; warehouseId?: string },
  ): Promise<TabId[]> {
    if (!user) return [];

    return intelligentComplianceEngine.filterTabs(user, tabIds, context);
  }

  /**
   * Check if user has module access
   */
  async hasModuleAccess(
    user: User | null,
    moduleId: ModuleId,
    context?: { customerId?: string; warehouseId?: string },
  ): Promise<boolean> {
    if (!user) return false;

    // Check using compliance engine
    // Create a dummy tabId for the module
    const tabId = `${moduleId}.overview` as TabId;
    const result = await this.canAccessTab(user, tabId, context);
    return result.allowed;
  }

  /**
   * Check if user has feature access
   */
  async hasFeatureAccess(
    user: User | null,
    featureId: FeatureId,
    context?: { customerId?: string; warehouseId?: string },
  ): Promise<boolean> {
    if (!user) return false;

    // Check using compliance engine
    const tabId = `${featureId}.overview` as TabId;
    const result = await this.canAccessTab(user, tabId, context);
    return result.allowed;
  }

  /**
   * Get all accessible tabs for a module
   */
  async getAccessibleTabsForModule(
    user: User | null,
    moduleId: ModuleId,
    allTabIds: TabId[],
    context?: { customerId?: string; warehouseId?: string },
  ): Promise<TabId[]> {
    if (!user) return [];

    // Filter tabs that belong to this module
    const moduleTabs = allTabIds.filter((tabId) =>
      tabId.startsWith(`${moduleId}.`),
    );

    return this.filterAccessibleTabs(user, moduleTabs, context);
  }

  /**
   * Get all accessible tabs for a feature
   */
  async getAccessibleTabsForFeature(
    user: User | null,
    featureId: FeatureId,
    allTabIds: TabId[],
    context?: { customerId?: string; warehouseId?: string },
  ): Promise<TabId[]> {
    if (!user) return [];

    // Filter tabs that belong to this feature
    const featureTabs = allTabIds.filter((tabId) =>
      tabId.startsWith(`${featureId}.`),
    );

    return this.filterAccessibleTabs(user, featureTabs, context);
  }

  /**
   * Check if a feature is functional (not just permission check)
   */
  async isFeatureFunctional(
    moduleId: ModuleId,
    featureId?: FeatureId,
    tabId?: TabId,
  ): Promise<boolean> {
    // Create a dummy user for health check
    const dummyUser = {
      id: "system",
      email: "system@system",
      name: "System",
      role: "SYSTEM_ADMIN" as const,
      status: "ACTIVE" as const,
      tenantId: "system",
      permissions: [],
      hierarchicalPermissions: {},
      moduleAccess: {},
      featureAccess: {},
      tabAccess: {},
      preferences: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await intelligentComplianceEngine.canShowTab(
      dummyUser,
      `${moduleId}${featureId ? `.${featureId}` : ""}${tabId ? `.${tabId}` : ""}` as TabId,
    );
    return result.health.isFunctional;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const permissionValidationService = new PermissionValidationService();

// Convenience exports
export const canAccessTab = (user: User | null, tabId: TabId, context?: any) =>
  permissionValidationService.canAccessTab(user, tabId, context);

export const filterAccessibleTabs = (
  user: User | null,
  tabIds: TabId[],
  context?: any,
) => permissionValidationService.filterAccessibleTabs(user, tabIds, context);
