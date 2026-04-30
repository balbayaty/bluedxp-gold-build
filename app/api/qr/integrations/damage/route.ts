/**
 * QR-Damage Integration API
 * Integrates QR codes with damage reports
 */

import { NextRequest, NextResponse } from "next/server";
import { qrModuleDeepIntegration } from "@/lib/services/qr/qrModuleDeepIntegration";
import { enterpriseQRAnalyticsService } from "@/lib/services/qr/enterpriseQRAnalyticsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action, damageReportId, qrId } = body;

    if (action === "generate") {
      if (!damageReportId) {
        return NextResponse.json(
          { success: false, error: "Damage report ID is required" },
          { status: 400 },
        );
      }

      const result = await qrModuleDeepIntegration.generateDamageReportQR(
        damageReportId,
        {
          includePhotos: body.includePhotos,
          includeInvestigation: body.includeInvestigation,
        },
      );

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    if (action === "link") {
      if (!qrId || !damageReportId) {
        return NextResponse.json(
          { success: false, error: "QR ID and damage report ID are required" },
          { status: 400 },
        );
      }

      const integration = await qrModuleDeepIntegration.linkQRScanToDamage(
        qrId,
        damageReportId,
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
    console.error("Error in QR-damage integration:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const damageReportId = searchParams.get("damageReportId");
    const tenantId = searchParams.get("tenantId");

    if (damageReportId) {
      // Get integration for specific damage report
      // In production, query database
      return NextResponse.json({
        success: true,
        integration: null,
      });
    }

    // Get all QR-damage integrations
    const analytics = await enterpriseQRAnalyticsService.getQRDamageIntegration(
      {
        tenantId: tenantId || context.tenantId || undefined,
      },
    );

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    console.error("Error getting QR-damage integrations:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get integrations" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.integrations.damage",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(getHandler, {
  moduleId: "qr",
  featureId: "qr.integrations.damage",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
