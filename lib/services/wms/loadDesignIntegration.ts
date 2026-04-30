/**
 * Load Design Integration
 * Load optimization for warehouse outbound operations
 * NO DUPLICATION - Uses existing loadDesignService
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { advancedLoadDesignService } from "@/lib/services/load-design/advancedLoadDesignService";
import type {
  LoadDesign,
  LoadOptimization,
} from "@/lib/services/load-design/advancedLoadDesignService";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// WAREHOUSE LOAD DESIGN TYPES
// ============================================================================

export interface WarehouseLoadDesign {
  id: string;
  warehouseId: string;
  orderId: string;
  items: Array<{
    skuId: string;
    quantity: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
      weight: number;
    };
  }>;
  containerType: "PALLET" | "CONTAINER" | "TRUCK";
  optimization: LoadOptimization;
  status: "PENDING" | "OPTIMIZED" | "LOADED" | "SHIPPED";
  createdAt: Date;
}

// ============================================================================
// WAREHOUSE LOAD DESIGN INTEGRATION
// ============================================================================

class WarehouseLoadDesignIntegration {
  /**
   * Optimize load for outbound order
   */
  async optimizeLoad(
    warehouseId: string,
    orderId: string,
    items: WarehouseLoadDesign["items"],
    containerType: WarehouseLoadDesign["containerType"],
  ): Promise<WarehouseLoadDesign> {
    // Convert to load design format
    const loadDesign: Partial<LoadDesign> = {
      items: items.map((item) => ({
        id: item.skuId,
        quantity: item.quantity,
        dimensions: item.dimensions,
        weight: item.dimensions.weight,
        fragile: false,
        hazardous: false,
      })),
      containerConstraints: this.getContainerConstraints(containerType),
    };

    // Optimize load
    const optimization = await advancedLoadDesignService.optimizeLoad(
      loadDesign as LoadDesign,
    );

    const warehouseLoad: WarehouseLoadDesign = {
      id: `load-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      warehouseId,
      orderId,
      items,
      containerType,
      optimization,
      status: "OPTIMIZED",
      createdAt: new Date(),
    };

    // Publish event
    await eventBus.publish({
      id: `warehouse-load-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.load.optimized",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        warehouseId,
        orderId,
        loadId: warehouseLoad.id,
        optimization,
      },
    });

    return warehouseLoad;
  }

  /**
   * Get container constraints
   */
  private getContainerConstraints(
    containerType: WarehouseLoadDesign["containerType"],
  ) {
    const constraints = {
      PALLET: {
        maxWeight: 1000, // kg
        maxVolume: 1.2, // m³
        dimensions: { length: 1.2, width: 0.8, height: 1.5 },
      },
      CONTAINER: {
        maxWeight: 28000, // kg
        maxVolume: 33, // m³
        dimensions: { length: 6.1, width: 2.4, height: 2.6 },
      },
      TRUCK: {
        maxWeight: 25000, // kg
        maxVolume: 80, // m³
        dimensions: { length: 13.6, width: 2.5, height: 2.7 },
      },
    };
    return constraints[containerType];
  }
}

export const warehouseLoadDesignIntegration =
  new WarehouseLoadDesignIntegration();
