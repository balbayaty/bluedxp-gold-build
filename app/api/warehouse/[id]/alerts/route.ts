import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const warehouseId = params.id;

    // In a real implementation, fetch alerts from database
    // For now, return mock data
    const alerts = [
      {
        id: "alert-001",
        type: "warning",
        title: "High Utilization",
        message: "Zone A utilization is above 90%",
        timestamp: new Date().toISOString(),
        priority: "high",
        actionUrl: `/warehouses/${warehouseId}/zones/zone-a`,
      },
      {
        id: "alert-002",
        type: "info",
        title: "Maintenance Scheduled",
        message: "Forklift A1 maintenance due in 2 days",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        priority: "medium",
        actionUrl: `/warehouses/${warehouseId}?tab=operations`,
      },
      {
        id: "alert-003",
        type: "success",
        title: "Cycle Count Complete",
        message: "Zone B cycle count completed with 99.8% accuracy",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        priority: "low",
      },
    ];

    return NextResponse.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch alerts" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.alerts",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
