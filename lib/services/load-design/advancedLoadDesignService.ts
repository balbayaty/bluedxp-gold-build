/**
 * Advanced Load Design Service
 *
 * Comprehensive load design capabilities with:
 * - 3D bin packing optimization
 * - Multimodal transportation support
 * - Compliance integration (Ministry of Transport, Customs, etc.)
 * - Knowledge base integration
 * - AI/ML-powered optimization
 * - Real-time route optimization
 *
 * 4IR & 5IR Aligned - Industry-leading load design system
 */

import type {
  LoadItem,
  LoadPlan,
  MultimodalLoadPlan,
  VehicleSpecification,
  LoadOptimizationRequest,
  LoadOptimizationResult,
  ComplianceCheck,
  ComplianceWarning,
  ComplianceError,
  ItemPlacement,
  OptimizationStrategy,
  TransportMode,
} from "@/types/load-design";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { complianceService } from "@/lib/services/compliance/complianceService";
import { customsService } from "@/lib/services/customs/CustomsService";
import { eventBus } from "@/lib/services/event-store";
import { binPacking3D } from "./algorithms/binPacking3D";
import {
  getAllVehicleSpecifications,
  getVehicleSpec,
} from "./vehicleSpecifications";
import { loadComplianceValidator } from "./compliance/loadComplianceValidator";
import { multimodalPlanner } from "./multimodal/multimodalPlanner";
import { mapsService } from "../maps/mapsService";
import { predictiveOptimizationService } from "./ml/predictiveOptimization";

// ============================================================================
// ADVANCED LOAD DESIGN SERVICE
// ============================================================================

export class AdvancedLoadDesignService {
  private vehicleSpecs: Map<string, VehicleSpecification> = new Map();
  private regulations: Map<string, any> = new Map();

  constructor() {
    // Vehicle specs are now loaded from vehicleSpecifications.ts
    this.vehicleSpecs = getAllVehicleSpecifications();
    this.loadRegulations();
  }

  /**
   * Optimize load design
   */
  async optimizeLoad(
    request: LoadOptimizationRequest,
  ): Promise<LoadOptimizationResult> {
    // Validate items
    this.validateItems(request.items);

    // Get compliance requirements
    const complianceRequirements = await this.getComplianceRequirements(
      request.items,
    );

    // Check if multimodal is required or requested
    const isMultimodal =
      request.multimodal || this.requiresMultimodal(request.items);

    if (isMultimodal) {
      return this.optimizeMultimodalLoad(request, complianceRequirements);
    }

    // Single mode optimization
    return this.optimizeSingleModeLoad(request, complianceRequirements);
  }

  /**
   * Optimize single mode load
   */
  private async optimizeSingleModeLoad(
    request: LoadOptimizationRequest,
    complianceRequirements: any,
  ): Promise<LoadOptimizationResult> {
    // Get best vehicle type
    const vehicleType = await this.selectOptimalVehicleType(
      request.items,
      request.constraints,
    );

    // Get vehicle specification
    const vehicleSpec = this.getVehicleSpec(vehicleType);

    // Perform 3D bin packing
    const placements = await this.perform3DBinPacking(
      request.items,
      vehicleSpec,
    );

    // Create load plan
    const loadPlan = await this.createLoadPlan({
      items: request.items,
      placements,
      vehicleSpec,
      strategy: request.strategy,
      complianceRequirements,
    });

    // Validate compliance
    const compliance = await this.validateCompliance(
      loadPlan,
      complianceRequirements,
    );

    // Calculate optimization score
    const optimization = this.calculateOptimizationScore(
      loadPlan,
      request.strategy,
    );

    // Get AI recommendations if enabled
    const aiRecommendations = request.useAI
      ? await this.getAIRecommendations(loadPlan)
      : undefined;

    // Get ML predictions if enabled
    let mlPredictions = undefined;
    if (request.useAI) {
      try {
        mlPredictions =
          await predictiveOptimizationService.predictLoadPerformance(
            request.items,
            vehicleSpec,
            loadPlan.route,
          );
      } catch (error) {
        console.error("ML prediction error:", error);
      }
    }

    // Get optimization recommendations
    let optimizationRecommendations = undefined;
    if (request.useAI) {
      try {
        optimizationRecommendations =
          await predictiveOptimizationService.getOptimizationRecommendations(
            loadPlan,
          );
      } catch (error) {
        console.error("Optimization recommendations error:", error);
      }
    }

    return {
      loadPlans: [loadPlan],
      optimization: {
        ...optimization,
        aiRecommendations,
        mlPredictions,
        optimizationRecommendations,
      },
      compliance,
    };
  }

