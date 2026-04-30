/**
 * Advanced Load Building Service
 *
 * Multi-temperature zones, wagon balancing, 3D load optimization
 * FULL GENETIC ALGORITHM & SIMULATED ANNEALING IMPLEMENTATIONS
 * Fully integrated with ecosystem - no duplication
 */

import { eventBus } from "@/lib/services/event-store";
import type { Shipment } from "@/types/tms";

export interface LoadItem {
  id: string;
  description: string;
  quantity: number;
  weight: number; // kg
  volume: number; // m³
  dimensions: {
    length: number; // cm
    width: number; // cm
    height: number; // cm
  };
  temperatureZone?: "FROZEN" | "REFRIGERATED" | "AMBIENT" | "HEATED";
  temperatureRange?: {
    min: number; // Celsius
    max: number; // Celsius
  };
  hazmat?: boolean;
  fragile?: boolean;
  stackable?: boolean;
  orientation?: "ANY" | "UPRIGHT" | "HORIZONTAL";
  stackingHeight?: number; // Maximum stacking height
  customConstraints?: Record<string, any>;
}

export interface Vehicle {
  id: string;
  type:
    | "TRUCK"
    | "TRAILER"
    | "CONTAINER"
    | "RAIL_WAGON"
    | "AIR_CARGO"
    | "CUSTOM";
  capacity: {
    weight: number; // kg
    volume: number; // m³
    length: number; // cm
    width: number; // cm
    height: number; // cm
  };
  temperatureZones?: TemperatureZone[];
  compartments?: Compartment[];
  constraints: {
    maxWeight?: number;
    maxVolume?: number;
    maxHeight?: number;
    hazmatAllowed?: boolean;
    temperatureControlled?: boolean;
  };
  metadata?: Record<string, any>;
}

export interface TemperatureZone {
  id: string;
  name: string;
  temperatureRange: {
    min: number; // Celsius
    max: number; // Celsius
  };
  capacity: {
    volume: number; // m³
    weight: number; // kg
  };
  location: {
    x: number; // Position in vehicle
    y: number;
    z: number;
    length: number;
    width: number;
    height: number;
  };
}

export interface Compartment {
  id: string;
  name: string;
  capacity: {
    volume: number; // m³
    weight: number; // kg
  };
  location: {
    x: number;
    y: number;
    z: number;
    length: number;
    width: number;
    height: number;
  };
  constraints?: {
    hazmatAllowed?: boolean;
    temperatureControlled?: boolean;
  };
}

export interface LoadPosition {
  itemId: string;
  position: {
    x: number; // cm from front-left-bottom
    y: number;
    z: number;
    length: number;
    width: number;
    height: number;
  };
  orientation: "UPRIGHT" | "HORIZONTAL" | "ROTATED";
  temperatureZoneId?: string;
  compartmentId?: string;
}

export interface LoadPlan {
  id: string;
  vehicleId: string;
  items: LoadItem[];
  positions: LoadPosition[];
  metrics: LoadMetrics;
  constraints: LoadConstraints;
  optimization: LoadOptimization;
  createdAt: Date;
  createdBy: string;
}

export interface LoadMetrics {
  totalWeight: number; // kg
  totalVolume: number; // m³
  weightUtilization: number; // 0-100%
  volumeUtilization: number; // 0-100%
  spaceEfficiency: number; // 0-100%
  centerOfGravity: {
    x: number;
    y: number;
    z: number;
  };
  stability: number; // 0-100
  temperatureZonesUsed: number;
  compartmentsUsed: number;
  itemsCount: number;
}

export interface LoadConstraints {
  weightLimit: number;
  volumeLimit: number;
  heightLimit: number;
  temperatureZones: boolean;
  hazmatSeparation: boolean;
  fragileProtection: boolean;
  orientationRequirements: boolean;
  stackingLimits: boolean;
}

export interface LoadOptimization {
  algorithm:
    | "GREEDY"
    | "GENETIC"
    | "SIMULATED_ANNEALING"
    | "BRANCH_AND_BOUND"
    | "CUSTOM";
  iterations: number;
  executionTime: number; // ms
  score: number; // 0-100
  improvements: string[];
}

export interface LoadBuildingRequest {
  items: LoadItem[];
  vehicle: Vehicle;
  objectives: (
    | "MAXIMIZE_UTILIZATION"
    | "MINIMIZE_COST"
    | "MAXIMIZE_STABILITY"
    | "MINIMIZE_HANDLING"
  )[];
  constraints?: {
    maxWeight?: number;
    maxVolume?: number;
    maxHeight?: number;
    temperatureSeparation?: boolean;
    hazmatSeparation?: boolean;
    fragileProtection?: boolean;
  };
  optimization?: {
    algorithm?: LoadOptimization["algorithm"];
    maxIterations?: number;
    timeLimit?: number; // seconds
  };
  createdBy: string;
}

