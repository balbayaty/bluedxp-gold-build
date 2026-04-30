/**
 * Intervention History API Endpoint
 *
 * GET /api/shipments/{id}/psychology/interventions - Get intervention history
 *
 * @module api/shipments/psychology/interventions
 */

import { NextRequest, NextResponse } from "next/server";
import { cargoPsychologyService } from "@/lib/services/cargo-psychology";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const shipmentId = params.id;

    if (!shipmentId) {
      return NextResponse.json(
        { error: "Shipment ID is required" },
        { status: 400 },
      );
    }

    // Get intervention history
    const interventions =
      await cargoPsychologyService.getInterventionHistory(shipmentId);

    return NextResponse.json({
      success: true,
      data: {
        interventions,
        totalInterventions: interventions.length,
        successfulInterventions: interventions.filter(
          (i) => i.outcome === "SUCCESS",
        ).length,
        failedInterventions: interventions.filter(
          (i) => i.outcome === "FAILED" || i.outcome === "NO_RESPONSE",
        ).length,
      },
    });
  } catch (error) {
    console.error("Error getting intervention history:", error);
    return NextResponse.json(
      {
        error: "Failed to get intervention history",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
