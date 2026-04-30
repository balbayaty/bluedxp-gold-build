/**
 * Warehouse Network Service
 *
 * Multi-warehouse management
 * Network optimization
 * Cross-docking
 * Inventory balancing
 *
 * @module warehouse-network
 */

import { eventBus, createEvent } from "@/lib/services/event-store";
import type {
  NetworkWarehouse,
  NetworkOptimization,
  CrossDockingOperation,
  InventoryBalance,
} from "./types";

// ============================================================================
// IN-MEMORY STORE (Will be replaced with database)
// ============================================================================

class WarehouseNetworkStore {
  private warehouses: Map<string, NetworkWarehouse> = new Map();
  private crossDocking: Map<string, CrossDockingOperation> = new Map();

  getWarehouse(id: string): NetworkWarehouse | undefined {
    return this.warehouses.get(id);
  }

  setWarehouse(id: string, warehouse: NetworkWarehouse): void {
    this.warehouses.set(id, warehouse);
  }

  getAllWarehouses(): NetworkWarehouse[] {
    return Array.from(this.warehouses.values());
  }

  getCrossDocking(id: string): CrossDockingOperation | undefined {
    return this.crossDocking.get(id);
  }

  setCrossDocking(id: string, operation: CrossDockingOperation): void {
    this.crossDocking.set(id, operation);
  }
}

const store = new WarehouseNetworkStore();

// ============================================================================
// WAREHOUSE NETWORK SERVICE
// ============================================================================

export class WarehouseNetworkService {
  /**
   * Add warehouse to network
   */
  async addWarehouse(
    warehouse: Omit<NetworkWarehouse, "id">,
  ): Promise<NetworkWarehouse> {
    const newWarehouse: NetworkWarehouse = {
      ...warehouse,
      id: `warehouse-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    };

    store.setWarehouse(newWarehouse.id, newWarehouse);

    // Publish event
    await eventBus.publish(
      createEvent(
        "WarehouseNetworkWarehouseAdded",
        newWarehouse.id,
        "Warehouse",
        {
          warehouseId: newWarehouse.id,
          name: newWarehouse.name,
          location: newWarehouse.location,
        },
        1,
        {
          tenantId: newWarehouse.tenantId,
          correlationId: `warehouse-add-${Date.now()}`,
          userId: "warehouse-network-service",
        },
      ),
    );

    return newWarehouse;
  }

  /**
   * Optimize network for shipment
   */
  async optimizeNetworkForShipment(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    requirements: {
      capacity?: number;
      capabilities?: string[];
      priority?: "COST" | "TIME" | "BALANCED";
    },
    tenantId: string,
  ): Promise<NetworkOptimization> {
    const warehouses = store
      .getAllWarehouses()
      .filter((w) => w.tenantId === tenantId);

    if (warehouses.length === 0) {
      throw new Error("No warehouses in network");
    }

    // Score each warehouse
    const scores = warehouses.map((warehouse) => {
      let score = 0;

      // Distance score
      const distanceToOrigin = this.calculateDistance(
        origin,
        warehouse.location,
      );
      const distanceToDestination = this.calculateDistance(
        warehouse.location,
        destination,
      );
      const totalDistance = distanceToOrigin + distanceToDestination;
      score += 100 - totalDistance / 100; // Closer = higher score

      // Capacity score
      if (requirements.capacity) {
        const capacityScore =
          (warehouse.capacity.available / requirements.capacity) * 100;
        score += Math.min(capacityScore, 100);
      }

      // Capabilities score
      if (requirements.capabilities) {
        const matchingCapabilities = requirements.capabilities.filter((c) =>
          warehouse.capabilities.includes(c),
        ).length;
        score +=
          (matchingCapabilities / requirements.capabilities.length) * 100;
      }

      return {
        warehouse,
        score,
        distanceToOrigin,
        distanceToDestination,
      };
    });

    // Sort by score
    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];

    const recommendations: string[] = [];
    if (best.score < 50) {
      recommendations.push("Consider adding warehouse closer to route");
    }

    return {
      recommendedWarehouse: best.warehouse.id,
      reasoning: `Best balance of distance, capacity, and capabilities (score: ${best.score.toFixed(1)})`,
      costSavings: 0.15, // Would calculate from actual data
      timeSavings: 2, // hours
      recommendations,
    };
  }

  /**
   * Create cross-docking operation
   */
  async createCrossDocking(
    fromWarehouse: string,
    toWarehouse: string,
    shipmentId: string,
    scheduledDate: Date,
    tenantId: string,
  ): Promise<CrossDockingOperation> {
    const operation: CrossDockingOperation = {
      id: `crossdock-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      fromWarehouse,
      toWarehouse,
      shipmentId,
      scheduledDate,
      status: "PENDING",
    };

    store.setCrossDocking(operation.id, operation);

    // Publish event
    await eventBus.publish(
      createEvent(
        "WarehouseNetworkCrossDockingCreated",
        shipmentId,
        "Shipment",
        {
          operationId: operation.id,
          fromWarehouse,
          toWarehouse,
          shipmentId,
          scheduledDate: scheduledDate.toISOString(),
        },
        1,
        {
          tenantId,
          correlationId: `crossdock-${Date.now()}`,
          userId: "warehouse-network-service",
        },
      ),
    );

    return operation;
  }

  /**
   * Balance inventory across network
   */
  async balanceInventory(
    productId: string,
    tenantId: string,
  ): Promise<InventoryBalance> {
    const warehouses = store
      .getAllWarehouses()
      .filter((w) => w.tenantId === tenantId);

    // Get inventory by warehouse (would get from WMS)
    const byWarehouse: Record<string, { quantity: number; available: number }> =
      {};
    for (const warehouse of warehouses) {
      byWarehouse[warehouse.id] = {
        quantity: 100, // Would get from WMS
        available: 80,
      };
    }

    const totalQuantity = Object.values(byWarehouse).reduce(
      (sum, inv) => sum + inv.quantity,
      0,
    );

    // Find imbalances
    const avgQuantity = totalQuantity / warehouses.length;
    const imbalances = Object.entries(byWarehouse).filter(
      ([_, inv]) => Math.abs(inv.quantity - avgQuantity) > avgQuantity * 0.2,
    );

    let recommendedTransfer:
      | InventoryBalance["recommendedTransfer"]
      | undefined;
    if (imbalances.length >= 2) {
      const sorted = imbalances.sort((a, b) => b[1].quantity - a[1].quantity);
      recommendedTransfer = {
        from: sorted[0][0],
        to: sorted[sorted.length - 1][0],
        quantity: Math.floor(
          (sorted[0][1].quantity - sorted[sorted.length - 1][1].quantity) / 2,
        ),
        reason: "Balance inventory across network",
      };
    }

    return {
      productId,
      byWarehouse,
      totalQuantity,
      recommendedTransfer,
    };
  }

  /**
   * Calculate distance (Haversine)
   */
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): number {
    const R = 6371000; // Earth radius in meters
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Export singleton
export const warehouseNetworkService = new WarehouseNetworkService();
