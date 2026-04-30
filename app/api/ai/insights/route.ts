/**
 * AI Predictive Insights API Route
 * Generate and retrieve AI-powered insights
 */

import { NextRequest, NextResponse } from "next/server";
import { predictiveInsightsService } from "@/lib/services/ai/predictiveInsightsService";

// GET - Get insights, anomalies, or correlations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "insights";
    const moduleId = searchParams.get("moduleId") || undefined;
    const severity = (searchParams.get("severity") as any) || undefined;
    const status = (searchParams.get("status") as any) || undefined;

    if (type === "insights") {
      const entityType = searchParams.get("entityType") || undefined;
      const insights = await predictiveInsightsService.getInsights(
        moduleId,
        entityType,
      );
      return NextResponse.json({
        success: true,
        data: insights,
        count: insights.length,
      });
    }

    if (type === "anomalies") {
      const anomalies = await predictiveInsightsService.getAnomalies(
        moduleId,
        severity,
        status,
      );
      return NextResponse.json({
        success: true,
        data: anomalies,
        count: anomalies.length,
      });
    }

    if (type === "correlations") {
      const targetModule = searchParams.get("targetModule") || undefined;
      const correlations = await predictiveInsightsService.getCorrelations(
        moduleId,
        targetModule,
      );
      return NextResponse.json({
        success: true,
        data: correlations,
        count: correlations.length,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid type. Use: insights, anomalies, or correlations",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch insights",
      },
      { status: 500 },
    );
  }
}

// POST - Generate insights
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || "generate-insights";

    if (action === "generate-insights") {
      if (!body.moduleId || !body.entityType || !body.data) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required fields: moduleId, entityType, data",
          },
          { status: 400 },
        );
      }

      const insights =
        await predictiveInsightsService.generatePredictiveInsights(
          body.moduleId,
          body.entityType,
          body.data,
        );

      return NextResponse.json(
        { success: true, data: insights, count: insights.length },
        { status: 201 },
      );
    }

    if (action === "detect-anomalies") {
      if (
        !body.moduleId ||
        !body.entityType ||
        !body.entityId ||
        !body.metrics
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Missing required fields: moduleId, entityType, entityId, metrics",
          },
          { status: 400 },
        );
      }

      const anomalies = await predictiveInsightsService.detectAnomalies(
        body.moduleId,
        body.entityType,
        body.entityId,
        body.metrics,
      );

      return NextResponse.json(
        { success: true, data: anomalies, count: anomalies.length },
        { status: 201 },
      );
    }

    if (action === "find-correlations") {
      if (!body.sourceModule || !body.targetModule || !body.events) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Missing required fields: sourceModule, targetModule, events",
          },
          { status: 400 },
        );
      }

      const correlations =
        await predictiveInsightsService.findCrossModuleCorrelations(
          body.sourceModule,
          body.targetModule,
          body.events,
        );

      return NextResponse.json(
        { success: true, data: correlations, count: correlations.length },
        { status: 201 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in AI insights operation:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to perform operation",
      },
      { status: 500 },
    );
  }
}
