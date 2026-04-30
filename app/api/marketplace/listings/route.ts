/**
 * Marketplace Listings API
 * GET - Search listings
 * POST - Create listing
 */

import { NextRequest, NextResponse } from "next/server";
import { marketplaceService } from "@/lib/services/marketplace";
import type { MarketplaceSearchFilters } from "@/types/marketplace";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: MarketplaceSearchFilters = {
      category: (searchParams.get("category") as any) || undefined,
      location: {
        city: searchParams.get("city") || undefined,
        country: searchParams.get("country") || undefined,
      },
      priceRange:
        searchParams.get("minPrice") || searchParams.get("maxPrice")
          ? {
              min: searchParams.get("minPrice")
                ? Number(searchParams.get("minPrice"))
                : undefined,
              max: searchParams.get("maxPrice")
                ? Number(searchParams.get("maxPrice"))
                : undefined,
              currency: searchParams.get("currency") || "SAR",
            }
          : undefined,
      rating: searchParams.get("minRating")
        ? {
            min: Number(searchParams.get("minRating")),
          }
        : undefined,
      availability: (searchParams.get("availability") as any) || undefined,
    };

    const listings = await marketplaceService.searchListings(filters);

    return NextResponse.json({
      success: true,
      data: listings,
      count: listings.length,
    });
  } catch (error: any) {
    console.error("Failed to search listings:", error);
    // Return empty results instead of 500 for better UX
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      message: "No listings available",
    });
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { providerId, category, listing } = body;

    if (!providerId || !category || !listing) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const newListing = await marketplaceService.createListing(
      providerId,
      category,
      listing,
    );

    return NextResponse.json({
      success: true,
      data: newListing,
    });
  } catch (error: any) {
    console.error("Failed to create listing:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create listing" },
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

export const POST = withAPIGateway(postHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.listings",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
