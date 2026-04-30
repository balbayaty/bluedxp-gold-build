/**
 * SKU Bulk Export API Endpoint
 * Export SKUs to CSV/Excel
 */

import { NextRequest, NextResponse } from "next/server";
import { skuService } from "@/lib/services/wms/skuService";
import { SKUSearchFilters } from "@/types/sku";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET /api/wms/skus/bulk/export - Export SKUs
// ============================================================================

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const filters: SKUSearchFilters = {
      searchQuery: searchParams.get("search") || undefined,
      status: searchParams.get("status")?.split(",") as any,
      category: searchParams.get("category")?.split(","),
      materialType: searchParams.get("materialType")?.split(",") as any,
      hazardous:
        searchParams.get("hazardous") === "true"
          ? true
          : searchParams.get("hazardous") === "false"
            ? false
            : undefined,
    };

    // Get all SKUs (no pagination for export)
    const result = await skuService.searchSKUs(filters, 1, 10000);

    // Convert to CSV
    const headers = [
      "SKU Code",
      "Material Number",
      "Material Description",
      "Category",
      "Material Type",
      "Base Unit",
      "Status",
      "Weight",
      "Volume",
      "Standard Cost",
      "Currency",
      "Hazardous",
      "Batch Managed",
      "Serial Managed",
      "Reorder Point",
      "Max Stock",
      "Safety Stock",
    ];

    const csvRows = [
      headers.join(","),
      ...result.skus.map((sku) =>
        [
          sku.skuCode || "",
          sku.materialNumber || "",
          `"${(sku.materialDescription || "").replace(/"/g, '""')}"`,
          sku.category || "",
          sku.materialType || "",
          sku.baseUnit || "",
          sku.status || "",
          sku.weight || "",
          sku.volume || "",
          sku.standardCost || "",
          sku.currency || "",
          sku.hazardous ? "true" : "false",
          sku.batchManaged ? "true" : "false",
          sku.serialNumberManaged ? "true" : "false",
          sku.reorderPoint || "",
          sku.maxStock || "",
          sku.safetyStock || "",
        ].join(","),
      ),
    ];

    const csv = csvRows.join("\n");

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="skus-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting SKUs:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to export SKUs",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.skus.bulk.export",
  action: "export",
  requireAuth: true,
  rateLimit: true,
});
