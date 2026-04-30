/**
 * Integration Database Adapter
 * Database persistence for external integrations using Prisma
 */

import { PrismaClient } from "@prisma/client";
import type {
  BaseIntegration,
  IntegrationType,
  IntegrationStatus,
  IntegrationEvent,
} from "@/types/external-integrations";

const prisma = new PrismaClient();

export class IntegrationDatabaseAdapter {
  /**
   * Create integration
   */
  async createIntegration(
    integration: Omit<BaseIntegration, "id" | "createdAt" | "updatedAt">,
  ): Promise<BaseIntegration> {
    const created = await prisma.externalIntegration.create({
      data: {
        type: integration.type,
        name: integration.name,
        description: integration.description,
        status: integration.status,
        tenantId: integration.tenantId,
        userId: integration.userId,
        enabled: integration.enabled,
        config: integration.config as any,
        metadata: integration.metadata as any,
        lastSyncAt: integration.lastSyncAt,
      },
    });

    return this.mapToBaseIntegration(created);
  }

  /**
   * Get integration by ID
   */
  async getIntegration(integrationId: string): Promise<BaseIntegration | null> {
    const integration = await prisma.externalIntegration.findUnique({
      where: { id: integrationId },
    });

    return integration ? this.mapToBaseIntegration(integration) : null;
  }

  /**
   * Get integrations by tenant
   */
  async getIntegrationsByTenant(
    tenantId: string,
    filters?: {
      type?: IntegrationType;
      status?: IntegrationStatus;
      enabled?: boolean;
    },
  ): Promise<BaseIntegration[]> {
    const where: any = { tenantId };

    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.enabled !== undefined) {
      where.enabled = filters.enabled;
    }

    const integrations = await prisma.externalIntegration.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return integrations.map((i) => this.mapToBaseIntegration(i));
  }

  /**
   * Update integration
   */
  async updateIntegration(
    integrationId: string,
    updates: Partial<Omit<BaseIntegration, "id" | "createdAt" | "tenantId">>,
  ): Promise<BaseIntegration> {
    const updated = await prisma.externalIntegration.update({
      where: { id: integrationId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && {
          description: updates.description,
        }),
        ...(updates.status && { status: updates.status }),
        ...(updates.userId !== undefined && { userId: updates.userId }),
        ...(updates.enabled !== undefined && { enabled: updates.enabled }),
        ...(updates.config && { config: updates.config as any }),
        ...(updates.metadata !== undefined && {
          metadata: updates.metadata as any,
        }),
        ...(updates.lastSyncAt !== undefined && {
          lastSyncAt: updates.lastSyncAt,
        }),
      },
    });

    return this.mapToBaseIntegration(updated);
  }

  /**
   * Delete integration
   */
  async deleteIntegration(integrationId: string): Promise<void> {
    await prisma.externalIntegration.delete({
      where: { id: integrationId },
    });
  }

  /**
   * Create integration event
   */
  async createEvent(
    integrationId: string,
    event: Omit<IntegrationEvent, "id" | "createdAt" | "processed">,
  ): Promise<IntegrationEvent> {
    const created = await prisma.integrationEvent.create({
      data: {
        integrationId,
        eventType: event.eventType,
        data: event.data as any,
        processed: false,
      },
    });

    return {
      id: created.id,
      integrationId: created.integrationId,
      eventType: created.eventType as any,
      data: created.data as any,
      processed: created.processed,
      timestamp: created.createdAt,
    };
  }

  /**
   * Get unprocessed events
   */
  async getUnprocessedEvents(
    integrationId?: string,
  ): Promise<IntegrationEvent[]> {
    const where: any = { processed: false };
    if (integrationId) {
      where.integrationId = integrationId;
    }

    const events = await prisma.integrationEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return events.map((e) => ({
      id: e.id,
      integrationId: e.integrationId,
      eventType: e.eventType as any,
      data: e.data as any,
      processed: e.processed,
      timestamp: e.createdAt,
    }));
  }

  /**
   * Mark event as processed
   */
  async markEventProcessed(eventId: string): Promise<void> {
    await prisma.integrationEvent.update({
      where: { id: eventId },
      data: { processed: true },
    });
  }

  /**
   * Map Prisma model to BaseIntegration
   */
  private mapToBaseIntegration(prismaIntegration: any): BaseIntegration {
    return {
      id: prismaIntegration.id,
      type: prismaIntegration.type as IntegrationType,
      name: prismaIntegration.name,
      description: prismaIntegration.description || undefined,
      status: prismaIntegration.status as IntegrationStatus,
      tenantId: prismaIntegration.tenantId,
      userId: prismaIntegration.userId || undefined,
      enabled: prismaIntegration.enabled,
      createdAt: prismaIntegration.createdAt,
      updatedAt: prismaIntegration.updatedAt,
      lastSyncAt: prismaIntegration.lastSyncAt || undefined,
      config: prismaIntegration.config as Record<string, any>,
      metadata: prismaIntegration.metadata as Record<string, any> | undefined,
    };
  }
}

export const integrationDatabaseAdapter = new IntegrationDatabaseAdapter();
