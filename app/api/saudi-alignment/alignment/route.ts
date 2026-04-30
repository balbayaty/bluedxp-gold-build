/**
 * Saudi Alignment API Endpoint
 *
 * GET /api/saudi-alignment/alignment - Get comprehensive alignment
 *
 * @module api/saudi-alignment
 */

import { NextRequest, NextResponse } from "next/server";
import { saudiAlignmentService } from "@/lib/services/saudi-alignment";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType");

    if (!entityId || !entityType) {
      return NextResponse.json(
        { error: "entityId and entityType are required" },
        { status: 400 },
      );
    }

    // Get comprehensive alignment
    const alignment = await saudiAlignmentService.getComprehensiveAlignment(
      entityId,
      entityType,
    );

    return NextResponse.json({
      success: true,
      data: alignment,
      message: "Saudi alignment calculated successfully",
    });
  } catch (error) {
    console.error("Error calculating Saudi alignment:", error);
    return NextResponse.json(
      {
        error: "Failed to calculate Saudi alignment",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
