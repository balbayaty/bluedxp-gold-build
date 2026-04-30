/**
 * Predictive Pricing API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { predictivePricingService } from "@/lib/services/marketplace/predictivePricingService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const listingId = searchParams.get("listingId");
    const category = searchParams.get("category");

    if (listingId) {
      const recommendation =
        await predictivePricingService.getPricingRecommendation(listingId);
      return NextResponse.json(recommendation);
    }

    if (category) {
      const analysis = await predictivePricingService.analyzeMarket(
        category as any,
      );
      return NextResponse.json(analysis);
    }

    return NextResponse.json(
      { error: "listingId or category is required" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Predictive pricing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get pricing recommendation" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.predictive-pricing",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
