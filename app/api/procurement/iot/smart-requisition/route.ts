/**
 * IoT Smart Requisition API
 * POST /api/procurement/iot/smart-requisition
 */

import { NextRequest, NextResponse } from "next/server";
import { iotIntegrationService } from "@/lib/services/procurement/iotIntegrationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, deviceId, materialId } = body;

    if (!tenantId || !deviceId || !materialId) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID, device ID, and material ID are required",
        },
        { status: 400 },
      );
    }

    const result = await iotIntegrationService.createSmartRequisition(
      tenantId,
      deviceId,
      materialId,
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error creating smart requisition:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create smart requisition",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.iot.smart-requisition",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
