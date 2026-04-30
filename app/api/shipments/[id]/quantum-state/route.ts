/**
 * Quantum State API Endpoints
 *
 * GET /api/shipments/{id}/quantum-state - Get current quantum state
 * POST /api/shipments/{id}/quantum-state/collapse - Trigger waveform collapse
 * GET /api/shipments/{id}/quantum-state/history - Get collapse history
 *
 * @module api/shipments/quantum-state
 */

import { NextRequest, NextResponse } from "next/server";
import { schrodingersTruckService } from "@/lib/services/schrodingers-truck";
import type { CollapseTrigger } from "@/lib/services/schrodingers-truck/types";

// ============================================================================
// GET /api/shipments/{id}/quantum-state
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

    // Get quantum state
    const quantumState =
      await schrodingersTruckService.getQuantumState(shipmentId);

    if (!quantumState) {
      return NextResponse.json(
        { error: "Quantum state not found for this shipment" },
        { status: 404 },
      );
    }

    // Get AI insights
    const aiInsights = await schrodingersTruckService.getAIInsights(shipmentId);

    return NextResponse.json({
      success: true,
      data: {
        ...quantumState,
        aiInsights: aiInsights || quantumState.aiInsights,
      },
    });
  } catch (error) {
    console.error("Error getting quantum state:", error);
    return NextResponse.json(
      {
        error: "Failed to get quantum state",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST /api/shipments/{id}/quantum-state/collapse
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const shipmentId = params.id;
    const body = await request.json();

    if (!shipmentId) {
      return NextResponse.json(
        { error: "Shipment ID is required" },
        { status: 400 },
      );
    }

    const { trigger, triggerData } = body;

    if (!trigger) {
      return NextResponse.json(
        { error: "Trigger is required" },
        { status: 400 },
      );
    }

    // Validate trigger type
    const validTriggers: CollapseTrigger[] = [
      "WHATSAPP_PING",
      "GEOFENCE_ENTRY",
      "GEOFENCE_EXIT",
      "GPS_UPDATE",
      "MANUAL_UPDATE",
      "TIMEOUT",
      "WEATHER_ALERT",
      "TRAFFIC_ALERT",
      "CUSTOMER_CONFIRM",
      "VEHICLE_DIAGNOSTIC",
      "JOURNEY_TOUCHPOINT",
      "ROOT_CAUSE_UPDATE",
      "EXCEPTION_DETECTED",
    ];

    if (!validTriggers.includes(trigger)) {
      return NextResponse.json(
        {
          error: `Invalid trigger. Must be one of: ${validTriggers.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Update quantum state (trigger collapse)
    const updatedState = await schrodingersTruckService.updateQuantumState(
      shipmentId,
      trigger,
      triggerData,
    );

    return NextResponse.json({
      success: true,
      data: updatedState,
      message: `Quantum state collapsed via ${trigger}`,
    });
  } catch (error) {
    console.error("Error collapsing quantum state:", error);
    return NextResponse.json(
      {
        error: "Failed to collapse quantum state",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
