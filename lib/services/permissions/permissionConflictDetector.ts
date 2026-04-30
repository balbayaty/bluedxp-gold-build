/**
 * 🔍 PERMISSION CONFLICT DETECTOR
 *
 * Intelligent conflict detection:
 * - Detects conflicting permissions
 * - Identifies redundant permissions
 * - Finds permission gaps
 * - Suggests auto-resolution
 * - Real-time conflict checking
 */

import type {
  User,
  HierarchicalPermission,
  ModuleId,
  FeatureId,
  TabId,
} from "@/types/user";

// ============================================================================
// TYPES
// ============================================================================

export interface PermissionConflict {
  type: "OVERLAPPING" | "CONTRADICTORY" | "REDUNDANT" | "GAP" | "EXCESSIVE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  permissions: HierarchicalPermission[];
  description: string;
  impact: string;
  resolution: string;
  autoResolvable: boolean;
  suggestedFix?: HierarchicalPermission[];
}

export interface ConflictAnalysis {
  userId: string;
  conflicts: PermissionConflict[];
  riskScore: number; // 0-100
  efficiencyScore: number; // 0-100
  suggestions: string[];
  canAutoResolve: boolean;
}

// ============================================================================
// CONFLICT DETECTOR SERVICE
// ============================================================================

class PermissionConflictDetectorService {
  /**
   * Analyze user permissions for conflicts
   */
  async analyzeConflicts(user: User): Promise<ConflictAnalysis> {
    const permissions = user.hierarchicalPermissions || [];
    const conflicts: PermissionConflict[] = [];

    // 1. Detect overlapping permissions
    const overlapping = this.detectOverlappingPermissions(permissions);
    conflicts.push(...overlapping);

    // 2. Detect contradictory permissions
    const contradictory = this.detectContradictoryPermissions(permissions);
    conflicts.push(...contradictory);

    // 3. Detect redundant permissions
    const redundant = this.detectRedundantPermissions(permissions);
    conflicts.push(...redundant);

    // 4. Detect permission gaps
    const gaps = this.detectPermissionGaps(user, permissions);
    conflicts.push(...gaps);

    // 5. Detect excessive permissions
    const excessive = this.detectExcessivePermissions(user, permissions);
    conflicts.push(...excessive);

    // Calculate scores
    const riskScore = this.calculateRiskScore(conflicts);
    const efficiencyScore = this.calculateEfficiencyScore(
      conflicts,
      permissions.length,
    );
    const canAutoResolve = conflicts.some((c) => c.autoResolvable);

    // Generate suggestions
    const suggestions = this.generateSuggestions(conflicts);

    return {
      userId: user.id,
      conflicts: this.prioritizeConflicts(conflicts),
      riskScore,
      efficiencyScore,
      suggestions,
      canAutoResolve,
    };
  }

