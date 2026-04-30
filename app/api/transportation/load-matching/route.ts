/**
 * Load Matching API
 *
 * Match shippers with carriers for transportation loads
 */

import { NextRequest, NextResponse } from "next/server";
import { loadMatchingService } from "@/lib/services/transportation";
import type { LoadMatchingRequest } from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";

async function handler(request: NextRequest, context: { tenantId?: string }) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body: LoadMatchingRequest = await request.json();

    if (!body.origin || !body.destination || !body.cargo || !body.mode) {
      return NextResponse.json(
        { error: "Missing required fields: origin, destination, cargo, mode" },
        { status: 400 },
      );
    }

    const result = await loadMatchingService.findMatches({
      ...(body as any),
      tenantId,
    } as any);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error matching load:", error);
    return NextResponse.json(
      {
        error: "Failed to match load",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(handler, {
  featureId: "load-matching",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
