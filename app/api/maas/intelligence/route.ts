/**
 * MaaS Intelligence API Route
 * GET /api/maas/intelligence - Get comprehensive AI-powered intelligence
 *
 * Returns:
 * - Predictive insights
 * - Recommendations
 * - Anomaly detection
 * - Revenue forecasts
 * - Risk assessments
 * - Cross-module insights
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway, APIGatewayOptions } from "@/middleware/apiGateway";
import { maasIntelligenceService } from "@/lib/services/maas/intelligenceService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

async function handler(req: NextRequest, context: any): Promise<NextResponse> {
  const tenantId = context.tenantId || "default-tenant";

  try {
    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      const filterType = searchParams.get("type"); // insights, predictions, recommendations, etc.
      const pillar = searchParams.get("pillar");
      const timeframe = searchParams.get("timeframe") as
        | "7d"
        | "30d"
        | "90d"
        | "1y"
        | undefined;

      // Get comprehensive intelligence
      const intelligence =
        await maasIntelligenceService.getIntelligence(tenantId);

      // Filter if requested
      let response = intelligence;
      if (filterType) {
        switch (filterType) {
          case "insights":
            response = { ...intelligence, insights: intelligence.insights };
            break;
          case "predictions":
            response = {
              ...intelligence,
              predictions: intelligence.predictions,
            };
            break;
          case "recommendations":
            response = {
              ...intelligence,
              recommendations: intelligence.recommendations,
            };
            break;
          case "anomalies":
            response = { ...intelligence, anomalies: intelligence.anomalies };
            break;
          case "risks":
            response = {
              ...intelligence,
              riskAssessment: intelligence.riskAssessment,
            };
            break;
        }
      }

      // Filter by pillar if requested
      if (pillar) {
        const filterByPillar = (items: any[]) =>
          items.filter((item) => item.pillar === pillar);

        if (response.insights) {
          response.insights = filterByPillar(response.insights);
        }
        if (response.predictions) {
          response.predictions = filterByPillar(response.predictions);
        }
        if (response.recommendations) {
          response.recommendations = filterByPillar(response.recommendations);
        }
        if (response.anomalies) {
          response.anomalies = filterByPillar(response.anomalies);
        }
      }

      return NextResponse.json({
        success: true,
        intelligence: response,
        metadata: {
          generatedAt: new Date().toISOString(),
          tenantId,
          filters: { type: filterType, pillar, timeframe },
        },
      });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("MaaS Intelligence API error", err, {
      module: "maas",
      service: "intelligence",
      tenantId,
    });
    errorTrackingService.captureException(err, {
      module: "maas",
      service: "intelligence",
      tenantId,
    });
    return NextResponse.json(
      { error: err.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(handler, {
  requireAuth: true,
  rateLimit: { requests: 100, window: "1m" },
} as APIGatewayOptions);
