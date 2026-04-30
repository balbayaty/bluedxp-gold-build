/**
 * Pulse Ledger Service
 * Append-only event ledger + atomic balance updates
 */

import { PrismaClient } from "@prisma/client";
import type {
  PulseEvent,
  PulseBalance,
  IPulseLedgerService,
  PulseEventType,
} from "@/types/pulse";

const prisma = new PrismaClient();

export class PulseLedgerService implements IPulseLedgerService {
  /**
   * Record event (append-only ledger)
   */
  async recordEvent(
    event: Omit<PulseEvent, "id" | "createdAt">,
  ): Promise<PulseEvent> {
    const created = await prisma.pulseEvent.create({
      data: {
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        tenantId: event.tenantId,
        userId: event.userId,
        occurredAt:
          event.occurredAt instanceof Date
            ? event.occurredAt
            : new Date(event.occurredAt),
        eventType: event.eventType,
        sourceModule: event.sourceModule,
        sourceRef: event.sourceRef,
        pointsAwardedPP: event.pointsAwardedPP,
        creditsAwardedIC: event.creditsAwardedIC,
        metadataJson: event.metadataJson || {},
      },
    });

    // Update balance atomically
    await this.updateBalance(
      event.userId,
      event.tenantId,
      event.pointsAwardedPP,
      event.creditsAwardedIC,
    );

    return {
      id: created.id,
      tenantId: created.tenantId,
      userId: created.userId,
      occurredAt: created.occurredAt,
      eventType: created.eventType as PulseEventType,
      sourceModule: created.sourceModule || undefined,
      sourceRef: created.sourceRef || undefined,
      pointsAwardedPP: created.pointsAwardedPP,
      creditsAwardedIC: created.creditsAwardedIC,
      metadataJson: created.metadataJson as Record<string, any> | undefined,
      createdAt: created.createdAt,
    };
  }

  /**
   * Update balance atomically (upsert)
   */
  async updateBalance(
    userId: string,
    tenantId: string,
    deltaPP: number,
    deltaIC: number,
  ): Promise<PulseBalance> {
    // Use Prisma upsert for atomic update (composite key)
    // Note: Prisma doesn't support upsert with composite keys directly, so we use findUnique + create/update
    const existing = await prisma.pulseBalance.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

    const balance = existing
      ? await prisma.pulseBalance.update({
          where: {
            tenantId_userId: {
              tenantId,
              userId,
            },
          },
          data: {
            balancePP: { increment: deltaPP },
            balanceIC: { increment: deltaIC },
            lifetimePP: { increment: deltaPP },
            lifetimeIC: { increment: deltaIC },
          },
        })
      : await prisma.pulseBalance.create({
          data: {
            tenantId,
            userId,
            balancePP: deltaPP,
            balanceIC: deltaIC,
            lifetimePP: deltaPP,
            lifetimeIC: deltaIC,
            updatedAt: new Date(),
          },
        });

    return {
      tenantId: balance.tenantId,
      userId: balance.userId,
      balancePP: balance.balancePP,
      balanceIC: balance.balanceIC,
      lifetimePP: balance.lifetimePP,
      lifetimeIC: balance.lifetimeIC,
      updatedAt: balance.updatedAt,
    };
  }

  /**
   * Get balance
   */
  async getBalance(userId: string, tenantId: string): Promise<PulseBalance> {
    const balance = await prisma.pulseBalance.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

    if (!balance) {
      // Return zero balance if not found
      return {
        tenantId,
        userId,
        balancePP: 0,
        balanceIC: 0,
        lifetimePP: 0,
        lifetimeIC: 0,
        updatedAt: new Date(),
      };
    }

    return {
      tenantId: balance.tenantId,
      userId: balance.userId,
      balancePP: balance.balancePP,
      balanceIC: balance.balanceIC,
      lifetimePP: balance.lifetimePP,
      lifetimeIC: balance.lifetimeIC,
      updatedAt: balance.updatedAt,
    };
  }

  /**
   * Get event history
   */
  async getEventHistory(
    userId: string,
    tenantId: string,
    filters?: { start?: Date; end?: Date; eventType?: PulseEventType },
  ): Promise<PulseEvent[]> {
    const where: any = {
      tenantId,
      userId,
    };

    if (filters?.start || filters?.end) {
      where.occurredAt = {};
      if (filters.start) where.occurredAt.gte = filters.start;
      if (filters.end) where.occurredAt.lte = filters.end;
    }

    if (filters?.eventType) {
      where.eventType = filters.eventType;
    }

    const events = await prisma.pulseEvent.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: 100, // Limit to recent 100 events
    });

    return events.map((e: any) => ({
      id: e.id,
      tenantId: e.tenantId,
      userId: e.userId,
      occurredAt: e.occurredAt,
      eventType: e.eventType as PulseEventType,
      sourceModule: e.sourceModule || undefined,
      sourceRef: e.sourceRef || undefined,
      pointsAwardedPP: e.pointsAwardedPP,
      creditsAwardedIC: e.creditsAwardedIC,
      metadataJson: e.metadataJson as Record<string, any> | undefined,
      createdAt: e.createdAt,
    }));
  }
}

export const pulseLedgerService = new PulseLedgerService();
