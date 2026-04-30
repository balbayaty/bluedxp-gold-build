/**
 * Update Decision Status API
 * Dedicated endpoint for status updates
 */

import { NextRequest, NextResponse } from "next/server";
import { decisionService } from "@/lib/services/decision-core";
import type { DecisionStatus } from "@/lib/services/decision-core/types";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = request.headers.get("x-user-id") || "system";
    const body = await request.json();
    const { status, reason, override, escalation, hold } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    const validStatuses: DecisionStatus[] = [
      "DRAFT",
      "PENDING",
      "APPROVED",
      "APPROVED_WITH_CONDITIONS",
      "REJECTED",
      "ESCALATED",
      "CLOSED",
      "ON_HOLD",
      "OVERRIDE_APPLIED",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status: ${status}` },
        { status: 400 },
      );
    }

    const decision = await decisionService.updateDecisionStatus(
      params.id,
      status,
      {
        reason,
        updatedBy: userId,
        override,
        escalation,
        hold,
      },
    );

    return NextResponse.json(decision);
  } catch (error: any) {
    console.error("Decision status update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update decision status" },
      { status: 500 },
    );
  }
}
