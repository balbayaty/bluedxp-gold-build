/**
 * Facility MRO Requisition API
 * POST /api/procurement/facility/mro-requisition
 */

import { NextRequest, NextResponse } from "next/server";
import { facilityIntegrationService } from "@/lib/services/procurement/integration/facilityIntegration";
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

    const result = await facilityIntegrationService.createMRORequisition(
      tenantId,
      requirement,
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error creating MRO requisition:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create MRO requisition",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.facility.mro-requisition",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
