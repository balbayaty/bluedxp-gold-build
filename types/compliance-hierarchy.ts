/**
 * Regulatory Authority Hierarchy Types
 * Supports multi-level authority structures (authority → sub-authority → multiple authorities)
 * Deep local knowledge integration for compliance management
 */

import { RegulatoryAuthority, RegulatoryRegion, ComplianceCategory } from './compliance'

// ============================================================================
// REGULATORY AUTHORITY HIERARCHY
// ============================================================================

/**
 * Regulatory Authority Node
 * Represents a single authority in the hierarchy with parent-child relationships
 */
export interface RegulatoryAuthorityNode {
  id: string
  code: string // Authority code (e.g., 'TGA', 'SFDA')
  name: string // Full name
  shortName?: string
  description: string
  
  // Hierarchy
  parentId?: string // Parent authority ID (null for root authorities)
  parent?: RegulatoryAuthorityNode // Parent reference
  children: RegulatoryAuthorityNode[] // Child authorities
  siblingIds: string[] // Sibling authorities (same parent)
  
  // Classification
  level: number // Hierarchy level (0 = root, 1 = sub-authority, etc.)
  type: AuthorityType
  region: RegulatoryRegion
  categories: ComplianceCategory[] // Categories this authority covers
  
  // Local Knowledge
  localKnowledgeBaseId?: string // Reference to local knowledge base entry
  localRegulations: LocalRegulation[] // Local regulations and rules
  jurisdiction: Jurisdiction // Geographic and functional jurisdiction
  
  // Contact & Resources
  contactInfo: AuthorityContactInfo
  officialWebsite?: string
  apiDocumentation?: string
  
  // Metadata
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED'
  effectiveDate: Date | string
  lastUpdated: Date | string
  version: string
  
  // Relationships
  relatedAuthorities: string[] // Related authority IDs
  supersedes?: string[] // Authority IDs this supersedes
  supersededBy?: string // Authority ID that supersedes this
  
  createdAt: Date | string
  updatedAt: Date | string
}

export type AuthorityType = 
  | 'FEDERAL' // Federal/national authority
  | 'REGIONAL' // Regional authority
  | 'LOCAL' // Local/municipal authority
  | 'PROVINCIAL' // Provincial authority
  | 'SPECIALIZED' // Specialized authority (e.g., SFDA for food/drugs)
  | 'COORDINATING' // Coordinating body
  | 'SUPERVISORY' // Supervisory authority

/**
 * Local Regulation
 * Deep local knowledge about specific regulations within an authority
 */
export interface LocalRegulation {
  id: string
  authorityId: string
  regulationCode: string // e.g., 'TGA-REG-2024-001'
  title: string
  description: string
  
  // Content
  fullText?: string // Full regulation text
  summary: string
  keyPoints: string[] // Key points extracted from regulation
  
  // Classification
  category: ComplianceCategory
  subCategory?: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  
  // Applicability
  applicableRegions: string[] // Specific regions/cities
  applicableIndustries: string[] // Industry sectors
  applicableEntityTypes: ('TENANT' | 'CUSTOMER' | 'WAREHOUSE' | 'VEHICLE' | 'PRODUCT' | 'USER')[]
  
  // Requirements
  requirements: LocalRequirement[]
  exemptions?: Exemption[]
  
  // Lifecycle
  effectiveDate: Date | string
  expiryDate?: Date | string
  lastAmended?: Date | string
  amendmentHistory: RegulationAmendment[]
  
  // Knowledge Base Integration
  knowledgeBaseEntryId?: string
  vectorEmbedding?: number[] // For semantic search
  relatedRegulations: string[] // Related regulation IDs
  
  // Local Context
  localInterpretations: LocalInterpretation[]
  caseStudies?: CaseStudy[]
  commonViolations: CommonViolation[]
  bestPractices: string[]
  
  // Enforcement
  enforcementAgency?: string
  penalties?: Penalty[]
  appealProcess?: AppealProcess
  
  // Metadata
  tags: string[]
  keywords: string[]
  status: 'ACTIVE' | 'DRAFT' | 'SUSPENDED' | 'REVOKED'
  
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string
  verifiedBy?: string
  verifiedAt?: Date | string
}

/**
 * Local Requirement
 * Specific requirement within a local regulation
 */
