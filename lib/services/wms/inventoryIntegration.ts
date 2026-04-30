/**
 * WMS Inventory Integration
 *
 * Connects inventoryService to SKU module and other WMS components
 * Provides real-time inventory data with caching, IoT support, and event subscriptions
 */

import { inventoryService } from "./inventoryService";
import { eventBus } from "@/lib/services/event-store";
import type { SKU } from "@/types/sku";

export interface InventoryData {
  skuId: string;
  skuCode: string;
  warehouseId: string;
  warehouseName: string;
  location: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  allocatedQuantity: number;
  onOrderQuantity: number;
  inTransitQuantity: number;
  lastUpdated: Date;
  accuracy: number; // 0-100
}

export interface RealTimeInventoryData {
  skuId: string;
  materialNumber: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  inTransit: number;
  onOrder: number;
  allocatedStock: number;
  lastUpdated: string;
  warehouseId?: string;
  location?: string;
  batchNumber?: string;
  serialNumbers?: string[];
}

export interface InventoryMovement {
  id: string;
  skuId: string;
  movementType:
    | "RECEIPT"
    | "SHIPMENT"
    | "ADJUSTMENT"
    | "TRANSFER"
    | "CYCLE_COUNT";
  quantity: number;
  direction: "IN" | "OUT";
  warehouseId: string;
  location: string;
  timestamp: Date;
  reference?: string;
  userId?: string;
}

export interface InventoryAccuracy {
  skuId: string;
  systemCount: number;
  physicalCount: number;
  variance: number;
  accuracy: number; // percentage
  lastCycleCount: string;
  nextCycleCount: string;
}

export interface IoTInventoryUpdate {
  deviceId: string;
  skuId: string;
  quantity: number;
  location: string;
  timestamp: string;
  sensorType: "RFID" | "BARCODE" | "WEIGHT" | "OPTICAL" | "ULTRASONIC";
  confidence: number;
}

/**
 * WMS Inventory Integration Service
 * Consolidated service for all inventory operations including real-time updates, IoT, and caching
 */
export class WMSInventoryIntegration {
  private inventoryCache: Map<string, RealTimeInventoryData> = new Map();
  private accuracyCache: Map<string, InventoryAccuracy> = new Map();
  private iotSubscriptions: Map<string, () => void> = new Map();
  /**
   * Get real-time inventory for SKU
   */
  async getSKUInventory(
    skuId: string,
    warehouseId?: string,
  ): Promise<InventoryData[]> {
    try {
      const inventory = await inventoryService.getInventory(skuId, warehouseId);

      return inventory.map((inv) => ({
        skuId: inv.skuId,
        skuCode: inv.skuCode || "",
        warehouseId: inv.warehouseId,
        warehouseName: inv.warehouseName || "",
        location: inv.location || "",
        quantity: inv.quantity,
        availableQuantity: inv.availableQuantity,
        reservedQuantity: inv.reservedQuantity,
        allocatedQuantity: inv.allocatedQuantity,
        onOrderQuantity: inv.onOrderQuantity || 0,
        inTransitQuantity: inv.inTransitQuantity || 0,
        lastUpdated: inv.lastUpdated,
        accuracy: inv.accuracy || 100,
      }));
    } catch (error) {
      console.error("Error getting SKU inventory:", error);
      return [];
    }
  }

  /**
   * Get total inventory across all warehouses
   */
  async getTotalInventory(skuId: string): Promise<{
    totalQuantity: number;
    totalAvailable: number;
    totalReserved: number;
    warehouses: InventoryData[];
  }> {
    const inventory = await this.getSKUInventory(skuId);

    return {
      totalQuantity: inventory.reduce((sum, inv) => sum + inv.quantity, 0),
      totalAvailable: inventory.reduce(
        (sum, inv) => sum + inv.availableQuantity,
        0,
      ),
      totalReserved: inventory.reduce(
        (sum, inv) => sum + inv.reservedQuantity,
        0,
      ),
      warehouses: inventory,
    };
  }

