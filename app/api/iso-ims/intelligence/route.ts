/**
 * Intelligence Service API
 *
 * Provides AI-powered intelligence features:
 * - Root cause analysis
 * - Pattern detection
 * - Predictive analytics
 * - Smart recommendations
 * - Anomaly detection
 */

import { NextRequest, NextResponse } from "next/server";
import { intelligenceService } from "@/lib/services/iso-ims";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    const tenantId = context.tenantId;

    switch (action) {
      case "root-cause-analysis": {
        const { description, context: analysisContext } = params;
        const analysis = await intelligenceService.performRootCauseAnalysis(
          description,
          analysisContext,
        );
        return NextResponse.json(analysis);
      }

      case "detect-patterns": {
        const { entityType, filters } = params;
        const patterns = await intelligenceService.detectPatterns(
          tenantId,
          entityType,
          filters,
        );
        return NextResponse.json(patterns);
      }

      case "predict-compliance": {
        const { timeframe, customerId, warehouseId } = params;
        const predictions = await intelligenceService.predictComplianceScore(
          tenantId,
          timeframe || "30D",
          customerId,
          warehouseId,
        );
        return NextResponse.json(predictions);
      }

      case "predict-risks": {
        const { customerId, warehouseId } = params;
        const predictions = await intelligenceService.predictRisks(
          tenantId,
          customerId,
          warehouseId,
        );
        return NextResponse.json(predictions);
      }

      case "generate-recommendations": {
        const { context: recContext } = params;
        const recommendations =
          await intelligenceService.generateRecommendations(
            tenantId,
            recContext,
          );
        return NextResponse.json(recommendations);
      }

      case "detect-anomalies": {
        const { metricType, timeframe } = params;
        const anomalies = await intelligenceService.detectAnomalies(
          tenantId,
          metricType,
          timeframe,
        );
        return NextResponse.json(anomalies);
      }

      case "forecast-trends": {
        const { metricType, days } = params;
        const forecast = await intelligenceService.forecastTrends(
          tenantId,
          metricType,
          days || 30,
        );
        return NextResponse.json(forecast);
      }

      case "health-score": {
        const { customerId, warehouseId } = params;
        const health = await intelligenceService.getComplianceHealthScore(
          tenantId,
          customerId,
          warehouseId,
        );
        return NextResponse.json(health);
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in intelligence API:", error);
    return NextResponse.json(
      { error: "Failed to process intelligence request" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.intelligence",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
