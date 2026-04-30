/**
 * Digital Twin Creation API
 * POST /api/procurement/digital-twin/create
 */

import { NextRequest, NextResponse } from "next/server";
import { digitalTwinService } from "@/lib/services/procurement/digitalTwinService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, entityType, entityId } = body;

    if (!tenantId || !entityType || !entityId) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID, entity type, and entity ID are required",
        },
        { status: 400 },
      );
    }

    const twin = await digitalTwinService.createProcurementDigitalTwin(
      tenantId,
      entityType,
      entityId,
    );

    return NextResponse.json({
      success: true,
      data: twin,
    });
  } catch (error: any) {
    console.error("Error creating digital twin:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create digital twin",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.digital-twin.create",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
