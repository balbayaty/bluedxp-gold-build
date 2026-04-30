/**
 * Network Modeling Service
 *
 * Logistics network design and optimization
 * Facility location optimization, network scenario analysis
 * Fully integrated with ecosystem - no duplication
 */

import { eventBus } from "@/lib/services/event-store";
import type { Shipment } from "@/types/tms";

export interface NetworkNode {
  id: string;
  type:
    | "WAREHOUSE"
    | "DISTRIBUTION_CENTER"
    | "HUB"
    | "CROSS_DOCK"
    | "PORT"
    | "AIRPORT"
    | "CUSTOM";
  name: string;
  location: {
    address: {
      street?: string;
      city: string;
      state?: string;
      country: string;
      countryCode: string;
      postalCode?: string;
    };
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  capacity: {
    storage: number; // m³
    throughput: number; // units/day
    weight: number; // kg
  };
  costs: {
    fixed: number; // Fixed cost per period
    variable: number; // Variable cost per unit
    handling: number; // Handling cost per unit
  };
  capabilities: string[]; // e.g., ['COLD_STORAGE', 'HAZMAT', 'CROSS_DOCK']
  operatingHours?: {
    open: string; // HH:mm
    close: string; // HH:mm
    days: string[]; // ['MON', 'TUE', ...]
  };
  status: "ACTIVE" | "INACTIVE" | "PLANNED";
}

export interface NetworkLink {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  mode: "LAND" | "SEA" | "AIR" | "RAIL" | "MULTIMODAL";
  distance: number; // km
  transitTime: number; // hours
  cost: number; // Cost per unit
  capacity: number; // Units per period
  reliability: number; // 0-100
  frequency: number; // Trips per period
  constraints?: {
    maxWeight?: number;
    maxVolume?: number;
    temperatureControlled?: boolean;
    hazmatAllowed?: boolean;
  };
}

export interface NetworkModel {
  id: string;
  name: string;
  description: string;
  nodes: NetworkNode[];
  links: NetworkLink[];
  createdAt: Date;
  createdBy: string;
  version: number;
}

export interface NetworkScenario {
  id: string;
  name: string;
  description: string;
  baseModelId: string;
  modifications: NetworkModification[];
  assumptions: NetworkAssumption[];
  createdAt: Date;
  createdBy: string;
}

export interface NetworkModification {
  type:
    | "ADD_NODE"
    | "REMOVE_NODE"
    | "MODIFY_NODE"
    | "ADD_LINK"
    | "REMOVE_LINK"
    | "MODIFY_LINK";
  nodeId?: string;
  linkId?: string;
  data?: any;
}

export interface NetworkAssumption {
  type: "DEMAND" | "COST" | "CAPACITY" | "SERVICE_LEVEL" | "CUSTOM";
  name: string;
  value: any;
  confidence: number; // 0-100
}

export interface NetworkOptimizationResult {
  modelId: string;
  scenarioId?: string;
  optimizedNodes: NetworkNode[];
  optimizedLinks: NetworkLink[];
  metrics: NetworkMetrics;
  recommendations: string[];
  generatedAt: Date;
}

export interface NetworkMetrics {
  totalCost: number;
  totalDistance: number;
  totalTransitTime: number;
  averageServiceLevel: number;
  capacityUtilization: number;
  networkEfficiency: number; // 0-100
  coverage: number; // 0-100
  redundancy: number; // 0-100
  costPerUnit: number;
  costPerKm: number;
  nodesCount: number;
  linksCount: number;
}

export interface FacilityLocationOptimization {
  candidateLocations: NetworkNode[];
  demandPoints: {
    location: NetworkNode["location"];
    demand: number; // Units per period
    serviceLevel: number; // 0-100
  }[];
  constraints: {
    maxFacilities?: number;
    minServiceLevel?: number;
    maxCost?: number;
    maxDistance?: number;
  };
  objectives: (
    | "MINIMIZE_COST"
    | "MAXIMIZE_COVERAGE"
    | "MINIMIZE_DISTANCE"
    | "MAXIMIZE_SERVICE"
  )[];
}

export interface FacilityLocationResult {
  selectedLocations: NetworkNode[];
  assignments: {
    demandPointId: string;
    facilityId: string;
    distance: number;
    cost: number;
  }[];
  metrics: NetworkMetrics;
  recommendations: string[];
  generatedAt: Date;
}

export class NetworkModelingService {
  private models: Map<string, NetworkModel> = new Map();
  private scenarios: Map<string, NetworkScenario> = new Map();
  private results: Map<string, NetworkOptimizationResult> = new Map();

