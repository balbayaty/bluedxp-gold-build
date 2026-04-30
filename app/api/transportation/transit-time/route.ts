/**
 * Transit Time Prediction API
 *
 * Predict transit times with confidence intervals
 */

import { NextRequest, NextResponse } from "next/server";
import { transitTimePredictionService } from "@/lib/services/transportation";
import type { TransitTimePredictionRequest } from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";

async function handler(request: NextRequest, context: { tenantId?: string }) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body: TransitTimePredictionRequest = await request.json();

    // Validate required fields
    if (!body.origin || !body.destination || !body.mode) {
      return NextResponse.json(
        { error: "Missing required fields: origin, destination, mode" },
        { status: 400 },
      );
    }

    // Predict transit time
    const prediction = await transitTimePredictionService.predictTransitTime({
      ...(body as any),
      tenantId,
    } as any);

    return NextResponse.json(prediction);
  } catch (error) {
    console.error("Error predicting transit time:", error);
    return NextResponse.json(
      {
        error: "Failed to predict transit time",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(handler, {
  featureId: "routes",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
