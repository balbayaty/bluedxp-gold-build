/**
 * Intelligence Analytics Insights API
 *
 * Generate intelligent insights from unified intelligence service
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway, APIGatewayOptions } from "@/middleware/apiGateway";
import { unifiedIntelligenceService } from "@/lib/services/intelligence-analytics";

async function handler(req: NextRequest, context: any): Promise<NextResponse> {
  try {
    const body = await req.json();
    const {
      insightType,
      dataSource,
      timeRange,
      includePredictions,
      tenantId: bodyTenantId,
    } = body;
    const tenantId =
      context?.tenantId || bodyTenantId || context?.user?.tenantId;

    if (!tenantId || String(tenantId).trim().length === 0) {
      return NextResponse.json(
        { error: "tenantId is required (multi-tenant day 1)" },
        { status: 400 },
      );
    }

    const insights = await unifiedIntelligenceService.generateInsights({
      insightType: insightType || "ALL",
      dataSource: dataSource || "ALL",
      timeRange,
      includePredictions: includePredictions !== false,
      tenantId: String(tenantId),
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Intelligence Analytics Insights API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(handler, {
  moduleId: "intelligence",
  featureId: "intelligence.insights",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(handler, {
  moduleId: "intelligence",
  featureId: "intelligence.insights",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
