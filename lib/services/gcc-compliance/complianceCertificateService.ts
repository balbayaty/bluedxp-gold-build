/**
 * Compliance Certificate & Audit Trail Service
 *
 * Generates verifiable compliance certificates and maintains
 * complete audit trails for regulatory inspections.
 *
 * Features:
 * - Digital compliance certificates with QR verification
 * - Immutable audit trail with blockchain-ready hashing
 * - Evidence collection for regulatory inspections
 * - Automated compliance reporting
 *
 * @module gcc-compliance/complianceCertificateService
 */

import * as crypto from 'crypto';
import { eventBus, createEvent } from '@/lib/services/event-store';

// ============================================================================
// TYPES
// ============================================================================

export interface ComplianceCertificate {
  /** Unique certificate ID */
  certificateId: string;
  /** Certificate type */
  type: CertificateType;
  /** Subject (shipment, carrier, vehicle, etc.) */
  subject: CertificateSubject;
  /** Compliance score at time of issue */
  complianceScore: number;
  /** Validation results summary */
  validationSummary: ValidationSummary;
  /** Issue timestamp */
  issuedAt: Date;
  /** Expiry timestamp */
  expiresAt: Date;
  /** Issuing authority */
  issuingAuthority: string;
  /** Digital signature */
  digitalSignature: string;
  /** Hash for verification */
  hash: string;
  /** Verification URL */
  verificationUrl: string;
  /** QR code data */
  qrCode: string;
  /** Certificate status */
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUPERSEDED';
  /** Linked documents */
  linkedDocuments: LinkedDocument[];
  /** Audit trail reference */
  auditTrailId: string;
}

export type CertificateType =
  | 'PRE_DISPATCH_VALIDATION'
  | 'JOURNEY_COMPLIANCE'
  | 'DELIVERY_COMPLETION'
  | 'CARRIER_ELIGIBILITY'
  | 'VEHICLE_COMPLIANCE'
  | 'DRIVER_CERTIFICATION'
  | 'BACKLOAD_APPROVAL'
  | 'HAZMAT_CLEARANCE'
  | 'COLD_CHAIN_COMPLIANCE'
  | 'BORDER_CROSSING_CLEARANCE';

export interface CertificateSubject {
  type: 'SHIPMENT' | 'CARRIER' | 'VEHICLE' | 'DRIVER' | 'JOURNEY';
  id: string;
  name: string;
  additionalInfo: Record<string, any>;
}

export interface ValidationSummary {
  totalSteps: number;
  passedSteps: number;
  warningSteps: number;
  failedSteps: number;
  criticalPassed: boolean;
  validationDetails: ValidationDetail[];
  recommendations: string[];
}

export interface ValidationDetail {
  step: string;
  status: 'PASSED' | 'WARNING' | 'FAILED' | 'SKIPPED';
  message: string;
  evidence: string[];
  timestamp: Date;
}

export interface LinkedDocument {
  type: string;
  number: string;
  description: string;
  issuedBy: string;
  validUntil?: Date;
  verified: boolean;
}

export interface AuditTrailEntry {
  /** Unique entry ID */
  entryId: string;
  /** Trail ID (groups related entries) */
  trailId: string;
  /** Entry type */
  type: AuditEntryType;
  /** Subject reference */
  subjectType: 'SHIPMENT' | 'CARRIER' | 'VEHICLE' | 'DRIVER' | 'CERTIFICATE';
  subjectId: string;
  /** Action description */
  action: string;
  /** Actor (who performed the action) */
  actor: AuditActor;
  /** Before state (for changes) */
  beforeState?: any;
  /** After state (for changes) */
  afterState?: any;
  /** Additional data */
  data: Record<string, any>;
  /** Evidence attachments */
  evidence: AuditEvidence[];
  /** Entry timestamp */
  timestamp: Date;
  /** Previous entry hash (for chain integrity) */
  previousHash?: string;
  /** Entry hash */
  hash: string;
  /** Verification status */
  verified: boolean;
}

