/**
 * 🔍 PERMISSION IMPACT ANALYZER
 *
 * Mind-blowing impact analysis:
 * - See what will be affected before making changes
 * - Dependency analysis
 * - Cascade effect prediction
 * - Risk assessment
 * - Rollback preview
 * - Impact visualization
 */

import type {
  User,
  HierarchicalPermission,
  ModuleId,
  FeatureId,
  TabId,
} from "@/types/user";
import { userService } from "@/lib/services/user";
import { intelligentComplianceEngine } from "./intelligentComplianceEngine";

// ============================================================================
// TYPES
// ============================================================================

export interface PermissionImpact {
  type: "DIRECT" | "CASCADE" | "CONFLICT" | "DEPENDENCY" | "BREAKING";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affectedUsers: number;
  affectedModules: ModuleId[];
  affectedFeatures: FeatureId[];
  affectedTabs: TabId[];
  description: string;
  riskScore: number; // 0-100
  estimatedDowntime?: number; // minutes
  rollbackComplexity: "EASY" | "MEDIUM" | "HARD" | "IMPOSSIBLE";
  recommendations: string[];
  preview?: {
    before: HierarchicalPermission[];
    after: HierarchicalPermission[];
  };
}

export interface ImpactAnalysis {
  changeType: "GRANT" | "REVOKE" | "MODIFY" | "BULK";
  targetPermissions: HierarchicalPermission[];
  impacts: PermissionImpact[];
  totalAffectedUsers: number;
  totalRiskScore: number;
  canProceed: boolean;
  warnings: string[];
  estimatedImpact: string;
  rollbackPlan?: {
    steps: string[];
    complexity: string;
    estimatedTime: number;
  };
}

// ============================================================================
// IMPACT ANALYZER SERVICE
// ============================================================================

class PermissionImpactAnalyzerService {
  /**
   * Analyze impact of permission changes
   */
  async analyzeImpact(
    targetUser: User,
    proposedChanges: HierarchicalPermission[],
    changeType: "GRANT" | "REVOKE" | "MODIFY" | "BULK",
  ): Promise<ImpactAnalysis> {
    const impacts: PermissionImpact[] = [];
    const affectedUsers = new Set<string>();
    const affectedModules = new Set<ModuleId>();
    const affectedFeatures = new Set<FeatureId>();
    const affectedTabs = new Set<TabId>();

    // Get all users to check dependencies
    const allUsers = await userService.getUsers({});

    // Analyze each proposed change
    for (const change of proposedChanges) {
      // 1. Direct impact
      const directImpact = this.analyzeDirectImpact(
        targetUser,
        change,
        changeType,
      );
      impacts.push(directImpact);
      affectedUsers.add(targetUser.id);

      // 2. Cascade effects
      const cascadeImpacts = await this.analyzeCascadeEffects(
        targetUser,
        change,
        allUsers,
      );
      impacts.push(...cascadeImpacts);
      cascadeImpacts.forEach((impact) => {
        impact.affectedModules.forEach((m) => affectedModules.add(m));
        impact.affectedFeatures.forEach((f) => affectedFeatures.add(f));
        impact.affectedTabs.forEach((t) => affectedTabs.add(t));
      });

      // 3. Dependency analysis
      const dependencyImpacts = await this.analyzeDependencies(
        change,
        allUsers,
      );
      impacts.push(...dependencyImpacts);

      // 4. Conflict detection
      const conflictImpacts = this.analyzeConflicts(
        targetUser,
        change,
        proposedChanges,
      );
      impacts.push(...conflictImpacts);

      // 5. Breaking changes
      const breakingImpacts = await this.analyzeBreakingChanges(
        targetUser,
        change,
        changeType,
      );
      impacts.push(...breakingImpacts);
    }

    // Calculate totals
    const totalAffectedUsers = affectedUsers.size;
    const totalRiskScore = Math.min(
      100,
      impacts.reduce((sum, impact) => sum + impact.riskScore, 0) /
        impacts.length || 0,
    );

    // Determine if can proceed
    const criticalImpacts = impacts.filter((i) => i.severity === "CRITICAL");
    const canProceed =
      criticalImpacts.length === 0 ||
      criticalImpacts.every((i) => i.rollbackComplexity !== "IMPOSSIBLE");

    // Generate warnings
    const warnings = this.generateWarnings(impacts, totalRiskScore);

    // Generate rollback plan
    const rollbackPlan = this.generateRollbackPlan(
      impacts,
      targetUser,
      proposedChanges,
    );

    return {
      changeType,
      targetPermissions: proposedChanges,
      impacts: this.prioritizeImpacts(impacts),
      totalAffectedUsers,
      totalRiskScore,
      canProceed,
      warnings,
      estimatedImpact: this.estimateImpact(impacts),
      rollbackPlan,
    };
  }

