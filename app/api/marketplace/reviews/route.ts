/**
 * Marketplace Reviews API
 * POST - Add review
 */

import { NextRequest, NextResponse } from "next/server";
import { marketplaceService } from "@/lib/services/marketplace";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const {
      bookingId,
      serviceId,
      providerId,
      customerId,
      customerName,
      rating,
      review,
      categories,
    } = body;

    if (!bookingId || !serviceId || !providerId || !customerId || !rating) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const newReview = await marketplaceService.addReview({
      bookingId,
      serviceId,
      providerId,
      customerId,
      customerName: customerName || "Anonymous",
      rating,
      review: review || "",
      categories: categories || {
        quality: rating,
        timeliness: rating,
        communication: rating,
        value: rating,
      },
    });

    return NextResponse.json({
      success: true,
      data: newReview,
    });
  } catch (error: any) {
    console.error("Failed to add review:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add review" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.reviews",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
