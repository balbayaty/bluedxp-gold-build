/**
 * Update Compliance Data for MSDS
 * Used by Civil Defense, Ministry of Interior, Import/Export modules
 */

import { NextRequest, NextResponse } from "next/server";
import { msdsDomainService } from "@/lib/services/chemical/msdsDomainService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { msdsId, complianceData } = body;
    const tenantId = context.tenantId;

    if (!msdsId) {
      return NextResponse.json(
        { success: false, error: "MSDS ID is required" },
        { status: 400 },
      );
    }

    if (!complianceData) {
      return NextResponse.json(
        { success: false, error: "Compliance data is required" },
        { status: 400 },
      );
    }

    await msdsDomainService.updateComplianceData({
      tenantId,
      actor: { userId: context.userId, roles: context.permissions || [] },
      msdsId,
      complianceData,
    });

    return NextResponse.json({
      success: true,
      message: "Compliance data updated successfully",
    });
  } catch (error) {
    console.error("[update-compliance] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update compliance data",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.update-compliance",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