  /**
   * Analyze direct impact
   */
  private analyzeDirectImpact(
    user: User,
    permission: HierarchicalPermission,
    changeType: "GRANT" | "REVOKE" | "MODIFY" | "BULK",
  ): PermissionImpact {
    const currentPerms = user.hierarchicalPermissions || [];
    const hasPermission = currentPerms.some(
      (p) =>
        p.moduleId === permission.moduleId &&
        p.featureId === permission.featureId &&
        p.tabId === permission.tabId,
    );

    let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let riskScore = 20;
    let description = "";

    if (changeType === "REVOKE" && hasPermission) {
      // Check if this is a critical permission
      if (
        permission.moduleAccess === "full" &&
        permission.moduleId === "settings"
      ) {
        severity = "CRITICAL";
        riskScore = 90;
        description =
          "Revoking full access to settings module may lock user out of critical functions";
      } else if (permission.moduleAccess === "full") {
        severity = "HIGH";
        riskScore = 70;
        description =
          "Revoking full module access will remove all related permissions";
      } else {
        severity = "MEDIUM";
        riskScore = 40;
        description =
          "Revoking permission will remove access to specific feature/tab";
      }
    } else if (changeType === "GRANT" && !hasPermission) {
      if (
        permission.moduleAccess === "full" &&
        permission.moduleId === "settings"
      ) {
        severity = "HIGH";
        riskScore = 80;
        description =
          "Granting full settings access gives user administrative capabilities";
      } else {
        severity = "LOW";
        riskScore = 20;
        description = "Granting new permission will add access";
      }
    }

    return {
      type: "DIRECT",
      severity,
      affectedUsers: 1,
      affectedModules: permission.moduleId ? [permission.moduleId] : [],
      affectedFeatures: permission.featureId ? [permission.featureId] : [],
      affectedTabs: permission.tabId ? [permission.tabId] : [],
      description,
      riskScore,
      rollbackComplexity: severity === "CRITICAL" ? "HARD" : "EASY",
      recommendations: this.generateRecommendations(
        changeType,
        permission,
        severity,
      ),
      preview: {
        before: currentPerms,
        after:
          changeType === "GRANT"
            ? [...currentPerms, permission]
            : currentPerms.filter(
                (p) =>
                  !(
                    p.moduleId === permission.moduleId &&
                    p.featureId === permission.featureId &&
                    p.tabId === permission.tabId
                  ),
              ),
      },
    };
  }

  /**
   * Analyze cascade effects
   */
  private async analyzeCascadeEffects(
    user: User,
    permission: HierarchicalPermission,
    allUsers: User[],
  ): Promise<PermissionImpact[]> {
    const impacts: PermissionImpact[] = [];

    // Check if this permission change affects other users
    // (e.g., if user is a manager, their permissions affect their team)
    if (user.role === "WAREHOUSE_HEAD" || user.role === "OPERATIONS_MANAGER") {
      const teamMembers = allUsers.filter(
        (u) =>
          u.id !== user.id &&
          (u.role === "WAREHOUSE_SUPERVISOR" ||
            u.role === "WAREHOUSE_OPERATOR"),
      );

      if (teamMembers.length > 0) {
        impacts.push({
          type: "CASCADE",
          severity: "MEDIUM",
          affectedUsers: teamMembers.length,
          affectedModules: permission.moduleId ? [permission.moduleId] : [],
          affectedFeatures: permission.featureId ? [permission.featureId] : [],
          affectedTabs: permission.tabId ? [permission.tabId] : [],
          description: `This change may affect ${teamMembers.length} team members who inherit permissions`,
          riskScore: 50,
          rollbackComplexity: "MEDIUM",
          recommendations: [
            "Review team member permissions after change",
            "Consider notifying affected users",
          ],
        });
      }
    }

    return impacts;
  }

