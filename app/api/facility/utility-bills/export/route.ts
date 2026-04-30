/**
 * Export API Route
 *
 * POST /api/facility/utility-bills/export - Export bills
 */

import { NextRequest, NextResponse } from "next/server";
import { getUtilityBillService } from "@/lib/services/facility/utility-bills/utilityBillService";
import { getExportService } from "@/lib/services/facility/utility-bills/exportService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import type { UtilityBillExport } from "@/types/utility-bills";

export async function POST(request: NextRequest) {
  try {
    const exportOptions: UtilityBillExport = await request.json();

    const billService = getUtilityBillService();
    const exportService = getExportService();

    // Get bills based on filters
    const { bills } = await billService.getBills({
      filters: exportOptions.filters,
    });

    let blob: Blob;
    let contentType: string;
    let filename: string;

    switch (exportOptions.format) {
      case "csv":
        blob = await exportService.exportToCSV(bills);
        contentType = "text/csv";
        filename = `utility-bills-${Date.now()}.csv`;
        break;
      case "excel":
        blob = await exportService.exportToExcel(bills, exportOptions);
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = `utility-bills-${Date.now()}.xlsx`;
        break;
      case "json":
        blob = new Blob([JSON.stringify(bills, null, 2)], {
          type: "application/json",
        });
        contentType = "application/json";
        filename = `utility-bills-${Date.now()}.json`;
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Invalid export format" },
          { status: 400 },
        );
    }

    // Convert blob to buffer for response
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error exporting bills", err, {
      module: "facility",
      service: "utility-bills",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "utility-bills",
    });
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to export bills",
      },
      { status: 500 },
    );
  }
}
