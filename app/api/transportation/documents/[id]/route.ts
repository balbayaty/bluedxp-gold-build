/**
 * Transportation Document Detail API
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

    const doc = await transportationDatabaseAdapterInstance.getDocument(
      tenantId,
      params.id,
    );
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error("Error fetching transportation document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
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

    const existing = await transportationDatabaseAdapterInstance.getDocument(
      tenantId,
      params.id,
    );
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const patch = (await request.json()) as Partial<typeof existing>;
    const updated = {
      ...existing,
      ...patch,
    };

    await transportationDatabaseAdapterInstance.storeDocument(updated, {
      tenantId,
      createdBy: userId,
    });

    const now = new Date().toISOString();
    const evidence = await evidenceService.create({
      tenantId,
      type: "event",
      category: "compliance",
      title: `Transport document updated: ${updated.name}`,
      description: "Transportation document updated via API",
      content: JSON.stringify(
        {
          documentId: updated.id,
          shipmentId: updated.shipmentId,
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
          entityType: "transport_document",
          relationship: "subject",
          addedAt: now,
        },
        {
          entityId: updated.shipmentId,
          entityType: "shipment",
          relationship: "related",
          addedAt: now,
        },
      ],
      tags: ["tms", "transportation", "documents"],
    });

    await eventBus.publish(
      createEvent(
        "transportation.document.updated",
        updated.id,
        "ShipmentDocument",
        {
          documentId: updated.id,
          shipmentId: updated.shipmentId,
          status: updated.status,
          evidenceId: evidence.id,
        },
        1,
        { tenantId, userId },
      ),
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating transportation document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
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
    featureId: "documents",
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
    featureId: "documents",
    action: "update",
    requireAuth: true,
    rateLimit: true,
  },
);
