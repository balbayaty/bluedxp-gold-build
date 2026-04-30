/**
 * ERP Configuration API
 * POST /api/procurement/integration/erp/configure
 */

import { NextRequest, NextResponse } from "next/server";
import { erpIntegrationService } from "@/lib/services/procurement/integration/erpIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, config } = body;

    if (!tenantId || !config) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID and config are required",
        },
        { status: 400 },
      );
    }

    await erpIntegrationService.configureERPIntegration(tenantId, config);

    return NextResponse.json({
      success: true,
      message: "ERP integration configured successfully",
    });
  } catch (error: any) {
    console.error("Error configuring ERP integration:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to configure ERP integration",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.integration.erp.configure",
  action: "configure",
  requireAuth: true,
  rateLimit: true,
});
