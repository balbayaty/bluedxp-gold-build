/**
 * BIM-Based Requisition API
 * POST /api/procurement/bim/requisition
 */

import { NextRequest, NextResponse } from "next/server";
import { drawingBIMIntegrationService } from "@/lib/services/procurement/integration/drawingBIMIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, bimModelId, projectId, phaseId } = body;

    if (!tenantId || !bimModelId) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID and BIM model ID are required",
        },
        { status: 400 },
      );
    }

    const result = await drawingBIMIntegrationService.createRequisitionFromBIM(
      tenantId,
      bimModelId,
      projectId,
      phaseId,
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error creating BIM requisition:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create BIM requisition",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.bim.requisition",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
