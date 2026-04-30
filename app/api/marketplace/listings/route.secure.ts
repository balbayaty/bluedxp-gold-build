/**
 * Marketplace Listings API - SECURED
 * GET - Search listings (with authentication, validation, tenant isolation)
 * POST - Create listing (with authentication, validation, audit, evidence)
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway, APIRequestContext } from "@/middleware/apiGateway";
import { marketplaceService } from "@/lib/services/marketplace";
import {
  CreateListingSchema,
  SearchListingsSchema,
  validateAndSanitize,
} from "@/lib/services/marketplace/validation/schemas";
import type { MarketplaceSearchFilters } from "@/types/marketplace";

// GET - Search listings
export const GET = withAPIGateway(
  async (req: NextRequest, context: APIRequestContext) => {
    try {
      const searchParams = req.nextUrl.searchParams;

      // Build search filters from query params
      const filters: any = {
        category: searchParams.get("category") || undefined,
        providerId: searchParams.get("providerId") || undefined,
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
        availability: searchParams.get("availability") || undefined,
        limit: searchParams.get("limit")
          ? Number(searchParams.get("limit"))
          : 20,
        offset: searchParams.get("offset")
          ? Number(searchParams.get("offset"))
          : 0,
      };

      // Validate and sanitize filters
      const validatedFilters = validateAndSanitize(
        SearchListingsSchema,
        filters,
      );

      // Search listings with tenant isolation
      const listings = await marketplaceService.searchListings(
        context.tenantId, // REQUIRED - tenant isolation
        validatedFilters as MarketplaceSearchFilters,
      );

      return NextResponse.json({
        success: true,
        data: listings,
        count: listings.length,
        tenantId: context.tenantId, // Include for debugging
      });
    } catch (error: any) {
      console.error("Failed to search listings:", error);

      // Return user-friendly error
      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid search parameters",
            details: error.message,
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to search listings",
        },
        { status: 500 },
      );
    }
  },
  {
    moduleId: "marketplace",
    featureId: "service_listings",
    action: "read",
    requireAuth: true,
    rateLimit: true,
  },
);

// POST - Create listing
export const POST = withAPIGateway(
  async (req: NextRequest, context: APIRequestContext) => {
    try {
      const body = await req.json();

      // Validate and sanitize input
      const validated = validateAndSanitize(CreateListingSchema, body);

      // Extract IP and user agent for audit
      const ipAddress =
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown";
      const userAgent = req.headers.get("user-agent") || "unknown";

      // Create listing with tenant isolation
      const newListing = await marketplaceService.createListing(
        context.tenantId, // REQUIRED - tenant isolation
        context.userId, // For audit
        validated.providerId,
        validated.category,
        validated.listing,
        {
          userRole: context.user?.role,
          ipAddress,
          userAgent,
        },
      );

      return NextResponse.json(
        {
          success: true,
          data: newListing,
          message: "Listing created successfully",
        },
        { status: 201 },
      );
    } catch (error: any) {
      console.error("Failed to create listing:", error);

      // Return user-friendly error
      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid listing data",
            details: error.message,
          },
          { status: 400 },
        );
      }

      // Check for tenant validation error
      if (error.message?.includes("tenantId required")) {
        return NextResponse.json(
          {
            success: false,
            error: "Tenant context required",
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to create listing",
        },
        { status: 500 },
      );
    }
  },
  {
    moduleId: "marketplace",
    featureId: "service_listings",
    action: "write",
    requireAuth: true,
    rateLimit: true,
  },
);
