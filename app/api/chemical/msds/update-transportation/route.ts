/**
 * Update Transportation Data for MSDS
 * Used by Transportation module for multimodal planning
 */

import { NextRequest, NextResponse } from "next/server";
import { msdsDomainService } from "@/lib/services/chemical/msdsDomainService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { msdsId, transportationData } = body;
    const tenantId = context.tenantId;

    if (!msdsId) {
      return NextResponse.json(
        { success: false, error: "MSDS ID is required" },
        { status: 400 },
      );
    }

    if (!transportationData) {
      return NextResponse.json(
        { success: false, error: "Transportation data is required" },
        { status: 400 },
      );
    }

    await msdsDomainService.updateTransportationData({
      tenantId,
      actor: { userId: context.userId, roles: context.permissions || [] },
      msdsId,
      transportationData,
    });

    return NextResponse.json({
      success: true,
      message: "Transportation data updated successfully",
    });
  } catch (error) {
    console.error("[update-transportation] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update transportation data",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.update-transportation",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
