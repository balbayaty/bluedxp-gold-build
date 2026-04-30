/**
 * Core ASN Service
 * Handles all core ASN operations (CRUD, status management, etc.)
 */

import { PrismaClient } from "@prisma/client";
import { eventBus } from "@/lib/services/event-store";
import type {
  ASN,
  ASNStatus,
  CreateASNRequest,
  UpdateASNRequest,
  ASNQueryParams,
  ASNListResponse,
} from "@/types/asn";

export class AsnService {
  constructor(private db: PrismaClient) {}

  /**
   * Create a new ASN
   */
  async createAsn(
    request: CreateASNRequest,
    userId: string,
    tenantId: string,
  ): Promise<ASN> {
    // Validate request
    this.validateCreateRequest(request);

    // Generate ASN number if not provided
    const asnNumber =
      request.asnNumber || (await this.generateAsnNumber(tenantId));

    // Calculate totals
    const totalItems = request.items.length;
    const totalQuantity = request.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const totalValue = request.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    // Create ASN in database
    const asn = await this.db.aSN.create({
      data: {
        asnNumber,
        supplierId: request.supplierId,
        warehouseId: request.warehouseId,
        expectedArrivalDate: request.expectedArrivalDate,
        priority: request.priority || "normal",
        source: request.source || "manual",
        status: "pending",
        totalItems,
        totalQuantity,
        totalValue,
        currency: "SAR", // Default, should be configurable
        metadata: (request.metadata || {}) as any,
        notes: request.notes,
        createdBy: userId,
        tenantId,
        items: {
          create: request.items.map((item, index) => ({
            lineNumber: item.lineNumber || index + 1,
            sku: item.sku,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            unitOfMeasure: item.unitOfMeasure,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            status: "pending",
            metadata: (item.metadata || {}) as any,
            tenantId,
          })),
        },
        documents: request.documents
          ? {
              create: request.documents.map((doc) => ({
                type: doc.type,
                name: doc.name,
                url: doc.url,
                mimeType: doc.mimeType,
                size: doc.size,
                metadata: (doc.metadata || {}) as any,
                tenantId,
              })),
            }
          : undefined,
        trackingEvents: {
          create: {
            eventType: "created",
            description: `ASN ${asnNumber} created`,
            timestamp: new Date(),
            userId,
            tenantId,
          },
        },
      },
      include: {
        items: true,
        documents: true,
        trackingEvents: true,
        exceptions: true,
      },
    });

    // Publish event
    await eventBus.publish("asn.created", {
      asnId: asn.id,
      asnNumber: asn.asnNumber,
      supplierId: asn.supplierId,
      warehouseId: asn.warehouseId,
      tenantId,
    });

    return this.mapToASN(asn);
  }

  /**
   * Get ASN by ID
   */
  async getAsnById(
    asnId: string,
    tenantId: string,
    includeItems = true,
    includeExceptions = true,
    includeDocuments = true,
  ): Promise<ASN | null> {
    const asn = await this.db.aSN.findFirst({
      where: {
        id: asnId,
        tenantId,
      },
      include: {
        items: includeItems,
        exceptions: includeExceptions,
        documents: includeDocuments,
        trackingEvents: true,
      },
    });

    if (!asn) return null;

    return this.mapToASN(asn);
  }

