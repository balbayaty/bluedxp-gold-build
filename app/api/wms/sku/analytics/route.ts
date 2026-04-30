/**
 * SKU AI Analytics API
 * AI-powered analytics for SKU module
 * Demand forecasting, optimization, classification
 */

import { NextRequest, NextResponse } from "next/server";
import { aiAnalyticsService } from "@/lib/services/wms/aiAnalyticsService";
import { skuService } from "@/lib/services/wms/skuService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skuId = searchParams.get("skuId");
    const type = searchParams.get("type") || "all"; // 'forecast' | 'optimization' | 'classification' | 'all'

    // Extract multi-tenant context for proper data segregation
    const tenantId = searchParams.get("tenantId") || undefined;
    const customerId = searchParams.get("customerId") || undefined;
    const warehouseId = searchParams.get("warehouseId") || undefined;

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

    // Prepare options for analytics with proper segregation
    const analyticsOptions = { tenantId, customerId, warehouseId };

    const results: any = {};

    // Get demand forecast
    if (type === "all" || type === "forecast") {
      try {
        results.forecast = await aiAnalyticsService.forecastDemand(
          skuId,
          "MONTHLY",
          analyticsOptions,
        );
      } catch (error: unknown) {
        logger.warn("Error getting forecast", {
          error: error instanceof Error ? error.message : String(error),
          skuId,
        });
      }
    }

    // Get inventory optimization
    if (type === "all" || type === "optimization") {
      try {
        results.optimization = await aiAnalyticsService.optimizeInventory(
          skuId,
          analyticsOptions,
        );
        results.safetyStock = await aiAnalyticsService.optimizeSafetyStock(
          skuId,
          analyticsOptions,
        );
        results.reorderPoint = await aiAnalyticsService.optimizeReorderPoint(
          skuId,
          analyticsOptions,
        );
      } catch (error: unknown) {
        logger.warn("Error getting optimization", {
          error: error instanceof Error ? error.message : String(error),
          skuId,
        });
      }
    }

    // Get ABC/XYZ classification
    if (type === "all" || type === "classification") {
      try {
        results.classification = await aiAnalyticsService.classifyABCXYZ(
          skuId,
          analyticsOptions,
        );
      } catch (error: unknown) {
        logger.warn("Error getting classification", {
          error: error instanceof Error ? error.message : String(error),
          skuId,
        });
      }
    }

    // Get anomaly detection
    if (type === "all" || type === "anomalies") {
      try {
        results.anomalies = await aiAnalyticsService.detectAnomalies(
          skuId,
          analyticsOptions,
        );
      } catch (error: unknown) {
        logger.warn("Error detecting anomalies", {
          error: error instanceof Error ? error.message : String(error),
          skuId,
        });
      }
    }

    // Get full analytics from SKU service
    try {
      results.analytics = await skuService.getSKUAnalytics(skuId);
    } catch (error: unknown) {
      logger.warn("Error getting SKU analytics", {
        error: error instanceof Error ? error.message : String(error),
        skuId,
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: unknown) {
    logger.error("Error fetching SKU analytics", {
      error: error instanceof Error ? error.message : String(error),
      skuId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "wms-sku-analytics", action: "fetch", skuId },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch analytics",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.sku.analytics",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
