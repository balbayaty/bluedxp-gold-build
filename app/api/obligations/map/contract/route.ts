/**
 * Map Contract to Obligations API
 * POST /api/obligations/map/contract
 */

import { NextRequest, NextResponse } from "next/server";
import { obligationMappingEngine } from "@/lib/services/obligations/obligationMappingEngine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId, tenantId } = body;

    if (!contractId) {
      return NextResponse.json(
        {
          success: false,
          error: "contractId is required",
        },
        { status: 400 },
      );
    }

    const result = await obligationMappingEngine.mapContractToObligations(
      contractId,
      tenantId || "default",
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error mapping contract to obligations:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
