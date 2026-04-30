/**
 * Intelligent Route Planning API
 *
 * POST /api/transportation/intelligent-route-planning
 *
 * Plans intelligent routes considering:
 * - Truck bans and vehicle restrictions
 * - Facility opening hours
 * - Government agency hours
 * - Touchpoint processing times
 * - Compliance program benefits
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { intelligentRoutePlanningService } from "@/lib/services/transportation";

async function handler(req: NextRequest, context: { tenantId?: string }) {
  try {
    const body = await req.json();
    const { action, ...params } = body;
    const tenantId = context?.tenantId;

    switch (action) {
      case "plan": {
        if (!tenantId || String(tenantId).trim().length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "tenantId is required (multi-tenant day 1)",
            },
            { status: 400 },
          );
        }
        const plan = await intelligentRoutePlanningService.planIntelligentRoute(
          {
            origin: params.origin,
            destination: params.destination,
            waypoints: params.waypoints,
            mode: params.mode,
            type: params.type || "FTL",
            cargo: params.cargo,
            timing: params.timing,
            compliancePrograms: params.compliancePrograms || [],
            preferences: params.preferences,
            tenantId: String(tenantId),
          },
        );

        return NextResponse.json({
          success: true,
          data: plan,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Intelligent Route Planning API Error:", error);
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
  featureId: "intelligent-route-planning",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