  /**
   * Update inventory (receipt, shipment, adjustment)
   */
  async updateInventory(
    skuId: string,
    warehouseId: string,
    movement: Omit<InventoryMovement, "id" | "timestamp">,
  ): Promise<boolean> {
    try {
      if (movement.direction === "IN") {
        await inventoryService.receiveInventory(
          skuId,
          warehouseId,
          movement.quantity,
          movement.location,
          movement.reference,
        );
      } else {
        await inventoryService.shipInventory(
          skuId,
          warehouseId,
          movement.quantity,
          movement.location,
          movement.reference,
        );
      }

      return true;
    } catch (error) {
      console.error("Error updating inventory:", error);
      return false;
    }
  }

  /**
   * Reserve inventory
   */
  async reserveInventory(
    skuId: string,
    warehouseId: string,
    quantity: number,
    reference: string,
  ): Promise<boolean> {
    try {
      await inventoryService.reserveInventory(
        skuId,
        warehouseId,
        quantity,
        reference,
      );
      return true;
    } catch (error) {
      console.error("Error reserving inventory:", error);
      return false;
    }
  }

  /**
   * Release reservation
   */
  async releaseReservation(
    skuId: string,
    warehouseId: string,
    reservationId: string,
  ): Promise<boolean> {
    try {
      await inventoryService.releaseReservation(
        skuId,
        warehouseId,
        reservationId,
      );
      return true;
    } catch (error) {
      console.error("Error releasing reservation:", error);
      return false;
    }
  }