export type AuditEntryType =
  | 'VALIDATION_STARTED'
  | 'VALIDATION_COMPLETED'
  | 'CERTIFICATE_ISSUED'
  | 'CERTIFICATE_REVOKED'
  | 'DOCUMENT_SUBMITTED'
  | 'DOCUMENT_VERIFIED'
  | 'LOCATION_RECORDED'
  | 'GEOFENCE_ENTERED'
  | 'GEOFENCE_EXITED'
  | 'ANOMALY_DETECTED'
  | 'ALERT_TRIGGERED'
  | 'EXCEPTION_APPROVED'
  | 'MANUAL_OVERRIDE'
  | 'STATUS_CHANGED'
  | 'INSPECTION_COMPLETED';

export interface AuditActor {
  type: 'SYSTEM' | 'USER' | 'DRIVER' | 'AUTHORITY' | 'API';
  id: string;
  name: string;
  role?: string;
  ipAddress?: string;
}

export interface AuditEvidence {
  type: 'DOCUMENT' | 'PHOTO' | 'SIGNATURE' | 'GPS_LOCATION' | 'TIMESTAMP' | 'BIOMETRIC';
  description: string;
  data: string;
  hash: string;
  capturedAt: Date;
}

export interface ComplianceReport {
  reportId: string;
  reportType: ReportType;
  period: {
    start: Date;
    end: Date;
  };
  subject: {
    type: string;
    id: string;
    name: string;
  };
  summary: {
    totalShipments: number;
    compliantShipments: number;
    complianceRate: number;
    certificatesIssued: number;
    violationsDetected: number;
    penaltiesAvoided: number;
  };
  details: any;
  generatedAt: Date;
  generatedBy: string;
}

export type ReportType =
  | 'DAILY_COMPLIANCE'
  | 'WEEKLY_SUMMARY'
  | 'MONTHLY_AUDIT'
  | 'QUARTERLY_REVIEW'
  | 'ANNUAL_REPORT'
  | 'INCIDENT_REPORT'
  | 'INSPECTION_REPORT'
  | 'CUSTOM';

// ============================================================================
// CERTIFICATE SERVICE
// ============================================================================

class ComplianceCertificateService {
  private auditTrailStore: Map<string, AuditTrailEntry[]> = new Map();
  private certificateStore: Map<string, ComplianceCertificate> = new Map();

  /**
   * Generate a compliance certificate
   */
  async generateCertificate(
    type: CertificateType,
    subject: CertificateSubject,
    validationResult: any,
    linkedDocuments: LinkedDocument[] = []
  ): Promise<ComplianceCertificate> {
    const certificateId = this.generateCertificateId(type);
    const auditTrailId = await this.createAuditTrail(subject);

    const validationSummary = this.createValidationSummary(validationResult);
    const complianceScore = this.calculateComplianceScore(validationSummary);

    // Only issue certificate if critical requirements passed
    if (!validationSummary.criticalPassed) {
      throw new Error('Cannot issue certificate: Critical validation requirements not met');
    }

    const issuedAt = new Date();
    const expiresAt = this.calculateExpiry(type, issuedAt);

    // Create certificate data for hashing
    const certificateData = {
      certificateId,
      type,
      subject,
      complianceScore,
      validationSummary,
      issuedAt,
      expiresAt,
      linkedDocuments,
    };

    // Generate hash and signature
    const hash = this.generateHash(certificateData);
    const digitalSignature = this.signCertificate(hash);
    const verificationUrl = this.generateVerificationUrl(certificateId, hash);
    const qrCode = await this.generateQRCode({
      certificateId,
      type,
      subject: subject.id,
      hash: hash.substring(0, 16),
      verificationUrl,
    });

    const certificate: ComplianceCertificate = {
      certificateId,
      type,
      subject,
      complianceScore,
      validationSummary,
      issuedAt,
      expiresAt,
      issuingAuthority: 'BlueDXP GCC Compliance Intelligence',
      digitalSignature,
      hash,
      verificationUrl,
      qrCode,
      status: 'ACTIVE',
      linkedDocuments,
      auditTrailId,
    };

    // Store certificate
    this.certificateStore.set(certificateId, certificate);

    // Record in audit trail
    await this.recordAuditEntry({
      trailId: auditTrailId,
      type: 'CERTIFICATE_ISSUED',
      subjectType: subject.type as any,
      subjectId: subject.id,
      action: `Issued ${type} certificate`,
      actor: {
        type: 'SYSTEM',
        id: 'gcc-compliance-service',
        name: 'GCC Compliance Service',
      },
      data: {
        certificateId,
        type,
        complianceScore,
        expiresAt,
      },
      evidence: [],
    });

    // Publish event
    await eventBus.publish(
      createEvent('gcc.certificate.issued', {
        certificateId,
        type,
        subjectId: subject.id,
        complianceScore,
        expiresAt,
      })
    );

    return certificate;
  }

