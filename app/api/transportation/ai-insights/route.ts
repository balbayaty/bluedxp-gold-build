/**
 * AI Insights API
 *
 * Get AI-powered insights and recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { transportationAIInsightsService } from "@/lib/services/transportation";
import type { AIInsightsRequest } from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";

async function handler(request: NextRequest, context: { tenantId?: string }) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );
    }

    const body: AIInsightsRequest = await request.json();

    // Validate required fields
    if (!body.shipment) {
      return NextResponse.json(
        { error: "Missing required field: shipment" },
        { status: 400 },
      );
    }

    // Generate insights
    const insights = await transportationAIInsightsService.generateInsights({
      ...(body as any),
      tenantId,
    } as any);

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return NextResponse.json(
      {
        error: "Failed to generate AI insights",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(handler, {
  featureId: "predictive",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