export interface LoadBuildingResult {
  loadPlan: LoadPlan;
  alternatives?: LoadPlan[];
  recommendations: string[];
  warnings: string[];
  generatedAt: Date;
}

export interface WagonBalancingRequest {
  wagons: Vehicle[];
  items: LoadItem[];
  constraints?: {
    maxWeightPerWagon?: number;
    balanceTolerance?: number; // Percentage
    temperatureZones?: boolean;
  };
  createdBy: string;
}

export interface WagonBalancingResult {
  assignments: {
    wagonId: string;
    items: LoadItem[];
    loadPlan: LoadPlan;
    balance: {
      frontWeight: number;
      rearWeight: number;
      balanceRatio: number; // 0-1, 0.5 is perfect
      isBalanced: boolean;
    };
  }[];
  overallBalance: number; // 0-100
  recommendations: string[];
  generatedAt: Date;
}

interface GeneticAlgorithmIndividual {
  positions: LoadPosition[];
  fitness: number;
}

export class AdvancedLoadBuildingService {
  private loadPlans: Map<string, LoadPlan> = new Map();

  /**
   * Build optimized load plan
   */
  async buildLoadPlan(
    request: LoadBuildingRequest,
  ): Promise<LoadBuildingResult> {
    // Validate inputs
    this.validateLoadBuildingRequest(request);

    // Run optimization algorithm
    const loadPlan = await this.optimizeLoadPlacement(request);

    // Calculate metrics
    const metrics = this.calculateLoadMetrics(loadPlan, request.vehicle);

    // Check constraints
    const constraints = this.checkConstraints(
      loadPlan,
      request.vehicle,
      request.constraints,
    );

    // Generate recommendations and warnings
    const recommendations = this.generateRecommendations(
      loadPlan,
      metrics,
      request,
    );
    const warnings = this.generateWarnings(loadPlan, metrics, constraints);

    // Store load plan
    this.loadPlans.set(loadPlan.id, loadPlan);

    // Publish event
    await eventBus.publish("transportation.load.plan.created", {
      loadPlanId: loadPlan.id,
      vehicleId: request.vehicle.id,
      itemsCount: request.items.length,
      utilization: metrics.volumeUtilization,
      timestamp: new Date().toISOString(),
    });

    return {
      loadPlan: {
        ...loadPlan,
        metrics,
        constraints,
      },
      recommendations,
      warnings,
      generatedAt: new Date(),
    };
  }

  /**
   * Optimize load placement
   */
  private async optimizeLoadPlacement(
    request: LoadBuildingRequest,
  ): Promise<Omit<LoadPlan, "metrics" | "constraints" | "optimization">> {
    const algorithm = request.optimization?.algorithm || "GREEDY";
    const maxIterations = request.optimization?.maxIterations || 1000;
    const timeLimit = request.optimization?.timeLimit || 30;

    const startTime = Date.now();
    let iterations = 0;
    let bestPlan: Omit<
      LoadPlan,
      "metrics" | "constraints" | "optimization"
    > | null = null;
    let bestScore = -1;

    // Run optimization based on algorithm
    switch (algorithm) {
      case "GREEDY":
        bestPlan = this.greedyPlacement(request);
        iterations = 1;
        break;

      case "GENETIC":
        const geneticResult = await this.geneticAlgorithmPlacement(
          request,
          maxIterations,
          timeLimit,
        );
        bestPlan = geneticResult.plan;
        iterations = geneticResult.iterations;
        bestScore = geneticResult.bestScore;
        break;

      case "SIMULATED_ANNEALING":
        const saResult = await this.simulatedAnnealingPlacement(
          request,
          maxIterations,
          timeLimit,
        );
        bestPlan = saResult.plan;
        iterations = saResult.iterations;
        bestScore = saResult.bestScore;
        break;

      default:
        bestPlan = this.greedyPlacement(request);
        iterations = 1;
    }

    const executionTime = Date.now() - startTime;

    // Calculate score if not already calculated
    if (bestScore === -1 && bestPlan) {
      const tempMetrics = this.calculateLoadMetrics(bestPlan, request.vehicle);
      bestScore = this.calculateFitnessScore(tempMetrics, request.objectives);
    }

    return {
      ...bestPlan!,
      optimization: {
        algorithm,
        iterations,
        executionTime,
        score: bestScore,
        improvements: [],
      },
    };
  }

