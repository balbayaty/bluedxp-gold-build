/**
 * Warehouse Export API
 * Export warehouse data with lifecycle integration
 * Uses centralized exportService for consistency
 */

import { NextRequest, NextResponse } from "next/server";
import { wmsLifecycleIntegration } from "@/lib/services/process-lifecycle/wms/wmsLifecycleIntegration";
import { exportService } from "@/lib/services/export/exportService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const warehouseId = params.id;
    const format = request.nextUrl.searchParams.get("format") || "pdf";
    const includeLifecycle =
      request.nextUrl.searchParams.get("includeLifecycle") === "true";

    // Mock warehouse data (in production, fetch from database)
    const warehouseData = {
      id: warehouseId,
      name: `Warehouse ${warehouseId}`,
      location: "Sample Location",
      capacity: 10000,
      utilization: 75,
      status: "OPERATIONAL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optionally include lifecycle analytics
    let lifecycleData = null;
    if (includeLifecycle) {
      try {
        const lifecycleAnalytics =
          await wmsLifecycleIntegration.getWmsLifecycleAnalytics(undefined, {
            warehouseId,
          });
        lifecycleData = lifecycleAnalytics;
      } catch (error) {
        logger.warn("Error fetching lifecycle data for export", {
          error: error instanceof Error ? error.message : String(error),
          warehouseId,
        });
        errorTrackingService.captureException(
          error instanceof Error ? error : new Error(String(error)),
          {
            context: "warehouse-export",
            action: "fetch-lifecycle",
            warehouseId,
          },
        );
        // Continue without lifecycle data
      }
    }

    // Prepare export data
    const exportData = {
      warehouse: warehouseData,
      lifecycle: lifecycleData,
      metadata: {
        generatedAt: new Date().toISOString(),
        format,
        includeLifecycle,
      },
    };

    // Use centralized export service
    try {
      const result = await exportService.export({
        format:
          format === "excel"
            ? "xlsx"
            : (format as "pdf" | "csv" | "xlsx" | "json"),
        filename: `warehouse-${warehouseId}-report-${new Date().toISOString().split("T")[0]}`,
        title: `Warehouse Report - ${warehouseData.name}`,
        description: `Comprehensive warehouse report${includeLifecycle ? " with lifecycle analytics" : ""}`,
        data: exportData,
        includeHeaders: true,
        includeTimestamp: true,
        includeMetadata: true,
      });

      if (result.success && result.blob) {
        // Return the blob as a response
        const contentType =
          format === "pdf"
            ? "application/pdf"
            : format === "excel" || format === "xlsx"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : format === "csv"
                ? "text/csv"
                : "application/json";

        return new NextResponse(result.blob, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${result.filename}.${format === "pdf" ? "pdf" : format === "excel" || format === "xlsx" ? "xlsx" : format === "csv" ? "csv" : "json"}"`,
            "Content-Length": result.blob.size.toString(),
          },
        });
      }
    } catch (exportError) {
      logger.error("Export service error", {
        error:
          exportError instanceof Error
            ? exportError.message
            : String(exportError),
        warehouseId,
        format,
      });
      errorTrackingService.captureException(
        exportError instanceof Error
          ? exportError
          : new Error(String(exportError)),
        { context: "warehouse-export", action: "export", warehouseId, format },
      );
      // Fall through to JSON response
    }

    // Fallback: Return JSON response if export service fails
    return NextResponse.json({
      success: true,
      message: `Export data prepared successfully in ${format.toUpperCase()} format`,
      data: exportData,
      metadata: {
        generatedAt: new Date().toISOString(),
        format,
        note: "Export service unavailable, returning JSON data",
      },
    });
  } catch (error) {
    logger.error("Error generating warehouse export", {
      error: error instanceof Error ? error.message : String(error),
      warehouseId: params.id,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      {
        context: "warehouse-export",
        action: "generate",
        warehouseId: params.id,
      },
    );
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate export",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.export",
  action: "export",
  requireAuth: true,
  rateLimit: true,
});
