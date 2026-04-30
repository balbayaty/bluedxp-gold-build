/**
 * Advanced Conformance Checking Engine
 * Compare actual process execution against ideal process model
 * More advanced than Celonis conformance checking
 */

import type {
  EntityLifecycle,
  LifecycleStage,
  StageTransition,
} from "@/types/lifecycle";
import type { LifecycleConfig } from "@/types/lifecycle";

export interface IdealProcessModel {
  entityType: string;
  stages: IdealStage[];
  transitions: IdealTransition[];
  rules: ProcessRule[];
  metadata?: Record<string, any>;
}

export interface IdealStage {
  id: string;
  name: string;
  order: number;
  isRequired: boolean;
  canSkip: boolean;
  estimatedDuration?: number;
  dependencies?: string[]; // Stage IDs that must complete before this
  parallelAllowed?: boolean;
}

export interface IdealTransition {
  from: string;
  to: string;
  conditions?: string[];
  isRequired: boolean;
}

export interface ProcessRule {
  id: string;
  type: "sequence" | "parallel" | "conditional" | "loop" | "deadline";
  description: string;
  validation: (actual: EntityLifecycle, ideal: IdealProcessModel) => boolean;
}

export interface Deviation {
  id: string;
  type:
    | "skipped"
    | "out_of_order"
    | "missing"
    | "extra"
    | "timing"
    | "parallel_violation";
  severity: "low" | "medium" | "high" | "critical";
  stageId: string;
  expectedPosition: number;
  actualPosition: number | null;
  expectedTimestamp?: Date;
  actualTimestamp?: Date;
  impact: string;
  recommendation: string;
  relatedDeviations?: string[];
}

export interface ConformanceResult {
  entityId: string;
  entityType: string;
  conformanceScore: number; // 0-100
  deviations: Deviation[];
  statistics: {
    totalStages: number;
    completedStages: number;
    skippedStages: number;
    outOfOrderStages: number;
    extraStages: number;
    averageStageDuration: number;
    totalDuration: number;
    idealDuration: number;
    efficiency: number; // percentage
  };
  recommendations: string[];
  timestamp: Date;
}

export class AdvancedConformanceChecker {
  private idealModels: Map<string, IdealProcessModel> = new Map();

  /**
   * Register ideal process model
   */
  registerIdealModel(model: IdealProcessModel): void {
    this.idealModels.set(model.entityType, model);
    console.log(`✅ Registered ideal model for ${model.entityType}`);
  }

  /**
   * Get ideal model
   */
  getIdealModel(entityType: string): IdealProcessModel | null {
    return this.idealModels.get(entityType) || null;
  }

