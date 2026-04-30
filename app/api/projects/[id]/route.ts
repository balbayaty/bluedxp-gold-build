/**
 * Project Details API
 * GET /api/projects/[id] - Get project details
 */

import { NextRequest, NextResponse } from "next/server";
import { unifiedProjectService } from "@/lib/services/project-management/integration/unifiedProjectService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const projectData = await unifiedProjectService.getUnifiedProjectData(
      params.id,
    );

    return NextResponse.json({
      success: true,
      data: projectData,
    });
  } catch (error: any) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch project",
      },
      { status: 500 },
    );
  }
}
