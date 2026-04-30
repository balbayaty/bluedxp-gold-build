"use server";

import { InventoryService } from "@/lib/services/wms/inventoryService";
import { revalidatePath } from "next/cache";

/**
 * Fetch Inventory Overview (Server Action)
 * Returns stock with calculated valuation.
 */
export async function getInventoryOverview() {
  try {
    const tenantId = "tenant-1";
    const overview = await InventoryService.getInventoryOverview(tenantId);
    return { success: true, data: overview };
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    return { success: false, error: "Failed to fetch inventory" };
  }
}

/**
 * Execute Stock Movement (Transfer)
 */
export async function transferStock(
  quantId: string,
  targetBinId: string,
  quantity: number,
) {
  try {
    const tenantId = "tenant-1";
    // Hardcoded user for now
    const userId = "user-1";

    await InventoryService.moveStock(
      tenantId,
      quantId,
      targetBinId,
      quantity,
      userId,
    );

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Transfer failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transfer failed",
    };
  }
}