  /**
   * List ASNs with filtering and pagination
   */
  async listAsns(
    params: ASNQueryParams,
    tenantId: string,
  ): Promise<ASNListResponse> {
    const {
      page = 1,
      limit = 20,
      status,
      supplierId,
      warehouseId,
      dateFrom,
      dateTo,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeItems = false,
      includeExceptions = false,
      includeDocuments = false,
    } = params;

    // Build where clause
    const where: any = {
      tenantId,
    };

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (dateFrom || dateTo) {
      where.expectedArrivalDate = {};
      if (dateFrom) where.expectedArrivalDate.gte = dateFrom;
      if (dateTo) where.expectedArrivalDate.lte = dateTo;
    }

    if (search) {
      where.OR = [
        { asnNumber: { contains: search, mode: "insensitive" } },
        { supplierName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await this.db.aSN.count({ where });

    // Get ASNs
    const asns = await this.db.aSN.findMany({
      where,
      include: {
        items: includeItems,
        exceptions: includeExceptions,
        documents: includeDocuments,
        trackingEvents: false,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: asns.map((asn) => this.mapToASN(asn)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update ASN
   */
  async updateAsn(
    asnId: string,
    request: UpdateASNRequest,
    userId: string,
    tenantId: string,
  ): Promise<ASN> {
    // Verify ASN exists and belongs to tenant
    const existing = await this.db.aSN.findFirst({
      where: { id: asnId, tenantId },
    });

    if (!existing) {
      throw new Error("ASN not found");
    }

    // Build update data
    const updateData: any = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (request.expectedArrivalDate) {
      updateData.expectedArrivalDate = request.expectedArrivalDate;
    }

    if (request.priority) {
      updateData.priority = request.priority;
    }

    if (request.status) {
      updateData.status = request.status;
      updateData.trackingEvents = {
        create: {
          eventType: this.getTrackingEventType(request.status),
          description: `ASN status changed to ${request.status}`,
          timestamp: new Date(),
          userId,
        },
      };
    }

    if (request.metadata) {
      updateData.metadata = { ...existing.metadata, ...request.metadata };
    }

    if (request.notes !== undefined) {
      updateData.notes = request.notes;
    }

    // Update items if provided
    if (request.items) {
      for (const itemUpdate of request.items) {
        await this.db.aSNItem.update({
          where: { id: itemUpdate.id },
          data: {
            quantity: itemUpdate.quantity,
            receivedQuantity: itemUpdate.receivedQuantity,
            status: itemUpdate.status,
            location: itemUpdate.location,
            metadata: itemUpdate.metadata
              ? { ...existing.metadata, ...itemUpdate.metadata }
              : undefined,
          },
        });
      }
    }

    // Update ASN
    const asn = await this.db.aSN.update({
      where: { id: asnId },
      data: updateData,
      include: {
        items: true,
        exceptions: true,
        documents: true,
        trackingEvents: true,
      },
    });

    // Publish event
    await eventBus.publish("asn.updated", {
      asnId: asn.id,
      status: asn.status,
      tenantId,
    });

    return this.mapToASN(asn);
  }

  /**
   * Update ASN status
   */
  async updateStatus(
    asnId: string,
    status: ASNStatus,
    userId: string,
    tenantId: string,
  ): Promise<ASN> {
    return this.updateAsn(asnId, { status }, userId, tenantId);
  }

  /**
   * Delete ASN (soft delete by setting status to cancelled)
   */
  async deleteAsn(
    asnId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const existing = await this.db.aSN.findFirst({
      where: { id: asnId, tenantId },
    });

    if (!existing) {
      throw new Error("ASN not found");
    }

    // Soft delete by cancelling
    await this.updateStatus(asnId, "cancelled" as ASNStatus, userId, tenantId);

    // Publish event
    await eventBus.publish("asn.cancelled", {
      asnId,
      tenantId,
    });
  }

  /**
   * Generate unique ASN number
   */
  private async generateAsnNumber(tenantId: string): Promise<string> {
    const prefix = "ASN";
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");

    // Get count of ASNs created today
    const todayStart = new Date(date.setHours(0, 0, 0, 0));
    const todayEnd = new Date(date.setHours(23, 59, 59, 999));

    const count = await this.db.aSN.count({
      where: {
        tenantId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, "0");
    return `${prefix}-${dateStr}-${sequence}`;
  }

  /**
   * Validate create request
   */
  private validateCreateRequest(request: CreateASNRequest): void {
    if (!request.supplierId) {
      throw new Error("Supplier ID is required");
    }

    if (!request.warehouseId) {
      throw new Error("Warehouse ID is required");
    }

    if (!request.expectedArrivalDate) {
      throw new Error("Expected arrival date is required");
    }

    if (!request.items || request.items.length === 0) {
      throw new Error("At least one item is required");
    }

    // Validate items
    for (const item of request.items) {
      if (!item.sku) {
        throw new Error("Item SKU is required");
      }

      if (!item.description) {
        throw new Error("Item description is required");
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new Error("Item quantity must be greater than 0");
      }

      if (!item.unitPrice || item.unitPrice < 0) {
        throw new Error("Item unit price must be non-negative");
      }
    }
  }

  /**
   * Get tracking event type from status
   */
  private getTrackingEventType(status: ASNStatus): string {
    const mapping: Record<ASNStatus, string> = {
      pending: "created",
      in_transit: "in_transit",
      arrived: "arrived",
      receiving: "receiving_started",
      received: "receiving_completed",
      exception: "exception_detected",
      cancelled: "cancelled",
      completed: "completed",
    };

    return mapping[status] || "created";
  }

  /**
   * Map database model to ASN type
   */
  private mapToASN(dbAsn: any): ASN {
    return {
      id: dbAsn.id,
      asnNumber: dbAsn.asnNumber,
      supplierId: dbAsn.supplierId,
      supplierName: dbAsn.supplierName || "",
      warehouseId: dbAsn.warehouseId,
      warehouseName: dbAsn.warehouseName,
      expectedArrivalDate: dbAsn.expectedArrivalDate,
      actualArrivalDate: dbAsn.actualArrivalDate,
      status: dbAsn.status,
      priority: dbAsn.priority,
      source: dbAsn.source,
      totalItems: dbAsn.totalItems,
      totalQuantity: dbAsn.totalQuantity,
      receivedQuantity: dbAsn.receivedQuantity,
      totalValue: dbAsn.totalValue,
      currency: dbAsn.currency || "SAR",
      predictedArrivalTime: dbAsn.predictedArrivalTime,
      predictedArrivalConfidence: dbAsn.predictedArrivalConfidence,
      exceptionProbability: dbAsn.exceptionProbability,
      qualityScore: dbAsn.qualityScore,
      sustainabilityScore: dbAsn.sustainabilityScore,
      items: (dbAsn.items || []).map((item: any) => ({
        id: item.id,
        asnId: item.asnId,
        lineNumber: item.lineNumber,
        sku: item.sku,
        skuDescription: item.skuDescription,
        description: item.description,
        quantity: item.quantity,
        receivedQuantity: item.receivedQuantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        unitOfMeasure: item.unitOfMeasure,
        batchNumber: item.batchNumber,
        serialNumbers: item.serialNumbers,
        expiryDate: item.expiryDate,
        manufacturingDate: item.manufacturingDate,
        location: item.location,
        suggestedLocation: item.suggestedLocation,
        predictedQuality: item.predictedQuality,
        exceptionRisk: item.exceptionRisk,
        qualityScore: item.qualityScore,
        status: item.status,
        exceptions: item.exceptions || [],
        metadata: item.metadata || {},
      })),
      documents: (dbAsn.documents || []).map((doc: any) => ({
        id: doc.id,
        asnId: doc.asnId,
        type: doc.type,
        name: doc.name,
        url: doc.url,
        mimeType: doc.mimeType,
        size: doc.size,
        uploadedAt: doc.uploadedAt || doc.createdAt,
        uploadedBy: doc.uploadedBy,
        metadata: doc.metadata || {},
      })),
      exceptions: (dbAsn.exceptions || []).map((exc: any) => ({
        id: exc.id,
        asnId: exc.asnId,
        itemId: exc.itemId,
        type: exc.type,
        severity: exc.severity,
        description: exc.description,
        detectedAt: exc.detectedAt,
        detectedBy: exc.detectedBy,
        resolvedAt: exc.resolvedAt,
        resolvedBy: exc.resolvedBy,
        resolution: exc.resolution,
        aiSuggestedResolution: exc.aiSuggestedResolution,
        rootCause: exc.rootCause,
        status: exc.status,
        impactDescription: exc.impactDescription,
        estimatedCost: exc.estimatedCost,
        estimatedDelay: exc.estimatedDelay,
        resolutionSteps: exc.resolutionSteps,
        preventionMeasures: exc.preventionMeasures,
        metadata: exc.metadata || {},
      })),
      trackingEvents: (dbAsn.trackingEvents || []).map((event: any) => ({
        id: event.id,
        asnId: event.asnId,
        eventType: event.eventType,
        description: event.description,
        location: event.location,
        timestamp: event.timestamp,
        userId: event.userId,
        metadata: event.metadata || {},
      })),
      metadata: dbAsn.metadata || {},
      tags: dbAsn.tags || [],
      notes: dbAsn.notes,
      createdAt: dbAsn.createdAt,
      updatedAt: dbAsn.updatedAt,
      receivedAt: dbAsn.receivedAt,
      completedAt: dbAsn.completedAt,
      createdBy: dbAsn.createdBy,
      updatedBy: dbAsn.updatedBy,
      receivedBy: dbAsn.receivedBy,
      tenantId: dbAsn.tenantId,
    };
  }
}

// Export singleton instance
let asnServiceInstance: AsnService | null = null;

export function getAsnService(): AsnService {
  if (!asnServiceInstance) {
    const { PrismaClient } = require("@prisma/client");

    asnServiceInstance = new AsnService(new PrismaClient());
  }

  return asnServiceInstance;
}
