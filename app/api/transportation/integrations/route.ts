/**
 * ERP/WMS Integration API
 *
 * Configure and manage ERP/WMS integrations
 */

import { NextRequest, NextResponse } from "next/server";
import { erpWmsIntegrationService } from "@/lib/services/transportation";
import type {
  ERPIntegrationConfig,
  WMSIntegrationConfig,
} from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";

async function postHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body = await request.json();
    const { type, config } = body;

    if (type === "erp") {
      erpWmsIntegrationService.configureERP(config as ERPIntegrationConfig);
      return NextResponse.json({
        success: true,
        message: "ERP integration configured",
      });
    }

    if (type === "wms") {
      erpWmsIntegrationService.configureWMS(config as WMSIntegrationConfig);
      return NextResponse.json({
        success: true,
        message: "WMS integration configured",
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Error configuring integration:", error);
    return NextResponse.json(
      {
        error: "Failed to configure integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function getHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const searchParams = request.nextUrl.searchParams;
    const shipmentId = searchParams.get("shipmentId");

    if (shipmentId) {
      const history = erpWmsIntegrationService.getSyncHistory(shipmentId);
      return NextResponse.json(history);
    }

    return NextResponse.json({ error: "Missing shipmentId" }, { status: 400 });
  } catch (error) {
    console.error("Error getting sync history:", error);
    return NextResponse.json(
      {
        error: "Failed to get sync history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(postHandler, {
  featureId: "integration",
  action: "configure",
  requireAuth: true,
  rateLimit: true,
});
export const GET = withTransportationAPI(getHandler, {
  featureId: "integration",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
