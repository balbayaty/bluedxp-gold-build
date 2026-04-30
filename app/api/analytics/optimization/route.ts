/**
 * Optimization Center API Route
 *
 * API endpoint for optimization calculations
 */

import { NextRequest, NextResponse } from "next/server";
import { optimizationCenterService } from "@/lib/services/analytics";
import type {
  TouchpointAnalysis,
  OptimizationLevels,
  JourneySummary,
  SustainabilityMetrics,
  AssetUtilization,
  CommercialModel,
} from "@/types/analytics";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      touchpoints,
      optimizationLevels,
      journeySummary,
      sustainabilityMetrics,
      assetUtilization,
      commercialModels,
      implementationCost,
    } = body;

    if (!touchpoints || !optimizationLevels || !journeySummary) {
      return NextResponse.json(
        {
          error: "Touchpoints, optimizationLevels, and journeySummary required",
        },
        { status: 400 },
      );
    }

    const results = optimizationCenterService.calculateOptimizedValues(
      touchpoints as TouchpointAnalysis[],
      optimizationLevels as OptimizationLevels,
      journeySummary as JourneySummary,
      (sustainabilityMetrics || []) as SustainabilityMetrics[],
      (assetUtilization || []) as AssetUtilization[],
      (commercialModels || []) as CommercialModel[],
    );

    const roi = optimizationCenterService.calculateROI(
      results,
      (commercialModels || []) as CommercialModel[],
      implementationCost || 150000,
    );

    await optimizationCenterService.publishOptimizationEvent(results, roi);

    return NextResponse.json({ results, roi });
  } catch (error) {
    console.error("Optimization calculation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Calculation failed" },
      { status: 500 },
    );
  }
}
