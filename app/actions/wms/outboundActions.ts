"use server";

import { OutboundService } from "@/lib/services/wms/OutboundService";
import { revalidatePath } from "next/cache";

export async function createWaveAction(
  tenantId: string,
  limit: number = 50,
  isUrgent: boolean = false,
) {
  try {
    const wave = await OutboundService.createWave({
      tenantId,
      limit,
      isUrgent,
    });
    revalidatePath("/outbound");
    return { success: true, data: wave };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function allocateWaveAction(
  waveId: string,
  shipmentIds: string[],
) {
  try {
    const result = await OutboundService.allocateWave(waveId, shipmentIds);
    revalidatePath("/outbound");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

import { prisma } from "@/lib/services/database/prismaClient"; // Need prisma for read-only query or add logic to service

export async function getPickTasksAction(tenantId: string) {
  try {
    const tasks = await prisma.pickTask.findMany({
      where: {
        tenantId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      orderBy: { priority: "desc" },
      include: { shipment: true },
    });
    return { success: true, data: tasks };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function completePickTaskAction(
  taskId: string,
  confirmedQty: number,
  userId: string,
) {
  try {
    await OutboundService.completeTask(taskId, confirmedQty, userId);
    revalidatePath("/outbound/picking");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getOutboundOrdersAction() {
  try {
    const shipments = await prisma.wMSShipment.findMany({
      orderBy: { createdAt: "desc" },
      include: { lines: true },
    });

    // Map to ASNData (Dashboard Format)
    const orders = shipments.map((s) => ({
      id: s.id,
      documentNumber: s.shipmentNumber, // Use shipment number as main ID
      reference: s.orderNumber || s.shipmentNumber,
      customerName: s.customerName || "Unknown Customer",
      destination: s.destination || "Unknown Destination",
      status: s.status as any, // Cast to ASNStatus/OrderStatus
      expectedDeliveryDate: s.expectedDeliveryDate || s.createdAt,
      totalItems: s.lines.length,
      totalQuantity: s.lines.reduce((acc, line) => acc + line.quantity, 0),
      totalWeight: s.totalWeight || 0,
      totalVolume: s.totalVolume || 0,
      processType: "OUTBOUND",
      // Default Values for UI compatibility
      priority: "MEDIUM",
      complianceStatus: "COMPLIANT",
      vendorName: "N/A",
      vendorNumber: "N/A",
      entity: s.tenantId,
    }));

    return { success: true, data: orders };
  } catch (error: any) {
    console.error("Failed to fetch outbound orders:", error);
    return { success: false, error: error.message };
  }
}

export async function createOutboundOrderAction(data: any) {
  try {
    // Generate a simple ID
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await prisma.wMSShipment.count();
    const shipmentNumber = `ORD-${dateStr}-${(count + 1).toString().padStart(4, "0")}`;

    const shipment = await prisma.wMSShipment.create({
      data: {
        tenantId: "tenant-1", // Generic for now
        shipmentNumber,
        status: "CREATED",
        orderNumber: data.documentNumber || shipmentNumber,
        customerName: data.customerName,
        destination: data.destination,
        expectedDeliveryDate: data.expectedDeliveryDate
          ? new Date(data.expectedDeliveryDate)
          : null,
        totalWeight: parseFloat(data.totalWeight) || 0,
        totalVolume: parseFloat(data.totalVolume) || 0,
      },
    });

    revalidatePath("/outbound");
    return { success: true, data: shipment };
  } catch (error: any) {
    console.error("Failed to create outbound order:", error);
    return { success: false, error: error.message };
  }
}
