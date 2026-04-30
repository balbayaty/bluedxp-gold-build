/**
 * Transportation Carriers API
 *
 * Tenant-scoped carriers (no hardcoded demo lists).
 * - GET: list carriers
 * - POST: create carrier
 */

import { NextRequest, NextResponse } from "next/server";
import type { Carrier } from "@/types/tms";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import {
  generateDemoCarriers,
  isDemoModeEnabled,
} from "@/lib/services/demo/demoDataService";
import { eventBus, createEvent } from "@/lib/services/event-store";

async function getHandler(req: NextRequest, context: { tenantId?: string }) {
  const tenantId = context.tenantId;
  if (!tenantId)
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );

  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") || undefined;
  const status = sp.get("status") || undefined;
  const limit = Math.min(500, Math.max(1, Number(sp.get("limit") || 200)));
  const offset = Math.max(0, Number(sp.get("offset") || 0));

  const carriers = await transportationDatabaseAdapterInstance.listCarriers({
    tenantId,
    type,
    status,
    limit,
    offset,
  });

  // If no data and demo mode enabled, return demo data
  if (carriers.length === 0 && isDemoModeEnabled()) {
    const demoData = generateDemoCarriers();
    return NextResponse.json(demoData);
  }

  return NextResponse.json(carriers);
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

  const body = (await req.json()) as Partial<Carrier>;
  if (!body.name || String(body.name).trim().length === 0)
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!body.code || String(body.code).trim().length === 0)
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  if (!body.type || String(body.type).trim().length === 0)
    return NextResponse.json({ error: "type is required" }, { status: 400 });

  const now = new Date().toISOString();
  const carrier: Carrier = {
    id: body.id || `CR-${Date.now()}`,
    name: String(body.name),
    code: String(body.code),
    type: body.type as any,
    serviceTypes: Array.isArray(body.serviceTypes) ? body.serviceTypes : [],
    contactPerson:
      typeof body.contactPerson === "string" ? body.contactPerson : "",
    email: typeof body.email === "string" ? body.email : "",
    phone: typeof body.phone === "string" ? body.phone : "",
    website: typeof body.website === "string" ? body.website : undefined,
    coverage: (body.coverage as any) || {
      local: true,
      regional: true,
      international: false,
    },
    status: (body.status as any) || "ACTIVE",
    rating: typeof body.rating === "number" ? body.rating : 0,
    createdAt: (body.createdAt as any) || now,
    updatedAt: now,
  };

  await transportationDatabaseAdapterInstance.storeCarrier(carrier, {
    tenantId,
    createdBy: userId,
  });

  // Publish event to Event Bus
  try {
    const event = createEvent(
      "transportation.carrier.created",
      carrier.id,
      "CARRIER",
      {
        carrierId: carrier.id,
        carrierCode: carrier.code,
        carrierName: carrier.name,
        type: carrier.type,
        status: carrier.status,
        tenantId,
        createdAt: new Date(),
      },
      1,
      {
        tenantId,
        userId,
      },
    );
    await eventBus.publish(event);
  } catch (error) {
    console.error("Error publishing carrier creation event:", error);
    // Don't throw - creation should succeed even if event publishing fails
  }

  return NextResponse.json(carrier, { status: 201 });
}

export const GET = withTransportationAPI(getHandler, {
  featureId: "carriers",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
export const POST = withTransportationAPI(postHandler, {
  featureId: "carriers",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
