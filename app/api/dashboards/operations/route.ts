/**
 * Operations Manager Dashboard API
 * GET /api/dashboards/operations - Get aggregated operations dashboard data
 * 
 * Aggregates task progress, throughput, staffing, and wave data
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const warehouseId = searchParams.get("warehouseId") || "";

    // Build where clause for tasks
    const taskWhere: any = { tenantId };
    if (warehouseId) {
      // Tasks might be linked through shipments or waves
      // Adjust based on your schema
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch pick tasks
    const pickTasks = await prisma.pickTask.findMany({
      where: taskWhere,
      include: {
        shipment: {
          include: {
            lines: true,
          },
        },
        wave: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate picking progress
    const pickingTotal = pickTasks.length;
    const pickingCompleted = pickTasks.filter(
      (t) => t.status === "COMPLETED",
    ).length;
    const pickingProgress =
      pickingTotal > 0 ? (pickingCompleted / pickingTotal) * 100 : 0;

    // Calculate putaway progress (from inbound deliveries)
    const inboundDeliveries = await prisma.inboundDelivery.findMany({
      where: {
        tenantId,
        ...(warehouseId && { warehouseId }),
      },
      include: {
        lines: true,
      },
    });

    const putawayTotal = inboundDeliveries.filter(
      (d) => d.status === "RECEIVED" || d.status === "PUTAWAY_IN_PROGRESS",
    ).length;
    const putawayCompleted = inboundDeliveries.filter(
      (d) => d.status === "PUTAWAY_COMPLETED",
    ).length;
    const putawayProgress =
      putawayTotal > 0 ? (putawayCompleted / putawayTotal) * 100 : 0;

    // Calculate shipping progress (from shipments)
    const shipments = await prisma.shipment.findMany({
      where: {
        tenantId,
        ...(warehouseId && { warehouseId }),
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        lines: true,
      },
    });

    const shippingTotal = shipments.length;
    const shippingCompleted = shipments.filter(
      (s) => s.status === "DISPATCHED" || s.status === "IN_TRANSIT",
    ).length;
    const shippingProgress =
      shippingTotal > 0 ? (shippingCompleted / shippingTotal) * 100 : 0;

    // Calculate packing progress (estimate from shipments)
    const packingTotal = shipments.length;
    const packingCompleted = shipments.filter(
      (s) => s.status === "PACKED" || s.status === "DISPATCHED",
    ).length;
    const packingProgress =
      packingTotal > 0 ? (packingCompleted / packingTotal) * 100 : 0;

    // Calculate hourly throughput (last 12 hours)
    const hourlyThroughput = [];
    for (let i = 11; i >= 0; i--) {
      const hourStart = new Date();
      hourStart.setHours(hourStart.getHours() - i, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourEnd.getHours() + 1);

      const hourPicks = pickTasks.filter(
        (t) =>
          t.completedAt &&
          new Date(t.completedAt) >= hourStart &&
          new Date(t.completedAt) < hourEnd,
      ).length;

      const hourPacks = shipments.filter(
        (s) =>
          s.updatedAt >= hourStart &&
          s.updatedAt < hourEnd &&
          (s.status === "PACKED" || s.status === "DISPATCHED"),
      ).length;

      hourlyThroughput.push({
        hour: `${hourStart.getHours()}:00`,
        picks: hourPicks * 10, // Estimate units per pick task
        packs: hourPacks * 5, // Estimate units per shipment
        target: 120,
      });
    }

    // Fetch waves (WMSWave model)
    const waves = await prisma.wMSWave.findMany({
      where: {
        tenantId,
      },
      include: {
        PickTask: {
          include: {
            shipment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Map waves to dashboard format
    const waveStatus = waves.map((wave) => {
      // Get unique shipments from pick tasks
      const shipmentIds = new Set(
        wave.PickTask?.map((task) => task.shipmentId).filter(Boolean) || [],
      );
      const totalShipments = shipmentIds.size;
      
      // Count completed shipments (tasks with completed status)
      const completedTasks = wave.PickTask?.filter(
        (t) => t.status === "COMPLETED",
      ) || [];
      const completedShipments = new Set(
        completedTasks.map((t) => t.shipmentId).filter(Boolean),
      ).size;
      
      const progress =
        totalShipments > 0 ? (completedShipments / totalShipments) * 100 : 0;

      let status: "COMPLETED" | "IN_PROGRESS" | "RELEASED" | "PENDING" =
        "PENDING";
      if (progress === 100) status = "COMPLETED";
      else if (progress > 0) status = "IN_PROGRESS";
      else if (wave.status === "RELEASED" || wave.status === "PLANNING") status = "RELEASED";

      return {
        id: wave.waveNumber || wave.id,
        type: wave.type || "Outbound",
        status,
        progress: Math.round(progress),
        deadline: "N/A", // WMSWave doesn't have cutoffTime field
      };
    });

    // Calculate throughput (units per hour)
    const totalPicksToday = pickTasks.filter(
      (t) =>
        t.completedAt &&
        new Date(t.completedAt).toDateString() === today.toDateString(),
    ).length;
    const hoursWorked = 8; // Assume 8 hour shift
    const throughput = totalPicksToday * 10 / hoursWorked; // Estimate

    // Calculate order backlog
    const orderBacklog = await prisma.salesOrder.count({
      where: {
        tenantId,
        status: {
          in: ["CREATED", "CONFIRMED", "PICK_RELEASED"],
        },
      },
    });

    // Calculate efficiency (estimate based on on-time completion)
    const completedTasks = pickTasks.filter((t) => t.status === "COMPLETED");
    const onTimeTasks = completedTasks.filter((t) => {
      if (!t.completedAt || !t.createdAt) return false;
      const duration =
        new Date(t.completedAt).getTime() -
        new Date(t.createdAt).getTime();
      const expectedDuration = 30 * 60 * 1000; // 30 minutes
      return duration <= expectedDuration;
    });
    const efficiency =
      completedTasks.length > 0
        ? (onTimeTasks.length / completedTasks.length) * 100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        dailyProgress: [
          {
            name: "Picking",
            value: Math.round(pickingProgress),
            total: pickingTotal,
            completed: pickingCompleted,
            color: "#06b6d4",
          },
          {
            name: "Packing",
            value: Math.round(packingProgress),
            total: packingTotal,
            completed: packingCompleted,
            color: "#8b5cf6",
          },
          {
            name: "Shipping",
            value: Math.round(shippingProgress),
            total: shippingTotal,
            completed: shippingCompleted,
            color: "#10b981",
          },
          {
            name: "Putaway",
            value: Math.round(putawayProgress),
            total: putawayTotal,
            completed: putawayCompleted,
            color: "#f59e0b",
          },
        ],
        hourlyThroughput,
        waveStatus,
        metrics: {
          throughput: Math.round(throughput),
          orderBacklog,
          efficiency: Math.round(efficiency * 10) / 10,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching operations dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch operations dashboard data",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.operations.dashboard",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
