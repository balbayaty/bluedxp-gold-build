/**
 * Transportation Accidents API
 * Comprehensive CRUD operations for accident incidents
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { accidentInvestigationService } from "@/lib/services/transportation/accidentInvestigationService";
import type {
  IncidentDetectionRequest,
  IncidentAnalysisRequest,
} from "@/lib/services/transportation/accidentInvestigationService";

async function getHandler(req: NextRequest, context: { tenantId?: string }) {
  const tenantId = context.tenantId;
  if (!tenantId) {
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const severity = searchParams.get("severity") || undefined;
  const type = searchParams.get("type") || undefined;
  const limit = searchParams.get("limit")
    ? Number(searchParams.get("limit"))
    : undefined;
  const offset = searchParams.get("offset")
    ? Number(searchParams.get("offset"))
    : undefined;

  const incidents = await accidentInvestigationService.listIncidents({
    tenantId,
    status,
    severity,
    type,
    limit,
    offset,
  });

  return NextResponse.json(incidents);
}

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
    .catch(() => null)) as Partial<IncidentDetectionRequest> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const incident = await accidentInvestigationService.detectIncident({
    shipmentId: body.shipmentId,
    vehicleId: body.vehicleId,
    location: body.location || { lat: 0, lng: 0 },
    sensorData: body.sensorData,
    telemetry: body.telemetry,
    description: body.description,
    detectedBy: body.detectedBy || "USER",
    source: body.source,
    tenantId,
    userId,
  });

  return NextResponse.json(incident, { status: 201 });
}

export const GET = withTransportationAPI(getHandler, {
  featureId: "accidents",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withTransportationAPI(postHandler, {
  featureId: "accidents",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
