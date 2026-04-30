/**
 * Customs Authorities API (Transportation)
 *
 * Tenant-scoped list/create for customs authorities and requirements.
 */

import { NextRequest, NextResponse } from "next/server";
import type { CustomsAuthority } from "@/types/tms";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import { evidenceService } from "@/lib/services/evidence";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";

async function listHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const sp = request.nextUrl.searchParams;
    const country = sp.get("country") || undefined;
    const status = sp.get("status") || undefined;
    const limit = Math.min(500, Math.max(1, Number(sp.get("limit") || 200)));
    const offset = Math.max(0, Number(sp.get("offset") || 0));

    const authorities =
      await transportationDatabaseAdapterInstance.listCustomsAuthorities({
        tenantId,
        country,
        status,
        limit,
        offset,
      });
    return NextResponse.json(authorities);
  } catch (error) {
    console.error("Error listing customs authorities:", error);
    return NextResponse.json(
      { error: "Failed to list customs authorities" },
      { status: 500 },
    );
  }
}

async function createHandler(
  request: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  try {
    const tenantId = context.tenantId;
    const userId = context.userId || "api-user";
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body = (await request.json()) as Partial<CustomsAuthority>;
    const now = new Date().toISOString();

    if (!body.code || String(body.code).trim().length === 0)
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    if (!body.name || String(body.name).trim().length === 0)
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!body.country || String(body.country).trim().length === 0)
      return NextResponse.json(
        { error: "country is required" },
        { status: 400 },
      );

    const authority: CustomsAuthority = {
      id: body.id || `CA-${Date.now()}`,
      code: String(body.code),
      name: String(body.name),
      country: String(body.country),
      region: typeof body.region === "string" ? body.region : undefined,
      offices: Array.isArray(body.offices) ? body.offices : [],
      requirements: Array.isArray(body.requirements) ? body.requirements : [],
      workingHours:
        typeof body.workingHours === "string" ? body.workingHours : undefined,
      timezone: typeof body.timezone === "string" ? body.timezone : undefined,
      status: body.status || "ACTIVE",
      createdAt: body.createdAt || now,
      updatedAt: body.updatedAt || now,
    };

    await transportationDatabaseAdapterInstance.storeCustomsAuthority(
      authority,
      { tenantId, createdBy: userId },
    );

    const evidence = await evidenceService.create({
      tenantId,
      type: "event",
      category: "compliance",
      title: `Customs authority created: ${authority.name}`,
      description: "Customs authority created via Transportation API",
      content: JSON.stringify(
        {
          authorityId: authority.id,
          code: authority.code,
          country: authority.country,
          status: authority.status,
        },
        null,
        2,
      ),
      createdBy: userId,
      metadata: {
        source: "transportation-api",
        capturedAt: now,
        capturedMethod: "api",
      },
      relatedEntities: [
        {
          entityId: authority.id,
          entityType: "customs_authority",
          relationship: "subject",
          addedAt: now,
        },
      ],
      tags: ["tms", "transportation", "customs", "authority"],
    });

    await eventBus.publish(
      createEvent(
        "transportation.customs.authority.created",
        authority.id,
        "CustomsAuthority",
        {
          authorityId: authority.id,
          code: authority.code,
          country: authority.country,
          evidenceId: evidence.id,
        },
        1,
        { tenantId, userId },
      ),
    );

    return NextResponse.json(authority, { status: 201 });
  } catch (error) {
    console.error("Error creating customs authority:", error);
    return NextResponse.json(
      { error: "Failed to create customs authority" },
      { status: 500 },
    );
  }
}

export const GET = withTransportationAPI(listHandler, {
  featureId: "customs-authorities",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
export const POST = withTransportationAPI(createHandler, {
  featureId: "customs-authorities",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
