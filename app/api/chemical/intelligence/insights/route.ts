/**
 * Chemical Intelligence - Insights API
 * Generate AI-powered insights for chemicals
 */

import { NextRequest, NextResponse } from "next/server";
import { intelligentChemicalService } from "@/lib/services/chemical/intelligentChemicalService";
import { chemicalService } from "@/lib/services/chemical/chemicalService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { chemicalId } = body;

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

    // Generate insights
    const insights =
      await intelligentChemicalService.generateInsights(chemical);

    return NextResponse.json({
      success: true,
      insights,
      count: insights.length,
    });
  } catch (error: any) {
    console.error("Error generating insights:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate insights" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.intelligence.insights",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
