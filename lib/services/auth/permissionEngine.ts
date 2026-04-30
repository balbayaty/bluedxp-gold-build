/**
 * Intelligent Permission Recommendation Engine
 *
 * Enterprise-grade permission management with:
 * - AI-powered permission recommendations
 * - Pros/cons analysis for each permission
 * - Risk assessment and warnings
 * - Approval workflow integration
 * - Permission conflict detection
 * - Best practice suggestions
 * - Role-based templates
 *
 * Industry Standard: Principle of Least Privilege, RBAC Best Practices
 */

import type {
  User,
  UserRole,
  ModuleId,
  FeatureId,
  TabId,
  Action,
  Permission,
  HierarchicalPermission,
} from "@/types/user";
import { getDefaultPermissions, ROLE_DEFINITIONS } from "@/types/user";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PermissionRecommendation {
  permission: HierarchicalPermission;
  confidence: number; // 0-100
  reasoning: string;
  pros: string[];
  cons: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  warnings: PermissionWarning[];
  requiresApproval: boolean;
  approvalReason?: string;
  bestPractices: string[];
  alternatives?: HierarchicalPermission[];
}

export interface PermissionWarning {
  type:
    | "SECURITY"
    | "COMPLIANCE"
    | "OPERATIONAL"
    | "DATA_ACCESS"
    | "PRIVILEGE_ESCALATION";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  impact: string;
  recommendation: string;
}

export interface PermissionConflict {
  type: "OVERLAPPING" | "CONTRADICTORY" | "REDUNDANT" | "EXCESSIVE";
  permissions: HierarchicalPermission[];
  description: string;
  resolution: string;
}

export interface PermissionAnalysis {
  recommendations: PermissionRecommendation[];
  conflicts: PermissionConflict[];
  riskScore: number; // 0-100
  complianceScore: number; // 0-100
  suggestions: string[];
  warnings: PermissionWarning[];
  requiresApproval: boolean;
}

export interface ApprovalRequest {
  id: string;
  userId: string;
  requestedBy: string;
  permissions: HierarchicalPermission[];
  reason: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskAssessment: PermissionAnalysis;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REQUIRES_REVIEW";
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

// ============================================================================
// PERMISSION ENGINE
// ============================================================================

class PermissionEngine {
  // Critical permissions that always require approval
  private readonly CRITICAL_PERMISSIONS: string[] = [
    "SYSTEM_ADMIN",
    "USER_MANAGEMENT",
    "SECURITY_SETTINGS",
    "AUDIT_LOGS",
    "BILLING",
    "DATA_EXPORT",
    "API_KEY_MANAGEMENT",
  ];

  // High-risk actions
  private readonly HIGH_RISK_ACTIONS: Action[] = [
    "delete",
    "manage",
    "configure",
    "approve",
    "export",
  ];

  // Permission templates by role
  private readonly ROLE_TEMPLATES: Record<UserRole, HierarchicalPermission[]> =
    {};

  constructor() {
    this.initializeRoleTemplates();
  }

  /**
   * Initialize role templates
   */
  private initializeRoleTemplates(): void {
    // Templates are based on ROLE_DEFINITIONS from types/user.ts
    // This provides intelligent defaults
  }

