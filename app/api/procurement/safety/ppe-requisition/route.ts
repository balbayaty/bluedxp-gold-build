/**
 * Safety PPE Requisition API
 * POST /api/procurement/safety/ppe-requisition
 */

import { NextRequest, NextResponse } from "next/server";
import { safetyEnvironmentalIntegrationService } from "@/lib/services/procurement/integration/safetyEnvironmentalIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, requirement } = body;

    if (!tenantId || !requirement) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID and requirement are required",
        },
        { status: 400 },
      );
    }

    const result =
      await safetyEnvironmentalIntegrationService.createPPERequisition(
        tenantId,
        requirement,
      );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error creating PPE requisition:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create PPE requisition",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.safety.ppe-requisition",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
