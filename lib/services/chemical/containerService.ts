/**
 * Container-Level Tracking Service
 * Manage individual chemical containers with barcode/QR tracking
 */

import {
  ChemicalContainer,
  ContainerSearchFilters,
  ContainerSearchResult,
  ContainerStatus,
  LifecycleStage,
} from "@/types/container";
import { prisma } from "@/lib/services/database/prismaClient";
import type { Prisma } from "@prisma/client";

export class ContainerService {
  /**
   * Get all containers with filters
   */
  async getContainers(
    filters?: ContainerSearchFilters,
    tenantId?: string,
  ): Promise<ContainerSearchResult> {
    try {
      const where: Prisma.ChemicalContainerWhereInput = {};

      if (tenantId) {
        where.tenantId = tenantId;
      }

      if (filters) {
        if (filters.containerNumber) {
          where.containerNumber = {
            contains: filters.containerNumber,
            mode: "insensitive",
          };
        }
        if (filters.barcode) {
          where.barcode = filters.barcode;
        }
        if (filters.chemicalId) {
          where.chemicalId = filters.chemicalId;
        }
        if (filters.chemicalName) {
          where.chemicalName = {
            contains: filters.chemicalName,
            mode: "insensitive",
          };
        }
        if (filters.status) {
          where.status = filters.status;
        }
        if (filters.containerType) {
          where.containerType = filters.containerType;
        }
        if (filters.location) {
          where.OR = [
            {
              warehouseName: {
                contains: filters.location,
                mode: "insensitive",
              },
            },
            { zoneName: { contains: filters.location, mode: "insensitive" } },
            { roomName: { contains: filters.location, mode: "insensitive" } },
          ];
        }
        if (filters.expiryDateRange) {
          where.expiryDate = {
            gte: new Date(filters.expiryDateRange.from),
            lte: new Date(filters.expiryDateRange.to),
          };
        }
      }

      const [containers, total] = await Promise.all([
        prisma.chemicalContainer.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: filters?.pageSize || 50,
          skip: ((filters?.page || 1) - 1) * (filters?.pageSize || 50),
        }),
        prisma.chemicalContainer.count({ where }),
      ]);

      const mappedContainers: ChemicalContainer[] = containers.map(
        this.mapPrismaToContainer,
      );

