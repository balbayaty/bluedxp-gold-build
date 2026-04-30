import { NextRequest, NextResponse } from "next/server";
import { Equipment } from "@/types/warehouse-management";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string; equipmentId: string } },
) {
  try {
    const warehouseId = params.id;
    const equipmentId = params.equipmentId;

    // In a real implementation, fetch from database
    const equipment: Equipment = {
      id: equipmentId,
      name: "Forklift A1",
      type: "forklift",
      status: "operational",
      battery: 87,
      lastMaintenance: new Date("2024-01-15"),
      nextMaintenance: new Date("2024-02-15"),
      efficiency: 94.5,
      location: { x: 10, y: 20 },
    };

    // Generate mock performance history
    const performanceHistory = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
      efficiency: 94.5 + (Math.random() - 0.5) * 5,
    }));

    return NextResponse.json({
      success: true,
      equipment,
      performanceHistory,
    });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch equipment" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.equipment",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
