/**
 * Marketplace Bookings API
 * GET - Get customer bookings
 * POST - Create booking
 */

import { NextRequest, NextResponse } from "next/server";
import { marketplaceService } from "@/lib/services/marketplace";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customerId") || "customer-1"; // Mock - get from auth

    const bookings = await marketplaceService.getCustomerBookings(customerId);

    return NextResponse.json({
      success: true,
      data: bookings,
      count: bookings.length,
    });
  } catch (error: unknown) {
    logger.error("Failed to get bookings", {
      error: error instanceof Error ? error.message : String(error),
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "marketplace-bookings", action: "fetch" },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get bookings",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { customerId, customerName, serviceId, bookingDetails } = body;

    if (!customerId || !customerName || !serviceId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const booking = await marketplaceService.createBooking(
      customerId,
      customerName,
      serviceId,
      bookingDetails || {},
    );

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error: unknown) {
    logger.error("Failed to create booking", {
      error: error instanceof Error ? error.message : String(error),
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "marketplace-bookings", action: "create" },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create booking",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.bookings",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.bookings",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