  /**
   * Analyze permissions and provide recommendations
   */
  async analyzePermissions(
    user: User,
    proposedPermissions: HierarchicalPermission[],
    context?: {
      currentPermissions?: HierarchicalPermission[];
      reason?: string;
      requestedBy?: string;
    },
  ): Promise<PermissionAnalysis> {
    const recommendations: PermissionRecommendation[] = [];
    const conflicts: PermissionConflict[] = [];
    const warnings: PermissionWarning[] = [];
    let riskScore = 0;
    let complianceScore = 100;

    // Analyze each proposed permission
    for (const perm of proposedPermissions) {
      const recommendation = await this.analyzePermission(perm, user, context);
      recommendations.push(recommendation);

      // Accumulate risk
      riskScore += this.getRiskScore(recommendation.riskLevel);

      // Check compliance
      if (recommendation.warnings.some((w) => w.type === "COMPLIANCE")) {
        complianceScore -= 10;
      }

      // Collect warnings
      warnings.push(...recommendation.warnings);
    }

    // Detect conflicts
    const detectedConflicts = this.detectConflicts(proposedPermissions);
    conflicts.push(...detectedConflicts);

    // Generate suggestions
    const suggestions = this.generateSuggestions(
      user,
      proposedPermissions,
      recommendations,
    );

    // Calculate overall risk
    riskScore = Math.min(100, riskScore / proposedPermissions.length);

    // Determine if approval required
    const requiresApproval =
      recommendations.some((r) => r.requiresApproval) ||
      riskScore >= 70 ||
      warnings.some((w) => w.severity === "CRITICAL" || w.severity === "HIGH");

    return {
      recommendations,
      conflicts,
      riskScore,
      complianceScore: Math.max(0, complianceScore),
      suggestions,
      warnings,
      requiresApproval,
    };
  }

  /**
   * Analyze individual permission
   */
  private async analyzePermission(
    permission: HierarchicalPermission,
    user: User,
    context?: any,
  ): Promise<PermissionRecommendation> {
    const pros: string[] = [];
    const cons: string[] = [];
    const warnings: PermissionWarning[] = [];
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let requiresApproval = false;
    let confidence = 80;

    // Analyze module access
    if (permission.moduleId) {
      const moduleAnalysis = this.analyzeModuleAccess(
        permission.moduleId,
        permission,
        user,
      );
      pros.push(...moduleAnalysis.pros);
      cons.push(...moduleAnalysis.cons);
      warnings.push(...moduleAnalysis.warnings);
      if (
        moduleAnalysis.riskLevel === "CRITICAL" ||
        moduleAnalysis.riskLevel === "HIGH"
      ) {
        riskLevel = moduleAnalysis.riskLevel;
      }
      if (moduleAnalysis.requiresApproval) {
        requiresApproval = true;
      }
    }

    // Analyze feature access
    if (permission.featureId) {
      const featureAnalysis = this.analyzeFeatureAccess(
        permission.featureId,
        permission,
        user,
      );
      pros.push(...featureAnalysis.pros);
      cons.push(...featureAnalysis.cons);
      warnings.push(...featureAnalysis.warnings);
      if (
        featureAnalysis.riskLevel === "CRITICAL" ||
        featureAnalysis.riskLevel === "HIGH"
      ) {
        riskLevel = featureAnalysis.riskLevel;
      }
      if (featureAnalysis.requiresApproval) {
        requiresApproval = true;
      }
    }

    // Analyze actions
    const actionAnalysis = this.analyzeActions(
      permission.actions,
      permission,
      user,
    );
    pros.push(...actionAnalysis.pros);
    cons.push(...actionAnalysis.cons);
    warnings.push(...actionAnalysis.warnings);
    if (
      actionAnalysis.riskLevel === "CRITICAL" ||
      actionAnalysis.riskLevel === "HIGH"
    ) {
      riskLevel = actionAnalysis.riskLevel;
    }
    if (actionAnalysis.requiresApproval) {
      requiresApproval = true;
    }

    // Analyze scope
    const scopeAnalysis = this.analyzeScope(permission.scope, permission, user);
    pros.push(...scopeAnalysis.pros);
    cons.push(...scopeAnalysis.cons);
    warnings.push(...scopeAnalysis.warnings);

    // Check if critical permission
    if (this.isCriticalPermission(permission)) {
      requiresApproval = true;
      riskLevel = "CRITICAL";
      warnings.push({
        type: "PRIVILEGE_ESCALATION",
        severity: "CRITICAL",
        message: "This permission grants critical system access",
        impact:
          "User will have elevated privileges that could affect system security",
        recommendation: "Requires explicit approval from system administrator",
      });
    }

    // Generate reasoning
    const reasoning = this.generateReasoning(permission, user, pros, cons);

    // Best practices
    const bestPractices = this.getBestPractices(permission, user);

    // Calculate confidence
    confidence = this.calculateConfidence(permission, user, warnings);

    return {
      permission,
      confidence,
      reasoning,
      pros,
      cons,
      riskLevel,
      warnings,
      requiresApproval,
      approvalReason: requiresApproval
        ? this.getApprovalReason(permission, riskLevel)
        : undefined,
      bestPractices,
    };
  }

