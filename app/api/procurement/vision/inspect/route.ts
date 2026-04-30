/**
 * Computer Vision Quality Inspection API
 * POST /api/procurement/vision/inspect
 */

import { NextRequest, NextResponse } from "next/server";
import { computerVisionService } from "@/lib/services/procurement/computerVisionService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, imageUrl, itemName, specifications } = body;

    if (!tenantId || !imageUrl || !itemName) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID, image URL, and item name are required",
        },
        { status: 400 },
      );
    }

    const result = await computerVisionService.inspectQualityFromImage(
      tenantId,
      imageUrl,
      itemName,
      specifications,
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error inspecting quality:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to inspect quality",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.vision.inspect",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
