/**
 * Fleet Management API
 *
 * Fleet optimization, maintenance, fuel tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { fleetManagementService } from "@/lib/services/transportation";
import type {
  FleetVehicle,
  MaintenanceRecord,
} from "@/lib/services/transportation";
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
    const { action } = body;

    if (action === "optimize") {
      const { shipments } = body;
      if (!shipments || !Array.isArray(shipments)) {
        return NextResponse.json(
          { error: "Missing or invalid shipments array" },
          { status: 400 },
        );
      }

      const optimization =
        await fleetManagementService.optimizeFleetAssignment(shipments);
      return NextResponse.json(optimization);
    }

    if (action === "maintenance") {
      const { vehicleId, maintenance } = body;
      if (!vehicleId || !maintenance) {
        return NextResponse.json(
          { error: "Missing required fields: vehicleId, maintenance" },
          { status: 400 },
        );
      }

      const recordId = await fleetManagementService.scheduleMaintenance(
        vehicleId,
        maintenance,
      );
      return NextResponse.json({ recordId }, { status: 201 });
    }

    if (action === "fuel") {
      const { vehicleId, distance, fuelUsed } = body;
      if (!vehicleId || distance === undefined || fuelUsed === undefined) {
        return NextResponse.json(
          { error: "Missing required fields: vehicleId, distance, fuelUsed" },
          { status: 400 },
        );
      }

      await fleetManagementService.trackFuelConsumption(
        vehicleId,
        distance,
        fuelUsed,
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in fleet operation:", error);
    return NextResponse.json(
      {
        error: "Operation failed",
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
    const action = searchParams.get("action");

    if (action === "predictive-maintenance") {
      const recommendations =
        await fleetManagementService.getPredictiveMaintenance();
      return NextResponse.json(recommendations);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error getting fleet data:", error);
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
  featureId: "fleet",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
export const GET = withTransportationAPI(getHandler, {
  featureId: "fleet",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
