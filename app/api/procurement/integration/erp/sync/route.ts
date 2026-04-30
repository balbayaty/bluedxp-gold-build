/**
 * ERP Sync API
 * POST /api/procurement/integration/erp/sync
 */

import { NextRequest, NextResponse } from "next/server";
import { erpIntegrationService } from "@/lib/services/procurement/integration/erpIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, syncType } = body;

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID is required",
        },
        { status: 400 },
      );
    }

    let result: any;

    switch (syncType) {
      case "VENDORS":
        result = await erpIntegrationService.syncVendorsFromERP(tenantId);
        break;
      case "ITEMS":
        result = await erpIntegrationService.syncItemsFromERP(tenantId);
        break;
      case "MASTER_DATA":
        result = await erpIntegrationService.syncMasterData(tenantId);
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid sync type. Use: VENDORS, ITEMS, or MASTER_DATA",
          },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error syncing ERP data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to sync ERP data",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.integration.erp.sync",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
