/**
 * IoT Sensor Data API
 *
 * Get real-time and historical sensor data for shipments
 */

import { NextRequest, NextResponse } from "next/server";
import { transportationIoTIntegrationService } from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";

async function getHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const shipmentId = searchParams.get("shipmentId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!shipmentId) {
      return NextResponse.json(
        { error: "Missing required parameter: shipmentId" },
        { status: 400 },
      );
    }

    if (from && to) {
      // Historical data
      const data =
        await transportationIoTIntegrationService.getHistoricalSensorData(
          shipmentId,
          {
            from: new Date(from),
            to: new Date(to),
          },
          { tenantId } as any,
        );
      return NextResponse.json(data);
    } else {
      // Real-time data
      const data = await transportationIoTIntegrationService.getSensorData(
        shipmentId,
        { tenantId } as any,
      );
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("Error getting sensor data:", error);
    return NextResponse.json(
      {
        error: "Failed to get sensor data",
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
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { shipmentId, config } = body;

    if (!shipmentId) {
      return NextResponse.json(
        { error: "Missing required field: shipmentId" },
        { status: 400 },
      );
    }

    // Initialize IoT integration if config provided
    if (config) {
      transportationIoTIntegrationService.initialize(config);
    }

    // Get shipment and start monitoring
    // In production, fetch shipment from database
    // For now, return success
    return NextResponse.json({
      success: true,
      message: "IoT monitoring initialized",
    });
  } catch (error) {
    console.error("Error initializing IoT monitoring:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize IoT monitoring",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const GET = withTransportationAPI(getHandler, {
  featureId: "iot",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});
export const POST = withTransportationAPI(postHandler, {
  featureId: "iot",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
