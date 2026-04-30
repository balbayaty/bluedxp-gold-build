/**
 * Risk Prediction API
 * Predict accident risk for routes, vehicles, drivers
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { accidentInvestigationService } from "@/lib/services/transportation/accidentInvestigationService";
import type { RiskPredictionRequest } from "@/lib/services/transportation/accidentInvestigationService";

async function postHandler(req: NextRequest, context: { tenantId?: string }) {
  const tenantId = context.tenantId;
  if (!tenantId) {
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );
  }

  const body = (await req
    .json()
    .catch(() => null)) as Partial<RiskPredictionRequest> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prediction = await accidentInvestigationService.predictRisk({
    routeId: body.routeId,
    vehicleId: body.vehicleId,
    driverId: body.driverId,
    location: body.location,
    conditions: body.conditions,
    tenantId,
  });

  return NextResponse.json(prediction);
}

export const POST = withTransportationAPI(postHandler, {
  featureId: "accidents",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