  /**
   * Verify a certificate
   */
  async verifyCertificate(
    certificateId: string,
    hash?: string
  ): Promise<{
    valid: boolean;
    certificate?: ComplianceCertificate;
    reason?: string;
    verifiedAt: Date;
  }> {
    const certificate = this.certificateStore.get(certificateId);

    if (!certificate) {
      return {
        valid: false,
        reason: 'Certificate not found',
        verifiedAt: new Date(),
      };
    }

    // Check status
    if (certificate.status === 'REVOKED') {
      return {
        valid: false,
        certificate,
        reason: 'Certificate has been revoked',
        verifiedAt: new Date(),
      };
    }

    if (certificate.status === 'EXPIRED' || certificate.expiresAt < new Date()) {
      return {
        valid: false,
        certificate,
        reason: 'Certificate has expired',
        verifiedAt: new Date(),
      };
    }

    // Verify hash if provided
    if (hash && certificate.hash.substring(0, 16) !== hash.substring(0, 16)) {
      return {
        valid: false,
        certificate,
        reason: 'Hash mismatch - certificate may have been tampered',
        verifiedAt: new Date(),
      };
    }

    // Verify signature
    const signatureValid = this.verifySignature(certificate.hash, certificate.digitalSignature);
    if (!signatureValid) {
      return {
        valid: false,
        certificate,
        reason: 'Digital signature verification failed',
        verifiedAt: new Date(),
      };
    }

    return {
      valid: true,
      certificate,
      verifiedAt: new Date(),
    };
  }

  /**
   * Revoke a certificate
   */
  async revokeCertificate(
    certificateId: string,
    reason: string,
    actor: AuditActor
  ): Promise<boolean> {
    const certificate = this.certificateStore.get(certificateId);
    if (!certificate) {
      return false;
    }

    certificate.status = 'REVOKED';
    this.certificateStore.set(certificateId, certificate);

    // Record in audit trail
    await this.recordAuditEntry({
      trailId: certificate.auditTrailId,
      type: 'CERTIFICATE_REVOKED',
      subjectType: certificate.subject.type as any,
      subjectId: certificate.subject.id,
      action: `Revoked certificate: ${reason}`,
      actor,
      data: {
        certificateId,
        reason,
        revokedAt: new Date(),
      },
      evidence: [],
    });

    await eventBus.publish(
      createEvent('gcc.certificate.revoked', {
        certificateId,
        reason,
        revokedBy: actor.id,
      })
    );

    return true;
  }

  // ============================================================================
  // AUDIT TRAIL METHODS
  // ============================================================================

  /**
   * Create a new audit trail
   */
  async createAuditTrail(subject: CertificateSubject): Promise<string> {
    const trailId = `TRAIL-${subject.type}-${subject.id}-${Date.now()}`;
    this.auditTrailStore.set(trailId, []);
    return trailId;
  }

