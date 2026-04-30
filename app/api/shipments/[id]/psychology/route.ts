/**
 * Cargo Psychology API Endpoints
 *
 * GET /api/shipments/{id}/psychology - Get psychology state
 * POST /api/shipments/{id}/psychology/analyze - Analyze shipment
 * POST /api/shipments/{id}/psychology/intervene - Execute intervention
 * GET /api/shipments/{id}/psychology/interventions - Get intervention history
 *
 * @module api/shipments/psychology
 */

import { NextRequest, NextResponse } from "next/server";
import { cargoPsychologyService } from "@/lib/services/cargo-psychology";
import type { InterventionAction } from "@/lib/services/cargo-psychology/types";

// ============================================================================
// GET /api/shipments/{id}/psychology
// ============================================================================

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

    // Get psychology state
    let psychologyState =
      await cargoPsychologyService.getPsychologyState(shipmentId);

    // If not found, analyze the shipment
    if (!psychologyState) {
      psychologyState =
        await cargoPsychologyService.analyzeShipment(shipmentId);
    }

    return NextResponse.json({
      success: true,
      data: psychologyState,
    });
  } catch (error) {
    console.error("Error getting psychology state:", error);
    return NextResponse.json(
      {
        error: "Failed to get psychology state",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST /api/shipments/{id}/psychology/analyze
// ============================================================================

export async function POST(
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

    // Analyze shipment
    const psychologyState =
      await cargoPsychologyService.analyzeShipment(shipmentId);

    return NextResponse.json({
      success: true,
      data: psychologyState,
      message: `Psychology analysis complete. State: ${psychologyState.currentState}`,
    });
  } catch (error) {
    console.error("Error analyzing shipment psychology:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze shipment psychology",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
