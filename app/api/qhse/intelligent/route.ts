/**
 * Intelligent QHSE API Route
 * AI-powered risk prediction, anomaly detection, and recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { intelligentQHSEService } from "@/lib/services/qhse/intelligentQHSEService";
import { withAPIGateway } from "@/middleware/apiGateway";

async function handler(request: NextRequest, context: { tenantId?: string }) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "all"; // 'insights' | 'risks' | 'recommendations' | 'all'
    const tenantId = context?.tenantId;
    const customerId = searchParams.get("customerId");
    const facilityId = searchParams.get("facilityId");
    const warehouseId = searchParams.get("warehouseId");
    const timeframe = searchParams.get("timeframe") || "MONTH";

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    const params = {
      tenantId,
      customerId: customerId || undefined,
      facilityId: facilityId || undefined,
      warehouseId: warehouseId || undefined,
      timeframe: timeframe as "MONTH" | "QUARTER" | "YEAR",
    };

    switch (type) {
      case "insights":
        const insights = await intelligentQHSEService.getInsights(params);
        return NextResponse.json({ success: true, data: insights });
      case "risks":
        const risks = await intelligentQHSEService.getSafetyRisks(params);
        return NextResponse.json({ success: true, data: risks });
      case "recommendations":
        const recommendations =
          await intelligentQHSEService.getComplianceRecommendations(params);
        return NextResponse.json({ success: true, data: recommendations });
      case "all":
        // Return all intelligent data
        const [allInsights, allRisks, allRecommendations] = await Promise.all([
          intelligentQHSEService.getInsights(params),
          intelligentQHSEService.getSafetyRisks(params),
          intelligentQHSEService.getComplianceRecommendations(params),
        ]);
        return NextResponse.json({
          success: true,
          data: {
            insights: allInsights,
            risks: allRisks.length > 0 ? allRisks[0] : null, // Get highest risk
            recommendations: allRecommendations,
            anomalies: allInsights.filter((i) => i.insightType === "ANOMALY"),
            benchmarks: [], // Would come from benchmark service
          },
        });
      default:
        return NextResponse.json(
          { success: false, error: "Invalid intelligent QHSE type" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error in intelligent QHSE API:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get intelligent insights",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(handler, {
  moduleId: "qhse",
  featureId: "qhse.intelligent",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