  /**
   * Get inventory movements history
   */
  async getInventoryMovements(
    skuId: string,
    warehouseId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<InventoryMovement[]> {
    try {
      const movements = await inventoryService.getInventoryHistory(
        skuId,
        warehouseId,
        startDate,
        endDate,
      );

      return movements.map((mov) => ({
        id: mov.id,
        skuId: mov.skuId,
        movementType: mov.type as InventoryMovement["movementType"],
        quantity: mov.quantity,
        direction: mov.direction as "IN" | "OUT",
        warehouseId: mov.warehouseId,
        location: mov.location || "",
        timestamp: mov.timestamp,
        reference: mov.reference,
        userId: mov.userId,
      }));
    } catch (error) {
      console.error("Error getting inventory movements:", error);
      return [];
    }
  }

  /**
   * Get inventory accuracy
   */
  async getInventoryAccuracy(
    skuId: string,
    warehouseId?: string,
  ): Promise<number> {
    try {
      const inventory = await this.getSKUInventory(skuId, warehouseId);
      if (inventory.length === 0) {
        return 0;
      }

      const avgAccuracy =
        inventory.reduce((sum, inv) => sum + inv.accuracy, 0) /
        inventory.length;
      return Math.round(avgAccuracy);
    } catch (error) {
      console.error("Error getting inventory accuracy:", error);
      return 0;
    }
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(
    skuId: string,
    minThreshold: number = 10,
  ): Promise<InventoryData[]> {
    try {
      const inventory = await this.getSKUInventory(skuId);
      return inventory.filter((inv) => inv.availableQuantity < minThreshold);
    } catch (error) {
      console.error("Error getting low stock alerts:", error);
      return [];
    }
  }

  /**
   * Sync inventory from external system
   */
  async syncInventory(skuId: string, warehouseId: string): Promise<boolean> {
    try {
      // This would integrate with external WMS, ERP, or IoT systems
      await inventoryService.syncInventory(skuId, warehouseId);
      return true;
    } catch (error) {
      console.error("Error syncing inventory:", error);
      return false;
    }
  }

  /**
   * Get real-time inventory for a SKU (with caching)
   */
  async getSKUInventoryRealTime(
    skuId: string,
    warehouseId?: string,
  ): Promise<RealTimeInventoryData | null> {
    // Check cache first
    const cacheKey = warehouseId ? `${skuId}:${warehouseId}` : skuId;
    const cached = this.inventoryCache.get(cacheKey);

    if (cached && this.isCacheValid(cached.lastUpdated)) {
      return cached;
    }

    // Fetch from inventory service
    try {
      const inventory = await this.getSKUInventory(skuId, warehouseId);
      if (inventory.length === 0) {
        return null;
      }

      // Convert to RealTimeInventoryData format
      const inv = inventory[0];
      const realTimeData: RealTimeInventoryData = {
        skuId: inv.skuId,
        materialNumber: inv.skuCode,
        currentStock: inv.quantity,
        reservedStock: inv.reservedQuantity,
        availableStock: inv.availableQuantity,
        inTransit: inv.inTransitQuantity,
        onOrder: inv.onOrderQuantity,
        allocatedStock: inv.allocatedQuantity,
        lastUpdated: inv.lastUpdated.toISOString(),
        warehouseId: inv.warehouseId,
        location: inv.location,
      };

      // Update cache
      this.inventoryCache.set(cacheKey, realTimeData);

      return realTimeData;
    } catch (error) {
      console.error("Error fetching real-time inventory:", error);
      return null;
    }
  }

  /**
   * Get inventory for multiple SKUs
   */
  async getBulkSKUInventory(
    skuIds: string[],
    warehouseId?: string,
  ): Promise<Map<string, RealTimeInventoryData>> {
    const results = new Map<string, RealTimeInventoryData>();

    // Fetch in parallel
    const promises = skuIds.map((skuId) =>
      this.getSKUInventoryRealTime(skuId, warehouseId).then((data) => {
        if (data) results.set(skuId, data);
      }),
    );

    await Promise.all(promises);
    return results;
  }

  /**
   * Subscribe to real-time inventory updates for a SKU
   */
  subscribeToInventoryUpdates(
    skuId: string,
    callback: (data: RealTimeInventoryData) => void,
    warehouseId?: string,
  ): () => void {
    const cacheKey = warehouseId ? `${skuId}:${warehouseId}` : skuId;

    // Subscribe to inventory events
    const inventorySubscription = eventBus.subscribe(
      `inventory.updated.${skuId}`,
      async (event: any) => {
        const inventoryData: RealTimeInventoryData = event.data;
        this.inventoryCache.set(cacheKey, inventoryData);
        callback(inventoryData);
      },
    );

    // Also subscribe to IoT updates
    const iotSubscription = eventBus.subscribe(
      `iot.inventory.update.${skuId}`,
      async (event: any) => {
        await this.handleIoTUpdate(event.data as IoTInventoryUpdate);
      },
    );

    // Store unsubscribe function
    this.iotSubscriptions.set(cacheKey, () => {
      inventorySubscription.unsubscribe();
      iotSubscription.unsubscribe();
    });

    // Return unsubscribe function
    return () => {
      const unsub = this.iotSubscriptions.get(cacheKey);
      if (unsub) {
        unsub();
        this.iotSubscriptions.delete(cacheKey);
      }
    };
  }

  /**
   * Handle IoT inventory updates
   */
  private async handleIoTUpdate(update: IoTInventoryUpdate): Promise<void> {
    const cacheKey = update.skuId;

    // Get current inventory
    const current = this.inventoryCache.get(cacheKey);

    if (current) {
      // Update with IoT data
      const updated: RealTimeInventoryData = {
        ...current,
        currentStock: update.quantity,
        lastUpdated: update.timestamp,
        location: update.location,
      };

      this.inventoryCache.set(cacheKey, updated);

      // Publish update event
      eventBus.publish({
        type: "inventory.updated",
        data: {
          skuId: update.skuId,
          inventory: updated,
          source: "iot",
          deviceId: update.deviceId,
        },
      });
    }
  }

  /**
   * Get inventory accuracy for a SKU
   */
  async getInventoryAccuracyData(
    skuId: string,
  ): Promise<InventoryAccuracy | null> {
    // Check cache
    const cached = this.accuracyCache.get(skuId);
    if (cached) return cached;

    try {
      const accuracy = await this.getInventoryAccuracy(skuId);
      const accuracyData: InventoryAccuracy = {
        skuId,
        systemCount: 0, // Would need to fetch from inventory
        physicalCount: 0,
        variance: 0,
        accuracy,
        lastCycleCount: new Date().toISOString(),
        nextCycleCount: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 30 days
      };

      this.accuracyCache.set(skuId, accuracyData);
      return accuracyData;
    } catch (error) {
      console.error("Error fetching inventory accuracy:", error);
      return null;
    }
  }

  /**
   * Update inventory from RFID/barcode scan
   */
  async updateInventoryFromScan(
    skuId: string,
    scanData: {
      quantity: number;
      location: string;
      batchNumber?: string;
      serialNumber?: string;
      scanType: "RFID" | "BARCODE";
    },
  ): Promise<RealTimeInventoryData> {
    try {
      // Update inventory via movement
      await this.updateInventory(skuId, scanData.location, {
        movementType: "ADJUSTMENT",
        quantity: scanData.quantity,
        direction: "IN",
        warehouseId: scanData.location,
        location: scanData.location,
        reference: `SCAN_${scanData.scanType}_${Date.now()}`,
      });

      // Get updated inventory
      const updated = await this.getSKUInventoryRealTime(skuId);
      if (!updated) {
        throw new Error("Failed to get updated inventory");
      }

      // Update cache
      const cacheKey = skuId;
      this.inventoryCache.set(cacheKey, updated);

      // Publish event
      eventBus.publish({
        type: "inventory.scan.update",
        data: {
          skuId,
          inventory: updated,
          scanData,
        },
      });

      return updated;
    } catch (error) {
      console.error("Error updating inventory from scan:", error);
      throw error;
    }
  }

  /**
   * Trigger cycle count for a SKU
   */
  async triggerCycleCount(skuId: string, warehouseId?: string): Promise<void> {
    try {
      // Clear cache to force refresh
      const cacheKey = warehouseId ? `${skuId}:${warehouseId}` : skuId;
      this.inventoryCache.delete(cacheKey);
      this.accuracyCache.delete(skuId);

      // Publish event
      eventBus.publish({
        type: "inventory.cycle-count.triggered",
        data: { skuId, warehouseId },
      });
    } catch (error) {
      console.error("Error triggering cycle count:", error);
      throw error;
    }
  }

  /**
   * Get stock level status
   */
  getStockStatus(
    currentStock: number,
    reorderPoint: number,
    maxStock: number,
    safetyStock: number,
  ): {
    level: "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK" | "OVER_STOCK";
    label: string;
    color: string;
    urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  } {
    if (currentStock === 0) {
      return {
        level: "OUT_OF_STOCK",
        label: "Out of Stock",
        color: "#ef4444",
        urgency: "CRITICAL",
      };
    }

    if (currentStock <= reorderPoint) {
      return {
        level: "LOW_STOCK",
        label: "Low Stock",
        color: "#f59e0b",
        urgency: currentStock <= safetyStock ? "HIGH" : "MEDIUM",
      };
    }

    if (currentStock > maxStock) {
      return {
        level: "OVER_STOCK",
        label: "Over Stock",
        color: "#8b5cf6",
        urgency: "LOW",
      };
    }

    return {
      level: "IN_STOCK",
      label: "In Stock",
      color: "#10b981",
      urgency: "LOW",
    };
  }

  /**
   * Check if cache is still valid (5 seconds TTL)
   */
  private isCacheValid(lastUpdated: string): boolean {
    const age = Date.now() - new Date(lastUpdated).getTime();
    return age < 5000; // 5 seconds
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.inventoryCache.clear();
    this.accuracyCache.clear();
  }
}

export const wmsInventoryIntegration = new WMSInventoryIntegration();

// Export alias for backward compatibility
export const skuInventoryIntegration = wmsInventoryIntegration;
