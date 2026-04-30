/**
 * Advanced Process Simulation Engine
 * Simulate process execution with scenarios and what-if analysis
 * More advanced than SAP Signavio simulation
 */

import type { EntityLifecycle, LifecycleStage } from "@/types/lifecycle";
import type { LifecycleConfig } from "@/types/lifecycle";

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  parameters: SimulationParameters;
  metadata: {
    created: Date;
    author: string;
  };
}

export interface SimulationParameters {
  resourceAvailability: number; // 0-1
  demandLevel: "low" | "medium" | "high" | "very-high";
  costModel: "standard" | "premium" | "economy";
  qualityLevel: number; // 0-1
  externalFactors?: Record<string, any>;
}

export interface SimulationResult {
  scenarioId: string;
  entityType: string;
  duration: number; // hours
  cost: number;
  efficiency: number; // 0-1
  resourceUtilization: number; // 0-1
  qualityScore: number; // 0-1
  bottlenecks: SimulationBottleneck[];
  recommendations: string[];
  timestamp: Date;
}

export interface SimulationBottleneck {
  stageId: string;
  stageName: string;
  delay: number; // hours
  impact: "low" | "medium" | "high" | "critical";
  reason: string;
}

export interface WhatIfAnalysis {
  baseScenario: SimulationResult;
  scenarios: SimulationResult[];
  comparison: {
    duration: { min: number; max: number; avg: number };
    cost: { min: number; max: number; avg: number };
    efficiency: { min: number; max: number; avg: number };
  };
  recommendations: string[];
}

