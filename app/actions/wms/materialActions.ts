"use server";

import {
  MaterialService,
  CreateMaterialInput,
} from "@/lib/services/wms/MaterialService";
import { revalidatePath } from "next/cache";
import { eventBus, createEvent } from "@/lib/services/event-store";

/**
 * Fetch all materials (Server Action)
 */
export async function getMaterials() {
  try {
    // Hardcoded tenant for now, similar to other parts of the app
    const tenantId = "tenant-1";
    const materials = await MaterialService.getAllMaterials(tenantId);
    return { success: true, data: materials };
  } catch (error) {
    console.error("Failed to fetch materials:", error);
    return { success: false, error: "Failed to fetch materials" };
  }
}

/**
 * Search materials
 */
export async function searchMaterials(query: string) {
  try {
    const tenantId = "tenant-1";
    const materials = await MaterialService.searchMaterials(tenantId, query);
    return { success: true, data: materials };
  } catch (error) {
    return { success: false, error: "Search failed" };
  }
}

/**
 * Upsert (Create/Update) Material
 */
export async function saveMaterial(data: Partial<CreateMaterialInput>) {
  try {
    const tenantId = "tenant-1";

    if (!data.materialNumber || !data.description) {
      return {
        success: false,
        error: "Material Number and Description are required",
      };
    }

    const material = await MaterialService.upsertMaterial({
      tenantId,
      materialNumber: data.materialNumber,
      description: data.description,
      category: data.category || "GENERAL",
      type: data.type,
      baseUnit: data.baseUnit,
      weight: data.weight,
      volume: data.volume,
      standardPrice: data.standardPrice,
      currency: data.currency,
      isHazardous: data.isHazardous,
      hazmatClass: data.hazmatClass,
      isBatchManaged: data.isBatchManaged,
      isSerialManaged: data.isSerialManaged,
      requiresTempControl: data.requiresTempControl,
    });

    // Publish event to Event Bus
    try {
      const event = createEvent(
        "wms.material.created",
        material.id,
        "MATERIAL",
        {
          materialId: material.id,
          materialNumber: material.materialNumber,
          description: material.description,
          category: material.category,
          tenantId,
          createdAt: new Date(),
        },
        1,
        {
          tenantId,
          userId: "system", // Server action doesn't have user context, can be enhanced
        },
      );
      await eventBus.publish(event);
    } catch (error) {
      console.error("Error publishing material creation event:", error);
      // Don't throw - creation should succeed even if event publishing fails
    }

    revalidatePath("/materials");
    return { success: true, data: material };
  } catch (error) {
    console.error("Save material error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save material",
    };
  }
}

/**
 * Delete Material (Not implemented in Service but good to have signature)
 * For now, we'll just return an error as we didn't implement delete in Service yet
 * to prevent accidental data loss of linked inventory.
 */
export async function deleteMaterial(materialNumber: string) {
  // TODO: safely delete logic
  return { success: false, error: "Delete not implemented yet for safety" };
}
