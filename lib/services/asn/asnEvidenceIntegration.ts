/**
 * ASN Evidence Integration
 * Tracks document lineage, chain of custody, and integrity for ASN operations
 * Integrates with platform evidence service
 */

import { evidenceService } from "@/lib/services/evidence/evidenceService";
import { asnService } from "./asnService";
import type { ASNData } from "@/types/asn";

export interface ASNEvidence {
  asnId: string;
  evidenceType:
    | "document"
    | "photo"
    | "signature"
    | "inspection"
    | "certificate";
  title: string;
  description?: string;
  fileUrl?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  createdBy?: string;
}

class ASNEvidenceIntegration {
  /**
   * Create evidence for ASN
   */
  async createEvidence(
    asnId: string,
    evidence: Omit<ASNEvidence, "asnId" | "timestamp">,
  ): Promise<string> {
    try {
      const asn = await asnService.getASNById(asnId);
      if (!asn) {
        throw new Error(`ASN ${asnId} not found`);
      }

      const evidenceId = await evidenceService.createEvidence({
        id: `asn-evidence-${asnId}-${Date.now()}`,
        type: this.mapEvidenceType(evidence.evidenceType),
        category: "asn",
        title: evidence.title,
        description:
          evidence.description || `Evidence for ASN ${asn.documentNumber}`,
        source: "asn-module",
        sourceId: asnId,
        metadata: {
          asnId,
          documentNumber: asn.documentNumber,
          vendorNumber: asn.vendorNumber,
          processType: asn.processType,
          ...evidence.metadata,
        },
        fileUrl: evidence.fileUrl,
        tenantId: "default", // Should come from context
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Link evidence to ASN lifecycle
      await this.linkEvidenceToLifecycle(asnId, evidenceId);

      return evidenceId;
    } catch (error) {
      console.error("[asn-evidence] Error creating evidence:", error);
      throw error;
    }
  }

  /**
   * Get all evidence for ASN
   */
  async getEvidenceForASN(asnId: string): Promise<ASNEvidence[]> {
    try {
      const evidenceItems = await evidenceService.searchEvidence({
        source: "asn-module",
        sourceId: asnId,
        limit: 100,
      });

      return evidenceItems.map((item) => ({
        asnId,
        evidenceType: this.mapFromEvidenceType(item.type),
        title: item.title,
        description: item.description,
        fileUrl: item.fileUrl,
        metadata: item.metadata,
        timestamp: item.createdAt || new Date().toISOString(),
        createdBy: item.createdBy,
      }));
    } catch (error) {
      console.error("[asn-evidence] Error getting evidence:", error);
      return [];
    }
  }

  /**
   * Track ASN document lineage
   */
  async trackDocumentLineage(
    asnId: string,
    documentType: string,
    action: string,
  ): Promise<void> {
    try {
      const asn = await asnService.getASNById(asnId);
      if (!asn) {
        throw new Error(`ASN ${asnId} not found`);
      }

      // Create evidence for lineage tracking
      await this.createEvidence(asnId, {
        evidenceType: "document",
        title: `${action}: ${documentType}`,
        description: `Document lineage tracking for ${documentType}`,
        metadata: {
          documentType,
          action,
          lineage: true,
        },
      });

      // Create chain of custody entry
      await evidenceService.createChainOfCustody({
        evidenceId: `asn-${asnId}`,
        fromCustodian: "system",
        toCustodian: "system",
        reason: `${action} on ${documentType}`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[asn-evidence] Error tracking lineage:", error);
    }
  }

  /**
   * Verify ASN integrity
   */
  async verifyASNIntegrity(asnId: string): Promise<{
    valid: boolean;
    issues: string[];
    evidenceCount: number;
  }> {
    try {
      const asn = await asnService.getASNById(asnId);
      if (!asn) {
        return {
          valid: false,
          issues: ["ASN not found"],
          evidenceCount: 0,
        };
      }

      const evidence = await this.getEvidenceForASN(asnId);
      const issues: string[] = [];

      // Check required evidence based on process type
      if (asn.processType === "INBOUND") {
        // Check for arrival photo
        const hasArrivalPhoto = evidence.some(
          (e) =>
            e.evidenceType === "photo" && e.metadata?.photoType === "arrival",
        );
        if (!hasArrivalPhoto && asn.status === "ARRIVED") {
          issues.push("Missing arrival photo");
        }

        // Check for offloading documentation
        if (
          asn.offloadingStartTime &&
          !evidence.some(
            (e) =>
              e.evidenceType === "document" &&
              e.metadata?.documentType === "offloading",
          )
        ) {
          issues.push("Missing offloading documentation");
        }
      }

      // Check for goods receipt documentation
      if (
        asn.goodsReceiptDate &&
        !evidence.some(
          (e) =>
            e.evidenceType === "document" &&
            e.metadata?.documentType === "goods_receipt",
        )
      ) {
        issues.push("Missing goods receipt documentation");
      }

      return {
        valid: issues.length === 0,
        issues,
        evidenceCount: evidence.length,
      };
    } catch (error) {
      console.error("[asn-evidence] Error verifying integrity:", error);
      return {
        valid: false,
        issues: ["Error verifying integrity"],
        evidenceCount: 0,
      };
    }
  }

  /**
   * Get evidence chain for ASN
   */
  async getEvidenceChain(asnId: string): Promise<
    Array<{
      timestamp: string;
      action: string;
      custodian: string;
      reason: string;
    }>
  > {
    try {
      const chain = await evidenceService.getChainOfCustody(`asn-${asnId}`);
      if (!chain) {
        return [];
      }

      return chain.transfers.map((transfer) => ({
        timestamp: transfer.timestamp,
        action: transfer.reason,
        custodian: transfer.toCustodian,
        reason: transfer.reason,
      }));
    } catch (error) {
      console.error("[asn-evidence] Error getting evidence chain:", error);
      return [];
    }
  }

  /**
   * Map ASN evidence type to evidence service type
   */
  private mapEvidenceType(type: ASNEvidence["evidenceType"]): string {
    const mapping: Record<string, string> = {
      document: "document",
      photo: "image",
      signature: "document",
      inspection: "document",
      certificate: "document",
    };
    return mapping[type] || "document";
  }

  /**
   * Map from evidence service type to ASN evidence type
   */
  private mapFromEvidenceType(type: string): ASNEvidence["evidenceType"] {
    const mapping: Record<string, ASNEvidence["evidenceType"]> = {
      document: "document",
      image: "photo",
    };
    return mapping[type] || "document";
  }

  /**
   * Link evidence to lifecycle
   */
  private async linkEvidenceToLifecycle(
    asnId: string,
    evidenceId: string,
  ): Promise<void> {
    try {
      // This would link evidence to the ASN lifecycle stage
      // Implementation depends on lifecycle service API
      console.log(
        `[asn-evidence] Linking evidence ${evidenceId} to ASN ${asnId} lifecycle`,
      );
    } catch (error) {
      console.error("[asn-evidence] Error linking to lifecycle:", error);
    }
  }
}

export const asnEvidenceIntegration = new ASNEvidenceIntegration();
