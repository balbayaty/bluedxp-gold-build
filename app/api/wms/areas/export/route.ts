/**
 * Warehouse Areas Export API
 * Export areas to CSV format
 */

import { NextRequest, NextResponse } from "next/server";
import { warehouseAreaService } from "@/lib/services/wms/areaService";
import type { WarehouseAreaFilters } from "@/types/warehouseArea";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * GET /api/wms/areas/export
 * Export areas to CSV
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: WarehouseAreaFilters = {
      warehouseId: searchParams.get("warehouseId") || undefined,
      zone: searchParams.get("zone") || undefined,
      active:
        searchParams.get("active") === "true"
          ? true
          : searchParams.get("active") === "false"
            ? false
            : undefined,
      tenantId: searchParams.get("tenantId") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      searchQuery: searchParams.get("search") || undefined,
    };

    const exportData = await warehouseAreaService.exportAreas(filters);

    // Convert to CSV
    const headers = [
      "Area Code",
      "Area Name",
      "Zone",
      "Capacity",
      "Current Stock",
      "Usage %",
      "Allowed Hazards",
      "Restrictions",
    ];
    const csvRows = [
      headers.join(","),
      ...exportData.map((row) =>
        [
          row.areaCode,
          row.areaName,
          row.zone,
          row.capacity,
          row.currentStock,
          row.usagePercentage,
          `"${row.allowedHazards}"`,
          `"${row.restrictions}"`,
        ].join(","),
      ),
    ];

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="warehouse-areas-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting areas:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to export areas",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.areas.export",
  action: "export",
  requireAuth: true,
  rateLimit: true,
});
