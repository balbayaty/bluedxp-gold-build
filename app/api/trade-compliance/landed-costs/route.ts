/**
 * Landed Costs API
 * GET: Calculate landed costs for a record
 */

import { NextRequest, NextResponse } from "next/server";
import { tradeComplianceService } from "@/lib/services/trade-compliance/tradeComplianceService";
import { calculateLandedCost } from "@/lib/services/trade-compliance/landedCostService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const recordId = searchParams.get("recordId");

    if (!recordId) {
      return NextResponse.json(
        { success: false, error: "Record ID is required" },
        { status: 400 },
      );
    }

    // Get the record
    const record = tradeComplianceService.getRecord(recordId);

    if (!record) {
      return NextResponse.json(
        { success: false, error: "Record not found" },
        { status: 404 },
      );
    }

    // Calculate landed cost
    const breakdown = await calculateLandedCost(record);

    return NextResponse.json({
      success: true,
      breakdown,
    });
  } catch (error) {
    console.error("Error calculating landed cost:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate landed cost" },
      { status: 500 },
    );
  }
}
