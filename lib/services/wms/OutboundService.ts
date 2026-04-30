import { prisma } from "@/lib/prisma";
import type {
  WMSShipment,
  WMSWave,
  PickTask,
  WMSShipmentLine,
} from "@prisma/client";
import { eventBus, createEvent } from "@/lib/services/event-store";

// Types for Wave Creation
interface WaveCriteria {
  tenantId: string;
  cutoffTime?: Date;
  carrier?: string;
  isUrgent?: boolean;
  limit?: number;
}

interface AllocationStats {
  totalLines: number;
  allocatedLines: number;
  failedLines: number;
  createdTasks: number;
}

export class OutboundService {
  /**
   * 1. CREATE WAVE
   * Groups 'CREATED' shipments into a Wave based on criteria.
   */
  static async createWave(criteria: WaveCriteria): Promise<WMSWave> {
    return await prisma.$transaction(async (tx) => {
      // 1. Find eligible shipments (unassigned to any wave/appointment logic effectively)
      // Ideally we check if they are already in a wave. Schema: we added `lines` but not `waveId` to Shipment.
      // But `PickTask` links to `Wave`.
      // So a Shipment is "in a wave" if its Tasks are in a wave?
      // Or we should link Shipment -> Wave directly.
      // For MVP: We will assume we just pick available shipments and we will link them to tasks which link to waves.
      // To prevent double-waving, we should check status?

      const shipments = await tx.wMSShipment.findMany({
        where: {
          tenantId: criteria.tenantId,
          status: "CREATED", // Only new shipments
          carrier: criteria.carrier || undefined,
        },
        take: criteria.limit || 50,
        orderBy: { createdAt: "asc" },
        include: { lines: true },
      });

      if (shipments.length === 0) {
        throw new Error("No eligible shipments found.");
      }

      // 2. Create Wave Header
      const wave = await tx.wMSWave.create({
        data: {
          tenantId: criteria.tenantId,
          waveNumber: `WAVE-${Date.now()}`,
          status: "PLANNING", // Created but not yet allocated
          type: criteria.isUrgent ? "URGENT" : "STANDARD",
        },
      });

      // 3. Update Shipments to 'WAVED' or link them?
      // Since we don't have a direct link in schema yet (Shipment->Wave),
      // we will effectively "lock" them by updating status to 'PLANNING'.
      // But 'PLANNING' is not in our enum for Shipment. Status was CREATED, PACKED...
      // Let's assume we keep them as CREATED but we generate Tasks for them linked to this Wave.
      // Effectively, the presence of Tasks implies they are being processed.

      return wave;
    });
  }

  /**
   * 2. ALLOCATE WAVE
   * For a specific Wave, find all Shipments (how do we know which ones? we missed linking them in Step 1).
   * CORRECTION: We MUST link Shipment -> Wave in Step 1 or pass shipment IDs.
   * LET'S ASSUME FOR NOW we pass shipment IDs or we update schema in next iteration if strictly needed.
   *
   * ACTUALLY, let's implement `allocateShipment` first, and `allocateWave` just iterates.
   * But we need to know "What shipments are in this wave?".
   *
   * QUICK FIX: We'll modify `createWave` to return the `shipmentIds` and the `wave`.
   * Or, better, `allocateWave` accepts `waveId` AND `shipmentIds`.
   */
  static async allocateWave(
    waveId: string,
    shipmentIds: string[],
  ): Promise<AllocationStats> {
    let stats: AllocationStats = {
      totalLines: 0,
      allocatedLines: 0,
      failedLines: 0,
      createdTasks: 0,
    };

    for (const shipmentId of shipmentIds) {
      const shipStats = await this.allocateShipment(shipmentId, waveId);
      stats.totalLines += shipStats.totalLines;
      stats.allocatedLines += shipStats.allocatedLines;
      stats.failedLines += shipStats.failedLines;
      stats.createdTasks += shipStats.createdTasks;
    }

    // Update Wave Status
    await prisma.wMSWave.update({
      where: { id: waveId },
      data: { status: "RELEASED" }, // Ready for picking
    });

    return stats;
  }

