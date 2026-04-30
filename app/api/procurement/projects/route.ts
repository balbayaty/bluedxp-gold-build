/**
 * Projects API
 * GET /api/procurement/projects - List projects
 * POST /api/procurement/projects - Create project
 */

import { NextRequest, NextResponse } from "next/server";
import { projectProcurementService } from "@/lib/services/procurement/projectProcurementService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId;
    const status = searchParams.get("status")?.split(",") as any;
    const projectType = searchParams.get("projectType")?.split(",") as any;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    const projects = await projectProcurementService.listProjects(tenantId, {
      status,
      projectType,
    });

    return NextResponse.json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch projects",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const {
      projectName,
      projectType,
      startDate,
      endDate,
      description,
      budgetId,
      totalBudget,
    } = body;

    const tenantId = context.tenantId;
    const userId = context.userId;
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User context required" },
        { status: 400 },
      );
    }

    const project = await projectProcurementService.createProject(
      tenantId,
      projectName,
      projectType,
      startDate,
      endDate,
      description,
      budgetId,
      totalBudget,
      userId,
    );

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create project",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.projects",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.projects",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
