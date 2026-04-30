/**
 * Truth Engine Blockchain Service
 * Integrates with existing QR blockchain service
 * No duplication - reuses existing blockchain infrastructure
 */

import { qrBlockchainService } from "@/lib/services/qr/qrBlockchainService";
import { truthEngineService } from "../truthEngineService";
import { evidenceService } from "@/lib/services/evidence/evidenceService";
import { TruthEvent, TruthEvidenceItem } from "@/types/truth-engine";
import crypto from "crypto";

export interface TruthBlockchainRecord {
  truthEventId: string;
  hash: string;
  previousHash?: string;
  timestamp: Date;
  verified: boolean;
  tamperDetected: boolean;
  blockchainHash?: string;
  quantumSafeHash?: string;
  chainIntegrity: "verified" | "warning" | "critical";
  evidenceHashes: string[];
}

export class TruthBlockchainService {
  private chain: Map<string, TruthBlockchainRecord> = new Map();

  /**
   * Create blockchain record for truth event
   */
  async createBlockchainRecord(
    truthEvent: TruthEvent,
  ): Promise<TruthBlockchainRecord> {
    // Get previous hash (if exists)
    const previousRecord = this.chain.get(truthEvent.id);
    const previousHash = previousRecord?.hash;

    // Create hash of truth event data
    const hashData = JSON.stringify({
      truthEventId: truthEvent.id,
      eventType: truthEvent.eventType,
      happenedAt: truthEvent.happenedAt,
      recordedAt: truthEvent.recordedAt,
      actor: truthEvent.actor,
      entityRefs: truthEvent.entityRefs,
      evidenceLinks: truthEvent.evidenceLinks,
      confidenceScore: truthEvent.confidenceScore,
      previousHash,
      metadata: truthEvent.metadata,
    });

    // Generate SHA-256 hash
    const hash = crypto.createHash("sha256").update(hashData).digest("hex");

    // Generate quantum-safe hash (SHA-3)
    const quantumSafeHash = crypto
      .createHash("sha3-256")
      .update(hashData)
      .digest("hex");

    // Hash all evidence
    const evidenceHashes = await Promise.all(
      truthEvent.evidenceLinks.map(async (evidenceId) => {
        const evidence = await evidenceService.getById(evidenceId);
        if (evidence) {
          return crypto
            .createHash("sha256")
            .update(JSON.stringify(evidence))
            .digest("hex");
        }
        return null;
      }),
    );

    // Store blockchain record
    const record: TruthBlockchainRecord = {
      truthEventId: truthEvent.id,
      hash,
      previousHash,
      timestamp: new Date(),
      verified: true,
      tamperDetected: false,
      blockchainHash: hash,
      quantumSafeHash,
      chainIntegrity: "verified",
      evidenceHashes: evidenceHashes.filter((h) => h !== null) as string[],
    };

    this.chain.set(truthEvent.id, record);

    // Also use existing QR blockchain service for additional verification
    if (truthEvent.entityRefs.qrId) {
      await qrBlockchainService.createBlockchainRecord(
        truthEvent.entityRefs.qrId,
        {
          documentId: truthEvent.id,
          documentType: "truth_event",
          createdBy: truthEvent.actor.id || "system",
          metadata: {
            eventType: truthEvent.eventType,
            confidenceScore: truthEvent.confidenceScore,
          },
        },
      );
    }

    return record;
  }