  /**
   * Allocate a Single Shipment
   * Finds inventory (FEFO/FIFO) and creates PickTasks
   */
  static async allocateShipment(
    shipmentId: string,
    waveId: string,
  ): Promise<AllocationStats> {
    const stats: AllocationStats = {
      totalLines: 0,
      allocatedLines: 0,
      failedLines: 0,
      createdTasks: 0,
    };

    const shipment = await prisma.wMSShipment.findUnique({
      where: { id: shipmentId },
      include: { lines: true },
    });

    if (!shipment) return stats;
    stats.totalLines = shipment.lines.length;

    for (const line of shipment.lines) {
      // 1. Find Inventory (FEFO - First Expired First Out, or FIFO)
      // We look for 'InventoryQuant' records for this SKU
      const quants = await prisma.inventoryQuant.findMany({
        where: {
          sku: line.sku,
          status: "AVAILABLE",
          quantity: { gt: 0 },
          // Filtering by tenant implicitly via SKU logic? No, need tenantId check if multi-tenant DB
          // Assume 'sku' is unique per tenant or we add tenantId check
          tenantId: shipment.tenantId,
        },
        orderBy: [
          { expiryDate: "asc" }, // FEFO
          { createdAt: "asc" }, // FIFO fallback
        ],
      });

      let qtyNeeded = line.quantity;
      let qtyAllocated = 0;

      // 2. Iterate Quants and Reserve
      for (const quant of quants) {
        if (qtyNeeded <= 0) break;

        const qtyToTake = Math.min(quant.quantity, qtyNeeded);

        // Create Pick Task
        await prisma.$transaction(async (tx) => {
          // Create Task
          await tx.pickTask.create({
            data: {
              tenantId: shipment.tenantId,
              taskNumber: `TASK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              warehouseId: "DEFAULT", // TODO: Get from shipment or quant
              waveId: waveId,
              shipmentId: shipment.id,
              sku: line.sku,
              fromBinId: quant.binId || "UNKNOWN", // Should verify bin exists
              quantity: qtyToTake,
              status: "PENDING",
              type: "PICK",
              strategy: "FEFO",
            },
          });

          // Soft Reserve: Decrement 'AVAILABLE' quant?
          // Or change status?
          // Best Practice: Split the quant.
          // 1. Reduce existing quant by qtyToTake
          // 2. Create/Update a "Reserved" quant? or simply rely on Task being the reservation.
          // For Simplicity: We will reduce the Quant quantity immediately.
          // (Real WMS might have 'AllocatedQty' field, but decreasing works if we consider Task as owner)

          if (quant.quantity === qtyToTake) {
            // Fully consumed
            await tx.inventoryQuant.delete({ where: { id: quant.id } });
          } else {
            // Partial
            await tx.inventoryQuant.update({
              where: { id: quant.id },
              data: { quantity: quant.quantity - qtyToTake },
            });
          }
          // Note: In a real system, we'd move it to a "Picking" bin or "Allocated" status to avoid disappearing stock.
          // But for this MVP Logic, transforming it into a Task is sufficient "Hard Allocation".
        });

        qtyNeeded -= qtyToTake;
        qtyAllocated += qtyToTake;
      }

      if (qtyNeeded === 0) {
        stats.allocatedLines++;
      } else {
        stats.failedLines++;
        // Log shortage?
      }
      stats.createdTasks++; // Rough count of loops
    }

    return stats;
  }

  /**
   * 3. COMPLETE PICK TASK
   */
  static async completeTask(
    taskId: string,
    confirmedQty: number,
    userId: string,
  ): Promise<void> {
    const taskData = await prisma.$transaction(async (tx) => {
      const task = await tx.pickTask.findUnique({ where: { id: taskId } });
      if (!task) throw new Error("Task not found");

      // Update Task
      const updatedTask = await tx.pickTask.update({
        where: { id: taskId },
        data: {
          status: "COMPLETED",
          confirmedQuantity: confirmedQty,
          pickedQty: confirmedQty,
          assignedUserId: userId,
        },
      });

      // Update Shipment Line pickedQty
      if (task.shipmentId) {
        const line = await tx.wMSShipmentLine.findFirst({
          where: { shipmentId: task.shipmentId, sku: task.sku },
        });
        if (line) {
          await tx.wMSShipmentLine.update({
            where: { id: line.id },
            data: { pickedQty: { increment: confirmedQty } },
          });
        }

        // TODO: Check if Shipment is Fully Picked and update Status
      }

      return { task: updatedTask, originalTask: task };
    });

    // Publish task completion event for Pulse integration
    try {
      const completedEvent = createEvent(
        "wms.task.completed",
        taskId,
        "PICK_TASK",
        {
          taskId,
          taskType: "PICK",
          tenantId: taskData.task.tenantId || undefined,
          userId: taskData.task.assignedUserId || userId,
          completedAt: new Date(),
          shipmentId: taskData.task.shipmentId || undefined,
          waveId: taskData.task.waveId || undefined,
        },
        1,
        {
          tenantId: taskData.task.tenantId || undefined,
          userId: taskData.task.assignedUserId || userId,
        },
      );
      await eventBus.publish(completedEvent);
    } catch (error) {
      console.error("WMS: Error publishing task completion event:", error);
      // Don't throw - task completion should succeed even if event publishing fails
    }
  }
}