  /**
   * Analyze dependencies
   */
  private async analyzeDependencies(
    permission: HierarchicalPermission,
    allUsers: User[],
  ): Promise<PermissionImpact[]> {
    const impacts: PermissionImpact[] = [];

    // Check if this permission has dependencies
    if (permission.featureId && !permission.moduleId) {
      const [moduleId] = permission.featureId.split(".") as [ModuleId];

      // Check if module access is required
      const usersWithoutModuleAccess = allUsers.filter((u) => {
        const hasModuleAccess =
          u.moduleAccess?.[moduleId] ||
          u.hierarchicalPermissions?.some(
            (p) => p.moduleId === moduleId && p.moduleAccess !== "none",
          );
        return !hasModuleAccess;
      });

      if (usersWithoutModuleAccess.length > 0) {
        impacts.push({
          type: "DEPENDENCY",
          severity: "HIGH",
          affectedUsers: usersWithoutModuleAccess.length,
          affectedModules: [moduleId],
          affectedFeatures: [permission.featureId],
          affectedTabs: [],
          description: `${usersWithoutModuleAccess.length} users have feature access but lack module access`,
          riskScore: 70,
          rollbackComplexity: "MEDIUM",
          recommendations: [
            `Ensure module access is granted for ${moduleId}`,
            "Review dependency chain",
          ],
        });
      }
    }

    return impacts;
  }

  /**
   * Analyze conflicts
   */
  private analyzeConflicts(
    user: User,
    permission: HierarchicalPermission,
    allChanges: HierarchicalPermission[],
  ): PermissionImpact[] {
    const impacts: PermissionImpact[] = [];

    // Check for conflicting permissions in the same change set
    const conflicts = allChanges.filter(
      (p) =>
        p.moduleId === permission.moduleId &&
        p.featureId === permission.featureId &&
        p.tabId === permission.tabId &&
        p.moduleAccess !== permission.moduleAccess,
    );

    if (conflicts.length > 0) {
      impacts.push({
        type: "CONFLICT",
        severity: "HIGH",
        affectedUsers: 1,
        affectedModules: permission.moduleId ? [permission.moduleId] : [],
        affectedFeatures: permission.featureId ? [permission.featureId] : [],
        affectedTabs: permission.tabId ? [permission.tabId] : [],
        description: "Conflicting permission levels detected in change set",
        riskScore: 80,
        rollbackComplexity: "EASY",
        recommendations: [
          "Resolve conflicting permissions before applying",
          "Choose appropriate access level",
        ],
      });
    }

    return impacts;
  }

