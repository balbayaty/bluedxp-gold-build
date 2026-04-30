/**
 * Process Lifecycle - Workflow Management API
 * Comprehensive workflow CRUD and execution operations
 */

import { NextRequest, NextResponse } from "next/server";
import { workflowService } from "@/lib/services/process-lifecycle";

/**
 * GET /api/process-lifecycle/workflows
 * Get workflows
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workflowId = searchParams.get("workflowId");
    const tenantId = searchParams.get("tenantId") || "default";

    if (workflowId) {
      // Get specific workflow
      const workflow = await workflowService.getWorkflow(workflowId);

      if (!workflow) {
        return NextResponse.json(
          {
            success: false,
            error: "Workflow not found",
          },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: workflow,
        timestamp: new Date().toISOString(),
      });
    }

    // Get all workflows
    const workflows = await workflowService.getWorkflows(tenantId);

    return NextResponse.json({
      success: true,
      data: {
        workflows,
        count: workflows.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in GET /api/process-lifecycle/workflows:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/process-lifecycle/workflows
 * Create workflow or execute workflow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workflowData, workflowId, recordId, context } = body;

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: action",
        },
        { status: 400 },
      );
    }

    switch (action) {
      case "create":
        if (!workflowData) {
          return NextResponse.json(
            {
              success: false,
              error: "Missing required field: workflowData",
            },
            { status: 400 },
          );
        }
        const workflow = await workflowService.createWorkflow(workflowData);
        return NextResponse.json({
          success: true,
          data: workflow,
          timestamp: new Date().toISOString(),
        });

      case "execute":
        if (!workflowId || !recordId) {
          return NextResponse.json(
            {
              success: false,
              error: "Missing required fields: workflowId, recordId",
            },
            { status: 400 },
          );
        }
        const execution = await workflowService.executeWorkflow(
          workflowId,
          recordId,
          context || {},
        );
        return NextResponse.json({
          success: true,
          data: execution,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error in POST /api/process-lifecycle/workflows:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/process-lifecycle/workflows
 * Update workflow
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, updates } = body;

    if (!workflowId || !updates) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: workflowId, updates",
        },
        { status: 400 },
      );
    }

    const workflow = await workflowService.updateWorkflow(workflowId, updates);

    if (!workflow) {
      return NextResponse.json(
        {
          success: false,
          error: "Workflow not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: workflow,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in PUT /api/process-lifecycle/workflows:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/process-lifecycle/workflows
 * Delete workflow
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workflowId = searchParams.get("workflowId");

    if (!workflowId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: workflowId",
        },
        { status: 400 },
      );
    }

    const deleted = await workflowService.deleteWorkflow(workflowId);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Workflow not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Workflow deleted",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in DELETE /api/process-lifecycle/workflows:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
