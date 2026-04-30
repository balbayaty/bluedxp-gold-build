/**
 * Evidence Packet Types
 *
 * Complete type definitions for court-ready evidence packets
 *
 * @module evidence
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Claim types
 */
export type ClaimType =
  | "delivery_proof"
  | "payment_dispute"
  | "compliance_violation"
  | "contract_breach"
  | "service_completion"
  | "custom";

/**
 * Verification status
 */
export type VerificationStatus =
  | "unverified"
  | "verified"
  | "disputed"
  | "court_submitted";

/**
 * Retention policy
 */
export type RetentionPolicy = "7y" | "10y" | "permanent" | "legal_hold";

/**
 * Actor (person/system who performed action)
 */
export interface Actor {
  id: string;
  name: string;
  role?: string;
  tenantId: string;
  type: "user" | "system" | "api" | "integration";
}

/**
 * Audit event (from Event Store)
 */
export interface AuditEvent {
  id: string;
  eventType: string;
  timestamp: Date;
  payload: Record<string, any>;
  actor?: Actor;
  correlationId?: string;
  causationId?: string;
}

/**
 * Evidence document
 */
export interface EvidenceDocument {
  id: string;
  type:
    | "email"
    | "invoice"
    | "contract"
    | "photo"
    | "gps_log"
    | "signature"
    | "msds"
    | "report"
    | "custom";
  title: string;
  description: string;

  // Content
  content: string | Buffer;
  mimeType: string;
  size: number;

  // Integrity
  hash: string; // SHA-256 of content
  hashAlgorithm: "sha256";

  // Provenance
  source: string; // Where this came from
  sourceId: string; // ID in source system
  capturedAt: Date; // When it was captured
  capturedBy: Actor;

  // Chain of custody
  custody: CustodyEvent[];
}

/**
 * Custody event
 */
export interface CustodyEvent {
  id: string;
  fromActor?: Actor;
  toActor: Actor;
  transferredAt: Date;
  reason?: string;
  acknowledged: boolean;
  acknowledgedAt?: Date;
}

/**
 * Digital signature
 */
export interface DigitalSignature {
  id: string;
  signerId: string;
  signerName: string;
  signerRole?: string;
  signedAt: Date;
  signatureData: string; // Base64 encoded
  certificateId?: string;
  verificationStatus: "valid" | "invalid" | "unknown";
  hash: string; // Hash of signed content
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

/**
 * Contradiction (from contradiction detector)
 */
export interface Contradiction {
  id: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";

  // The conflicting items
  item1: {
    type: "event" | "document" | "evidence";
    id: string;
    claim: string;
    timestamp?: Date;
  };
  item2: {
    type: "event" | "document" | "evidence";
    id: string;
    claim: string;
    timestamp?: Date;
  };

  // Analysis
  analysisMethod: "timeline" | "signature" | "content" | "metadata";
  explanation: string;
  confidence: number; // 0-1
  resolution?: string;
  detectedAt: Date;
}

/**
 * Evidence packet
 */
export interface EvidencePacket {
  id: string;
  tenantId: string;

  // Identity
  evidenceId: string; // Human-readable ID (e.g., "EVD-2025-001234")
  version: number;

  // What this proves
  claim: string;
  claimType: ClaimType;
  entityType: string;
  entityId: string;

  // The evidence chain
  events: AuditEvent[];
  documents: EvidenceDocument[];
  signatures: DigitalSignature[];

  // Integrity
  contentHash: string; // SHA-256 of all content
  merkleRoot: string; // Root of evidence tree
  previousPacketHash?: string; // Chain linking

  // Verification
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;

  // Legal
  retentionPolicy: RetentionPolicy;
  expiresAt?: Date;
  legalHold: boolean;
  jurisdictions: string[]; // e.g., ['SA', 'KW']

  // Metadata
  generatedAt: Date;
  generatedBy: Actor;

  // Contradiction analysis
  contradictionIndex: number; // 0-1, how self-consistent is the evidence
  contradictions: Contradiction[];

  // Court-ready formatting
  formattedForCourt: boolean;
  courtFormat?: {
    summary: string;
    timeline: Array<{ date: Date; event: string; evidence: string[] }>;
    exhibits: Array<{ id: string; title: string; type: string }>;
    chainOfCustody: Array<{ date: Date; action: string; actor: string }>;
  };
}

/**
 * Evidence packet request
 */
export interface EvidencePacketRequest {
  entityType: string;
  entityId: string;
  claimType: ClaimType;
  claim?: string; // Optional custom claim
  includeEvents?: boolean;
  includeDocuments?: boolean;
  includeSignatures?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  jurisdictions?: string[];
  retentionPolicy?: RetentionPolicy;
  legalHold?: boolean;
}

/**
 * Packet verification result
 */
export interface PacketVerificationResult {
  valid: boolean;
  issues: string[];
  merkleTreeValid: boolean;
  contentHashValid: boolean;
  signaturesValid: boolean;
  chainOfCustodyValid: boolean;
  contradictionsFound: number;
  verificationScore: number; // 0-1
}

/**
 * Court-ready packet format
 */
export interface CourtReadyPacket {
  packet: EvidencePacket;
  formattedDocument: {
    coverPage: {
      caseNumber?: string;
      title: string;
      generatedDate: Date;
      generatedBy: string;
      jurisdiction: string[];
    };
    executiveSummary: string;
    evidenceTimeline: Array<{
      date: Date;
      time: string;
      event: string;
      evidenceIds: string[];
      actor: string;
    }>;
    evidenceExhibits: Array<{
      exhibitNumber: string;
      evidenceId: string;
      title: string;
      type: string;
      description: string;
      hash: string;
    }>;
    chainOfCustody: Array<{
      date: Date;
      action: string;
      fromActor?: string;
      toActor: string;
      evidenceIds: string[];
    }>;
    integrityVerification: {
      merkleRoot: string;
      contentHash: string;
      verificationStatus: VerificationStatus;
      verifiedAt?: Date;
      verifiedBy?: string;
    };
    contradictions: Array<{
      severity: string;
      description: string;
      explanation: string;
    }>;
    appendices: Array<{
      title: string;
      content: string | Buffer;
    }>;
  };
}
