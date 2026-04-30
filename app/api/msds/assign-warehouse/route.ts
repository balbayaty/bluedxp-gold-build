/**
 * API Route: Assign Warehouse to MSDS Submission
 * Saves warehouse assignment for an MSDS submission
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      submissionId,
      warehouseId,
      warehouseName,
      warehouseCode,
      areaId,
      recommendation,
    } = body;

    if (!submissionId || !warehouseId) {
      return NextResponse.json(
        { success: false, error: "submissionId and warehouseId are required" },
        { status: 400 },
      );
    }

    // TODO: In production, this would:
    // 1. Save to database (MSDS submission record)
    // 2. Update ERPNext if integrated
    // 3. Create warehouse assignment record
    // 4. Log the assignment

    // For now, we'll just return success
    // The assignment will be stored in the submission state on the client side

    console.log(
      `✅ Warehouse assigned: ${warehouseId} to MSDS submission: ${submissionId}`,
    );

    return NextResponse.json({
      success: true,
      message: "Warehouse assigned successfully",
      data: {
        submissionId,
        warehouseId,
        warehouseName,
        warehouseCode,
        areaId,
        assignedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error assigning warehouse:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to assign warehouse",
      },
      { status: 500 },
    );
  }
}
