/**
 * SKU API Endpoints
 * RESTful API for SKU management
 * Integration-First • Deep Architecture
 */

import { NextRequest, NextResponse } from "next/server";
import { skuService } from "@/lib/services/wms/skuService";
import { SKU, SKUSearchFilters } from "@/types/sku";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET /api/wms/skus - Search and list SKUs
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
      batchManaged:
        searchParams.get("batchManaged") === "true"
          ? true
          : searchParams.get("batchManaged") === "false"
            ? false
            : undefined,
      serialNumberManaged:
        searchParams.get("serialNumberManaged") === "true"
          ? true
          : searchParams.get("serialNumberManaged") === "false"
            ? false
            : undefined,
      customerId: searchParams.get("customerId") || undefined,
      warehouseId: searchParams.get("warehouseId") || undefined,
      tags: searchParams.get("tags")?.split(","),
    };

    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

    // Search SKUs
    const result = await skuService.searchSKUs(filters, page, pageSize);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error searching SKUs:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to search SKUs",
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST /api/wms/skus - Create new SKU
// ============================================================================

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.materialDescription && !body.skuCode) {
      return NextResponse.json(
        { error: "Material description or SKU code is required" },
        { status: 400 },
      );
    }

    // Create SKU
    const sku = await skuService.createSKU(body);

    return NextResponse.json(sku, { status: 201 });
  } catch (error) {
    console.error("Error creating SKU:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create SKU",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.skus",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.skus",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
