"use server";

import { CycleCountService } from "@/lib/services/wms/cycleCountService";
import { prisma } from "@/lib/services/database/prismaClient";
import { revalidatePath } from "next/cache";

export async function createCountSession(data: {
  description: string;
  type: string;
}) {
  // TODO: Get real user ID from session
  const userId = "user-123";

  const session = await CycleCountService.createSession(
    "tenant-1",
    data.type,
    data.description,
    new Date(),
    userId,
  );

  // Generating tasks immediately for demo purposes
  await CycleCountService.generateTasks(session.id, { limit: 20 });

  revalidatePath("/cycle-counting");
}

export async function generateCycleCountTasks(cycleCountId: string) {
  await CycleCountService.generateTasks(cycleCountId, { limit: 20 });
  revalidatePath("/cycle-counting");
}

export async function submitTaskCount(taskId: string, quantity: number) {
  // TODO: User ID
  await CycleCountService.submitCount(taskId, quantity, "user-123");
  revalidatePath("/cycle-counting");
}

export async function completeCycleCount(countId: string) {
  await prisma.cycleCount.update({
    where: { id: countId },
    data: { status: "COMPLETED", completedDate: new Date() },
  });
  revalidatePath("/cycle-counting");
}

export async function approveDiscrepancy(taskId: string) {
  // TODO: User ID
  await CycleCountService.approveDiscrepancy(taskId, "user-123");
  revalidatePath("/cycle-counting");
}

export async function getCycleCounts() {
  const counts = await prisma.cycleCount.findMany({
    include: {
      tasks: {
        include: {
          bin: true,
          material: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Adapter: Map DB Record -> Frontend Type
  return counts.map((count) => ({
    id: count.id,
    countNumber: count.reference,
    countType: count.type,
    status: count.status,
    totalItems: count.tasks.length,
    countedItems: count.tasks.filter((t) => t.status !== "PENDING").length,
    completionPercentage:
      count.tasks.length > 0
        ? (count.tasks.filter((t) => t.status !== "PENDING").length /
            count.tasks.length) *
          100
        : 0,
    items: count.tasks.map((task) => ({
      id: task.id,
      materialNumber: task.material?.materialNumber || "UNKNOWN",
      materialDescription: task.material?.description || "Unknown Material",
      bookQuantity: task.expectedQty,
      countedQuantity: task.countedQty || 0,
      unit: "EA",
      unitPrice: 10, // Mock price for now
      totalValue: task.expectedQty * 10,
      status: task.status,
      location: {
        id: task.binId,
        locationCode: task.bin.code,
        zone: task.bin.areaId, // Using areaId as Zone
        // Parse code for aisle/rack/shelf if possible, else defaults
        aisle: task.bin.code.split("-")[0] || "0",
        rack: task.bin.code.split("-")[1] || "0",
        shelf: task.bin.code.split("-")[2] || "0",
        bin: task.bin.code.split("-")[3] || "0",
        coordinates: { x: 0, y: 0, z: 0 },
        accessibility: "EASY",
        requiresEquipment: false,
      },
    })),
    results: {
      accuracyRate: 0, // TODO: Calc
      averageVariance: 0,
      totalVariance: 0,
      totalVarianceValue: 0,
      itemsWithVariance: count.tasks.filter((t) => t.status === "DISCREPANCY")
        .length,
      itemsWithinTolerance: 0,
      itemsOutsideTolerance: 0,
    },
    parameters: {
      blindCount: false,
      allowPartialCount: true,
      requireVerification: true,
      tolerancePercentage: 1,
      autoAdjust: false,
      requireApproval: true,
    },
    adjustments: [],
    adjustmentStatus: "PENDING",
    requiresReview: false,
    createdAt: count.createdAt,
    updatedAt: count.updatedAt,
  }));
}
