/**
 * WMS Picking API
 * GET /api/wms/picking - Get pick tasks
 * POST /api/wms/picking - Create pick task or allocate shipment
 * 
 * Uses OutboundService with Prisma - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * GET /api/wms/picking - Get pick tasks
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const status = searchParams.get("status") || "";
    const waveId = searchParams.get("waveId") || "";
    const assignedTo = searchParams.get("assignedTo") || "";

    // Build where clause
    const where: any = {
      tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (waveId) {
      where.waveId = waveId;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    const tasks = await prisma.pickTask.findMany({
      where,
      include: {
        wave: true,
        shipment: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

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
      assignedTo: task.assignedTo,
      waveId: task.waveId,
      waveNumber: (task.wave as any)?.waveNumber || null,
      shipmentId: task.shipmentId,
      shipmentNumber: (task.shipment as any)?.shipmentNumber || null,
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
    console.error("Error fetching pick tasks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pick tasks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wms/picking - Create pick task
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId || body.tenantId || "default";

    if (!body.sku || !body.quantity) {
      return NextResponse.json(
        { success: false, error: "sku and quantity are required" },
        { status: 400 }
      );
    }

    const task = await prisma.pickTask.create({
      data: {
        tenantId,
        taskNumber: `PICK-${Date.now()}`,
        type: body.type || "PICK",
        priority: body.priority || "MEDIUM",
        status: "PENDING",
        fromBinId: body.fromBinId || "",
        toBinId: body.toBinId || "",
        sku: body.sku,
        quantity: body.quantity,
        pickedQty: 0,
        warehouseId: body.warehouseId || null,
        waveId: body.waveId || null,
        shipmentId: body.shipmentId || null,
        assignedTo: body.assignedTo || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: task.id,
          taskNumber: task.taskNumber,
          status: task.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating pick task:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create pick task" },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.picking",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.picking",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