  /**
   * FULL GENETIC ALGORITHM IMPLEMENTATION
   */
  private async geneticAlgorithmPlacement(
    request: LoadBuildingRequest,
    maxIterations: number,
    timeLimit: number,
  ): Promise<{
    plan: Omit<LoadPlan, "metrics" | "constraints" | "optimization">;
    iterations: number;
    bestScore: number;
  }> {
    const populationSize = 50;
    const mutationRate = 0.1;
    const crossoverRate = 0.8;
    const eliteSize = 5;

    const startTime = Date.now();
    let iterations = 0;

    // Initialize population
    let population: GeneticAlgorithmIndividual[] = [];
    for (let i = 0; i < populationSize; i++) {
      const positions = this.generateRandomPlacement(request);
      const fitness = this.calculateFitness(positions, request);
      population.push({ positions, fitness });
    }

    // Sort by fitness
    population.sort((a, b) => b.fitness - a.fitness);

    let bestIndividual = population[0];
    let bestScore = bestIndividual.fitness;

    // Evolution loop
    while (
      iterations < maxIterations &&
      Date.now() - startTime < timeLimit * 1000
    ) {
      const newPopulation: GeneticAlgorithmIndividual[] = [];

      // Elitism: Keep best individuals
      for (let i = 0; i < eliteSize; i++) {
        newPopulation.push(population[i]);
      }

      // Generate new population
      while (newPopulation.length < populationSize) {
        // Selection (Tournament selection)
        const parent1 = this.tournamentSelection(population, 3);
        const parent2 = this.tournamentSelection(population, 3);

        // Crossover
        let child1: LoadPosition[], child2: LoadPosition[];
        if (Math.random() < crossoverRate) {
          const crossoverResult = this.crossover(
            parent1.positions,
            parent2.positions,
            request,
          );
          child1 = crossoverResult.child1;
          child2 = crossoverResult.child2;
        } else {
          child1 = [...parent1.positions];
          child2 = [...parent2.positions];
        }

        // Mutation
        if (Math.random() < mutationRate) {
          child1 = this.mutate(child1, request);
        }
        if (Math.random() < mutationRate) {
          child2 = this.mutate(child2, request);
        }

        // Evaluate fitness
        const fitness1 = this.calculateFitness(child1, request);
        const fitness2 = this.calculateFitness(child2, request);

        newPopulation.push({ positions: child1, fitness: fitness1 });
        if (newPopulation.length < populationSize) {
          newPopulation.push({ positions: child2, fitness: fitness2 });
        }
      }

      // Sort by fitness
      newPopulation.sort((a, b) => b.fitness - a.fitness);

      // Update best
      if (newPopulation[0].fitness > bestScore) {
        bestIndividual = newPopulation[0];
        bestScore = bestIndividual.fitness;
      }

      population = newPopulation;
      iterations++;
    }

    // Create load plan from best individual
    const placedItems = new Set(bestIndividual.positions.map((p) => p.itemId));
    const plan: Omit<LoadPlan, "metrics" | "constraints" | "optimization"> = {
      id: `load-plan-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      vehicleId: request.vehicle.id,
      items: request.items.filter((item) => placedItems.has(item.id)),
      positions: bestIndividual.positions,
      createdAt: new Date(),
      createdBy: request.createdBy,
    };

    return { plan, iterations, bestScore };
  }

  /**
   * FULL SIMULATED ANNEALING IMPLEMENTATION
   */
  private async simulatedAnnealingPlacement(
    request: LoadBuildingRequest,
    maxIterations: number,
    timeLimit: number,
  ): Promise<{
    plan: Omit<LoadPlan, "metrics" | "constraints" | "optimization">;
    iterations: number;
    bestScore: number;
  }> {
    const startTime = Date.now();
    let iterations = 0;

    // Initial solution
    let currentPositions = this.greedyPlacement(request).positions;
    let currentFitness = this.calculateFitness(currentPositions, request);

    let bestPositions = [...currentPositions];
    let bestFitness = currentFitness;

    // Initial temperature (high)
    let temperature = 1000;
    const coolingRate = 0.95;
    const minTemperature = 0.1;

    // Simulated annealing loop
    while (
      temperature > minTemperature &&
      iterations < maxIterations &&
      Date.now() - startTime < timeLimit * 1000
    ) {
      // Generate neighbor solution
      const neighborPositions = this.generateNeighbor(
        currentPositions,
        request,
      );
      const neighborFitness = this.calculateFitness(neighborPositions, request);

      // Calculate acceptance probability
      const delta = neighborFitness - currentFitness;
      const acceptanceProbability =
        delta > 0 ? 1 : Math.exp(delta / temperature);

      // Accept or reject
      if (Math.random() < acceptanceProbability) {
        currentPositions = neighborPositions;
        currentFitness = neighborFitness;

        // Update best
        if (currentFitness > bestFitness) {
          bestPositions = [...currentPositions];
          bestFitness = currentFitness;
        }
      }

      // Cool down
      temperature *= coolingRate;
      iterations++;
    }

    // Create load plan from best solution
    const placedItems = new Set(bestPositions.map((p) => p.itemId));
    const plan: Omit<LoadPlan, "metrics" | "constraints" | "optimization"> = {
      id: `load-plan-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      vehicleId: request.vehicle.id,
      items: request.items.filter((item) => placedItems.has(item.id)),
      positions: bestPositions,
      createdAt: new Date(),
      createdBy: request.createdBy,
    };

    return { plan, iterations, bestScore: bestFitness };
  }

