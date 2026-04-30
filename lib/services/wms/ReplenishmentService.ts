import { prisma } from "@/lib/prisma";
import type { PickTask } from "@prisma/client";

export class ReplenishmentService {
  /**
   * Calculate Replenishment Needs
   * Scans for bins below minStock and generates tasks to fill them to maxStock.
   */
  static async calculateReplenishmentNeeds(tenantId: string) {
    // 1. Find bins that need replenishment
    const binsToReplenish = await prisma.storageBin.findMany({
      where: {
        area: { warehouse: { tenantId } },
        minStock: { gt: 0 }, // Only configured bins
        replenishmentSku: { not: null }, // Only dedicated bins
        // Logic: if current stock (sum of quants) < minStock
        // Note: Prisma aggregate inside where is tricky, so we fetch candidates and filter or use raw query.
        // For MVP, we fetch dedicated bins and check their quants.
      },
      include: {
        quants: true,
        area: true,
      },
    });

    const tasks = [];

    for (const bin of binsToReplenish) {
      if (!bin.replenishmentSku) continue;

      const currentQty = bin.quants
        .filter((q) => q.sku === bin.replenishmentSku)
        .reduce((sum, q) => sum + q.quantity, 0);

      if (currentQty < (bin.minStock || 0)) {
        // Needs Replenishment
        const deficit = (bin.maxStock || 100) - currentQty;
        if (deficit <= 0) continue;

        // 2. Find Source Stock (Reserve Areas)
        // Ideally we look for Reserve Areas (type: STORAGE) that are NOT the destination bin
        const sourceQuants = await prisma.inventoryQuant.findMany({
          where: {
            tenantId,
            sku: bin.replenishmentSku,
            bin: {
              id: { not: bin.id }, // specific bin
              area: { type: "STORAGE" }, // Only pull from Reserve
              // In a real scenario, we might exclude current bin's area if it's 'PICKING'
            },
            quantity: { gt: 0 },
          },
          orderBy: { quantity: "desc" }, // Take from largest pile first? or FEFO?
        });

        let remainingDeficit = deficit;

        for (const source of sourceQuants) {
          if (remainingDeficit <= 0) break;

          const qtyToMove = Math.min(source.quantity, remainingDeficit);

          // Create Task
          const task = await prisma.pickTask.create({
            data: {
              tenantId,
              taskNumber: `RPL-${Date.now()}-${tasks.length}`,
              warehouseId: bin.area.warehouseId,
              type: "REPLENISH",
              priority: "HIGH", // Replenishment is usually urgent
              status: "PENDING",
              fromBinId: source.binId || "",
              toBinId: bin.id,
              sku: bin.replenishmentSku,
              quantity: qtyToMove,
              pickedQty: 0,
            },
          });

          tasks.push(task);
          remainingDeficit -= qtyToMove;
        }

        if (remainingDeficit > 0) {
          console.warn(
            `Could not fully replenish bin ${bin.code}. Missing ${remainingDeficit} qty.`,
          );
        }
      }
    }

    return tasks;
  }

  /**
   * Get Pending Replenishment Tasks
   */
  static async getReplenishmentTasks(tenantId: string) {
    return await prisma.pickTask.findMany({
      where: {
        tenantId,
        type: "REPLENISH",
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: {
        shipment: true, // Usually null for replenish
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