export class AdvancedSimulationEngine {
  /**
   * Simulate process
   */
  async simulateProcess(
    config: LifecycleConfig,
    scenario: SimulationScenario,
  ): Promise<SimulationResult> {
    // Simulate each stage
    let totalDuration = 0;
    let totalCost = 0;
    const bottlenecks: SimulationBottleneck[] = [];

    config.stages.forEach((stage, index) => {
      // Calculate stage duration based on scenario
      const baseDuration = stage.estimatedDuration || 3600; // seconds
      const adjustedDuration = this.adjustDuration(
        baseDuration,
        scenario.parameters,
      );
      const hours = adjustedDuration / 3600;
      totalDuration += hours;

      // Calculate stage cost
      const stageCost = this.calculateStageCost(
        stage,
        scenario.parameters,
        hours,
      );
      totalCost += stageCost;

      // Detect bottlenecks
      if (adjustedDuration > baseDuration * 1.5) {
        bottlenecks.push({
          stageId: stage.id,
          stageName: stage.name,
          delay: (adjustedDuration - baseDuration) / 3600,
          impact: adjustedDuration > baseDuration * 2 ? "critical" : "high",
          reason: this.identifyBottleneckReason(scenario.parameters),
        });
      }
    });

    // Calculate efficiency
    const efficiency = this.calculateEfficiency(
      config,
      totalDuration,
      scenario.parameters,
    );

    // Calculate resource utilization
    const resourceUtilization = scenario.parameters.resourceAvailability;

    // Calculate quality score
    const qualityScore = scenario.parameters.qualityLevel;

    // Generate recommendations
    const recommendations = this.generateSimulationRecommendations(
      config,
      totalDuration,
      totalCost,
      bottlenecks,
      scenario.parameters,
    );

    return {
      scenarioId: scenario.id,
      entityType: config.entityType,
      duration: totalDuration,
      cost: totalCost,
      efficiency,
      resourceUtilization,
      qualityScore,
      bottlenecks,
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Adjust duration based on scenario
   */
  private adjustDuration(
    baseDuration: number,
    parameters: SimulationParameters,
  ): number {
    let adjusted = baseDuration;

    // Resource availability impact
    if (parameters.resourceAvailability < 0.7) {
      adjusted *= 1.5; // 50% slower with low resources
    } else if (parameters.resourceAvailability > 0.9) {
      adjusted *= 0.9; // 10% faster with high resources
    }

    // Demand level impact
    const demandMultipliers = {
      low: 0.9,
      medium: 1.0,
      high: 1.3,
      "very-high": 1.6,
    };
    adjusted *= demandMultipliers[parameters.demandLevel];

    // Quality level impact
    if (parameters.qualityLevel < 0.7) {
      adjusted *= 1.2; // Slower with lower quality (rework)
    }

    return Math.round(adjusted);
  }

  /**
   * Calculate stage cost
   */
  private calculateStageCost(
    stage: LifecycleStage,
    parameters: SimulationParameters,
    hours: number,
  ): number {
    const baseCost = 100; // Base cost per hour
    const costMultipliers = {
      standard: 1.0,
      premium: 1.5,
      economy: 0.7,
    };

    const costPerHour = baseCost * costMultipliers[parameters.costModel];
    return costPerHour * hours;
  }

  /**
   * Identify bottleneck reason
   */
  private identifyBottleneckReason(parameters: SimulationParameters): string {
    if (parameters.resourceAvailability < 0.7) {
      return "Low resource availability";
    }
    if (parameters.demandLevel === "very-high") {
      return "Very high demand";
    }
    if (parameters.qualityLevel < 0.7) {
      return "Quality issues causing rework";
    }
    return "Process inefficiency";
  }

  /**
   * Calculate efficiency
   */
  private calculateEfficiency(
    config: LifecycleConfig,
    actualDuration: number,
    parameters: SimulationParameters,
  ): number {
    // Ideal duration (all stages at optimal)
    const idealDuration = config.stages.reduce((sum, stage) => {
      return sum + (stage.estimatedDuration || 3600) / 3600;
    }, 0);

    // Efficiency = ideal / actual
    const efficiency = idealDuration / actualDuration;

    // Adjust for quality
    const qualityAdjustedEfficiency = efficiency * parameters.qualityLevel;

    return Math.min(qualityAdjustedEfficiency, 1.0);
  }

  /**
   * Generate simulation recommendations
   */
  private generateSimulationRecommendations(
    config: LifecycleConfig,
    duration: number,
    cost: number,
    bottlenecks: SimulationBottleneck[],
    parameters: SimulationParameters,
  ): string[] {
    const recommendations: string[] = [];

    if (bottlenecks.length > 0) {
      recommendations.push(
        `Address ${bottlenecks.length} bottleneck(s) to improve process duration`,
      );
    }

    if (parameters.resourceAvailability < 0.7) {
      recommendations.push(
        "Increase resource availability to improve performance",
      );
    }

    if (parameters.demandLevel === "very-high") {
      recommendations.push(
        "Consider scaling resources or optimizing process for high demand",
      );
    }

    if (cost > 1000) {
      recommendations.push(
        "Review cost model - consider economy option if applicable",
      );
    }

    return recommendations;
  }

  /**
   * What-if analysis
   */
  async whatIfAnalysis(
    config: LifecycleConfig,
    baseScenario: SimulationScenario,
    alternativeScenarios: SimulationScenario[],
  ): Promise<WhatIfAnalysis> {
    // Run base simulation
    const baseResult = await this.simulateProcess(config, baseScenario);

    // Run alternative scenarios
    const scenarioResults = await Promise.all(
      alternativeScenarios.map((scenario) =>
        this.simulateProcess(config, scenario),
      ),
    );

    // Calculate comparison
    const allDurations = [
      baseResult.duration,
      ...scenarioResults.map((r) => r.duration),
    ];
    const allCosts = [baseResult.cost, ...scenarioResults.map((r) => r.cost)];
    const allEfficiencies = [
      baseResult.efficiency,
      ...scenarioResults.map((r) => r.efficiency),
    ];

    const comparison = {
      duration: {
        min: Math.min(...allDurations),
        max: Math.max(...allDurations),
        avg: allDurations.reduce((a, b) => a + b, 0) / allDurations.length,
      },
      cost: {
        min: Math.min(...allCosts),
        max: Math.max(...allCosts),
        avg: allCosts.reduce((a, b) => a + b, 0) / allCosts.length,
      },
      efficiency: {
        min: Math.min(...allEfficiencies),
        max: Math.max(...allEfficiencies),
        avg:
          allEfficiencies.reduce((a, b) => a + b, 0) / allEfficiencies.length,
      },
    };

    // Find best scenario
    const bestScenario = scenarioResults.reduce((best, current) => {
      const bestScore =
        best.efficiency * 0.5 +
        (1 / best.duration) * 0.3 +
        (1 / best.cost) * 0.2;
      const currentScore =
        current.efficiency * 0.5 +
        (1 / current.duration) * 0.3 +
        (1 / current.cost) * 0.2;
      return currentScore > bestScore ? current : best;
    }, baseResult);

    const recommendations = [
      `Best scenario: ${bestScenario.scenarioId} (Efficiency: ${(bestScenario.efficiency * 100).toFixed(1)}%)`,
      `Potential improvement: ${((bestScenario.efficiency - baseResult.efficiency) * 100).toFixed(1)}% efficiency`,
      `Cost savings: ${(baseResult.cost - bestScenario.cost).toFixed(2)}`,
    ];

    return {
      baseScenario: baseResult,
      scenarios: scenarioResults,
      comparison,
      recommendations,
    };
  }

  /**
   * Create scenario
   */
  createScenario(
    name: string,
    description: string,
    parameters: SimulationParameters,
    author: string = "system",
  ): SimulationScenario {
    return {
      id: `scenario-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name,
      description,
      parameters,
      metadata: {
        created: new Date(),
        author,
      },
    };
  }
}

// Singleton instance
export const simulationEngine = new AdvancedSimulationEngine();

export default simulationEngine;
