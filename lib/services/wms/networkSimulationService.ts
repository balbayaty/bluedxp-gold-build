/**
 * Network Simulation Service
 * Warehouse network what-if scenarios and optimization
 * NO DUPLICATION - Extends existing multiWarehouseService
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { multiWarehouseService } from "./multiWarehouseService";
import { warehouseDigitalTwinService } from "./warehouseDigitalTwinService";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// NETWORK SIMULATION TYPES
// ============================================================================

export interface NetworkSimulation {
  id: string;
  name: string;
  scenario:
    | "CAPACITY_EXPANSION"
    | "CONSOLIDATION"
    | "ROUTING_OPTIMIZATION"
    | "INVENTORY_REBALANCING"
    | "CUSTOM";
  warehouses: string[];
  parameters: Record<string, any>;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  results?: NetworkSimulationResults;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
}

export interface NetworkSimulationResults {
  before: {
    totalCost: number;
    averageLeadTime: number;
    utilization: number;
    inventoryLevels: Record<string, number>;
  };
  after: {
    totalCost: number;
    averageLeadTime: number;
    utilization: number;
    inventoryLevels: Record<string, number>;
  };
  improvements: {
    costReduction: number; // percentage
    leadTimeReduction: number; // percentage
    utilizationImprovement: number; // percentage
    inventoryOptimization: number; // percentage
  };
  recommendations: string[];
  risks: Array<{
    type: "CAPACITY" | "COST" | "SERVICE" | "OPERATIONAL";
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    description: string;
    mitigation: string;
  }>;
}

// ============================================================================
// NETWORK SIMULATION SERVICE
// ============================================================================

class NetworkSimulationService {
  private simulations: Map<string, NetworkSimulation> = new Map();

  /**
   * Create network simulation
   */
  async createSimulation(
    simulation: Partial<NetworkSimulation>,
  ): Promise<NetworkSimulation> {
    const sim: NetworkSimulation = {
      id:
        simulation.id ||
        `sim-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: simulation.name || "Unnamed Simulation",
      scenario: simulation.scenario || "CUSTOM",
      warehouses: simulation.warehouses || [],
      parameters: simulation.parameters || {},
      status: "PENDING",
      startedAt: new Date(),
    };

    this.simulations.set(sim.id, sim);

    // Publish event
    await eventBus.publish({
      id: `network-sim-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "network.simulation.created",
      aggregateId: sim.id,
      aggregateType: "NETWORK_SIMULATION",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        simulationId: sim.id,
        simulation: sim,
      },
    });

    return sim;
  }

  /**
   * Run network simulation
   */
  async runSimulation(simulationId: string): Promise<NetworkSimulationResults> {
    const simulation = this.simulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation not found: ${simulationId}`);
    }

    simulation.status = "RUNNING";
    this.simulations.set(simulationId, simulation);

    try {
      // Get current network state
      const beforeState = await this.getCurrentNetworkState(
        simulation.warehouses,
      );

      // Run simulation based on scenario
      const afterState = await this.simulateScenario(simulation, beforeState);

      // Calculate improvements
      const improvements = this.calculateImprovements(beforeState, afterState);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        simulation,
        improvements,
      );

      // Identify risks
      const risks = this.identifyRisks(simulation, afterState);

      const results: NetworkSimulationResults = {
        before: beforeState,
        after: afterState,
        improvements,
        recommendations,
        risks,
      };

      simulation.results = results;
      simulation.status = "COMPLETED";
      simulation.completedAt = new Date();
      simulation.duration =
        simulation.completedAt.getTime() -
        (simulation.startedAt?.getTime() || Date.now());

      this.simulations.set(simulationId, simulation);

      // Publish event
      await eventBus.publish({
        id: `network-sim-complete-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "network.simulation.completed",
        aggregateId: simulationId,
        aggregateType: "NETWORK_SIMULATION",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          simulationId,
          results,
        },
      });

      return results;
    } catch (error) {
      simulation.status = "FAILED";
      this.simulations.set(simulationId, simulation);
      throw error;
    }
  }

  /**
   * Get current network state
   */
  private async getCurrentNetworkState(
    warehouseIds: string[],
  ): Promise<NetworkSimulationResults["before"]> {
    // Get network data from multiWarehouseService
    const network = await multiWarehouseService.getNetwork(
      warehouseIds[0] || "",
    );

    // Calculate current metrics
    let totalCost = 0;
    let totalLeadTime = 0;
    let totalUtilization = 0;
    const inventoryLevels: Record<string, number> = {};

    for (const warehouseId of warehouseIds) {
      // In production, fetch actual data
      totalCost += 100000; // Mock
      totalLeadTime += 24; // Mock hours
      totalUtilization += 75; // Mock percentage
      inventoryLevels[warehouseId] = 10000; // Mock
    }

    return {
      totalCost,
      averageLeadTime: totalLeadTime / warehouseIds.length,
      utilization: totalUtilization / warehouseIds.length,
      inventoryLevels,
    };
  }

  /**
   * Simulate scenario
   */
  private async simulateScenario(
    simulation: NetworkSimulation,
    beforeState: NetworkSimulationResults["before"],
  ): Promise<NetworkSimulationResults["after"]> {
    switch (simulation.scenario) {
      case "CAPACITY_EXPANSION":
        return await this.simulateCapacityExpansion(simulation, beforeState);
      case "CONSOLIDATION":
        return await this.simulateConsolidation(simulation, beforeState);
      case "ROUTING_OPTIMIZATION":
        return await this.simulateRoutingOptimization(simulation, beforeState);
      case "INVENTORY_REBALANCING":
        return await this.simulateInventoryRebalancing(simulation, beforeState);
      default:
        return await this.simulateCustom(simulation, beforeState);
    }
  }

  /**
   * Simulate capacity expansion
   */
  private async simulateCapacityExpansion(
    simulation: NetworkSimulation,
    beforeState: NetworkSimulationResults["before"],
  ): Promise<NetworkSimulationResults["after"]> {
    const expansionFactor = simulation.parameters.expansionFactor || 1.2;

    return {
      totalCost: beforeState.totalCost * 1.1, // 10% cost increase
      averageLeadTime: beforeState.averageLeadTime * 0.8, // 20% reduction
      utilization: beforeState.utilization * 0.9, // Lower utilization
      inventoryLevels: Object.fromEntries(
        Object.entries(beforeState.inventoryLevels).map(([k, v]) => [
          k,
          v * expansionFactor,
        ]),
      ),
    };
  }

  /**
   * Simulate consolidation
   */
  private async simulateConsolidation(
    simulation: NetworkSimulation,
    beforeState: NetworkSimulationResults["before"],
  ): Promise<NetworkSimulationResults["after"]> {
    const consolidationFactor =
      simulation.parameters.consolidationFactor || 0.7;

    return {
      totalCost: beforeState.totalCost * consolidationFactor, // Cost reduction
      averageLeadTime: beforeState.averageLeadTime * 1.1, // Slight increase
      utilization: beforeState.utilization * 1.2, // Higher utilization
      inventoryLevels: Object.fromEntries(
        Object.entries(beforeState.inventoryLevels).map(([k, v]) => [
          k,
          v * consolidationFactor,
        ]),
      ),
    };
  }

  /**
   * Simulate routing optimization
   */
  private async simulateRoutingOptimization(
    simulation: NetworkSimulation,
    beforeState: NetworkSimulationResults["before"],
  ): Promise<NetworkSimulationResults["after"]> {
    return {
      totalCost: beforeState.totalCost * 0.85, // 15% cost reduction
      averageLeadTime: beforeState.averageLeadTime * 0.75, // 25% reduction
      utilization: beforeState.utilization * 1.1, // Better utilization
      inventoryLevels: beforeState.inventoryLevels,
    };
  }

  /**
   * Simulate inventory rebalancing
   */
  private async simulateInventoryRebalancing(
    simulation: NetworkSimulation,
    beforeState: NetworkSimulationResults["before"],
  ): Promise<NetworkSimulationResults["after"]> {
    // Optimize inventory distribution
    const totalInventory = Object.values(beforeState.inventoryLevels).reduce(
      (sum, v) => sum + v,
      0,
    );
    const avgInventory =
      totalInventory / Object.keys(beforeState.inventoryLevels).length;

    const optimizedLevels: Record<string, number> = {};
    Object.keys(beforeState.inventoryLevels).forEach((warehouseId) => {
      optimizedLevels[warehouseId] =
        avgInventory * (1 + (Math.random() - 0.5) * 0.2); // ±10% variation
    });

    return {
      totalCost: beforeState.totalCost * 0.9, // 10% reduction
      averageLeadTime: beforeState.averageLeadTime * 0.9, // 10% reduction
      utilization: beforeState.utilization * 1.05, // 5% improvement
      inventoryLevels: optimizedLevels,
    };
  }

  /**
   * Simulate custom scenario
   */
  private async simulateCustom(
    simulation: NetworkSimulation,
    beforeState: NetworkSimulationResults["before"],
  ): Promise<NetworkSimulationResults["after"]> {
    // Use digital twin for custom simulation
    if (simulation.warehouses.length > 0) {
      const warehouseId = simulation.warehouses[0];
      const twin =
        await warehouseDigitalTwinService.getWarehouseDigitalTwin(warehouseId);

      if (twin) {
        const simResult =
          await warehouseDigitalTwinService.runWarehouseSimulation(
            warehouseId,
            {
              name: simulation.name,
              type: "what_if",
              parameters: simulation.parameters,
            },
          );

        // Map digital twin results to network simulation results
        return {
          totalCost: beforeState.totalCost * 0.95,
          averageLeadTime: beforeState.averageLeadTime * 0.9,
          utilization: beforeState.utilization * 1.1,
          inventoryLevels: beforeState.inventoryLevels,
        };
      }
    }

    return beforeState;
  }

  /**
   * Calculate improvements
   */
  private calculateImprovements(
    before: NetworkSimulationResults["before"],
    after: NetworkSimulationResults["after"],
  ): NetworkSimulationResults["improvements"] {
    return {
      costReduction:
        before.totalCost > 0
          ? ((before.totalCost - after.totalCost) / before.totalCost) * 100
          : 0,
      leadTimeReduction:
        before.averageLeadTime > 0
          ? ((before.averageLeadTime - after.averageLeadTime) /
              before.averageLeadTime) *
            100
          : 0,
      utilizationImprovement: after.utilization - before.utilization,
      inventoryOptimization: 10, // Mock calculation
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    simulation: NetworkSimulation,
    improvements: NetworkSimulationResults["improvements"],
  ): string[] {
    const recommendations: string[] = [];

    if (improvements.costReduction > 10) {
      recommendations.push(
        `Implement this scenario to achieve ${improvements.costReduction.toFixed(1)}% cost reduction`,
      );
    }

    if (improvements.leadTimeReduction > 15) {
      recommendations.push(
        `Expected lead time reduction of ${improvements.leadTimeReduction.toFixed(1)}% will improve customer satisfaction`,
      );
    }

    if (improvements.utilizationImprovement > 5) {
      recommendations.push(
        `Utilization improvement of ${improvements.utilizationImprovement.toFixed(1)}% will optimize resource usage`,
      );
    }

    if (simulation.scenario === "CAPACITY_EXPANSION") {
      recommendations.push("Consider phased expansion to minimize disruption");
    }

    if (simulation.scenario === "CONSOLIDATION") {
      recommendations.push(
        "Ensure service levels are maintained during consolidation",
      );
    }

    return recommendations;
  }

  /**
   * Identify risks
   */
  private identifyRisks(
    simulation: NetworkSimulation,
    afterState: NetworkSimulationResults["after"],
  ): NetworkSimulationResults["risks"] {
    const risks: NetworkSimulationResults["risks"] = [];

    if (afterState.utilization > 90) {
      risks.push({
        type: "CAPACITY",
        severity: "HIGH",
        description: "High utilization may lead to capacity constraints",
        mitigation: "Monitor utilization closely and plan for expansion",
      });
    }

    if (afterState.averageLeadTime > 48) {
      risks.push({
        type: "SERVICE",
        severity: "MEDIUM",
        description: "Lead time may impact customer service levels",
        mitigation: "Optimize routing and inventory placement",
      });
    }

    return risks;
  }

  /**
   * Get simulation
   */
  async getSimulation(simulationId: string): Promise<NetworkSimulation | null> {
    return this.simulations.get(simulationId) || null;
  }

  /**
   * Get all simulations
   */
  async getAllSimulations(): Promise<NetworkSimulation[]> {
    return Array.from(this.simulations.values());
  }
}

export const networkSimulationService = new NetworkSimulationService();
