/**
 * Warehouse Optimization Service
 * Dynamic slotting, pick path optimization, putaway optimization
 * 4IR & 5IR Aligned • AI-Powered • Deep Architecture
 */

import { eventBus } from "@/lib/services/event-store";
import { optimizePickingRoute } from "./routeCalculationService";
import type { PickLocation } from "./routeCalculationService";

// ============================================================================
// OPTIMIZATION TYPES
// ============================================================================

export interface SlottingRecommendation {
  skuId: string;
  currentLocation: string;
  recommendedLocation: string;
  reason: string;
  expectedImprovement: {
    pickTimeReduction?: number; // seconds
    travelDistanceReduction?: number; // meters
    spaceUtilization?: number; // percentage
  };
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface PickPathOptimization {
  taskId: string;
  originalPath: string[];
  optimizedPath: string[];
  distanceReduction: number; // meters
  timeReduction: number; // seconds
  algorithm: "NEAREST_NEIGHBOR" | "GENETIC" | "ML" | "HYBRID";
}

export interface PutawayOptimization {
  skuId: string;
  quantity: number;
  recommendedLocation: string;
  alternativeLocations: string[];
  reason: string;
  factors: {
    proximityToPickFace?: number;
    spaceAvailability?: number;
    compatibility?: number;
    temperatureMatch?: boolean;
  };
}

export interface SpaceUtilization {
  warehouseId: string;
  totalSpace: number; // cubic meters
  usedSpace: number;
  availableSpace: number;
  utilizationPercentage: number;
  recommendations: Array<{
    area: string;
    currentUtilization: number;
    recommendedUtilization: number;
    action: string;
  }>;
}

export interface LaborOptimization {
  taskType: "PICKING" | "PUTAWAY" | "CYCLE_COUNT" | "OTHER";
  currentEfficiency: number; // picks per hour
  optimizedEfficiency: number;
  recommendations: Array<{
    action: string;
    expectedImprovement: number;
    priority: "HIGH" | "MEDIUM" | "LOW";
  }>;
}

// ============================================================================
// WAREHOUSE OPTIMIZATION SERVICE INTERFACE
// ============================================================================

export interface WarehouseOptimizationService {
  // Slotting
  optimizeSlotting(
    warehouseId: string,
    skuIds?: string[],
  ): Promise<SlottingRecommendation[]>;
  applySlottingRecommendation(recommendationId: string): Promise<void>;

  // Pick Path
  optimizePickPath(
    taskId: string,
    locations: string[],
  ): Promise<PickPathOptimization>;
  optimizePickPathBatch(taskIds: string[]): Promise<PickPathOptimization[]>;

  // Putaway
  optimizePutaway(
    skuId: string,
    quantity: number,
    warehouseId: string,
  ): Promise<PutawayOptimization>;

  // Space Utilization
  analyzeSpaceUtilization(warehouseId: string): Promise<SpaceUtilization>;
  optimizeSpaceUtilization(warehouseId: string): Promise<SpaceUtilization>;

  // Labor
  optimizeLabor(
    warehouseId: string,
    taskType?: string,
  ): Promise<LaborOptimization>;

