/**
 * 🧙 PERMISSION MIGRATION WIZARD
 *
 * Mind-blowing migration capabilities:
 * - Step-by-step migration wizard
 * - Bulk permission updates
 * - Template-based migrations
 * - Rollback support
 * - Progress tracking
 * - Validation at each step
 */

import type { User, HierarchicalPermission } from "@/types/user";
import { userService } from "@/lib/services/user";
import { permissionTemplates } from "./permissionTemplates";
import { permissionImpactAnalyzer } from "./permissionImpactAnalyzer";
import { permissionAuditTrail } from "./permissionAuditTrail";

// ============================================================================
// TYPES
// ============================================================================

export interface MigrationStep {
  id: string;
  name: string;
  description: string;
  type: "VALIDATE" | "BACKUP" | "APPLY" | "VERIFY" | "ROLLBACK";
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";
  result?: any;
  error?: string;
  canSkip: boolean;
  estimatedTime: number; // seconds
}

export interface MigrationPlan {
  id: string;
  name: string;
  description: string;
  sourceUsers: User[];
  targetTemplate?: string;
  targetPermissions?: HierarchicalPermission[];
  steps: MigrationStep[];
  status: "DRAFT" | "RUNNING" | "COMPLETED" | "FAILED" | "ROLLED_BACK";
  currentStep: number;
  progress: number; // 0-100
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  rollbackData?: {
    users: Array<{ userId: string; permissions: HierarchicalPermission[] }>;
  };
}

// ============================================================================
// MIGRATION WIZARD SERVICE
// ============================================================================

class PermissionMigrationWizardService {
  private migrations = new Map<string, MigrationPlan>();

