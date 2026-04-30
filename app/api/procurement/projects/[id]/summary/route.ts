/**
 * Project Procurement Summary API
 * GET /api/procurement/projects/[id]/summary
 */

import { NextRequest, NextResponse } from "next/server";
import { projectProcurementService } from "@/lib/services/procurement/projectProcurementService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";

    const summary =
      await projectProcurementService.getProjectProcurementSummary(
        params.id,
        tenantId,
      );

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error("Error fetching project summary:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch project summary",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.projects.summary",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
