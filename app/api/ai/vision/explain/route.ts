/**
 * Explainable Vision API
 * Provides transparent decision-making explanations
 */

import { NextRequest, NextResponse } from "next/server";
import { explainableVisionService } from "@/lib/services/ai/vision/explainableVisionService";
import { visionDatabaseService } from "@/lib/services/ai/vision/visionDatabaseService";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { logger } from "@/lib/services/observability/logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get("analysisId");
    const tenantId = request.headers.get("x-tenant-id") || undefined;

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: "analysisId is required" },
        { status: 400 },
      );
    }

    // Get analysis from database
    const analysis = await visionDatabaseService.getAnalysisByAnalysisId(
      analysisId,
      tenantId,
    );

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 },
      );
    }

    // Generate explainable analysis
    const explainable = await explainableVisionService.explainAnalysis(
      analysis.analysis,
    );

    return NextResponse.json({
      success: true,
      explainable,
      analysisId,
    });
  } catch (error) {
    logger.error(
      "Explainable vision API error",
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "ai-vision",
        service: "explainable",
      },
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const { analysis } = body;

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis data is required" },
        { status: 400 },
      );
    }

    // Generate explainable analysis from provided data
    const explainable =
      await explainableVisionService.explainAnalysis(analysis);

    return NextResponse.json({
      success: true,
      explainable,
    });
  } catch (error) {
    logger.error(
      "Explainable vision API error",
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "ai-vision",
        service: "explainable",
      },
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
