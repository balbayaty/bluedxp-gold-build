/**
 * Evidence Packet Service
 *
 * Main service for managing evidence packets
 * Tamper-evident, court-ready evidence management
 *
 * @module evidence
 */

import { evidencePacketGenerator } from "./packet-generator";
import { merkleTreeBuilder } from "./merkle-tree";
import { eventStore, eventBus, createEvent } from "@/lib/services/event-store";
import type {
  EvidencePacket,
  EvidencePacketRequest,
  PacketVerification,
  CourtReadyPacket,
} from "./packet-types";

// ============================================================================
// IN-MEMORY STORE (Will be replaced with database)
// ============================================================================

class PacketStore {
  private packets: Map<string, EvidencePacket> = new Map();
  private verificationStatus: Map<string, PacketVerification> = new Map();

  get(id: string): EvidencePacket | undefined {
    return this.packets.get(id);
  }

  set(id: string, packet: EvidencePacket): void {
    this.packets.set(id, packet);
  }

  getAll(): EvidencePacket[] {
    return Array.from(this.packets.values());
  }

  getByEntity(entityType: string, entityId: string): EvidencePacket[] {
    return this.getAll().filter(
      (p) => p.entityType === entityType && p.entityId === entityId,
    );
  }

  getVerification(id: string): PacketVerification | undefined {
    return this.verificationStatus.get(id);
  }

  setVerification(id: string, verification: PacketVerification): void {
    this.verificationStatus.set(id, verification);
  }
}

const store = new PacketStore();

// ============================================================================
// EVIDENCE PACKET SERVICE
// ============================================================================

export class EvidencePacketService {
  /**
   * Generate evidence packet
   */
  async generatePacket(
    request: EvidencePacketRequest,
    actor: {
      id: string;
      name: string;
      tenantId: string;
      type: "user" | "system" | "agent";
    },
  ): Promise<EvidencePacket> {
    try {
      // Generate packet using generator
      const packet = await evidencePacketGenerator.generatePacket(
        request,
        actor,
      );

      // Store packet
      store.set(packet.id, packet);

      // Publish event
      await eventBus.publish(
        createEvent(
          "EvidencePacketGenerated",
          packet.entityId,
          packet.entityType,
          {
            packetId: packet.id,
            entityType: packet.entityType,
            entityId: packet.entityId,
            claimType: packet.claimType,
          },
          1,
          {
            tenantId: actor.tenantId,
            correlationId: `packet-${Date.now()}`,
            userId: actor.id,
          },
        ),
      );

      return packet;
    } catch (error) {
      console.error("Error generating evidence packet:", error);
      throw new Error(
        `Failed to generate evidence packet: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get packet by ID
   */
  async getPacket(packetId: string): Promise<EvidencePacket | null> {
    try {
      const packet = store.get(packetId);
      return packet || null;
    } catch (error) {
      console.error("Error getting evidence packet:", error);
      return null;
    }
  }

  /**
   * Get packets by entity
   */
  async getPacketsByEntity(
    entityType: string,
    entityId: string,
  ): Promise<EvidencePacket[]> {
    try {
      return store.getByEntity(entityType, entityId);
    } catch (error) {
      console.error("Error getting packets by entity:", error);
      return [];
    }
  }

  /**
   * Verify packet integrity
   */
  async verifyPacket(packetId: string): Promise<PacketVerification> {
    try {
      const packet = store.get(packetId);
      if (!packet) {
        return {
          packetId,
          valid: false,
          verificationScore: 0,
          contradictionsFound: 0,
          issues: ["Packet not found"],
          verifiedAt: new Date(),
        };
      }

      // Verify using generator
      const verification = await evidencePacketGenerator.verifyPacket(packet);

      // Store verification
      store.setVerification(packetId, verification);

      return verification;
    } catch (error) {
      console.error("Error verifying evidence packet:", error);
      return {
        packetId,
        valid: false,
        verificationScore: 0,
        contradictionsFound: 0,
        issues: [
          `Verification error: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
        verifiedAt: new Date(),
      };
    }
  }

  /**
   * Update verification status
   */
  async updateVerificationStatus(
    packetId: string,
    status: "VERIFIED" | "INVALID" | "PENDING",
    notes?: string,
  ): Promise<void> {
    try {
      const verification = store.getVerification(packetId);
      if (verification) {
        verification.status = status;
        if (notes) {
          verification.notes = notes;
        }
        verification.verifiedAt = new Date();
        store.setVerification(packetId, verification);
      }
    } catch (error) {
      console.error("Error updating verification status:", error);
      throw error;
    }
  }

  /**
   * Generate court-ready packet
   */
  async generateCourtReadyPacket(packetId: string): Promise<CourtReadyPacket> {
    try {
      const packet = store.get(packetId);
      if (!packet) {
        throw new Error(`Packet ${packetId} not found`);
      }

      // Generate court-ready version
      const courtReady =
        await evidencePacketGenerator.generateCourtReadyPacket(packet);

      return courtReady;
    } catch (error) {
      console.error("Error generating court-ready packet:", error);
      throw new Error(
        `Failed to generate court-ready packet: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Set legal hold
   */
  async setLegalHold(
    packetId: string,
    hold: boolean,
    reason?: string,
    tenantId?: string,
  ): Promise<void> {
    try {
      const packet = store.get(packetId);
      if (!packet) {
        throw new Error(`Packet ${packetId} not found`);
      }

      packet.legalHold = hold;
      if (hold && reason) {
        packet.legalHoldReason = reason;
        packet.legalHoldDate = new Date();
      } else if (!hold) {
        packet.legalHoldReason = undefined;
        packet.legalHoldDate = undefined;
      }

      store.set(packetId, packet);

      // Publish event
      await eventBus.publish(
        createEvent(
          hold
            ? "EvidencePacketLegalHoldSet"
            : "EvidencePacketLegalHoldRemoved",
          packet.entityId,
          packet.entityType,
          {
            packetId,
            hold,
            reason,
          },
          1,
          {
            tenantId: tenantId || "default",
            correlationId: `legal-hold-${Date.now()}`,
            userId: "evidence-service",
          },
        ),
      );
    } catch (error) {
      console.error("Error setting legal hold:", error);
      throw error;
    }
  }
}

// Export singleton
export const evidencePacketService = new EvidencePacketService();
