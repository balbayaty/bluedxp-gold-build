/**
 * Sustainability Metrics API
 * GET /api/procurement/sustainability/metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { safetyEnvironmentalIntegrationService } from "@/lib/services/procurement/integration/safetyEnvironmentalIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const startDate =
      searchParams.get("startDate") ||
      new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = searchParams.get("endDate") || new Date().toISOString();

    const metrics =
      await safetyEnvironmentalIntegrationService.calculateSustainabilityMetrics(
        tenantId,
        startDate,
        endDate,
      );

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error("Error calculating sustainability metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to calculate sustainability metrics",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.sustainability.metrics",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
