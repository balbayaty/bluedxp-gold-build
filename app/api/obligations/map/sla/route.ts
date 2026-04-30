/**
 * Map SLA to Obligations API
 * POST /api/obligations/map/sla
 */

import { NextRequest, NextResponse } from "next/server";
import { obligationMappingEngine } from "@/lib/services/obligations/obligationMappingEngine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slaId, tenantId } = body;

    if (!slaId) {
      return NextResponse.json(
        {
          success: false,
          error: "slaId is required",
        },
        { status: 400 },
      );
    }

    const result = await obligationMappingEngine.mapSLAToObligations(
      slaId,
      tenantId || "default",
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error mapping SLA to obligations:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
