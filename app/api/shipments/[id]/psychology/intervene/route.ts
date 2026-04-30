/**
 * Intervention API Endpoint
 *
 * POST /api/shipments/{id}/psychology/intervene - Execute intervention
 *
 * @module api/shipments/psychology/intervene
 */

import { NextRequest, NextResponse } from "next/server";
import { cargoPsychologyService } from "@/lib/services/cargo-psychology";
import type { InterventionAction } from "@/lib/services/cargo-psychology/types";

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

    const { action, channel } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Intervention action is required" },
        { status: 400 },
      );
    }

    // Validate action
    const validActions: InterventionAction[] = [
      "STANDARD_CONFIRMATION",
      "PERSONALIZED_CALL",
      "DOCUMENT_REQUEST",
      "PAYMENT_REMINDER",
      "ALTERNATIVE_DATE_OFFER",
      "MANAGER_ESCALATION",
      "PREPAYMENT_REQUEST",
      "BACKUP_PREPARATION",
      "OVERBOOKING_PROTECTION",
      "DOCUMENT_INTERACTION",
    ];

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 },
      );
    }

    // Execute intervention
    const interventionRecord = await cargoPsychologyService.executeIntervention(
      shipmentId,
      action,
      channel,
    );

    return NextResponse.json({
      success: true,
      data: interventionRecord,
      message: `Intervention ${action} executed successfully`,
    });
  } catch (error) {
    console.error("Error executing intervention:", error);
    return NextResponse.json(
      {
        error: "Failed to execute intervention",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
