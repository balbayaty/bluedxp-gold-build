/**
 * Marketplace Sustainability API
 * Carbon footprint, ESG metrics, sustainability features
 */

import { NextRequest, NextResponse } from "next/server";
import { sustainabilityService } from "@/lib/services/marketplace/sustainabilityService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get("providerId");
    const bookingId = searchParams.get("bookingId");
    const action = searchParams.get("action");

    if (action === "leaderboard") {
      const limit = parseInt(searchParams.get("limit") || "10");
      const leaderboard =
        await sustainabilityService.getSustainabilityLeaderboard(limit);
      return NextResponse.json({
        success: true,
        data: { leaderboard },
        count: leaderboard.length,
      });
    }

    if (providerId) {
      const metrics =
        await sustainabilityService.getSustainabilityMetrics(providerId);
      return NextResponse.json({ success: true, data: metrics });
    }

    if (bookingId) {
      // Calculate carbon footprint for booking
      const category = searchParams.get("category") || "STORAGE";
      const distance = searchParams.get("distance")
        ? parseFloat(searchParams.get("distance")!)
        : undefined;
      const duration = searchParams.get("duration")
        ? parseFloat(searchParams.get("duration")!)
        : undefined;

      const co2 = await sustainabilityService.calculateCarbonFootprint(
        bookingId,
        category,
        distance,
        duration,
      );
      return NextResponse.json({
        success: true,
        data: { co2, unit: "kg CO2" },
      });
    }

    return NextResponse.json(
      { success: false, error: "providerId, bookingId, or action required" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Failed to get sustainability data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get sustainability data",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const {
      action,
      providerId,
      bookingId,
      updates,
      co2Amount,
      offsetMethod,
      certification,
    } = body;

    switch (action) {
      case "update_metrics":
        if (!providerId || !updates) {
          return NextResponse.json(
            { success: false, error: "providerId and updates are required" },
            { status: 400 },
          );
        }
        const metrics = await sustainabilityService.updateSustainabilityMetrics(
          providerId,
          updates,
        );
        return NextResponse.json({ success: true, data: metrics });

      case "create_offset":
        if (!bookingId || !providerId || !co2Amount) {
          return NextResponse.json(
            {
              success: false,
              error: "bookingId, providerId, and co2Amount are required",
            },
            { status: 400 },
          );
        }
        const offset = await sustainabilityService.createCarbonOffset(
          bookingId,
          providerId,
          co2Amount,
          offsetMethod,
        );
        return NextResponse.json({ success: true, data: offset });

      case "add_certification":
        if (!providerId || !certification) {
          return NextResponse.json(
            {
              success: false,
              error: "providerId and certification are required",
            },
            { status: 400 },
          );
        }
        const updatedMetrics = await sustainabilityService.addCertification(
          providerId,
          certification,
        );
        return NextResponse.json({ success: true, data: updatedMetrics });

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error: any) {
    console.error("Failed to process sustainability action:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process sustainability action",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.sustainability",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.sustainability",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
