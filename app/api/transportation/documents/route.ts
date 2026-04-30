/**
 * Transportation Documents API
 *
 * Tenant-scoped shipment/transport documents (BOL/AWB/CMR/customs docs etc.)
 * - Hardened via withTransportationAPI (auth + RBAC + tenant enforcement)
 * - Persistent via TransportationDatabaseAdapter
 * - Emits domain events + writes Evidence entries for auditability
 */

import { NextRequest, NextResponse } from "next/server";
import type { ShipmentDocument } from "@/types/tms";
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
    const shipmentId = sp.get("shipmentId") || undefined;
    const type = sp.get("type") || undefined;
    const status = sp.get("status") || undefined;
    const limit = Math.min(500, Math.max(1, Number(sp.get("limit") || 200)));
    const offset = Math.max(0, Number(sp.get("offset") || 0));

    const docs = await transportationDatabaseAdapterInstance.listDocuments({
      tenantId,
      shipmentId,
      type,
      status,
      limit,
      offset,
    });
    return NextResponse.json(docs);
  } catch (error) {
    console.error("Error listing transportation documents:", error);
    return NextResponse.json(
      { error: "Failed to list documents" },
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

    const body = (await request.json()) as Partial<ShipmentDocument>;
    const now = new Date().toISOString();

    if (!body.shipmentId || String(body.shipmentId).trim().length === 0) {
      return NextResponse.json(
        { error: "shipmentId is required" },
        { status: 400 },
      );
    }
    if (!body.type || String(body.type).trim().length === 0) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }
    if (!body.name || String(body.name).trim().length === 0) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.fileUrl || String(body.fileUrl).trim().length === 0) {
      return NextResponse.json(
        { error: "fileUrl is required" },
        { status: 400 },
      );
    }

    const doc: ShipmentDocument = {
      id: body.id || `DOC-${Date.now()}`,
      shipmentId: String(body.shipmentId),
      type: String(body.type),
      name: String(body.name),
      fileUrl: String(body.fileUrl),
      fileSize: typeof body.fileSize === "number" ? body.fileSize : undefined,
      mimeType: typeof body.mimeType === "string" ? body.mimeType : undefined,
      uploadedBy: userId,
      uploadedAt: body.uploadedAt || now,
      status: body.status || "PENDING",
      version: typeof body.version === "string" ? body.version : undefined,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      externalId:
        typeof body.externalId === "string" ? body.externalId : undefined,
      externalUrl:
        typeof body.externalUrl === "string" ? body.externalUrl : undefined,
      integrationSource:
        typeof body.integrationSource === "string"
          ? body.integrationSource
          : undefined,
    };

    await transportationDatabaseAdapterInstance.storeDocument(doc, {
      tenantId,
      createdBy: userId,
    });

    const evidence = await evidenceService.create({
      tenantId,
      type: "event",
      category: "compliance",
      title: `Transport document uploaded: ${doc.name}`,
      description: "Transportation document created via API",
      content: JSON.stringify(
        {
          documentId: doc.id,
          shipmentId: doc.shipmentId,
          type: doc.type,
          status: doc.status,
          fileUrl: doc.fileUrl,
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
          entityId: doc.id,
          entityType: "transport_document",
          relationship: "subject",
          addedAt: now,
        },
        {
          entityId: doc.shipmentId,
          entityType: "shipment",
          relationship: "related",
          addedAt: now,
        },
      ],
      tags: ["tms", "transportation", "documents"],
    });

    await eventBus.publish(
      createEvent(
        "transportation.document.created",
        doc.id,
        "ShipmentDocument",
        {
          documentId: doc.id,
          shipmentId: doc.shipmentId,
          type: doc.type,
          status: doc.status,
          evidenceId: evidence.id,
        },
        1,
        { tenantId, userId },
      ),
    );

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("Error creating transportation document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 },
    );
  }
}

export const GET = withTransportationAPI(listHandler, {
  featureId: "documents",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
export const POST = withTransportationAPI(createHandler, {
  featureId: "documents",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
