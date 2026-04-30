/**
 * 🤖 AI PERMISSION RECOMMENDATION SERVICE
 * 
 * Intelligent permission suggestions based on:
 * - User role and department
 * - Similar users analysis
 * - Activity patterns
 * - Best practices
 * 
 * BlueDXP Platform - Enterprise Grade
 */

import { HierarchicalPermission, ModuleId, FeatureId, Action, UserRole } from "@/types/user";

// ============================================================================
// TYPES
// ============================================================================

export interface PermissionRecommendation {
  id: string;
  moduleId: ModuleId;
  featureId?: FeatureId;
  actions: Action[];
  confidence: number; // 0-1
  reason: string;
  basedOn: {
    similarUsers?: number;
    roleDefault?: boolean;
    departmentCommon?: boolean;
    activityPattern?: boolean;
  };
  riskLevel: "low" | "medium" | "high";
}

export interface UserSimilarityResult {
  userId: string;
  userName: string;
  similarity: number;
  sharedPermissions: number;
}

// ============================================================================
// ROLE-BASED PERMISSION TEMPLATES
// ============================================================================

const ROLE_PERMISSION_TEMPLATES: Record<UserRole, Partial<Record<ModuleId, { features: string[]; actions: Action[] }>>> = {
  super_admin: {
    wms: { features: ["*"], actions: ["create", "read", "update", "delete"] },
    tms: { features: ["*"], actions: ["create", "read", "update", "delete"] },
    finance: { features: ["*"], actions: ["create", "read", "update", "delete"] },
    settings: { features: ["*"], actions: ["create", "read", "update", "delete"] },
  },
  platform_admin: {
    wms: { features: ["*"], actions: ["create", "read", "update", "delete"] },
    tms: { features: ["*"], actions: ["create", "read", "update", "delete"] },
    settings: { features: ["users", "roles", "integrations"], actions: ["create", "read", "update", "delete"] },
  },
  tenant_admin: {
    wms: { features: ["inventory", "orders", "reports"], actions: ["create", "read", "update"] },
    tms: { features: ["shipments", "tracking"], actions: ["create", "read", "update"] },
    settings: { features: ["users", "roles"], actions: ["create", "read", "update"] },
  },
  manager: {
    wms: { features: ["inventory", "orders", "reports"], actions: ["create", "read", "update"] },
    tms: { features: ["shipments", "tracking"], actions: ["read", "update"] },
    qhse: { features: ["incidents", "audits"], actions: ["create", "read", "update"] },
  },
  supervisor: {
    wms: { features: ["inventory", "picking", "putaway"], actions: ["create", "read", "update"] },
    tms: { features: ["shipments"], actions: ["read", "update"] },
  },
  operator: {
    wms: { features: ["inventory", "picking", "putaway"], actions: ["read", "update"] },
  },
  viewer: {
    wms: { features: ["inventory", "reports"], actions: ["read"] },
    tms: { features: ["shipments", "tracking"], actions: ["read"] },
  },
  customer_admin: {
    wms: { features: ["inventory", "orders"], actions: ["read"] },
    tms: { features: ["shipments", "tracking"], actions: ["read"] },
  },
  customer_user: {
    wms: { features: ["inventory"], actions: ["read"] },
    tms: { features: ["tracking"], actions: ["read"] },
  },
  carrier: {
    tms: { features: ["shipments", "tracking", "routes"], actions: ["read", "update"] },
  },
  partner: {
    wms: { features: ["inventory", "orders"], actions: ["read"] },
    tms: { features: ["shipments"], actions: ["read"] },
  },
  auditor: {
    wms: { features: ["*"], actions: ["read"] },
    tms: { features: ["*"], actions: ["read"] },
    finance: { features: ["*"], actions: ["read"] },
    qhse: { features: ["*"], actions: ["read"] },
  },
};

// ============================================================================
// DEPARTMENT-BASED SUGGESTIONS
// ============================================================================

const DEPARTMENT_PERMISSIONS: Record<string, { modules: ModuleId[]; emphasis: string[] }> = {
  warehouse: {
    modules: ["wms"],
    emphasis: ["inventory", "picking", "putaway", "receiving"],
  },
  logistics: {
    modules: ["tms", "wms"],
    emphasis: ["shipments", "tracking", "routes", "carriers"],
  },
  finance: {
    modules: ["finance"],
    emphasis: ["accounts-payable", "accounts-receivable", "billing", "reports"],
  },
  sales: {
    modules: ["crm", "proposals"],
    emphasis: ["customers", "opportunities", "quotes"],
  },
  compliance: {
    modules: ["qhse", "iso-ims", "trade-compliance"],
    emphasis: ["audits", "incidents", "certifications"],
  },
  it: {
    modules: ["settings", "integrations"],
    emphasis: ["users", "api-keys", "system"],
  },
};

// ============================================================================
// RECOMMENDATION ENGINE
// ============================================================================