  /**
   * Check conformance
   */
  async checkConformance(
    actual: EntityLifecycle,
    ideal?: IdealProcessModel,
  ): Promise<ConformanceResult> {
    const model = ideal || this.getIdealModel(actual.entityType);
    if (!model) {
      throw new Error(`No ideal model found for ${actual.entityType}`);
    }

    const deviations: Deviation[] = [];
    const stagePositions = new Map<string, number>();
    const stageTimestamps = new Map<string, Date>();

    // Build actual stage positions and timestamps
    actual.stages.forEach((stage, index) => {
      stagePositions.set(stage.stageId, index);
      if (stage.startedAt) {
        stageTimestamps.set(stage.stageId, new Date(stage.startedAt));
      }
    });

    // Check for skipped stages
    model.stages.forEach((idealStage) => {
      if (idealStage.isRequired && !idealStage.canSkip) {
        const actualStage = actual.stages.find(
          (s) => s.stageId === idealStage.id,
        );
        if (!actualStage || actualStage.status !== "COMPLETED") {
          deviations.push({
            id: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: "skipped",
            severity: idealStage.isRequired ? "critical" : "high",
            stageId: idealStage.id,
            expectedPosition: idealStage.order,
            actualPosition: null,
            impact: `Required stage ${idealStage.name} was skipped`,
            recommendation: `Complete stage ${idealStage.name} to maintain process compliance`,
          });
        }
      }
    });

    // Check for out-of-order stages
    actual.stages.forEach((actualStage, actualIndex) => {
      const idealStage = model.stages.find((s) => s.id === actualStage.stageId);
      if (idealStage) {
        const expectedIndex = idealStage.order - 1; // Convert to 0-based
        if (actualIndex !== expectedIndex) {
          deviations.push({
            id: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: "out_of_order",
            severity: idealStage.isRequired ? "high" : "medium",
            stageId: actualStage.stageId,
            expectedPosition: expectedIndex,
            actualPosition: actualIndex,
            impact: `Stage ${idealStage.name} executed out of order`,
            recommendation: `Review process flow - stage should execute at position ${expectedIndex + 1}`,
          });
        }
      }
    });

    // Check for extra stages (not in ideal model)
    actual.stages.forEach((actualStage) => {
      const idealStage = model.stages.find((s) => s.id === actualStage.stageId);
      if (!idealStage) {
        deviations.push({
          id: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "extra",
          severity: "low",
          stageId: actualStage.stageId,
          expectedPosition: -1,
          actualPosition: stagePositions.get(actualStage.stageId) || -1,
          impact: `Stage ${actualStage.stageId} not in ideal process model`,
          recommendation: `Review if this stage should be part of the standard process`,
        });
      }
    });

    // Check timing deviations
    actual.stages.forEach((actualStage) => {
      const idealStage = model.stages.find((s) => s.id === actualStage.stageId);
      if (
        idealStage &&
        idealStage.estimatedDuration &&
        actualStage.startedAt &&
        actualStage.completedAt
      ) {
        const actualDuration =
          new Date(actualStage.completedAt).getTime() -
          new Date(actualStage.startedAt).getTime();
        const idealDuration = idealStage.estimatedDuration * 1000; // Convert to milliseconds
        const deviation =
          Math.abs(actualDuration - idealDuration) / idealDuration;

        if (deviation > 0.2) {
          // More than 20% deviation
          deviations.push({
            id: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: "timing",
            severity: deviation > 0.5 ? "high" : "medium",
            stageId: actualStage.stageId,
            expectedPosition: idealStage.order,
            actualPosition: stagePositions.get(actualStage.stageId) || -1,
            expectedTimestamp: actualStage.startedAt
              ? new Date(
                  new Date(actualStage.startedAt).getTime() + idealDuration,
                )
              : undefined,
            actualTimestamp: actualStage.completedAt
              ? new Date(actualStage.completedAt)
              : undefined,
            impact: `Stage ${idealStage.name} took ${deviation > 0 ? "longer" : "shorter"} than expected`,
            recommendation: `Optimize stage ${idealStage.name} to meet target duration`,
          });
        }
      }
    });

    // Check parallel violations
    this.checkParallelViolations(actual, model, deviations);

    // Check process rules
    model.rules.forEach((rule) => {
      if (!rule.validation(actual, model)) {
        deviations.push({
          id: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "extra",
          severity: "medium",
          stageId: "rule-violation",
          expectedPosition: -1,
          actualPosition: -1,
          impact: `Process rule violated: ${rule.description}`,
          recommendation: `Review and fix process rule: ${rule.id}`,
        });
      }
    });

    // Calculate conformance score
    const conformanceScore = this.calculateConformanceScore(
      actual,
      model,
      deviations,
    );

    // Calculate statistics
    const statistics = this.calculateStatistics(actual, model);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      deviations,
      statistics,
    );

