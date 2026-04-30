/**
 * BIM Marketplace Bookings API
 * GET - Get bookings for user
 * POST - Create booking
 */

import { NextRequest, NextResponse } from "next/server";
import { getBIMMarketplaceService } from "@/lib/services/facility/bim/bimMarketplaceService";
import { paymentService } from "@/lib/services/marketplace/paymentService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import type { BIMMarketplaceBooking } from "@/types/bim-marketplace";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const listingId = searchParams.get("listingId");
    const status = searchParams.get("status") as any;

    if (!userId && !listingId) {
      return NextResponse.json(
        { success: false, error: "userId or listingId is required" },
        { status: 400 },
      );
    }

    const marketplaceService = getBIMMarketplaceService();
    // getBookings requires userId and role, so get all and filter
    let bookings: any[] = [];
    if (userId) {
      bookings = await marketplaceService.getBookings(userId, "buyer");
      const providerBookings = await marketplaceService.getBookings(
        userId,
        "provider",
      );
      bookings = [...bookings, ...providerBookings];
    }

    // Filter by listingId and status if provided
    if (listingId) {
      bookings = bookings.filter((b: any) => b.listingId === listingId);
    }
    if (status) {
      bookings = bookings.filter((b: any) => b.status === status);
    }

    return NextResponse.json({
      success: true,
      data: bookings,
      count: bookings.length,
    });
  } catch (error: any) {
    console.error("Failed to get BIM bookings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get bookings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, userId, userName, booking } = body;

    if (!listingId || !userId || !userName || !booking) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: listingId, userId, userName, booking",
        },
        { status: 400 },
      );
    }

    const marketplaceService = getBIMMarketplaceService();
    const listing = await marketplaceService.getListing(listingId);

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 },
      );
    }

    // Create booking
    const newBooking = await marketplaceService.createBooking(
      listingId,
      userId,
      {
        ...booking,
        buyerName: userName,
      },
    );

    // If booking requires payment, create payment intent
    if (listing.pricing.model !== "free" && listing.pricing.amount) {
      // Use paymentService directly (already imported)
      const paymentIntent = await paymentService.createPaymentIntent(
        newBooking.id,
        listing.pricing.amount,
        "visa", // Default, can be changed
        {
          customerId: userId,
          providerId: listing.providerId,
          listingId,
          listingType: listing.type,
        },
      );

      return NextResponse.json(
        {
          success: true,
          data: newBooking,
          paymentIntent,
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newBooking,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to create BIM booking", err, {
      module: "bim",
      service: "marketplace",
    });
    errorTrackingService.captureException(err, {
      module: "bim",
      service: "marketplace",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create booking" },
      { status: 500 },
    );
  }
}
