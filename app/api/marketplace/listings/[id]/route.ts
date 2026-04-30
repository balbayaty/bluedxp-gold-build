/**
 * Marketplace Listing Detail API
 * GET - Get listing by ID
 * PATCH - Update listing
 * DELETE - Delete listing
 */

import { NextRequest, NextResponse } from "next/server";
import { marketplaceService } from "@/lib/services/marketplace";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const listing = await marketplaceService.getListing(params.id);

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: listing,
    });
  } catch (error: any) {
    console.error("Failed to get listing:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get listing" },
      { status: 500 },
    );
  }
}

async function patchHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const updated = await marketplaceService.updateListing(params.id, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("Failed to update listing:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update listing" },
      { status: 500 },
    );
  }
}

async function deleteHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const deleted = await marketplaceService.deleteListing(params.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch (error: any) {
    console.error("Failed to delete listing:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete listing" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.listings",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const PATCH = withAPIGateway(patchHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.listings",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.listings",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