  /**
   * Analyze breaking changes
   */
  private async analyzeBreakingChanges(
    user: User,
    permission: HierarchicalPermission,
    changeType: "GRANT" | "REVOKE" | "MODIFY" | "BULK",
  ): Promise<PermissionImpact[]> {
    const impacts: PermissionImpact[] = [];

    if (changeType === "REVOKE") {
      // Check if revoking this permission breaks critical workflows
      const currentPerms = user.hierarchicalPermissions || [];
      const hasPermission = currentPerms.some(
        (p) =>
          p.moduleId === permission.moduleId &&
          p.featureId === permission.featureId &&
          p.tabId === permission.tabId,
      );

      if (hasPermission) {
        // Check feature health
        const health = await intelligentComplianceEngine[
          "healthRegistry"
        ].checkHealth(
          permission.moduleId!,
          permission.featureId,
          permission.tabId,
        );

        if (!health.isFunctional) {
          impacts.push({
            type: "BREAKING",
            severity: "CRITICAL",
            affectedUsers: 1,
            affectedModules: permission.moduleId ? [permission.moduleId] : [],
            affectedFeatures: permission.featureId
              ? [permission.featureId]
              : [],
            affectedTabs: permission.tabId ? [permission.tabId] : [],
            description:
              "Revoking this permission may break critical workflows",
            riskScore: 95,
            estimatedDowntime: 30,
            rollbackComplexity: "HARD",
            recommendations: [
              "Review workflow dependencies before revoking",
              "Consider gradual permission reduction",
              "Test in staging environment first",
            ],
          });
        }
      }
    }

    return impacts;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    changeType: string,
    permission: HierarchicalPermission,
    severity: string,
  ): string[] {
    const recommendations: string[] = [];

    if (severity === "CRITICAL") {
      recommendations.push("⚠️ Critical change - requires approval");
      recommendations.push("Test in staging environment first");
      recommendations.push("Have rollback plan ready");
    }

    if (changeType === "REVOKE" && permission.moduleAccess === "full") {
      recommendations.push(
        "Consider gradual reduction instead of full revocation",
      );
      recommendations.push("Notify user before revoking");
    }

    if (changeType === "GRANT" && permission.moduleAccess === "full") {
      recommendations.push("Review principle of least privilege");
      recommendations.push("Consider starting with read-only access");
    }

    return recommendations;
  }

  /**
   * Generate warnings
   */
  private generateWarnings(
    impacts: PermissionImpact[],
    totalRiskScore: number,
  ): string[] {
    const warnings: string[] = [];

    if (totalRiskScore > 80) {
      warnings.push("🔴 High risk detected - proceed with caution");
    }

    const criticalCount = impacts.filter(
      (i) => i.severity === "CRITICAL",
    ).length;
    if (criticalCount > 0) {
      warnings.push(`⚠️ ${criticalCount} critical impact(s) detected`);
    }

    const breakingCount = impacts.filter((i) => i.type === "BREAKING").length;
    if (breakingCount > 0) {
      warnings.push(`💥 ${breakingCount} breaking change(s) detected`);
    }

    return warnings;
  }

  /**
   * Generate rollback plan
   */
  private generateRollbackPlan(
    impacts: PermissionImpact[],
    user: User,
    changes: HierarchicalPermission[],
  ): ImpactAnalysis["rollbackPlan"] {
    const steps: string[] = [
      "1. Document current permission state",
      "2. Apply changes",
      "3. Monitor for issues",
      "4. If issues occur, restore previous permissions",
    ];

    const complexity = impacts.some(
      (i) => i.rollbackComplexity === "IMPOSSIBLE",
    )
      ? "IMPOSSIBLE"
      : impacts.some((i) => i.rollbackComplexity === "HARD")
        ? "HARD"
        : impacts.some((i) => i.rollbackComplexity === "MEDIUM")
          ? "MEDIUM"
          : "EASY";

    const estimatedTime =
      complexity === "IMPOSSIBLE"
        ? 0
        : complexity === "HARD"
          ? 60
          : complexity === "MEDIUM"
            ? 30
            : 10;

    return {
      steps,
      complexity,
      estimatedTime,
    };
  }

  /**
   * Estimate impact
   */
  private estimateImpact(impacts: PermissionImpact[]): string {
    const totalAffected = impacts.reduce((sum, i) => sum + i.affectedUsers, 0);
    const criticalCount = impacts.filter(
      (i) => i.severity === "CRITICAL",
    ).length;

    if (criticalCount > 0) {
      return `Critical: ${criticalCount} critical impact(s), ${totalAffected} user(s) affected`;
    }

    if (totalAffected > 10) {
      return `High: ${totalAffected} user(s) affected across multiple modules`;
    }

    if (totalAffected > 0) {
      return `Medium: ${totalAffected} user(s) affected`;
    }

    return "Low: Minimal impact expected";
  }

  /**
   * Prioritize impacts
   */
  private prioritizeImpacts(impacts: PermissionImpact[]): PermissionImpact[] {
    const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return impacts.sort((a, b) => {
      const severityDiff =
        severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.riskScore - a.riskScore;
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const permissionImpactAnalyzer = new PermissionImpactAnalyzerService();