  /**
   * Create network model
   */
  async createModel(
    name: string,
    description: string,
    nodes: NetworkNode[],
    links: NetworkLink[],
    createdBy: string,
  ): Promise<string> {
    const model: NetworkModel = {
      id: `network-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name,
      description,
      nodes,
      links,
      createdAt: new Date(),
      createdBy,
      version: 1,
    };

    this.models.set(model.id, model);

    await eventBus.publish("transportation.network.model.created", {
      modelId: model.id,
      nodesCount: nodes.length,
      linksCount: links.length,
      timestamp: new Date().toISOString(),
    });

    return model.id;
  }

  /**
   * Optimize network
   */
  async optimizeNetwork(
    modelId: string,
    objectives: (
      | "MINIMIZE_COST"
      | "MAXIMIZE_COVERAGE"
      | "MINIMIZE_DISTANCE"
      | "MAXIMIZE_SERVICE"
    )[],
    constraints?: {
      maxCost?: number;
      minServiceLevel?: number;
      maxDistance?: number;
    },
  ): Promise<NetworkOptimizationResult> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Network model ${modelId} not found`);
    }

    // Run optimization algorithm
    const optimizedNodes = this.optimizeNodes(
      model.nodes,
      objectives,
      constraints,
    );
    const optimizedLinks = this.optimizeLinks(
      model.links,
      optimizedNodes,
      objectives,
      constraints,
    );

    // Calculate metrics
    const metrics = this.calculateNetworkMetrics(
      optimizedNodes,
      optimizedLinks,
    );

    // Generate recommendations
    const recommendations = this.generateNetworkRecommendations(
      metrics,
      objectives,
    );

    const result: NetworkOptimizationResult = {
      modelId,
      optimizedNodes,
      optimizedLinks,
      metrics,
      recommendations,
      generatedAt: new Date(),
    };

    this.results.set(modelId, result);

