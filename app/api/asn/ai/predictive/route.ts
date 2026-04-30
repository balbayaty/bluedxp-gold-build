/**
 * ASN Predictive Analytics API
 * Get predictive analytics and risk assessments
 */

import { NextRequest, NextResponse } from "next/server";
import { asnAIService } from "@/lib/services/asn/asnAIService";

/**
 * GET /api/asn/ai/predictive
 * Get predictive analytics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const processType = searchParams.get("processType") as
      | "INBOUND"
      | "OUTBOUND"
      | null;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const filters: any = {};
    if (processType) filters.processType = processType;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    const analytics = await asnAIService.getPredictiveAnalytics(filters);

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in GET /api/asn/ai/predictive:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
