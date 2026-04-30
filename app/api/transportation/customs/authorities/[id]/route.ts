/**
 * Customs Authority Detail API (Transportation)
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import { evidenceService } from "@/lib/services/evidence";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";

async function getHandler(
  _request: NextRequest,
  context: { tenantId?: string },
  params: { id: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const authority =
      await transportationDatabaseAdapterInstance.getCustomsAuthority(
        tenantId,
        params.id,
      );
    if (!authority)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(authority);
  } catch (error) {
    console.error("Error fetching customs authority:", error);
    return NextResponse.json(
      { error: "Failed to fetch customs authority" },
      { status: 500 },
    );
  }
}

async function patchHandler(
  request: NextRequest,
  context: { tenantId?: string; userId?: string },
  params: { id: string },
) {
  try {
    const tenantId = context.tenantId;
    const userId = context.userId || "api-user";
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const existing =
      await transportationDatabaseAdapterInstance.getCustomsAuthority(
        tenantId,
        params.id,
      );
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const patch = (await request.json()) as Partial<typeof existing>;
    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...patch,
      updatedAt: now,
    };

    await transportationDatabaseAdapterInstance.storeCustomsAuthority(updated, {
      tenantId,
      createdBy: userId,
    });

    const evidence = await evidenceService.create({
      tenantId,
      type: "event",
      category: "compliance",
      title: `Customs authority updated: ${updated.name}`,
      description: "Customs authority updated via Transportation API",
      content: JSON.stringify(
        {
          authorityId: updated.id,
          code: updated.code,
          country: updated.country,
          status: updated.status,
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
          entityId: updated.id,
          entityType: "customs_authority",
          relationship: "subject",
          addedAt: now,
        },
      ],
      tags: ["tms", "transportation", "customs", "authority"],
    });

    await eventBus.publish(
      createEvent(
        "transportation.customs.authority.updated",
        updated.id,
        "CustomsAuthority",
        {
          authorityId: updated.id,
          code: updated.code,
          country: updated.country,
          status: updated.status,
          evidenceId: evidence.id,
        },
        1,
        { tenantId, userId },
      ),
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating customs authority:", error);
    return NextResponse.json(
      { error: "Failed to update customs authority" },
      { status: 500 },
    );
  }
}

export const GET = withTransportationAPI(
  async (req: NextRequest, ctx: { tenantId?: string }) => {
    const id = req.nextUrl.pathname.split("/").pop() || "";
    if (!id)
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    return getHandler(req, ctx, { id });
  },
  {
    featureId: "customs-authorities",
    action: "read_only",
    requireAuth: true,
    rateLimit: true,
  },
);

export const PATCH = withTransportationAPI(
  async (req: NextRequest, ctx: { tenantId?: string; userId?: string }) => {
    const id = req.nextUrl.pathname.split("/").pop() || "";
    if (!id)
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    return patchHandler(req, ctx, { id });
  },
  {
    featureId: "customs-authorities",
    action: "update",
    requireAuth: true,
    rateLimit: true,
  },
);
