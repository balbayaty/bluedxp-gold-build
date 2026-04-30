/**
 * Autonomous Agent API
 * Endpoints for autonomous workflow management
 * 5IR Aligned • Human-AI Collaboration • Autopilot Workflows
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { autonomousAgent, type AgentMode } from "@/lib/services/copilot/integrations/autonomousAgentService";

interface CreateWorkflowRequest {
  goal: string;
  mode?: AgentMode;
  moduleContext?: string;
  autoStart?: boolean;
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

    const body = await request.json().catch(() => ({})) as Partial<CreateWorkflowRequest>;

    if (!body.goal) {
      return NextResponse.json(
        { error: "Goal is required" },
        { status: 400 }
      );
    }

    // Plan the workflow
    const workflow = await autonomousAgent.planWorkflow(body.goal, {
      tenantId: context.tenantId,
      userId: context.userId,
      mode: body.mode || "supervised",
      moduleContext: body.moduleContext,
    });

    // Auto-start if requested
    if (body.autoStart) {
      setTimeout(() => {
        autonomousAgent.executeWorkflow(workflow.id);
      }, 0);
    }

    return NextResponse.json({
      success: true,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        goal: workflow.goal,
        status: workflow.status,
        mode: workflow.mode,
        steps: workflow.steps.map(s => ({
          id: s.id,
          name: s.name,
          type: s.type,
          description: s.description,
          requiresApproval: s.requiresApproval,
        })),
        createdAt: workflow.createdAt,
      },
      message: body.autoStart 
        ? "Workflow created and started" 
        : "Workflow planned. Call /api/copilot/agent/execute to start.",
    });
  } catch (error: any) {
    console.error("[Agent API] Error creating workflow:", error);
    return NextResponse.json(
      { error: "Failed to create workflow", details: error?.message },
      { status: 500 }
    );
  }
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");

    if (workflowId) {
      // Get specific workflow
      const workflow = autonomousAgent.getWorkflow(workflowId);
      if (!workflow) {
        return NextResponse.json(
          { error: "Workflow not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, workflow });
    }

    // Get all workflows
    const workflows = autonomousAgent.getWorkflows(context.tenantId);

    // Get capabilities
    const capabilities = autonomousAgent.getCapabilities();

    return NextResponse.json({
      success: true,
      workflows: workflows.map(w => ({
        id: w.id,
        name: w.name,
        goal: w.goal,
        status: w.status,
        mode: w.mode,
        stepCount: w.steps.length,
        completedSteps: w.results.filter(r => r.status === "completed").length,
        createdAt: w.createdAt,
        completedAt: w.completedAt,
      })),
      capabilities,
      agentModes: [
        { mode: "manual", description: "Every action requires explicit user command" },
        { mode: "assisted", description: "AI suggests actions, user executes" },
        { mode: "supervised", description: "AI executes with user approval at key points" },
        { mode: "autonomous", description: "AI executes independently, reports results" },
      ],
    });
  } catch (error: any) {
    console.error("[Agent API] Error fetching workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows", details: error?.message },
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

export const GET = withAPIGateway(getHandler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
