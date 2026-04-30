/**
 * ETW Permit Service
 *
 * Manages permit workflow for ETWs
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";
import type { PermitRecord } from "@/types/etw";

export interface ETWPermitService {
  getPermits(etwId: string, tenantId: string): Promise<PermitRecord[]>;
  addPermit(
    etwId: string,
    permit: Omit<PermitRecord, "id">,
    tenantId: string,
    userId: string,
  ): Promise<PermitRecord>;
  updatePermitStatus(
    permitId: string,
    status: PermitRecord["status"],
    tenantId: string,
    userId: string,
  ): Promise<PermitRecord>;
}

class ETWPermitServiceImpl implements ETWPermitService {
  async getPermits(etwId: string, tenantId: string): Promise<PermitRecord[]> {
    const permits = await prisma.eTWPermit.findMany({
      where: {
        etwId,
        tenantId,
      },
      orderBy: { createdAt: "asc" },
    });

    return permits.map((p) => ({
      id: p.id,
      type: p.type,
      authority: p.authority,
      status: p.status as PermitRecord["status"],
      required: p.required,
      submittedDocs: p.submittedDocs as any,
      avgProcessingHours: p.avgProcessingHours || undefined,
      estimatedCompletion: p.estimatedCompletion || undefined,
      actualCompletion: p.actualCompletion || undefined,
      notes: p.notes || undefined,
      rejectionReason: p.rejectionReason || undefined,
    }));
  }

  async addPermit(
    etwId: string,
    permit: Omit<PermitRecord, "id">,
    tenantId: string,
    userId: string,
  ): Promise<PermitRecord> {
    const created = await prisma.eTWPermit.create({
      data: {
        etwId,
        tenantId,
        type: permit.type,
        authority: permit.authority,
        status: permit.status,
        required: permit.required,
        submittedDocs: permit.submittedDocs as any,
        avgProcessingHours: permit.avgProcessingHours,
        estimatedCompletion: permit.estimatedCompletion,
        createdBy: userId,
      },
    });

    await eventBus.publish({
      type: "etw.permit.added",
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      aggregateId: etwId,
      aggregateType: "ETW",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        permitId: created.id,
        type: permit.type,
      },
      metadata: {
        tenantId,
        userId,
      },
    } as DomainEvent);

    return {
      id: created.id,
      ...permit,
    };
  }

  async updatePermitStatus(
    permitId: string,
    status: PermitRecord["status"],
    tenantId: string,
    userId: string,
  ): Promise<PermitRecord> {
    const permit = await prisma.eTWPermit.findFirst({
      where: {
        id: permitId,
        tenantId,
      },
    });

    if (!permit) {
      throw new Error(`Permit not found: ${permitId}`);
    }

    const updated = await prisma.eTWPermit.update({
      where: { id: permitId },
      data: {
        status,
        actualCompletion:
          status === "APPROVED" || status === "REJECTED"
            ? new Date()
            : undefined,
      },
    });

    return {
      id: updated.id,
      type: updated.type,
      authority: updated.authority,
      status: updated.status as PermitRecord["status"],
      required: updated.required,
      submittedDocs: updated.submittedDocs as any,
      avgProcessingHours: updated.avgProcessingHours || undefined,
      estimatedCompletion: updated.estimatedCompletion || undefined,
      actualCompletion: updated.actualCompletion || undefined,
      notes: updated.notes || undefined,
      rejectionReason: updated.rejectionReason || undefined,
    };
  }
}

export const etwPermitService: ETWPermitService = new ETWPermitServiceImpl();
