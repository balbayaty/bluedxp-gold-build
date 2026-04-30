/**
 * Tax Configuration API
 * POST /api/finance/tax/configure
 */

import { NextRequest, NextResponse } from "next/server";
import { taxManagementService } from "@/lib/services/finance/taxManagementService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: "Tax configuration is required",
        },
        { status: 400 },
      );
    }

    const taxConfig = await taxManagementService.configureTax(tenantId, config);

    return NextResponse.json({
      success: true,
      data: taxConfig,
    });
  } catch (error: any) {
    console.error("Error configuring tax:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to configure tax",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.tax.configure",
  action: "configure",
  requireAuth: true,
  rateLimit: true,
});