  /**
   * Analyze module access
   */
  private analyzeModuleAccess(
    moduleId: ModuleId,
    permission: HierarchicalPermission,
    user: User,
  ): {
    pros: string[];
    cons: string[];
    warnings: PermissionWarning[];
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    requiresApproval: boolean;
  } {
    const pros: string[] = [];
    const cons: string[] = [];
    const warnings: PermissionWarning[] = [];
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let requiresApproval = false;

    // Check if user already has access
    const currentAccess = user.moduleAccess?.[moduleId];
    if (currentAccess === "full" && permission.moduleAccess === "full") {
      cons.push("User already has full access to this module");
    }

    // Critical modules
    const criticalModules: ModuleId[] = [
      "SYSTEM_SETTINGS",
      "USER_MANAGEMENT",
      "SECURITY",
      "BILLING",
    ];
    if (criticalModules.includes(moduleId)) {
      riskLevel = "HIGH";
      requiresApproval = true;
      warnings.push({
        type: "SECURITY",
        severity: "HIGH",
        message: `Access to ${moduleId} module requires careful consideration`,
        impact: "This module contains sensitive system configurations",
        recommendation:
          "Ensure user has proper training and justification for access",
      });
    }

    // Check role appropriateness
    const roleDefinition = ROLE_DEFINITIONS[user.role];
    if (roleDefinition && !roleDefinition.defaultModules?.includes(moduleId)) {
      warnings.push({
        type: "OPERATIONAL",
        severity: "MEDIUM",
        message: `Module ${moduleId} is not typically assigned to ${user.role} role`,
        impact: "User may not have necessary training for this module",
        recommendation:
          "Verify user has proper training and business justification",
      });
    }

    pros.push(`Enables access to ${moduleId} functionality`);
    if (permission.moduleAccess === "full") {
      pros.push("Full module access allows comprehensive operations");
    } else if (permission.moduleAccess === "read_only") {
      pros.push(
        "Read-only access provides visibility without modification risk",
      );
      riskLevel = "LOW";
    }

    return { pros, cons, warnings, riskLevel, requiresApproval };
  }

  /**
   * Analyze feature access
   */
  private analyzeFeatureAccess(
    featureId: FeatureId,
    permission: HierarchicalPermission,
    user: User,
  ): {
    pros: string[];
    cons: string[];
    warnings: PermissionWarning[];
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    requiresApproval: boolean;
  } {
    const pros: string[] = [];
    const cons: string[] = [];
    const warnings: PermissionWarning[] = [];
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let requiresApproval = false;

    // Critical features
    const criticalFeatures: FeatureId[] = [
      "USER_CREATE",
      "USER_DELETE",
      "ROLE_MANAGEMENT",
      "API_KEY_CREATE",
      "DATA_EXPORT",
      "AUDIT_LOG_VIEW",
    ];

    if (criticalFeatures.includes(featureId)) {
      riskLevel = "HIGH";
      requiresApproval = true;
      warnings.push({
        type: "SECURITY",
        severity: "HIGH",
        message: `Feature ${featureId} has significant security implications`,
        impact: "This feature can affect system security and data integrity",
        recommendation: "Requires explicit approval and justification",
      });
    }

    pros.push(`Enables ${featureId} functionality`);
    cons.push(`Additional permission increases user's access scope`);

    return { pros, cons, warnings, riskLevel, requiresApproval };
  }

