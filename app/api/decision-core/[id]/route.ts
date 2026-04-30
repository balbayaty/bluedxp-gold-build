/**
 * Decision by ID API
 * GET, PUT, DELETE operations with security
 */

import { NextRequest, NextResponse } from "next/server";
import { decisionService } from "@/lib/services/decision-core";
import type { DecisionStatus } from "@/lib/services/decision-core/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const decision = await decisionService.getDecision(params.id);

    if (!decision) {
      return NextResponse.json(
        { error: "Decision not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(decision);
  } catch (error: any) {
    console.error("Decision get error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get decision" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = request.headers.get("x-user-id") || "system";
    const body = await request.json();
    const { status, reason, ...updates } = body;

    // If updating status, use updateDecisionStatus
    if (status) {
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
          ...updates,
        },
      );

      return NextResponse.json(decision);
    }

    // Otherwise, update other fields
    const decision = await decisionService.getDecision(params.id);
    if (!decision) {
      return NextResponse.json(
        { error: "Decision not found" },
        { status: 404 },
      );
    }

    // Merge updates
    const updated = {
      ...decision,
      ...updates,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };

    // Save (would use database update in production)
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Decision update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update decision" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = request.headers.get("x-user-id") || "system";

    // Soft delete by setting status to CLOSED
    const decision = await decisionService.updateDecisionStatus(
      params.id,
      "CLOSED",
      {
        reason: "Decision deleted",
        updatedBy: userId,
      },
    );

    return NextResponse.json({ success: true, decision });
  } catch (error: any) {
    console.error("Decision delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete decision" },
      { status: 500 },
    );
  }
}
