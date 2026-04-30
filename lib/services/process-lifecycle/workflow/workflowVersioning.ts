/**
 * Advanced Workflow Versioning System
 * Version control for workflows with branching, merging, and rollback
 * More advanced than ServiceNow and Power Automate
 */

import type { Workflow } from "./workflowService";

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: string; // Semantic versioning: major.minor.patch
  workflow: Workflow;
  changes: VersionChange[];
  author: string;
  message: string;
  createdAt: Date;
  isActive: boolean;
  isPublished: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface VersionChange {
  type: "added" | "modified" | "deleted" | "moved";
  path: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

export interface VersionDiff {
  fromVersion: string;
  toVersion: string;
  changes: VersionChange[];
  summary: {
    added: number;
    modified: number;
    deleted: number;
  };
}

export interface WorkflowBranch {
  id: string;
  workflowId: string;
  name: string;
  baseVersion: string;
  versions: WorkflowVersion[];
  createdAt: Date;
  mergedAt?: Date;
  mergedInto?: string;
}

export class AdvancedWorkflowVersioning {
  private versions: Map<string, WorkflowVersion[]> = new Map(); // workflowId -> versions
  private branches: Map<string, WorkflowBranch[]> = new Map(); // workflowId -> branches
  private activeVersions: Map<string, string> = new Map(); // workflowId -> active version

  /**
   * Create version
   */
  async createVersion(
    workflow: Workflow,
    author: string,
    message: string,
    baseVersion?: string,
  ): Promise<WorkflowVersion> {
    const workflowVersions = this.versions.get(workflow.id) || [];
    const latestVersion =
      workflowVersions.length > 0
        ? workflowVersions[workflowVersions.length - 1]
        : null;

    // Calculate next version
    const nextVersion = this.calculateNextVersion(latestVersion, baseVersion);

    // Calculate changes
    const changes = latestVersion
      ? this.calculateChanges(latestVersion.workflow, workflow)
      : this.calculateInitialChanges(workflow);

    const version: WorkflowVersion = {
      id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      workflowId: workflow.id,
      version: nextVersion,
      workflow: { ...workflow },
      changes,
      author,
      message,
      createdAt: new Date(),
      isActive: false,
      isPublished: false,
    };

    workflowVersions.push(version);
    this.versions.set(workflow.id, workflowVersions);

    console.log(
      `✅ Created version ${nextVersion} for workflow ${workflow.id}`,
    );
    return version;
  }

  /**
   * Calculate next version
   */
  private calculateNextVersion(
    latestVersion: WorkflowVersion | null,
    baseVersion?: string,
  ): string {
    if (baseVersion) {
      // Branch from specific version
      const [major, minor, patch] = baseVersion.split(".").map(Number);
      return `${major}.${minor}.${patch + 1}`;
    }

    if (!latestVersion) {
      return "1.0.0";
    }

    const [major, minor, patch] = latestVersion.version.split(".").map(Number);

    // Determine version bump based on changes
    const hasBreakingChanges = latestVersion.changes.some(
      (c) => c.type === "deleted" || c.path.includes("triggers"),
    );

    if (hasBreakingChanges) {
      return `${major + 1}.0.0`; // Major version
    } else if (latestVersion.changes.some((c) => c.type === "added")) {
      return `${major}.${minor + 1}.0`; // Minor version
    } else {
      return `${major}.${minor}.${patch + 1}`; // Patch version
    }
  }

  /**
   * Calculate changes
   */
  private calculateChanges(
    oldWorkflow: Workflow,
    newWorkflow: Workflow,
  ): VersionChange[] {
    const changes: VersionChange[] = [];

    // Compare steps
    const oldSteps = new Map(oldWorkflow.steps.map((s) => [s.id, s]));
    const newSteps = new Map(newWorkflow.steps.map((s) => [s.id, s]));

    // Find added steps
    newSteps.forEach((step, id) => {
      if (!oldSteps.has(id)) {
        changes.push({
          type: "added",
          path: `steps.${id}`,
          newValue: step,
          description: `Added step: ${step.name}`,
        });
      }
    });

    // Find deleted steps
    oldSteps.forEach((step, id) => {
      if (!newSteps.has(id)) {
        changes.push({
          type: "deleted",
          path: `steps.${id}`,
          oldValue: step,
          description: `Deleted step: ${step.name}`,
        });
      }
    });

    // Find modified steps
    oldSteps.forEach((oldStep, id) => {
      const newStep = newSteps.get(id);
      if (newStep && JSON.stringify(oldStep) !== JSON.stringify(newStep)) {
        changes.push({
          type: "modified",
          path: `steps.${id}`,
          oldValue: oldStep,
          newValue: newStep,
          description: `Modified step: ${oldStep.name}`,
        });
      }
    });

    // Compare triggers
    if (
      JSON.stringify(oldWorkflow.triggers) !==
      JSON.stringify(newWorkflow.triggers)
    ) {
      changes.push({
        type: "modified",
        path: "triggers",
        oldValue: oldWorkflow.triggers,
        newValue: newWorkflow.triggers,
        description: "Modified workflow triggers",
      });
    }

    // Compare name/description
    if (oldWorkflow.name !== newWorkflow.name) {
      changes.push({
        type: "modified",
        path: "name",
        oldValue: oldWorkflow.name,
        newValue: newWorkflow.name,
        description: `Renamed workflow: ${oldWorkflow.name} -> ${newWorkflow.name}`,
      });
    }

    return changes;
  }

  /**
   * Calculate initial changes
   */
  private calculateInitialChanges(workflow: Workflow): VersionChange[] {
    return [
      {
        type: "added",
        path: "workflow",
        newValue: workflow,
        description: "Initial workflow creation",
      },
    ];
  }

  /**
   * Get version
   */
  async getVersion(
    workflowId: string,
    version: string,
  ): Promise<WorkflowVersion | null> {
    const versions = this.versions.get(workflowId) || [];
    return versions.find((v) => v.version === version) || null;
  }

  /**
   * List versions
   */
  async listVersions(workflowId: string): Promise<WorkflowVersion[]> {
    return this.versions.get(workflowId) || [];
  }

  /**
   * Compare versions
   */
  async compareVersions(
    workflowId: string,
    fromVersion: string,
    toVersion: string,
  ): Promise<VersionDiff> {
    const from = await this.getVersion(workflowId, fromVersion);
    const to = await this.getVersion(workflowId, toVersion);

    if (!from || !to) {
      throw new Error("Version not found");
    }

    const changes = this.calculateChanges(from.workflow, to.workflow);

    return {
      fromVersion,
      toVersion,
      changes,
      summary: {
        added: changes.filter((c) => c.type === "added").length,
        modified: changes.filter((c) => c.type === "modified").length,
        deleted: changes.filter((c) => c.type === "deleted").length,
      },
    };
  }

  /**
   * Activate version
   */
  async activateVersion(workflowId: string, version: string): Promise<void> {
    const versionObj = await this.getVersion(workflowId, version);
    if (!versionObj) {
      throw new Error("Version not found");
    }

    // Deactivate current version
    const versions = this.versions.get(workflowId) || [];
    versions.forEach((v) => {
      v.isActive = false;
    });

    // Activate new version
    versionObj.isActive = true;
    this.activeVersions.set(workflowId, version);

    console.log(`✅ Activated version ${version} for workflow ${workflowId}`);
  }

  /**
   * Publish version
   */
  async publishVersion(workflowId: string, version: string): Promise<void> {
    const versionObj = await this.getVersion(workflowId, version);
    if (!versionObj) {
      throw new Error("Version not found");
    }

    versionObj.isPublished = true;
    await this.activateVersion(workflowId, version);

    console.log(`✅ Published version ${version} for workflow ${workflowId}`);
  }

  /**
   * Rollback to version
   */
  async rollback(workflowId: string, targetVersion: string): Promise<Workflow> {
    const target = await this.getVersion(workflowId, targetVersion);
    if (!target) {
      throw new Error("Version not found");
    }

    // Create new version from rollback
    const rolledBack = await this.createVersion(
      target.workflow,
      "system",
      `Rollback to version ${targetVersion}`,
    );

    await this.activateVersion(workflowId, rolledBack.version);

    return rolledBack.workflow;
  }

  /**
   * Create branch
   */
  async createBranch(
    workflowId: string,
    branchName: string,
    baseVersion: string,
  ): Promise<WorkflowBranch> {
    const base = await this.getVersion(workflowId, baseVersion);
    if (!base) {
      throw new Error("Base version not found");
    }

    const branch: WorkflowBranch = {
      id: `branch-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      workflowId,
      name: branchName,
      baseVersion,
      versions: [],
      createdAt: new Date(),
    };

    const branches = this.branches.get(workflowId) || [];
    branches.push(branch);
    this.branches.set(workflowId, branches);

    console.log(`✅ Created branch ${branchName} for workflow ${workflowId}`);
    return branch;
  }

  /**
   * Merge branch
   */
  async mergeBranch(
    workflowId: string,
    branchId: string,
    targetVersion: string,
  ): Promise<WorkflowVersion> {
    const branches = this.branches.get(workflowId) || [];
    const branch = branches.find((b) => b.id === branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }

    const target = await this.getVersion(workflowId, targetVersion);
    if (!target) {
      throw new Error("Target version not found");
    }

    // Get latest version from branch
    const branchLatest = branch.versions[branch.versions.length - 1];
    if (!branchLatest) {
      throw new Error("Branch has no versions");
    }

    // Merge workflows (simplified - would need conflict resolution)
    const mergedWorkflow = this.mergeWorkflows(
      target.workflow,
      branchLatest.workflow,
    );

    // Create merged version
    const merged = await this.createVersion(
      mergedWorkflow,
      "system",
      `Merged branch ${branch.name} into ${targetVersion}`,
    );

    branch.mergedAt = new Date();
    branch.mergedInto = merged.version;

    return merged;
  }

  /**
   * Merge workflows
   */
  private mergeWorkflows(workflow1: Workflow, workflow2: Workflow): Workflow {
    // Simplified merge - in production would handle conflicts
    return {
      ...workflow1,
      steps: [
        ...workflow1.steps,
        ...workflow2.steps.filter(
          (s2) => !workflow1.steps.some((s1) => s1.id === s2.id),
        ),
      ],
      triggers: [...workflow1.triggers, ...workflow2.triggers],
    };
  }

  /**
   * Get active version
   */
  getActiveVersion(workflowId: string): string | null {
    return this.activeVersions.get(workflowId) || null;
  }

  /**
   * Get version history
   */
  getVersionHistory(workflowId: string, limit: number = 50): WorkflowVersion[] {
    const versions = this.versions.get(workflowId) || [];
    return versions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

// Singleton instance
export const workflowVersioning = new AdvancedWorkflowVersioning();

export default workflowVersioning;
