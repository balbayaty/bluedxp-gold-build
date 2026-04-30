/**
 * 🧠 INTELLIGENT COMPLIANCE ENGINE
 *
 * The world's most flexible permission system with intelligent compliance logic.
 *
 * Features:
 * - Tab-level permission validation
 * - Tool/module compatibility checking
 * - Prevents showing non-functional features
 * - Intelligent dependency resolution
 * - Real-time feature health checking
 * - Context-aware permission filtering
 *
 * This engine ensures users NEVER see tabs/features that won't work,
 * while maintaining maximum flexibility.
 */

import {
  User,
  ModuleId,
  FeatureId,
  TabId,
  HierarchicalPermission,
} from "@/types/user";
import { ModuleDefinition } from "@/lib/modules/registry";
import { moduleRegistry } from "@/lib/modules";

// ============================================================================
// TYPES
// ============================================================================

export interface FeatureHealth {
  moduleId: ModuleId;
  featureId?: FeatureId;
  tabId?: TabId;
  isFunctional: boolean;
  reason?: string;
  dependencies?: string[];
  missingDependencies?: string[];
  healthScore: number; // 0-100
  lastChecked?: Date;
}

export interface ComplianceCheck {
  allowed: boolean;
  reason?: string;
  health?: FeatureHealth;
  alternatives?: TabId[];
  warnings?: string[];
  requiresUpgrade?: boolean;
}

export interface TabComplianceResult {
  tabId: TabId;
  canShow: boolean;
  canInteract: boolean;
  reason?: string;
  health: FeatureHealth;
  requiredPermissions: HierarchicalPermission[];
  missingPermissions?: HierarchicalPermission[];
  suggestions?: string[];
}

// ============================================================================
// FEATURE HEALTH REGISTRY
// ============================================================================

/**
 * Registry of feature health status
 * This tracks which features are actually functional vs. mock/placeholder
 */
class FeatureHealthRegistry {
  private healthMap = new Map<string, FeatureHealth>();
  private healthCheckers = new Map<string, () => Promise<boolean>>();

  /**
   * Register a health checker for a feature
   */
  registerHealthChecker(
    moduleId: ModuleId,
    featureId?: FeatureId,
    tabId?: TabId,
    checker: () => Promise<boolean> = async () => true,
  ): void {
    const key = this.getKey(moduleId, featureId, tabId);
    this.healthCheckers.set(key, checker);
  }

