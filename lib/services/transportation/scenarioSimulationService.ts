/**
 * Scenario Simulation Service
 *
 * What-if modeling for transportation planning
 * Cost/benefit analysis, risk assessment, strategic planning
 * Fully integrated with ecosystem - no duplication
 */

import { eventBus } from "@/lib/services/event-store";
import { assertRealInProduction } from "./strictMode";
import { routeComparisonService } from "./routeComparisonService";
import { pricingIntelligenceService } from "./pricingIntelligenceService";
import { co2EmissionsService } from "./co2EmissionsService";
import { transitTimePredictionService } from "./transitTimePredictionService";
import type { Shipment, TransportMode } from "@/types/tms";

export interface Scenario {
  id: string;
  name: string;
  description: string;
  baseScenarioId?: string;
  variables: ScenarioVariable[];
  assumptions: ScenarioAssumption[];
  createdAt: Date;
  createdBy: string;
}

export interface ScenarioVariable {
  type:
    | "ROUTE"
    | "CARRIER"
    | "MODE"
    | "VOLUME"
    | "FREQUENCY"
    | "SERVICE_LEVEL"
    | "CUSTOM";
  name: string;
  value: any;
  min?: any;
  max?: any;
  step?: any;
}

export interface ScenarioAssumption {
  type:
    | "COST"
    | "TIME"
    | "RELIABILITY"
    | "CAPACITY"
    | "DEMAND"
    | "FUEL_PRICE"
    | "CUSTOM";
  name: string;
  value: any;
  confidence: number; // 0-100
}

export interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  baseScenarioId?: string;
  metrics: ScenarioMetrics;
  comparison?: ScenarioComparison;
  riskAssessment: RiskAssessment;
  recommendations: string[];
  generatedAt: Date;
}

export interface ScenarioMetrics {
  totalCost: number;
  totalTime: number;
  totalCO2e: number;
  reliability: number;
  onTimeRate: number;
  capacityUtilization: number;
  costPerUnit: number;
  costPerKm: number;
  costPerKg: number;
  transitTime: number;
  emissionsPerUnit: number;
}

export interface ScenarioComparison {
  vsBaseScenario: {
    costDifference: number;
    costPercentage: number;
    timeDifference: number;
    timePercentage: number;
    emissionsDifference: number;
    emissionsPercentage: number;
    reliabilityDifference: number;
  };
  vsBestCase: {
    costGap: number;
    timeGap: number;
    emissionsGap: number;
  };
  vsWorstCase: {
    costGap: number;
    timeGap: number;
    emissionsGap: number;
  };
}

export interface RiskAssessment {
  overallRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number; // 0-100
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
}

export interface RiskFactor {
  type:
    | "COST_OVERRUN"
    | "DELAY"
    | "CAPACITY"
    | "COMPLIANCE"
    | "WEATHER"
    | "CUSTOM";
  name: string;
  probability: number; // 0-100
  impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number; // 0-100
  description: string;
}

export interface ScenarioSimulationRequest {
  baseShipment: Shipment;
  scenarios: Omit<Scenario, "id" | "createdAt" | "createdBy">[];
  includeComparison?: boolean;
  includeRiskAssessment?: boolean;
  createdBy: string;
}

export interface ScenarioSimulationResult {
  baseScenario: ScenarioResult;
  scenarios: ScenarioResult[];
  bestScenario: ScenarioResult;
  worstScenario: ScenarioResult;
  recommendations: string[];
  generatedAt: Date;
}

export class ScenarioSimulationService {
  private scenarios: Map<string, Scenario> = new Map();
  private results: Map<string, ScenarioResult> = new Map();

