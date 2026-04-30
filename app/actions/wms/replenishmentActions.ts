"use server";

import { ReplenishmentService } from "@/lib/services/wms/ReplenishmentService";
import { revalidatePath } from "next/cache";

export async function calculateReplenishmentAction(tenantId: string) {
  try {
    const tasks =
      await ReplenishmentService.calculateReplenishmentNeeds(tenantId);
    revalidatePath("/replenishment");
    revalidatePath("/tasks");
    return { success: true, data: tasks, count: tasks.length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getReplenishmentTasksAction() {
  try {
    const tasks = await ReplenishmentService.getReplenishmentTasks("tenant-1"); // Hardcoded tenant for now
    return { success: true, data: tasks };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
