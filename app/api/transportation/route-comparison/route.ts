/**
 * Route Comparison API
 *
 * Compare multiple route options with pricing, CO2e, transit times
 */

import { NextRequest, NextResponse } from "next/server";
import { routeComparisonService } from "@/lib/services/transportation";
import type { RouteComparisonRequest } from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";

async function handler(request: NextRequest, context: { tenantId?: string }) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );
    }

    const body: RouteComparisonRequest = await request.json();

    // Validate required fields
    if (!body.origin || !body.destination || !body.cargo) {
      return NextResponse.json(
        { error: "Missing required fields: origin, destination, cargo" },
        { status: 400 },
      );
    }

    // Compare routes
    const comparison = await routeComparisonService.compareRoutes({
      ...(body as any),
      tenantId,
    } as any);

    return NextResponse.json(comparison);
  } catch (error) {
    console.error("Error comparing routes:", error);
    return NextResponse.json(
      {
        error: "Failed to compare routes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(handler, {
  featureId: "route-comparison",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