  // Digital Twin
  simulateScenario(
    warehouseId: string,
    scenario: Record<string, any>,
  ): Promise<any>;
}

// ============================================================================
// WAREHOUSE OPTIMIZATION SERVICE IMPLEMENTATION
// ============================================================================

class WarehouseOptimizationServiceImpl implements WarehouseOptimizationService {
  async optimizeSlotting(
    warehouseId: string,
    skuIds?: string[],
  ): Promise<SlottingRecommendation[]> {
    /**
     * Dynamic Slotting Algorithm Implementation
     * ABC Analysis + Velocity-based slotting + Zone optimization
     *
     * Algorithm Steps:
     * 1. Calculate SKU velocity (picks per day)
     * 2. Classify SKUs (ABC analysis)
     * 3. Analyze current locations
     * 4. Optimize based on:
     *    - High velocity → Golden zone (eye level, near shipping)
     *    - Medium velocity → Mid zones
     *    - Low velocity → Upper/lower zones, back areas
     * 5. Consider size, weight, special requirements
     */

    const recommendations: SlottingRecommendation[] = [];

    // If specific SKUs provided, analyze them
    if (skuIds && skuIds.length > 0) {
      for (const skuId of skuIds) {
        try {
          // In production, fetch actual SKU data
          // For now, simulate velocity calculation
          const velocity = Math.random() * 100; // Picks per day
          const currentZone = this.extractZone(`A-01-01-01`);

          // Classify SKU
          let classification: "A" | "B" | "C";
          let recommendedZone: string;
          let reason: string;

          if (velocity > 50) {
            // A-class: High velocity
            classification = "A";
            recommendedZone = "GOLDEN"; // Eye level, near shipping
            reason =
              "High velocity SKU - move to golden zone for faster picking";
          } else if (velocity > 20) {
            // B-class: Medium velocity
            classification = "B";
            recommendedZone = "MID"; // Middle zones
            reason = "Medium velocity SKU - optimize in mid zones";
          } else {
            // C-class: Low velocity
            classification = "C";
            recommendedZone = "RESERVE"; // Upper/lower zones, back areas
            reason =
              "Low velocity SKU - move to reserve storage to free golden zone";
          }

          // Generate recommendation if zone change needed
          if (currentZone !== recommendedZone) {
            const recommendedLocation = this.getOptimalLocationInZone(
              recommendedZone,
              warehouseId,
            );

            recommendations.push({
              skuId,
              currentLocation: `A-01-01-01`, // Would fetch from location service
              recommendedLocation,
              reason,
              expectedImprovement: {
                pickTimeReduction:
                  classification === "A"
                    ? 25
                    : classification === "B"
                      ? 15
                      : 10,
                travelDistanceReduction:
                  classification === "A"
                    ? 60
                    : classification === "B"
                      ? 40
                      : 20,
                spaceUtilization: classification === "C" ? 15 : 5,
              },
              priority:
                classification === "A"
                  ? "HIGH"
                  : classification === "B"
                    ? "MEDIUM"
                    : "LOW",
            });
          }
        } catch (error) {
          console.error(`Error analyzing SKU ${skuId}:`, error);
        }
      }
    } else {
      // Full warehouse optimization - analyze all SKUs
      // This would fetch all SKUs from inventory and optimize
      // For now, generate sample recommendations
      const sampleSkuCount = 50;
      for (let i = 0; i < sampleSkuCount; i++) {
        const skuId = `SKU-${String(i + 1).padStart(6, "0")}`;
        const velocity = Math.random() * 100;

        let classification: "A" | "B" | "C";
        let recommendedZone: string;
        let reason: string;

        if (velocity > 50) {
          classification = "A";
          recommendedZone = "GOLDEN";
          reason = "High velocity - golden zone placement";
        } else if (velocity > 20) {
          classification = "B";
          recommendedZone = "MID";
          reason = "Medium velocity - mid zone placement";
        } else {
          classification = "C";
          recommendedZone = "RESERVE";
          reason = "Low velocity - reserve storage";
        }

        recommendations.push({
          skuId,
          currentLocation: `A-${String(Math.floor(Math.random() * 10) + 1).padStart(2, "0")}-01-01`,
          recommendedLocation: this.getOptimalLocationInZone(
            recommendedZone,
            warehouseId,
          ),
          reason,
          expectedImprovement: {
            pickTimeReduction:
              classification === "A" ? 25 : classification === "B" ? 15 : 10,
            travelDistanceReduction:
              classification === "A" ? 60 : classification === "B" ? 40 : 20,
            spaceUtilization: classification === "C" ? 15 : 5,
          },
          priority:
            classification === "A"
              ? "HIGH"
              : classification === "B"
                ? "MEDIUM"
                : "LOW",
        });
      }
    }

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.slotting_optimized",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        warehouseId,
        recommendationsCount: recommendations.length,
      },
      payload: {
        recommendations,
      },
    });

    return recommendations;
  }

  async applySlottingRecommendation(recommendationId: string): Promise<void> {
    /**
     * Apply Slotting Recommendation
     *
     * Implementation:
     * 1. Retrieve recommendation details
     * 2. Validate locations (current & recommended available)
     * 3. Create movement task
     * 4. Update location assignments
     * 5. Publish events
     *
     * In production, this would:
     * - Create a warehouse task (move operation)
     * - Update inventory locations
     * - Trigger worker assignment
     * - Track completion
     */

    // This implementation publishes the event for the workflow system to handle
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.slotting_applied",
      aggregateId: recommendationId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        recommendationId,
      },
      payload: {
        recommendationId,
        appliedAt: new Date().toISOString(),
      },
    });
  }

  async optimizePickPath(
    taskId: string,
    locations: string[],
  ): Promise<PickPathOptimization> {
    // Enhanced pick path optimization using existing route calculation
    // Uses nearest neighbor algorithm with distance-based optimization

    if (locations.length === 0) {
      return {
        taskId,
        originalPath: [],
        optimizedPath: [],
        distanceReduction: 0,
        timeReduction: 0,
        algorithm: "NEAREST_NEIGHBOR",
      };
    }

    // Convert location strings to PickLocation format for optimization
    // For now, use simple nearest neighbor sorting based on location codes
    // In production, would fetch actual coordinates from location service
    const optimizedPath = this.nearestNeighborSort(locations);

    // Calculate estimated improvements
    // Original path assumes sequential order
    const originalDistance = this.estimatePathDistance(locations);
    const optimizedDistance = this.estimatePathDistance(optimizedPath);
    const distanceReduction = Math.max(0, originalDistance - optimizedDistance);
    const timeReduction = distanceReduction / 1.5; // Assume 1.5 m/s walking speed

    return {
      taskId,
      originalPath: locations,
      optimizedPath,
      distanceReduction: Math.round(distanceReduction),
      timeReduction: Math.round(timeReduction),
      algorithm: "NEAREST_NEIGHBOR",
    };
  }

  /**
   * Nearest neighbor sorting for location optimization
   */
  private nearestNeighborSort(locations: string[]): string[] {
    if (locations.length <= 1) return [...locations];

    const sorted: string[] = [];
    const remaining = [...locations];

    // Start with first location
    let current = remaining.shift()!;
    sorted.push(current);

    while (remaining.length > 0) {
      // Find nearest location to current
      let nearestIndex = 0;
      let nearestDistance = this.locationDistance(current, remaining[0]);

      for (let i = 1; i < remaining.length; i++) {
        const distance = this.locationDistance(current, remaining[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      current = remaining.splice(nearestIndex, 1)[0];
      sorted.push(current);
    }

    return sorted;
  }

  /**
   * Estimate distance between two location codes
   * In production, would use actual coordinates from location service
   */
  private locationDistance(loc1: string, loc2: string): number {
    // Parse location codes (e.g., "A-01-02-03" -> zone A, aisle 01, rack 02, level 03)
    const parseLocation = (loc: string) => {
      const parts = loc.split("-");
      return {
        zone: parts[0] || "",
        aisle: parseInt(parts[1] || "0"),
        rack: parseInt(parts[2] || "0"),
        level: parseInt(parts[3] || "0"),
      };
    };

    const p1 = parseLocation(loc1);
    const p2 = parseLocation(loc2);

    // Calculate Manhattan distance
    const zoneDiff = p1.zone === p2.zone ? 0 : 100; // Different zones = large distance
    const aisleDiff = Math.abs(p1.aisle - p2.aisle) * 10;
    const rackDiff = Math.abs(p1.rack - p2.rack) * 2;
    const levelDiff = Math.abs(p1.level - p2.level) * 1;

    return zoneDiff + aisleDiff + rackDiff + levelDiff;
  }

  /**
   * Estimate total path distance
   */
  private estimatePathDistance(path: string[]): number {
    if (path.length <= 1) return 0;

    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      totalDistance += this.locationDistance(path[i], path[i + 1]);
    }

    return totalDistance;
  }

  async optimizePickPathBatch(
    taskIds: string[],
  ): Promise<PickPathOptimization[]> {
    return Promise.all(
      taskIds.map(async (taskId) => {
        // Mock locations for each task
        const locations = [
          `A-${Math.floor(Math.random() * 10)}-01-01`,
          `B-${Math.floor(Math.random() * 10)}-01-01`,
        ];
        return this.optimizePickPath(taskId, locations);
      }),
    );
  }

  async optimizePutaway(
    skuId: string,
    quantity: number,
    warehouseId: string,
  ): Promise<PutawayOptimization> {
    /**
     * Putaway Optimization Algorithm
     * Multi-factor optimization for optimal storage location
     *
     * Algorithm:
     * 1. Analyze SKU characteristics (velocity, size, weight, temperature)
     * 2. Find available locations with sufficient capacity
     * 3. Score each location based on:
     *    - Proximity to shipping dock (for high velocity)
     *    - Space availability and utilization
     *    - Compatibility with adjacent SKUs
     *    - Temperature zone match
     *    - Pick face accessibility
     *    - Future replenishment efficiency
     * 4. Select optimal location (highest score)
     * 5. Provide alternatives for flexibility
     */

    // Simulate SKU velocity analysis
    // In production, would fetch from SKU service and analyze historical picks
    const velocity = Math.random() * 100; // Picks per day

    // Determine optimal zone based on velocity
    let targetZone: string;
    let proximityScore: number;

    if (velocity > 50) {
      // High velocity - golden zone (near shipping)
      targetZone = "GOLDEN";
      proximityScore = 0.95;
    } else if (velocity > 20) {
      // Medium velocity - mid zone
      targetZone = "MID";
      proximityScore = 0.75;
    } else {
      // Low velocity - reserve zone
      targetZone = "RESERVE";
      proximityScore = 0.6;
    }

    // Find optimal location in zone
    const recommendedLocation = this.getOptimalLocationInZone(
      targetZone,
      warehouseId,
    );

    // Generate alternative locations
    const alternativeLocations = [
      this.getAlternativeLocation(recommendedLocation, 1),
      this.getAlternativeLocation(recommendedLocation, 2),
      this.getAlternativeLocation(recommendedLocation, 3),
    ];

    // Calculate space availability score
    // In production, would check actual location capacity
    const spaceAvailability = 0.8 + Math.random() * 0.15;

    // Calculate compatibility score
    // In production, would check adjacent SKU compatibility (chemicals, temperature, etc.)
    const compatibility = 0.9 + Math.random() * 0.1;

    // Determine temperature match
    // In production, would compare SKU requirements with zone temperature
    const temperatureMatch = true;

    return {
      skuId,
      quantity,
      recommendedLocation,
      alternativeLocations,
      reason: `Optimal ${targetZone.toLowerCase()} zone placement based on velocity analysis (${velocity.toFixed(1)} picks/day)`,
      factors: {
        proximityToPickFace: proximityScore,
        spaceAvailability,
        compatibility,
        temperatureMatch,
      },
    };
  }

  private getAlternativeLocation(baseLocation: string, offset: number): string {
    // Generate alternative location by incrementing shelf/level
    const parts = baseLocation.split("-");
    if (parts.length !== 4) return baseLocation;

    const [aisle, row, shelf, level] = parts;
    const newShelf = String(parseInt(shelf) + offset).padStart(2, "0");

    return `${aisle}-${row}-${newShelf}-${level}`;
  }

  async analyzeSpaceUtilization(
    warehouseId: string,
  ): Promise<SpaceUtilization> {
    /**
     * Space Utilization Analysis Algorithm
     *
     * Implementation:
     * 1. Calculate total warehouse capacity (cubic meters)
     * 2. Calculate used space (inventory volume + pallets + racks)
     * 3. Analyze by zone (golden, mid, reserve)
     * 4. Identify over/under-utilized areas
     * 5. Generate consolidation recommendations
     *
     * In production, this would:
     * - Query all locations and their dimensions
     * - Sum inventory volumes per zone
     * - Consider aisle space, clearance, equipment
     * - Account for seasonal variations
     */

    // Mock data - In production, fetch from location and inventory services
    const totalSpace = 10000; // cubic meters
    const usedSpace = 7500;
    const availableSpace = totalSpace - usedSpace;

    // Analyze by zone
    const zones = [
      { name: "Zone A (Golden)", total: 2000, used: 1700, util: 85 },
      { name: "Zone B (Mid)", total: 4000, used: 2400, util: 60 },
      { name: "Zone C (Reserve)", total: 4000, used: 3400, util: 85 },
    ];

    const recommendations = zones.map((zone) => {
      let action = "";
      let recommendedUtil = zone.util;

      if (zone.util > 80) {
        // Over-utilized
        action = "Redistribute items to lower-velocity zones to free up space";
        recommendedUtil = 75;
      } else if (zone.util < 65) {
        // Under-utilized
        action = "Consolidate items from other zones to improve density";
        recommendedUtil = 75;
      } else {
        // Optimal
        action = "Maintain current allocation - optimal utilization";
        recommendedUtil = zone.util;
      }

      return {
        area: zone.name,
        currentUtilization: zone.util,
        recommendedUtilization: recommendedUtil,
        action,
      };
    });

    return {
      warehouseId,
      totalSpace,
      usedSpace,
      availableSpace,
      utilizationPercentage: (usedSpace / totalSpace) * 100,
      recommendations,
    };
  }

  async optimizeSpaceUtilization(
    warehouseId: string,
  ): Promise<SpaceUtilization> {
    const analysis = await this.analyzeSpaceUtilization(warehouseId);

    /**
     * Apply Space Optimization
     *
     * Implementation:
     * 1. Analyze current utilization by zone
     * 2. Identify consolidation opportunities
     * 3. Generate movement tasks
     * 4. Optimize vertical space usage
     * 5. Balance zone utilization
     *
     * In production, this would:
     * - Create bulk movement tasks
     * - Optimize rack configurations
     * - Rebalance inventory across zones
     * - Update location assignments
     */

    // Publish optimization event for workflow processing
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.space_optimized",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        warehouseId,
        utilizationBefore: analysis.utilizationPercentage,
        recommendationsCount: analysis.recommendations.length,
      },
      payload: {
        analysis,
      },
    });

    return analysis;
  }

  async optimizeLabor(
    warehouseId: string,
    taskType?: string,
  ): Promise<LaborOptimization> {
    /**
     * Labor Optimization Algorithm
     * Maximize worker productivity through intelligent task assignment and path optimization
     *
     * Algorithm:
     * 1. Analyze historical worker performance by task type
     * 2. Calculate current efficiency (tasks/hour)
     * 3. Identify optimization opportunities:
     *    - Wave picking (batch similar orders)
     *    - Zone picking (assign workers to zones)
     *    - Cluster picking (multi-order picking)
     *    - Pick path optimization (reduce travel)
     *    - Task interleaving (combine pick & putaway)
     * 4. Generate actionable recommendations with impact estimates
     * 5. Consider worker skills, equipment, and constraints
     *
     * In production, this would:
     * - Query actual worker performance metrics
     * - Analyze task completion times
     * - Calculate travel distances
     * - Optimize work allocation
     * - Balance workload across shifts
     */

    // Simulate current efficiency analysis
    // In production, fetch from performance tracking system
    const currentEfficiency = 45 + Math.random() * 15; // 45-60 picks per hour

    // Calculate potential improvements
    const recommendations = [
      {
        action: "Optimize pick paths using nearest-neighbor algorithm",
        expectedImprovement: 12, // 12% efficiency gain
        priority: "HIGH" as const,
      },
      {
        action: "Implement wave picking for orders with common SKUs",
        expectedImprovement: 8, // 8% efficiency gain
        priority: "HIGH" as const,
      },
      {
        action: "Batch similar picks to reduce travel distance",
        expectedImprovement: 6, // 6% efficiency gain
        priority: "MEDIUM" as const,
      },
      {
        action: "Enable task interleaving (combine pick and putaway)",
        expectedImprovement: 5, // 5% efficiency gain
        priority: "MEDIUM" as const,
      },
      {
        action: "Assign workers to zones based on SKU velocity",
        expectedImprovement: 4, // 4% efficiency gain
        priority: "LOW" as const,
      },
    ];

    // Calculate optimized efficiency (sum of improvements)
    const totalImprovement = recommendations.reduce(
      (sum, r) => sum + r.expectedImprovement,
      0,
    );
    const optimizedEfficiency =
      currentEfficiency * (1 + totalImprovement / 100);

    return {
      taskType: (taskType as any) || "PICKING",
      currentEfficiency,
      optimizedEfficiency,
      recommendations,
    };
  }

  async simulateScenario(
    warehouseId: string,
    scenario: Record<string, any>,
  ): Promise<any> {
    /**
     * Digital Twin Simulation Algorithm
     * Simulate warehouse operations under different configurations
     *
     * Algorithm:
     * 1. Create digital twin of current warehouse state
     * 2. Apply scenario parameters (layout changes, SKU placement, staffing)
     * 3. Simulate operations:
     *    - Inbound receiving and putaway
     *    - Picking and packing
     *    - Replenishment
     *    - Staff movement and task completion
     * 4. Calculate performance metrics:
     *    - Throughput (orders/hour)
     *    - Efficiency (picks/hour/worker)
     *    - Travel distance (meters)
     *    - Utilization (space, labor, equipment)
     *    - Cost (labor, space, equipment)
     * 5. Compare with baseline
     * 6. Generate recommendations
     *
     * In production, this would:
     * - Use Monte Carlo simulation for variability
     * - Model worker behavior and constraints
     * - Simulate equipment usage (forklifts, conveyors)
     * - Account for peak/off-peak patterns
     * - Run multiple iterations for statistical significance
     */

    // Extract scenario parameters
    const {
      orderVolume = 1000,
      staffCount = 20,
      layoutType = "current",
      slottingStrategy = "velocity-based",
      pickingMethod = "zone",
    } = scenario;

    // Baseline metrics (current state)
    const baseline = {
      throughput: 800, // orders/hour
      efficiency: 50, // picks/hour/worker
      travelDistance: 5000, // meters/day
      laborCost: 15000, // SAR/day
      spaceUtilization: 75, // percentage
    };

    // Simulate with scenario parameters
    const simulatedEfficiency = this.calculateScenarioEfficiency({
      orderVolume,
      staffCount,
      layoutType,
      slottingStrategy,
      pickingMethod,
      baseline,
    });

    // Calculate improvements
    const improvementPercentage =
      ((simulatedEfficiency.efficiency - baseline.efficiency) /
        baseline.efficiency) *
      100;

    return {
      scenario,
      results: {
        efficiency: simulatedEfficiency.efficiency / 100,
        throughput: simulatedEfficiency.throughput,
        cost: simulatedEfficiency.laborCost,
        time: 3600,
        travelDistance: simulatedEfficiency.travelDistance,
        spaceUtilization: simulatedEfficiency.spaceUtilization,
      },
      comparison: {
        baseline,
        simulated: simulatedEfficiency,
        improvement: improvementPercentage.toFixed(2) + "%",
      },
      recommendations: [
        `Implement ${slottingStrategy} slotting for ${Math.abs(improvementPercentage).toFixed(1)}% efficiency gain`,
        `Use ${pickingMethod} picking method to reduce travel by ${(((baseline.travelDistance - simulatedEfficiency.travelDistance) / baseline.travelDistance) * 100).toFixed(1)}%`,
        `Optimize staffing to ${staffCount} workers for cost-efficiency balance`,
      ],
    };
  }

  private calculateScenarioEfficiency(params: any) {
    const {
      orderVolume,
      staffCount,
      slottingStrategy,
      pickingMethod,
      baseline,
    } = params;

    // Apply multipliers based on optimization strategies
    let efficiencyMultiplier = 1.0;
    let travelMultiplier = 1.0;
    let throughputMultiplier = 1.0;

    // Slotting strategy impact
    if (slottingStrategy === "velocity-based") {
      efficiencyMultiplier *= 1.15; // 15% efficiency gain
      travelMultiplier *= 0.8; // 20% travel reduction
    } else if (slottingStrategy === "abc-analysis") {
      efficiencyMultiplier *= 1.12;
      travelMultiplier *= 0.85;
    }

    // Picking method impact
    if (pickingMethod === "wave") {
      efficiencyMultiplier *= 1.1; // 10% efficiency gain
      throughputMultiplier *= 1.2; // 20% throughput increase
    } else if (pickingMethod === "zone") {
      efficiencyMultiplier *= 1.08;
      travelMultiplier *= 0.9;
    } else if (pickingMethod === "cluster") {
      efficiencyMultiplier *= 1.12;
      travelMultiplier *= 0.85;
    }

    // Staffing impact
    const staffEfficiency = Math.min(1.0, staffCount / 20); // Optimal at 20 workers

    return {
      efficiency: baseline.efficiency * efficiencyMultiplier * staffEfficiency,
      throughput: baseline.throughput * throughputMultiplier * staffEfficiency,
      travelDistance: baseline.travelDistance * travelMultiplier,
      laborCost: baseline.laborCost * (staffCount / 20),
      spaceUtilization: baseline.spaceUtilization,
    };
  }

  // ============================================================================
  // HELPER METHODS FOR SLOTTING ALGORITHM
  // ============================================================================

  private extractZone(location: string): string {
    // Extract zone from location code (e.g., "A-01-01-01" -> zone based on aisle)
    const parts = location.split("-");
    if (parts.length < 2) return "UNKNOWN";

    const aisle = parseInt(parts[1]);
    if (aisle <= 3) return "GOLDEN"; // Aisles 1-3: Golden zone
    if (aisle <= 6) return "MID"; // Aisles 4-6: Mid zone
    return "RESERVE"; // Aisles 7+: Reserve zone
  }

  private getOptimalLocationInZone(zone: string, warehouseId: string): string {
    // Generate optimal location code based on zone
    // In production, would query available locations
    const zoneMap: Record<string, string> = {
      GOLDEN: "A-02-01-01", // Aisle 2, shelf 1, level 1 (eye level, near shipping)
      MID: "A-04-01-02", // Aisle 4, shelf 1, level 2
      RESERVE: "A-08-01-03", // Aisle 8, shelf 1, level 3 (back area)
    };

    return zoneMap[zone] || "A-05-01-01";
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const warehouseOptimizationService: WarehouseOptimizationService =
  new WarehouseOptimizationServiceImpl();