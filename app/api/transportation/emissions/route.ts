/**
 * CO2 Emissions Calculation API
 *
 * Calculate CO2e emissions for shipments
 */

import { NextRequest, NextResponse } from "next/server";
import { co2EmissionsService } from "@/lib/services/transportation";
import type { EmissionsCalculationRequest } from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";

async function handler(request: NextRequest, context: { tenantId?: string }) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body: EmissionsCalculationRequest = await request.json();

    // Validate required fields
    if (!body.origin || !body.destination || !body.mode || !body.cargo) {
      return NextResponse.json(
        { error: "Missing required fields: origin, destination, mode, cargo" },
        { status: 400 },
      );
    }

    // Calculate emissions
    const emissions = await co2EmissionsService.calculateEmissions({
      ...(body as any),
      tenantId,
    } as any);

    return NextResponse.json(emissions);
  } catch (error) {
    console.error("Error calculating emissions:", error);
    return NextResponse.json(
      {
        error: "Failed to calculate emissions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(handler, {
  featureId: "emissions",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
