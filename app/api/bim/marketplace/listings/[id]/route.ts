/**
 * BIM Marketplace Listing Detail API
 * GET - Get listing by ID
 * PATCH - Update listing
 * DELETE - Delete listing
 */

import { NextRequest, NextResponse } from "next/server";
import { getBIMMarketplaceService } from "@/lib/services/facility/bim/bimMarketplaceService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Listing ID is required" },
        { status: 400 },
      );
    }

    const marketplaceService = getBIMMarketplaceService();
    const listing = await marketplaceService.getListing(id);

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 },
      );
    }

    // Increment view count
    await marketplaceService.updateListing(id, {
      viewCount: listing.viewCount + 1,
    });

    return NextResponse.json({
      success: true,
      data: listing,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to get BIM listing", err, {
      module: "bim",
      service: "marketplace",
    });
    errorTrackingService.captureException(err, {
      module: "bim",
      service: "marketplace",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to get listing" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Listing ID is required" },
        { status: 400 },
      );
    }

    const marketplaceService = getBIMMarketplaceService();
    const updatedListing = await marketplaceService.updateListing(id, body);

    return NextResponse.json({
      success: true,
      data: updatedListing,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to update BIM listing", err, {
      module: "bim",
      service: "marketplace",
    });
    errorTrackingService.captureException(err, {
      module: "bim",
      service: "marketplace",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update listing" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Listing ID is required" },
        { status: 400 },
      );
    }

    const marketplaceService = getBIMMarketplaceService();
    await marketplaceService.updateListing(id, {
      status: "archived",
    });

    return NextResponse.json({
      success: true,
      message: "Listing archived successfully",
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to delete BIM listing", err, {
      module: "bim",
      service: "marketplace",
    });
    errorTrackingService.captureException(err, {
      module: "bim",
      service: "marketplace",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete listing" },
      { status: 500 },
    );
  }
}
