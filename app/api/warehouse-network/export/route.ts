/**
 * Warehouse Network Export API
 * Export networks, transfers, routes, and analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { warehouseNetworkExportService } from "@/lib/services/warehouse-network/warehouseNetworkExportService";
import { warehouseNetworkService } from "@/lib/services/warehouse-network";
import type { ExportFormat } from "@/lib/services/export/exportService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "networks"; // networks, transfers, routes, analytics
    const format = (searchParams.get("format") || "xlsx") as ExportFormat;
    const networkId = searchParams.get("networkId");

    let result;

    switch (type) {
      case "networks":
        const networks = await warehouseNetworkService.getAllNetworks();
        result = await warehouseNetworkExportService.exportNetworks(
          networks,
          format,
        );
        break;

      case "transfers":
        const networkIdForTransfers = networkId || "network-1"; // Default
        const transfers = await warehouseNetworkService.getNetworkTransfers(
          networkIdForTransfers,
        );
        result = await warehouseNetworkExportService.exportTransfers(
          transfers,
          format,
        );
        break;

      case "routes":
        const networkIdForRoutes = networkId || "network-1"; // Default
        const routes =
          await warehouseNetworkService.getNetworkRoutes(networkIdForRoutes);
        result = await warehouseNetworkExportService.exportRoutes(
          routes,
          format,
        );
        break;

      case "analytics":
        if (!networkId) {
          return NextResponse.json(
            {
              success: false,
              error: "networkId is required for analytics export",
            },
            { status: 400 },
          );
        }
        result = await warehouseNetworkExportService.exportNetworkAnalytics(
          networkId,
          format,
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Invalid export type: ${type}` },
          { status: 400 },
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Export failed" },
        { status: 500 },
      );
    }

    // Return file download
    const headers = new Headers();
    headers.set("Content-Type", getContentType(format));
    headers.set(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`,
    );

    return new NextResponse(result.blob, { headers });
  } catch (error: any) {
    console.error("Failed to export:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export" },
      { status: 500 },
    );
  }
}

function getContentType(format: ExportFormat): string {
  switch (format) {
    case "pdf":
      return "application/pdf";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "csv":
      return "text/csv";
    case "json":
      return "application/json";
    case "xml":
      return "application/xml";
    default:
      return "application/octet-stream";
  }
}
