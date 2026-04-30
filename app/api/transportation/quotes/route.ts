/**
 * Quotes API
 */

import { NextRequest, NextResponse } from "next/server";
import type {
  Quote,
  Location,
  PricingModel,
  FreightCharges,
} from "@/types/tms";
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

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      500,
      Math.max(1, Number(searchParams.get("limit") || 200)),
    );
    const offset = Math.max(0, Number(searchParams.get("offset") || 0));

    const quotes = await transportationDatabaseAdapterInstance.listQuotes({
      tenantId,
      limit,
      offset,
    });
    return NextResponse.json(quotes);
  } catch (error) {
    console.error("Error listing quotes:", error);
    return NextResponse.json(
      { error: "Failed to list quotes" },
      { status: 500 },
    );
  }
}

async function handler(
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

    // Ensure origin and destination are Location objects
    const origin: Location = body.origin || {
      id: "origin-1",
      name: body.originName || "Origin",
      type: "ORIGIN",
      address: {
        street: body.originStreet || "",
        city: body.originCity || "",
        postalCode: body.originPostalCode || "",
        country: body.originCountry || "",
        countryCode: body.originCountryCode || "",
      },
    };

    const destination: Location = body.destination || {
      id: "dest-1",
      name: body.destinationName || "Destination",
      type: "DESTINATION",
      address: {
        street: body.destinationStreet || "",
        city: body.destinationCity || "",
        postalCode: body.destinationPostalCode || "",
        country: body.destinationCountry || "",
        countryCode: body.destinationCountryCode || "",
      },
    };

    // Build pricing model
    const pricing: PricingModel = body.pricing || {
      type: "FIXED",
      baseRate: body.baseRate || 0,
      currency: body.currency || "SAR",
    };

    // Build freight charges
    const baseRate = body.baseRate || pricing.baseRate || 0;
    const charges: FreightCharges = body.charges || {
      baseRate,
      currency: body.currency || "SAR",
      subtotal: baseRate,
      taxes: 0,
      total: baseRate,
    };

    // Generate quote based on request
    const quote: Quote = {
      id: `QT-${Date.now()}`,
      quoteNumber: body.quoteNumber || `QT-${Date.now()}`,
      shipmentId: body.shipmentId,
      origin,
      destination,
      mode: body.mode || "LAND",
      type: body.type || "FTL",
      weight: body.weight || 0,
      volume: body.volume || 0,
      value: body.value || 0,
      currency: body.currency || "SAR",
      pricing,
      charges,
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: "PENDING",
      carrierId: body.carrierId,
      carrierName: body.carrierName || "Unknown Carrier",
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    // Persist (tenant-scoped)
    await transportationDatabaseAdapterInstance.storeQuote(quote, {
      tenantId,
      createdBy: userId,
    });

    // Evidence + event (auditability + ecosystem integration)
    const evidence = await evidenceService.create({
      tenantId,
      type: "event",
      category: "financial",
      title: `Quote created: ${quote.quoteNumber}`,
      description: "Transportation quote created",
      content: JSON.stringify(
        {
          quoteId: quote.id,
          quoteNumber: quote.quoteNumber,
          shipmentId: quote.shipmentId,
          currency: quote.currency,
          total: (quote.charges as any)?.total,
          mode: quote.mode,
          type: quote.type,
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
          entityId: quote.id,
          entityType: "quote",
          relationship: "subject",
          addedAt: new Date().toISOString(),
        },
      ],
      tags: ["tms", "transportation", "quote"],
    } as any);

    await eventBus.publish(
      createEvent(
        "transportation.quote.created",
        quote.id,
        "Quote",
        {
          quoteId: quote.id,
          quoteNumber: quote.quoteNumber,
          shipmentId: quote.shipmentId,
          evidenceId: evidence.id,
        },
        1,
        { tenantId, userId },
      ),
    );

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json(
      { error: "Failed to create quote" },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(handler, {
  featureId: "quotes",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
export const GET = withTransportationAPI(listHandler, {
  featureId: "quotes",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
