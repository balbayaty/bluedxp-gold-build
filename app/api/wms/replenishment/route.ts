/**
 * WMS Replenishment API
 * GET /api/wms/replenishment - Get replenishment tasks
 * POST /api/wms/replenishment/calculate - Calculate and create replenishment tasks
 * 
 * Uses ReplenishmentService with Prisma - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { ReplenishmentService } from "@/lib/services/wms/ReplenishmentService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * GET /api/wms/replenishment - Get pending replenishment tasks
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId = context.tenantId || "default";
    
    const tasks = await ReplenishmentService.getReplenishmentTasks(tenantId);
    
    // Map to expected format
    const mappedTasks = tasks.map((task) => ({
      id: task.id,
      taskNumber: task.taskNumber,
      type: task.type,
      priority: task.priority,
      status: task.status,
      fromBinId: task.fromBinId,
      toBinId: task.toBinId,
      sku: task.sku,
      quantity: task.quantity,
      pickedQty: task.pickedQty,
      warehouseId: task.warehouseId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: mappedTasks,
      count: mappedTasks.length,
    });
  } catch (error) {
    console.error("Error fetching replenishment tasks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch replenishment tasks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wms/replenishment - Calculate and create replenishment tasks
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId = context.tenantId || "default";
    
    const tasks = await ReplenishmentService.calculateReplenishmentNeeds(tenantId);
    
    return NextResponse.json({
      success: true,
      data: tasks,
      count: tasks.length,
      message: `Created ${tasks.length} replenishment tasks`,
    });
  } catch (error) {
    console.error("Error calculating replenishment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate replenishment needs" },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.replenishment",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.replenishment",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
