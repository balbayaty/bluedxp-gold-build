/**
 * Quantum State History API Endpoint
 *
 * GET /api/shipments/{id}/quantum-state/history - Get collapse history
 *
 * @module api/shipments/quantum-state/history
 */

import { NextRequest, NextResponse } from "next/server";
import { schrodingersTruckService } from "@/lib/services/schrodingers-truck";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const shipmentId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const fromDate = searchParams.get("fromDate")
      ? new Date(searchParams.get("fromDate")!)
      : undefined;
    const toDate = searchParams.get("toDate")
      ? new Date(searchParams.get("toDate")!)
      : undefined;

    if (!shipmentId) {
      return NextResponse.json(
        { error: "Shipment ID is required" },
        { status: 400 },
      );
    }

    // Get collapse history
    const collapseHistory = await schrodingersTruckService.getCollapseHistory(
      shipmentId,
      limit,
    );

    // Get state history (time series)
    const stateHistory = await schrodingersTruckService.getStateHistory(
      shipmentId,
      fromDate,
      toDate,
    );

    return NextResponse.json({
      success: true,
      data: {
        collapseHistory,
        stateHistory,
        totalCollapses: collapseHistory.length,
        totalStates: stateHistory.length,
      },
    });
  } catch (error) {
    console.error("Error getting quantum state history:", error);
    return NextResponse.json(
      {
        error: "Failed to get quantum state history",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
