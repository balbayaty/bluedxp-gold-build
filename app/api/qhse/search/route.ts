/**
 * QHSE Advanced Search API
 * Full-text search across all QHSE data
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseSearchService } from "@/lib/services/qhse/search/qhseSearchService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const entityTypes = searchParams.get("types")?.split(",") as any;
    const status = searchParams.get("status")?.split(",");
    const severity = searchParams.get("severity")?.split(",");
    const type = searchParams.get("type")?.split(",");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const tenantId = searchParams.get("tenantId");
    const customerId = searchParams.get("customerId");
    const warehouseId = searchParams.get("warehouseId");
    const facilityId = searchParams.get("facilityId");
    const sortBy = searchParams.get("sortBy");
    const sortOrder = (searchParams.get("sortOrder") || "DESC") as
      | "ASC"
      | "DESC";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter "q" is required' },
        { status: 400 },
      );
    }

    const searchQuery = {
      query,
      entityTypes,
      filters: {
        status,
        severity,
        type,
        dateFrom,
        dateTo,
        tenantId,
        customerId,
        warehouseId,
        facilityId,
      },
      sortBy,
      sortOrder,
      limit,
      offset,
    };

    const result = await qhseSearchService.search(searchQuery);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error in search:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Search failed",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "save") {
      const { name, query, userId } = body;
      if (!name || !query || !userId) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required fields: name, query, userId",
          },
          { status: 400 },
        );
      }

      const savedSearch = qhseSearchService.saveSearch(name, query, userId);
      return NextResponse.json(
        { success: true, data: savedSearch },
        { status: 201 },
      );
    }

    if (action === "delete") {
      const { searchId, userId } = body;
      if (!searchId || !userId) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required fields: searchId, userId",
          },
          { status: 400 },
        );
      }

      const deleted = qhseSearchService.deleteSavedSearch(searchId, userId);
      return NextResponse.json({ success: deleted });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "save" or "delete"' },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in search API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Operation failed",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.search",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.search",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
