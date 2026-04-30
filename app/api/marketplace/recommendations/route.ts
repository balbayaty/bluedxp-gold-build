/**
 * Marketplace Recommendations API
 * AI-powered personalized recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { marketplaceRecommendationService } from "@/lib/services/marketplace/marketplaceRecommendationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "default-user";
    const providerId = searchParams.get("providerId");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (providerId) {
      const recommendations =
        await marketplaceRecommendationService.getProviderRecommendations(
          providerId,
        );
      return NextResponse.json({
        success: true,
        data: { recommendations },
        count: recommendations.length,
      });
    }

    const personalized =
      await marketplaceRecommendationService.getCustomerRecommendations(
        userId,
        limit,
      );
    return NextResponse.json({
      success: true,
      data: personalized,
    });
  } catch (error: any) {
    console.error("Failed to get recommendations:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get recommendations",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.recommendations",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