  /**
   * Record an audit trail entry
   */
  async recordAuditEntry(
    entry: Omit<AuditTrailEntry, 'entryId' | 'timestamp' | 'hash' | 'verified' | 'previousHash'>
  ): Promise<AuditTrailEntry> {
    const trail = this.auditTrailStore.get(entry.trailId) || [];
    const previousEntry = trail[trail.length - 1];

    const entryId = `ENTRY-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const timestamp = new Date();

    const fullEntry: AuditTrailEntry = {
      ...entry,
      entryId,
      timestamp,
      previousHash: previousEntry?.hash,
      hash: '',
      verified: false,
    };

    // Generate hash including previous hash for chain integrity
    fullEntry.hash = this.generateHash({
      ...fullEntry,
      hash: undefined,
    });
    fullEntry.verified = true;

    trail.push(fullEntry);
    this.auditTrailStore.set(entry.trailId, trail);

    return fullEntry;
  }

  /**
   * Get audit trail for a subject
   */
  async getAuditTrail(
    trailId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      types?: AuditEntryType[];
    }
  ): Promise<AuditTrailEntry[]> {
    let trail = this.auditTrailStore.get(trailId) || [];

    if (filters) {
      if (filters.startDate) {
        trail = trail.filter((e) => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        trail = trail.filter((e) => e.timestamp <= filters.endDate!);
      }
      if (filters.types && filters.types.length > 0) {
        trail = trail.filter((e) => filters.types!.includes(e.type));
      }
    }

    return trail;
  }

  /**
   * Verify audit trail integrity
   */
  async verifyAuditTrailIntegrity(trailId: string): Promise<{
    valid: boolean;
    totalEntries: number;
    verifiedEntries: number;
    brokenAt?: number;
    reason?: string;
  }> {
    const trail = this.auditTrailStore.get(trailId) || [];
    let previousHash: string | undefined;

    for (let i = 0; i < trail.length; i++) {
      const entry = trail[i];

      // Check chain integrity
      if (entry.previousHash !== previousHash) {
        return {
          valid: false,
          totalEntries: trail.length,
          verifiedEntries: i,
          brokenAt: i,
          reason: `Chain broken at entry ${i}: previous hash mismatch`,
        };
      }

      // Verify entry hash
      const recalculatedHash = this.generateHash({
        ...entry,
        hash: undefined,
      });
      if (recalculatedHash !== entry.hash) {
        return {
          valid: false,
          totalEntries: trail.length,
          verifiedEntries: i,
          brokenAt: i,
          reason: `Entry ${i} hash mismatch: data may have been tampered`,
        };
      }

      previousHash = entry.hash;
    }

    return {
      valid: true,
      totalEntries: trail.length,
      verifiedEntries: trail.length,
    };
  }

  // ============================================================================
  // COMPLIANCE REPORTING
  // ============================================================================

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    reportType: ReportType,
    subject: { type: string; id: string; name: string },
    period: { start: Date; end: Date },
    data: any
  ): Promise<ComplianceReport> {
    const reportId = `RPT-${reportType}-${Date.now()}`;

    const report: ComplianceReport = {
      reportId,
      reportType,
      period,
      subject,
      summary: {
        totalShipments: data.totalShipments || 0,
        compliantShipments: data.compliantShipments || 0,
        complianceRate: data.totalShipments > 0
          ? Math.round((data.compliantShipments / data.totalShipments) * 100)
          : 100,
        certificatesIssued: data.certificatesIssued || 0,
        violationsDetected: data.violationsDetected || 0,
        penaltiesAvoided: data.penaltiesAvoided || 0,
      },
      details: data,
      generatedAt: new Date(),
      generatedBy: 'GCC Compliance Intelligence',
    };

    return report;
  }

  /**
   * Export audit trail for regulatory inspection
   */
  async exportAuditTrailForInspection(
    trailId: string,
    format: 'JSON' | 'PDF' | 'CSV' = 'JSON'
  ): Promise<{
    data: any;
    format: string;
    exportedAt: Date;
    integrityVerified: boolean;
    hash: string;
  }> {
    const trail = await this.getAuditTrail(trailId);
    const integrity = await this.verifyAuditTrailIntegrity(trailId);

    const exportData = {
      trailId,
      entries: trail,
      exportedAt: new Date(),
      totalEntries: trail.length,
      integrityStatus: integrity,
    };

    const hash = this.generateHash(exportData);

    return {
      data: exportData,
      format,
      exportedAt: new Date(),
      integrityVerified: integrity.valid,
      hash,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private generateCertificateId(type: CertificateType): string {
    const prefix = type.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CERT-${prefix}-${timestamp}-${random}`;
  }