  /**
   * Optimize multimodal load
   */
  private async optimizeMultimodalLoad(
    request: LoadOptimizationRequest,
    complianceRequirements: any,
  ): Promise<LoadOptimizationResult> {
    // Plan multimodal journey
    const multimodalPlan = await this.planMultimodalJourney(
      request.items,
      request.constraints,
    );

    // Optimize each leg
    const optimizedLegs = await Promise.all(
      multimodalPlan.legs.map(async (leg) => {
        const legItems = request.items.filter((item) =>
          leg.itemIds.includes(item.id),
        );
        const legPlacements = await this.perform3DBinPacking(
          legItems,
          leg.vehicleSpec,
        );

        return {
          ...leg,
          itemPlacements: legPlacements,
        };
      }),
    );

    // Create multimodal plan
    const plan: MultimodalLoadPlan = {
      ...multimodalPlan,
      legs: optimizedLegs,
    };

    // Validate compliance for each leg
    const compliance = await this.validateMultimodalCompliance(
      plan,
      complianceRequirements,
    );

    // Calculate overall optimization
    const optimization = this.calculateMultimodalOptimization(
      plan,
      request.strategy,
    );

    return {
      loadPlans: [],
      multimodalPlan: plan,
      optimization,
      compliance,
    };
  }

  /**
   * Perform 3D bin packing
   */
  private async perform3DBinPacking(
    items: LoadItem[],
    vehicleSpec: VehicleSpecification,
  ): Promise<ItemPlacement[]> {
    // Use advanced 3D bin packing algorithm
    const result = binPacking3D.packItems(items, vehicleSpec, "SKYLINE");
    return result.placements;
  }

  // Placement logic is now in binPacking3D.ts

  /**
   * Select optimal vehicle type
   */
  private async selectOptimalVehicleType(
    items: LoadItem[],
    constraints?: LoadOptimizationRequest["constraints"],
  ): Promise<string> {
    const totalWeight = items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0,
    );
    const totalVolume = items.reduce(
      (sum, item) => sum + item.volume * item.quantity,
      0,
    );

    // Check if temperature control needed
    const requiresTemperatureControl = items.some(
      (item) => item.requiresTemperatureControl,
    );

    // Check if hazmat
    const hasHazmat = items.some((item) => item.isHazmat);

    // Filter by constraints
    let availableTypes = Array.from(this.vehicleSpecs.keys());

    if (constraints?.vehicleTypes) {
      availableTypes = availableTypes.filter((type) =>
        constraints.vehicleTypes!.includes(type as any),
      );
    }

