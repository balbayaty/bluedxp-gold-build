/**
 * BIM Marketplace Listings API
 * GET - Search listings
 * POST - Create listing
 */

import { NextRequest, NextResponse } from "next/server";
import { getBIMMarketplaceService } from "@/lib/services/facility/bim/bimMarketplaceService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import type { BIMMarketplaceSearchFilters } from "@/types/bim-marketplace";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: BIMMarketplaceSearchFilters = {
      query: searchParams.get("query") || undefined,
      type: (searchParams.get("type") as any) || undefined,
      category: (searchParams.get("category") as any) || undefined,
      location: searchParams.get("location")
        ? {
            country: searchParams.get("country") || undefined,
            region: searchParams.get("region") || undefined,
            city: searchParams.get("city") || undefined,
          }
        : undefined,
      priceRange:
        searchParams.get("minPrice") || searchParams.get("maxPrice")
          ? {
              min: searchParams.get("minPrice")
                ? Number(searchParams.get("minPrice"))
                : undefined,
              max: searchParams.get("maxPrice")
                ? Number(searchParams.get("maxPrice"))
                : undefined,
              currency: searchParams.get("currency") || "USD",
            }
          : undefined,
      rating: searchParams.get("minRating")
        ? {
            min: Number(searchParams.get("minRating")),
          }
        : undefined,
      tags: searchParams.get("tags")
        ? searchParams.get("tags")!.split(",")
        : undefined,
      compatibleSoftware: searchParams.get("software")
        ? searchParams.get("software")!.split(",")
        : undefined,
      featured: searchParams.get("featured") === "true" ? true : undefined,
      verified: searchParams.get("verified") === "true" ? true : undefined,
      sortBy: (searchParams.get("sortBy") as any) || "relevance",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    };

    const marketplaceService = getBIMMarketplaceService();
    const result = await marketplaceService.searchListings(filters);

    return NextResponse.json({
      success: true,
      data: result.listings,
      facets: result.facets,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: result.listings.length,
        totalPages: Math.ceil(result.listings.length / (filters.limit || 20)),
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to search BIM listings", err, {
      module: "bim",
      service: "marketplace",
    });
    errorTrackingService.captureException(err, {
      module: "bim",
      service: "marketplace",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to search listings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, listing } = body;

    if (!providerId || !listing) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: providerId and listing",
        },
        { status: 400 },
      );
    }

    const marketplaceService = getBIMMarketplaceService();
    const newListing = await marketplaceService.createListing(
      providerId,
      listing,
    );

    return NextResponse.json(
      {
        success: true,
        data: newListing,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to create BIM listing", err, {
      module: "bim",
      service: "marketplace",
    });
    errorTrackingService.captureException(err, {
      module: "bim",
      service: "marketplace",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create listing" },
      { status: 500 },
    );
  }
}
