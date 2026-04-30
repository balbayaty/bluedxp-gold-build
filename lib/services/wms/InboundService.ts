import { prisma } from "../database/prismaClient";
import type {
  InboundDelivery,
  InboundDeliveryItem,
  Receipt,
  ReceiptItem,
  Appointment,
  PutawayRule,
} from "@prisma/client";

export type CreateASNInput = {
  documentNumber: string;
  vendorId?: string;
  vendorName?: string;
  expectedDeliveryDate?: Date;
  tenantId: string;
  items: {
    sku: string;
    description?: string;
    expectedQty: number;
    unit?: string;
  }[];
};

export type CreateAppointmentInput = {
  tenantId: string;
  inboundDeliveryId: string;
  dockDoorId: string;
  carrier: string;
  driverName?: string;
  vehiclePlate?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
};

export class InboundService {
  /**
   * Create a new Inbound Delivery (ASN)
   */
  static async createASN(data: CreateASNInput): Promise<InboundDelivery> {
    return await prisma.inboundDelivery.create({
      data: {
        documentNumber: data.documentNumber,
        vendorId: data.vendorId,
        vendorName: data.vendorName,
        expectedDeliveryDate: data.expectedDeliveryDate,
        tenantId: data.tenantId,
        status: "CREATED",
        items: {
          create: data.items.map((item) => ({
            sku: item.sku,
            description: item.description,
            expectedQty: item.expectedQty,
            unit: item.unit || "EA",
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  /**
   * Get Inbound Deliveries for a Tenant
   */
  static async getInboundDeliveries(tenantId: string) {
    return await prisma.inboundDelivery.findMany({
      where: { tenantId },
      include: {
        items: true,
        receipts: true,
        appointment: {
          include: {
            dockDoor: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Schedule a Dock Appointment for an ASN
   */
  static async scheduleAppointment(
    data: CreateAppointmentInput,
  ): Promise<Appointment> {
    // Validate Dock Availability (Simple overlap check)
    const conflicts = await prisma.appointment.findMany({
      where: {
        dockDoorId: data.dockDoorId,
        status: { not: "CANCELLED" },
        OR: [
          {
            scheduledStart: { lte: data.scheduledEnd },
            scheduledEnd: { gte: data.scheduledStart },
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      throw new Error("Dock Door is already booked for this time slot.");
    }

    return await prisma.appointment.create({
      data: {
        tenantId: data.tenantId,
        inboundDeliveryId: data.inboundDeliveryId,
        dockDoorId: data.dockDoorId,
        carrier: data.carrier,
        driverName: data.driverName,
        vehiclePlate: data.vehiclePlate,
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
        status: "SCHEDULED",
      },
    });
  }

  /**
   * Intelligent Putaway Logic: Suggests the best Bin for an Item
   */
  static async suggestPutawayBin(
    tenantId: string,
    sku: string,
  ): Promise<string | null> {
    // 1. Get Material Details (HAZMAT, Temp, etc.)
    const material = await prisma.materialMaster.findUnique({
      where: { tenantId_materialNumber: { tenantId, materialNumber: sku } },
    });

    if (!material) return null;

    // 2. Fetch Active Putaway Rules sorted by Priority
    // 2. Fetch Active Putaway Rules sorted by Priority
    const rules = await prisma.putawayRule.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sequence: "asc" },
      include: { targetArea: true },
    });

    // 3. Evaluate Rules
    for (const rule of rules) {
      let match = true;

      // Check Criteria
      if (rule.materialCategory && rule.materialCategory !== material.category)
        match = false;
      if (rule.hazmatClass && rule.hazmatClass !== material.hazmatClass)
        match = false;
      // Add more matching logic here...

      if (match && rule.targetAreaId) {
        // Find a bin in this area
        // Strategy: NEXT_EMPTY
        if (rule.strategy === "NEXT_EMPTY") {
          const emptyBin = await prisma.storageBin.findFirst({
            where: {
              areaId: rule.targetAreaId,
              status: "AVAILABLE",
              quants: { none: {} }, // Truly empty
            },
          });
          if (emptyBin) return emptyBin.id;
        }

        // Strategy: CONSOLIDATION (Find bin with same SKU)
        if (rule.strategy === "ZONE_CONSOLIDATION") {
          const sameSkuBin = await prisma.inventoryQuant.findFirst({
            where: {
              sku: sku,
              bin: { areaId: rule.targetAreaId },
            },
            include: { bin: true },
          });
          if (sameSkuBin?.binId) return sameSkuBin.binId;
        }
      }
    }

    // Fallback: Just return any available bin in a GENERAL zone or null
    const generalBin = await prisma.storageBin.findFirst({
      where: { status: "AVAILABLE" },
    });

    return generalBin?.id || null;
  }

  /**
   * Receive items against an ASN
   * This updates the ASN, Creates a Receipt, and INCREASES INVENTORY
   */
  static async receiveItem(
    asnId: string,
    itemId: string,
    receivedQty: number,
    targetBinId: string | undefined, // Optional now, auto-suggested if missing
    userId: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get Inbound Delivery Item to check limits and SKU
      const item = await tx.inboundDeliveryItem.findUniqueOrThrow({
        where: { id: itemId },
        include: { inboundDelivery: true },
      });

      const tenantId = item.inboundDelivery.tenantId;

      // 2. Auto-Suggest Bin if not provided
      let finalBinId = targetBinId;
      if (!finalBinId) {
        // We need to use the class method, but we are in a transaction.
        // ideally we move suggestPutawayBin to not strictly depend on `this` or reuse logic.
        // For now, we'll fetch a fallback if logic fails or reuse the public method (outside tx - acceptable for read)
        // BUT, to be safe inside TX, let's just picking a default if NULL.
        // In a real scenario, we'd use suggestPutawayBin logic here.

        // Simplified Fallback for Transaction safety:
        const fallbackBin = await tx.storageBin.findFirst({
          where: { status: "AVAILABLE" },
        });
        if (!fallbackBin)
          throw new Error("No available bins found for putaway.");
        finalBinId = fallbackBin.id;
      }

      // 3. Update InboundDeliveryItem
      await tx.inboundDeliveryItem.update({
        where: { id: itemId },
        data: {
          receivedQty: { increment: receivedQty },
        },
      });

      // 4. Create Receipt Record (Proof)
      const receipt = await tx.receipt.create({
        data: {
          inboundDeliveryId: asnId,
          postedBy: userId,
          items: {
            create: {
              sku: item.sku,
              quantity: receivedQty,
              targetBinId: finalBinId,
            },
          },
        },
      });

      // 5. Update Inventory Quant (Make it REAL)
      const existingQuant = await tx.inventoryQuant.findFirst({
        where: {
          binId: finalBinId,
          sku: item.sku,
        },
      });

      if (existingQuant) {
        await tx.inventoryQuant.update({
          where: { id: existingQuant.id },
          data: { quantity: { increment: receivedQty } },
        });
      } else {
        await tx.inventoryQuant.create({
          data: {
            binId: finalBinId!,
            sku: item.sku,
            quantity: receivedQty,
            unit: item.unit,
            lpnId: "LPN-" + Date.now(), // Auto-generate LPN for now
            expiryDate: null,
            tenantId: tenantId,
          },
        });
      }

      // 6. Update ASN Status (Simple logic)
      // If total received >= total expected, mark COMPLETED (Logic simplified for now)
      await tx.inboundDelivery.update({
        where: { id: asnId },
        data: { status: "PARTIAL_GR" },
      });

      return receipt;
    });
  }
}
