/**
 * Pricing Intelligence API
 *
 * Get market rates, pricing intelligence, and recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { pricingIntelligenceService } from "@/lib/services/transportation";
import type { PricingIntelligenceRequest } from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";

async function handler(request: NextRequest, context: { tenantId?: string }) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body: PricingIntelligenceRequest = await request.json();

    // Validate required fields
    if (
      !body.origin ||
      !body.destination ||
      !body.mode ||
      !body.type ||
      !body.cargo
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: origin, destination, mode, type, cargo",
        },
        { status: 400 },
      );
    }

    // Get pricing intelligence
    const intelligence =
      await pricingIntelligenceService.getPricingIntelligence({
        ...(body as any),
        tenantId,
      } as any);

    return NextResponse.json(intelligence);
  } catch (error) {
    console.error("Error getting pricing intelligence:", error);
    return NextResponse.json(
      {
        error: "Failed to get pricing intelligence",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(handler, {
  featureId: "pricing-intelligence",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
