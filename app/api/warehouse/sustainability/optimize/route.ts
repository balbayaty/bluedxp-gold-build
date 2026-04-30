/**
 * Sustainability Optimization API
 * POST: Optimize shipment for sustainability
 */

import { NextRequest, NextResponse } from "next/server";
import { sustainabilityService } from "@/lib/services/wms/sustainabilityService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { shipmentId, options } = body;

    if (!shipmentId) {
      return NextResponse.json(
        { error: "shipmentId is required" },
        { status: 400 },
      );
    }

    if (!options || !Array.isArray(options) || options.length === 0) {
      return NextResponse.json(
        { error: "options array is required" },
        { status: 400 },
      );
    }

    const result = await sustainabilityService.optimizeForSustainability(
      shipmentId,
      options,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error optimizing for sustainability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to optimize for sustainability" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.sustainability.optimize",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
