/**
 * Chemical Intelligence - Recommendations API
 * Get AI-powered recommendations for chemicals
 */

import { NextRequest, NextResponse } from "next/server";
import { intelligentChemicalService } from "@/lib/services/chemical/intelligentChemicalService";
import { chemicalService } from "@/lib/services/chemical/chemicalService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { chemicalId, type } = body;

    if (!chemicalId) {
      return NextResponse.json(
        { success: false, error: "Chemical ID is required" },
        { status: 400 },
      );
    }

    // Get chemical
    const chemical = await chemicalService.getChemicalById(chemicalId);
    if (!chemical) {
      return NextResponse.json(
        { success: false, error: "Chemical not found" },
        { status: 404 },
      );
    }

    // Get recommendations based on type
    let recommendations: any[] = [];

    if (type === "storage") {
      recommendations =
        await intelligentChemicalService.getStorageRecommendations(chemical);
    } else if (type === "handling") {
      recommendations =
        await intelligentChemicalService.getHandlingRecommendations(chemical);
    } else {
      // Default: get all recommendations
      const insights =
        await intelligentChemicalService.generateInsights(chemical);
      recommendations = insights.filter(
        (i: any) => i.type === "recommendation",
      );
    }

    return NextResponse.json({
      success: true,
      recommendations,
      count: recommendations.length,
    });
  } catch (error: any) {
    console.error("Error getting recommendations:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get recommendations",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.intelligence.recommendations",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
