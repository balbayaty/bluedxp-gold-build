/**
 * Event Store Persistence
 * Persists events to database for CQRS/Event Sourcing
 */

import { prisma } from "./prismaClient";
import { eventBus } from "@/lib/services/event-bus";
import type { DomainEvent } from "@/types/cqrs";

class EventStorePersistence {
  /**
   * Initialize event store persistence
   */
  initialize(): void {
    // Subscribe to all events and persist them
    eventBus.subscribe("*", async (event: DomainEvent) => {
      await this.persistEvent(event);
    });
  }

  /**
   * Persist event to database
   */
  async persistEvent(event: DomainEvent): Promise<void> {
    try {
      await prisma.event.create({
        data: {
          id: event.id,
          aggregateId: event.aggregateId,
          aggregateType: event.aggregateType,
          eventType: event.type,
          version: event.version,
          payload: event.payload as any,
          metadata: event.metadata as any,
          timestamp: new Date(event.timestamp),
          tenantId:
            (event.payload as any)?.tenantId ||
            (event.metadata as any)?.tenantId,
        },
      });
    } catch (error) {
      console.error("Error persisting event:", error);
      // Don't throw - event bus should continue even if persistence fails
    }
  }

  /**
   * Get events for aggregate
   */
  async getEvents(
    aggregateId: string,
    aggregateType: string,
    fromVersion?: number,
  ): Promise<DomainEvent[]> {
    const events = await prisma.event.findMany({
      where: {
        aggregateId,
        aggregateType,
        ...(fromVersion && { version: { gte: fromVersion } }),
      },
      orderBy: {
        version: "asc",
      },
    });

    return events.map((e) => ({
      id: e.id,
      type: e.eventType,
      aggregateId: e.aggregateId,
      aggregateType: e.aggregateType,
      version: e.version,
      timestamp: e.timestamp.toISOString(),
      payload: e.payload as any,
      metadata: e.metadata as any,
    }));
  }

  /**
   * Save snapshot
   */
  async saveSnapshot(
    aggregateId: string,
    aggregateType: string,
    version: number,
    state: any,
    tenantId?: string,
  ): Promise<void> {
    await prisma.snapshot.create({
      data: {
        aggregateId,
        aggregateType,
        version,
        state: state as any,
        timestamp: new Date(),
        tenantId,
      },
    });
  }

  /**
   * Get latest snapshot
   */
  async getLatestSnapshot(
    aggregateId: string,
    aggregateType: string,
  ): Promise<{ version: number; state: any } | null> {
    const snapshot = await prisma.snapshot.findFirst({
      where: {
        aggregateId,
        aggregateType,
      },
      orderBy: {
        version: "desc",
      },
    });

    if (!snapshot) {
      return null;
    }

    return {
      version: snapshot.version,
      state: snapshot.state as any,
    };
  }
}

export const eventStorePersistence = new EventStorePersistence();

// Initialize on module load (server-side only)
if (typeof window === "undefined") {
  eventStorePersistence.initialize();
}
