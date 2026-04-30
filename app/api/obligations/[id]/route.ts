/**
 * Obligation Details API Routes
 *
 * GET /api/obligations/[id] - Get obligation by ID
 * PATCH /api/obligations/[id] - Update obligation
 * DELETE /api/obligations/[id] - Delete obligation (mark as cancelled)
 */

import { NextRequest, NextResponse } from "next/server";
import { obligationMappingEngine } from "@/lib/services/obligations/obligationMappingEngine";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";

    const obligation = await obligationMappingEngine.getObligation(
      id,
      tenantId,
    );

    if (!obligation) {
      return NextResponse.json(
        {
          success: false,
          error: "Obligation not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: obligation,
    });
  } catch (error) {
    console.error("Error fetching obligation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();
    const tenantId = body.tenantId || "default";

    const obligation = await obligationMappingEngine.updateObligation(
      id,
      body,
      tenantId,
    );

    return NextResponse.json({
      success: true,
      data: obligation,
    });
  } catch (error) {
    console.error("Error updating obligation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";

    // Mark as cancelled rather than delete
    const obligation = await obligationMappingEngine.updateObligationStatus(
      id,
      "CANCELLED",
      "Cancelled via API",
      tenantId,
    );

    return NextResponse.json({
      success: true,
      data: obligation,
    });
  } catch (error) {
    console.error("Error deleting obligation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
