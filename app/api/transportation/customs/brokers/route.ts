/**
 * Customs Brokers API
 */

import { NextRequest, NextResponse } from "next/server";
import type { CustomsBroker } from "@/types/tms";
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
    const country = searchParams.get("country");
    const status = searchParams.get("status");

    let filtered =
      await transportationDatabaseAdapterInstance.listCustomsBrokers({
        tenantId,
        country: country || undefined,
        status: status || undefined,
        limit: 500,
        offset: 0,
      });

    // Optional seed (dev-friendly). Disabled by default in production to avoid demo data.
    const allowSeed =
      process.env.TMS_SEED_DATA === "true" ||
      (process.env.NODE_ENV !== "production" &&
        process.env.TMS_SEED_DATA !== "false");
    if (allowSeed && filtered.length === 0) {
      const seed: CustomsBroker = {
        id: "CB-SEED-1",
        name: "Default Customs Broker",
        licenseNumber: "CB-SEED",
        country: country || "Saudi Arabia",
        contactPerson: "Broker Ops",
        email: "broker@example.com",
        phone: "",
        coverage: {
          countries: [country || "Saudi Arabia"],
          customsOffices: [],
        },
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await transportationDatabaseAdapterInstance.storeCustomsBroker(seed, {
        tenantId,
        createdBy: "system",
      });
      filtered = await transportationDatabaseAdapterInstance.listCustomsBrokers(
        { tenantId, limit: 500, offset: 0 },
      );
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching brokers:", error);
    return NextResponse.json(
      { error: "Failed to fetch brokers" },
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

    const broker: CustomsBroker = {
      id: `CB-${Date.now()}`,
      ...body,
      status: body.status || "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await transportationDatabaseAdapterInstance.storeCustomsBroker(broker, {
      tenantId,
      createdBy: userId,
    });

    const evidence = await evidenceService.create({
      tenantId,
      type: "event",
      category: "compliance",
      title: `Customs broker created: ${broker.name}`,
      description: "Customs broker created via Transportation API",
      content: JSON.stringify(
        {
          brokerId: broker.id,
          name: broker.name,
          country: broker.country,
          status: broker.status,
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
          entityId: broker.id,
          entityType: "customs_broker",
          relationship: "subject",
          addedAt: new Date().toISOString(),
        },
      ],
      tags: ["tms", "transportation", "customs", "broker"],
    } as any);

    await eventBus.publish(
      createEvent(
        "transportation.customs.broker.created",
        broker.id,
        "CustomsBroker",
        {
          brokerId: broker.id,
          name: broker.name,
          country: broker.country,
          evidenceId: evidence.id,
        },
        1,
        { tenantId, userId },
      ),
    );

    return NextResponse.json(broker, { status: 201 });
  } catch (error) {
    console.error("Error creating broker:", error);
    return NextResponse.json(
      { error: "Failed to create broker" },
      { status: 500 },
    );
  }
}

export const GET = withTransportationAPI(getHandler, {
  featureId: "customs-brokers",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
export const POST = withTransportationAPI(postHandler, {
  featureId: "customs-brokers",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
