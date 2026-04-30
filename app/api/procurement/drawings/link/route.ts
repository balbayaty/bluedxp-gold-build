/**
 * Drawing Link API
 * POST /api/procurement/drawings/link
 */

import { NextRequest, NextResponse } from "next/server";
import { drawingBIMIntegrationService } from "@/lib/services/procurement/integration/drawingBIMIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, drawingId, linkedToType, linkedToId } = body;

    if (!tenantId || !drawingId || !linkedToType || !linkedToId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tenant ID, drawing ID, linked to type, and linked to ID are required",
        },
        { status: 400 },
      );
    }

    const link = await drawingBIMIntegrationService.linkDrawing(
      tenantId,
      drawingId,
      linkedToType,
      linkedToId,
    );

    return NextResponse.json({
      success: true,
      data: link,
    });
  } catch (error: any) {
    console.error("Error linking drawing:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to link drawing",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.drawings.link",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
