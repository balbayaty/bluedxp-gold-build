/**
 * Bottleneck Analysis API Route
 *
 * API endpoint for bottleneck analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { bottleneckAnalysisService } from "@/lib/services/analytics";
import type { TouchpointAnalysis, OperatingHours } from "@/types/analytics";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { touchpoints, shipments, operatingHours } = body;

    if (!touchpoints || !Array.isArray(touchpoints)) {
      return NextResponse.json(
        { error: "Touchpoints array required" },
        { status: 400 },
      );
    }

    const analysis = await bottleneckAnalysisService.analyzeBottlenecks(
      touchpoints as TouchpointAnalysis[],
      shipments,
      operatingHours as OperatingHours[] | undefined,
    );

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Bottleneck analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 },
    );
  }
}
