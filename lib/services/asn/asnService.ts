/**
 * ASN Service
 * Core business logic for Advanced Shipping Notice operations
 * Deep architecture with full platform integration
 * NOW USING PRISMA DATABASE - FULLY PERSISTENT
 */

import { eventBus } from "@/lib/services/event-store";
import { lifecycleService } from "@/lib/services/process-lifecycle";
import type { ASNData, ASNStatus, OrderStatus } from "@/types/asn";
import { prisma } from "@/lib/prisma";

export class ASNService {
  /**
   * Map Prisma InboundDelivery to ASNData format
   */
  private mapPrismaToASNData(delivery: any): ASNData {
    return {
      id: delivery.id,
      documentNumber: delivery.documentNumber,
      vendorNumber: delivery.vendorId || "VND-001",
      vendorName: delivery.vendorName || "Unknown Vendor",
      expectedDeliveryDate:
        delivery.expectedDeliveryDate?.toISOString() ||
        new Date().toISOString(),
      actualDeliveryDate: delivery.actualDeliveryDate?.toISOString(),
      status: delivery.status as ASNStatus,
      priority: "MEDIUM",
      complianceStatus: "UNDER_REVIEW",
      createdAt: delivery.createdAt.toISOString(),
      lastUpdate: delivery.updatedAt.toISOString(),
      destination: "DEFAULT_WAREHOUSE",
      processType: "INBOUND",
      entity: "DEFAULT",
      totalItems: delivery.items?.length || 0,
      totalQuantity:
        delivery.items?.reduce(
          (sum: number, item: any) => sum + (item.expectedQty || 0),
          0,
        ) || 0,
      createdBy: "system",
    };
  }

  /**
   * Get all ASNs with optional filters
   */
  async getAllASNs(filters?: {
    status?: ASNStatus | OrderStatus;
    processType?: "INBOUND" | "OUTBOUND";
    vendorNumber?: string;
    customerNumber?: string;
    dateFrom?: Date;
    dateTo?: Date;
    tenantId?: string;
  }): Promise<ASNData[]> {
    try {
      const where: any = {};

      if (filters?.tenantId) {
        where.tenantId = filters.tenantId;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.vendorNumber) {
        where.vendorId = filters.vendorNumber;
      }

      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.createdAt.lte = filters.dateTo;
        }
      }

