/**
 * QR-Incident Integration API
 * Integrates QR codes with QHSE incidents
 */

import { NextRequest, NextResponse } from "next/server";
import { qrModuleDeepIntegration } from "@/lib/services/qr/qrModuleDeepIntegration";
import { enterpriseQRAnalyticsService } from "@/lib/services/qr/enterpriseQRAnalyticsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action, incidentId, qrId } = body;

    if (action === "generate") {
      if (!incidentId) {
        return NextResponse.json(
          { success: false, error: "Incident ID is required" },
          { status: 400 },
        );
      }

      const result = await qrModuleDeepIntegration.generateIncidentQR(
        incidentId,
        {
          includeInvestigation: body.includeInvestigation,
          includeRootCause: body.includeRootCause,
        },
      );

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    if (action === "link") {
      if (!qrId || !incidentId) {
        return NextResponse.json(
          { success: false, error: "QR ID and incident ID are required" },
          { status: 400 },
        );
      }

      const integration = await qrModuleDeepIntegration.linkQRScanToIncident(
        qrId,
        incidentId,
      );

      return NextResponse.json({
        success: true,
        integration,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "generate" or "link"' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error in QR-incident integration:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get("incidentId");
    const tenantId = searchParams.get("tenantId");

    if (incidentId) {
      // Get integration for specific incident
      return NextResponse.json({
        success: true,
        integration: null,
      });
    }

    // Get all QR-incident integrations
    const analytics =
      await enterpriseQRAnalyticsService.getQRIncidentIntegration({
        tenantId: tenantId || context.tenantId || undefined,
      });

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    console.error("Error getting QR-incident integrations:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get integrations" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.integrations.incident",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(getHandler, {
  moduleId: "qr",
  featureId: "qr.integrations.incident",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
