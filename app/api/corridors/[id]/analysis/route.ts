/**
 * Corridor Analysis API Endpoint
 *
 * GET /api/corridors/{id}/analysis - Analyze corridor
 *
 * @module api/corridors
 */

import { NextRequest, NextResponse } from "next/server";
import { corridorIntelligenceService } from "@/lib/services/corridors";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const corridorId = params.id;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const tenantId = searchParams.get("tenantId") || "default";

    if (!from || !to) {
      return NextResponse.json(
        { error: "from and to date parameters are required" },
        { status: 400 },
      );
    }

    // Analyze corridor
    const analysis = await corridorIntelligenceService.analyzeCorridor(
      corridorId,
      {
        from: new Date(from),
        to: new Date(to),
      },
      tenantId,
    );

    return NextResponse.json({
      success: true,
      data: analysis,
      message: "Corridor analysis completed successfully",
    });
  } catch (error) {
    console.error("Error analyzing corridor:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze corridor",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