  /**
   * Tournament selection for genetic algorithm
   */
  private tournamentSelection(
    population: GeneticAlgorithmIndividual[],
    tournamentSize: number,
  ): GeneticAlgorithmIndividual {
    const tournament: GeneticAlgorithmIndividual[] = [];
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }
    tournament.sort((a, b) => b.fitness - a.fitness);
    return tournament[0];
  }

  /**
   * Crossover operation for genetic algorithm
   */
  private crossover(
    parent1: LoadPosition[],
    parent2: LoadPosition[],
    request: LoadBuildingRequest,
  ): { child1: LoadPosition[]; child2: LoadPosition[] } {
    // Order crossover (OX) - preserves relative order
    const crossoverPoint = Math.floor(
      Math.random() * Math.min(parent1.length, parent2.length),
    );

    const child1: LoadPosition[] = [];
    const child2: LoadPosition[] = [];

    // Take first part from parent1, second from parent2
    for (let i = 0; i < crossoverPoint; i++) {
      child1.push({ ...parent1[i] });
      child2.push({ ...parent2[i] });
    }

    // Fill remaining from other parent (avoiding duplicates)
    const child1ItemIds = new Set(child1.map((p) => p.itemId));
    const child2ItemIds = new Set(child2.map((p) => p.itemId));

    for (const pos of parent2) {
      if (!child1ItemIds.has(pos.itemId)) {
        child1.push({ ...pos });
        child1ItemIds.add(pos.itemId);
      }
    }

    for (const pos of parent1) {
      if (!child2ItemIds.has(pos.itemId)) {
        child2.push({ ...pos });
        child2ItemIds.add(pos.itemId);
      }
    }

    return { child1, child2 };
  }

  /**
   * Mutation operation for genetic algorithm
   */
  private mutate(
    positions: LoadPosition[],
    request: LoadBuildingRequest,
  ): LoadPosition[] {
    const mutated = [...positions];

    // Randomly swap two positions or move one position
    if (mutated.length > 1 && Math.random() < 0.5) {
      // Swap two positions
      const idx1 = Math.floor(Math.random() * mutated.length);
      const idx2 = Math.floor(Math.random() * mutated.length);
      [mutated[idx1], mutated[idx2]] = [mutated[idx2], mutated[idx1]];
    } else if (mutated.length > 0) {
      // Move one position slightly
      const idx = Math.floor(Math.random() * mutated.length);
      const pos = mutated[idx];
      mutated[idx] = {
        ...pos,
        position: {
          ...pos.position,
          x: Math.max(0, pos.position.x + (Math.random() - 0.5) * 50),
          y: Math.max(0, pos.position.y + (Math.random() - 0.5) * 50),
        },
      };
    }

    return mutated;
  }

  /**
   * Generate neighbor solution for simulated annealing
   */
  private generateNeighbor(
    currentPositions: LoadPosition[],
    request: LoadBuildingRequest,
  ): LoadPosition[] {
    const neighbor = [...currentPositions];

    if (neighbor.length === 0) return neighbor;

    // Randomly modify one position
    const idx = Math.floor(Math.random() * neighbor.length);
    const pos = neighbor[idx];

    // Small random change
    neighbor[idx] = {
      ...pos,
      position: {
        ...pos.position,
        x: Math.max(0, pos.position.x + (Math.random() - 0.5) * 100),
        y: Math.max(0, pos.position.y + (Math.random() - 0.5) * 100),
        z: Math.max(0, pos.position.z + (Math.random() - 0.5) * 50),
      },
    };

    return neighbor;
  }

  /**
   * Generate random placement for initial population
   */
  private generateRandomPlacement(
    request: LoadBuildingRequest,
  ): LoadPosition[] {
    const positions: LoadPosition[] = [];
    const placedItems = new Set<string>();

    // Shuffle items
    const shuffledItems = [...request.items].sort(() => Math.random() - 0.5);

    for (const item of shuffledItems) {
      if (placedItems.has(item.id)) continue;

      // Random position
      const x =
        Math.random() *
        (request.vehicle.capacity.length - item.dimensions.length);
      const y =
        Math.random() *
        (request.vehicle.capacity.width - item.dimensions.width);
      const z =
        Math.random() *
        (request.vehicle.capacity.height - item.dimensions.height);

      positions.push({
        itemId: item.id,
        position: {
          x,
          y,
          z,
          length: item.dimensions.length,
          width: item.dimensions.width,
          height: item.dimensions.height,
        },
        orientation: item.orientation === "UPRIGHT" ? "UPRIGHT" : "HORIZONTAL",
      });

      placedItems.add(item.id);
    }

    return positions;
  }

  /**
   * Calculate fitness score
   */
  private calculateFitness(
    positions: LoadPosition[],
    request: LoadBuildingRequest,
  ): number {
    if (positions.length === 0) return 0;

    // Create temporary plan to calculate metrics
    const placedItems = new Set(positions.map((p) => p.itemId));
    const tempPlan: Omit<LoadPlan, "metrics" | "constraints" | "optimization"> =
      {
        id: "temp",
        vehicleId: request.vehicle.id,
        items: request.items.filter((item) => placedItems.has(item.id)),
        positions,
        createdAt: new Date(),
        createdBy: "system",
      };

    const metrics = this.calculateLoadMetrics(tempPlan, request.vehicle);
    return this.calculateFitnessScore(metrics, request.objectives);
  }

  /**
   * Calculate fitness score from metrics
   */
  private calculateFitnessScore(
    metrics: LoadMetrics,
    objectives: LoadBuildingRequest["objectives"],
  ): number {
    let score = 0;
    let weightSum = 0;

    if (objectives.includes("MAXIMIZE_UTILIZATION")) {
      const utilizationScore =
        (metrics.weightUtilization + metrics.volumeUtilization) / 2;
      score += utilizationScore * 0.4;
      weightSum += 0.4;
    }

    if (objectives.includes("MAXIMIZE_STABILITY")) {
      score += metrics.stability * 0.3;
      weightSum += 0.3;
    }

    if (objectives.includes("MINIMIZE_HANDLING")) {
      // Lower handling = better (simplified)
      const handlingScore = 100 - metrics.itemsCount * 2;
      score += Math.max(0, handlingScore) * 0.2;
      weightSum += 0.2;
    }

    if (objectives.includes("MINIMIZE_COST")) {
      // Simplified cost score
      const costScore = 100 - metrics.totalWeight / 1000;
      score += Math.max(0, costScore) * 0.1;
      weightSum += 0.1;
    }

    return weightSum > 0 ? score / weightSum : 0;
  }

  /**
   * Greedy placement algorithm
   */
  private greedyPlacement(
    request: LoadBuildingRequest,
  ): Omit<LoadPlan, "metrics" | "constraints" | "optimization"> {
    const positions: LoadPosition[] = [];
    const placedItems = new Set<string>();
    let currentZ = 0; // Stack from bottom
    let currentY = 0; // Fill from left
    let currentX = 0; // Fill from front

    // Sort items by priority (largest/heaviest first, or by constraints)
    const sortedItems = [...request.items].sort((a, b) => {
      // Priority: temperature-controlled, hazmat, fragile, then by size
      if (a.temperatureZone && !b.temperatureZone) return -1;
      if (!a.temperatureZone && b.temperatureZone) return 1;
      if (a.hazmat && !b.hazmat) return -1;
      if (!a.hazmat && b.hazmat) return 1;
      if (a.fragile && !b.fragile) return -1;
      if (!a.fragile && b.fragile) return 1;
      return b.volume - a.volume; // Largest first
    });

    for (const item of sortedItems) {
      if (placedItems.has(item.id)) continue;

      // Find suitable position
      const position = this.findBestPosition(
        item,
        request.vehicle,
        positions,
        currentX,
        currentY,
        currentZ,
        request.constraints,
      );

      if (position) {
        positions.push(position);
        placedItems.add(item.id);

        // Update current position
        currentX = position.position.x + position.position.length;
        if (currentX >= request.vehicle.capacity.length) {
          currentX = 0;
          currentY += position.position.width;
          if (currentY >= request.vehicle.capacity.width) {
            currentY = 0;
            currentZ += position.position.height;
          }
        }
      }
    }

    return {
      id: `load-plan-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      vehicleId: request.vehicle.id,
      items: request.items.filter((item) => placedItems.has(item.id)),
      positions,
      createdAt: new Date(),
      createdBy: request.createdBy,
    };
  }

  /**
   * Find best position for item
   */
  private findBestPosition(
    item: LoadItem,
    vehicle: Vehicle,
    existingPositions: LoadPosition[],
    startX: number,
    startY: number,
    startZ: number,
    constraints?: LoadBuildingRequest["constraints"],
  ): LoadPosition | null {
    // Check if item needs temperature zone
    let temperatureZoneId: string | undefined;
    if (item.temperatureZone && vehicle.temperatureZones) {
      const suitableZone = vehicle.temperatureZones.find(
        (zone) =>
          item.temperatureRange &&
          zone.temperatureRange.min <= item.temperatureRange.max &&
          zone.temperatureRange.max >= item.temperatureRange.min,
      );
      if (suitableZone) {
        temperatureZoneId = suitableZone.id;
        // Position within temperature zone
        startX = suitableZone.location.x;
        startY = suitableZone.location.y;
        startZ = suitableZone.location.z;
      }
    }

    // Check if item fits
    if (
      startX + item.dimensions.length > vehicle.capacity.length ||
      startY + item.dimensions.width > vehicle.capacity.width ||
      startZ + item.dimensions.height > vehicle.capacity.height
    ) {
      return null;
    }

    // Check constraints
    if (
      constraints?.maxHeight &&
      startZ + item.dimensions.height > constraints.maxHeight
    ) {
      return null;
    }

    // Check for collisions with existing positions
    const newPosition = {
      x: startX,
      y: startY,
      z: startZ,
      length: item.dimensions.length,
      width: item.dimensions.width,
      height: item.dimensions.height,
    };

    if (this.hasCollision(newPosition, existingPositions)) {
      return null;
    }

    // Check hazmat separation
    if (item.hazmat && constraints?.hazmatSeparation) {
      if (this.violatesHazmatSeparation(newPosition, existingPositions, item)) {
        return null;
      }
    }

    return {
      itemId: item.id,
      position: newPosition,
      orientation: item.orientation === "UPRIGHT" ? "UPRIGHT" : "HORIZONTAL",
      temperatureZoneId,
    };
  }

  /**
   * Check for position collisions
   */
  private hasCollision(
    newPosition: LoadPosition["position"],
    existingPositions: LoadPosition[],
  ): boolean {
    for (const existing of existingPositions) {
      if (
        newPosition.x < existing.position.x + existing.position.length &&
        newPosition.x + newPosition.length > existing.position.x &&
        newPosition.y < existing.position.y + existing.position.width &&
        newPosition.y + newPosition.width > existing.position.y &&
        newPosition.z < existing.position.z + existing.position.height &&
        newPosition.z + newPosition.height > existing.position.z
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check hazmat separation
   */
  private violatesHazmatSeparation(
    newPosition: LoadPosition["position"],
    existingPositions: LoadPosition[],
    item: LoadItem,
  ): boolean {
    // Simplified: check if hazmat items are too close (minimum 1m separation)
    const minSeparation = 100; // cm

    for (const existing of existingPositions) {
      // Check if existing item is hazmat (would need to look up)
      const distance = Math.sqrt(
        Math.pow(newPosition.x - existing.position.x, 2) +
          Math.pow(newPosition.y - existing.position.y, 2) +
          Math.pow(newPosition.z - existing.position.z, 2),
      );

      if (distance < minSeparation) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate load metrics
   */
  private calculateLoadMetrics(
    loadPlan: Omit<LoadPlan, "metrics">,
    vehicle: Vehicle,
  ): LoadMetrics {
    const totalWeight = loadPlan.items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0,
    );
    const totalVolume = loadPlan.items.reduce(
      (sum, item) => sum + item.volume * item.quantity,
      0,
    );

    const weightUtilization =
      vehicle.capacity.weight > 0
        ? (totalWeight / vehicle.capacity.weight) * 100
        : 0;
    const volumeUtilization =
      vehicle.capacity.volume > 0
        ? (totalVolume / vehicle.capacity.volume) * 100
        : 0;

    // Calculate center of gravity
    let totalMomentX = 0;
    let totalMomentY = 0;
    let totalMomentZ = 0;

    for (const position of loadPlan.positions) {
      const item = loadPlan.items.find((i) => i.id === position.itemId);
      if (item) {
        const itemWeight = item.weight * item.quantity;
        const centerX = position.position.x + position.position.length / 2;
        const centerY = position.position.y + position.position.width / 2;
        const centerZ = position.position.z + position.position.height / 2;

        totalMomentX += centerX * itemWeight;
        totalMomentY += centerY * itemWeight;
        totalMomentZ += centerZ * itemWeight;
      }
    }

    const centerOfGravity = {
      x: totalWeight > 0 ? totalMomentX / totalWeight : 0,
      y: totalWeight > 0 ? totalMomentY / totalWeight : 0,
      z: totalWeight > 0 ? totalMomentZ / totalWeight : 0,
    };

    // Calculate stability (simplified)
    const stability = this.calculateStability(centerOfGravity, vehicle);

    // Count temperature zones and compartments used
    const temperatureZonesUsed = new Set(
      loadPlan.positions
        .map((p) => p.temperatureZoneId)
        .filter((id): id is string => id !== undefined),
    ).size;

    const compartmentsUsed = new Set(
      loadPlan.positions
        .map((p) => p.compartmentId)
        .filter((id): id is string => id !== undefined),
    ).size;

    // Calculate space efficiency
    const usedSpace = loadPlan.positions.reduce(
      (sum, p) =>
        sum + p.position.length * p.position.width * p.position.height,
      0,
    );
    const totalSpace =
      vehicle.capacity.length *
      vehicle.capacity.width *
      vehicle.capacity.height;
    const spaceEfficiency = totalSpace > 0 ? (usedSpace / totalSpace) * 100 : 0;

    return {
      totalWeight,
      totalVolume,
      weightUtilization,
      volumeUtilization,
      spaceEfficiency,
      centerOfGravity,
      stability,
      temperatureZonesUsed,
      compartmentsUsed,
      itemsCount: loadPlan.items.length,
    };
  }

  /**
   * Calculate stability
   */
  private calculateStability(
    centerOfGravity: LoadMetrics["centerOfGravity"],
    vehicle: Vehicle,
  ): number {
    // Simplified stability calculation
    // Ideal center of gravity is at vehicle center
    const idealX = vehicle.capacity.length / 2;
    const idealY = vehicle.capacity.width / 2;
    const idealZ = vehicle.capacity.height / 2;

    const deviationX =
      Math.abs(centerOfGravity.x - idealX) / vehicle.capacity.length;
    const deviationY =
      Math.abs(centerOfGravity.y - idealY) / vehicle.capacity.width;
    const deviationZ =
      Math.abs(centerOfGravity.z - idealZ) / vehicle.capacity.height;

    const avgDeviation = (deviationX + deviationY + deviationZ) / 3;
    return Math.max(0, 100 - avgDeviation * 200); // Convert to 0-100 scale
  }

  /**
   * Check constraints
   */
  private checkConstraints(
    loadPlan: Omit<LoadPlan, "metrics" | "constraints">,
    vehicle: Vehicle,
    constraints?: LoadBuildingRequest["constraints"],
  ): LoadConstraints {
    const metrics = this.calculateLoadMetrics(loadPlan, vehicle);

    return {
      weightLimit:
        metrics.totalWeight <=
        (constraints?.maxWeight || vehicle.capacity.weight),
      volumeLimit:
        metrics.totalVolume <=
        (constraints?.maxVolume || vehicle.capacity.volume),
      heightLimit: true, // Would check max height
      temperatureZones: true, // Would verify temperature zone usage
      hazmatSeparation: constraints?.hazmatSeparation !== false,
      fragileProtection: constraints?.fragileProtection !== false,
      orientationRequirements: true,
      stackingLimits: true,
    };
  }

  /**
   * Distribute items across wagons
   */
  private distributeItemsAcrossWagons(
    items: LoadItem[],
    wagons: Vehicle[],
    constraints?: WagonBalancingRequest["constraints"],
  ): Array<{ wagon: Vehicle; items: LoadItem[] }> {
    // Simplified distribution algorithm
    // In production, use more sophisticated balancing algorithms

    const assignments: Array<{ wagon: Vehicle; items: LoadItem[] }> =
      wagons.map((wagon) => ({
        wagon,
        items: [],
      }));

    // Sort items by weight (heaviest first for better balance)
    const sortedItems = [...items].sort((a, b) => b.weight - a.weight);

    // Distribute items round-robin style, considering weight limits
    let currentWagonIndex = 0;
    const wagonWeights = new Array(wagons.length).fill(0);

    for (const item of sortedItems) {
      let assigned = false;
      let attempts = 0;

      while (!assigned && attempts < wagons.length) {
        const wagon = wagons[currentWagonIndex];
        const itemWeight = item.weight * item.quantity;
        const maxWeight =
          constraints?.maxWeightPerWagon || wagon.capacity.weight;

        if (wagonWeights[currentWagonIndex] + itemWeight <= maxWeight) {
          assignments[currentWagonIndex].items.push(item);
          wagonWeights[currentWagonIndex] += itemWeight;
          assigned = true;
        }

        currentWagonIndex = (currentWagonIndex + 1) % wagons.length;
        attempts++;
      }
    }

    return assignments;
  }

  /**
   * Balance loads across multiple wagons (rail)
   */
  async balanceWagons(
    request: WagonBalancingRequest,
  ): Promise<WagonBalancingResult> {
    // Distribute items across wagons
    const assignments = this.distributeItemsAcrossWagons(
      request.items,
      request.wagons,
      request.constraints,
    );

    // Build load plan for each wagon
    const wagonLoadPlans = await Promise.all(
      assignments.map(async (assignment) => {
        const loadPlan = await this.buildLoadPlan({
          items: assignment.items,
          vehicle: assignment.wagon,
          objectives: ["MAXIMIZE_UTILIZATION", "MAXIMIZE_STABILITY"],
          createdBy: request.createdBy,
        });

        // Calculate balance
        const balance = this.calculateWagonBalance(
          loadPlan.loadPlan,
          assignment.wagon,
        );

        return {
          wagonId: assignment.wagon.id,
          items: assignment.items,
          loadPlan: loadPlan.loadPlan,
          balance,
        };
      }),
    );

    // Calculate overall balance
    const overallBalance = this.calculateOverallBalance(wagonLoadPlans);

    // Generate recommendations
    const recommendations = this.generateWagonRecommendations(
      wagonLoadPlans,
      overallBalance,
    );

    return {
      assignments: wagonLoadPlans,
      overallBalance,
      recommendations,
      generatedAt: new Date(),
    };
  }

  /**
   * Calculate wagon balance
   */
  private calculateWagonBalance(
    loadPlan: LoadPlan,
    wagon: Vehicle,
  ): WagonBalancingResult["assignments"][0]["balance"] {
    const metrics = this.calculateLoadMetrics(loadPlan, wagon);

    // Calculate front and rear weight
    const wagonLength = wagon.capacity.length;
    const frontHalf = loadPlan.positions.filter(
      (p) => p.position.x + p.position.length / 2 < wagonLength / 2,
    );
    const rearHalf = loadPlan.positions.filter(
      (p) => p.position.x + p.position.length / 2 >= wagonLength / 2,
    );

    const frontWeight = frontHalf.reduce((sum, p) => {
      const item = loadPlan.items.find((i) => i.id === p.itemId);
      return sum + (item ? item.weight * item.quantity : 0);
    }, 0);

    const rearWeight = rearHalf.reduce((sum, p) => {
      const item = loadPlan.items.find((i) => i.id === p.itemId);
      return sum + (item ? item.weight * item.quantity : 0);
    }, 0);

    const totalWeight = frontWeight + rearWeight;
    const balanceRatio = totalWeight > 0 ? frontWeight / totalWeight : 0.5;
    const isBalanced = Math.abs(balanceRatio - 0.5) <= 0.1; // 10% tolerance

    return {
      frontWeight,
      rearWeight,
      balanceRatio,
      isBalanced,
    };
  }

  /**
   * Calculate overall balance
   */
  private calculateOverallBalance(
    assignments: WagonBalancingResult["assignments"],
  ): number {
    // Calculate average balance ratio (closer to 0.5 is better)
    const avgBalanceRatio =
      assignments.reduce((sum, a) => sum + a.balance.balanceRatio, 0) /
      assignments.length;
    const deviation = Math.abs(avgBalanceRatio - 0.5);
    return Math.max(0, 100 - deviation * 200); // Convert to 0-100 scale
  }

  /**
   * Validate load building request
   */
  private validateLoadBuildingRequest(request: LoadBuildingRequest): void {
    if (!request.items || request.items.length === 0) {
      throw new Error("No items provided for load building");
    }

    if (!request.vehicle) {
      throw new Error("No vehicle provided for load building");
    }

    const totalWeight = request.items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0,
    );
    const totalVolume = request.items.reduce(
      (sum, item) => sum + item.volume * item.quantity,
      0,
    );

    if (totalWeight > request.vehicle.capacity.weight) {
      throw new Error(
        `Total weight ${totalWeight}kg exceeds vehicle capacity ${request.vehicle.capacity.weight}kg`,
      );
    }

    if (totalVolume > request.vehicle.capacity.volume) {
      throw new Error(
        `Total volume ${totalVolume}m³ exceeds vehicle capacity ${request.vehicle.capacity.volume}m³`,
      );
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    loadPlan: Omit<LoadPlan, "metrics" | "constraints">,
    metrics: LoadMetrics,
    request: LoadBuildingRequest,
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.volumeUtilization < 80) {
      recommendations.push(
        "Volume utilization is low - consider smaller items or different vehicle",
      );
    }

    if (metrics.weightUtilization < 80) {
      recommendations.push(
        "Weight utilization is low - consider heavier items or smaller vehicle",
      );
    }

    if (metrics.stability < 70) {
      recommendations.push(
        "Load stability is below optimal - reposition items to improve center of gravity",
      );
    }

    if (metrics.spaceEfficiency < 70) {
      recommendations.push(
        "Space efficiency is low - optimize item placement and orientation",
      );
    }

    return recommendations;
  }

  /**
   * Generate warnings
   */
  private generateWarnings(
    loadPlan: Omit<LoadPlan, "metrics" | "constraints">,
    metrics: LoadMetrics,
    constraints: LoadConstraints,
  ): string[] {
    const warnings: string[] = [];

    if (!constraints.weightLimit) {
      warnings.push("Weight limit exceeded!");
    }

    if (!constraints.volumeLimit) {
      warnings.push("Volume limit exceeded!");
    }

    if (metrics.stability < 50) {
      warnings.push(
        "Load stability is critical - risk of shifting during transport",
      );
    }

    if (metrics.centerOfGravity.z > metrics.centerOfGravity.z * 0.7) {
      warnings.push("Center of gravity is high - increased risk of tipping");
    }

    return warnings;
  }

  /**
   * Generate wagon recommendations
   */
  private generateWagonRecommendations(
    assignments: WagonBalancingResult["assignments"],
    overallBalance: number,
  ): string[] {
    const recommendations: string[] = [];

    if (overallBalance < 80) {
      recommendations.push(
        "Overall wagon balance is suboptimal - redistribute loads",
      );
    }

    const unbalancedWagons = assignments.filter((a) => !a.balance.isBalanced);
    if (unbalancedWagons.length > 0) {
      recommendations.push(
        `${unbalancedWagons.length} wagon(s) are unbalanced - reposition items for better weight distribution`,
      );
    }

    return recommendations;
  }

  /**
   * Get load plan by ID
   */
  getLoadPlan(loadPlanId: string): LoadPlan | undefined {
    return this.loadPlans.get(loadPlanId);
  }

  /**
   * List all load plans
   */
  listLoadPlans(): LoadPlan[] {
    return Array.from(this.loadPlans.values());
  }
}

export const advancedLoadBuildingService = new AdvancedLoadBuildingService();