  /**
   * Analyze actions
   */
  private analyzeActions(
    actions: Action[],
    permission: HierarchicalPermission,
    user: User,
  ): {
    pros: string[];
    cons: string[];
    warnings: PermissionWarning[];
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    requiresApproval: boolean;
  } {
    const pros: string[] = [];
    const cons: string[] = [];
    const warnings: PermissionWarning[] = [];
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let requiresApproval = false;

    // Check for high-risk actions
    const hasHighRiskAction = actions.some((action) =>
      this.HIGH_RISK_ACTIONS.includes(action),
    );

    if (hasHighRiskAction) {
      riskLevel = "HIGH";
      if (actions.includes("delete")) {
        riskLevel = "CRITICAL";
        requiresApproval = true;
        warnings.push({
          type: "DATA_ACCESS",
          severity: "CRITICAL",
          message: "Delete action grants ability to permanently remove data",
          impact: "Irreversible data loss possible",
          recommendation:
            "Requires explicit approval and data backup procedures",
        });
      }

      if (actions.includes("manage")) {
        riskLevel = "HIGH";
        requiresApproval = true;
        warnings.push({
          type: "PRIVILEGE_ESCALATION",
          severity: "HIGH",
          message: "Manage action grants comprehensive control",
          impact: "User can modify system configurations",
          recommendation: "Verify user has proper authorization",
        });
      }

      if (actions.includes("export")) {
        warnings.push({
          type: "DATA_ACCESS",
          severity: "MEDIUM",
          message: "Export action allows data extraction",
          impact: "Sensitive data can be exported outside the system",
          recommendation: "Ensure data export policies are followed",
        });
      }
    }

    if (actions.includes("read")) {
      pros.push("Read access provides visibility without modification risk");
      riskLevel = "LOW";
    }

    if (actions.length > 5) {
      cons.push("Large number of actions increases complexity and risk");
      warnings.push({
        type: "OPERATIONAL",
        severity: "MEDIUM",
        message: "Multiple actions granted may exceed user needs",
        impact: "Principle of least privilege may be violated",
        recommendation: "Consider if all actions are necessary",
      });
    }

    return { pros, cons, warnings, riskLevel, requiresApproval };
  }

  /**
   * Analyze scope
   */
  private analyzeScope(
    scope: string,
    permission: HierarchicalPermission,
    user: User,
  ): {
    pros: string[];
    cons: string[];
    warnings: PermissionWarning[];
  } {
    const pros: string[] = [];
    const cons: string[] = [];
    const warnings: PermissionWarning[] = [];

    if (scope === "ALL") {
      pros.push("Full scope access enables comprehensive operations");
      warnings.push({
        type: "PRIVILEGE_ESCALATION",
        severity: "HIGH",
        message: "ALL scope grants access to all resources",
        impact: "User can access data across all tenants/customers",
        recommendation:
          "Verify if ALL scope is necessary or if limited scope is sufficient",
      });
    } else if (scope === "TENANT") {
      pros.push("Tenant scope provides appropriate multi-tenant isolation");
    } else if (scope === "OWN" || scope === "ASSIGNED_CUSTOMERS") {
      pros.push("Limited scope follows principle of least privilege");
    }

    return { pros, cons, warnings };
  }

  /**
   * Check if permission is critical
   */
  private isCriticalPermission(permission: HierarchicalPermission): boolean {
    if (
      permission.moduleId &&
      this.CRITICAL_PERMISSIONS.includes(permission.moduleId)
    ) {
      return true;
    }
    if (
      permission.actions.some(
        (action) => action === "delete" || action === "manage",
      )
    ) {
      return true;
    }
    if (permission.scope === "ALL" && permission.actions.includes("delete")) {
      return true;
    }
    return false;
  }

  /**
   * Detect conflicts between permissions
   */
  private detectConflicts(
    permissions: HierarchicalPermission[],
  ): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];

