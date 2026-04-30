/**
 * MSDS Search History API
 * Manages search history for intelligent recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { msdsSearchHistoryService } from "@/lib/services/chemical/msdsSearchHistoryService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = context.tenantId;
    const type = searchParams.get("type") || "recent"; // 'recent' | 'popular'
    const limit = parseInt(searchParams.get("limit") || "10");

    let data: any;

    if (type === "popular") {
      data = await msdsSearchHistoryService.getPopularSearches(tenantId, limit);
    } else {
      data = await msdsSearchHistoryService.getRecentSearches(tenantId, limit);
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("❌ Error getting search history:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get search history",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { query, filters, resultsCount } = body;
    const tenantId = context.tenantId;
    const userId = context.userId || "unknown";

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 },
      );
    }

    const searchId = await msdsSearchHistoryService.saveSearch(
      query,
      filters || {},
      resultsCount || 0,
      userId,
      tenantId,
    );

    return NextResponse.json({
      success: true,
      data: { searchId },
    });
  } catch (error: any) {
    console.error("❌ Error saving search history:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save search history",
      },
      { status: 500 },
    );
  }
}

async function deleteHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId = context.tenantId;

    await msdsSearchHistoryService.clearHistory(tenantId);

    return NextResponse.json({
      success: true,
      message: "Search history cleared",
    });
  } catch (error: any) {
    console.error("❌ Error clearing search history:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to clear search history",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.search-history",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.search-history",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.search-history",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