    return {
      entityId: actual.entityId,
      entityType: actual.entityType,
      conformanceScore,
      deviations,
      statistics,
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Check parallel violations
   */
  private checkParallelViolations(
    actual: EntityLifecycle,
    ideal: IdealProcessModel,
    deviations: Deviation[],
  ): void {
    // Find stages that should be parallel
    const parallelGroups = ideal.stages
      .filter((s) => s.parallelAllowed)
      .reduce((groups, stage) => {
        const group = stage.dependencies?.join("-") || "default";
        if (!groups.has(group)) {
          groups.set(group, []);
        }
        groups.get(group)!.push(stage);
        return groups;
      }, new Map<string, IdealStage[]>());

    // Check if parallel stages were executed sequentially
    parallelGroups.forEach((stages, group) => {
      if (stages.length > 1) {
        const actualStages = stages
          .map((s) => actual.stages.find((as) => as.stageId === s.id))
          .filter(Boolean) as typeof actual.stages;

        if (actualStages.length > 1) {
          // Check if they overlap in time
          const sortedStages = actualStages.sort((a, b) => {
            const aStart = a.startedAt ? new Date(a.startedAt).getTime() : 0;
            const bStart = b.startedAt ? new Date(b.startedAt).getTime() : 0;
            return aStart - bStart;
          });

          for (let i = 0; i < sortedStages.length - 1; i++) {
            const current = sortedStages[i];
            const next = sortedStages[i + 1];

            if (current.completedAt && next.startedAt) {
              const currentEnd = new Date(current.completedAt).getTime();
              const nextStart = new Date(next.startedAt).getTime();

              if (nextStart > currentEnd) {
                // Sequential execution when parallel was expected
                deviations.push({
                  id: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                  type: "parallel_violation",
                  severity: "medium",
                  stageId: next.stageId,
                  expectedPosition: -1,
                  actualPosition: -1,
                  impact: `Stages should execute in parallel but were executed sequentially`,
                  recommendation: `Optimize process to execute stages ${stages.map((s) => s.name).join(", ")} in parallel`,
                });
              }
            }
          }
        }
      }
    });
  }

  /**
   * Calculate conformance score
   */
  private calculateConformanceScore(
    actual: EntityLifecycle,
    ideal: IdealProcessModel,
    deviations: Deviation[],
  ): number {
    if (deviations.length === 0) {
      return 100;
    }

    // Weight deviations by severity
    const severityWeights = {
      critical: 10,
      high: 5,
      medium: 2,
      low: 1,
    };

    let totalPenalty = 0;
    deviations.forEach((dev) => {
      totalPenalty += severityWeights[dev.severity];
    });

    // Maximum possible penalty (all stages critical)
    const maxPenalty = ideal.stages.length * severityWeights.critical;

    // Calculate score (0-100)
    const score = Math.max(0, 100 - (totalPenalty / maxPenalty) * 100);

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(
    actual: EntityLifecycle,
    ideal: IdealProcessModel,
  ): ConformanceResult["statistics"] {
    const totalStages = ideal.stages.length;
    const completedStages = actual.stages.filter(
      (s) => s.status === "COMPLETED",
    ).length;
    const skippedStages = actual.stages.filter(
      (s) => s.status === "SKIPPED",
    ).length;
    const outOfOrderStages = 0; // Calculated in deviations

    // Calculate durations
    let totalDuration = 0;
    let stageDurations: number[] = [];

    actual.stages.forEach((stage) => {
      if (stage.startedAt && stage.completedAt) {
        const duration =
          new Date(stage.completedAt).getTime() -
          new Date(stage.startedAt).getTime();
        totalDuration += duration;
        stageDurations.push(duration);
      }
    });

    const averageStageDuration =
      stageDurations.length > 0
        ? stageDurations.reduce((a, b) => a + b, 0) / stageDurations.length
        : 0;

    // Calculate ideal duration
    const idealDuration = ideal.stages.reduce((sum, stage) => {
      return sum + (stage.estimatedDuration || 0) * 1000;
    }, 0);

    // Calculate efficiency
    const efficiency =
      idealDuration > 0 ? (idealDuration / totalDuration) * 100 : 100;

    return {
      totalStages,
      completedStages,
      skippedStages,
      outOfOrderStages,
      extraStages: actual.stages.length - totalStages,
      averageStageDuration: Math.round(averageStageDuration),
      totalDuration: Math.round(totalDuration),
      idealDuration: Math.round(idealDuration),
      efficiency: Math.round(efficiency * 100) / 100,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    deviations: Deviation[],
    statistics: ConformanceResult["statistics"],
  ): string[] {
    const recommendations: string[] = [];

    // Critical deviations
    const criticalDeviations = deviations.filter(
      (d) => d.severity === "critical",
    );
    if (criticalDeviations.length > 0) {
      recommendations.push(
        `Address ${criticalDeviations.length} critical deviation(s) immediately to restore process compliance`,
      );
    }

    // Efficiency recommendations
    if (statistics.efficiency < 80) {
      recommendations.push(
        `Process efficiency is ${statistics.efficiency}% - optimize stages to improve performance`,
      );
    }

    // Skipped stages
    if (statistics.skippedStages > 0) {
      recommendations.push(
        `${statistics.skippedStages} stage(s) were skipped - review if skipping is appropriate`,
      );
    }

    // Timing recommendations
    const timingDeviations = deviations.filter((d) => d.type === "timing");
    if (timingDeviations.length > 0) {
      recommendations.push(
        `${timingDeviations.length} stage(s) have timing deviations - review and optimize durations`,
      );
    }

    return recommendations;
  }

  /**
   * Generate ideal model from lifecycle config
   */
  generateIdealModelFromConfig(config: LifecycleConfig): IdealProcessModel {
    const stages: IdealStage[] = config.stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      order: stage.order,
      isRequired: stage.isRequired,
      canSkip: stage.canSkip || false,
      estimatedDuration: stage.estimatedDuration,
      dependencies: stage.dependencies,
      parallelAllowed: stage.parallelAllowed || false,
    }));

    const transitions: IdealTransition[] = [];
    for (let i = 0; i < stages.length - 1; i++) {
      transitions.push({
        from: stages[i].id,
        to: stages[i + 1].id,
        isRequired: true,
      });
    }

    // Default rules
    const rules: ProcessRule[] = [
      {
        id: "sequential-order",
        type: "sequence",
        description: "Stages must execute in sequential order",
        validation: (actual, ideal) => {
          const actualOrder = actual.stages.map((s) => s.stageId);
          const idealOrder = ideal.stages.map((s) => s.id);
          return JSON.stringify(actualOrder) === JSON.stringify(idealOrder);
        },
      },
    ];

    return {
      entityType: config.entityType,
      stages,
      transitions,
      rules,
    };
  }
}

// Singleton instance
export const conformanceChecker = new AdvancedConformanceChecker();

export default conformanceChecker;
