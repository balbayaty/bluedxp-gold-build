/**
 * Advanced Process Cost Mining Service
 * Track and analyze costs per activity, variant, and process
 * More advanced than Celonis cost mining
 */

import type { EntityLifecycle, LifecycleStage } from "@/types/lifecycle";
import type {
  ProcessMiningCase,
  ProcessVariant,
} from "@/types/process-lifecycle";

export interface CostModel {
  entityType: string;
  activityCosts: Map<string, ActivityCost>;
  resourceCosts: Map<string, ResourceCost>;
  overheadCosts: OverheadCost[];
  metadata: {
    currency: string;
    period: { start: Date; end: Date };
    lastUpdated: Date;
  };
}

export interface ActivityCost {
  activityId: string;
  activityName: string;
  baseCost: number;
  variableCost?: number;
  costPerUnit?: number;
  averageCost: number;
  minCost: number;
  maxCost: number;
  totalCost: number;
  frequency: number;
}

export interface ResourceCost {
  resourceId: string;
  resourceName: string;
  costPerHour: number;
  costPerActivity: number;
  totalCost: number;
  utilization: number;
}

export interface OverheadCost {
  id: string;
  name: string;
  type: "fixed" | "variable" | "allocated";
  amount: number;
  allocationMethod: "equal" | "duration" | "frequency" | "custom";
}

export interface ProcessCostAnalysis {
  entityId: string;
  entityType: string;
  totalCost: number;
  activityCosts: ActivityCost[];
  resourceCosts: ResourceCost[];
  overheadCosts: number;
  costBreakdown: {
    byActivity: Map<string, number>;
    byResource: Map<string, number>;
    byStage: Map<string, number>;
  };
  costPerVariant: Map<string, VariantCost>;
  recommendations: CostRecommendation[];
  timestamp: Date;
}

export interface VariantCost {
  variantId: string;
  totalCost: number;
  averageCost: number;
  costPerCase: number;
  caseCount: number;
  activities: ActivityCost[];
}

export interface CostRecommendation {
  id: string;
  type: "reduce" | "optimize" | "eliminate" | "automate";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  potentialSavings: number;
  implementationEffort: "low" | "medium" | "high";
  impact: string;
}

export class AdvancedCostMiningService {
  private costModels: Map<string, CostModel> = new Map();

  /**
   * Register cost model
   */
  registerCostModel(model: CostModel): void {
    this.costModels.set(model.entityType, model);
    console.log(`✅ Registered cost model for ${model.entityType}`);
  }

  /**
   * Get cost model
   */
  getCostModel(entityType: string): CostModel | null {
    return this.costModels.get(entityType) || null;
  }

