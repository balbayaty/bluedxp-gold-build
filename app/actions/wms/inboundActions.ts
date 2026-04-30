"use server";

import {
  InboundService,
  CreateAppointmentInput,
} from "@/lib/services/wms/InboundService";
import { revalidatePath } from "next/cache";

export async function createASN(data: any) {
  try {
    const result = await InboundService.createASN(data);
    revalidatePath("/inbound");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create ASN:", error);
    return { success: false, error: "Failed to create ASN" };
  }
}

export async function getInboundDeliveries(tenantId: string) {
  try {
    const data = await InboundService.getInboundDeliveries(tenantId);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch ASNs:", error);
    return { success: false, error: "Failed to fetch ASNs" };
  }
}

export async function scheduleAppointment(data: CreateAppointmentInput) {
  try {
    const result = await InboundService.scheduleAppointment(data);
    revalidatePath("/inbound");
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Scheduling failed",
    };
  }
}

export async function suggestPutawayBin(tenantId: string, sku: string) {
  try {
    const binId = await InboundService.suggestPutawayBin(tenantId, sku);
    return { success: true, binId };
  } catch (error) {
    return { success: false, error: "Failed to suggest bin" };
  }
}

export async function receiveInboundItem(
  asnId: string,
  itemId: string,
  qty: number,
  binId: string | undefined, // Now optional
  userId: string,
) {
  try {
    // If binId is empty string, treat as undefined
    const targetBin = binId && binId.trim() !== "" ? binId : undefined;

    const receipt = await InboundService.receiveItem(
      asnId,
      itemId,
      qty,
      targetBin,
      userId,
    );
    revalidatePath("/inbound");
    revalidatePath("/inventory"); // Inventory updates too!
    return { success: true, data: receipt };
  } catch (error) {
    console.error("Failed to receive item:", error);
    return { success: false, error: "Failed to receive item" };
  }
}
