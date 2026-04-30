/**
 * MSDS-SKU Linking API Routes
 * RESTful API for managing MSDS-SKU links
 */

import { NextRequest, NextResponse } from "next/server";
import { msdsSkuLinkingService } from "@/lib/services/msds-sku-linking/msdsSkuLinkingService";
import { LinkSearchFilters } from "@/types/msdsSkuLinking";
import { requireAuth } from "../_auth";
import { getMsdsSkuLinkingRbac } from "@/lib/services/msds-sku-linking/rbac";

// ============================================================================
// GET /api/msds-sku-linking/links - Search links
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const rbac = getMsdsSkuLinkingRbac();
    const authRes = await requireAuth(request, {
      anyRole: rbac.readerRoles,
    });
    if (!authRes.ok) return authRes.response;
    const { tenantId } = authRes.auth;

    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const filters: LinkSearchFilters = {
      customerId: searchParams.get("customerId") || undefined,
      msdsId: searchParams.get("msdsId") || undefined,
      skuId: searchParams.get("skuId") || undefined,
      status: searchParams.get("status")?.split(",") as any,
      matchingStrategy: searchParams.get("matchingStrategy")?.split(",") as any,
      minConfidence: searchParams.get("minConfidence")
        ? parseInt(searchParams.get("minConfidence")!)
        : undefined,
      maxConfidence: searchParams.get("maxConfidence")
        ? parseInt(searchParams.get("maxConfidence")!)
        : undefined,
      complianceStatus: searchParams.get("complianceStatus")?.split(","),
    };

    // Date range
    if (searchParams.get("dateFrom") || searchParams.get("dateTo")) {
      filters.dateRange = {
        from: searchParams.get("dateFrom") || "",
        to: searchParams.get("dateTo") || "",
      };
    }

    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

    // Search links
    const result = await msdsSkuLinkingService.searchLinks(
      tenantId,
      filters,
      page,
      pageSize,
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error searching links:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to search links",
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST /api/msds-sku-linking/links - Create link
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const rbac = getMsdsSkuLinkingRbac();
    const authRes = await requireAuth(request, {
      anyRole: rbac.writerRoles,
    });
    if (!authRes.ok) return authRes.response;
    const { tenantId, userId } = authRes.auth;

    const body = await request.json();

    // Validate required fields
    if (!body.msdsId || !body.skuId || !body.customerId) {
      return NextResponse.json(
        {
          success: false,
          error: "MSDS ID, SKU ID, and Customer ID are required",
        },
        { status: 400 },
      );
    }

    // Create link
    const link = await msdsSkuLinkingService.createLink(
      body.msdsId,
      body.skuId,
      body.customerId,
      {
        matchingStrategy: body.matchingStrategy,
        confidenceScore: body.confidenceScore,
        matchingEvidence: body.matchingEvidence,
        status: body.status,
        linkedBy: userId,
        tenantId,
        notes: body.notes,
      },
    );

    return NextResponse.json(
      {
        success: true,
        data: link,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create link",
      },
      { status: 500 },
    );
  }
}
