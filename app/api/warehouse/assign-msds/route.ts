/**
 * API Route: Warehouse Assignment Recommendations for MSDS
 * Returns warehouse recommendations based on MSDS storage requirements
 */

import { NextRequest, NextResponse } from "next/server";
import {
  warehouseAssignmentService,
  MSDSStorageRequirements,
  WarehouseAssignmentConfig,
} from "@/lib/services/warehouse-assignment";
import { PrismaClient } from "@prisma/client";
import { ERPNextAPI } from "@/lib/adapters/erpnext/api";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const prisma = new PrismaClient();

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { msdsData, config } = body;

    if (!msdsData) {
      return NextResponse.json(
        { success: false, error: "MSDS data is required" },
        { status: 400 },
      );
    }

    // Extract storage requirements from MSDS data
    const storageRequirements: MSDSStorageRequirements = {
      temperatureControlled: msdsData.storageConditions?.some(
        (c: string) =>
          c.toLowerCase().includes("temperature") ||
          c.toLowerCase().includes("cold") ||
          c.toLowerCase().includes("refrigerated"),
      ),
      minTemperature: msdsData.storageConditions?.find(
        (c: string) =>
          c.toLowerCase().includes("min") || c.toLowerCase().includes("below"),
      )
        ? parseFloat(
            msdsData.storageConditions
              .find(
                (c: string) =>
                  c.toLowerCase().includes("min") ||
                  c.toLowerCase().includes("below"),
              )
              .match(/-?\d+/)?.[0] || "0",
          )
        : undefined,
      maxTemperature: msdsData.storageConditions?.find(
        (c: string) =>
          c.toLowerCase().includes("max") || c.toLowerCase().includes("above"),
      )
        ? parseFloat(
            msdsData.storageConditions
              .find(
                (c: string) =>
                  c.toLowerCase().includes("max") ||
                  c.toLowerCase().includes("above"),
              )
              .match(/-?\d+/)?.[0] || "0",
          )
        : undefined,
      storageTemperature: msdsData.storageConditions?.find((c: string) =>
        c.toLowerCase().includes("temperature"),
      ),
      hazardClass: msdsData.hazardClass,
      hazardLevel: msdsData.hazardLevel,
      unNumber: msdsData.unNumber,
      packingGroup: msdsData.packingGroup,
      transportClass: msdsData.transportClass,
      storageConditions: msdsData.storageConditions || [],
      incompatibleMaterials: msdsData.incompatibleMaterials || [],
      requiresVentilation: msdsData.storageConditions?.some(
        (c: string) =>
          c.toLowerCase().includes("ventilation") ||
          c.toLowerCase().includes("ventilated"),
      ),
      requiresSecondaryContainment: msdsData.storageConditions?.some(
        (c: string) =>
          c.toLowerCase().includes("containment") ||
          c.toLowerCase().includes("secondary"),
      ),
      physicalState: msdsData.physicalState?.toLowerCase() as
        | "solid"
        | "liquid"
        | "gas"
        | undefined,
      flashPoint: msdsData.flashPoint,
      boilingPoint: msdsData.boilingPoint,
      ghsCompliant: msdsData.ghsCompliant,
      requiresSpecialHandling:
        msdsData.hazardLevel === "High" ||
        msdsData.storageConditions?.some(
          (c: string) =>
            c.toLowerCase().includes("special") ||
            c.toLowerCase().includes("care"),
        ),
      quantity: config?.quantity,
      volume: config?.volume,
      weight: config?.weight,
    };

    // Get warehouses
    let warehouses: any[] | undefined = undefined;

    try {
      // Try to get from ERPNext first
      const erpnextAPI = new ERPNextAPI();
      // ... (erpnext logic logic remains or is commented out)
    } catch (e) {
      // Ignore
    }

    if (!warehouses || warehouses.length === 0) {
      try {
        const dbWarehouses = await prisma.warehouse.findMany({
          include: {
            facility: true,
            areas: true,
          },
        });
        if (dbWarehouses.length > 0) {
          warehouses = dbWarehouses;
        } else {
          logger.warn("No warehouses found in database");
        }
      } catch (dbError) {
        logger.error("Database fetch failed", { error: dbError });
      }
    }

    if (!warehouses) {
      warehouses = [];
    }

    // Get recommendations
    const recommendations =
      await warehouseAssignmentService.getWarehouseRecommendations(
        storageRequirements,
        warehouses,
        config as WarehouseAssignmentConfig,
      );

    // Get diagnostic information about filtered warehouses
    const filteredDiagnostics =
      warehouseAssignmentService.getFilteredWarehousesDiagnostics();

    // Analyze why warehouses might have been filtered
    const diagnosticSummary = {
      totalWarehouses: warehouses.length || 0,
      recommendedCount: recommendations.length || 0,
      filteredCount: filteredDiagnostics.length || 0,
      commonReasons: [] as string[],
      requiresHazmat:
        storageRequirements.hazardLevel === "High" ||
        !!storageRequirements.hazardClass,
      requiresTemperature: storageRequirements.temperatureControlled || false,
    };

    // Log summary for debugging
    logger.info("Warehouse Assignment Summary", {
      total: diagnosticSummary.totalWarehouses,
      recommended: diagnosticSummary.recommendedCount,
      filtered: diagnosticSummary.filteredCount,
      requiresHazmat: diagnosticSummary.requiresHazmat,
    });

    // Count common reasons
    const reasonCounts: Record<string, number> = {};
    filteredDiagnostics.forEach((f) => {
      reasonCounts[f.reason] = (reasonCounts[f.reason] || 0) + 1;
    });

    diagnosticSummary.commonReasons = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason]) => reason);

    return NextResponse.json({
      success: true,
      recommendations,
      storageRequirements,
      diagnostics: {
        summary: diagnosticSummary,
        filteredWarehouses: filteredDiagnostics.slice(0, 10),
      },
      totalWarehouses: warehouses.length,
      recommendedCount: recommendations.length,
    });
  } catch (error) {
    logger.error("Warehouse assignment error", {
      error: error instanceof Error ? error.message : String(error),
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "warehouse-assignment", action: "get-recommendations" },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get warehouse recommendations",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.msds-assignment",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
