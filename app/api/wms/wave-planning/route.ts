/**
 * WMS Wave Planning API
 * GET /api/wms/wave-planning - Get waves
 * POST /api/wms/wave-planning - Create wave
 * 
 * Uses OutboundService with Prisma - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { OutboundService } from "@/lib/services/wms/OutboundService";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { eventBus, createEvent } from "@/lib/services/event-store";

/**
 * GET /api/wms/wave-planning - Get waves
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const status = searchParams.get("status") || "";

    // Build where clause
    const where: any = {
      tenantId,
    };

    if (status) {
      where.status = status;
    }

    const waves = await prisma.wMSWave.findMany({
      where,
      include: {
        tasks: {
          include: {
            shipment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Map to wave format
    const mappedWaves = waves.map((wave) => {
      const shipments = wave.tasks
        .map((task) => task.shipment)
        .filter((s) => s !== null) as any[];

      const uniqueShipments = Array.from(
        new Map(shipments.map((s) => [s.id, s])).values()
      );

      const totalItems = wave.tasks.reduce((sum, task) => sum + (task.quantity || 0), 0);
      const totalValue = uniqueShipments.reduce((sum, s) => sum + (s.totalValue || 0), 0);

      return {
        id: wave.id,
        waveNumber: wave.waveNumber,
        waveName: `Wave ${wave.waveNumber}`,
        waveType: wave.type || "STANDARD",
        status: wave.status,
        totalOrders: uniqueShipments.length,
        totalItems,
        totalValue,
        orderNumbers: uniqueShipments.map((s) => s.orderNumber || s.shipmentNumber).filter(Boolean),
        createdAt: wave.createdAt,
        updatedAt: wave.updatedAt,
        estimatedDuration: 0,
        actualDuration: undefined,
      };
    });

    return NextResponse.json({
      success: true,
      data: mappedWaves,
      count: mappedWaves.length,
    });
  } catch (error) {
    console.error("Error fetching waves:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch waves" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wms/wave-planning - Create wave
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId || body.tenantId || "default";

    const wave = await OutboundService.createWave({
      tenantId,
      cutoffTime: body.cutoffTime ? new Date(body.cutoffTime) : undefined,
      carrier: body.carrier || undefined,
      isUrgent: body.isUrgent || false,
      limit: body.limit || 50,
    });

    // Publish event to Event Bus
    try {
      const event = createEvent(
        "wms.wave.created",
        wave.id,
        "WAVE",
        {
          waveId: wave.id,
          waveNumber: wave.waveNumber,
          status: wave.status,
          tenantId,
          type: wave.type,
          createdAt: new Date(),
        },
        1,
        {
          tenantId,
          userId: context.userId || "system",
        },
      );
      await eventBus.publish(event);
    } catch (error) {
      console.error("Error publishing wave creation event:", error);
      // Don't throw - creation should succeed even if event publishing fails
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: wave.id,
          waveNumber: wave.waveNumber,
          status: wave.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating wave:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create wave" },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.wave_planning",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.wave_planning",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
