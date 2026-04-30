/**
 * Autonomous Agent Execute API
 * Endpoints for executing and approving workflows
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { autonomousAgent } from "@/lib/services/copilot/integrations/autonomousAgentService";

interface ExecuteRequest {
  workflowId: string;
}

interface ApproveRequest {
  workflowId: string;
  stepId: string;
  approved: boolean;
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    }

    if (!context.userId) {
      return NextResponse.json(
        { error: "User authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({})) as Partial<ExecuteRequest>;

    if (!body.workflowId) {
      return NextResponse.json(
        { error: "workflowId is required" },
        { status: 400 }
      );
    }

    const workflow = autonomousAgent.getWorkflow(body.workflowId);
    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (workflow.tenantId !== context.tenantId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Execute workflow (async)
    const executedWorkflow = await autonomousAgent.executeWorkflow(body.workflowId);

    return NextResponse.json({
      success: true,
      workflow: {
        id: executedWorkflow.id,
        name: executedWorkflow.name,
        status: executedWorkflow.status,
        currentStepIndex: executedWorkflow.currentStepIndex,
        results: executedWorkflow.results,
        finalOutput: executedWorkflow.finalOutput,
        completedAt: executedWorkflow.completedAt,
      },
    });
  } catch (error: any) {
    console.error("[Agent Execute API] Error:", error);
    return NextResponse.json(
      { error: "Failed to execute workflow", details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH for approving/rejecting steps
async function patchHandler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId || !context.userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({})) as Partial<ApproveRequest>;

    if (!body.workflowId || !body.stepId || body.approved === undefined) {
      return NextResponse.json(
        { error: "workflowId, stepId, and approved are required" },
        { status: 400 }
      );
    }

    const success = await autonomousAgent.approveStep(
      body.workflowId,
      body.stepId,
      context.userId,
      body.approved
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to approve step" },
        { status: 400 }
      );
    }

    const workflow = autonomousAgent.getWorkflow(body.workflowId);

    return NextResponse.json({
      success: true,
      approved: body.approved,
      workflow: workflow ? {
        id: workflow.id,
        status: workflow.status,
        currentStepIndex: workflow.currentStepIndex,
      } : null,
    });
  } catch (error: any) {
    console.error("[Agent Approve API] Error:", error);
    return NextResponse.json(
      { error: "Failed to approve step", details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE for cancelling workflows
async function deleteHandler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");

    if (!workflowId) {
      return NextResponse.json(
        { error: "workflowId is required" },
        { status: 400 }
      );
    }

    const success = autonomousAgent.cancelWorkflow(workflowId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to cancel workflow" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Workflow cancelled",
    });
  } catch (error: any) {
    console.error("[Agent Cancel API] Error:", error);
    return NextResponse.json(
      { error: "Failed to cancel workflow", details: error?.message },
      { status: 500 }
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

export const PATCH = withAPIGateway(patchHandler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

export const DELETE = withAPIGateway(deleteHandler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "delete",
  requireAuth: true,
  rateLimit: true,
});