  /**
   * Run scenario simulation
   */
  async simulateScenarios(
    request: ScenarioSimulationRequest,
  ): Promise<ScenarioSimulationResult> {
    assertRealInProduction(
      "tms.scenarioSimulation",
      "Scenario simulation is not production-real yet. Configure persisted shipment baselines + analytics inputs for production.",
    );
    // Create base scenario
    const baseScenario: Scenario = {
      id: `scenario-base-${Date.now()}`,
      name: "Base Scenario",
      description: "Current baseline scenario",
      variables: [],
      assumptions: [],
      createdAt: new Date(),
      createdBy: request.createdBy,
    };

    // Evaluate base scenario
    const baseResult = await this.evaluateScenario(
      baseScenario,
      request.baseShipment,
      {
        includeComparison: false,
        includeRiskAssessment: request.includeRiskAssessment !== false,
      },
    );

    // Evaluate all scenarios
    const scenarioResults: ScenarioResult[] = await Promise.all(
      request.scenarios.map(async (scenarioDef) => {
        const scenario: Scenario = {
          ...scenarioDef,
          id: `scenario-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          baseScenarioId: baseScenario.id,
          createdAt: new Date(),
          createdBy: request.createdBy,
        };
        this.scenarios.set(scenario.id, scenario);

        return this.evaluateScenario(scenario, request.baseShipment, {
          includeComparison: request.includeComparison !== false,
          baseScenarioId: baseScenario.id,
          baseMetrics: baseResult.metrics,
          includeRiskAssessment: request.includeRiskAssessment !== false,
        });
      }),
    );

    // Find best and worst scenarios
    const bestScenario = scenarioResults.reduce((best, current) =>
      this.getScenarioScore(current) > this.getScenarioScore(best)
        ? current
        : best,
    );
    const worstScenario = scenarioResults.reduce((worst, current) =>
      this.getScenarioScore(current) < this.getScenarioScore(worst)
        ? current
        : worst,
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      baseResult,
      scenarioResults,
      bestScenario,
      worstScenario,
    );

    const result: ScenarioSimulationResult = {
      baseScenario: baseResult,
      scenarios: scenarioResults,
      bestScenario,
      worstScenario,
      recommendations,
      generatedAt: new Date(),
    };

    // Publish event
    await eventBus.publish("transportation.scenario.simulated", {
      simulationId: baseScenario.id,
      scenariosCount: scenarioResults.length,
      bestScenarioId: bestScenario.scenarioId,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  /**
   * Evaluate a single scenario
   */
  private async evaluateScenario(
    scenario: Scenario,
    baseShipment: Shipment,
    options: {
      includeComparison?: boolean;
      baseScenarioId?: string;
      baseMetrics?: ScenarioMetrics;
      includeRiskAssessment?: boolean;
    },
  ): Promise<ScenarioResult> {
    // Apply scenario variables to shipment
    const modifiedShipment = this.applyScenarioVariables(
      baseShipment,
      scenario.variables,
    );

    // Calculate metrics
    const metrics = await this.calculateMetrics(
      modifiedShipment,
      scenario.assumptions,
    );

    // Compare with base scenario if requested
    let comparison: ScenarioComparison | undefined;
    if (options.includeComparison && options.baseMetrics) {
      comparison = this.compareScenarios(metrics, options.baseMetrics);
    }

    // Risk assessment
    const riskAssessment = options.includeRiskAssessment
      ? await this.assessRisk(modifiedShipment, scenario, metrics)
      : {
          overallRisk: "LOW" as const,
          riskScore: 0,
          riskFactors: [],
          mitigationStrategies: [],
        };

    // Generate recommendations
    const recommendations = this.generateScenarioRecommendations(
      scenario,
      metrics,
      riskAssessment,
    );

    const result: ScenarioResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      baseScenarioId: options.baseScenarioId,
      metrics,
      comparison,
      riskAssessment,
      recommendations,
      generatedAt: new Date(),
    };

    this.results.set(scenario.id, result);
    return result;
  }

  /**
   * Apply scenario variables to shipment
   */
  private applyScenarioVariables(
    shipment: Shipment,
    variables: ScenarioVariable[],
  ): Shipment {
    const modified = { ...shipment };

    for (const variable of variables) {
      switch (variable.type) {
        case "ROUTE":
          // Modify route
          if (variable.value.origin) modified.origin = variable.value.origin;
          if (variable.value.destination)
            modified.destination = variable.value.destination;
          break;

        case "CARRIER":
          modified.carrierId = variable.value.carrierId;
          modified.carrierName = variable.value.carrierName;
          break;

        case "MODE":
          modified.mode = variable.value as TransportMode;
          break;

        case "VOLUME":
          modified.totalVolume = variable.value;
          modified.items.forEach((item) => {
            item.volume = (item.volume / shipment.totalVolume) * variable.value;
          });
          break;

        case "FREQUENCY":
          // Frequency affects consolidation opportunities
          break;

        case "SERVICE_LEVEL":
          modified.serviceLevel = variable.value;
          break;

        default:
          // Custom variables
          break;
      }
    }

    return modified;
  }

  /**
   * Calculate scenario metrics
   */
  private async calculateMetrics(
    shipment: Shipment,
    assumptions: ScenarioAssumption[],
  ): Promise<ScenarioMetrics> {
    // Get route comparison
    const routeComparison = await routeComparisonService.compareRoutes({
      origin: shipment.origin,
      destination: shipment.destination,
      mode: shipment.mode,
      cargo: {
        weight: shipment.totalWeight,
        volume: shipment.totalVolume,
        type: shipment.type,
      },
    });

    const recommendedRoute = routeComparison.recommended;

    // Get pricing intelligence
    const pricing = await pricingIntelligenceService.getPricingIntelligence({
      origin: shipment.origin,
      destination: shipment.destination,
      mode: shipment.mode,
      cargo: {
        weight: shipment.totalWeight,
        volume: shipment.totalVolume,
        type: shipment.type,
      },
      pickupDate: shipment.pickupDate || new Date(),
    });

    // Calculate emissions
    const emissions = await co2EmissionsService.calculateEmissions({
      route: {
        origin: shipment.origin,
        destination: shipment.destination,
        distance: recommendedRoute?.distance || 0,
        mode: shipment.mode,
      },
      cargo: {
        weight: shipment.totalWeight,
        volume: shipment.totalVolume,
      },
      vehicle: {
        type: "TRUCK",
        fuelType: "DIESEL",
        loadFactor: 0.85,
      },
    });

    // Predict transit time
    const transitTime = await transitTimePredictionService.predictTransitTime({
      route: {
        origin: shipment.origin,
        destination: shipment.destination,
        distance: recommendedRoute?.distance || 0,
        mode: shipment.mode,
      },
      cargo: {
        type: shipment.type,
        hazmat: shipment.hazmat?.isHazmat || false,
      },
      pickupDate: shipment.pickupDate || new Date(),
      carrierId: shipment.carrierId,
    });

    // Apply assumptions
    let totalCost = pricing.marketRate || 0;
    let totalTime = transitTime.estimated || 0;
    let totalCO2e = emissions.totalCO2e || 0;

    for (const assumption of assumptions) {
      switch (assumption.type) {
        case "COST":
          totalCost = assumption.value;
          break;
        case "TIME":
          totalTime = assumption.value;
          break;
        case "FUEL_PRICE":
          // Adjust cost based on fuel price changes
          const fuelCostFactor = assumption.value / 100; // Assuming base is 100
          totalCost = totalCost * (1 + fuelCostFactor * 0.3); // 30% of cost is fuel
          break;
        case "DEMAND":
          // Adjust capacity utilization
          break;
      }
    }

    // Calculate derived metrics
    const costPerUnit = totalCost / shipment.totalWeight;
    const costPerKm = recommendedRoute?.distance
      ? totalCost / recommendedRoute.distance
      : 0;
    const costPerKg = totalCost / shipment.totalWeight;
    const emissionsPerUnit = totalCO2e / shipment.totalWeight;

    return {
      totalCost,
      totalTime,
      totalCO2e,
      reliability: recommendedRoute?.reliability || 85,
      onTimeRate: recommendedRoute?.reliability || 85,
      capacityUtilization: 0.85, // Default
      costPerUnit,
      costPerKm,
      costPerKg,
      transitTime: totalTime,
      emissionsPerUnit,
    };
  }

  /**
   * Compare scenarios
   */
  private compareScenarios(
    current: ScenarioMetrics,
    base: ScenarioMetrics,
  ): ScenarioComparison {
    const costDifference = current.totalCost - base.totalCost;
    const costPercentage = base.totalCost
      ? (costDifference / base.totalCost) * 100
      : 0;

    const timeDifference = current.totalTime - base.totalTime;
    const timePercentage = base.totalTime
      ? (timeDifference / base.totalTime) * 100
      : 0;

    const emissionsDifference = current.totalCO2e - base.totalCO2e;
    const emissionsPercentage = base.totalCO2e
      ? (emissionsDifference / base.totalCO2e) * 100
      : 0;

    const reliabilityDifference = current.reliability - base.reliability;

    return {
      vsBaseScenario: {
        costDifference,
        costPercentage,
        timeDifference,
        timePercentage,
        emissionsDifference,
        emissionsPercentage,
        reliabilityDifference,
      },
      vsBestCase: {
        costGap: 0, // Will be calculated when all scenarios are evaluated
        timeGap: 0,
        emissionsGap: 0,
      },
      vsWorstCase: {
        costGap: 0,
        timeGap: 0,
        emissionsGap: 0,
      },
    };
  }

  /**
   * Assess risk
   */
  private async assessRisk(
    shipment: Shipment,
    scenario: Scenario,
    metrics: ScenarioMetrics,
  ): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [];

    // Cost overrun risk
    if (metrics.totalCost > 100000) {
      riskFactors.push({
        type: "COST_OVERRUN",
        name: "High Cost Risk",
        probability: 30,
        impact: "HIGH",
        riskScore: 60,
        description: "Total cost exceeds threshold, potential budget overrun",
      });
    }

    // Delay risk
    if (metrics.totalTime > 30) {
      riskFactors.push({
        type: "DELAY",
        name: "Extended Transit Time",
        probability: 25,
        impact: "MEDIUM",
        riskScore: 50,
        description: "Transit time exceeds 30 days, potential delays",
      });
    }

    // Capacity risk
    if (metrics.capacityUtilization > 0.95) {
      riskFactors.push({
        type: "CAPACITY",
        name: "High Capacity Utilization",
        probability: 40,
        impact: "MEDIUM",
        riskScore: 55,
        description: "Capacity utilization very high, limited flexibility",
      });
    }

    // Calculate overall risk
    const riskScore =
      riskFactors.length > 0
        ? riskFactors.reduce((sum, factor) => sum + factor.riskScore, 0) /
          riskFactors.length
        : 0;

    const overallRisk =
      riskScore >= 75
        ? "CRITICAL"
        : riskScore >= 50
          ? "HIGH"
          : riskScore >= 25
            ? "MEDIUM"
            : "LOW";

    // Generate mitigation strategies
    const mitigationStrategies = this.generateMitigationStrategies(riskFactors);

    return {
      overallRisk,
      riskScore,
      riskFactors,
      mitigationStrategies,
    };
  }

  /**
   * Generate mitigation strategies
   */
  private generateMitigationStrategies(riskFactors: RiskFactor[]): string[] {
    const strategies: string[] = [];

    for (const factor of riskFactors) {
      switch (factor.type) {
        case "COST_OVERRUN":
          strategies.push("Negotiate better rates with carriers");
          strategies.push("Consider alternative routes or modes");
          strategies.push("Optimize load consolidation");
          break;

        case "DELAY":
          strategies.push("Add buffer time to schedule");
          strategies.push("Use faster transportation mode");
          strategies.push("Select more reliable carriers");
          break;

        case "CAPACITY":
          strategies.push("Diversify carrier network");
          strategies.push("Plan shipments in advance");
          strategies.push("Consider alternative modes");
          break;

        case "COMPLIANCE":
          strategies.push("Ensure all regulatory requirements are met");
          strategies.push("Work with certified carriers");
          break;

        case "WEATHER":
          strategies.push("Monitor weather forecasts");
          strategies.push("Have contingency plans ready");
          break;
      }
    }

    return [...new Set(strategies)]; // Remove duplicates
  }

  /**
   * Generate scenario recommendations
   */
  private generateScenarioRecommendations(
    scenario: Scenario,
    metrics: ScenarioMetrics,
    riskAssessment: RiskAssessment,
  ): string[] {
    const recommendations: string[] = [];

    // Cost optimization
    if (metrics.totalCost > 50000) {
      recommendations.push("Consider consolidating shipments to reduce costs");
      recommendations.push("Evaluate alternative carriers for better rates");
    }

    // Time optimization
    if (metrics.totalTime > 20) {
      recommendations.push(
        "Consider faster transportation modes if time-critical",
      );
      recommendations.push("Optimize route to reduce transit time");
    }

    // Emissions optimization
    if (metrics.totalCO2e > 1000) {
      recommendations.push("Consider more sustainable transportation options");
      recommendations.push("Explore carbon offsetting options");
    }

    // Risk mitigation
    if (
      riskAssessment.overallRisk === "HIGH" ||
      riskAssessment.overallRisk === "CRITICAL"
    ) {
      recommendations.push("Implement risk mitigation strategies");
      recommendations.push("Consider insurance or guarantees");
    }

    return recommendations;
  }

  /**
   * Generate overall recommendations
   */
  private generateRecommendations(
    baseResult: ScenarioResult,
    scenarioResults: ScenarioResult[],
    bestScenario: ScenarioResult,
    worstScenario: ScenarioResult,
  ): string[] {
    const recommendations: string[] = [];

    // Best scenario recommendations
    if (bestScenario.metrics.totalCost < baseResult.metrics.totalCost) {
      recommendations.push(
        `Best scenario "${bestScenario.scenarioName}" offers ${(
          ((baseResult.metrics.totalCost - bestScenario.metrics.totalCost) /
            baseResult.metrics.totalCost) *
          100
        ).toFixed(1)}% cost savings`,
      );
    }

    if (bestScenario.metrics.totalTime < baseResult.metrics.totalTime) {
      recommendations.push(
        `Best scenario "${bestScenario.scenarioName}" reduces transit time by ${(
          baseResult.metrics.totalTime - bestScenario.metrics.totalTime
        ).toFixed(1)} days`,
      );
    }

    // Risk recommendations
    const highRiskScenarios = scenarioResults.filter(
      (s) =>
        s.riskAssessment.overallRisk === "HIGH" ||
        s.riskAssessment.overallRisk === "CRITICAL",
    );
    if (highRiskScenarios.length > 0) {
      recommendations.push(
        `${highRiskScenarios.length} scenario(s) have high risk - review mitigation strategies`,
      );
    }

    return recommendations;
  }

  /**
   * Get scenario score for comparison
   */
  private getScenarioScore(result: ScenarioResult): number {
    // Weighted score: cost (40%), time (30%), reliability (20%), emissions (10%)
    const costScore =
      100 - Math.min((result.metrics.totalCost / 100000) * 100, 100);
    const timeScore =
      100 - Math.min((result.metrics.totalTime / 30) * 100, 100);
    const reliabilityScore = result.metrics.reliability;
    const emissionsScore =
      100 - Math.min((result.metrics.totalCO2e / 1000) * 100, 100);

    return (
      costScore * 0.4 +
      timeScore * 0.3 +
      reliabilityScore * 0.2 +
      emissionsScore * 0.1
    );
  }

  /**
   * Get scenario by ID
   */
  getScenario(scenarioId: string): Scenario | undefined {
    return this.scenarios.get(scenarioId);
  }

  /**
   * Get scenario result by ID
   */
  getScenarioResult(scenarioId: string): ScenarioResult | undefined {
    return this.results.get(scenarioId);
  }

  /**
   * List all scenarios
   */
  listScenarios(): Scenario[] {
    return Array.from(this.scenarios.values());
  }
}

export const scenarioSimulationService = new ScenarioSimulationService();
