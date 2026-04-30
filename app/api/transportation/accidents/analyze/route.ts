/**
 * Accident Analysis API
 * Trigger root cause analysis and risk predictions
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { accidentInvestigationService } from "@/lib/services/transportation/accidentInvestigationService";
import type {
  IncidentAnalysisRequest,
  RiskPredictionRequest,
} from "@/lib/services/transportation/accidentInvestigationService";

async function postHandler(
  req: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  const tenantId = context.tenantId;
  const userId = context.userId || "api-user";
  if (!tenantId) {
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );
  }

  const body = (await req
    .json()
    .catch(() => null)) as Partial<IncidentAnalysisRequest> | null;
  if (!body || !body.incidentId) {
    return NextResponse.json({ error: "incidentId required" }, { status: 400 });
  }

  // Start investigation and analysis
  await accidentInvestigationService.startInvestigation(
    body.incidentId,
    tenantId,
    userId,
  );

  const incident = await accidentInvestigationService.getIncident(
    body.incidentId,
    tenantId,
  );
  if (!incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  return NextResponse.json({
    incidentId: body.incidentId,
    status: "analysis_started",
    incident,
  });
}

export const POST = withTransportationAPI(postHandler, {
  featureId: "accidents",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