  /**
   * Detect overlapping permissions
   */
  private detectOverlappingPermissions(
    permissions: HierarchicalPermission[],
  ): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < permissions.length; i++) {
      for (let j = i + 1; j < permissions.length; j++) {
        const perm1 = permissions[i];
        const perm2 = permissions[j];

        const key1 = this.getPermissionKey(perm1);
        const key2 = this.getPermissionKey(perm2);

        if (key1 === key2 && !seen.has(key1)) {
          seen.add(key1);
          conflicts.push({
            type: "OVERLAPPING",
            severity: "MEDIUM",
            permissions: [perm1, perm2],
            description: `Duplicate permissions found for ${key1}`,
            impact: "May cause confusion and maintenance issues",
            resolution: "Remove duplicate permission",
            autoResolvable: true,
            suggestedFix: [perm1], // Keep first one
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect contradictory permissions
   */
  private detectContradictoryPermissions(
    permissions: HierarchicalPermission[],
  ): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];

    for (let i = 0; i < permissions.length; i++) {
      for (let j = i + 1; j < permissions.length; j++) {
        const perm1 = permissions[i];
        const perm2 = permissions[j];

        // Check if same resource but different access levels
        if (
          perm1.moduleId === perm2.moduleId &&
          perm1.featureId === perm2.featureId &&
          perm1.tabId === perm2.tabId &&
          perm1.moduleAccess !== perm2.moduleAccess
        ) {
          conflicts.push({
            type: "CONTRADICTORY",
            severity: "HIGH",
            permissions: [perm1, perm2],
            description: `Contradictory access levels for ${this.getPermissionKey(perm1)}`,
            impact: "Unclear which permission takes precedence",
            resolution: "Resolve conflict by choosing appropriate access level",
            autoResolvable: true,
            suggestedFix: [
              {
                ...perm1,
                moduleAccess:
                  perm1.moduleAccess === "full"
                    ? perm1.moduleAccess
                    : perm2.moduleAccess,
              },
            ],
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect redundant permissions
   */
  private detectRedundantPermissions(
    permissions: HierarchicalPermission[],
  ): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];

    permissions.forEach((perm) => {
      // If user has module-level full access, feature/tab permissions are redundant
      if (perm.moduleAccess === "full" && !perm.featureId && !perm.tabId) {
        const redundant = permissions.filter(
          (p) =>
            p.moduleId === perm.moduleId &&
            p.featureId &&
            p.moduleAccess !== "none",
        );

        if (redundant.length > 0) {
          conflicts.push({
            type: "REDUNDANT",
            severity: "LOW",
            permissions: [perm, ...redundant],
            description: `Module-level full access makes feature/tab permissions redundant`,
            impact: "Unnecessary permission complexity",
            resolution: "Remove redundant feature/tab permissions",
            autoResolvable: true,
            suggestedFix: [perm], // Keep module-level only
          });
        }
      }
    });

    return conflicts;
  }

  /**
   * Detect permission gaps
   */
  private detectPermissionGaps(
    user: User,
    permissions: HierarchicalPermission[],
  ): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];

    // Check if user has feature access but no module access
    permissions.forEach((perm) => {
      if (perm.featureId && !perm.moduleId) {
        const hasModuleAccess = permissions.some(
          (p) => p.moduleId && !p.featureId && p.moduleAccess !== "none",
        );

        if (!hasModuleAccess) {
          conflicts.push({
            type: "GAP",
            severity: "MEDIUM",
            permissions: [perm],
            description: `Feature permission without module access`,
            impact: "Permission may not work correctly",
            resolution: "Add module-level permission",
            autoResolvable: true,
            suggestedFix: [
              {
                moduleId: perm.featureId.split(".")[0] as ModuleId,
                moduleAccess: "read_only",
                actions: ["read"],
                scope: "TENANT",
              },
              perm,
            ],
          });
        }
      }
    });

    return conflicts;
  }

  /**
   * Detect excessive permissions
   */
  private detectExcessivePermissions(
    user: User,
    permissions: HierarchicalPermission[],
  ): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];

    // Check for too many full-access permissions
    const fullAccessCount = permissions.filter(
      (p) => p.moduleAccess === "full",
    ).length;

    if (fullAccessCount > 5 && user.role !== "SYSTEM_ADMIN") {
      conflicts.push({
        type: "EXCESSIVE",
        severity: "HIGH",
        permissions: permissions.filter((p) => p.moduleAccess === "full"),
        description: `User has ${fullAccessCount} full-access permissions`,
        impact: "Security risk - principle of least privilege violated",
        resolution: "Review and downgrade unnecessary full-access permissions",
        autoResolvable: false,
      });
    }

    return conflicts;
  }

  /**
   * Auto-resolve conflicts
   */
  async autoResolveConflicts(
    user: User,
    conflicts: PermissionConflict[],
  ): Promise<HierarchicalPermission[]> {
    let resolvedPermissions = [...(user.hierarchicalPermissions || [])];

    const autoResolvable = conflicts.filter((c) => c.autoResolvable);

    for (const conflict of autoResolvable) {
      if (conflict.suggestedFix) {
        // Remove conflicting permissions
        conflict.permissions.forEach((conflictPerm) => {
          resolvedPermissions = resolvedPermissions.filter(
            (perm) => !this.permissionsEqual(perm, conflictPerm),
          );
        });

        // Add suggested fix
        resolvedPermissions.push(...conflict.suggestedFix);
      }
    }

    // Remove duplicates
    const unique: HierarchicalPermission[] = [];
    const seen = new Set<string>();

    resolvedPermissions.forEach((perm) => {
      const key = this.getPermissionKey(perm);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(perm);
      }
    });

    return unique;
  }

  // Helper methods
  private getPermissionKey(perm: HierarchicalPermission): string {
    return `${perm.moduleId}${perm.featureId ? `.${perm.featureId}` : ""}${perm.tabId ? `.${perm.tabId}` : ""}`;
  }

  private permissionsEqual(
    p1: HierarchicalPermission,
    p2: HierarchicalPermission,
  ): boolean {
    return (
      p1.moduleId === p2.moduleId &&
      p1.featureId === p2.featureId &&
      p1.tabId === p2.tabId
    );
  }

  private calculateRiskScore(conflicts: PermissionConflict[]): number {
    const severityScores = { LOW: 10, MEDIUM: 30, HIGH: 60, CRITICAL: 100 };
    const totalScore = conflicts.reduce(
      (sum, c) => sum + severityScores[c.severity],
      0,
    );
    return Math.min(100, totalScore / conflicts.length || 0);
  }

  private calculateEfficiencyScore(
    conflicts: PermissionConflict[],
    totalPermissions: number,
  ): number {
    const conflictCount = conflicts.length;
    const efficiency = Math.max(
      0,
      100 - (conflictCount / totalPermissions) * 100,
    );
    return Math.round(efficiency);
  }

  private generateSuggestions(conflicts: PermissionConflict[]): string[] {
    const suggestions: string[] = [];

    if (conflicts.some((c) => c.type === "EXCESSIVE")) {
      suggestions.push(
        "Review excessive permissions and apply principle of least privilege",
      );
    }

    if (conflicts.some((c) => c.autoResolvable)) {
      suggestions.push(
        `${conflicts.filter((c) => c.autoResolvable).length} conflicts can be auto-resolved`,
      );
    }

    if (conflicts.some((c) => c.type === "GAP")) {
      suggestions.push("Fill permission gaps to ensure proper access");
    }

    return suggestions;
  }

  private prioritizeConflicts(
    conflicts: PermissionConflict[],
  ): PermissionConflict[] {
    const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return conflicts.sort(
      (a, b) => severityOrder[b.severity] - severityOrder[a.severity],
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const permissionConflictDetector =
  new PermissionConflictDetectorService();
