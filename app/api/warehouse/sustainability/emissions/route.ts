/**
 * Shipment Emissions API
 * POST: Calculate emissions for a shipment
 */

import { NextRequest, NextResponse } from "next/server";
import {
  sustainabilityService,
  ShipmentRoute,
} from "@/lib/services/wms/sustainabilityService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { shipmentId, route } = body;

    if (!shipmentId) {
      return NextResponse.json(
        { error: "shipmentId is required" },
        { status: 400 },
      );
    }

    if (!route) {
      return NextResponse.json({ error: "route is required" }, { status: 400 });
    }

    const emissions = await sustainabilityService.calculateShipmentEmissions(
      shipmentId,
      route as ShipmentRoute,
    );

    return NextResponse.json({ emissions, unit: "kg CO2" });
  } catch (error: any) {
    console.error("Error calculating emissions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate emissions" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.sustainability.emissions",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
