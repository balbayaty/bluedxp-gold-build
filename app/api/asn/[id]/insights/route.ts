/**
 * ASN AI Insights API
 * Get AI-powered insights, predictions, and recommendations for ASN
 */

import { NextRequest, NextResponse } from "next/server";
import { asnAIService } from "@/lib/services/asn/asnAIService";

/**
 * GET /api/asn/[id]/insights
 * Get AI insights for ASN
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const insights = await asnAIService.getASNInsights(params.id);

    return NextResponse.json({
      success: true,
      data: insights,
      count: insights.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in GET /api/asn/[id]/insights:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
