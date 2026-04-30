/**
 * NCR (Non-Conformance Report) API
 * POST /api/procurement/quality/ncr
 */

import { NextRequest, NextResponse } from "next/server";
import { qualityComplianceIntegrationService } from "@/lib/services/procurement/integration/qualityComplianceIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, ncr } = body;

    if (!tenantId || !ncr) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID and NCR data are required",
        },
        { status: 400 },
      );
    }

    const ncrRecord = await qualityComplianceIntegrationService.createNCR(
      tenantId,
      ncr,
    );

    return NextResponse.json({
      success: true,
      data: ncrRecord,
    });
  } catch (error: any) {
    console.error("Error creating NCR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create NCR",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.quality.ncr",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
