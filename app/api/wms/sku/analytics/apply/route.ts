/**
 * SKU AI Analytics Apply API
 * Apply optimization recommendations to SKU settings
 */

import { NextRequest, NextResponse } from "next/server";
import { aiAnalyticsService } from "@/lib/services/wms/aiAnalyticsService";
import { skuService } from "@/lib/services/wms/skuService";
import { eventBus } from "@/lib/services/event-store";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const {
      skuId,
      optimization,
      safetyStock,
      reorderPoint,
      tenantId,
      customerId,
      warehouseId,
    } = body;

    if (!skuId) {
      return NextResponse.json(
        { success: false, error: "skuId is required" },
        { status: 400 },
      );
    }

    // Verify SKU exists
    const sku = await skuService.getSKU(skuId);
    if (!sku) {
      return NextResponse.json(
        { success: false, error: "SKU not found" },
        { status: 404 },
      );
    }

    const updates: Partial<any> = {};
    const appliedRecommendations: string[] = [];

    // Apply inventory optimization
    if (optimization) {
      if (optimization.optimalStock !== undefined) {
        updates.maxStock = optimization.optimalStock;
        appliedRecommendations.push(`Max Stock: ${optimization.optimalStock}`);
      }
      if (
        optimization.recommendedAction === "INCREASE" ||
        optimization.recommendedAction === "DECREASE"
      ) {
        appliedRecommendations.push(
          `Action: ${optimization.recommendedAction} by ${optimization.recommendedQuantity}`,
        );
      }
    }

    // Apply safety stock optimization
    if (safetyStock?.recommendedSafetyStock !== undefined) {
      updates.safetyStock = safetyStock.recommendedSafetyStock;
      appliedRecommendations.push(
        `Safety Stock: ${safetyStock.recommendedSafetyStock}`,
      );
    }

    // Apply reorder point optimization
    if (reorderPoint?.recommendedReorderPoint !== undefined) {
      updates.reorderPoint = reorderPoint.recommendedReorderPoint;
      appliedRecommendations.push(
        `Reorder Point: ${reorderPoint.recommendedReorderPoint}`,
      );
    }

    // Update SKU with optimization recommendations
    if (Object.keys(updates).length > 0) {
      await skuService.updateSKU(skuId, updates);

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "wms.analytics.optimization.applied",
        aggregateId: skuId,
        aggregateType: "SKU",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          skuId,
          updates,
          appliedRecommendations,
          tenantId,
          customerId,
          warehouseId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Optimization applied successfully",
        data: {
          skuId,
          updates,
          appliedRecommendations,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "No optimization recommendations to apply",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error applying optimization:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to apply optimization",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.sku.analytics.apply",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
