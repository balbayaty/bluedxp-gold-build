/**
 * Marketplace Booking Detail API
 * GET - Get booking by ID
 * PATCH - Update booking status
 */

import { NextRequest, NextResponse } from "next/server";
import { marketplaceService } from "@/lib/services/marketplace";
import type { BookingStatus } from "@/types/marketplace";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const booking = await marketplaceService.getBooking(params.id);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    console.error("Failed to get booking:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get booking" },
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
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 },
      );
    }

    const updated = await marketplaceService.updateBookingStatus(
      params.id,
      status as BookingStatus,
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("Failed to update booking:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update booking" },
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

export const PATCH = withAPIGateway(patchHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.bookings",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
