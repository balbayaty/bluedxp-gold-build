/**
 * QHSE Approvals API Route
 * Handle approval workflows for QHSE entities
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseApprovalWorkflowService } from "@/lib/services/qhse/workflows/qhseApprovalWorkflowService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// GET - Get pending approvals
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (entityType && entityId) {
      // Get approval for specific entity
      const approval = qhseApprovalWorkflowService.getApprovalByEntity(
        entityType,
        entityId,
      );
      return NextResponse.json({ success: true, data: approval });
    }

    if (userId && role) {
      // Get pending approvals for user
      const approvals = qhseApprovalWorkflowService.getPendingApprovalsForUser(
        userId,
        role,
      );
      return NextResponse.json({
        success: true,
        data: approvals,
        count: approvals.length,
      });
    }

    return NextResponse.json(
      { success: false, error: "Missing userId/role or entityType/entityId" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch approvals",
      },
      { status: 500 },
    );
  }
}

// POST - Start approval or process approval step
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "start") {
      // Start approval workflow
      const approval = await qhseApprovalWorkflowService.startApproval(
        body.workflowId,
        body.entityType,
        body.entityId,
        body.entityTitle,
        body.submittedBy,
        body.metadata,
      );
      return NextResponse.json(
        { success: true, data: approval },
        { status: 201 },
      );
    }

    if (action === "process") {
      // Process approval step
      const approval = await qhseApprovalWorkflowService.processApproval(
        body.approvalId,
        body.stepIndex,
        body.action as "APPROVE" | "REJECT" | "DELEGATE" | "REQUEST_CHANGES",
        body.approverId,
        body.comments,
      );
      return NextResponse.json({ success: true, data: approval });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "start" or "process"' },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in approval API:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process approval",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.approvals",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.approvals",
  action: "approve",
  requireAuth: true,
  rateLimit: true,
});
