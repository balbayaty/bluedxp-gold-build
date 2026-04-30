/**
 * Warehouse Vision Service
 * Wrapper around logisticsVisionService for warehouse-specific operations
 * NO DUPLICATION - Reuses existing logisticsVisionService
 */

import logisticsVisionService from "@/lib/services/ai/industry/logisticsVisionService";
import type { LogisticsVisionAnalysis } from "@/lib/services/ai/industry/logisticsVisionService";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// WAREHOUSE VISION TYPES
// ============================================================================

export interface WarehouseVisionAnalysis {
  warehouseId: string;
  location?: string;
  zone?: string;
  analysis: LogisticsVisionAnalysis;
  actionRequired: boolean;
  urgency: "low" | "medium" | "high" | "critical";
}

// ============================================================================
// WAREHOUSE VISION SERVICE
// ============================================================================

class WarehouseVisionService {
  /**
   * Analyze receiving goods for damage
   */
  async analyzeReceiving(
    warehouseId: string,
    imageFile: File | string,
    location?: string,
  ): Promise<WarehouseVisionAnalysis> {
    const analysis = await logisticsVisionService.analyzeLogisticsImage(
      imageFile,
      `Warehouse: ${warehouseId}, Location: ${location || "Receiving Dock"}`,
      { mode: "damage_assessment", checkCompliance: true },
    );

    const urgency =
      analysis.packageCondition === "critical"
        ? "critical"
        : analysis.packageCondition === "poor"
          ? "high"
          : analysis.packageCondition === "fair"
            ? "medium"
            : "low";

    const result: WarehouseVisionAnalysis = {
      warehouseId,
      location,
      analysis,
      actionRequired:
        analysis.packageCondition !== "excellent" &&
        analysis.packageCondition !== "good",
      urgency,
    };

    // Publish event
    await eventBus.publish({
      id: `warehouse-vision-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.vision.analyzed",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        warehouseId,
        location,
        analysisType: "receiving",
        result,
      },
    });

    return result;
  }

  /**
   * Count inventory using camera
   */
  async countInventory(
    warehouseId: string,
    imageFile: File | string,
    location: string,
    expectedCount?: number,
  ): Promise<WarehouseVisionAnalysis> {
    const analysis = await logisticsVisionService.analyzeLogisticsImage(
      imageFile,
      `Warehouse: ${warehouseId}, Location: ${location}, Expected: ${expectedCount || "unknown"}`,
      { mode: "inventory_counting", countInventory: true },
    );

    const urgency =
      analysis.inventoryCount?.discrepancies &&
      Math.abs(analysis.inventoryCount.discrepancies.difference) > 5
        ? "high"
        : analysis.inventoryCount?.discrepancies &&
            Math.abs(analysis.inventoryCount.discrepancies.difference) > 0
          ? "medium"
          : "low";

    const result: WarehouseVisionAnalysis = {
      warehouseId,
      location,
      analysis,
      actionRequired: analysis.inventoryCount?.discrepancies
        ? Math.abs(analysis.inventoryCount.discrepancies.difference) > 0
        : false,
      urgency,
    };

    // Publish event
    await eventBus.publish({
      id: `warehouse-vision-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.vision.analyzed",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        warehouseId,
        location,
        analysisType: "inventory_counting",
        result,
      },
    });

    return result;
  }

  /**
   * Verify loading compliance
   */
  async verifyLoading(
    warehouseId: string,
    imageFile: File | string,
    dockId?: string,
  ): Promise<WarehouseVisionAnalysis> {
    const analysis = await logisticsVisionService.analyzeLogisticsImage(
      imageFile,
      `Warehouse: ${warehouseId}, Dock: ${dockId || "Loading Dock"}`,
      { mode: "loading_verification", checkCompliance: true },
    );

    const urgency = !analysis.loadingVerification?.verified
      ? "high"
      : (analysis.loadingVerification?.complianceScore || 0) < 80
        ? "medium"
        : "low";

    const result: WarehouseVisionAnalysis = {
      warehouseId,
      location: dockId,
      analysis,
      actionRequired:
        !analysis.loadingVerification?.verified ||
        (analysis.loadingVerification?.complianceScore || 0) < 90,
      urgency,
    };

    // Publish event
    await eventBus.publish({
      id: `warehouse-vision-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.vision.analyzed",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        warehouseId,
        location: dockId,
        analysisType: "loading_verification",
        result,
      },
    });

    return result;
  }
}

export const warehouseVisionService = new WarehouseVisionService();
