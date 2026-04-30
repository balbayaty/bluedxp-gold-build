/**
 * Create Decision API
 * With security and authorization
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { decisionService } from "@/lib/services/decision-core";
import type {
  DecisionContext,
  DecisionPrimitive,
  DecisionStatus,
} from "@/lib/services/decision-core/types";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function POSTHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const userId = context.userId || "system";
    const tenantId = context.tenantId || "default";

    const body = await request.json();
    const {
      module,
      entityType,
      entityId,
      primitive,
      status,
      reason,
      conditions,
      evidenceIds,
      metadata,
    } = body;

    // Input validation
    if (!module || !entityType || !entityId || !primitive || !status) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: module, entityType, entityId, primitive, status",
        },
        { status: 400 },
      );
    }

    // Validate primitive
    const validPrimitives: DecisionPrimitive[] = [
      "ALLOW",
      "ALLOW_WITH_CONDITIONS",
      "BLOCK",
      "HOLD_UNTIL",
      "ESCALATE_TO",
      "OPEN_NCR",
      "OPEN_CAPA",
      "REQUEST_EVIDENCE",
      "REROUTE",
      "RESCHEDULE",
      "ASSIGN_RESOURCE",
      "APPROVE_SPEND",
      "FLAG_FOR_PAYMENT_HOLD",
      "OVERRIDE",
    ];
    if (!validPrimitives.includes(primitive)) {
      return NextResponse.json(
        { error: `Invalid primitive: ${primitive}` },
        { status: 400 },
      );
    }

    // Validate status
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

    // Create decision context
    const context: DecisionContext = {
      module,
      entityType,
      entityId,
      tenantId,
      userId,
      data: metadata || {},
      options: {},
    };

    // Create decision
    const decision = await decisionService.createDecision(
      context,
      primitive,
      status,
      {
        reason,
        conditions,
        evidenceIds,
        decidedBy: userId,
        metadata,
      },
    );

    return NextResponse.json(decision, { status: 201 });
  } catch (error: any) {
    console.error("Decision creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create decision" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(POSTHandler, {
  moduleId: "decision-core",
  featureId: "decision-core.decisions",
  action: "create",
  requireAuth: true,
  rateLimit: true,
});
