/**
 * Flex Smart e-Waybill (ETW) Service
 *
 * Core service for ETW CRUD operations with:
 * - Multi-tenant support
 * - Version management
 * - Evidence-grade audit trail
 * - Full integration with platform services
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-store";
import { evidenceService } from "@/lib/services/evidence";
import type { DomainEvent } from "@/types/cqrs";
import type {
  ETW,
  ETWStatus,
  ETWScope,
  CreateETWSchema,
  UpdateETWSchema,
  TransportReferenceMatrix,
} from "@/types/etw";
import {
  CreateETWSchema as CreateETWZodSchema,
  UpdateETWSchema as UpdateETWZodSchema,
} from "@/types/etw";
import { z } from "zod";

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

export interface ETWService {
  // CRUD Operations
  create(data: z.infer<typeof CreateETWZodSchema>): Promise<ETW>;
  update(
    id: string,
    data: Partial<z.infer<typeof UpdateETWZodSchema>>,
    userId: string,
  ): Promise<ETW>;
  get(id: string, tenantId: string): Promise<ETW | null>;
  list(filters: ETWListFilters): Promise<{ etws: ETW[]; total: number }>;
  delete(id: string, tenantId: string, userId: string): Promise<void>;

  // Version Management
  getVersion(
    id: string,
    version: number,
    tenantId: string,
  ): Promise<ETW | null>;
  getVersions(id: string, tenantId: string): Promise<ETW[]>;

  // Status Management
  updateStatus(
    id: string,
    status: ETWStatus,
    tenantId: string,
    userId: string,
  ): Promise<ETW>;

  // Reference Management
  generateETWNumber(tenantId: string): Promise<string>;
  linkToShipment(
    etwId: string,
    shipmentId: string,
    tenantId: string,
  ): Promise<ETW>;
  linkToInvoice(
    etwId: string,
    invoiceId: string,
    tenantId: string,
  ): Promise<ETW>;
}

export interface ETWListFilters {
  tenantId: string;
  status?: ETWStatus;
  scope?: ETWScope;
  mode?: string;
  shipmentId?: string;
  createdBy?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

class ETWServiceImpl implements ETWService {
  /**
   * Generate unique ETW number
   */
  async generateETWNumber(tenantId: string): Promise<string> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const tenantPrefix = tenantId.substring(0, 3).toUpperCase();
    return `ETW-${tenantPrefix}-${timestamp}-${random}`;
  }

  /**
   * Create new ETW
   */
  async create(data: z.infer<typeof CreateETWZodSchema>): Promise<ETW> {
    // Validate input
    const validated = CreateETWZodSchema.parse(data);

    // Generate ETW number
    const etwNumber = await this.generateETWNumber(validated.tenantId);

    // Determine if multimodal
    const isMultimodal =
      validated.scope === "MULTIMODAL" || validated.mode === "MULTIMODAL";

    // Create ETW object
    const etwData: Omit<
      ETW,
      | "id"
      | "etwNumber"
      | "version"
      | "createdAt"
      | "updatedAt"
      | "events"
      | "legs"
      | "attachments"
    > = {
      etwNumber,
      tenantId: validated.tenantId,
      status: "DRAFT",
      version: 1,
      scope: validated.scope,
      mode: validated.mode,
      isMultimodal,
      references: validated.references || {
        etwNumber,
        shipmentNumber: validated.references?.shipmentNumber,
        invoiceNumber: validated.references?.invoiceNumber,
        purchaseOrderNumber: validated.references?.purchaseOrderNumber,
        customerReference: validated.references?.customerReference,
        internalReference: validated.references?.internalReference,
        carrierReference: validated.references?.carrierReference,
      },
      parties: validated.parties,
      cargo: validated.cargo,
      compliance: validated.compliance,
      permits: [],
      route: validated.route,
      commercial: validated.commercial,
      events: [],
      attachments: [],
      metadata: {
        customerView: false,
        tags: [],
        customFields: {},
      },
      createdBy: validated.createdBy,
      shipmentId: validated.shipmentId,
    };

    // Create in database
    const created = await prisma.eTW.create({
      data: {
        etwNumber,
        tenantId: validated.tenantId,
        status: "DRAFT",
        version: 1,
        scope: validated.scope,
        mode: validated.mode,
        isMultimodal,
        references: etwData.references as any,
        parties: etwData.parties as any,
        cargo: etwData.cargo as any,
        compliance: etwData.compliance as any,
        permits: [],
        route: etwData.route as any,
        commercial: etwData.commercial as any,
        metadata: etwData.metadata as any,
        createdBy: validated.createdBy,
        shipmentId: validated.shipmentId,
      },
    });

    // Create version snapshot
    await prisma.eTWVersion.create({
      data: {
        etwId: created.id,
        version: 1,
        tenantId: validated.tenantId,
        data: etwData as any,
        createdBy: validated.createdBy,
      },
    });

    // Create initial event
    await prisma.eTWEvent.create({
      data: {
        etwId: created.id,
        tenantId: validated.tenantId,
        type: "CREATED",
        timestamp: new Date(),
        actor: {
          id: validated.createdBy,
          name: "System",
          role: "SYSTEM",
          type: "SYSTEM",
        },
        verified: true,
        createdBy: validated.createdBy,
      },
    });

    // Create evidence
    await evidenceService.createEvidence({
      entityType: "etw",
      entityId: created.id,
      evidenceType: "chain_of_custody",
      data: {
        action: "CREATED",
        etwNumber,
        createdBy: validated.createdBy,
      },
      metadata: {
        etwId: created.id,
        tenantId: validated.tenantId,
      },
    });

    // Publish event
    await eventBus.publish({
      type: "etw.created",
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      aggregateId: created.id,
      aggregateType: "ETW",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        etwId: created.id,
        etwNumber,
        tenantId: validated.tenantId,
        scope: validated.scope,
        mode: validated.mode,
      },
      metadata: {
        tenantId: validated.tenantId,
        userId: validated.createdBy,
      },
    } as DomainEvent);

    // Return ETW object
    return this.mapToETW(created);
  }

  /**
   * Update ETW
   */
  async update(
    id: string,
    data: Partial<z.infer<typeof UpdateETWZodSchema>>,
    userId: string,
  ): Promise<ETW> {
    // Get existing ETW
    const existing = await prisma.eTW.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`ETW not found: ${id}`);
    }

    // Validate update data
    const updateData = UpdateETWZodSchema.partial().parse(data);

    // Track changed fields
    const changedFields: string[] = [];
    const oldData: Record<string, any> = {};

    // Compare fields
    if (updateData.scope && updateData.scope !== existing.scope) {
      changedFields.push("scope");
      oldData.scope = existing.scope;
    }
    if (updateData.mode && updateData.mode !== existing.mode) {
      changedFields.push("mode");
      oldData.mode = existing.mode;
    }
    if (updateData.status && updateData.status !== existing.status) {
      changedFields.push("status");
      oldData.status = existing.status;
    }

    // Increment version
    const newVersion = existing.version + 1;

    // Update in database
    const updated = await prisma.eTW.update({
      where: { id },
      data: {
        ...(updateData.scope && { scope: updateData.scope }),
        ...(updateData.mode && { mode: updateData.mode }),
        ...(updateData.status && { status: updateData.status }),
        ...(updateData.parties && { parties: updateData.parties as any }),
        ...(updateData.cargo && { cargo: updateData.cargo as any }),
        ...(updateData.compliance && {
          compliance: updateData.compliance as any,
        }),
        ...(updateData.route && { route: updateData.route as any }),
        ...(updateData.commercial && {
          commercial: updateData.commercial as any,
        }),
        ...(updateData.metadata && { metadata: updateData.metadata as any }),
        version: newVersion,
        updatedBy: userId,
      },
    });

    // Create version snapshot
    const currentData = await this.mapToETW(updated);
    await prisma.eTWVersion.create({
      data: {
        etwId: id,
        version: newVersion,
        tenantId: existing.tenantId,
        data: currentData as any,
        changedFields: changedFields.length > 0 ? changedFields : null,
        changeReason: updateData.metadata?.changeReason || "Update",
        createdBy: userId,
      },
    });

    // Create evidence for update
    await evidenceService.createEvidence({
      entityType: "etw",
      entityId: id,
      evidenceType: "chain_of_custody",
      data: {
        action: "UPDATED",
        changedFields,
        oldData,
        newData: updateData,
        updatedBy: userId,
      },
      metadata: {
        etwId: id,
        tenantId: existing.tenantId,
        version: newVersion,
      },
    });

    // Publish event
    await eventBus.publish({
      type: "etw.updated",
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      aggregateId: id,
      aggregateType: "ETW",
      version: newVersion,
      timestamp: new Date().toISOString(),
      payload: {
        etwId: id,
        changedFields,
        updatedBy: userId,
      },
      metadata: {
        tenantId: existing.tenantId,
        userId,
      },
    } as DomainEvent);

    return this.mapToETW(updated);
  }

  /**
   * Get ETW by ID
   */
  async get(id: string, tenantId: string): Promise<ETW | null> {
    const etw = await prisma.eTW.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        events: {
          orderBy: { timestamp: "asc" },
        },
        legs: {
          orderBy: { legNumber: "asc" },
        },
        attachments: true,
        qrTokens: {
          where: {
            revoked: false,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!etw) {
      return null;
    }

    return this.mapToETW(etw);
  }

  /**
   * List ETWs with filters
   */
  async list(filters: ETWListFilters): Promise<{ etws: ETW[]; total: number }> {
    const where: any = {
      tenantId: filters.tenantId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.scope) {
      where.scope = filters.scope;
    }

    if (filters.mode) {
      where.mode = filters.mode;
    }

    if (filters.shipmentId) {
      where.shipmentId = filters.shipmentId;
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      where.OR = [
        { etwNumber: { contains: filters.search, mode: "insensitive" } },
        {
          references: {
            path: ["shipmentNumber"],
            string_contains: filters.search,
          },
        },
        {
          references: {
            path: ["customerReference"],
            string_contains: filters.search,
          },
        },
      ];
    }

    const [etws, total] = await Promise.all([
      prisma.eTW.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters.limit || 50,
        skip: filters.offset || 0,
        include: {
          events: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
      }),
      prisma.eTW.count({ where }),
    ]);

    return {
      etws: etws.map((e) => this.mapToETW(e)),
      total,
    };
  }

  /**
   * Delete ETW
   */
  async delete(id: string, tenantId: string, userId: string): Promise<void> {
    const existing = await prisma.eTW.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existing) {
      throw new Error(`ETW not found: ${id}`);
    }

    // Soft delete by updating status
    await prisma.eTW.update({
      where: { id },
      data: {
        status: "CANCELLED",
        updatedBy: userId,
      },
    });

    // Create evidence
    await evidenceService.createEvidence({
      entityType: "etw",
      entityId: id,
      evidenceType: "chain_of_custody",
      data: {
        action: "CANCELLED",
        cancelledBy: userId,
      },
      metadata: {
        etwId: id,
        tenantId,
      },
    });

    // Publish event
    await eventBus.publish({
      type: "etw.cancelled",
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      aggregateId: id,
      aggregateType: "ETW",
      version: existing.version,
      timestamp: new Date().toISOString(),
      payload: {
        etwId: id,
        cancelledBy: userId,
      },
      metadata: {
        tenantId,
        userId,
      },
    } as DomainEvent);
  }

  /**
   * Get ETW version
   */
  async getVersion(
    id: string,
    version: number,
    tenantId: string,
  ): Promise<ETW | null> {
    const versionRecord = await prisma.eTWVersion.findFirst({
      where: {
        etwId: id,
        version,
        tenantId,
      },
    });

    if (!versionRecord) {
      return null;
    }

    return versionRecord.data as ETW;
  }

  /**
   * Get all versions
   */
  async getVersions(id: string, tenantId: string): Promise<ETW[]> {
    const versions = await prisma.eTWVersion.findMany({
      where: {
        etwId: id,
        tenantId,
      },
      orderBy: { version: "desc" },
    });

    return versions.map((v) => v.data as ETW);
  }

  /**
   * Update ETW status
   */
  async updateStatus(
    id: string,
    status: ETWStatus,
    tenantId: string,
    userId: string,
  ): Promise<ETW> {
    return this.update(id, { status }, userId);
  }

  /**
   * Link ETW to shipment
   */
  async linkToShipment(
    etwId: string,
    shipmentId: string,
    tenantId: string,
  ): Promise<ETW> {
    const existing = await prisma.eTW.findFirst({
      where: {
        id: etwId,
        tenantId,
      },
    });

    if (!existing) {
      throw new Error(`ETW not found: ${etwId}`);
    }

    const updated = await prisma.eTW.update({
      where: { id: etwId },
      data: {
        shipmentId,
        updatedBy: "system",
      },
    });

    // Publish event
    await eventBus.publish({
      type: "etw.shipment.linked",
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      aggregateId: etwId,
      aggregateType: "ETW",
      version: existing.version,
      timestamp: new Date().toISOString(),
      payload: {
        etwId,
        shipmentId,
      },
      metadata: {
        tenantId,
      },
    } as DomainEvent);

    return this.mapToETW(updated);
  }

  /**
   * Link ETW to invoice
   */
  async linkToInvoice(
    etwId: string,
    invoiceId: string,
    tenantId: string,
  ): Promise<ETW> {
    const existing = await prisma.eTW.findFirst({
      where: {
        id: etwId,
        tenantId,
      },
    });

    if (!existing) {
      throw new Error(`ETW not found: ${etwId}`);
    }

    const updated = await prisma.eTW.update({
      where: { id: etwId },
      data: {
        invoiceId,
        updatedBy: "system",
      },
    });

    return this.mapToETW(updated);
  }

  /**
   * Map Prisma model to ETW type
   */
  private mapToETW(prismaETW: any): ETW {
    return {
      id: prismaETW.id,
      etwNumber: prismaETW.etwNumber,
      tenantId: prismaETW.tenantId,
      status: prismaETW.status as ETWStatus,
      version: prismaETW.version,
      scope: prismaETW.scope as ETWScope,
      mode: prismaETW.mode,
      isMultimodal: prismaETW.isMultimodal,
      references: prismaETW.references as TransportReferenceMatrix,
      parties: prismaETW.parties as any,
      cargo: prismaETW.cargo as any,
      compliance: prismaETW.compliance as any,
      permits: prismaETW.permits as any,
      route: prismaETW.route as any,
      commercial: prismaETW.commercial as any,
      riskSnapshot: prismaETW.riskSnapshot as any,
      milestones: prismaETW.milestones as any,
      events: (prismaETW.events || []).map((e: any) => ({
        id: e.id,
        etwId: e.etwId,
        type: e.type,
        timestamp: e.timestamp,
        actor: e.actor,
        location: e.location,
        evidenceRefs: e.evidenceRefs,
        description: e.description,
        metadata: e.metadata,
        handoverTo: e.handoverTo,
        verified: e.verified,
        verificationMethod: e.verificationMethod,
      })),
      legs: (prismaETW.legs || []).map((l: any) => ({
        id: l.id,
        etwId: l.etwId,
        legNumber: l.legNumber,
        mode: l.mode,
        origin: l.origin,
        destination: l.destination,
        carrier: l.carrier,
        vehicle: l.vehicle,
        estimatedStart: l.estimatedStart,
        actualStart: l.actualStart,
        estimatedEnd: l.estimatedEnd,
        actualEnd: l.actualEnd,
        status: l.status,
        events: [],
      })),
      delivery: prismaETW.delivery as any,
      verification: prismaETW.verification as any,
      attachments: (prismaETW.attachments || []).map((a: any) => ({
        id: a.id,
        etwId: a.etwId,
        type: a.type,
        name: a.name,
        url: a.url,
        mimeType: a.mimeType,
        size: a.size,
        uploadedAt: a.uploadedAt,
        uploadedBy: a.uploadedBy,
        metadata: a.metadata,
      })),
      legalNotice: prismaETW.legalNotice,
      metadata: prismaETW.metadata as any,
      createdAt: prismaETW.createdAt,
      updatedAt: prismaETW.updatedAt,
      createdBy: prismaETW.createdBy,
      updatedBy: prismaETW.updatedBy,
      shipmentId: prismaETW.shipmentId,
      invoiceId: prismaETW.invoiceId,
      podId: prismaETW.podId,
      exceptionIds: prismaETW.exceptionIds as string[],
    };
  }
}

// Export singleton instance
export const etwService: ETWService = new ETWServiceImpl();
