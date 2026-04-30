/**
 * ETW Event Service
 *
 * Manages chain-of-custody events with:
 * - Evidence integration
 * - Geo-location tracking
 * - Verification methods
 * - Event timeline
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-store";
import { evidenceService } from "@/lib/services/evidence";
import type { DomainEvent } from "@/types/cqrs";
import type { ETWEvent, ETWEventType, AddETWEventSchema } from "@/types/etw";
import { AddETWEventSchema as AddETWEventZodSchema } from "@/types/etw";
import { z } from "zod";

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

export interface ETWEventService {
  addEvent(data: z.infer<typeof AddETWEventZodSchema>): Promise<ETWEvent>;
  getEvents(etwId: string, tenantId: string): Promise<ETWEvent[]>;
  getEvent(id: string, tenantId: string): Promise<ETWEvent | null>;
  verifyEvent(
    eventId: string,
    method: "GPS" | "SIGNATURE" | "OTP" | "MANUAL",
    tenantId: string,
  ): Promise<ETWEvent>;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

class ETWEventServiceImpl implements ETWEventService {
  /**
   * Add chain-of-custody event
   */
  async addEvent(
    data: z.infer<typeof AddETWEventZodSchema>,
  ): Promise<ETWEvent> {
    // Validate input
    const validated = AddETWEventZodSchema.parse(data);

    // Get ETW to verify it exists
    const etw = await prisma.eTW.findUnique({
      where: { id: validated.etwId },
    });

    if (!etw) {
      throw new Error(`ETW not found: ${validated.etwId}`);
    }

    // Create evidence for event
    const evidence = await evidenceService.createEvidence({
      entityType: "etw",
      entityId: validated.etwId,
      evidenceType: "chain_of_custody",
      data: {
        eventType: validated.type,
        actor: validated.actor,
        location: validated.location,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        etwId: validated.etwId,
        tenantId: etw.tenantId,
        eventType: validated.type,
      },
    });

    // Create event in database
    const event = await prisma.eTWEvent.create({
      data: {
        etwId: validated.etwId,
        tenantId: etw.tenantId,
        type: validated.type,
        timestamp: new Date(),
        actor: validated.actor as any,
        location: validated.location as any,
        evidenceRefs: [evidence.id],
        description: validated.description,
        metadata: validated.metadata || {},
        verified: validated.verificationMethod ? true : false,
        verificationMethod: validated.verificationMethod,
        createdBy: validated.actor.id,
      },
    });

    // Update ETW status based on event type
    let newStatus = etw.status;
    if (validated.type === "PICKED_UP") {
      newStatus = "IN_PROGRESS";
    } else if (validated.type === "IN_TRANSIT") {
      newStatus = "IN_TRANSIT";
    } else if (validated.type === "AT_BORDER") {
      newStatus = "AT_BORDER";
    } else if (validated.type === "AT_PORT") {
      newStatus = "AT_PORT";
    } else if (validated.type === "CUSTOMS_CLEARED") {
      newStatus = "CUSTOMS_CLEARANCE";
    } else if (validated.type === "OUT_FOR_DELIVERY") {
      newStatus = "OUT_FOR_DELIVERY";
    } else if (validated.type === "DELIVERED") {
      newStatus = "DELIVERED";
    } else if (validated.type === "EXCEPTION") {
      newStatus = "EXCEPTION";
    }

    // Update ETW status if changed
    if (newStatus !== etw.status) {
      await prisma.eTW.update({
        where: { id: validated.etwId },
        data: { status: newStatus },
      });
    }

    // Publish event
    await eventBus.publish({
      type: "etw.event.added",
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      aggregateId: validated.etwId,
      aggregateType: "ETW",
      version: etw.version,
      timestamp: new Date().toISOString(),
      payload: {
        eventId: event.id,
        eventType: validated.type,
        actor: validated.actor,
      },
      metadata: {
        tenantId: etw.tenantId,
        userId: validated.actor.id,
      },
    } as DomainEvent);

    return this.mapToETWEvent(event);
  }

  /**
   * Get all events for ETW
   */
  async getEvents(etwId: string, tenantId: string): Promise<ETWEvent[]> {
    const events = await prisma.eTWEvent.findMany({
      where: {
        etwId,
        tenantId,
      },
      orderBy: { timestamp: "asc" },
    });

    return events.map((e) => this.mapToETWEvent(e));
  }

  /**
   * Get single event
   */
  async getEvent(id: string, tenantId: string): Promise<ETWEvent | null> {
    const event = await prisma.eTWEvent.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!event) {
      return null;
    }

    return this.mapToETWEvent(event);
  }

  /**
   * Verify event
   */
  async verifyEvent(
    eventId: string,
    method: "GPS" | "SIGNATURE" | "OTP" | "MANUAL",
    tenantId: string,
  ): Promise<ETWEvent> {
    const event = await prisma.eTWEvent.findFirst({
      where: {
        id: eventId,
        tenantId,
      },
    });

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const updated = await prisma.eTWEvent.update({
      where: { id: eventId },
      data: {
        verified: true,
        verificationMethod: method,
      },
    });

    return this.mapToETWEvent(updated);
  }

  /**
   * Map Prisma model to ETWEvent
   */
  private mapToETWEvent(prismaEvent: any): ETWEvent {
    return {
      id: prismaEvent.id,
      etwId: prismaEvent.etwId,
      type: prismaEvent.type as ETWEventType,
      timestamp: prismaEvent.timestamp,
      actor: prismaEvent.actor,
      location: prismaEvent.location,
      evidenceRefs: prismaEvent.evidenceRefs || [],
      description: prismaEvent.description,
      metadata: prismaEvent.metadata || {},
      handoverTo: prismaEvent.handoverTo,
      verified: prismaEvent.verified,
      verificationMethod: prismaEvent.verificationMethod,
    };
  }
}

// Export singleton instance
export const etwEventService: ETWEventService = new ETWEventServiceImpl();
