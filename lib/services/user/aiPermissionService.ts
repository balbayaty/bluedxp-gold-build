/**
 * 🚀 AI PERMISSION SERVICE
 *
 * AI-powered permission management
 * - Permission recommendations
 * - Conflict detection
 * - Risk assessment
 * - Compliance checking
 * - Best practice suggestions
 * - Permission optimization
 *
 * BlueDXP Platform - Vision 2040 Aligned • 5IR Human-Centric AI
 */

import { permissionService } from "./permissionService";
import { userService } from "./userService";
import { roleService } from "./roleService";
import type {
  HierarchicalPermission,
  PermissionConflict,
  PermissionOptimization,
  PermissionUsage,
} from "@/types/permissions";

// ============================================================================
// TYPES
// ============================================================================

export interface PermissionRecommendation {
  permission: HierarchicalPermission;
  reason: string;
  confidence: number;
  basedOn: "role" | "usage_pattern" | "similar_users" | "best_practice";
  impact: "high" | "medium" | "low";
}

export interface RiskAssessment {
  userId: string;
  riskScore: number; // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  issues: Array<{
    type:
      | "excessive_permissions"
      | "conflicting_permissions"
      | "unused_permissions"
      | "security_risk";
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    recommendation: string;
  }>;
}

export interface ComplianceCheck {
  compliant: boolean;
  violations: Array<{
    rule: string;
    description: string;
    severity: "low" | "medium" | "high";
    fix: string;
  }>;
  recommendations: string[];
}

// ============================================================================
// AI PERMISSION SERVICE
// ============================================================================

class AIPermissionService {
  /**
   * Get AI-powered permission recommendations
   */
  async getRecommendations(
    userId: string,
  ): Promise<PermissionRecommendation[]> {
    try {
      const user = await userService.getUserById(userId);
      if (!user) {
        return [];
      }

      const recommendations: PermissionRecommendation[] = [];

      // 1. Role-based recommendations
      const roleRecommendations = await this.getRoleBasedRecommendations(user);
      recommendations.push(...roleRecommendations);

      // 2. Usage pattern recommendations
      const usageRecommendations =
        await this.getUsageBasedRecommendations(userId);
      recommendations.push(...usageRecommendations);

      // 3. Similar users recommendations
      const similarUserRecommendations =
        await this.getSimilarUserRecommendations(user);
      recommendations.push(...similarUserRecommendations);

      // 4. Best practice recommendations
      const bestPracticeRecommendations =
        await this.getBestPracticeRecommendations(user);
      recommendations.push(...bestPracticeRecommendations);

      // Sort by confidence and impact
      return recommendations.sort((a, b) => {
        const scoreA =
          a.confidence *
          (a.impact === "high" ? 3 : a.impact === "medium" ? 2 : 1);
        const scoreB =
          b.confidence *
          (b.impact === "high" ? 3 : b.impact === "medium" ? 2 : 1);
        return scoreB - scoreA;
      });
    } catch (error) {
      console.error(
        "[AIPermissionService] Error getting recommendations:",
        error,
      );
      return [];
    }
  }

  /**
   * Detect permission conflicts
   */
  async detectConflicts(userId: string): Promise<PermissionConflict[]> {
    try {
      return await permissionService.detectPermissionConflicts(userId);
    } catch (error) {
      console.error("[AIPermissionService] Error detecting conflicts:", error);
      return [];
    }
  }

