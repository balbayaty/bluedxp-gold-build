/**
 * Touchpoint Analysis API
 *
 * POST /api/transportation/touchpoint-analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { intelligentTouchpointAnalysisService } from "@/lib/services/transportation";

async function handler(
  req: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  try {
    const body = await req.json();
    const { action, ...params } = body;
    const tenantId = context?.tenantId;

    switch (action) {
      case "analyze": {
        if (!tenantId || String(tenantId).trim().length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "tenantId is required (multi-tenant day 1)",
            },
            { status: 400 },
          );
        }
        const analysis =
          await intelligentTouchpointAnalysisService.analyzeTouchpoint({
            touchpoint: params.touchpoint,
            shipment: params.shipment,
            arrivalTime: params.arrivalTime
              ? new Date(params.arrivalTime)
              : undefined,
            compliancePrograms: params.compliancePrograms || [],
            preferences: params.preferences,
            tenantId: String(tenantId),
          });

        return NextResponse.json({
          success: true,
          data: analysis,
        });
      }

      case "compare": {
        if (!tenantId || String(tenantId).trim().length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "tenantId is required (multi-tenant day 1)",
            },
            { status: 400 },
          );
        }
        const comparison =
          await intelligentTouchpointAnalysisService.compareTouchpoints(
            params.touchpoints,
            params.shipment,
            params.arrivalTime ? new Date(params.arrivalTime) : undefined,
            params.compliancePrograms || [],
            String(tenantId),
          );

        return NextResponse.json({
          success: true,
          data: comparison,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Touchpoint Analysis API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(handler, {
  featureId: "touchpoint-analysis",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
