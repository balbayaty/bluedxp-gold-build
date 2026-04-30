import { NextRequest, NextResponse } from "next/server";
import { Warehouse } from "@/types/warehouse-management";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const warehouseId = params.id;

    // In a real implementation, fetch from database
    // For now, return mock data
    const warehouse: Warehouse = {
      id: warehouseId,
      name: "Riyadh Central Distribution Center",
      location: {
        address: "King Fahd Industrial City",
        city: "Riyadh",
        country: "Saudi Arabia",
        coordinates: { lat: 24.7136, lng: 46.6753 },
      },
      type: "main",
      status: "operational",
      capacity: {
        total: 50000,
        used: 42500,
        available: 7500,
        unit: "m³",
      },
      zones: [],
      environmental: {
        temperature: 23.2,
        humidity: 48,
        airQuality: 85,
        lighting: 92,
        noise: 45,
      },
      security: {
        cameras: 156,
        accessPoints: 24,
        alarms: 8,
        lastIncident: null,
      },
      iot: {
        sensors: 234,
        connectedDevices: 189,
        networkStatus: "excellent",
        dataPoints: 15600,
      },
      performance: {
        throughput: 94.5,
        accuracy: 99.7,
        efficiency: 91.2,
        uptime: 99.9,
      },
      staff: {
        total: 45,
        onDuty: 32,
        shift: "morning",
      },
    };

    return NextResponse.json({
      success: true,
      warehouse,
    });
  } catch (error) {
    console.error("Error fetching warehouse:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch warehouse" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.details",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
