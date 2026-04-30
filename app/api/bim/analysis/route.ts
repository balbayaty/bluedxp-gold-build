/**
 * BIM AI Analysis API
 * POST - Run various types of AI analysis on BIM models
 */

import { NextRequest, NextResponse } from "next/server";
import { getBIMAIAnalysisService } from "@/lib/services/facility/bim/bimAIAnalysisService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, analysisType, options } = body;

    if (!modelId || !analysisType) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: modelId and analysisType",
        },
        { status: 400 },
      );
    }

    const analysisService = getBIMAIAnalysisService();
    let analysis;

    switch (analysisType) {
      case "clash-detection":
        analysis = await analysisService.runClashDetection(
          modelId,
          options || {},
        );
        break;
      case "code-compliance":
        analysis = await analysisService.runCodeCompliance(
          modelId,
          options || {},
        );
        break;
      case "sustainability":
        analysis = await analysisService.runSustainabilityAnalysis(
          modelId,
          options || {},
        );
        break;
      case "cost-estimation":
        analysis = await analysisService.runCostEstimation(
          modelId,
          options || {},
        );
        break;
      case "safety-analysis":
        // Use code compliance for safety analysis (similar functionality)
        analysis = await analysisService.runCodeCompliance(modelId, {
          ...options,
          focus: "safety",
        });
        break;
      case "optimization":
        // Use sustainability analysis for optimization (similar functionality)
        analysis = await analysisService.runSustainabilityAnalysis(modelId, {
          ...options,
          focus: "optimization",
        });
        break;
      case "generative-design":
        // Use clash detection as base for generative design suggestions
        analysis = await analysisService.runClashDetection(modelId, {
          ...options,
          focus: "design",
        });
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Invalid analysis type: ${analysisType}` },
          { status: 400 },
        );
    }

    return NextResponse.json(
      {
        success: true,
        data: analysis,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to run BIM analysis", err, {
      module: "bim",
      service: "analysis",
    });
    errorTrackingService.captureException(err, {
      module: "bim",
      service: "analysis",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to run analysis" },
      { status: 500 },
    );
  }
}