  /**
   * Verify truth event blockchain integrity
   */
  async verifyBlockchain(truthEventId: string): Promise<TruthBlockchainRecord> {
    const record = this.chain.get(truthEventId);
    if (!record) {
      throw new Error(
        `Blockchain record not found for truth event: ${truthEventId}`,
      );
    }

    // Get truth event
    const truthEvent = await truthEngineService.getTruthEvent(truthEventId);
    if (!truthEvent) {
      return {
        ...record,
        verified: false,
        tamperDetected: true,
        chainIntegrity: "critical",
      };
    }

    // Recalculate hash
    const hashData = JSON.stringify({
      truthEventId: truthEvent.id,
      eventType: truthEvent.eventType,
      happenedAt: truthEvent.happenedAt,
      recordedAt: truthEvent.recordedAt,
      actor: truthEvent.actor,
      entityRefs: truthEvent.entityRefs,
      evidenceLinks: truthEvent.evidenceLinks,
      confidenceScore: truthEvent.confidenceScore,
      previousHash: record.previousHash,
      metadata: truthEvent.metadata,
    });

    const calculatedHash = crypto
      .createHash("sha256")
      .update(hashData)
      .digest("hex");

    // Verify hash matches
    const verified = calculatedHash === record.hash;

    // Verify previous hash (if exists)
    let chainIntegrity: "verified" | "warning" | "critical" = "verified";
    if (record.previousHash) {
      const previousRecord = Array.from(this.chain.values()).find(
        (r) => r.hash === record.previousHash,
      );
      if (!previousRecord) {
        chainIntegrity = "warning";
      } else if (previousRecord.chainIntegrity !== "verified") {
        chainIntegrity = "critical";
      }
    }

    return {
      ...record,
      verified,
      tamperDetected: !verified,
      chainIntegrity,
    };
  }

  /**
   * Verify evidence chain of custody
   */
  async verifyEvidenceChain(evidenceId: string): Promise<{
    verified: boolean;
    chainIntegrity: "verified" | "warning" | "critical";
    custodyChain: Array<{
      truthEventId: string;
      timestamp: Date;
      actor: string;
      hash: string;
    }>;
  }> {
    // Find all truth events that reference this evidence
    const allEvents = await truthEngineService.searchTruthEvents({
      tenantId: "default", // Would get from context
      limit: 1000,
    });

    const relatedEvents = allEvents.events.filter((e) =>
      e.evidenceLinks.includes(evidenceId),
    );

    // Build custody chain
    const custodyChain = relatedEvents
      .sort(
        (a, b) =>
          new Date(a.happenedAt).getTime() - new Date(b.happenedAt).getTime(),
      )
      .map((event) => {
        const record = this.chain.get(event.id);
        return {
          truthEventId: event.id,
          timestamp: new Date(event.happenedAt),
          actor: event.actor.id || event.actor.name || "unknown",
          hash: record?.hash || "missing",
        };
      });

    // Verify chain integrity
    let chainIntegrity: "verified" | "warning" | "critical" = "verified";
    for (let i = 1; i < custodyChain.length; i++) {
      const prevRecord = this.chain.get(custodyChain[i - 1].truthEventId);
      const currRecord = this.chain.get(custodyChain[i].truthEventId);

      if (!prevRecord || !currRecord) {
        chainIntegrity = "warning";
        break;
      }

      if (currRecord.previousHash !== prevRecord.hash) {
        chainIntegrity = "critical";
        break;
      }
    }

    return {
      verified: chainIntegrity === "verified",
      chainIntegrity,
      custodyChain,
    };
  }

  /**
   * Get blockchain statistics
   */
  getBlockchainStats(): {
    totalRecords: number;
    verifiedRecords: number;
    tamperedRecords: number;
    chainIntegrity: {
      verified: number;
      warning: number;
      critical: number;
    };
  } {
    const records = Array.from(this.chain.values());

    return {
      totalRecords: records.length,
      verifiedRecords: records.filter((r) => r.verified).length,
      tamperedRecords: records.filter((r) => r.tamperDetected).length,
      chainIntegrity: {
        verified: records.filter((r) => r.chainIntegrity === "verified").length,
        warning: records.filter((r) => r.chainIntegrity === "warning").length,
        critical: records.filter((r) => r.chainIntegrity === "critical").length,
      },
    };
  }
}

export const truthBlockchainService = new TruthBlockchainService();
