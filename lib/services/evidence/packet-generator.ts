/**
 * Evidence Packet Generator
 *
 * Generates court-ready evidence packets with Merkle tree integrity
 * Tamper-evident, chain of custody, legal hold support
 *
 * @module evidence
 */

import crypto from "crypto";
import { eventStore } from "@/lib/services/event-store";
import { evidenceService } from "./evidenceService";
import { merkleTreeBuilder } from "./merkle-tree";
import { contradictionDetector } from "./contradiction-detector";
import { eventBus, createEvent } from "@/lib/services/event-store";
import type {
  EvidencePacket,
  EvidencePacketRequest,
  AuditEvent,
  EvidenceDocument,
  DigitalSignature,
  Actor,
  ClaimType,
  RetentionPolicy,
  CourtReadyPacket,
} from "./packet-types";
import type { Evidence } from "@/types/evidence";

// ============================================================================
// EVIDENCE PACKET GENERATOR
// ============================================================================

export class EvidencePacketGenerator {
  /**
   * Generate evidence packet
   */
  async generatePacket(
    request: EvidencePacketRequest,
    actor: Actor,
  ): Promise<EvidencePacket> {
    // 1. Gather all related events
    const events = await this.gatherEvents(
      request.entityType,
      request.entityId,
      actor.tenantId,
      request.dateRange,
    );

    // 2. Gather supporting documents
    const documents =
      request.includeDocuments !== false
        ? await this.gatherDocuments(
            request.entityType,
            request.entityId,
            actor.tenantId,
          )
        : [];

    // 3. Gather digital signatures
    const signatures =
      request.includeSignatures !== false
        ? await this.gatherSignatures(
            request.entityType,
            request.entityId,
            actor.tenantId,
          )
        : [];

    // 4. Detect contradictions
    const contradictionAnalysis =
      await contradictionDetector.detectContradictions(
        events,
        documents,
        signatures,
      );

    // 5. Build Merkle tree for integrity
    const leaves = [
      ...events.map((e) => this.hashEvent(e)),
      ...documents.map((d) => d.hash),
      ...signatures.map((s) => s.hash),
    ];
    const merkleTree = merkleTreeBuilder.buildTree(leaves);
    const merkleRoot = merkleTree.rootHash;

    // 6. Generate content hash
    const contentHash = this.hashContent({ events, documents, signatures });

    // 7. Generate evidence ID
    const evidenceId = await this.generateEvidenceId(actor.tenantId);

    // 8. Generate claim
    const claim =
      request.claim ||
      this.generateClaim(
        request.claimType,
        request.entityType,
        request.entityId,
      );

    // 9. Calculate expiration date
    const expiresAt = this.calculateExpirationDate(
      request.retentionPolicy || "7y",
    );

    // 10. Create packet
    const packet: EvidencePacket = {
      id: `packet-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId: actor.tenantId,
      evidenceId,
      version: 1,
      claim,
      claimType: request.claimType,
      entityType: request.entityType,
      entityId: request.entityId,
      events,
      documents,
      signatures,
      contentHash,
      merkleRoot,
      previousPacketHash: undefined, // Would link to previous version if exists
      verificationStatus: "unverified",
      retentionPolicy: request.retentionPolicy || "7y",
      expiresAt,
      legalHold: request.legalHold || false,
      jurisdictions: request.jurisdictions || ["SA"],
      generatedAt: new Date(),
      generatedBy: actor,
      contradictionIndex: contradictionAnalysis.contradictionIndex,
      contradictions: contradictionAnalysis.contradictions,
      formattedForCourt: false,
    };

    // 11. Store packet
    await this.storePacket(packet);

    // 12. Publish event
    await eventBus.publish(
      createEvent(
        "EvidencePacketCreated",
        request.entityId,
        request.entityType,
        {
          packetId: packet.id,
          evidenceId: packet.evidenceId,
          entityType: request.entityType,
          entityId: request.entityId,
          contradictionIndex: packet.contradictionIndex,
          contradictionsCount: packet.contradictions.length,
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
  }

  /**
   * Generate court-ready formatted packet
   */
  async generateCourtReadyPacket(
    packetId: string,
    caseNumber?: string,
  ): Promise<CourtReadyPacket> {
    const packet = await this.getPacket(packetId);
    if (!packet) {
      throw new Error(`Packet ${packetId} not found`);
    }

    // Format for court
    const formattedDocument = {
      coverPage: {
        caseNumber,
        title: `Evidence Packet: ${packet.claim}`,
        generatedDate: packet.generatedAt,
        generatedBy: `${packet.generatedBy.name} (${packet.generatedBy.role || "System"})`,
        jurisdiction: packet.jurisdictions,
      },
      executiveSummary: this.generateExecutiveSummary(packet),
      evidenceTimeline: this.generateTimeline(packet),
      evidenceExhibits: this.generateExhibits(packet),
      chainOfCustody: this.generateChainOfCustody(packet),
      integrityVerification: {
        merkleRoot: packet.merkleRoot,
        contentHash: packet.contentHash,
        verificationStatus: packet.verificationStatus,
        verifiedAt: packet.verifiedAt,
        verifiedBy: packet.verifiedBy,
      },
      contradictions: packet.contradictions.map((c) => ({
        severity: c.severity,
        description: c.description,
        explanation: c.explanation,
      })),
      appendices: await this.generateAppendices(packet),
    };

    // Update packet
    packet.formattedForCourt = true;
    packet.courtFormat = formattedDocument;
    await this.storePacket(packet);

    return {
      packet,
      formattedDocument,
    };
  }

  /**
   * Verify packet integrity
   */
  async verifyPacket(packetId: string): Promise<{
    valid: boolean;
    issues: string[];
    merkleTreeValid: boolean;
    contentHashValid: boolean;
    signaturesValid: boolean;
    chainOfCustodyValid: boolean;
    contradictionsFound: number;
    verificationScore: number;
  }> {
    const packet = await this.getPacket(packetId);
    if (!packet) {
      return {
        valid: false,
        issues: ["Packet not found"],
        merkleTreeValid: false,
        contentHashValid: false,
        signaturesValid: false,
        chainOfCustodyValid: false,
        contradictionsFound: 0,
        verificationScore: 0,
      };
    }

    const issues: string[] = [];

    // Verify Merkle tree
    const leaves = [
      ...packet.events.map((e) => this.hashEvent(e)),
      ...packet.documents.map((d) => d.hash),
      ...packet.signatures.map((s) => s.hash),
    ];
    const rebuiltTree = merkleTreeBuilder.buildTree(leaves);
    const merkleTreeValid = rebuiltTree.rootHash === packet.merkleRoot;
    if (!merkleTreeValid) {
      issues.push(
        "Merkle tree root hash mismatch - evidence may have been tampered with",
      );
    }

    // Verify content hash
    const recalculatedHash = this.hashContent({
      events: packet.events,
      documents: packet.documents,
      signatures: packet.signatures,
    });
    const contentHashValid = recalculatedHash === packet.contentHash;
    if (!contentHashValid) {
      issues.push(
        "Content hash mismatch - packet content may have been modified",
      );
    }

    // Verify signatures
    let signaturesValid = true;
    for (const sig of packet.signatures) {
      if (sig.verificationStatus !== "valid") {
        signaturesValid = false;
        issues.push(
          `Signature ${sig.id} verification status: ${sig.verificationStatus}`,
        );
      }
    }

    // Verify chain of custody
    let chainOfCustodyValid = true;
    for (const doc of packet.documents) {
      for (const custody of doc.custody) {
        if (!custody.acknowledged) {
          chainOfCustodyValid = false;
          issues.push(`Chain of custody gap for document ${doc.id}`);
        }
      }
    }

    // Calculate verification score
    const scoreComponents = {
      merkleTree: merkleTreeValid ? 0.3 : 0,
      contentHash: contentHashValid ? 0.3 : 0,
      signatures: signaturesValid ? 0.2 : 0,
      chainOfCustody: chainOfCustodyValid ? 0.2 : 0,
    };
    const verificationScore = Object.values(scoreComponents).reduce(
      (sum, val) => sum + val,
      0,
    );

    return {
      valid: issues.length === 0,
      issues,
      merkleTreeValid,
      contentHashValid,
      signaturesValid,
      chainOfCustodyValid,
      contradictionsFound: packet.contradictions.length,
      verificationScore,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Gather events from Event Store
   */
  private async gatherEvents(
    entityType: string,
    entityId: string,
    tenantId: string,
    dateRange?: { from: Date; to: Date },
  ): Promise<AuditEvent[]> {
    try {
      const events = await eventStore.getEvents(entityId);

      // Filter by date range if provided
      let filteredEvents = events;
      if (dateRange) {
        filteredEvents = events.filter((e) => {
          const eventDate = new Date(e.timestamp);
          return eventDate >= dateRange.from && eventDate <= dateRange.to;
        });
      }

      // Convert to AuditEvent format
      return filteredEvents.map((e) => ({
        id: e.id,
        eventType: e.type,
        timestamp: new Date(e.timestamp),
        payload: e.payload || {},
        actor: e.metadata?.actor as Actor | undefined,
        correlationId: e.metadata?.correlationId as string | undefined,
        causationId: e.metadata?.causationId as string | undefined,
      }));
    } catch (error) {
      console.warn("Error gathering events:", error);
      return [];
    }
  }

  /**
   * Gather documents from Evidence Service
   */
  private async gatherDocuments(
    entityType: string,
    entityId: string,
    tenantId: string,
  ): Promise<EvidenceDocument[]> {
    try {
      const searchResult = await evidenceService.search({
        relatedEntityId: entityId,
        relatedEntityType: entityType,
        tenantId,
      });

      return searchResult.evidence.map((ev) =>
        this.convertEvidenceToDocument(ev),
      );
    } catch (error) {
      console.warn("Error gathering documents:", error);
      return [];
    }
  }

  /**
   * Convert Evidence to EvidenceDocument
   */
  private convertEvidenceToDocument(evidence: Evidence): EvidenceDocument {
    return {
      id: evidence.id,
      type: this.mapEvidenceTypeToDocumentType(evidence.type),
      title: evidence.title,
      description: evidence.description || "",
      content: evidence.content || Buffer.from(""),
      mimeType: evidence.mimeType || "application/octet-stream",
      size: evidence.fileSize || 0,
      hash: evidence.hash,
      hashAlgorithm: "sha256",
      source: evidence.metadata?.source || "unknown",
      sourceId: evidence.id,
      capturedAt: new Date(evidence.createdAt),
      capturedBy: {
        id: evidence.createdBy || "system",
        name: evidence.createdBy || "System",
        tenantId: evidence.tenantId || "default",
        type: "system",
      },
      custody: evidence.lineage.custodyChain.map((c) => ({
        id: c.id,
        fromActor: c.fromUserId
          ? {
              id: c.fromUserId,
              name: c.fromUserName || c.fromUserId,
              tenantId: evidence.tenantId || "default",
              type: "user",
            }
          : undefined,
        toActor: {
          id: c.toUserId,
          name: c.toUserName || c.toUserId,
          tenantId: evidence.tenantId || "default",
          type: "user",
        },
        transferredAt: new Date(c.transferredAt),
        reason: c.reason,
        acknowledged: c.acknowledged,
        acknowledgedAt: c.acknowledgedAt
          ? new Date(c.acknowledgedAt)
          : undefined,
      })),
    };
  }

  /**
   * Map EvidenceType to EvidenceDocument type
   */
  private mapEvidenceTypeToDocumentType(
    type: string,
  ): EvidenceDocument["type"] {
    const mapping: Record<string, EvidenceDocument["type"]> = {
      email: "email",
      document: "report",
      signature: "signature",
      image: "photo",
      video: "photo",
      audio: "photo",
      certificate: "report",
      report: "report",
    };
    return mapping[type] || "custom";
  }

  /**
   * Gather signatures
   */
  private async gatherSignatures(
    entityType: string,
    entityId: string,
    tenantId: string,
  ): Promise<DigitalSignature[]> {
    try {
      // Get signature documents
      const searchResult = await evidenceService.search({
        relatedEntityId: entityId,
        relatedEntityType: entityType,
        tenantId,
        types: ["signature"],
      });

      return searchResult.evidence
        .filter((ev) => ev.digitalSignature)
        .map((ev) => ({
          id: ev.id,
          signerId: ev.digitalSignature!.signerId,
          signerName: ev.digitalSignature!.signerName,
          signerRole: ev.digitalSignature!.signerRole,
          signedAt: new Date(ev.digitalSignature!.signedAt),
          signatureData: ev.digitalSignature!.signatureData,
          certificateId: ev.digitalSignature!.certificateId,
          verificationStatus: ev.digitalSignature!.verificationStatus,
          hash: ev.hash,
          location: ev.metadata?.location
            ? {
                lat: ev.metadata.location.latitude || 0,
                lng: ev.metadata.location.longitude || 0,
                address: ev.metadata.location.address,
              }
            : undefined,
        }));
    } catch (error) {
      console.warn("Error gathering signatures:", error);
      return [];
    }
  }

  /**
   * Hash event
   */
  private hashEvent(event: AuditEvent): string {
    const eventString = JSON.stringify({
      id: event.id,
      type: event.eventType,
      timestamp: event.timestamp.toISOString(),
      payload: event.payload,
    });
    return crypto.createHash("sha256").update(eventString).digest("hex");
  }

  /**
   * Hash content
   */
  private hashContent(data: {
    events: AuditEvent[];
    documents: EvidenceDocument[];
    signatures: DigitalSignature[];
  }): string {
    const contentString = JSON.stringify({
      events: data.events.map((e) => ({
        id: e.id,
        type: e.eventType,
        timestamp: e.timestamp.toISOString(),
      })),
      documents: data.documents.map((d) => ({
        id: d.id,
        hash: d.hash,
        type: d.type,
      })),
      signatures: data.signatures.map((s) => ({
        id: s.id,
        hash: s.hash,
        signerId: s.signerId,
      })),
    });
    return crypto.createHash("sha256").update(contentString).digest("hex");
  }

  /**
   * Generate evidence ID
   */
  private async generateEvidenceId(tenantId: string): Promise<string> {
    // Format: EVD-YYYY-NNNNNN
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 999999)
      .toString()
      .padStart(6, "0");
    return `EVD-${year}-${sequence}`;
  }

  /**
   * Generate claim
   */
  private generateClaim(
    claimType: ClaimType,
    entityType: string,
    entityId: string,
  ): string {
    const claims: Record<ClaimType, string> = {
      delivery_proof: `Proof of delivery for ${entityType} ${entityId}`,
      payment_dispute: `Payment dispute evidence for ${entityType} ${entityId}`,
      compliance_violation: `Compliance violation evidence for ${entityType} ${entityId}`,
      contract_breach: `Contract breach evidence for ${entityType} ${entityId}`,
      service_completion: `Service completion proof for ${entityType} ${entityId}`,
      custom: `Evidence packet for ${entityType} ${entityId}`,
    };
    return claims[claimType] || claims.custom;
  }

  /**
   * Calculate expiration date
   */
  private calculateExpirationDate(policy: RetentionPolicy): Date {
    const now = new Date();
    switch (policy) {
      case "7y":
        return new Date(now.getFullYear() + 7, now.getMonth(), now.getDate());
      case "10y":
        return new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
      case "permanent":
        return new Date(2100, 0, 1); // Far future
      case "legal_hold":
        return new Date(2100, 0, 1); // No expiration during legal hold
      default:
        return new Date(now.getFullYear() + 7, now.getMonth(), now.getDate());
    }
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(packet: EvidencePacket): string {
    return `This evidence packet contains ${packet.events.length} events, ${packet.documents.length} documents, and ${packet.signatures.length} digital signatures related to ${packet.claim}. Contradiction index: ${(packet.contradictionIndex * 100).toFixed(1)}%.`;
  }

  /**
   * Generate timeline
   */
  private generateTimeline(packet: EvidencePacket): Array<{
    date: Date;
    time: string;
    event: string;
    evidenceIds: string[];
    actor: string;
  }> {
    return packet.events
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((e) => ({
        date: e.timestamp,
        time: e.timestamp.toLocaleTimeString(),
        event: e.eventType,
        evidenceIds: [e.id],
        actor: e.actor?.name || "System",
      }));
  }

  /**
   * Generate exhibits
   */
  private generateExhibits(packet: EvidencePacket): Array<{
    exhibitNumber: string;
    evidenceId: string;
    title: string;
    type: string;
    description: string;
    hash: string;
  }> {
    return packet.documents.map((doc, index) => ({
      exhibitNumber: `Exhibit ${String.fromCharCode(65 + index)}`, // A, B, C, ...
      evidenceId: doc.id,
      title: doc.title,
      type: doc.type,
      description: doc.description,
      hash: doc.hash,
    }));
  }

  /**
   * Generate chain of custody
   */
  private generateChainOfCustody(packet: EvidencePacket): Array<{
    date: Date;
    action: string;
    fromActor?: string;
    toActor: string;
    evidenceIds: string[];
  }> {
    const custodyEvents: Array<{
      date: Date;
      action: string;
      fromActor?: string;
      toActor: string;
      evidenceIds: string[];
    }> = [];

    for (const doc of packet.documents) {
      for (const custody of doc.custody) {
        custodyEvents.push({
          date: custody.transferredAt,
          action: "Custody Transfer",
          fromActor: custody.fromActor?.name,
          toActor: custody.toActor.name,
          evidenceIds: [doc.id],
        });
      }
    }

    return custodyEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Generate appendices
   */
  private async generateAppendices(packet: EvidencePacket): Promise<
    Array<{
      title: string;
      content: string | Buffer;
    }>
  > {
    return [
      {
        title: "Merkle Tree Proof",
        content: JSON.stringify({
          rootHash: packet.merkleRoot,
          leafCount:
            packet.events.length +
            packet.documents.length +
            packet.signatures.length,
        }),
      },
      {
        title: "Contradiction Analysis",
        content: JSON.stringify(packet.contradictions, null, 2),
      },
    ];
  }

  /**
   * Store packet (in-memory for now, would use database)
   */
  private async storePacket(packet: EvidencePacket): Promise<void> {
    // In production, would store in database
    // For now, store in Knowledge Base for persistence
    try {
      const { knowledgeBaseService } =
        await import("@/lib/services/knowledge-base");
      await knowledgeBaseService.create({
        tenantId: packet.tenantId,
        agentId: "evidence-packet-generator",
        type: "evidence_packet",
        category: "legal",
        content: JSON.stringify(packet),
        summary: `Evidence packet ${packet.evidenceId} for ${packet.claim}`,
        metadata: {
          packetId: packet.id,
          evidenceId: packet.evidenceId,
          entityType: packet.entityType,
          entityId: packet.entityId,
          contradictionIndex: packet.contradictionIndex,
        },
        keywords: ["evidence", "packet", packet.evidenceId, packet.entityType],
        searchableText: `evidence packet ${packet.evidenceId} ${packet.claim}`,
        source: "evidence_packet_generator",
        confidence: 1.0,
        verified: true,
        feedbackScore: 0,
        usageCount: 0,
        status: "active",
      });
    } catch (error) {
      console.warn("Error storing packet in knowledge base:", error);
    }
  }

  /**
   * Get packet
   */
  private async getPacket(packetId: string): Promise<EvidencePacket | null> {
    try {
      const { knowledgeBaseService } =
        await import("@/lib/services/knowledge-base");
      const results = await knowledgeBaseService.search({
        query: `evidence packet ${packetId}`,
        limit: 1,
      });

      if (
        results.length > 0 &&
        results[0].entry.metadata?.packetId === packetId
      ) {
        return JSON.parse(results[0].entry.content) as EvidencePacket;
      }
    } catch (error) {
      console.warn("Error getting packet:", error);
    }
    return null;
  }
}

// Export singleton
export const evidencePacketGenerator = new EvidencePacketGenerator();
