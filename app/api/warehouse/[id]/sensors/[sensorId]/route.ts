import { NextRequest, NextResponse } from "next/server";
import { IoTSensor } from "@/types/warehouse-management";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string; sensorId: string } },
) {
  try {
    const warehouseId = params.id;
    const sensorId = params.sensorId;

    // In a real implementation, fetch from database
    const sensor: IoTSensor = {
      id: sensorId,
      warehouseId: warehouseId,
      zoneId: "zone-001",
      type: "temperature",
      name: "Temperature Sensor A1",
      value: 23.5,
      unit: "°C",
      status: "online",
      lastReading: new Date(),
      batteryLevel: 87,
      threshold: { min: 18, max: 25 },
      alerts: false,
    };

    // Generate mock historical data
    const historicalData = Array.from({ length: 50 }, (_, i) => ({
      timestamp: new Date(Date.now() - (50 - i) * 60000),
      value: 23.5 + (Math.random() - 0.5) * 2,
    }));

    return NextResponse.json({
      success: true,
      sensor,
      historicalData,
    });
  } catch (error) {
    console.error("Error fetching sensor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sensor" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.sensors",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
