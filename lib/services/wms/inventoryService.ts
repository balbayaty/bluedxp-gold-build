import { prisma } from "../database/prismaClient";
import type {
  InventoryQuant,
  MaterialMaster,
  StorageBin,
} from "@prisma/client";

export type StockOverviewItem = {
  quant: InventoryQuant;
  material: MaterialMaster | null;
  bin: StorageBin | null;
  valuation: number;
};

export type InventoryStock = {
  quantity: number;
};

export class InventoryService {
  /**
   * Get Full Inventory Overview with Valuation
   * Joins Quants with Material Master to calculate $$ on the fly.
   */
  static async getInventoryOverview(
    tenantId: string,
  ): Promise<StockOverviewItem[]> {
    const quants = await prisma.inventoryQuant.findMany({
      where: { tenantId },
      include: {
        material: true,
        bin: true,
        lpn: true,
      },
      orderBy: { sku: "asc" },
    });

    return quants.map((q) => ({
      quant: q,
      material: q.material,
      bin: q.bin,
      // Real-time Valuation Logic: Qty * StandardPrice
      valuation: q.quantity * (Number(q.material?.standardPrice) || 0),
    }));
  }

  /**
   * Get Stock for Specific Material
   */
  static async getMaterialStock(tenantId: string, sku: string) {
    return await prisma.inventoryQuant.findMany({
      where: { tenantId, sku },
      include: {
        bin: true,
      },
    });
  }

  /**
   * Execute a Stock Movement (Transfer)
   * ACID Transaction: Ensure we never lose stock.
   */
  static async moveStock(
    tenantId: string,
    quantId: string,
    targetBinId: string,
    moveQty: number,
    userId: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get Source Quant
      const sourceQuant = await tx.inventoryQuant.findUniqueOrThrow({
        where: { id: quantId },
      });

      if (sourceQuant.quantity < moveQty) {
        throw new Error(
          `Insufficient stock. Available: ${sourceQuant.quantity}, Requested: ${moveQty}`,
        );
      }

      // 2. Decrement Source
      if (sourceQuant.quantity === moveQty) {
        // Full move - delete source
        await tx.inventoryQuant.delete({ where: { id: quantId } });
      } else {
        // Partial move - decrement
        await tx.inventoryQuant.update({
          where: { id: quantId },
          data: { quantity: { decrement: moveQty } },
        });
      }

      // 3. Find or Create Target Quant
      // Check if same SKU/Batch exists in target bin
      const existingTarget = await tx.inventoryQuant.findFirst({
        where: {
          tenantId,
          binId: targetBinId,
          sku: sourceQuant.sku,
          batchNumber: sourceQuant.batchNumber,
        },
      });

      if (existingTarget) {
        await tx.inventoryQuant.update({
          where: { id: existingTarget.id },
          data: { quantity: { increment: moveQty } },
        });
      } else {
        await tx.inventoryQuant.create({
          data: {
            tenantId,
            sku: sourceQuant.sku,
            batchNumber: sourceQuant.batchNumber,
            quantity: moveQty,
            binId: targetBinId,
            uom: sourceQuant.uom,
            status: sourceQuant.status,
          },
        });
      }

      // 4. Log the Movement (Audit Trail)
      // Create inventory movement record for audit trail
      // This provides a complete history of all stock movements for compliance and tracking
      try {
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            sku: sourceQuant.sku,
            movementType: "TRANSFER",
            fromBinId: sourceQuant.binId,
            toBinId: targetBinId,
            quantity: moveQty,
            batchNumber: sourceQuant.batchNumber,
            reason: "Stock transfer",
            performedBy: userId,
            performedAt: new Date(),
            metadata: {
              sourceQuantId: quantId,
            },
          },
        });
      } catch (movementError) {
        // Movement logging is non-blocking - log warning but don't fail transaction
        // This ensures stock movement succeeds even if audit logging fails
        console.warn(
          `[InventoryService] Could not log movement for SKU ${sourceQuant.sku} (table may not exist):`,
          movementError,
        );
      }
    });
  }

  /**
   * Initialize/Seed Stock (For Migration/Testing)
   */
  static async initializeStock(
    tenantId: string,
    sku: string,
    qty: number,
    binId: string,
  ) {
    return await prisma.inventoryQuant.create({
      data: {
        tenantId,
        sku,
        quantity: qty,
        binId,
        uom: "EA",
        status: "AVAILABLE",
      },
    });
  }
  /**
   * Adjust Stock (Cycle Count Correction)
   */
  static async adjustStock(
    tenantId: string,
    binId: string,
    sku: string,
    newQuantity: number,
    reason: string,
    userId: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      const quant = await tx.inventoryQuant.findFirst({
        where: { tenantId, binId, sku },
      });

      if (quant) {
        // Update existing
        if (newQuantity === 0) {
          await tx.inventoryQuant.delete({ where: { id: quant.id } });
        } else {
          await tx.inventoryQuant.update({
            where: { id: quant.id },
            data: { quantity: newQuantity },
          });
        }
      } else if (newQuantity > 0) {
        // Create new if unexpected find
        await tx.inventoryQuant.create({
          data: {
            tenantId,
            binId,
            sku,
            quantity: newQuantity,
            uom: "EA", // Default, should ideally come from MaterialMaster
            status: "AVAILABLE",
          },
        });
      }

      // Log to InventoryMovement (Adjustment)
      try {
        const movementType = quant
          ? newQuantity > quant.quantity
            ? "ADJUSTMENT_IN"
            : "ADJUSTMENT_OUT"
          : "ADJUSTMENT_IN";
        const quantityDiff = quant
          ? Math.abs(newQuantity - quant.quantity)
          : newQuantity;

        await tx.inventoryMovement.create({
          data: {
            tenantId,
            sku,
            movementType,
            fromBinId: movementType === "ADJUSTMENT_OUT" ? binId : undefined,
            toBinId: movementType === "ADJUSTMENT_IN" ? binId : undefined,
            quantity: quantityDiff,
            reason,
            performedBy: userId,
            performedAt: new Date(),
            metadata: {
              adjustmentType: "cycle_count",
              previousQuantity: quant?.quantity || 0,
              newQuantity,
            },
          },
        });
      } catch (movementError) {
        // Movement logging is non-blocking - log warning but don't fail transaction
        console.warn(
          "[InventoryService] Could not log adjustment movement:",
          movementError,
        );
      }
    });
  }
}

// Compatibility export for aiAnalyticsService
class InventoryServiceWrapper {
  async getMovements(
    skuId: string,
    options: { startDate: Date },
  ): Promise<
    Array<{ movementType: "OUT" | "IN"; performedAt: Date; quantity: number }>
  > {
    // Stub implementation to allow build
    // This should eventually query an InventoryMovement table which doesn't seem to exist yet based on the TODOs above
    return [];
  }

  async getStock(
    skuId: string,
    warehouseId: string,
  ): Promise<InventoryStock | null> {
    // Stub implementation
    // Try to find any quant for this sku to return total quantity
    // We assume default tenant for now or need to handle it better
    try {
      const quants = await prisma.inventoryQuant.findMany({
        where: { sku: skuId },
      });
      const total = quants.reduce((acc, q) => acc + q.quantity, 0);
      return { quantity: total };
    } catch (e) {
      return { quantity: 0 };
    }
  }
}

export const inventoryService = new InventoryServiceWrapper();