  /**
   * Analyze process cost
   */
  async analyzeProcessCost(
    lifecycle: EntityLifecycle,
    costModel?: CostModel,
  ): Promise<ProcessCostAnalysis> {
    const model = costModel || this.getCostModel(lifecycle.entityType);
    if (!model) {
      throw new Error(`No cost model found for ${lifecycle.entityType}`);
    }

    // Calculate activity costs
    const activityCosts = this.calculateActivityCosts(lifecycle, model);

    // Calculate resource costs
    const resourceCosts = this.calculateResourceCosts(lifecycle, model);

    // Calculate overhead costs
    const overheadCosts = this.calculateOverheadCosts(lifecycle, model);

    // Build cost breakdown
    const costBreakdown = this.buildCostBreakdown(
      lifecycle,
      activityCosts,
      resourceCosts,
    );

    // Calculate total cost
    const totalCost = this.calculateTotalCost(
      activityCosts,
      resourceCosts,
      overheadCosts,
    );

    // Generate recommendations
    const recommendations = this.generateCostRecommendations(
      lifecycle,
      activityCosts,
      resourceCosts,
      totalCost,
    );

    return {
      entityId: lifecycle.entityId,
      entityType: lifecycle.entityType,
      totalCost,
      activityCosts,
      resourceCosts,
      overheadCosts,
      costBreakdown,
      costPerVariant: new Map(), // Would be calculated from variants
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate activity costs
   */
  private calculateActivityCosts(
    lifecycle: EntityLifecycle,
    model: CostModel,
  ): ActivityCost[] {
    const activityCosts: ActivityCost[] = [];

    lifecycle.stages.forEach((stage) => {
      const activityCost = model.activityCosts.get(stage.stageId);
      if (activityCost) {
        let cost = activityCost.baseCost;

        // Add variable cost if applicable
        if (activityCost.variableCost && stage.metadata) {
          const units = stage.metadata.units || 1;
          cost += activityCost.variableCost * units;
        }

        // Add cost per unit if applicable
        if (activityCost.costPerUnit && stage.metadata) {
          const units = stage.metadata.units || 1;
          cost += activityCost.costPerUnit * units;
        }

        // Calculate duration-based cost
        if (stage.startedAt && stage.completedAt) {
          const duration =
            new Date(stage.completedAt).getTime() -
            new Date(stage.startedAt).getTime();
          const hours = duration / (1000 * 60 * 60);

          // If there's a time-based cost component
          if (activityCost.variableCost) {
            cost += activityCost.variableCost * hours;
          }
        }

        activityCosts.push({
          ...activityCost,
          totalCost: cost,
          frequency: 1,
        });
      } else {
        // Default cost if not in model
        activityCosts.push({
          activityId: stage.stageId,
          activityName: stage.stageId,
          baseCost: 0,
          averageCost: 0,
          minCost: 0,
          maxCost: 0,
          totalCost: 0,
          frequency: 1,
        });
      }
    });

    return activityCosts;
  }

  /**
   * Calculate resource costs
   */
  private calculateResourceCosts(
    lifecycle: EntityLifecycle,
    model: CostModel,
  ): ResourceCost[] {
    const resourceCosts: ResourceCost[] = [];

    model.resourceCosts.forEach((resourceCost, resourceId) => {
      // Calculate resource utilization from lifecycle
      let totalTime = 0;
      let activityCount = 0;

      lifecycle.stages.forEach((stage) => {
        if (stage.startedAt && stage.completedAt) {
          const duration =
            new Date(stage.completedAt).getTime() -
            new Date(stage.startedAt).getTime();
          totalTime += duration;
          activityCount++;
        }
      });

      const hours = totalTime / (1000 * 60 * 60);
      const cost =
        resourceCost.costPerHour * hours +
        resourceCost.costPerActivity * activityCount;

      resourceCosts.push({
        ...resourceCost,
        totalCost: cost,
        utilization: hours,
      });
    });

    return resourceCosts;
  }

  /**
   * Calculate overhead costs
   */
  private calculateOverheadCosts(
    lifecycle: EntityLifecycle,
    model: CostModel,
  ): number {
    let totalOverhead = 0;

    model.overheadCosts.forEach((overhead) => {
      let allocatedCost = 0;

      switch (overhead.allocationMethod) {
        case "equal":
          // Equal allocation across all processes
          allocatedCost = overhead.amount / 100; // Simplified
          break;

        case "duration":
          // Allocate based on duration
          const totalDuration = lifecycle.stages.reduce((sum, stage) => {
            if (stage.startedAt && stage.completedAt) {
              return (
                sum +
                (new Date(stage.completedAt).getTime() -
                  new Date(stage.startedAt).getTime())
              );
            }
            return sum;
          }, 0);
          const hours = totalDuration / (1000 * 60 * 60);
          allocatedCost = overhead.amount * (hours / 100); // Simplified
          break;

        case "frequency":
          // Allocate based on number of activities
          allocatedCost = overhead.amount * (lifecycle.stages.length / 100); // Simplified
          break;

        case "custom":
          // Custom allocation (would use custom logic)
          allocatedCost = overhead.amount * 0.01; // Default
          break;
      }

      totalOverhead += allocatedCost;
    });

    return totalOverhead;
  }

  /**
   * Build cost breakdown
   */
  private buildCostBreakdown(
    lifecycle: EntityLifecycle,
    activityCosts: ActivityCost[],
    resourceCosts: ResourceCost[],
  ): ProcessCostAnalysis["costBreakdown"] {
    const byActivity = new Map<string, number>();
    const byResource = new Map<string, number>();
    const byStage = new Map<string, number>();

    activityCosts.forEach((cost) => {
      byActivity.set(cost.activityId, cost.totalCost);
      byStage.set(cost.activityId, cost.totalCost);
    });

    resourceCosts.forEach((cost) => {
      byResource.set(cost.resourceId, cost.totalCost);
    });

    return {
      byActivity,
      byResource,
      byStage,
    };
  }

  /**
   * Calculate total cost
   */
  private calculateTotalCost(
    activityCosts: ActivityCost[],
    resourceCosts: ResourceCost[],
    overheadCosts: number,
  ): number {
    const activityTotal = activityCosts.reduce(
      (sum, cost) => sum + cost.totalCost,
      0,
    );
    const resourceTotal = resourceCosts.reduce(
      (sum, cost) => sum + cost.totalCost,
      0,
    );

    return activityTotal + resourceTotal + overheadCosts;
  }

  /**
   * Generate cost recommendations
   */
  private generateCostRecommendations(
    lifecycle: EntityLifecycle,
    activityCosts: ActivityCost[],
    resourceCosts: ResourceCost[],
    totalCost: number,
  ): CostRecommendation[] {
    const recommendations: CostRecommendation[] = [];

    // Find high-cost activities
    const highCostActivities = activityCosts
      .filter((cost) => cost.totalCost > totalCost * 0.1) // More than 10% of total
      .sort((a, b) => b.totalCost - a.totalCost);

    highCostActivities.forEach((activity) => {
      recommendations.push({
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "optimize",
        priority: activity.totalCost > totalCost * 0.2 ? "high" : "medium",
        title: `Optimize ${activity.activityName}`,
        description: `${activity.activityName} accounts for ${((activity.totalCost / totalCost) * 100).toFixed(1)}% of total cost`,
        potentialSavings: activity.totalCost * 0.2, // Assume 20% savings
        implementationEffort: "medium",
        impact: `Reducing cost of ${activity.activityName} could save ${(activity.totalCost * 0.2).toFixed(2)} per process`,
      });
    });

    // Find underutilized resources
    resourceCosts.forEach((resource) => {
      if (resource.utilization < 0.5) {
        recommendations.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "optimize",
          priority: "medium",
          title: `Optimize ${resource.resourceName} Utilization`,
          description: `${resource.resourceName} is underutilized (${(resource.utilization * 100).toFixed(1)}%)`,
          potentialSavings: resource.totalCost * 0.3,
          implementationEffort: "low",
          impact: `Better resource allocation could reduce costs`,
        });
      }
    });

    // Find long-duration stages
    lifecycle.stages.forEach((stage) => {
      if (stage.startedAt && stage.completedAt) {
        const duration =
          new Date(stage.completedAt).getTime() -
          new Date(stage.startedAt).getTime();
        const hours = duration / (1000 * 60 * 60);

        if (hours > 24) {
          // More than 24 hours
          const activityCost = activityCosts.find(
            (c) => c.activityId === stage.stageId,
          );
          if (activityCost) {
            recommendations.push({
              id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              type: "reduce",
              priority: "high",
              title: `Reduce Duration of ${stage.stageId}`,
              description: `Stage ${stage.stageId} takes ${hours.toFixed(1)} hours`,
              potentialSavings: activityCost.totalCost * 0.15,
              implementationEffort: "high",
              impact: `Reducing duration could improve efficiency and reduce costs`,
            });
          }
        }
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Analyze cost per variant
   */
  async analyzeVariantCosts(
    variants: ProcessVariant[],
    costModel: CostModel,
  ): Promise<Map<string, VariantCost>> {
    const variantCosts = new Map<string, VariantCost>();

    variants.forEach((variant) => {
      // Calculate cost for this variant
      let totalCost = 0;
      const activities: ActivityCost[] = [];

      variant.path.forEach((activityId) => {
        const activityCost = costModel.activityCosts.get(activityId);
        if (activityCost) {
          totalCost += activityCost.averageCost;
          activities.push(activityCost);
        }
      });

      variantCosts.set(variant.id, {
        variantId: variant.id,
        totalCost,
        averageCost: totalCost,
        costPerCase: totalCost / (variant.frequency || 1),
        caseCount: variant.frequency || 0,
        activities,
      });
    });

    return variantCosts;
  }
}

// Singleton instance
export const costMiningService = new AdvancedCostMiningService();

export default costMiningService;