    // Score each vehicle type
    const scores = availableTypes.map((type) => {
      const spec = this.vehicleSpecs.get(type)!;
      const weightUtil = (totalWeight / spec.maxWeight) * 100;
      const volumeUtil = (totalVolume / spec.maxVolume) * 100;

      let score = 0;

      // Capacity fit
      if (totalWeight <= spec.maxWeight && totalVolume <= spec.maxVolume) {
        score += 50;
        // Prefer 70-90% utilization
        if (
          weightUtil >= 70 &&
          weightUtil <= 90 &&
          volumeUtil >= 70 &&
          volumeUtil <= 90
        ) {
          score += 30;
        }
      } else {
        score -= 50;
      }

      // Temperature control
      if (requiresTemperatureControl && spec.hasTemperatureControl) {
        score += 20;
      } else if (requiresTemperatureControl && !spec.hasTemperatureControl) {
        score -= 30;
      }

      // Special features
      if (hasHazmat && spec.metadata?.hazmatApproved) {
        score += 10;
      }

      return { type, score, weightUtil, volumeUtil };
    });

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    return scores[0]?.type || "TRUCK";
  }

  /**
   * Get vehicle specification
   */
  private getVehicleSpec(type: string): VehicleSpecification {
    const spec = getVehicleSpec(type);
    if (!spec) {
      throw new Error(`Vehicle specification not found: ${type}`);
    }
    return spec;
  }

  /**
   * Create load plan
   */
  private async createLoadPlan(params: {
    items: LoadItem[];
    placements: ItemPlacement[];
    vehicleSpec: VehicleSpecification;
    strategy: OptimizationStrategy;
    complianceRequirements: any;
  }): Promise<LoadPlan> {
    const { items, placements, vehicleSpec, strategy } = params;

    const totalWeight = items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0,
    );
    const totalVolume = items.reduce(
      (sum, item) => sum + item.volume * item.quantity,
      0,
    );

    const weightUtil = (totalWeight / vehicleSpec.maxWeight) * 100;
    const volumeUtil = (totalVolume / vehicleSpec.maxVolume) * 100;

    // Calculate space efficiency (how well space is used)
    const usedVolume =
      placements.reduce(
        (sum, p) =>
          sum + p.dimensions.length * p.dimensions.width * p.dimensions.height,
        0,
      ) / 1000000; // Convert to m³
    const spaceEfficiency = (usedVolume / vehicleSpec.maxVolume) * 100;

    // Optimize route if destinations available
    const route = await this.optimizeRoute(items);

    // Calculate cost
    const cost = this.calculateCost(route, totalWeight, vehicleSpec);

    return {
      id: `LOAD-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      loadNumber: `LD-${Date.now()}`,
      planType: "SINGLE",
      vehicleSpec,
      items,
      itemPlacements: placements,
      utilization: {
        weightPercent: Math.min(weightUtil, 100),
        volumePercent: Math.min(volumeUtil, 100),
        cubePercent: Math.min(volumeUtil, 100),
        spaceEfficiency: Math.min(spaceEfficiency, 100),
      },
      route,
      cost,
      compliance: {
        status: "PENDING_VALIDATION",
        checks: [],
        warnings: [],
        errors: [],
      },
      optimization: {
        strategy,
        score: 0, // Will be calculated
      },
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
    };
  }

  /**
   * Optimize route
   */
  private async optimizeRoute(items: LoadItem[]): Promise<LoadPlan["route"]> {
    const destinations = items
      .map((item) => item.destination)
      .filter((dest, index, self) => {
        return index === self.findIndex((d) => d.address === dest.address);
      });

    if (destinations.length === 0) {
      return undefined;
    }

    const origin = items[0]?.origin || destinations[0];
    const sortedDestinations = this.nearestNeighborRoute(origin, destinations);

    // Use maps service for route optimization
    const routeResult = await mapsService.optimizeRoute({
      origin: {
        address: origin.address,
        city: origin.city,
        country: origin.country,
        coordinates: origin.coordinates,
      },
      destination: {
        address: sortedDestinations[sortedDestinations.length - 1].address,
        city: sortedDestinations[sortedDestinations.length - 1].city,
        country: sortedDestinations[sortedDestinations.length - 1].country,
        coordinates:
          sortedDestinations[sortedDestinations.length - 1].coordinates,
      },
      waypoints: sortedDestinations.slice(0, -1).map((dest) => ({
        address: dest.address,
        city: dest.city,
        country: dest.country,
        coordinates: dest.coordinates,
      })),
      optimize: true,
    });

    return {
      origin: {
        address: origin.address,
        city: origin.city,
        country: origin.country,
        coordinates: origin.coordinates,
      },
      destination: {
        address: sortedDestinations[sortedDestinations.length - 1].address,
        city: sortedDestinations[sortedDestinations.length - 1].city,
        country: sortedDestinations[sortedDestinations.length - 1].country,
        coordinates:
          sortedDestinations[sortedDestinations.length - 1].coordinates,
      },
      waypoints: routeResult.waypoints?.map((wp) => ({
        address: wp.location.address,
        city: wp.location.city,
        coordinates: wp.location.coordinates,
      })),
      totalDistance: routeResult.distance,
      estimatedTime: routeResult.duration,
      optimized: routeResult.optimized,
    };
  }

  /**
   * Nearest neighbor route optimization
   */
  private nearestNeighborRoute(
    origin: {
      address: string;
      city: string;
      coordinates?: { lat: number; lng: number };
    },
    destinations: Array<{
      address: string;
      city: string;
      coordinates?: { lat: number; lng: number };
    }>,
  ): Array<{
    address: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  }> {
    if (destinations.length === 0) return [];

    const route: typeof destinations = [];
    const unvisited = [...destinations];
    let current = origin;

    while (unvisited.length > 0) {
      let nearest = unvisited[0];
      let nearestDistance = this.calculateDistance(current, nearest);

      for (const dest of unvisited) {
        const distance = this.calculateDistance(current, dest);
        if (distance < nearestDistance) {
          nearest = dest;
          nearestDistance = distance;
        }
      }

      route.push(nearest);
      unvisited.splice(unvisited.indexOf(nearest), 1);
      current = nearest;
    }

    return route;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(
    a: { coordinates?: { lat: number; lng: number } },
    b: { coordinates?: { lat: number; lng: number } },
  ): number {
    if (!a.coordinates || !b.coordinates) {
      return 0; // Can't calculate without coordinates
    }

    // Use maps service for distance calculation
    return mapsService.calculateDistance(a.coordinates, b.coordinates);
  }

  /**
   * Calculate cost
   */
  private calculateCost(
    route: LoadPlan["route"],
    weight: number,
    vehicleSpec: VehicleSpecification,
  ): LoadPlan["cost"] {
    const distance = route?.totalDistance || 100; // Default 100km
    const time = route?.estimatedTime || 120; // Default 2 hours

    const baseCost = vehicleSpec.baseCost || 0;
    const fuelCost = (vehicleSpec.costPerKm || 0.5) * distance;
    const laborCost = (vehicleSpec.costPerHour || 25) * (time / 60);

    return {
      base: baseCost,
      fuel: fuelCost,
      labor: laborCost,
      total: baseCost + fuelCost + laborCost,
      currency: vehicleSpec.currency || "USD",
    };
  }

  /**
   * Validate compliance
   */
  private async validateCompliance(
    loadPlan: LoadPlan,
    requirements: any,
  ): Promise<{
    status: LoadPlan["compliance"]["status"];
    checks: ComplianceCheck[];
    warnings: ComplianceWarning[];
    errors: ComplianceError[];
  }> {
    // Use comprehensive compliance validator
    const result = await loadComplianceValidator.validateLoadPlan(loadPlan);
    return {
      status: result.status,
      checks: result.checks,
      warnings: result.warnings,
      errors: result.errors,
    };
  }

  // Compliance checking is now in loadComplianceValidator.ts

  /**
   * Get compliance requirements
   */
  private async getComplianceRequirements(items: LoadItem[]): Promise<any> {
    // Get countries involved
    const countries = new Set([
      ...items.map((item) => item.origin?.country).filter(Boolean),
      ...items.map((item) => item.destination.country),
    ]);

    // Get regulations for each country
    const regulations: any[] = [];
    for (const country of countries) {
      const countryRegs = await this.getRegulationsForCountry(
        country as string,
      );
      regulations.push(...countryRegs);
    }

    return { regulations, countries: Array.from(countries) };
  }

  /**
   * Get regulations for country
   */
  private async getRegulationsForCountry(country: string): Promise<any[]> {
    try {
      // Integrate with compliance service
      const requirements = complianceService.getRequirementsByRegion(
        country as any,
      );
      return requirements.map((req) => ({
        id: req.id,
        category: req.category,
        authority: req.authority,
        description: req.description,
        requirements: req.requirements,
      }));
    } catch (error) {
      console.error("Failed to get regulations:", error);
      return [];
    }
  }

  /**
   * Validate items
   */
  private validateItems(items: LoadItem[]): void {
    if (items.length === 0) {
      throw new Error("No items provided for load optimization");
    }

    for (const item of items) {
      if (item.weight <= 0) {
        throw new Error(`Item ${item.id} has invalid weight`);
      }
      if (item.volume <= 0) {
        throw new Error(`Item ${item.id} has invalid volume`);
      }
      if (
        item.dimensions.length <= 0 ||
        item.dimensions.width <= 0 ||
        item.dimensions.height <= 0
      ) {
        throw new Error(`Item ${item.id} has invalid dimensions`);
      }
    }
  }

  /**
   * Check if multimodal is required
   */
  private requiresMultimodal(items: LoadItem[]): boolean {
    const countries = new Set(items.map((item) => item.destination.country));
    return (
      countries.size > 1 ||
      items.some((item) => {
        const originCountry = item.origin?.country;
        const destCountry = item.destination.country;
        return originCountry && originCountry !== destCountry;
      })
    );
  }

  /**
   * Plan multimodal journey
   */
  private async planMultimodalJourney(
    items: LoadItem[],
    constraints?: LoadOptimizationRequest["constraints"],
  ): Promise<MultimodalLoadPlan> {
    // Use multimodal planner
    const origin = items[0]?.origin || items[0]?.destination;
    const destination = items[0]?.destination;

    if (!origin || !destination) {
      throw new Error(
        "Origin and destination required for multimodal planning",
      );
    }

    return multimodalPlanner.planJourney({
      items,
      origin: {
        address: origin.address,
        city: origin.city,
        country: origin.country,
        coordinates: origin.coordinates,
      },
      destination: {
        address: destination.address,
        city: destination.city,
        country: destination.country,
        coordinates: destination.coordinates,
      },
      constraints,
      strategy: "BALANCED",
    });
  }

  /**
   * Validate multimodal compliance
   */
  private async validateMultimodalCompliance(
    plan: MultimodalLoadPlan,
    requirements: any,
  ): Promise<LoadPlan["compliance"]> {
    // Validate compliance for each leg
    const allChecks: any[] = [];
    const allWarnings: any[] = [];
    const allErrors: any[] = [];

    for (const leg of plan.legs) {
      try {
        const legCompliance = await loadComplianceValidator.validateLoadPlan(
          {
            items: plan.items.filter((item) => leg.itemIds.includes(item.id)),
            vehicleSpec: leg.vehicleSpec,
            route: {
              origin: leg.origin,
              destination: leg.destination,
            },
            transportMode: leg.mode,
          },
          requirements,
        );

        allChecks.push(...legCompliance.checks);
        allWarnings.push(...legCompliance.warnings);
        allErrors.push(...legCompliance.errors);
      } catch (error) {
        console.error(`Failed to validate leg ${leg.id}:`, error);
        allErrors.push({
          id: `leg-${leg.id}-validation-error`,
          category: "VALIDATION",
          message: `Failed to validate leg ${leg.id}`,
          blocking: false,
        });
      }
    }

    // Determine overall status
    const hasErrors = allErrors.some((e) => e.blocking);
    const hasWarnings = allWarnings.length > 0;
    const status = hasErrors
      ? "NON_COMPLIANT"
      : hasWarnings
        ? "REQUIRES_REVIEW"
        : allChecks.length > 0
          ? "COMPLIANT"
          : "PENDING_VALIDATION";

    return {
      status,
      checks: allChecks,
      warnings: allWarnings,
      errors: allErrors,
    };
  }

  /**
   * Calculate optimization score
   */
  private calculateOptimizationScore(
    loadPlan: LoadPlan,
    strategy: OptimizationStrategy,
  ): {
    strategy: OptimizationStrategy;
    score: number;
    improvements?: string[];
  } {
    const { utilization } = loadPlan;

    let score = 0;

    switch (strategy) {
      case "MAXIMIZE_UTILIZATION":
        score = (utilization.weightPercent + utilization.volumePercent) / 2;
        break;
      case "MINIMIZE_COST":
        // Score based on cost efficiency
        score = 100 - ((loadPlan.cost?.total || 0) / 1000) * 10;
        break;
      case "BALANCED":
        score =
          ((utilization.weightPercent + utilization.volumePercent) / 2) * 0.7 +
          (100 - ((loadPlan.cost?.total || 0) / 1000) * 10) * 0.3;
        break;
      default:
        score = (utilization.weightPercent + utilization.volumePercent) / 2;
    }

    const improvements: string[] = [];

    if (utilization.weightPercent < 70) {
      improvements.push(
        "Consider consolidating shipments to improve weight utilization",
      );
    }
    if (utilization.volumePercent < 70) {
      improvements.push(
        "Consider using smaller vehicle or consolidating shipments",
      );
    }

    return {
      strategy,
      score: Math.max(0, Math.min(100, score)),
      improvements,
    };
  }

  /**
   * Calculate multimodal optimization
   */
  private calculateMultimodalOptimization(
    plan: MultimodalLoadPlan,
    strategy: OptimizationStrategy,
  ): LoadOptimizationResult["optimization"] {
    // Calculate multimodal optimization score
    const improvements: string[] = [];
    let score = 75; // Base score

    // Cost optimization
    const avgLegCost = plan.totalCost / plan.legs.length;
    if (avgLegCost < 1000) {
      score += 10;
      improvements.push("Cost-efficient route selected");
    }

    // Time optimization
    const avgTransitTime = plan.totalTransitTime / plan.legs.length;
    if (avgTransitTime < 48) {
      score += 10;
      improvements.push("Fast transit time achieved");
    }

    // Utilization optimization
    const avgUtilization =
      plan.legs.reduce((sum, leg) => {
        const legItems = plan.items.filter((item) =>
          leg.itemIds.includes(item.id),
        );
        const totalWeight = legItems.reduce((s, i) => s + i.weight, 0);
        const totalVolume = legItems.reduce((s, i) => s + i.volume, 0);
        const weightUtil =
          (totalWeight / (leg.vehicleSpec.maxWeight || 1)) * 100;
        const volumeUtil =
          (totalVolume / (leg.vehicleSpec.maxVolume || 1)) * 100;
        return sum + (weightUtil + volumeUtil) / 2;
      }, 0) / plan.legs.length;

    if (avgUtilization > 85) {
      score += 5;
      improvements.push("High utilization achieved");
    }

    // Strategy-specific scoring
    if (strategy === "MINIMIZE_COST" && plan.totalCost < 5000) {
      score += 5;
    } else if (strategy === "MINIMIZE_TIME" && plan.totalTransitTime < 72) {
      score += 5;
    } else if (strategy === "MAXIMIZE_UTILIZATION" && avgUtilization > 90) {
      score += 5;
    }

    score = Math.min(100, score);

    return {
      strategy,
      score,
      totalCost: plan.totalCost,
      totalTime: plan.totalTransitTime,
      totalUtilization: avgUtilization,
      improvements,
    };
  }

  /**
   * Get AI recommendations
   */
  private async getAIRecommendations(loadPlan: LoadPlan): Promise<string[]> {
    // TODO: Integrate with AI service for intelligent recommendations
    // This could use knowledge base, historical data, ML models, etc.

    const recommendations: string[] = [];

    // Query knowledge base for best practices
    try {
      const kbResults = await knowledgeBaseService.search({
        query: "load design best practices",
        category: "BEST_PRACTICE",
        limit: 5,
      });

      for (const result of kbResults.results) {
        recommendations.push(
          result.summary || result.content.substring(0, 100),
        );
      }
    } catch (error) {
      console.error("Error querying knowledge base:", error);
    }

    return recommendations;
  }

  // Vehicle specs are now loaded from vehicleSpecifications.ts

  /**
   * Load regulations
   */
  private loadRegulations(): void {
    // TODO: Load regulations from compliance service or database
  }
}

// Export singleton instance
export const advancedLoadDesignService = new AdvancedLoadDesignService();
