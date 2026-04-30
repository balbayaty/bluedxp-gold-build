/**
 * Supervisor Dashboard API
 * GET /api/dashboards/supervisor - Get supervisor dashboard data
 * 
 * Aggregates tasks, exceptions, and team status
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
    }

    // Fetch pick tasks
    const pickTasks = await prisma.pickTask.findMany({
      where: taskWhere,
      include: {
        shipment: true,
        wave: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Map tasks to dashboard format
    const tasks = pickTasks.map((task) => ({
      id: task.id,
      taskNumber: task.taskNumber || `TSK-${task.id.slice(-8)}`,
      type: "Picking",
      priority:
        task.priority === "URGENT"
          ? "Critical"
          : task.priority === "HIGH"
            ? "High"
            : task.priority === "MEDIUM"
              ? "Medium"
              : "Low",
      status:
        task.status === "PENDING"
          ? "Pending"
          : task.status === "ASSIGNED"
            ? "Assigned"
            : task.status === "IN_PROGRESS"
              ? "In Progress"
              : task.status === "COMPLETED"
                ? "Completed"
                : "Cancelled",
      assignee: task.assignedUserId || "Unassigned",
      zone: task.fromBinId?.split("-")[0] || "Unknown",
    }));

    // Calculate task metrics
    const openTasks = tasks.filter(
      (t) => t.status === "Pending" || t.status === "Assigned",
    ).length;

    // Fetch exceptions (from quality issues, inventory discrepancies, etc.)
    // Note: Exceptions might be stored in different tables
    // For now, we'll derive from task statuses and inventory issues
    const exceptions: Array<{
      id: string;
      type: string;
      location: string;
      item: string;
      reportedBy: string;
      time: string;
    }> = [];

    // Get inventory discrepancies (cycle count variances)
    const cycleCounts = await prisma.cycleCount.findMany({
      where: {
        tenantId,
        status: {
          in: ["PLANNED", "IN_PROGRESS", "COMPLETED"],
        },
      },
      include: {
        CycleCountTask: {
          include: {
            StorageBin: true,
            MaterialMaster: true,
          },
        },
      },
      take: 10,
    });

    cycleCounts.forEach((cc) => {
      cc.CycleCountTask?.forEach((task) => {
        // Check for variance between expected and counted quantity
        if (task.countedQty !== null && task.expectedQty !== task.countedQty) {
          exceptions.push({
            id: `EX-${cc.id.slice(-6)}-${task.id.slice(-4)}`,
            type: "Inventory Discrepancy",
            location: task.binId || "Unknown",
            item: task.materialId || task.MaterialMaster?.materialNumber || "Unknown",
            reportedBy: cc.createdBy || "System",
            time: new Date(cc.createdAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }),
          });
        }
      });
    });

    // Get quality issues (from inspections)
    const qualityIssues = await prisma.qhse_inspections.findMany({
      where: {
        tenantId,
        status: {
          in: ["FAILED", "NON_CONFORMANCE", "REQUIRES_ACTION"],
        },
      },
      take: 10,
    });

    qualityIssues.forEach((issue) => {
      exceptions.push({
        id: `EX-QC-${issue.id.slice(-6)}`,
        type: "Quality Issue",
        location: issue.location || "Unknown",
        item: issue.inspectionNumber || "Unknown",
        reportedBy: issue.conductedBy || issue.scheduledBy || "QC",
        time: new Date(issue.createdAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      });
    });

    // Calculate shift progress (estimate based on current time)
    const now = new Date();
    const shiftStart = new Date(now);
    shiftStart.setHours(8, 0, 0, 0); // 8 AM shift start
    const shiftEnd = new Date(shiftStart);
    shiftEnd.setHours(16, 0, 0, 0); // 4 PM shift end

    let shiftProgress = 0;
    if (now >= shiftStart && now <= shiftEnd) {
      const elapsed = now.getTime() - shiftStart.getTime();
      const total = shiftEnd.getTime() - shiftStart.getTime();
      shiftProgress = (elapsed / total) * 100;
    } else if (now > shiftEnd) {
      shiftProgress = 100;
    }

    return NextResponse.json({
      success: true,
      data: {
        tasks: tasks.slice(0, 20), // Limit to 20 most recent
        exceptions: exceptions.slice(0, 10), // Limit to 10 most recent
        metrics: {
          openTasks,
          activeExceptions: exceptions.length,
          shiftProgress: Math.round(shiftProgress),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching supervisor dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch supervisor dashboard data",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.supervisor.dashboard",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
