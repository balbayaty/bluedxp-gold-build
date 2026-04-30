/**
 * Customs Declarations API
 */

import { NextRequest, NextResponse } from "next/server";
import type { CustomsInfo } from "@/types/tms";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import { evidenceService } from "@/lib/services/evidence";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";

async function getHandler(
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

    const searchParams = request.nextUrl.searchParams;
    const shipmentId = searchParams.get("shipmentId");
    const status = searchParams.get("status");

    const filtered =
      await transportationDatabaseAdapterInstance.listCustomsDeclarations({
        tenantId,
        shipmentId: shipmentId || undefined,
        status: status || undefined,
        limit: 500,
        offset: 0,
      });

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching declarations:", error);
    return NextResponse.json(
      { error: "Failed to fetch declarations" },
      { status: 500 },
    );
  }
}

async function postHandler(
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

    const body = await request.json();

    const declaration: CustomsInfo & { id?: string; shipmentId?: string } = {
      status: body.status || "PENDING",
      declarationNumber: body.declarationNumber || `CD-${Date.now()}`,
      documents: body.documents || [],
      customsValue: body.customsValue || 0,
      currency: body.currency || "SAR",
      countryOfOrigin: body.countryOfOrigin || "",
      countryOfDestination: body.countryOfDestination || "",
      inspectionRequired: body.inspectionRequired || false,
      brokerId: body.brokerId,
      brokerName: body.brokerName,
      brokerLicense: body.brokerLicense,
      hsCode: body.hsCode,
      duties: body.duties,
      taxes: body.taxes,
      complianceStatus: body.complianceStatus || "PENDING",
      id: `CD-${Date.now()}`,
      shipmentId: body.shipmentId,
    };

    await transportationDatabaseAdapterInstance.storeCustomsDeclaration(
      declaration as any,
      { tenantId, createdBy: userId },
    );

    const evidence = await evidenceService.create({
      tenantId,
      type: "event",
      category: "compliance",
      title: `Customs declaration created: ${declaration.declarationNumber}`,
      description: "Customs declaration created via Transportation API",
      content: JSON.stringify(
        {
          declarationId: declaration.id,
          declarationNumber: declaration.declarationNumber,
          shipmentId: declaration.shipmentId,
          status: declaration.status,
        },
        null,
        2,
      ),
      createdBy: userId,
      metadata: {
        source: "transportation-api",
        capturedAt: new Date().toISOString(),
        capturedMethod: "api",
      },
      relatedEntities: [
        {
          entityId: String(declaration.id),
          entityType: "customs_declaration",
          relationship: "subject",
          addedAt: new Date().toISOString(),
        },
      ],
      tags: ["tms", "transportation", "customs", "declaration"],
    } as any);

    await eventBus.publish(
      createEvent(
        "transportation.customs.declaration.created",
        String(declaration.id),
        "CustomsDeclaration",
        {
          declarationId: declaration.id,
          shipmentId: declaration.shipmentId,
          status: declaration.status,
          evidenceId: evidence.id,
        },
        1,
        { tenantId, userId },
      ),
    );

    return NextResponse.json(declaration, { status: 201 });
  } catch (error) {
    console.error("Error creating declaration:", error);
    return NextResponse.json(
      { error: "Failed to create declaration" },
      { status: 500 },
    );
  }
}

export const GET = withTransportationAPI(getHandler, {
  featureId: "customs-declarations",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
export const POST = withTransportationAPI(postHandler, {
  featureId: "customs-declarations",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
