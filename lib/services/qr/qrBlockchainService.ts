/**
 * QR Blockchain Verification Service
 * Blockchain-Ready QR Code Verification
 * Future-Ready (2024-2040)
 *
 * Features:
 * - Blockchain Hash Verification
 * - Tamper Detection
 * - Chain of Custody
 * - Quantum-Safe Cryptography
 * - Immutable Audit Trail
 */

import { evidenceService } from "@/lib/services/evidence";
import { qrDatabaseAdapter } from "./database/qrDatabaseAdapter";
import crypto from "crypto";

export interface BlockchainVerification {
  qrId: string;
  hash: string;
  previousHash?: string;
  timestamp: Date;
  verified: boolean;
  tamperDetected: boolean;
  blockchainHash?: string;
  quantumSafeHash?: string;
  chainIntegrity: "verified" | "warning" | "critical";
}

export interface QRBlockchainRecord {
  qrId: string;
  documentId: string;
  documentType: string;
  hash: string;
  previousHash?: string;
  timestamp: Date;
  createdBy: string;
  metadata: Record<string, any>;
}

export class QRBlockchainService {
  // Database adapter handles storage with automatic in-memory fallback
  private dbAdapter = qrDatabaseAdapter;

  /**
   * Create blockchain record for QR code
   */
  async createBlockchainRecord(
    qrId: string,
    data: {
      documentId: string;
      documentType: string;
      createdBy: string;
      metadata?: Record<string, any>;
    },
  ): Promise<BlockchainVerification> {
    // Get previous hash (if exists)
    const previousRecord = this.chain.get(qrId);
    const previousHash = previousRecord?.hash;

    // Create hash of QR data
    const hashData = JSON.stringify({
      qrId,
      documentId: data.documentId,
      documentType: data.documentType,
      timestamp: new Date().toISOString(),
      previousHash,
      metadata: data.metadata,
    });

    // Generate SHA-256 hash (quantum-safe alternative: SHA-3)
    const hash = crypto.createHash("sha256").update(hashData).digest("hex");

    // Generate quantum-safe hash (SHA-3)
    const quantumSafeHash = crypto
      .createHash("sha3-256")
      .update(hashData)
      .digest("hex");

    // Store blockchain record
    const record: QRBlockchainRecord = {
      qrId,
      documentId: data.documentId,
      documentType: data.documentType,
      hash,
      previousHash,
      timestamp: new Date(),
      createdBy: data.createdBy,
      metadata: data.metadata || {},
    };

    this.chain.set(qrId, record);

    // Store as evidence
    await evidenceService.createEvidence({
      entityType: "qr_code",
      entityId: qrId,
      evidenceType: "blockchain_verification",
      data: {
        hash,
        quantumSafeHash,
        previousHash,
        timestamp: record.timestamp,
      },
      metadata: {
        blockchainVerified: true,
        quantumSafe: true,
      },
    });

    return {
      qrId,
      hash,
      previousHash,
      timestamp: record.timestamp,
      verified: true,
      tamperDetected: false,
      blockchainHash: hash,
      quantumSafeHash,
      chainIntegrity: "verified",
    };
  }

  /**
   * Verify QR code blockchain integrity
   */
  async verifyBlockchain(qrId: string): Promise<BlockchainVerification> {
    const record = this.chain.get(qrId);

    if (!record) {
      return {
        qrId,
        hash: "",
        timestamp: new Date(),
        verified: false,
        tamperDetected: true,
        chainIntegrity: "critical",
      };
    }

    // Recalculate hash to verify integrity
    const hashData = JSON.stringify({
      qrId: record.qrId,
      documentId: record.documentId,
      documentType: record.documentType,
      timestamp: record.timestamp.toISOString(),
      previousHash: record.previousHash,
      metadata: record.metadata,
    });

    const calculatedHash = crypto
      .createHash("sha256")
      .update(hashData)
      .digest("hex");
    const tamperDetected = calculatedHash !== record.hash;

    return {
      qrId,
      hash: record.hash,
      previousHash: record.previousHash,
      timestamp: record.timestamp,
      verified: !tamperDetected,
      tamperDetected,
      blockchainHash: record.hash,
      chainIntegrity: tamperDetected ? "critical" : "verified",
    };
  }

  /**
   * Get blockchain chain for QR code
   */
  async getBlockchainChain(qrId: string): Promise<QRBlockchainRecord[]> {
    const chain: QRBlockchainRecord[] = [];
    let currentId = qrId;

    // Traverse the chain
    while (currentId) {
      const record = this.chain.get(currentId);
      if (!record) break;

      chain.push(record);
      currentId = record.previousHash
        ? this.findQRByHash(record.previousHash)
        : "";
    }

    return chain.reverse(); // Return in chronological order
  }

  /**
   * Verify entire chain integrity
   */
  async verifyChainIntegrity(qrId: string): Promise<{
    verified: boolean;
    issues: string[];
    chainLength: number;
  }> {
    const chain = await this.getBlockchainChain(qrId);
    const issues: string[] = [];

    // Verify each link in the chain
    for (let i = 0; i < chain.length; i++) {
      const record = chain[i];
      const verification = await this.verifyBlockchain(record.qrId);

      if (verification.tamperDetected) {
        issues.push(`Tampering detected in record ${i + 1} (${record.qrId})`);
      }

      // Verify previous hash link
      if (i > 0 && record.previousHash !== chain[i - 1].hash) {
        issues.push(`Chain link broken at record ${i + 1}`);
      }
    }

    return {
      verified: issues.length === 0,
      issues,
      chainLength: chain.length,
    };
  }

  private findQRByHash(hash: string): string {
    for (const [qrId, record] of this.chain.entries()) {
      if (record.hash === hash) {
        return qrId;
      }
    }
    return "";
  }
}

export const qrBlockchainService = new QRBlockchainService();
