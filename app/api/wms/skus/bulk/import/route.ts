/**
 * SKU Bulk Import API Endpoint
 * Import multiple SKUs from CSV/Excel
 */

import { NextRequest, NextResponse } from "next/server";
import { skuService } from "@/lib/services/wms/skuService";
import { SKU } from "@/types/sku";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// POST /api/wms/skus/bulk/import - Bulk import SKUs
// ============================================================================

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file content
    const text = await file.text();

    // Parse CSV (simple CSV parser - in production, use a proper CSV library)
    const lines = text.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim());

    const results = {
      total: lines.length - 1,
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>,
      imported: [] as string[],
    };

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const rowData: Record<string, string> = {};

      headers.forEach((header, index) => {
        rowData[header] = values[index] || "";
      });

      try {
        // Map CSV data to SKU structure
        const skuData: Partial<SKU> = {
          skuCode: rowData["SKU Code"] || rowData["skuCode"],
          materialNumber:
            rowData["Material Number"] || rowData["materialNumber"],
          materialDescription:
            rowData["Material Description"] ||
            rowData["materialDescription"] ||
            "",
          category:
            rowData["Category"] || rowData["category"] || "UNCATEGORIZED",
          materialType: (rowData["Material Type"] ||
            rowData["materialType"] ||
            "FINISHED_GOOD") as any,
          baseUnit: rowData["Base Unit"] || rowData["baseUnit"] || "EA",
          status: (rowData["Status"] || rowData["status"] || "DRAFT") as any,
          currency: rowData["Currency"] || rowData["currency"] || "SAR",
          hazardous:
            rowData["Hazardous"]?.toLowerCase() === "true" ||
            rowData["hazardous"] === "true",
          batchManaged:
            rowData["Batch Managed"]?.toLowerCase() === "true" ||
            rowData["batchManaged"] === "true",
          serialNumberManaged:
            rowData["Serial Managed"]?.toLowerCase() === "true" ||
            rowData["serialNumberManaged"] === "true",
        };

        // Parse numeric fields
        if (rowData["Weight"]) skuData.weight = parseFloat(rowData["Weight"]);
        if (rowData["Volume"]) skuData.volume = parseFloat(rowData["Volume"]);
        if (rowData["Standard Cost"])
          skuData.standardCost = parseFloat(rowData["Standard Cost"]);
        if (rowData["Reorder Point"])
          skuData.reorderPoint = parseFloat(rowData["Reorder Point"]);
        if (rowData["Max Stock"])
          skuData.maxStock = parseFloat(rowData["Max Stock"]);
        if (rowData["Safety Stock"])
          skuData.safetyStock = parseFloat(rowData["Safety Stock"]);

        // Create SKU
        const sku = await skuService.createSKU(skuData);
        results.success++;
        results.imported.push(sku.id);
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Error importing SKUs:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to import SKUs",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.skus.bulk.import",
  action: "import",
  requireAuth: true,
  rateLimit: true,
});