export interface LocalRequirement {
  id: string
  regulationId: string
  section: string
  subsection?: string
  requirementNumber: string
  title: string
  description: string
  
  // Details
  mandatory: boolean
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  evidenceRequired: boolean
  validationMethod: 'AUTOMATED' | 'MANUAL' | 'HYBRID' | 'API_CHECK'
  
  // Compliance
  complianceCriteria: ComplianceCriterion[]
  documentsRequired: DocumentRequirement[]
  apiChecks?: APICheck[]
  
  // Local Context
  localNotes?: string // Local interpretation notes
  commonIssues?: string[] // Common compliance issues
  tips?: string[] // Tips for compliance
  
  createdAt: Date | string
  updatedAt: Date | string
}

/**
 * Compliance Criterion
 * Specific criterion for compliance validation
 */
export interface ComplianceCriterion {
  id: string
  field: string
  validationType: 'REQUIRED' | 'FORMAT' | 'RANGE' | 'ENUM' | 'CUSTOM' | 'API_CHECK' | 'DOCUMENT_CHECK'
  value?: any
  errorMessage: string
  warningMessage?: string
  localContext?: string // Local interpretation
}

/**
 * Document Requirement
 * Document required for compliance
 */
export interface DocumentRequirement {
  id: string
  documentType: string
  name: string
  description: string
  mandatory: boolean
  format?: string[]
  maxSize?: number
  templateUrl?: string
  exampleUrl?: string
  validityPeriod?: number
  renewalRequired: boolean
  localNotes?: string // Local requirements
}

/**
 * API Check
 * API endpoint for automated compliance checking
 */
export interface APICheck {
  id: string
  name: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT'
  authentication: {
    type: 'API_KEY' | 'OAUTH2' | 'BASIC' | 'BEARER' | 'CERTIFICATE'
    credentials?: Record<string, any>
  }
  requestSchema?: Record<string, any>
  responseSchema?: Record<string, any>
  status: 'ACTIVE' | 'DEPRECATED' | 'TESTING'
}

/**
 * Jurisdiction
 * Geographic and functional jurisdiction of an authority
 */
export interface Jurisdiction {
  geographic: {
    country: string
    regions?: string[] // Provinces, states, etc.
    cities?: string[] // Specific cities
    zones?: string[] // Special zones (e.g., free zones)
  }
  functional: {
    industries?: string[] // Industry sectors
    entityTypes?: string[] // Entity types
    activities?: string[] // Specific activities
  }
  temporal?: {
    effectiveDate?: Date | string
    expiryDate?: Date | string
  }
}

/**
 * Authority Contact Information
 */
export interface AuthorityContactInfo {
  address?: {
    street?: string
    city?: string
    region?: string
    postalCode?: string
    country: string
  }
  phone?: string[]
  email?: string[]
  website?: string
  officeHours?: string
  contactPersons?: ContactPerson[]
}

/**
 * Contact Person
 */
export interface ContactPerson {
  name: string
  title: string
  department?: string
  phone?: string
  email?: string
  responsibilities?: string[]
}

/**
 * Exemption
 * Exemptions from regulation requirements
 */
export interface Exemption {
  id: string
  type: 'ENTITY_TYPE' | 'INDUSTRY' | 'REGION' | 'SIZE' | 'CUSTOM'
  conditions: Record<string, any>
  description: string
  documentation?: string
}

/**
 * Regulation Amendment
 * History of regulation amendments
 */
export interface RegulationAmendment {
  id: string
  amendmentDate: Date | string
  amendmentType: 'ADDED' | 'MODIFIED' | 'DELETED' | 'CLARIFIED'
  description: string
  affectedSections: string[]
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  actionRequired?: string
}

/**
 * Local Interpretation
 * Local interpretation or guidance on regulation
 */
export interface LocalInterpretation {
  id: string
  title: string
  interpretation: string
  source: string // Who provided interpretation
  sourceType: 'AUTHORITY' | 'LEGAL_ADVISOR' | 'INDUSTRY_EXPERT' | 'CASE_LAW'
  confidence: number // 0-100
  applicableTo?: string[] // Specific contexts
  examples?: string[]
  createdAt: Date | string
  verified: boolean
  verifiedBy?: string
}

/**
 * Case Study
 * Real-world case study related to regulation
 */
