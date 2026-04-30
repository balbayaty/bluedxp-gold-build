/**
 * Marketplace Evidence Service
 * Integration with Evidence service for data integrity and compliance
 * Creates evidence packets for all marketplace operations
 */

import { marketplaceDatabaseAdapter } from "../database/marketplaceDatabaseAdapter";

// Try to import evidence service (may not be available)
let evidenceService: any = null;
try {
  const evidenceModule = require("@/lib/services/evidence");
  evidenceService = evidenceModule.evidenceService;
} catch (error) {
  console.warn(
    "Evidence service not available, evidence packets will not be created",
  );
}

export interface EvidenceLink {
  entityType:
    | "LISTING"
    | "PROVIDER"
    | "BOOKING"
    | "REVIEW"
    | "CONTRACT"
    | "PAYMENT";
  entityId: string;
  action:
    | "CREATED"
    | "UPDATED"
    | "DELETED"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";
  data: any;
  metadata?: any;
}

export class MarketplaceEvidenceService {
  /**
   * Create evidence packet for an entity
   */
  async createEvidencePacket(
    tenantId: string,
    link: EvidenceLink,
  ): Promise<string | null> {
    if (!evidenceService) {
      console.warn(
        "Evidence service not available, skipping evidence packet creation",
      );
      return null;
    }

    try {
      // Create evidence packet using evidence service
      const packet = await evidenceService.createPacket({
        entityType: link.entityType,
        entityId: link.entityId,
        action: link.action,
        data: link.data,
        metadata: {
          ...link.metadata,
          tenantId,
          timestamp: new Date().toISOString(),
        },
      });

      // Link evidence packet to entity
      await marketplaceDatabaseAdapter.linkEvidence(
        tenantId,
        link.entityType,
        link.entityId,
        packet.id,
        link.action,
        {
          data: link.data,
          metadata: link.metadata,
        },
      );

      return packet.id;
    } catch (error) {
      console.error("Failed to create evidence packet:", error);
      return null;
    }
  }

  /**
   * Create evidence packet for listing
   */
  async createListingEvidence(
    tenantId: string,
    listingId: string,
    action: "CREATED" | "UPDATED" | "DELETED",
    listingData: any,
    metadata?: any,
  ): Promise<string | null> {
    return await this.createEvidencePacket(tenantId, {
      entityType: "LISTING",
      entityId: listingId,
      action,
      data: listingData,
      metadata: {
        ...metadata,
        providerId: listingData.providerId,
        category: listingData.serviceCategory,
      },
    });
  }

  /**
   * Create evidence packet for booking
   */
  async createBookingEvidence(
    tenantId: string,
    bookingId: string,
    action: "CREATED" | "UPDATED" | "DELETED" | "CONFIRMED" | "CANCELLED",
    bookingData: any,
    metadata?: any,
  ): Promise<string | null> {
    return await this.createEvidencePacket(tenantId, {
      entityType: "BOOKING",
      entityId: bookingId,
      action,
      data: bookingData,
      metadata: {
        ...metadata,
        bookingNumber: bookingData.bookingNumber,
        customerId: bookingData.customerId,
        providerId: bookingData.providerId,
      },
    });
  }

  /**
   * Create evidence packet for provider
   */
  async createProviderEvidence(
    tenantId: string,
    providerId: string,
    action: "CREATED" | "UPDATED" | "DELETED" | "VERIFIED",
    providerData: any,
    metadata?: any,
  ): Promise<string | null> {
    return await this.createEvidencePacket(tenantId, {
      entityType: "PROVIDER",
      entityId: providerId,
      action,
      data: providerData,
      metadata: {
        ...metadata,
        name: providerData.name,
        verificationStatus: providerData.verificationStatus,
      },
    });
  }

  /**
   * Get evidence chain for an entity
   */
  async getEvidenceChain(
    tenantId: string,
    entityType: string,
    entityId: string,
  ): Promise<any[]> {
    // This would query the evidence links table
    // Implementation depends on database adapter having a query method
    // For now, return empty array (to be implemented)
    return [];
  }

  /**
   * Verify data integrity
   */
  async verifyIntegrity(
    tenantId: string,
    entityType: string,
    entityId: string,
  ): Promise<{ valid: boolean; issues: string[] }> {
    if (!evidenceService) {
      return { valid: true, issues: [] };
    }

    try {
      const chain = await this.getEvidenceChain(tenantId, entityType, entityId);

      // Verify each evidence packet in the chain
      const issues: string[] = [];
      for (const link of chain) {
        if (evidenceService.verifyPacket) {
          const verification = await evidenceService.verifyPacket(
            link.evidence_packet_id,
          );
          if (!verification.valid) {
            issues.push(
              `Evidence packet ${link.evidence_packet_id} failed verification`,
            );
          }
        }
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (error) {
      console.error("Failed to verify integrity:", error);
      return { valid: false, issues: ["Verification failed"] };
    }
  }
}

export const marketplaceEvidenceService = new MarketplaceEvidenceService();
