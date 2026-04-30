/**
 * ELM/Rabet.sa Government Integration API
 *
 * Integration with Saudi Arabia's ELM/Rabet.sa for truck tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { elmRabetAdapter } from "@/lib/adapters/government/elmRabetAdapter";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";

async function postHandler(
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

    const body = await request.json();
    const { action, config } = body;

    if (action === "initialize" && config) {
      elmRabetAdapter.initialize(config);
      return NextResponse.json({
        success: true,
        message: "ELM/Rabet adapter initialized",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error initializing ELM adapter:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

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
    const truckId = searchParams.get("truckId");
    const plateNumber = searchParams.get("plateNumber");
    const shipmentId = searchParams.get("shipmentId");
    const action = searchParams.get("action");

    if (action === "truck" && truckId) {
      const result = await elmRabetAdapter.getTruckData(truckId);
      return NextResponse.json(result);
    }

    if (action === "plate" && plateNumber) {
      const result = await elmRabetAdapter.getTruckByPlate(plateNumber);
      return NextResponse.json(result);
    }

    if (action === "tracking" && shipmentId) {
      const events = await elmRabetAdapter.getShipmentTracking(shipmentId);
      return NextResponse.json(events);
    }

    if (action === "sensors" && truckId) {
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      const timeRange =
        from && to
          ? {
              from: new Date(from),
              to: new Date(to),
            }
          : undefined;

      const data = await elmRabetAdapter.getSensorData(truckId, timeRange);
      return NextResponse.json(data);
    }

    if (action === "compliance" && truckId) {
      const compliance = await elmRabetAdapter.getComplianceStatus(truckId);
      return NextResponse.json(compliance);
    }

    return NextResponse.json(
      { error: "Invalid action or missing parameters" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error getting ELM data:", error);
    return NextResponse.json(
      {
        error: "Failed to get data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withTransportationAPI(postHandler, {
  featureId: "integration",
  action: "configure",
  requireAuth: true,
  rateLimit: true,
});
export const GET = withTransportationAPI(getHandler, {
  featureId: "integration",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