  private createValidationSummary(validationResult: any): ValidationSummary {
    const steps = validationResult?.steps || [];
    const passed = steps.filter((s: any) => s.status === 'PASSED').length;
    const warnings = steps.filter((s: any) => s.status === 'WARNING').length;
    const failed = steps.filter((s: any) => s.status === 'FAILED').length;

    return {
      totalSteps: steps.length,
      passedSteps: passed,
      warningSteps: warnings,
      failedSteps: failed,
      criticalPassed: failed === 0 || !steps.some((s: any) => s.status === 'FAILED' && s.critical),
      validationDetails: steps.map((s: any) => ({
        step: s.stepName || s.step,
        status: s.status,
        message: s.message || '',
        evidence: s.evidence || [],
        timestamp: new Date(),
      })),
      recommendations: validationResult?.recommendations || [],
    };
  }

  private calculateComplianceScore(summary: ValidationSummary): number {
    if (summary.totalSteps === 0) return 100;
    const passedWeight = 1.0;
    const warningWeight = 0.7;
    const failedWeight = 0.0;

    const weightedScore =
      (summary.passedSteps * passedWeight +
        summary.warningSteps * warningWeight +
        summary.failedSteps * failedWeight) /
      summary.totalSteps;

    return Math.round(weightedScore * 100);
  }

  private calculateExpiry(type: CertificateType, issuedAt: Date): Date {
    const expiryMap: Record<CertificateType, number> = {
      PRE_DISPATCH_VALIDATION: 7, // 7 days
      JOURNEY_COMPLIANCE: 1, // 1 day (per journey)
      DELIVERY_COMPLETION: 365, // 1 year (archival)
      CARRIER_ELIGIBILITY: 90, // 3 months
      VEHICLE_COMPLIANCE: 30, // 1 month
      DRIVER_CERTIFICATION: 180, // 6 months
      BACKLOAD_APPROVAL: 3, // 3 days
      HAZMAT_CLEARANCE: 1, // 1 day (per shipment)
      COLD_CHAIN_COMPLIANCE: 1, // 1 day (per shipment)
      BORDER_CROSSING_CLEARANCE: 1, // 1 day
    };

    const days = expiryMap[type] || 30;
    return new Date(issuedAt.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private generateHash(data: any): string {
    const content = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private signCertificate(hash: string): string {
    // In production, use proper PKI signing
    // SECURITY: Require secret from environment variable
    const secret = process.env.CERTIFICATE_SIGNING_SECRET;
    if (!secret) {
      throw new Error(
        'CERTIFICATE_SIGNING_SECRET environment variable is required. Set it in your .env.local file.',
      );
    }
    return crypto.createHmac('sha256', secret).update(hash).digest('hex');
  }

  private verifySignature(hash: string, signature: string): boolean {
    const expectedSignature = this.signCertificate(hash);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  private generateVerificationUrl(certificateId: string, hash: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bluedxp.com';
    return `${baseUrl}/api/verify/certificate/${certificateId}?hash=${hash.substring(0, 16)}`;
  }

  private async generateQRCode(data: any): Promise<string> {
    // In production, use a QR library
    const content = JSON.stringify(data);
    return Buffer.from(content).toString('base64');
  }
}

// Export singleton
export const complianceCertificateService = new ComplianceCertificateService();
export default complianceCertificateService;