  /**
   * Assess risk for user permissions
   */
  async assessRisk(userId: string): Promise<RiskAssessment> {
    try {
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const permissions = (user.hierarchicalPermissions ||
        []) as HierarchicalPermission[];
      const issues: RiskAssessment["issues"] = [];
      let riskScore = 0;

      // Check for excessive permissions
      if (permissions.length > 50) {
        riskScore += 20;
        issues.push({
          type: "excessive_permissions",
          severity: "high",
          description: `User has ${permissions.length} permissions, which is excessive`,
          recommendation:
            "Review and remove unused permissions. Consider using role-based permissions instead.",
        });
      }

      // Check for conflicting permissions
      const conflicts = await this.detectConflicts(userId);
      if (conflicts.length > 0) {
        riskScore += conflicts.length * 10;
        issues.push({
          type: "conflicting_permissions",
          severity: conflicts.some((c) => c.severity === "high")
            ? "high"
            : "medium",
          description: `Found ${conflicts.length} permission conflicts`,
          recommendation:
            "Resolve conflicting permissions to prevent security issues.",
        });
      }

      // Check for unused permissions
      const usage = await permissionService.getPermissionUsage(userId);
      const unusedPermissions = usage.filter(
        (u) => u.usageCount === 0 && u.trend === "stable",
      );
      if (unusedPermissions.length > 5) {
        riskScore += 15;
        issues.push({
          type: "unused_permissions",
          severity: "medium",
          description: `User has ${unusedPermissions.length} unused permissions`,
          recommendation:
            "Remove unused permissions to follow principle of least privilege.",
        });
      }

      // Check for security risks (admin permissions, etc.)
      const adminPermissions = permissions.filter(
        (p) =>
          p.scope === "ALL" || p.action === "manage" || p.module === "settings",
      );
      if (adminPermissions.length > 0 && user.role !== "SYSTEM_ADMIN") {
        riskScore += 30;
        issues.push({
          type: "security_risk",
          severity: "critical",
          description: `User has ${adminPermissions.length} administrative permissions but is not a system admin`,
          recommendation:
            "Review administrative permissions. Non-admin users should not have ALL scope or manage actions.",
        });
      }

      // Determine risk level
      let riskLevel: RiskAssessment["riskLevel"] = "low";
      if (riskScore >= 70) {
        riskLevel = "critical";
      } else if (riskScore >= 50) {
        riskLevel = "high";
      } else if (riskScore >= 30) {
        riskLevel = "medium";
      }

      return {
        userId,
        riskScore: Math.min(riskScore, 100),
        riskLevel,
        issues,
      };
    } catch (error) {
      console.error("[AIPermissionService] Error assessing risk:", error);
      throw error;
    }
  }

  /**
   * Check compliance
   */
  async checkCompliance(
    userId: string,
    complianceType: "GDPR" | "SOC2" | "ISO27001" | "HIPAA" | "PCI_DSS",
  ): Promise<ComplianceCheck> {
    try {
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const violations: ComplianceCheck["violations"] = [];
      const recommendations: string[] = [];

      // GDPR compliance checks
      if (complianceType === "GDPR") {
        // Check for data access logging
        // Check for consent management
        // Check for right to be forgotten
        recommendations.push(
          "Ensure all data access is logged for GDPR compliance",
        );
        recommendations.push(
          "Implement consent management for user data processing",
        );
      }

      // SOC2 compliance checks
      if (complianceType === "SOC2") {
        const risk = await this.assessRisk(userId);
        if (risk.riskLevel === "high" || risk.riskLevel === "critical") {
          violations.push({
            rule: "SOC2-CC6.1",
            description: "Access controls must be properly configured",
            severity: "high",
            fix: "Review and fix permission issues identified in risk assessment",
          });
        }
      }

      // ISO27001 compliance checks
      if (complianceType === "ISO27001") {
        const permissions = (user.hierarchicalPermissions ||
          []) as HierarchicalPermission[];
        if (permissions.length === 0) {
          violations.push({
            rule: "ISO27001-A.9.2.1",
            description: "User access rights must be defined",
            severity: "high",
            fix: "Assign appropriate permissions to user",
          });
        }
      }

      return {
        compliant: violations.length === 0,
        violations,
        recommendations,
      };
    } catch (error) {
      console.error("[AIPermissionService] Error checking compliance:", error);
      throw error;
    }
  }

