/**
 * Workflow API Route
 * CRUD operations for workflows
 */

import { NextRequest, NextResponse } from "next/server";
import { workflowService } from "@/lib/services/trade-compliance/workflowService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";

    const workflows = await workflowService.getWorkflows(tenantId);

    return NextResponse.json({
      success: true,
      workflows,
    });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch workflows",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const workflow = await workflowService.createWorkflow({
      name: body.name,
      description: body.description || "",
      steps: body.steps || [],
      triggers: body.triggers || [],
      status: body.status || "draft",
    });

    return NextResponse.json(
      {
        success: true,
        workflow,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating workflow:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create workflow",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Workflow ID is required" },
        { status: 400 },
      );
    }

    const workflow = await workflowService.updateWorkflow(body.id, body);

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: "Workflow not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      workflow,
    });
  } catch (error) {
    console.error("Error updating workflow:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update workflow",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Workflow ID is required" },
        { status: 400 },
      );
    }

    const deleted = await workflowService.deleteWorkflow(id);

    return NextResponse.json({
      success: deleted,
    });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete workflow",
      },
      { status: 500 },
    );
  }
}
