/**
 * Transportation Incidents API (tenant-scoped, RBAC)
 *
 * Incidents are created from Control Tower risks, but also support manual creation.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import { eventBus, createEvent } from "@/lib/services/event-store";

async function getHandler(req: NextRequest, context: { tenantId?: string }) {
  const tenantId = context.tenantId;
  if (!tenantId)
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const severity = searchParams.get("severity") || undefined;
  const riskId = searchParams.get("riskId") || undefined;
  const limit = searchParams.get("limit")
    ? Number(searchParams.get("limit"))
    : undefined;
  const offset = searchParams.get("offset")
    ? Number(searchParams.get("offset"))
    : undefined;

  const incidents = await transportationDatabaseAdapterInstance.listIncidents({
    tenantId,
    status,
    severity,
    riskId,
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
  if (!tenantId)
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body)
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const id = await transportationDatabaseAdapterInstance.storeIncident(body, {
    tenantId,
    createdBy: userId,
    riskId: typeof body.riskId === "string" ? body.riskId : undefined,
    status: typeof body.status === "string" ? body.status : undefined,
    severity: typeof body.severity === "string" ? body.severity : undefined,
    priority: typeof body.priority === "string" ? body.priority : undefined,
  });

  await eventBus.publish(
    createEvent(
      "transportation.incident.created",
      id,
      "TransportationIncident",
      { incidentId: id, ...body },
      1,
      { tenantId, userId },
    ),
  );

  return NextResponse.json({ id }, { status: 201 });
}

export const GET = withTransportationAPI(getHandler, {
  featureId: "incidents",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withTransportationAPI(postHandler, {
  featureId: "incidents",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