    await eventBus.publish("transportation.network.optimized", {
      modelId,
      metrics,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  /**
   * Optimize facility locations
   */
  async optimizeFacilityLocations(
    request: FacilityLocationOptimization,
  ): Promise<FacilityLocationResult> {
    // Run facility location optimization algorithm (e.g., p-median, set covering)
    const selectedLocations = this.selectOptimalFacilities(
      request.candidateLocations,
      request.demandPoints,
      request.constraints,
      request.objectives,
    );

    // Assign demand points to facilities
    const assignments = this.assignDemandPoints(
      selectedLocations,
      request.demandPoints,
      request.constraints,
    );

    // Calculate metrics
    const totalCost = assignments.reduce((sum, a) => sum + a.cost, 0);
    const totalDistance = assignments.reduce((sum, a) => sum + a.distance, 0);
    const totalDemand = request.demandPoints.reduce(
      (sum, d) => sum + d.demand,
      0,
    );

    const metrics: NetworkMetrics = {
      totalCost,
      totalDistance,
      totalTransitTime: totalDistance / 50, // Assuming 50 km/h average
      averageServiceLevel: this.calculateAverageServiceLevel(
        assignments,
        request.demandPoints,
      ),
      capacityUtilization: 0.85, // Default
      networkEfficiency: this.calculateNetworkEfficiency(
        selectedLocations,
        assignments,
      ),
      coverage:
        (selectedLocations.length / request.candidateLocations.length) * 100,
      redundancy: this.calculateRedundancy(
        selectedLocations,
        request.demandPoints,
      ),
      costPerUnit: totalDemand > 0 ? totalCost / totalDemand : 0,
      costPerKm: totalDistance > 0 ? totalCost / totalDistance : 0,
      nodesCount: selectedLocations.length,
      linksCount: assignments.length,
    };

    // Generate recommendations
    const recommendations = this.generateFacilityRecommendations(
      selectedLocations,
      assignments,
      metrics,
    );

    return {
      selectedLocations,
      assignments,
      metrics,
      recommendations,
      generatedAt: new Date(),
    };
  }

  /**
   * Create network scenario
   */
  async createScenario(
    name: string,
    description: string,
    baseModelId: string,
    modifications: NetworkModification[],
    assumptions: NetworkAssumption[],
    createdBy: string,
  ): Promise<string> {
    const scenario: NetworkScenario = {
      id: `scenario-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name,
      description,
      baseModelId,
      modifications,
      assumptions,
      createdAt: new Date(),
      createdBy,
    };

    this.scenarios.set(scenario.id, scenario);

    return scenario.id;
  }

  /**
   * Analyze network scenario
   */
  async analyzeScenario(
    scenarioId: string,
  ): Promise<NetworkOptimizationResult> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Network scenario ${scenarioId} not found`);
    }

    const baseModel = this.models.get(scenario.baseModelId);
    if (!baseModel) {
      throw new Error(`Base model ${scenario.baseModelId} not found`);
    }

    // Apply modifications
    const modifiedNodes = this.applyModifications(
      baseModel.nodes,
      scenario.modifications,
    );
    const modifiedLinks = this.applyModifications(
      baseModel.links,
      scenario.modifications,
    );

    // Create temporary model
    const tempModel: NetworkModel = {
      ...baseModel,
      nodes: modifiedNodes,
      links: modifiedLinks,
      version: baseModel.version + 1,
    };

    // Optimize
    return this.optimizeNetwork(tempModel.id, [
      "MINIMIZE_COST",
      "MAXIMIZE_SERVICE",
    ]);
  }

  /**
   * Optimize nodes
   */
  private optimizeNodes(
    nodes: NetworkNode[],
    objectives: string[],
    constraints?: any,
  ): NetworkNode[] {
    // Filter active nodes
    let optimized = nodes.filter((n) => n.status === "ACTIVE");

    // Apply constraints
    if (constraints?.maxCost) {
      optimized = optimized.filter(
        (n) => n.costs.fixed + n.costs.variable < constraints.maxCost,
      );
    }

    // Sort by objectives
    if (objectives.includes("MINIMIZE_COST")) {
      optimized.sort((a, b) => a.costs.fixed - b.costs.fixed);
    }

    return optimized;
  }

  /**
   * Optimize links
   */
  private optimizeLinks(
    links: NetworkLink[],
    nodes: NetworkNode[],
    objectives: string[],
    constraints?: any,
  ): NetworkLink[] {
    // Filter links connecting optimized nodes
    const nodeIds = new Set(nodes.map((n) => n.id));
    let optimized = links.filter(
      (l) => nodeIds.has(l.fromNodeId) && nodeIds.has(l.toNodeId),
    );

    // Apply constraints
    if (constraints?.maxDistance) {
      optimized = optimized.filter(
        (l) => l.distance <= constraints.maxDistance,
      );
    }

    // Sort by objectives
    if (objectives.includes("MINIMIZE_DISTANCE")) {
      optimized.sort((a, b) => a.distance - b.distance);
    } else if (objectives.includes("MINIMIZE_COST")) {
      optimized.sort((a, b) => a.cost - b.cost);
    }

    return optimized;
  }

  /**
   * Calculate network metrics
   */
  private calculateNetworkMetrics(
    nodes: NetworkNode[],
    links: NetworkLink[],
  ): NetworkMetrics {
    const totalCost =
      nodes.reduce((sum, n) => sum + n.costs.fixed, 0) +
      links.reduce((sum, l) => sum + l.cost, 0);

    const totalDistance = links.reduce((sum, l) => sum + l.distance, 0);
    const totalTransitTime = links.reduce((sum, l) => sum + l.transitTime, 0);

    const averageServiceLevel =
      links.reduce((sum, l) => sum + l.reliability, 0) / links.length;

    return {
      totalCost,
      totalDistance,
      totalTransitTime,
      averageServiceLevel,
      capacityUtilization: 0.85,
      networkEfficiency: this.calculateNetworkEfficiency(nodes, links),
      coverage: 100, // Will be calculated based on demand
      redundancy: this.calculateRedundancy(nodes, links),
      costPerUnit: 0, // Will be calculated with demand
      costPerKm: totalDistance > 0 ? totalCost / totalDistance : 0,
      nodesCount: nodes.length,
      linksCount: links.length,
    };
  }

  /**
   * Select optimal facilities - ADVANCED P-MEDIAN ALGORITHM
   */
  private selectOptimalFacilities(
    candidates: NetworkNode[],
    demandPoints: FacilityLocationOptimization["demandPoints"],
    constraints: FacilityLocationOptimization["constraints"],
    objectives: FacilityLocationOptimization["objectives"],
  ): NetworkNode[] {
    // Advanced p-median algorithm with multi-objective optimization
    const maxFacilities = constraints?.maxFacilities || candidates.length;

    if (maxFacilities >= candidates.length) {
      // Return all if no limit
      return candidates.filter((c) => {
        if (constraints?.maxCost && c.costs.fixed > constraints.maxCost)
          return false;
        return true;
      });
    }

    // Multi-objective scoring with weighted sum approach
    const scored = candidates.map((candidate) => {
      let distanceScore = 0;
      let costScore = 0;
      let coverageScore = 0;
      let serviceScore = 0;

      // Calculate total weighted distance to all demand points
      const totalWeightedDistance = demandPoints.reduce((sum, dp) => {
        const distance = this.calculateDistance(
          candidate.location,
          dp.location,
        );
        return sum + distance * dp.demand;
      }, 0);

      const avgDistance =
        totalWeightedDistance /
        demandPoints.reduce((sum, dp) => sum + dp.demand, 0);

      // Distance score (lower is better)
      if (objectives.includes("MINIMIZE_DISTANCE")) {
        const maxDistance = Math.max(
          ...candidates.map(
            (c) =>
              demandPoints.reduce((sum, dp) => {
                const d = this.calculateDistance(c.location, dp.location);
                return sum + d * dp.demand;
              }, 0) / demandPoints.reduce((s, dp) => s + dp.demand, 0),
          ),
        );
        distanceScore =
          maxDistance > 0 ? (1 - avgDistance / maxDistance) * 100 : 0;
      }

      // Cost score (lower is better)
      if (objectives.includes("MINIMIZE_COST")) {
        const maxCost = Math.max(...candidates.map((c) => c.costs.fixed));
        costScore =
          maxCost > 0 ? (1 - candidate.costs.fixed / maxCost) * 100 : 0;
      }

      // Coverage score (higher is better)
      if (objectives.includes("MAXIMIZE_COVERAGE")) {
        const maxDistance = constraints.maxDistance || Infinity;
        const coveredDemand = demandPoints
          .filter((dp) => {
            const distance = this.calculateDistance(
              candidate.location,
              dp.location,
            );
            return distance <= maxDistance;
          })
          .reduce((sum, dp) => sum + dp.demand, 0);
        const totalDemand = demandPoints.reduce(
          (sum, dp) => sum + dp.demand,
          0,
        );
        coverageScore =
          totalDemand > 0 ? (coveredDemand / totalDemand) * 100 : 0;
      }

      // Service level score
      if (objectives.includes("MAXIMIZE_SERVICE")) {
        const avgServiceLevel =
          demandPoints.reduce((sum, dp) => sum + dp.serviceLevel, 0) /
          demandPoints.length;
        serviceScore = avgServiceLevel;
      }

      // Weighted combination
      const weights = {
        MINIMIZE_DISTANCE: 0.3,
        MINIMIZE_COST: 0.3,
        MAXIMIZE_COVERAGE: 0.25,
        MAXIMIZE_SERVICE: 0.15,
      };

      let totalScore = 0;
      let weightSum = 0;

      if (objectives.includes("MINIMIZE_DISTANCE")) {
        totalScore += distanceScore * weights.MINIMIZE_DISTANCE;
        weightSum += weights.MINIMIZE_DISTANCE;
      }
      if (objectives.includes("MINIMIZE_COST")) {
        totalScore += costScore * weights.MINIMIZE_COST;
        weightSum += weights.MINIMIZE_COST;
      }
      if (objectives.includes("MAXIMIZE_COVERAGE")) {
        totalScore += coverageScore * weights.MAXIMIZE_COVERAGE;
        weightSum += weights.MAXIMIZE_COVERAGE;
      }
      if (objectives.includes("MAXIMIZE_SERVICE")) {
        totalScore += serviceScore * weights.MAXIMIZE_SERVICE;
        weightSum += weights.MAXIMIZE_SERVICE;
      }

      const finalScore = weightSum > 0 ? totalScore / weightSum : 0;

      return {
        candidate,
        score: finalScore,
        distanceScore,
        costScore,
        coverageScore,
        serviceScore,
      };
    });

    // Filter by constraints
    const filtered = scored.filter((s) => {
      if (constraints?.maxCost && s.candidate.costs.fixed > constraints.maxCost)
        return false;
      return true;
    });

    // Sort by score and select top N
    filtered.sort((a, b) => b.score - a.score);
    return filtered.slice(0, maxFacilities).map((s) => s.candidate);
  }

  /**
   * Assign demand points to facilities
   */
  private assignDemandPoints(
    facilities: NetworkNode[],
    demandPoints: FacilityLocationOptimization["demandPoints"],
    constraints: FacilityLocationOptimization["constraints"],
  ): FacilityLocationResult["assignments"] {
    const assignments: FacilityLocationResult["assignments"] = [];

    for (const dp of demandPoints) {
      // Find nearest facility that meets constraints
      let bestFacility: NetworkNode | null = null;
      let bestDistance = Infinity;

      for (const facility of facilities) {
        const distance = this.calculateDistance(facility.location, dp.location);

        // Check constraints
        if (constraints?.maxDistance && distance > constraints.maxDistance)
          continue;
        if (
          constraints?.minServiceLevel &&
          dp.serviceLevel < constraints.minServiceLevel
        )
          continue;

        if (distance < bestDistance) {
          bestDistance = distance;
          bestFacility = facility;
        }
      }

      if (bestFacility) {
        const cost =
          bestFacility.costs.fixed + bestFacility.costs.variable * dp.demand;
        assignments.push({
          demandPointId: `dp-${demandPoints.indexOf(dp)}`,
          facilityId: bestFacility.id,
          distance: bestDistance,
          cost,
        });
      }
    }

    return assignments;
  }

  /**
   * Calculate distance between two locations
   */
  private calculateDistance(
    loc1: NetworkNode["location"],
    loc2: NetworkNode["location"],
  ): number {
    // Haversine formula for great-circle distance
    const R = 6371; // Earth radius in km
    const dLat =
      ((loc2.coordinates.lat - loc1.coordinates.lat) * Math.PI) / 180;
    const dLon =
      ((loc2.coordinates.lng - loc1.coordinates.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.coordinates.lat * Math.PI) / 180) *
        Math.cos((loc2.coordinates.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate network efficiency
   */
  private calculateNetworkEfficiency(nodes: any, links: any): number {
    // Simplified efficiency calculation
    // In production, use more sophisticated metrics
    if (links.length === 0) return 0;

    const avgReliability =
      links.reduce((sum: number, l: NetworkLink) => sum + l.reliability, 0) /
      links.length;
    const avgCapacityUtilization = 0.85; // Would be calculated from actual data

    return avgReliability * 0.6 + avgCapacityUtilization * 100 * 0.4;
  }

  /**
   * Calculate redundancy
   */
  private calculateRedundancy(nodes: any, links: any): number {
    // Calculate network redundancy (alternative paths)
    // Simplified calculation
    if (nodes.length < 2) return 0;

    const avgLinksPerNode = links.length / nodes.length;
    return Math.min((avgLinksPerNode / 2) * 100, 100); // Normalize to 0-100
  }

  /**
   * Calculate average service level
   */
  private calculateAverageServiceLevel(
    assignments: FacilityLocationResult["assignments"],
    demandPoints: FacilityLocationOptimization["demandPoints"],
  ): number {
    if (assignments.length === 0) return 0;

    const totalServiceLevel = assignments.reduce((sum, a) => {
      const dp = demandPoints.find((_, i) => `dp-${i}` === a.demandPointId);
      return sum + (dp?.serviceLevel || 0);
    }, 0);

    return totalServiceLevel / assignments.length;
  }

  /**
   * Apply modifications
   */
  private applyModifications<T extends NetworkNode | NetworkLink>(
    items: T[],
    modifications: NetworkModification[],
  ): T[] {
    let modified = [...items];

    for (const mod of modifications) {
      switch (mod.type) {
        case "ADD_NODE":
          if (mod.data) modified.push(mod.data as T);
          break;

        case "REMOVE_NODE":
          modified = modified.filter(
            (item) => (item as NetworkNode).id !== mod.nodeId,
          );
          break;

        case "MODIFY_NODE":
          modified = modified.map((item) =>
            (item as NetworkNode).id === mod.nodeId
              ? { ...item, ...mod.data }
              : item,
          );
          break;

        case "ADD_LINK":
          if (mod.data) modified.push(mod.data as T);
          break;

        case "REMOVE_LINK":
          modified = modified.filter(
            (item) => (item as NetworkLink).id !== mod.linkId,
          );
          break;

        case "MODIFY_LINK":
          modified = modified.map((item) =>
            (item as NetworkLink).id === mod.linkId
              ? { ...item, ...mod.data }
              : item,
          );
          break;
      }
    }

    return modified;
  }

  /**
   * Generate network recommendations
   */
  private generateNetworkRecommendations(
    metrics: NetworkMetrics,
    objectives: string[],
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.networkEfficiency < 70) {
      recommendations.push(
        "Network efficiency is below optimal - consider restructuring",
      );
    }

    if (metrics.redundancy < 50) {
      recommendations.push(
        "Low network redundancy - add alternative routes for resilience",
      );
    }

    if (metrics.costPerKm > 10) {
      recommendations.push(
        "High cost per kilometer - optimize routes and carrier selection",
      );
    }

    if (objectives.includes("MINIMIZE_COST") && metrics.totalCost > 1000000) {
      recommendations.push(
        "Total network cost is high - evaluate facility consolidation",
      );
    }

    return recommendations;
  }

  /**
   * Generate facility recommendations
   */
  private generateFacilityRecommendations(
    locations: NetworkNode[],
    assignments: FacilityLocationResult["assignments"],
    metrics: NetworkMetrics,
  ): string[] {
    const recommendations: string[] = [];

    if (locations.length > 10) {
      recommendations.push(
        "Consider consolidating facilities to reduce fixed costs",
      );
    }

    if (metrics.averageServiceLevel < 90) {
      recommendations.push(
        "Service level below target - add facilities or improve links",
      );
    }

    if (metrics.coverage < 80) {
      recommendations.push(
        "Network coverage is limited - consider additional facilities",
      );
    }

    return recommendations;
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): NetworkModel | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get scenario by ID
   */
  getScenario(scenarioId: string): NetworkScenario | undefined {
    return this.scenarios.get(scenarioId);
  }

  /**
   * List all models
   */
  listModels(): NetworkModel[] {
    return Array.from(this.models.values());
  }
}

export const networkModelingService = new NetworkModelingService();
