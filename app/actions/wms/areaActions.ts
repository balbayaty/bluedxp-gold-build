"use server";

import { warehouseAreaService } from "@/lib/services/wms/areaService";
import {
  WarehouseArea,
  WarehouseAreaRequest,
  WarehouseAreaFilters,
} from "@/types/warehouseArea";
import { revalidatePath } from "next/cache";

// Wrapper for error handling
type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function listAreasAction(
  filters?: WarehouseAreaFilters,
): Promise<ActionResponse<WarehouseArea[]>> {
  try {
    const areas = await warehouseAreaService.listAreas(filters);
    return { success: true, data: areas };
  } catch (error: any) {
    console.error("List areas failed:", error);
    return { success: false, error: error.message };
  }
}

export async function createAreaAction(
  data: WarehouseAreaRequest,
): Promise<ActionResponse<WarehouseArea>> {
  try {
    const area = await warehouseAreaService.createArea(data);
    revalidatePath("/warehouse-areas");
    return { success: true, data: area };
  } catch (error: any) {
    console.error("Create area failed:", error);
    return { success: false, error: error.message };
  }
}

export async function updateAreaAction(
  id: string,
  data: Partial<WarehouseAreaRequest>,
): Promise<ActionResponse<WarehouseArea>> {
  try {
    const area = await warehouseAreaService.updateArea(id, data);
    revalidatePath("/warehouse-areas");
    return { success: true, data: area };
  } catch (error: any) {
    console.error("Update area failed:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAreaAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await warehouseAreaService.deleteArea(id);
    revalidatePath("/warehouse-areas");
    return { success: true };
  } catch (error: any) {
    console.error("Delete area failed:", error);
    return { success: false, error: error.message };
  }
}

export async function getAreaStatisticsAction(
  warehouseId?: string,
): Promise<ActionResponse<any>> {
  try {
    const stats = await warehouseAreaService.getAreaStatistics(warehouseId);
    return { success: true, data: stats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
