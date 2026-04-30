/**
 * Evidence Template Types
 * 
 * Pre-configured templates for common evidence assembly cases
 * Enables one-click evidence packet generation
 */

export type EvidenceTemplateType =
  | 'DISPUTE'                  // Contract or commercial dispute
  | 'AUDIT'                    // Regulatory audit
  | 'LITIGATION'               // Legal litigation
  | 'REGULATORY_INQUIRY'       // Regulatory investigation
  | 'INSURANCE_CLAIM'          // Insurance claim
  | 'INTERNAL_INVESTIGATION'   // Internal investigation
  | 'COMPLIANCE_REVIEW'        // Compliance review
  | 'INCIDENT_INVESTIGATION'   // Incident investigation
  | 'PERFORMANCE_REVIEW'       // Performance review
  | 'CUSTOMS_INSPECTION'       // Customs inspection

export type OutputFormat =
  | 'PDF'                      // PDF document
  | 'EXCEL'                    // Excel spreadsheet
  | 'LEGAL_BRIEF'              // Legal brief format
  | 'STRUCTURED_JSON'          // Structured JSON
  | 'ZIP_ARCHIVE'              // ZIP archive with all files

export interface EvidenceTemplate {
  id: string
  caseType: EvidenceTemplateType
  name: string
  description: string
  
  // What to Include
  includeTypes: string[]           // Evidence types to include
  includeEvents: string[]          // Event types to include
  includeDocuments: string[]       // Document types to include
  includeAudits: boolean           // Include audit logs
  includeCompliance: boolean       // Include compliance records
  includeContracts: boolean        // Include contracts
  includeObligations: boolean      // Include obligations
  includeLiability: boolean        // Include liability assessments
  includeCommunications: boolean   // Include communications
  
  // Time Range
  lookbackPeriod?: number          // Days to look back (null = all time)
  startDate?: Date | string        // Explicit start date
  endDate?: Date | string          // Explicit end date
  
  // Filtering
  filters?: {
    jurisdiction?: string[]
    authority?: string[]
    parties?: string[]
    tags?: string[]
  }
  
  // Formatting
  outputFormat: OutputFormat
  includeCoverPage: boolean
  includeTableOfContents: boolean
  includeTimeline: boolean         // Chronological timeline
  includeIntegrityProofs: boolean  // Merkle proofs
  includeSummary: boolean          // Executive summary
  includeRecommendations: boolean  // Recommendations
  
  // Legal Requirements
  jurisdictionRequirements?: {
    jurisdiction: string
    requirements: string[]
    attestationRequired: boolean
    notarizationRequired: boolean
    witnessRequired: boolean
    translationRequired: boolean
    legalReviewRequired: boolean
  }
  
  // Metadata
  isDefault: boolean               // Is this a default template?
  isPublic: boolean                // Can other tenants use this?
  createdBy: string
  createdAt: Date | string
  updatedAt: Date | string
  tenantId: string
}

export interface EvidenceTemplateRequest {
  templateId: string
  caseId: string
  caseName: string
  customFilters?: Record<string, any>
  overrideSettings?: Partial<EvidenceTemplate>
}

export interface EvidenceTemplateResult {
  templateId: string
  caseId: string
  packetId: string
  evidenceCount: number
  documentCount: number
  eventCount: number
  auditCount: number
  generatedAt: Date | string
  downloadUrl?: string
  errors?: string[]
  warnings?: string[]
}

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

