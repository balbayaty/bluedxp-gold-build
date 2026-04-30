/**
 * Compliance API
 *
 * Hours of Service, ELD, regulatory compliance
 */

import { NextRequest, NextResponse } from "next/server";
import { transportationComplianceService } from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";

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
    const driverId = searchParams.get("driverId");
    const date = searchParams.get("date");
    const shipmentId = searchParams.get("shipmentId");
    const deviceId = searchParams.get("deviceId");

    if (action === "hos" && driverId && date) {
      const hos = await transportationComplianceService.getHoursOfService(
        driverId,
        new Date(date),
      );
      return NextResponse.json(hos);
    }

    if (action === "compliance" && shipmentId) {
      const shipment = await transportationDatabaseAdapterInstance.getShipment(
        tenantId,
        shipmentId,
      );
      if (!shipment)
        return NextResponse.json(
          { error: "Shipment not found" },
          { status: 404 },
        );

      const compliance = await transportationComplianceService.checkCompliance(
        shipment as any,
        { tenantId } as any,
      );
      return NextResponse.json(compliance);
    }

    if (action === "eld" && deviceId) {
      const eldData =
        await transportationComplianceService.getELDData(deviceId);
      return NextResponse.json(eldData);
    }

    return NextResponse.json(
      { error: "Invalid action or missing parameters" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error getting compliance data:", error);
    return NextResponse.json(
      {
        error: "Failed to get compliance data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

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
    const { shipmentId } = body;

    if (!shipmentId) {
      return NextResponse.json(
        { error: "Missing shipmentId" },
        { status: 400 },
      );
    }

    const shipment = await transportationDatabaseAdapterInstance.getShipment(
      tenantId,
      shipmentId,
    );
    if (!shipment)
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );

    const compliance = await transportationComplianceService.checkCompliance(
      shipment as any,
      { tenantId } as any,
    );

    return NextResponse.json(compliance);
  } catch (error) {
    console.error("Error checking compliance:", error);
    return NextResponse.json(
      {
        error: "Failed to check compliance",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const GET = withTransportationAPI(getHandler, {
  featureId: "compliance",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
export const POST = withTransportationAPI(postHandler, {
  featureId: "compliance",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