export const permissionRecommendationService = {
  /**
   * Generate permission recommendations for a user
   */
  async getRecommendations(
    userId: string,
    role: UserRole,
    department?: string,
    currentPermissions?: HierarchicalPermission[]
  ): Promise<PermissionRecommendation[]> {
    const recommendations: PermissionRecommendation[] = [];
    const currentPerms = currentPermissions || [];

    // 1. Role-based recommendations
    const roleTemplate = ROLE_PERMISSION_TEMPLATES[role];
    if (roleTemplate) {
      for (const [moduleId, config] of Object.entries(roleTemplate)) {
        const hasModule = currentPerms.some((p) => p.moduleId === moduleId);
        
        if (!hasModule) {
          recommendations.push({
            id: `rec_role_${moduleId}`,
            moduleId: moduleId as ModuleId,
            actions: config.actions,
            confidence: 0.9,
            reason: `Recommended for ${role.replace(/_/g, " ")} role`,
            basedOn: { roleDefault: true },
            riskLevel: this.assessRiskLevel(moduleId as ModuleId, config.actions),
          });
        }
      }
    }

    // 2. Department-based recommendations
    if (department) {
      const deptConfig = DEPARTMENT_PERMISSIONS[department.toLowerCase()];
      if (deptConfig) {
        for (const moduleId of deptConfig.modules) {
          const hasModule = currentPerms.some((p) => p.moduleId === moduleId);
          
          if (!hasModule) {
            const existing = recommendations.find((r) => r.moduleId === moduleId);
            if (existing) {
              existing.confidence = Math.min(existing.confidence + 0.05, 1);
              existing.basedOn.departmentCommon = true;
              existing.reason += ` and common for ${department} department`;
            } else {
              recommendations.push({
                id: `rec_dept_${moduleId}`,
                moduleId,
                actions: ["read"] as Action[],
                confidence: 0.75,
                reason: `Common for ${department} department`,
                basedOn: { departmentCommon: true },
                riskLevel: "low",
              });
            }
          }
        }
      }
    }

    // 3. Similar users analysis (mock - in production, use ML)
    const similarUsers = await this.findSimilarUsers(userId, role, department);
    if (similarUsers.length > 0) {
      // Add recommendations based on common permissions among similar users
      recommendations.push({
        id: "rec_similar_reporting",
        moduleId: "wms",
        featureId: "reports",
        actions: ["read"] as Action[],
        confidence: 0.7,
        reason: `${similarUsers.length} similar users have this permission`,
        basedOn: { similarUsers: similarUsers.length },
        riskLevel: "low",
      });
    }

    // Sort by confidence
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  },

  /**
   * Find similar users for permission analysis
   */
  async findSimilarUsers(
    userId: string,
    role: UserRole,
    department?: string
  ): Promise<UserSimilarityResult[]> {
    // In production, use ML clustering or similarity algorithms
    // Mock response
    return [
      { userId: "user_similar_1", userName: "John Doe", similarity: 0.85, sharedPermissions: 12 },
      { userId: "user_similar_2", userName: "Jane Smith", similarity: 0.78, sharedPermissions: 10 },
    ];
  },

  /**
   * Assess risk level of a permission
   */
  assessRiskLevel(moduleId: ModuleId, actions: Action[]): "low" | "medium" | "high" {
    const highRiskModules: ModuleId[] = ["settings", "finance", "integrations"];
    const highRiskActions: Action[] = ["delete"];
    const mediumRiskActions: Action[] = ["create", "update"];

    if (highRiskModules.includes(moduleId)) {
      if (actions.some((a) => highRiskActions.includes(a))) return "high";
      if (actions.some((a) => mediumRiskActions.includes(a))) return "medium";
    }

    if (actions.some((a) => highRiskActions.includes(a))) return "medium";

    return "low";
  },

  /**
   * Apply recommended permissions
   */
  async applyRecommendations(
    userId: string,
    recommendationIds: string[],
    allRecommendations: PermissionRecommendation[]
  ): Promise<HierarchicalPermission[]> {
    const selectedRecs = allRecommendations.filter((r) =>
      recommendationIds.includes(r.id)
    );

    const newPermissions: HierarchicalPermission[] = selectedRecs.map((rec) => ({
      moduleId: rec.moduleId,
      featureId: rec.featureId,
      actions: rec.actions,
      accessLevel: "full" as const,
    }));

    console.log(`[AI Permissions] Applied ${newPermissions.length} recommendations for user ${userId}`);

    return newPermissions;
  },

  /**
   * Detect over-privileged users
   */
  async detectOverPrivileged(
    userId: string,
    permissions: HierarchicalPermission[],
    activityLog: any[]
  ): Promise<{ isOverPrivileged: boolean; unusedPermissions: string[] }> {
    // In production, analyze activity logs to find unused permissions
    const unusedPermissions: string[] = [];

    // Mock: check if user has permissions they haven't used in 90 days
    for (const perm of permissions) {
      const hasRecentActivity = activityLog.some(
        (log) =>
          log.moduleId === perm.moduleId &&
          new Date(log.timestamp) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      );

      if (!hasRecentActivity) {
        unusedPermissions.push(`${perm.moduleId}:${perm.featureId || "*"}`);
      }
    }

    return {
      isOverPrivileged: unusedPermissions.length > permissions.length * 0.3,
      unusedPermissions,
    };
  },
};

export default permissionRecommendationService;
