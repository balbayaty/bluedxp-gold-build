/**
 * Map Regulation to Obligations API
 * POST /api/obligations/map/regulation
 */

import { NextRequest, NextResponse } from "next/server";
import { obligationMappingEngine } from "@/lib/services/obligations/obligationMappingEngine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regulationId, tenantId } = body;

    if (!regulationId) {
      return NextResponse.json(
        {
          success: false,
          error: "regulationId is required",
        },
        { status: 400 },
      );
    }

    const result = await obligationMappingEngine.mapRegulationToObligations(
      regulationId,
      tenantId || "default",
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error mapping regulation to obligations:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
