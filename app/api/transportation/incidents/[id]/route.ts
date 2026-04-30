/**
 * Transportation Incident detail API (tenant-scoped, RBAC)
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import { eventBus, createEvent } from "@/lib/services/event-store";

async function getHandler(
  _req: NextRequest,
  context: { tenantId?: string },
  params: { id: string },
) {
  const tenantId = context.tenantId;
  if (!tenantId)
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );

  const incident = await transportationDatabaseAdapterInstance.getIncident({
    tenantId,
    id: params.id,
  });
  if (!incident)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(incident);
}

async function patchHandler(
  req: NextRequest,
  context: { tenantId?: string; userId?: string },
  params: { id: string },
) {
  const tenantId = context.tenantId;
  const userId = context.userId || "api-user";
  if (!tenantId)
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );

  const patch = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!patch)
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const updated = await transportationDatabaseAdapterInstance.updateIncident({
    tenantId,
    id: params.id,
    patch,
    updatedBy: userId,
  });
  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await eventBus.publish(
    createEvent(
      "transportation.incident.updated",
      params.id,
      "TransportationIncident",
      { incidentId: params.id, patch },
      2,
      { tenantId, userId },
    ),
  );

  return NextResponse.json(updated);
}

export const GET = withTransportationAPI(
  async (req: NextRequest, ctx: any) => {
    const id = req.nextUrl.pathname.split("/").pop() || "";
    return getHandler(req, ctx, { id });
  },
  {
    featureId: "incidents",
    action: "read_only",
    requireAuth: true,
    rateLimit: true,
  },
);

export const PATCH = withTransportationAPI(
  async (req: NextRequest, ctx: any) => {
    const id = req.nextUrl.pathname.split("/").pop() || "";
    return patchHandler(req, ctx, { id });
  },
  {
    featureId: "incidents",
    action: "update",
    requireAuth: true,
    rateLimit: true,
  },
);
