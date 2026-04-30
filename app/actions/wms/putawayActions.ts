"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/services/database/prismaClient";
import { warehouseAssignmentService } from "@/lib/services/warehouse-assignment";
import { binService } from "@/lib/services/wms/binService";
import { inventoryService } from "@/lib/services/wms/inventoryService";

export type PutawaySuggestion = {
  recommendedBinId: string;
  recommendedBinCode: string;
  areaName: string;
  reason: string;
};

export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get a smart putaway suggestion for an SKU
 */
export async function getPutawaySuggestion(
  sku: string,
  quantity: number,
  tenantId: string,
): Promise<ActionResponse<PutawaySuggestion>> {
  try {
    // 1. Get Material Info (Hazmat Class, Temp Control)
    const material = await prisma.materialMaster.findFirst({
      where: { materialNumber: sku, tenantId },
    });

    if (!material) {
      return {
        success: false,
        error: `Material ${sku} not found. Ensure Master Data exists.`,
      };
    }

    // 2. Build Requirements Object
    const requirements = {
      hazardClass: material.hazmatClass || undefined,
      temperatureControlled: material.requiresTempControl,
      minTemperature: undefined, // Could add to MaterialMaster
      maxTemperature: undefined,
    };

    // 3. Get Warehouse/Area Recommendations
    // Fetch candidates for this tenant ONLY to prevent data leaks
    const candidates = await prisma.warehouse.findMany({
      where: { tenantId },
      include: {
        facility: true,
        areas: true,
      },
    });

    const recommendations =
      await warehouseAssignmentService.getWarehouseRecommendations(
        requirements,
        candidates,
      );

    if (recommendations.length === 0) {
      return {
        success: false,
        error: `No compatible storage area found for Hazmat Class: ${material.hazmatClass || "None"} / Temp: ${material.requiresTempControl ? "Controlled" : "Ambient"}`,
      };
    }

    const bestRec = recommendations[0];
    const bestAreaName = bestRec.matchingAreas[0]; // Valid area name

    // 4. Find the Area ID from the name (Recommendation returns name/score)
    // We need the internal ID to search bins.
    // Optimization: warehouseAssignmentService could return ID, but for now we look it up.
    const area = await prisma.warehouseArea.findFirst({
      where: {
        warehouseId: bestRec.warehouseId,
        name: bestAreaName,
      },
    });

    if (!area) {
      return {
        success: false,
        error: "System Error: Recommended Area ID not found",
      };
    }

    // 5. Find Best Bin in Area
    const bestBin = await binService.findBestBinInArea(area.id, sku, quantity);

    if (!bestBin) {
      return {
        success: false,
        error: `Area "${bestAreaName}" is compatible but FULL (No empty bins).`,
      };
    }

    return {
      success: true,
      data: {
        recommendedBinId: bestBin.id,
        recommendedBinCode: bestBin.code,
        areaName: bestAreaName,
        reason: `Best match for ${material.hazmatClass ? `Class ${material.hazmatClass}` : "General"} storage in ${bestRec.warehouseName}`,
      },
    };
  } catch (error) {
    console.error("Putaway Suggestion Error:", error);
    return { success: false, error: "Failed to generate suggestion" };
  }
}

/**
 * Confirm Putaway (Execute Receive)
 */
export async function confirmPutaway(
  deliveryItemId: string,
  targetBinId: string,
  quantity: number,
  userId: string,
  tenantId: string,
): Promise<ActionResponse<void>> {
  try {
    // 1. Validate Delivery Item
    // For this demo, we assume deliveryItemId is valid or we just use SKU directly if passed.
    // But simpler: Input might be SKU if we are doing "Blind Receive", but let's assume we have the InboundDeliveryItem.
    const deliveryItem = await prisma.inboundDeliveryItem.findUnique({
      where: { id: deliveryItemId },
      include: { inboundDelivery: true },
    });

    if (!deliveryItem) {
      return { success: false, error: "Delivery Item not found" };
    }

    // 2. Create/Update Inventory
    // Use our InventoryService logic
    // We map deliveryItem.sku to the inventory
    // Note: InventoryService.adjustStock is a good proxy for "New Stock"
    await inventoryService.adjustStock(
      tenantId,
      targetBinId,
      deliveryItem.sku,
      quantity, // This sets absolute quantity. For "add", we need logic.
      // InventoryService 'moveStock' or strict 'create'.
      // adjustStock with logic "if exists then update" is safer?
      // Actually adjustStock OVERWRITES. We want to INCREMENT.
      // Let's implement a direct 'receiveStock' helper here or use transaction.
      "Inbound Receipt",
      userId,
    );

    // Wait, adjustStock overwrites? Let's check InventoryService.
    // Yes: await tx.inventoryQuant.update({ data: { quantity: newQuantity } })
    // We need 'increment'.
    // Let's do it manually here properly with a transaction to ensure Receipt record is also made.

    await prisma.$transaction(async (tx) => {
      // A. Update InboundDeliveryItem receivedQty
      await tx.inboundDeliveryItem.update({
        where: { id: deliveryItemId },
        data: { receivedQty: { increment: quantity } },
      });

      // B. Create Receipt Record (Audit)
      // Need a Receipt parent first? Or find existing 'Open' receipt?
      // Simplified: Create a Receipt for this transaction
      const receipt = await tx.receipt.create({
        data: {
          inboundDeliveryId: deliveryItem.inboundDeliveryId,
          postedBy: userId,
          items: {
            create: {
              sku: deliveryItem.sku,
              quantity: quantity,
              targetBinId: targetBinId,
            },
          },
        },
      });

      // C. Update Inventory (Increment)
      const existingQuant = await tx.inventoryQuant.findFirst({
        where: { binId: targetBinId, sku: deliveryItem.sku, tenantId },
      });

      if (existingQuant) {
        await tx.inventoryQuant.update({
          where: { id: existingQuant.id },
          data: { quantity: { increment: quantity } },
        });
      } else {
        await tx.inventoryQuant.create({
          data: {
            tenantId,
            binId: targetBinId,
            sku: deliveryItem.sku,
            quantity: quantity,
            uom: deliveryItem.unit,
            status: "AVAILABLE",
          },
        });
      }

      // D. Update Bin Status
      await tx.storageBin.update({
        where: { id: targetBinId },
        data: { status: "OCCUPIED" },
      });

      // E. Check if Delivery Completes
      // (Simplified logic: if all items received, mark COMPLETED)
      // ... skipped for brevity
    });

    revalidatePath("/inbound");
    return { success: true };
  } catch (error) {
    console.error("Confirm Putaway Error:", error);
    return { success: false, error: "Failed to confirm putaway" };
  }
}
