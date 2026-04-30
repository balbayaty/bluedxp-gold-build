/**
 * Enhanced Transit Time Calculator API
 *
 * POST /api/transportation/enhanced-transit-time
 *
 * Calculates actual transit time considering all constraints
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { enhancedTransitTimeCalculator } from "@/lib/services/transportation";

async function handler(req: NextRequest, context: { tenantId?: string }) {
  try {
    const body = await req.json();
    const { action, ...params } = body;
    const tenantId = context?.tenantId;

    switch (action) {
      case "calculate": {
        if (!tenantId || String(tenantId).trim().length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "tenantId is required (multi-tenant day 1)",
            },
            { status: 400 },
          );
        }
        const calculation =
          await enhancedTransitTimeCalculator.calculateTransitTime({
            origin: params.origin,
            destination: params.destination,
            waypoints: params.waypoints,
            mode: params.mode,
            cargo: params.cargo,
            departureTime: params.departureTime
              ? new Date(params.departureTime)
              : undefined,
            arrivalWindow: params.arrivalWindow,
            compliancePrograms: params.compliancePrograms || [],
            preferences: params.preferences,
            tenantId: String(tenantId),
          });

        return NextResponse.json({
          success: true,
          data: calculation,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Enhanced Transit Time API Error:", error);
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
  featureId: "enhanced-transit-time",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
