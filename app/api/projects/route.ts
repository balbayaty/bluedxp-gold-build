/**
 * Projects API
 * GET /api/projects - Get projects
 * POST /api/projects - Create project
 */

import { NextRequest, NextResponse } from "next/server";
import { projectService } from "@/lib/services/project-management/projectService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const status = searchParams.get("status") as any;
    const projectType = searchParams.get("projectType") as any;

    const projects = await projectService.getProjects({
      tenantId,
      status,
      projectType,
    });

    return NextResponse.json({
      success: true,
      data: projects,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const project = await projectService.createProject(body);

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
