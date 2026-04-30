/**
 * QR-Compliance Integration API
 * Integrates QR codes with compliance checks
 */

import { NextRequest, NextResponse } from "next/server";
import { enterpriseQRAnalyticsService } from "@/lib/services/qr/enterpriseQRAnalyticsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const analytics =
      await enterpriseQRAnalyticsService.getQRComplianceIntegration({
        tenantId: tenantId || context.tenantId || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    console.error("Error getting QR-compliance integrations:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get integrations" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qr",
  featureId: "qr.integrations.compliance",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