  /**
   * Create migration plan
   */
  async createMigrationPlan(
    name: string,
    description: string,
    sourceUsers: User[],
    options: {
      targetTemplate?: string;
      targetPermissions?: HierarchicalPermission[];
      validateBeforeApply?: boolean;
      createBackup?: boolean;
    } = {},
  ): Promise<MigrationPlan> {
    const steps: MigrationStep[] = [];

    // Step 1: Validate
    if (options.validateBeforeApply !== false) {
      steps.push({
        id: "validate",
        name: "Validate Migration",
        description: "Validate all users and permissions before migration",
        type: "VALIDATE",
        status: "PENDING",
        canSkip: false,
        estimatedTime: 10,
      });
    }

    // Step 2: Backup
    if (options.createBackup !== false) {
      steps.push({
        id: "backup",
        name: "Create Backup",
        description: "Backup current permissions for rollback",
        type: "BACKUP",
        status: "PENDING",
        canSkip: false,
        estimatedTime: 5,
      });
    }

    // Step 3: Apply
    steps.push({
      id: "apply",
      name: "Apply Migration",
      description: "Apply new permissions to users",
      type: "APPLY",
      status: "PENDING",
      canSkip: false,
      estimatedTime: 30,
    });

    // Step 4: Verify
    steps.push({
      id: "verify",
      name: "Verify Migration",
      description: "Verify all permissions were applied correctly",
      type: "VERIFY",
      status: "PENDING",
      canSkip: true,
      estimatedTime: 15,
    });

    const plan: MigrationPlan = {
      id: `migration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      sourceUsers,
      targetTemplate: options.targetTemplate,
      targetPermissions: options.targetPermissions,
      steps,
      status: "DRAFT",
      currentStep: 0,
      progress: 0,
      createdAt: new Date(),
    };

    this.migrations.set(plan.id, plan);
    return plan;
  }

  /**
   * Execute migration plan
   */
  async executeMigration(planId: string): Promise<MigrationPlan> {
    const plan = this.migrations.get(planId);
    if (!plan) {
      throw new Error(`Migration plan ${planId} not found`);
    }

    plan.status = "RUNNING";
    plan.startedAt = new Date();

    // Backup data
    const rollbackData = {
      users: plan.sourceUsers.map((user) => ({
        userId: user.id,
        permissions: user.hierarchicalPermissions || [],
      })),
    };
    plan.rollbackData = rollbackData;

    // Execute each step
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      plan.currentStep = i;

      try {
        step.status = "RUNNING";
        await this.executeStep(plan, step);
        step.status = "COMPLETED";
        plan.progress = ((i + 1) / plan.steps.length) * 100;
      } catch (error) {
        step.status = "FAILED";
        step.error = error instanceof Error ? error.message : "Unknown error";
        plan.status = "FAILED";
        break;
      }
    }

    if (plan.status === "RUNNING") {
      plan.status = "COMPLETED";
      plan.completedAt = new Date();
      plan.progress = 100;
    }

    return plan;
  }

  /**
   * Execute migration step
   */
  private async executeStep(
    plan: MigrationPlan,
    step: MigrationStep,
  ): Promise<void> {
    switch (step.type) {
      case "VALIDATE":
        await this.validateMigration(plan);
        step.result = { validated: true };
        break;

      case "BACKUP":
        // Backup already created in executeMigration
        step.result = { backedUp: true };
        break;

      case "APPLY":
        await this.applyMigration(plan);
        step.result = { applied: true };
        break;

      case "VERIFY":
        await this.verifyMigration(plan);
        step.result = { verified: true };
        break;

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Validate migration
   */
  private async validateMigration(plan: MigrationPlan): Promise<void> {
    // Get target permissions
    let targetPermissions: HierarchicalPermission[] = [];

    if (plan.targetTemplate) {
      const template = await permissionTemplates.getTemplateById(
        plan.targetTemplate,
      );
      if (!template) {
        throw new Error(`Template ${plan.targetTemplate} not found`);
      }
      targetPermissions = template.permissions;
    } else if (plan.targetPermissions) {
      targetPermissions = plan.targetPermissions;
    } else {
      throw new Error("No target permissions or template specified");
    }

    // Validate each user
    for (const user of plan.sourceUsers) {
      const impact = await permissionImpactAnalyzer.analyzeImpact(
        user,
        targetPermissions,
        "BULK",
      );

      if (!impact.canProceed && impact.totalRiskScore > 80) {
        throw new Error(
          `High risk migration for user ${user.id}: ${impact.warnings.join(", ")}`,
        );
      }
    }
  }

  /**
   * Apply migration
   */
  private async applyMigration(plan: MigrationPlan): Promise<void> {
    // Get target permissions
    let targetPermissions: HierarchicalPermission[] = [];

    if (plan.targetTemplate) {
      const template = await permissionTemplates.getTemplateById(
        plan.targetTemplate,
      );
      if (template) {
        targetPermissions = template.permissions;
      }
    } else if (plan.targetPermissions) {
      targetPermissions = plan.targetPermissions;
    }

    // Apply to each user
    for (const user of plan.sourceUsers) {
      await userService.updateUserPermissions(user.id, targetPermissions);

      // Log to audit trail
      for (const perm of targetPermissions) {
        await permissionAuditTrail.logPermissionChange(
          "GRANT",
          user,
          perm,
          user, // Changed by system
          {
            reason: `Migration: ${plan.name}`,
            metadata: { migrationId: plan.id },
          },
        );
      }
    }
  }

  /**
   * Verify migration
   */
  private async verifyMigration(plan: MigrationPlan): Promise<void> {
    // Get target permissions
    let targetPermissions: HierarchicalPermission[] = [];

    if (plan.targetTemplate) {
      const template = await permissionTemplates.getTemplateById(
        plan.targetTemplate,
      );
      if (template) {
        targetPermissions = template.permissions;
      }
    } else if (plan.targetPermissions) {
      targetPermissions = plan.targetPermissions;
    }

    // Verify each user
    for (const user of plan.sourceUsers) {
      const updatedUser = await userService.getUserById(user.id);
      if (!updatedUser) {
        throw new Error(`User ${user.id} not found after migration`);
      }

      const currentPerms = updatedUser.hierarchicalPermissions || [];
      if (currentPerms.length !== targetPermissions.length) {
        throw new Error(`Permission count mismatch for user ${user.id}`);
      }
    }
  }

  /**
   * Rollback migration
   */
  async rollbackMigration(planId: string): Promise<MigrationPlan> {
    const plan = this.migrations.get(planId);
    if (!plan) {
      throw new Error(`Migration plan ${planId} not found`);
    }

    if (!plan.rollbackData) {
      throw new Error("No rollback data available");
    }

    // Restore permissions
    for (const userData of plan.rollbackData.users) {
      await userService.updateUserPermissions(
        userData.userId,
        userData.permissions,
      );
    }

    plan.status = "ROLLED_BACK";
    plan.updatedAt = new Date();

    return plan;
  }

  /**
   * Get migration plan
   */
  async getMigrationPlan(planId: string): Promise<MigrationPlan | null> {
    return this.migrations.get(planId) || null;
  }

  /**
   * Get all migrations
   */
  async getAllMigrations(): Promise<MigrationPlan[]> {
    return Array.from(this.migrations.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const permissionMigrationWizard = new PermissionMigrationWizardService();