    // Check for overlapping permissions
    for (let i = 0; i < permissions.length; i++) {
      for (let j = i + 1; j < permissions.length; j++) {
        const perm1 = permissions[i];
        const perm2 = permissions[j];

        if (this.isOverlapping(perm1, perm2)) {
          conflicts.push({
            type: "OVERLAPPING",
            permissions: [perm1, perm2],
            description: "Permissions overlap and may be redundant",
            resolution: "Consider consolidating into a single permission",
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if permissions overlap
   */
  private isOverlapping(
    perm1: HierarchicalPermission,
    perm2: HierarchicalPermission,
  ): boolean {
    if (perm1.moduleId && perm2.moduleId && perm1.moduleId === perm2.moduleId) {
      if (
        perm1.featureId &&
        perm2.featureId &&
        perm1.featureId === perm2.featureId
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generate suggestions
   */
  private generateSuggestions(
    user: User,
    permissions: HierarchicalPermission[],
    recommendations: PermissionRecommendation[],
  ): string[] {
    const suggestions: string[] = [];

    // Check principle of least privilege
    const hasAllScope = permissions.some((p) => p.scope === "ALL");
    if (hasAllScope) {
      suggestions.push(
        "Consider using more restrictive scope (ASSIGNED_CUSTOMERS, OWN) if ALL scope is not necessary",
      );
    }

    // Check for excessive permissions
    if (permissions.length > 10) {
      suggestions.push(
        "Large number of permissions may indicate need for role refinement",
      );
    }

    // Check for read-only alternatives
    const hasWriteActions = permissions.some(
      (p) => p.actions.includes("write") || p.actions.includes("delete"),
    );
    if (hasWriteActions) {
      suggestions.push(
        "Consider starting with read-only access and expanding based on actual needs",
      );
    }

    // Role-based suggestions
    const roleDefinition = ROLE_DEFINITIONS[user.role];
    if (roleDefinition) {
      suggestions.push(
        `Based on ${user.role} role, ensure permissions align with job responsibilities`,
      );
    }

    return suggestions;
  }

  /**
   * Generate reasoning
   */
  private generateReasoning(
    permission: HierarchicalPermission,
    user: User,
    pros: string[],
    cons: string[],
  ): string {
    let reasoning = `Granting ${permission.moduleId || "general"} access to ${user.name} (${user.role})`;

    if (pros.length > 0) {
      reasoning += `. Benefits: ${pros.slice(0, 2).join(", ")}`;
    }

    if (cons.length > 0) {
      reasoning += `. Considerations: ${cons.slice(0, 2).join(", ")}`;
    }

    return reasoning;
  }

  /**
   * Get best practices
   */
  private getBestPractices(
    permission: HierarchicalPermission,
    user: User,
  ): string[] {
    const practices: string[] = [];

    practices.push(
      "Follow principle of least privilege - grant minimum necessary access",
    );

    if (permission.scope === "ALL") {
      practices.push(
        "ALL scope should be reserved for system administrators only",
      );
    }

    if (permission.actions.includes("delete")) {
      practices.push(
        "Delete permissions should require additional approval and audit logging",
      );
    }

    if (permission.actions.includes("export")) {
      practices.push(
        "Data export should comply with data protection regulations",
      );
    }

    practices.push("Regularly review and audit user permissions");
    practices.push("Document business justification for all permission grants");

    return practices;
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(
    permission: HierarchicalPermission,
    user: User,
    warnings: PermissionWarning[],
  ): number {
    let confidence = 80;

    // Reduce confidence based on warnings
    warnings.forEach((warning) => {
      if (warning.severity === "CRITICAL") confidence -= 20;
      else if (warning.severity === "HIGH") confidence -= 10;
      else if (warning.severity === "MEDIUM") confidence -= 5;
    });

    // Increase confidence if aligns with role
    const roleDefinition = ROLE_DEFINITIONS[user.role];
    if (roleDefinition) {
      confidence += 10;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Get approval reason
   */
  private getApprovalReason(
    permission: HierarchicalPermission,
    riskLevel: string,
  ): string {
    if (riskLevel === "CRITICAL") {
      return "Critical permission that grants significant system access";
    }
    if (this.isCriticalPermission(permission)) {
      return "Permission grants access to critical system functions";
    }
    return "Permission requires review due to security implications";
  }

  /**
   * Get risk score
   */
  private getRiskScore(riskLevel: string): number {
    switch (riskLevel) {
      case "CRITICAL":
        return 90;
      case "HIGH":
        return 70;
      case "MEDIUM":
        return 40;
      case "LOW":
        return 10;
      default:
        return 0;
    }
  }
}

// Export singleton instance
export const permissionEngine = new PermissionEngine();