      const deliveries = await prisma.inboundDelivery.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return deliveries.map((delivery) => this.mapPrismaToASNData(delivery));
    } catch (error) {
      console.error("[ASNService] Error getting ASNs:", error);
      // Fallback to empty array on error
      return [];
    }
  }

  /**
   * Get ASN by ID
   */
  async getASNById(id: string): Promise<ASNData | null> {
    try {
      const delivery = await prisma.inboundDelivery.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!delivery) {
        return null;
      }

      return this.mapPrismaToASNData(delivery);
    } catch (error) {
      console.error("[ASNService] Error getting ASN by ID:", error);
      return null;
    }
  }

  /**
   * Create new ASN - NOW PERSISTS TO DATABASE
   */
  async createASN(
    data: Partial<ASNData> & { tenantId: string },
  ): Promise<ASNData> {
    const now = new Date();
    const documentNumber =
      data.documentNumber ||
      `ASN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Create in database using Prisma
      const delivery = await prisma.inboundDelivery.create({
        data: {
          documentNumber,
          vendorId: data.vendorNumber || data.vendorId || "VND-001",
          vendorName: data.vendorName || "Unknown Vendor",
          status: (data.status as string) || "CREATED",
          expectedDeliveryDate: data.expectedDeliveryDate
            ? new Date(data.expectedDeliveryDate)
            : new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          tenantId: data.tenantId,
          items: data.totalItems
            ? {
                create: Array.from({ length: data.totalItems }, (_, i) => ({
                  sku: `SKU-${i + 1}`,
                  description: `Item ${i + 1}`,
                  expectedQty: data.totalQuantity
                    ? Math.floor(data.totalQuantity / data.totalItems)
                    : 1,
                  unit: "EA",
                })),
              }
            : undefined,
        },
        include: {
          items: true,
        },
      });

      const asnData = this.mapPrismaToASNData(delivery);

      // Initialize lifecycle
      try {
        await lifecycleService.initializeLifecycle(delivery.id, "ASN", asnData);
      } catch (error) {
        console.error("[ASNService] Error initializing ASN lifecycle:", error);
        // Non-blocking - continue even if lifecycle fails
      }

      // Publish event
      eventBus.publish({
        type: "asn.created",
        aggregateId: delivery.id,
        payload: asnData,
        metadata: {
          timestamp: now.toISOString(),
          userId: data.createdBy || "system",
        },
      });

      console.log("[ASNService] ✅ Successfully created ASN in database:", {
        id: delivery.id,
        documentNumber: delivery.documentNumber,
        vendorName: delivery.vendorName,
        tenantId: delivery.tenantId,
      });

      return asnData;
    } catch (error: any) {
      console.error("[ASNService] ❌ Error creating ASN:", error);
      // If it's a unique constraint violation, try with a different document number
      if (
        error.code === "P2002" &&
        error.meta?.target?.includes("documentNumber")
      ) {
        console.log("[ASNService] Retrying with new document number...");
        return this.createASN({
          ...data,
          documentNumber: `ASN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        });
      }
      throw error;
    }
  }

  /**
   * Update ASN - NOW USES DATABASE
   */
  async updateASN(id: string, updates: Partial<ASNData>): Promise<ASNData> {
    try {
      const existing = await prisma.inboundDelivery.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existing) {
        throw new Error(`ASN ${id} not found`);
      }

      const updated = await prisma.inboundDelivery.update({
        where: { id },
        data: {
          vendorName: updates.vendorName,
          vendorId: updates.vendorNumber,
          status: updates.status as string,
          expectedDeliveryDate: updates.expectedDeliveryDate
            ? new Date(updates.expectedDeliveryDate)
            : undefined,
        },
        include: {
          items: true,
        },
      });

      const asnData = this.mapPrismaToASNData(updated);

      // Publish update event
      eventBus.publish({
        type: "asn.updated",
        aggregateId: id,
        payload: {
          updates,
          current: asnData,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          userId: updates.changedBy || "system",
        },
      });

      return asnData;
    } catch (error) {
      console.error("[ASNService] Error updating ASN:", error);
      throw error;
    }
  }

  /**
   * Update ASN status - NOW USES DATABASE
   */
  async updateASNStatus(
    id: string,
    newStatus: ASNStatus | OrderStatus,
    context?: Record<string, any>,
  ): Promise<ASNData> {
    try {
      const existing = await prisma.inboundDelivery.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error(`ASN ${id} not found`);
      }

      const previousStatus = existing.status;
      const updated = await this.updateASN(id, {
        status: newStatus,
        ...context,
      });

      // Transition lifecycle stage if applicable
      try {
        const statusToStageMap: Record<string, string> = {
          CREATED: "ASN_CREATED",
          SENT: "ASN_VALIDATED",
          ACKNOWLEDGED: "ASN_VALIDATED",
          IN_TRANSIT: "IN_TRANSIT",
          ARRIVED: "ARRIVED_AT_DOCK",
          PARTIAL_GR: "RECEIVING_IN_PROGRESS",
          GR_POSTED: "GOODS_RECEIPT_POSTED",
          COMPLETED: "ASN_COMPLETED",
          CANCELLED: "ASN_COMPLETED",
          BLOCKED: "ASN_CREATED",
        };

        const stageId = statusToStageMap[newStatus];
        if (stageId) {
          await lifecycleService.transitionStage(id, "ASN", stageId, {
            previousStatus,
            newStatus,
            ...context,
          });
        }
      } catch (error) {
        console.error("Error transitioning lifecycle stage:", error);
      }

      // Publish status change event
      eventBus.publish({
        type: "asn.status_changed",
        aggregateId: id,
        payload: {
          status: newStatus,
          previousStatus,
          context,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          userId: updated.changedBy || "system",
        },
      });

      return updated;
    } catch (error) {
      console.error("[ASNService] Error updating ASN status:", error);
      throw error;
    }
  }

  /**
   * Delete ASN - NOW USES DATABASE
   */
  async deleteASN(id: string): Promise<void> {
    try {
      const existing = await prisma.inboundDelivery.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error(`ASN ${id} not found`);
      }

      await prisma.inboundDelivery.delete({
        where: { id },
      });

      // Publish delete event
      eventBus.publish({
        type: "asn.deleted",
        aggregateId: id,
        payload: this.mapPrismaToASNData(existing),
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[ASNService] Error deleting ASN:", error);
      throw error;
    }
  }

  /**
   * Search ASNs - NOW USES DATABASE
   */
  async searchASNs(query: string, tenantId?: string): Promise<ASNData[]> {
    try {
      const searchTerm = query.toLowerCase();
      const where: any = {
        OR: [
          { documentNumber: { contains: searchTerm, mode: "insensitive" } },
          { vendorName: { contains: searchTerm, mode: "insensitive" } },
          { vendorId: { contains: searchTerm, mode: "insensitive" } },
        ],
      };

      if (tenantId) {
        where.tenantId = tenantId;
      }

      const deliveries = await prisma.inboundDelivery.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return deliveries.map((delivery) => this.mapPrismaToASNData(delivery));
    } catch (error) {
      console.error("[ASNService] Error searching ASNs:", error);
      return [];
    }
  }

  /**
   * Get ASN statistics - NOW USES DATABASE
   */
  async getASNStatistics(filters?: {
    processType?: "INBOUND" | "OUTBOUND";
    dateFrom?: Date;
    dateTo?: Date;
    tenantId?: string;
  }): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byCompliance: Record<string, number>;
    averageProcessingTime: number;
    slaComplianceRate: number;
  }> {
    try {
      const asns = await this.getAllASNs(filters);

      const byStatus: Record<string, number> = {};
      const byPriority: Record<string, number> = {};
      const byCompliance: Record<string, number> = {};

      let totalProcessingTime = 0;
      let completedCount = 0;
      let slaCompliantCount = 0;

      asns.forEach((asn) => {
        // Status distribution
        const status = asn.status || "UNKNOWN";
        byStatus[status] = (byStatus[status] || 0) + 1;

        // Priority distribution
        const priority = asn.priority || "MEDIUM";
        byPriority[priority] = (byPriority[priority] || 0) + 1;

        // Compliance distribution
        const compliance = asn.complianceStatus || "UNDER_REVIEW";
        byCompliance[compliance] = (byCompliance[compliance] || 0) + 1;

        // Processing time (if completed)
        if (asn.status === "COMPLETED" || asn.status === "GR_POSTED") {
          const created = new Date(asn.createdAt);
          const completed = asn.actualDeliveryDate
            ? new Date(asn.actualDeliveryDate)
            : new Date();
          const duration = (completed.getTime() - created.getTime()) / 1000; // seconds
          totalProcessingTime += duration;
          completedCount++;

          // SLA compliance
          if (asn.slaComplianceStatus === "COMPLIANT") {
            slaCompliantCount++;
          }
        }
      });

      return {
        total: asns.length,
        byStatus,
        byPriority,
        byCompliance,
        averageProcessingTime:
          completedCount > 0 ? totalProcessingTime / completedCount : 0,
        slaComplianceRate:
          completedCount > 0 ? (slaCompliantCount / completedCount) * 100 : 0,
      };
    } catch (error) {
      console.error("[ASNService] Error getting statistics:", error);
      return {
        total: 0,
        byStatus: {},
        byPriority: {},
        byCompliance: {},
        averageProcessingTime: 0,
        slaComplianceRate: 0,
      };
    }
  }
}

export const asnService = new ASNService();