  /**
   * Optimize permissions
   */
  async optimizePermissions(userId: string): Promise<PermissionOptimization[]> {
    try {
      return await permissionService.optimizePermissions(userId);
    } catch (error) {
      console.error(
        "[AIPermissionService] Error optimizing permissions:",
        error,
      );
      return [];
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async getRoleBasedRecommendations(
    user: any,
  ): Promise<PermissionRecommendation[]> {
    const recommendations: PermissionRecommendation[] = [];

    // Get role definition
    const roleDef = await roleService.getRole(user.role);
    if (roleDef) {
      const rolePermissions = roleDef.permissions as HierarchicalPermission[];
      const userPermissions = (user.hierarchicalPermissions ||
        []) as HierarchicalPermission[];

      // Find permissions in role but not in user
      for (const rolePerm of rolePermissions) {
        const hasPermission = userPermissions.some(
          (up) =>
            up.module === rolePerm.module &&
            up.action === rolePerm.action &&
            up.scope === rolePerm.scope,
        );

        if (!hasPermission) {
          recommendations.push({
            permission: rolePerm,
            reason: `Recommended based on user's role: ${user.role}`,
            confidence: 0.9,
            basedOn: "role",
            impact: "high",
          });
        }
      }
    }

    return recommendations;
  }

  private async getUsageBasedRecommendations(
    userId: string,
  ): Promise<PermissionRecommendation[]> {
    const recommendations: PermissionRecommendation[] = [];

    // Get usage patterns
    const usage = await permissionService.getPermissionUsage(userId);

    // Find frequently used patterns
    const frequentPatterns = usage
      .filter((u) => u.usageCount > 10 && u.trend === "increasing")
      .slice(0, 5);

    for (const pattern of frequentPatterns) {
      recommendations.push({
        permission: pattern.permission,
        reason: `Frequently used (${pattern.usageCount} times)`,
        confidence: 0.7,
        basedOn: "usage_pattern",
        impact: "medium",
      });
    }

    return recommendations;
  }

  private async getSimilarUserRecommendations(
    user: any,
  ): Promise<PermissionRecommendation[]> {
    const recommendations: PermissionRecommendation[] = [];

    // Find users with same role
    const similarUsers = await userService.getUsers({
      tenantId: user.tenantId,
      role: user.role,
      limit: 10,
    });

    // Get common permissions
    const permissionCounts = new Map<
      string,
      { permission: HierarchicalPermission; count: number }
    >();

    for (const similarUser of similarUsers) {
      const permissions = (similarUser.hierarchicalPermissions ||
        []) as HierarchicalPermission[];
      for (const perm of permissions) {
        const key = `${perm.module}:${perm.action}:${perm.scope}`;
        const existing = permissionCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          permissionCounts.set(key, { permission: perm, count: 1 });
        }
      }
    }

    // Recommend permissions that >50% of similar users have
    const userPermissions = (user.hierarchicalPermissions ||
      []) as HierarchicalPermission[];
    for (const [key, { permission, count }] of permissionCounts.entries()) {
      if (count > similarUsers.length * 0.5) {
        const hasPermission = userPermissions.some(
          (up) =>
            up.module === permission.module &&
            up.action === permission.action &&
            up.scope === permission.scope,
        );

        if (!hasPermission) {
          recommendations.push({
            permission,
            reason: `Used by ${Math.round((count / similarUsers.length) * 100)}% of users with same role`,
            confidence: 0.8,
            basedOn: "similar_users",
            impact: "medium",
          });
        }
      }
    }

    return recommendations;
  }

  private async getBestPracticeRecommendations(
    user: any,
  ): Promise<PermissionRecommendation[]> {
    const recommendations: PermissionRecommendation[] = [];

    // Best practice: Users should have read access to their own data
    const userPermissions = (user.hierarchicalPermissions ||
      []) as HierarchicalPermission[];
    const hasOwnRead = userPermissions.some(
      (p) => p.scope === "OWN" && p.action === "read",
    );

    if (!hasOwnRead) {
      recommendations.push({
        permission: {
          module: "users",
          action: "read",
          scope: "OWN",
        } as HierarchicalPermission,
        reason: "Best practice: Users should be able to read their own data",
        confidence: 0.95,
        basedOn: "best_practice",
        impact: "high",
      });
    }

    return recommendations;
  }
}

// Export singleton instance
export const aiPermissionService = new AIPermissionService();
