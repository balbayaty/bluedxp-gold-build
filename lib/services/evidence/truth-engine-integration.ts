/**
 * Truth Engine Integration
 *
 * Integrates Evidence Packets with Truth Engine
 * Automatically links evidence to truth events
 *
 * @module evidence
 */

import { truthEngine } from "@/lib/services/truth-engine/truthEngineService";
import { evidencePacketService } from "./packet-service";
import type { EvidencePacket } from "./packet-types";

/**
 * Link evidence packet to truth event
 */
export async function linkPacketToTruthEvent(
  packetId: string,
  truthEventId: string,
): Promise<void> {
  try {
    const packet = await evidencePacketService.getPacket(packetId);
    if (!packet) {
      throw new Error(`Packet ${packetId} not found`);
    }

    // Get all evidence IDs from packet
    const evidenceIds = [
      ...packet.documents.map((d) => d.id),
      ...packet.signatures.map((s) => s.id),
    ];

    // Link evidence to truth event
    await truthEngine.linkEvidenceToEvent(truthEventId, evidenceIds);

    // Publish integration event
    const { eventBus, createEvent } =
      await import("@/lib/services/event-store");
    await eventBus.publish(
      createEvent(
        "EvidencePacketLinkedToTruthEvent",
        packet.entityId,
        packet.entityType,
        {
          packetId: packet.id,
          evidenceId: packet.evidenceId,
          truthEventId,
          evidenceCount: evidenceIds.length,
        },
        1,
        {
          tenantId: packet.tenantId,
          correlationId: `link-${Date.now()}`,
          userId: "evidence-packet-service",
        },
      ),
    );
  } catch (error) {
    console.warn("Error linking packet to truth event:", error);
    throw error;
  }
}

/**
 * Generate evidence packet from truth event
 */
export async function generatePacketFromTruthEvent(
  truthEventId: string,
  claimType: EvidencePacket["claimType"],
  actor: {
    id: string;
    name: string;
    tenantId: string;
    role?: string;
    type: "user" | "system" | "api" | "integration";
  },
): Promise<EvidencePacket> {
  try {
    // Get truth event
    const event = await truthEngine.getEvent(truthEventId);
    if (!event) {
      throw new Error(`Truth event ${truthEventId} not found`);
    }

    // Get evidence linked to event
    const evidenceIds = event.evidenceLinks || [];
    if (evidenceIds.length === 0) {
      throw new Error(`Truth event ${truthEventId} has no linked evidence`);
    }

    // Generate packet
    const packet = await evidencePacketService.generatePacket(
      {
        entityType: event.entityType,
        entityId: event.entityId,
        claimType,
        claim: `Evidence packet for truth event ${truthEventId}: ${event.eventType}`,
      },
      actor,
    );

    // Link packet to truth event
    await linkPacketToTruthEvent(packet.id, truthEventId);

    return packet;
  } catch (error) {
    console.error("Error generating packet from truth event:", error);
    throw error;
  }
}
