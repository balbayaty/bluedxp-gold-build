/**
 * Warehouse Digital Twin Service
 * Wrapper around digitalTwinService for warehouse-specific operations
 * NO DUPLICATION - Reuses existing digitalTwinService
 */

import {
  DigitalTwinService,
  getDigitalTwinService,
} from "@/lib/services/facility/digitalTwin/digitalTwinService";
import type { DigitalTwin, DigitalTwinSimulation } from "@/types/facility";
import type { DigitalTwinDataSource } from "@/types/facility";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// WAREHOUSE DIGITAL TWIN TYPES
// ============================================================================

export interface WarehouseDigitalTwin extends DigitalTwin {
  warehouseId: string;
  warehouseMetrics: {
    capacity: number;
    utilization: number;
    efficiency: number;
    throughput: number;
  };
}

export interface WarehouseSimulation extends DigitalTwinSimulation {
  warehouseId: string;
  scenario:
    | "capacity_planning"
    | "layout_optimization"
    | "process_optimization"
    | "what_if";
}

// ============================================================================
// WAREHOUSE DIGITAL TWIN SERVICE
// ============================================================================

class WarehouseDigitalTwinService {
  private digitalTwinService = getDigitalTwinService();

  /**
   * Create digital twin for warehouse
   */
  async createWarehouseDigitalTwin(
    warehouseId: string,
    config: {
      name: string;
      dataSources: Array<{
        type: "iot" | "wms" | "inventory" | "operations";
        sourceId: string;
      }>;
    },
  ): Promise<WarehouseDigitalTwin> {
    const twin = await this.digitalTwinService.createDigitalTwin(warehouseId, {
      name: config.name,
      dataSources: config.dataSources.map((ds) => ({
        type: (ds.type === "iot"
          ? "iot-sensor"
          : ds.type === "wms"
            ? "maintenance-system"
            : ds.type === "inventory"
              ? "energy-meter"
              : "maintenance-system") as
          | "iot-sensor"
          | "maintenance-system"
          | "energy-meter",
        sourceId: ds.sourceId,
      })),
    });

    // Enrich with warehouse-specific data
    const warehouseTwin: WarehouseDigitalTwin = {
      ...twin,
      warehouseId,
      warehouseMetrics: {
        capacity: 0, // Will be synced from warehouse data
        utilization: 0,
        efficiency: 0,
        throughput: 0,
      },
    };

    // Publish event
    await eventBus.publish({
      id: `warehouse-twin-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.digital_twin.created",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        warehouseId,
        twinId: warehouseTwin.id,
      },
    });

    return warehouseTwin;
  }

  /**
   * Run warehouse simulation
   */
  async runWarehouseSimulation(
    warehouseId: string,
    scenario: {
      name: string;
      type:
        | "capacity_planning"
        | "layout_optimization"
        | "process_optimization"
        | "what_if";
      parameters: Record<string, any>;
    },
  ): Promise<WarehouseSimulation> {
    const twin = await this.getWarehouseDigitalTwin(warehouseId);
    if (!twin) {
      throw new Error(`Digital twin not found for warehouse ${warehouseId}`);
    }

    // Map warehouse scenario types to digital twin simulation types
    const simulationTypeMap: Record<
      string,
      "energy-optimization" | "space-optimization" | "maintenance-scheduling"
    > = {
      capacity_planning: "space-optimization",
      layout_optimization: "space-optimization",
      process_optimization: "energy-optimization",
      what_if: "energy-optimization",
    };

    const simulation = await this.digitalTwinService.runSimulation(twin.id, {
      name: scenario.name,
      type: simulationTypeMap[scenario.type] || "energy-optimization",
      parameters: scenario.parameters,
    });

    const warehouseSimulation: WarehouseSimulation = {
      ...simulation,
      warehouseId,
      scenario: scenario.type,
    };

    // Publish event
    await eventBus.publish({
      id: `warehouse-sim-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.digital_twin.simulation.completed",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        warehouseId,
        simulationId: warehouseSimulation.id,
        scenario: scenario.type,
      },
    });

    return warehouseSimulation;
  }

  /**
   * Get warehouse digital twin
   */
  async getWarehouseDigitalTwin(
    warehouseId: string,
  ): Promise<WarehouseDigitalTwin | null> {
    try {
      // Use getFacilityDigitalTwin which searches by facilityId
      const twin =
        await this.digitalTwinService.getFacilityDigitalTwin(warehouseId);

      if (!twin) return null;

      return {
        ...twin,
        warehouseId,
        warehouseMetrics: {
          capacity: 0,
          utilization: 0,
          efficiency: 0,
          throughput: 0,
        },
      };
    } catch (error) {
      console.error("Error getting warehouse digital twin:", error);
      return null;
    }
  }

  /**
   * Synchronize warehouse digital twin
   */
  async synchronizeWarehouseTwin(warehouseId: string): Promise<void> {
    const twin = await this.getWarehouseDigitalTwin(warehouseId);
    if (!twin) return;

    await this.digitalTwinService.syncDigitalTwin(twin.id);
  }
}

export const warehouseDigitalTwinService = new WarehouseDigitalTwinService();