export interface CaseStudy {
  id: string
  title: string
  description: string
  caseType: 'COMPLIANCE_SUCCESS' | 'VIOLATION' | 'APPEAL' | 'ENFORCEMENT'
  outcome: string
  lessonsLearned: string[]
  applicableScenarios: string[]
  date?: Date | string
  anonymized: boolean
}

/**
 * Common Violation
 * Common violations and how to avoid them
 */
export interface CommonViolation {
  id: string
  violationType: string
  description: string
  frequency: 'RARE' | 'OCCASIONAL' | 'COMMON' | 'VERY_COMMON'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  commonCauses: string[]
  preventionTips: string[]
  remediationSteps: string[]
}

/**
 * Penalty
 * Penalties for non-compliance
 */
export interface Penalty {
  id: string
  violationType: string
  penaltyType: 'FINE' | 'SUSPENSION' | 'REVOCATION' | 'CRIMINAL' | 'CIVIL'
  amount?: {
    min?: number
    max?: number
    currency: string
  }
  description: string
  conditions?: string[]
}

/**
 * Appeal Process
 * Process for appealing decisions
 */
export interface AppealProcess {
  id: string
  description: string
  steps: AppealStep[]
  timeLimit?: number // Days
  requiredDocuments: string[]
  contactInfo: AuthorityContactInfo
}

/**
 * Appeal Step
 */
export interface AppealStep {
  stepNumber: number
  title: string
  description: string
  timeLimit?: number // Days
  requiredActions: string[]
}

// ============================================================================
// HIERARCHY QUERIES & OPERATIONS
// ============================================================================

/**
 * Hierarchy Query
 * Query for navigating authority hierarchy
 */
export interface HierarchyQuery {
  rootOnly?: boolean // Only root authorities
  level?: number // Specific hierarchy level
  parentId?: string // Authorities with specific parent
  type?: AuthorityType
  region?: RegulatoryRegion
  category?: ComplianceCategory
  status?: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED'
  search?: string // Text search
}

/**
 * Hierarchy Path
 * Path from root to specific authority
 */
export interface HierarchyPath {
  path: RegulatoryAuthorityNode[]
  depth: number
  totalAuthorities: number // Total authorities in subtree
}

// ============================================================================
// LOCAL KNOWLEDGE BASE INTEGRATION
// ============================================================================

/**
 * Local Knowledge Entry
 * Deep local knowledge entry for compliance
 */
export interface LocalKnowledgeEntry {
  id: string
  authorityId: string
  regulationId?: string
  
  // Content
  title: string
  content: string
  summary: string
  
  // Classification
  type: 'REGULATION' | 'INTERPRETATION' | 'GUIDANCE' | 'FAQ' | 'CASE_STUDY' | 'BEST_PRACTICE'
  category: ComplianceCategory
  
  // Knowledge Base Integration
  knowledgeBaseId?: string // Reference to main knowledge base
  vectorEmbedding?: number[] // For semantic search
  keywords: string[]
  tags: string[]
  
  // Local Context
  localContext: {
    region?: string
    industry?: string
    specificScenario?: string
  }
  
  // Source & Verification
  source: string
  sourceType: 'AUTHORITY' | 'LEGAL' | 'INDUSTRY' | 'INTERNAL'
  verified: boolean
  verifiedBy?: string
  verifiedAt?: Date | string
  confidence: number // 0-100
  
  // Relationships
  relatedEntries: string[] // Related knowledge entry IDs
  relatedRegulations: string[] // Related regulation IDs
  
  // Usage
  usageCount: number
  lastAccessed?: Date | string
  feedbackScore: number
  
  // Lifecycle
  status: 'ACTIVE' | 'ARCHIVED' | 'DEPRECATED'
  createdAt: Date | string
  updatedAt: Date | string
  expiresAt?: Date | string
}

/**
 * Local Knowledge Search Query
 */
export interface LocalKnowledgeSearchQuery {
  query: string
  authorityId?: string
  regulationId?: string
  type?: LocalKnowledgeEntry['type']
  category?: ComplianceCategory
  region?: string
  industry?: string
  verifiedOnly?: boolean
  minConfidence?: number
  limit?: number
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  RegulatoryAuthorityNode,
  LocalRegulation,
  LocalRequirement,
  Jurisdiction,
  AuthorityContactInfo,
  LocalKnowledgeEntry,
  HierarchyQuery,
  HierarchyPath,
}