      return {
        containers: mappedContainers,
        total,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 50,
        filters: filters || {},
      };
    } catch (error) {
      console.error("Error getting containers:", error);
      throw error;
    }
  }

  /**
   * Get container by ID or barcode
   */
  async getContainerById(
    idOrBarcode: string,
    tenantId?: string,
  ): Promise<ChemicalContainer | null> {
    try {
      const where: Prisma.ChemicalContainerWhereInput = {
        OR: [
          { id: idOrBarcode },
          { barcode: idOrBarcode },
          { containerNumber: idOrBarcode },
        ],
      };

      if (tenantId) {
        where.tenantId = tenantId;
      }

      const container = await prisma.chemicalContainer.findFirst({
        where,
      });

      if (!container) {
        return null;
      }

      return this.mapPrismaToContainer(container);
    } catch (error) {
      console.error("Error getting container:", error);
      throw error;
    }
  }

  /**
   * Create new container
   */
  async createContainer(
    container: Partial<ChemicalContainer>,
    tenantId?: string,
  ): Promise<ChemicalContainer> {
    try {
      if (!tenantId) {
        throw new Error("tenantId is required for container creation");
      }

      // Generate barcode/QR if not provided
      const barcode = container.barcode || this.generateBarcode();
      const qrCode = container.qrCode || this.generateQRCode(barcode);
      const containerNumber =
        container.containerNumber ||
        `CNT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const capacity = container.capacity || 0;
      const currentQuantity = container.currentQuantity || 0;
      const fillLevel = capacity > 0 ? (currentQuantity / capacity) * 100 : 0;

      const lifecycle = {
        stage: "Received" as LifecycleStage,
        history: [
          {
            date: new Date().toISOString(),
            stage: "Received" as LifecycleStage,
            location: container.warehouseName,
            performedBy: container.metadata?.createdBy,
          },
        ],
      };

      const metadata = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: container.metadata?.createdBy,
        ...container.metadata,
      };

      // Save to database
      const created = await prisma.chemicalContainer.create({
        data: {
          tenantId,
          containerNumber,
          barcode,
          qrCode,
          chemicalId: container.chemicalId,
          chemicalName: container.chemicalName || "",
          casNumber: container.casNumber,
          containerType: container.containerType || "Drum",
          capacity: new Prisma.Decimal(capacity),
          unit: container.unit || "L",
          currentQuantity: new Prisma.Decimal(currentQuantity),
          fillLevel: new Prisma.Decimal(fillLevel),
          warehouseId: container.warehouseId,
          warehouseName: container.warehouseName,
          zoneId: container.zoneId,
          zoneName: container.zoneName,
          roomId: container.roomId,
          roomName: container.roomName,
          rackId: container.rackId,
          rackName: container.rackName,
          shelfId: container.shelfId,
          shelfName: container.shelfName,
          coordinates: container.coordinates
            ? (container.coordinates as any)
            : null,
          status: container.status || "Full",
          lifecycleStage: lifecycle.stage,
          lifecycleHistory: lifecycle.history as any,
          receivedDate: container.receivedDate
            ? new Date(container.receivedDate)
            : new Date(),
          openedDate: container.openedDate
            ? new Date(container.openedDate)
            : null,
          expiryDate: container.expiryDate
            ? new Date(container.expiryDate)
            : null,
          disposalDate: container.disposalDate
            ? new Date(container.disposalDate)
            : null,
          labelPrinted: container.labelPrinted || false,
          labelPrintedDate: container.labelPrintedDate
            ? new Date(container.labelPrintedDate)
            : null,
          ghsLabel: container.ghsLabel ? (container.ghsLabel as any) : null,
          transferHistory: container.transferHistory || [],
          usageHistory: container.usageHistory || [],
          metadata: metadata as any,
          createdBy: container.metadata?.createdBy,
        },
      });

      return this.mapPrismaToContainer(created);
    } catch (error) {
      console.error("Error creating container:", error);
      throw error;
    }
  }

  /**
   * Update container
   */
  async updateContainer(
    id: string,
    updates: Partial<ChemicalContainer>,
    tenantId?: string,
  ): Promise<ChemicalContainer> {
    try {
      const where: Prisma.ChemicalContainerWhereInput = { id };
      if (tenantId) {
        where.tenantId = tenantId;
      }

      const existing = await prisma.chemicalContainer.findFirst({ where });
      if (!existing) {
        throw new Error(`Container ${id} not found`);
      }

      const capacity = updates.capacity ?? Number(existing.capacity);
      const currentQuantity =
        updates.currentQuantity ?? Number(existing.currentQuantity);
      const fillLevel = capacity > 0 ? (currentQuantity / capacity) * 100 : 0;

      const updateData: Prisma.ChemicalContainerUpdateInput = {
        ...(updates.containerNumber && {
          containerNumber: updates.containerNumber,
        }),
        ...(updates.barcode && { barcode: updates.barcode }),
        ...(updates.qrCode && { qrCode: updates.qrCode }),
        ...(updates.chemicalId !== undefined && {
          chemicalId: updates.chemicalId,
        }),
        ...(updates.chemicalName && { chemicalName: updates.chemicalName }),
        ...(updates.casNumber && { casNumber: updates.casNumber }),
        ...(updates.containerType && { containerType: updates.containerType }),
        ...(updates.capacity !== undefined && {
          capacity: new Prisma.Decimal(updates.capacity),
        }),
        ...(updates.unit && { unit: updates.unit }),
        ...(updates.currentQuantity !== undefined && {
          currentQuantity: new Prisma.Decimal(updates.currentQuantity),
        }),
        fillLevel: new Prisma.Decimal(fillLevel),
        ...(updates.warehouseId !== undefined && {
          warehouseId: updates.warehouseId,
        }),
        ...(updates.warehouseName && { warehouseName: updates.warehouseName }),
        ...(updates.zoneId !== undefined && { zoneId: updates.zoneId }),
        ...(updates.zoneName && { zoneName: updates.zoneName }),
        ...(updates.roomId !== undefined && { roomId: updates.roomId }),
        ...(updates.roomName && { roomName: updates.roomName }),
        ...(updates.rackId !== undefined && { rackId: updates.rackId }),
        ...(updates.rackName && { rackName: updates.rackName }),
        ...(updates.shelfId !== undefined && { shelfId: updates.shelfId }),
        ...(updates.shelfName && { shelfName: updates.shelfName }),
        ...(updates.coordinates && { coordinates: updates.coordinates as any }),
        ...(updates.status && { status: updates.status }),
        ...(updates.lifecycle && {
          lifecycleStage: updates.lifecycle.stage,
          lifecycleHistory: updates.lifecycle.history as any,
        }),
        ...(updates.receivedDate && {
          receivedDate: new Date(updates.receivedDate),
        }),
        ...(updates.openedDate && { openedDate: new Date(updates.openedDate) }),
        ...(updates.expiryDate && { expiryDate: new Date(updates.expiryDate) }),
        ...(updates.disposalDate && {
          disposalDate: new Date(updates.disposalDate),
        }),
        ...(updates.labelPrinted !== undefined && {
          labelPrinted: updates.labelPrinted,
        }),
        ...(updates.labelPrintedDate && {
          labelPrintedDate: new Date(updates.labelPrintedDate),
        }),
        ...(updates.ghsLabel && { ghsLabel: updates.ghsLabel as any }),
        ...(updates.transferHistory && {
          transferHistory: updates.transferHistory as any,
        }),
        ...(updates.usageHistory && {
          usageHistory: updates.usageHistory as any,
        }),
        ...(updates.metadata && { metadata: updates.metadata as any }),
        updatedAt: new Date(),
        ...(updates.metadata?.updatedBy && {
          updatedBy: updates.metadata.updatedBy,
        }),
      };

      const updated = await prisma.chemicalContainer.update({
        where: { id },
        data: updateData,
      });

      return this.mapPrismaToContainer(updated);
    } catch (error) {
      console.error("Error updating container:", error);
      throw error;
    }
  }

  /**
   * Transfer container
   */
  async transferContainer(
    containerId: string,
    toLocation: string,
    reason: string,
    transferredBy?: string,
    tenantId?: string,
  ): Promise<boolean> {
    try {
      const container = await this.getContainerById(containerId, tenantId);
      if (!container) {
        throw new Error(`Container ${containerId} not found`);
      }

      const transfer = {
        id: `transfer-${Date.now()}`,
        date: new Date().toISOString(),
        fromLocation:
          container.warehouseName || container.zoneName || "Unknown",
        toLocation,
        reason,
        transferredBy,
      };

      const updatedTransfers = [...(container.transferHistory || []), transfer];

      await prisma.chemicalContainer.update({
        where: { id: containerId },
        data: {
          warehouseName: toLocation,
          transferHistory: updatedTransfers as any,
          updatedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error("Error transferring container:", error);
      throw error;
    }
  }

  /**
   * Update container quantity (usage)
   */
  async updateQuantity(
    containerId: string,
    quantityUsed: number,
    usedBy?: string,
    purpose?: string,
    tenantId?: string,
  ): Promise<boolean> {
    try {
      const container = await this.getContainerById(containerId, tenantId);
      if (!container) {
        throw new Error(`Container ${containerId} not found`);
      }

      const newQuantity = Math.max(0, container.currentQuantity - quantityUsed);
      const fillLevel =
        container.capacity > 0 ? (newQuantity / container.capacity) * 100 : 0;
      const newStatus: ContainerStatus =
        newQuantity === 0
          ? "Empty"
          : newQuantity < container.capacity
            ? "In-Use"
            : container.status;

      const usage = {
        id: `usage-${Date.now()}`,
        date: new Date().toISOString(),
        quantityUsed,
        unit: container.unit,
        usedBy,
        purpose,
      };

      const updatedUsage = [...(container.usageHistory || []), usage];

      await prisma.chemicalContainer.update({
        where: { id: containerId },
        data: {
          currentQuantity: new Prisma.Decimal(newQuantity),
          fillLevel: new Prisma.Decimal(fillLevel),
          status: newStatus,
          usageHistory: updatedUsage as any,
          updatedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error("Error updating quantity:", error);
      throw error;
    }
  }

  /**
   * Dispose container
   */
  async disposeContainer(
    containerId: string,
    disposalMethod: string,
    disposalDate?: string,
    disposedBy?: string,
    tenantId?: string,
  ): Promise<boolean> {
    try {
      const container = await this.getContainerById(containerId, tenantId);
      if (!container) {
        throw new Error(`Container ${containerId} not found`);
      }

      const disposal = disposalDate || new Date().toISOString();
      const lifecycleEvent = {
        date: disposal,
        stage: "Disposed" as LifecycleStage,
        location: container.warehouseName,
        notes: `Disposed via ${disposalMethod}`,
        performedBy: disposedBy,
      };

      const updatedLifecycle = {
        stage: "Disposed" as LifecycleStage,
        history: [...(container.lifecycle.history || []), lifecycleEvent],
      };

      await prisma.chemicalContainer.update({
        where: { id: containerId },
        data: {
          status: "Disposed",
          lifecycleStage: "Disposed",
          lifecycleHistory: updatedLifecycle.history as any,
          disposalDate: new Date(disposal),
          updatedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error("Error disposing container:", error);
      throw error;
    }
  }

  /**
   * Generate barcode
   */
  private generateBarcode(): string {
    // Generate unique barcode (format: CNT-YYYYMMDD-XXXXX)
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `CNT-${date}-${random}`;
  }

  /**
   * Generate QR code data
   */
  private generateQRCode(barcode: string): string {
    // QR code contains container info as JSON
    return JSON.stringify({
      type: "container",
      barcode,
      timestamp: Date.now(),
    });
  }

  /**
   * Scan barcode/QR
   */
  async scanBarcode(
    barcodeOrQR: string,
    tenantId?: string,
  ): Promise<ChemicalContainer | null> {
    try {
      // Parse QR code if JSON
      let barcode = barcodeOrQR;
      try {
        const qrData = JSON.parse(barcodeOrQR);
        if (qrData.barcode) {
          barcode = qrData.barcode;
        }
      } catch {
        // Not JSON, use as barcode
      }

      return await this.getContainerById(barcode, tenantId);
    } catch (error) {
      console.error("Error scanning barcode:", error);
      throw error;
    }
  }

  /**
   * Map Prisma container to ChemicalContainer type
   */
  private mapPrismaToContainer(prismaContainer: any): ChemicalContainer {
    return {
      id: prismaContainer.id,
      containerNumber: prismaContainer.containerNumber,
      barcode: prismaContainer.barcode || undefined,
      qrCode: prismaContainer.qrCode || undefined,
      chemicalId: prismaContainer.chemicalId || "",
      chemicalName: prismaContainer.chemicalName,
      casNumber: prismaContainer.casNumber || undefined,
      containerType: prismaContainer.containerType as any,
      capacity: Number(prismaContainer.capacity),
      unit: prismaContainer.unit,
      currentQuantity: Number(prismaContainer.currentQuantity),
      fillLevel: Number(prismaContainer.fillLevel),
      warehouseId: prismaContainer.warehouseId || undefined,
      warehouseName: prismaContainer.warehouseName || undefined,
      zoneId: prismaContainer.zoneId || undefined,
      zoneName: prismaContainer.zoneName || undefined,
      roomId: prismaContainer.roomId || undefined,
      roomName: prismaContainer.roomName || undefined,
      rackId: prismaContainer.rackId || undefined,
      rackName: prismaContainer.rackName || undefined,
      shelfId: prismaContainer.shelfId || undefined,
      shelfName: prismaContainer.shelfName || undefined,
      coordinates: prismaContainer.coordinates
        ? (prismaContainer.coordinates as { x: number; y: number })
        : undefined,
      status: prismaContainer.status as ContainerStatus,
      lifecycle: {
        stage: prismaContainer.lifecycleStage as LifecycleStage,
        history: (prismaContainer.lifecycleHistory || []) as any,
      },
      receivedDate: prismaContainer.receivedDate?.toISOString(),
      openedDate: prismaContainer.openedDate?.toISOString(),
      expiryDate: prismaContainer.expiryDate?.toISOString(),
      disposalDate: prismaContainer.disposalDate?.toISOString(),
      labelPrinted: prismaContainer.labelPrinted,
      labelPrintedDate: prismaContainer.labelPrintedDate?.toISOString(),
      ghsLabel: prismaContainer.ghsLabel
        ? (prismaContainer.ghsLabel as any)
        : undefined,
      transferHistory: (prismaContainer.transferHistory || []) as any,
      usageHistory: (prismaContainer.usageHistory || []) as any,
      metadata: {
        createdAt: prismaContainer.createdAt.toISOString(),
        updatedAt: prismaContainer.updatedAt.toISOString(),
        createdBy: prismaContainer.createdBy || undefined,
        updatedBy: prismaContainer.updatedBy || undefined,
        ...((prismaContainer.metadata as any) || {}),
      },
    };
  }
}

export const containerService = new ContainerService();