export const DEFAULT_TEMPLATES: Partial<EvidenceTemplate>[] = [
  {
    caseType: 'DISPUTE',
    name: 'Contract Dispute Evidence Pack',
    description: 'Complete evidence pack for contract disputes - includes contracts, obligations, communications, and compliance records',
    includeTypes: ['contract', 'communication', 'signature', 'document'],
    includeEvents: ['contract.created', 'contract.signed', 'obligation.met', 'obligation.failed'],
    includeDocuments: ['contract', 'amendment', 'notice', 'invoice'],
    includeAudits: true,
    includeCompliance: true,
    includeContracts: true,
    includeObligations: true,
    includeLiability: true,
    includeCommunications: true,
    outputFormat: 'PDF',
    includeCoverPage: true,
    includeTableOfContents: true,
    includeTimeline: true,
    includeIntegrityProofs: true,
    includeSummary: true,
    includeRecommendations: false,
    isDefault: true,
    isPublic: true,
  },
  {
    caseType: 'AUDIT',
    name: 'Regulatory Audit Package',
    description: 'Complete audit package for regulatory inspections - focuses on compliance records and audit trails',
    includeTypes: ['compliance', 'audit', 'certificate', 'license'],
    includeEvents: ['compliance.check', 'compliance.violation', 'compliance.remediation'],
    includeDocuments: ['certificate', 'license', 'permit', 'inspection_report'],
    includeAudits: true,
    includeCompliance: true,
    includeContracts: false,
    includeObligations: true,
    includeLiability: false,
    includeCommunications: false,
    lookbackPeriod: 365, // 1 year
    outputFormat: 'PDF',
    includeCoverPage: true,
    includeTableOfContents: true,
    includeTimeline: true,
    includeIntegrityProofs: true,
    includeSummary: true,
    includeRecommendations: true,
    isDefault: true,
    isPublic: true,
  },
  {
    caseType: 'INSURANCE_CLAIM',
    name: 'Insurance Claim Evidence',
    description: 'Evidence pack for insurance claims - includes incident reports, liability assessments, and supporting documentation',
    includeTypes: ['incident', 'damage', 'photo', 'video', 'liability_assessment'],
    includeEvents: ['incident.reported', 'damage.assessed', 'liability.determined'],
    includeDocuments: ['incident_report', 'damage_report', 'photo', 'video', 'witness_statement'],
    includeAudits: true,
    includeCompliance: false,
    includeContracts: false,
    includeObligations: false,
    includeLiability: true,
    includeCommunications: true,
    outputFormat: 'PDF',
    includeCoverPage: true,
    includeTableOfContents: true,
    includeTimeline: true,
    includeIntegrityProofs: true,
    includeSummary: true,
    includeRecommendations: false,
    isDefault: true,
    isPublic: true,
  },
  {
    caseType: 'LITIGATION',
    name: 'Litigation Evidence Package',
    description: 'Complete evidence package for litigation - includes all available evidence with integrity proofs',
    includeTypes: ['*'], // All types
    includeEvents: ['*'], // All events
    includeDocuments: ['*'], // All documents
    includeAudits: true,
    includeCompliance: true,
    includeContracts: true,
    includeObligations: true,
    includeLiability: true,
    includeCommunications: true,
    outputFormat: 'LEGAL_BRIEF',
    includeCoverPage: true,
    includeTableOfContents: true,
    includeTimeline: true,
    includeIntegrityProofs: true,
    includeSummary: true,
    includeRecommendations: false,
    isDefault: true,
    isPublic: true,
  },
  {
    caseType: 'INTERNAL_INVESTIGATION',
    name: 'Internal Investigation Pack',
    description: 'Evidence pack for internal investigations - focuses on audit trails and user actions',
    includeTypes: ['audit', 'user_action', 'access_log', 'communication'],
    includeEvents: ['user.login', 'user.action', 'security.event', 'audit.log'],
    includeDocuments: ['audit_log', 'access_log', 'security_report'],
    includeAudits: true,
    includeCompliance: true,
    includeContracts: false,
    includeObligations: false,
    includeLiability: false,
    includeCommunications: true,
    outputFormat: 'PDF',
    includeCoverPage: true,
    includeTableOfContents: true,
    includeTimeline: true,
    includeIntegrityProofs: true,
    includeSummary: true,
    includeRecommendations: true,
    isDefault: true,
    isPublic: false,
  },
]