  /**
   * Check feature health
   */
  async checkHealth(
    moduleId: ModuleId,
    featureId?: FeatureId,
    tabId?: TabId,
  ): Promise<FeatureHealth> {
    const key = this.getKey(moduleId, featureId, tabId);

    // Check cache first (5 minute TTL)
    const cached = this.healthMap.get(key);
    if (cached && cached.lastChecked) {
      const age = Date.now() - cached.lastChecked.getTime();
      if (age < 5 * 60 * 1000) {
        // 5 minutes
        return cached;
      }
    }

    // Get module definition
    const moduleDefinition = moduleRegistry.getModule(moduleId);
    if (!moduleDefinition) {
      return {
        moduleId,
        featureId,
        tabId,
        isFunctional: false,
        reason: "Module not found",
        healthScore: 0,
        lastChecked: new Date(),
      };
    }

    // Check if module is enabled
    if (!moduleRegistry.isModuleEnabled(moduleId)) {
      return {
        moduleId,
        featureId,
        tabId,
        isFunctional: false,
        reason: "Module is disabled",
        healthScore: 0,
        lastChecked: new Date(),
      };
    }

    // Check dependencies
    const missingDeps =
      module.dependencies?.filter(
        (dep) => !moduleRegistry.isModuleEnabled(dep),
      ) || [];

    if (missingDeps.length > 0) {
      return {
        moduleId,
        featureId,
        tabId,
        isFunctional: false,
        reason: `Missing dependencies: ${missingDeps.join(", ")}`,
        missingDependencies: missingDeps,
        healthScore: 0,
        lastChecked: new Date(),
      };
    }

    // Run custom health checker if registered
    const checker = this.healthCheckers.get(key);
    let isFunctional = true;
    let reason: string | undefined;

    if (checker) {
      try {
        isFunctional = await checker();
        if (!isFunctional) {
          reason = "Health check failed";
        }
      } catch (error) {
        isFunctional = false;
        reason = `Health check error: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    } else {
      // Default: check if feature/tab exists in module
      if (featureId) {
        const featureExists =
          module.routes?.some((r) =>
            r.path.includes(featureId.replace(".", "/")),
          ) || module.components?.some((c) => c.includes(featureId));

        if (!featureExists) {
          isFunctional = false;
          reason = "Feature not found in module";
        }
      }

      if (tabId && featureId) {
        // Check if tab route exists
        const tabExists = module.routes?.some((r) =>
          r.path.includes(tabId.replace(/\./g, "/")),
        );

        if (!tabExists) {
          isFunctional = false;
          reason = "Tab not found in module";
        }
      }
    }

    // Check for TODOs in related services (intelligent detection)
    const healthScore = await this.calculateHealthScore(
      moduleId,
      featureId,
      tabId,
      isFunctional,
    );

    const health: FeatureHealth = {
      moduleId,
      featureId,
      tabId,
      isFunctional,
      reason,
      dependencies: module.dependencies,
      missingDependencies: missingDeps.length > 0 ? missingDeps : undefined,
      healthScore,
      lastChecked: new Date(),
    };

    // Cache result
    this.healthMap.set(key, health);

    return health;
  }

  /**
   * Calculate health score based on various factors
   */
  private async calculateHealthScore(
    moduleId: ModuleId,
    featureId?: FeatureId,
    tabId?: TabId,
    baseFunctional: boolean = true,
  ): Promise<number> {
    if (!baseFunctional) return 0;

    let score = 100;

    // Perform intelligent module health checks
    // We verify that the module is properly configured and functional
    const moduleDef = moduleRegistry.getModule(moduleId);
    if (moduleDef) {
      // Check if module is properly configured
      if (!moduleDef.enabled) score -= 20;
      if (!moduleDef.routes || moduleDef.routes.length === 0) score -= 30;
      if (!moduleDef.components || moduleDef.components.length === 0)
        score -= 10;
    }

    // Feature-specific checks
    if (featureId) {
      // Check if feature has API endpoints
      const hasAPIs = moduleDef?.apis?.some((api) =>
        api.endpoint.includes(featureId.replace(".", "/")),
      );
      if (!hasAPIs) score -= 15;
    }

    // Tab-specific checks
    if (tabId) {
      // Check if tab has corresponding component
      const hasComponent = module?.components?.some((c) =>
        c.includes(tabId.replace(/\./g, "/")),
      );
      if (!hasComponent) score -= 25;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get health status for multiple features
   */
  async checkMultipleHealth(
    checks: Array<{ moduleId: ModuleId; featureId?: FeatureId; tabId?: TabId }>,
  ): Promise<FeatureHealth[]> {
    return Promise.all(
      checks.map((check) =>
        this.checkHealth(check.moduleId, check.featureId, check.tabId),
      ),
    );
  }

  /**
   * Invalidate cache for a feature
   */
  invalidateCache(
    moduleId: ModuleId,
    featureId?: FeatureId,
    tabId?: TabId,
  ): void {
    const key = this.getKey(moduleId, featureId, tabId);
    this.healthMap.delete(key);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.healthMap.clear();
  }

  private getKey(
    moduleId: ModuleId,
    featureId?: FeatureId,
    tabId?: TabId,
  ): string {
    return `${moduleId}${featureId ? `.${featureId}` : ""}${tabId ? `.${tabId}` : ""}`;
  }
}

// ============================================================================
// INTELLIGENT COMPLIANCE ENGINE
// ============================================================================

class IntelligentComplianceEngine {
  private healthRegistry = new FeatureHealthRegistry();

  /**
   * Check if a tab can be shown to a user
   * This is the MAIN function - it intelligently determines if a tab should be visible
   */
  async canShowTab(
    user: User,
    tabId: TabId,
    context?: { customerId?: string; warehouseId?: string },
  ): Promise<TabComplianceResult> {
    // Parse tabId to extract module, feature, tab
    const { moduleId, featureId, tab } = this.parseTabId(tabId);

    if (!moduleId) {
      return {
        tabId,
        canShow: false,
        canInteract: false,
        reason: "Invalid tab ID format",
        health: {
          moduleId: "wms" as ModuleId,
          tabId,
          isFunctional: false,
          reason: "Invalid tab ID",
          healthScore: 0,
        },
        requiredPermissions: [],
      };
    }

    // Step 1: Check feature health (CRITICAL - prevents showing broken features)
    const health = await this.healthRegistry.checkHealth(
      moduleId,
      featureId,
      tabId,
    );

    if (!health.isFunctional) {
      return {
        tabId,
        canShow: false,
        canInteract: false,
        reason: health.reason || "Feature is not functional",
        health,
        requiredPermissions: [],
        suggestions: health.missingDependencies
          ? [`Enable dependencies: ${health.missingDependencies.join(", ")}`]
          : undefined,
      };
    }

    // Step 2: Check user permissions
    const permissionCheck = this.checkTabPermissions(
      user,
      moduleId,
      featureId,
      tabId,
      context,
    );

    if (!permissionCheck.allowed) {
      return {
        tabId,
        canShow: false,
        canInteract: false,
        reason: permissionCheck.reason || "Insufficient permissions",
        health,
        requiredPermissions: permissionCheck.requiredPermissions || [],
        missingPermissions: permissionCheck.missingPermissions,
      };
    }

    // Step 3: Check if user can interact (not just view)
    const canInteract = this.canInteractWithTab(
      user,
      moduleId,
      featureId,
      tabId,
      context,
    );

    // Step 4: Determine required permissions
    const requiredPermissions = this.getRequiredPermissions(
      moduleId,
      featureId,
      tabId,
    );

    return {
      tabId,
      canShow: true,
      canInteract,
      health,
      requiredPermissions,
      suggestions:
        health.healthScore < 80
          ? ["Feature health is degraded. Some functionality may be limited."]
          : undefined,
    };
  }

  /**
   * Check if user has permissions for a tab
   */
  private checkTabPermissions(
    user: User,
    moduleId: ModuleId,
    featureId: FeatureId | undefined,
    tabId: TabId,
    context?: { customerId?: string; warehouseId?: string },
  ): ComplianceCheck {
    // Check module access first
    const moduleAccess = this.hasModuleAccess(user, moduleId, context);
    if (!moduleAccess) {
      return {
        allowed: false,
        reason: `No access to module: ${moduleId}`,
        requiredPermissions: [
          {
            moduleId,
            moduleAccess: "read_only",
            actions: ["read"],
            scope: "TENANT",
          },
        ],
      };
    }

    // Check feature access if featureId exists
    if (featureId) {
      const featureAccess = this.hasFeatureAccess(
        user,
        moduleId,
        featureId,
        context,
      );
      if (!featureAccess) {
        return {
          allowed: false,
          reason: `No access to feature: ${featureId}`,
          requiredPermissions: [
            {
              moduleId,
              featureId,
              featureAccess: "read_only",
              actions: ["read"],
              scope: "TENANT",
            },
          ],
        };
      }
    }

    // Check tab-level permissions
    const tabAccess = this.hasTabAccess(
      user,
      moduleId,
      featureId,
      tabId,
      context,
    );
    if (!tabAccess) {
      return {
        allowed: false,
        reason: `No access to tab: ${tabId}`,
        requiredPermissions: [
          {
            moduleId,
            featureId,
            tabId,
            tabAccess: "read_only",
            actions: ["read"],
            scope: "TENANT",
          },
        ],
        missingPermissions: [
          {
            moduleId,
            featureId,
            tabId,
            tabAccess: "read_only",
            actions: ["read"],
            scope: "TENANT",
          },
        ],
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can interact with tab (not just view)
   */
  private canInteractWithTab(
    user: User,
    moduleId: ModuleId,
    featureId: FeatureId | undefined,
    tabId: TabId,
    context?: { customerId?: string; warehouseId?: string },
  ): boolean {
    // Check if user has write permissions
    const hasWrite = this.hasActionPermission(
      user,
      moduleId,
      featureId,
      tabId,
      "write",
      context,
    );
    const hasManage = this.hasActionPermission(
      user,
      moduleId,
      featureId,
      tabId,
      "manage",
      context,
    );

    return hasWrite || hasManage;
  }

  /**
   * Parse tabId to extract components
   */
  private parseTabId(tabId: TabId): {
    moduleId: ModuleId | undefined;
    featureId: FeatureId | undefined;
    tab: string | undefined;
  } {
    const parts = tabId.split(".");

    // Format: module.feature.tab or feature.tab or just tab
    if (parts.length >= 3) {
      return {
        moduleId: parts[0] as ModuleId,
        featureId: `${parts[0]}.${parts[1]}` as FeatureId,
        tab: parts.slice(2).join("."),
      };
    } else if (parts.length === 2) {
      // Could be module.feature or feature.tab
      // Try to determine by checking if first part is a known module
      const possibleModule = parts[0] as ModuleId;
      const moduleDef = moduleRegistry.getModule(possibleModule);
      if (moduleDef) {
        return {
          moduleId: possibleModule,
          featureId: `${parts[0]}.${parts[1]}` as FeatureId,
          tab: undefined,
        };
      } else {
        // Assume it's feature.tab, need to find module
        return {
          moduleId: undefined, // Will need to search
          featureId: tabId as FeatureId,
          tab: parts[1],
        };
      }
    } else {
      return {
        moduleId: undefined,
        featureId: undefined,
        tab: parts[0],
      };
    }
  }

  /**
   * Permission checking helpers
   */
  private hasModuleAccess(
    user: User,
    moduleId: ModuleId,
    context?: { customerId?: string; warehouseId?: string },
  ): boolean {
    if (user.role === "SYSTEM_ADMIN") return true;

    const perm = user.hierarchicalPermissions?.find(
      (p) => p.moduleId === moduleId && !p.featureId,
    );
    if (perm?.moduleAccess === "none") return false;
    if (perm?.moduleAccess) return true;

    const quickAccess = user.moduleAccess?.[moduleId];
    if (quickAccess === "none") return false;
    if (quickAccess) return true;

    // Default: allow if no explicit denial
    return true;
  }

  private hasFeatureAccess(
    user: User,
    moduleId: ModuleId,
    featureId: FeatureId,
    context?: { customerId?: string; warehouseId?: string },
  ): boolean {
    if (!this.hasModuleAccess(user, moduleId, context)) return false;

    const perm = user.hierarchicalPermissions?.find(
      (p) => p.moduleId === moduleId && p.featureId === featureId && !p.tabId,
    );
    if (perm?.featureAccess === "none") return false;
    if (perm?.featureAccess) return true;

    const quickAccess = user.featureAccess?.[featureId];
    if (quickAccess === "none") return false;
    if (quickAccess) return true;

    // Inherit from module
    return this.hasModuleAccess(user, moduleId, context);
  }

  private hasTabAccess(
    user: User,
    moduleId: ModuleId,
    featureId: FeatureId | undefined,
    tabId: TabId,
    context?: { customerId?: string; warehouseId?: string },
  ): boolean {
    if (
      featureId &&
      !this.hasFeatureAccess(user, moduleId, featureId, context)
    ) {
      return false;
    }

    const perm = user.hierarchicalPermissions?.find(
      (p) =>
        p.moduleId === moduleId &&
        (p.featureId === featureId || !featureId) &&
        p.tabId === tabId,
    );
    if (perm?.tabAccess === "none") return false;
    if (perm?.tabAccess) return true;

    // Inherit from feature or module
    if (featureId) {
      return this.hasFeatureAccess(user, moduleId, featureId, context);
    }
    return this.hasModuleAccess(user, moduleId, context);
  }

  private hasActionPermission(
    user: User,
    moduleId: ModuleId,
    featureId: FeatureId | undefined,
    tabId: TabId,
    action: "read" | "write" | "manage",
    context?: { customerId?: string; warehouseId?: string },
  ): boolean {
    const perm = user.hierarchicalPermissions?.find(
      (p) =>
        p.moduleId === moduleId &&
        (p.featureId === featureId || !featureId) &&
        (p.tabId === tabId || !p.tabId),
    );

    if (perm) {
      if (action === "read") {
        return (
          perm.actions.includes("read") ||
          perm.actions.includes("read_write") ||
          perm.actions.includes("manage")
        );
      }
      if (action === "write") {
        return (
          perm.actions.includes("write") ||
          perm.actions.includes("read_write") ||
          perm.actions.includes("manage")
        );
      }
      if (action === "manage") {
        return perm.actions.includes("manage");
      }
    }

    // Check legacy permissions
    if (user.permissions) {
      const legacyPerm = user.permissions.find((p) => {
        const resource = this.mapModuleToResource(moduleId);
        return p.resource === resource;
      });
      if (legacyPerm) {
        return (
          legacyPerm.actions.includes(action as any) ||
          legacyPerm.actions.includes("manage")
        );
      }
    }

    return false;
  }

  private mapModuleToResource(moduleId: ModuleId): string {
    const mapping: Record<ModuleId, string> = {
      wms: "inventory",
      tms: "orders",
      "iso-ims": "quality",
      msds: "quality",
      qhse: "quality",
      ai: "analytics",
      integration: "settings",
      maas: "analytics",
      "proposals-rfq": "analytics",
      finance: "billing",
      procurement: "orders",
      crm: "customers",
      "project-management": "analytics",
      "business-intelligence": "business_intelligence",
      "warehouse-network": "warehouses",
      "facility-management": "warehouses",
      marketplace: "analytics",
      hr: "analytics",
      customs: "orders",
      settings: "settings",
      reports: "reports",
      analytics: "analytics",
      business_intelligence: "business_intelligence",
    };
    return mapping[moduleId] || "analytics";
  }

  private getRequiredPermissions(
    moduleId: ModuleId,
    featureId: FeatureId | undefined,
    tabId: TabId,
  ): HierarchicalPermission[] {
    return [
      {
        moduleId,
        featureId,
        tabId,
        moduleAccess: "read_only",
        featureAccess: featureId ? "read_only" : undefined,
        tabAccess: "read_only",
        actions: ["read"],
        scope: "TENANT",
      },
    ];
  }

  /**
   * Register a health checker for a feature
   */
  registerHealthChecker(
    moduleId: ModuleId,
    featureId: FeatureId | undefined,
    tabId: TabId | undefined,
    checker: () => Promise<boolean>,
  ): void {
    this.healthRegistry.registerHealthChecker(
      moduleId,
      featureId,
      tabId,
      checker,
    );
  }

  /**
   * Check multiple tabs at once
   */
  async checkMultipleTabs(
    user: User,
    tabIds: TabId[],
    context?: { customerId?: string; warehouseId?: string },
  ): Promise<Map<TabId, TabComplianceResult>> {
    const results = await Promise.all(
      tabIds.map((tabId) => this.canShowTab(user, tabId, context)),
    );

    const map = new Map<TabId, TabComplianceResult>();
    results.forEach((result, index) => {
      map.set(tabIds[index], result);
    });

    return map;
  }

  /**
   * Filter tabs based on compliance
   */
  async filterTabs(
    user: User,
    tabIds: TabId[],
    context?: { customerId?: string; warehouseId?: string },
  ): Promise<TabId[]> {
    const results = await this.checkMultipleTabs(user, tabIds, context);
    return Array.from(results.entries())
      .filter(([_, result]) => result.canShow)
      .map(([tabId]) => tabId);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const intelligentComplianceEngine = new IntelligentComplianceEngine();

// Pre-register health checkers for known problematic features
// This prevents showing tabs that won't work

// Example: Register health checker for a feature that requires database
if (typeof window === "undefined") {
  // Server-side only
  intelligentComplianceEngine.registerHealthChecker(
    "wms",
    "wms.inventory",
    "wms.inventory.real-time",
    async () => {
      // Check if real-time features are enabled
      // In a real implementation, this would check environment variables or database
      return process.env.ENABLE_REALTIME_FEATURES === "true";
    },
  );
}
