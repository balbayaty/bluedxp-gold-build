/**
 * Proposal & Report Generation Types
 * 
 * Comprehensive system for generating professional proposals, reports, and documents
 */

import type { Quote, Shipment, Carrier, CustomsInfo, Location } from './tms'

// ============================================================================
// PROPOSAL TYPES
// ============================================================================

export type ProposalType = 
  | 'QUOTE_PROPOSAL'           // Convert quote to professional proposal
  | 'SHIPMENT_REPORT'          // Shipment status and tracking report
  | 'ANALYTICS_REPORT'         // Performance analytics report
  | 'CUSTOMS_REPORT'          // Customs clearance report
  | 'CARRIER_PROPOSAL'         // Carrier service proposal
  | 'COST_ANALYSIS'            // Cost breakdown and analysis
  | 'PERFORMANCE_REPORT'       // KPI and performance metrics
  | 'CUSTOM'                   // Custom report template

export type ProposalStatus = 
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'SENT'
  | 'VIEWED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'

export type ExportFormat = 'PDF' | 'WORD' | 'EXCEL' | 'HTML' | 'CSV'

export interface Proposal {
  id: string
  proposalNumber: string
  type: ProposalType
  
  // Title & Description
  title: string
  description?: string
  executiveSummary?: string
  
  // Related Entities
  quoteId?: string
  shipmentId?: string
  carrierId?: string
  customerId?: string
  customerName?: string
  
  // Content
  sections: ProposalSection[]
  attachments?: ProposalAttachment[]
  
  // Pricing (if applicable)
  totalAmount?: number
  currency?: string
  validUntil?: Date | string
  
  // Status & Tracking
  status: ProposalStatus
  version: number
  parentProposalId?: string // For revisions
  
  // Recipients
  recipients: ProposalRecipient[]
  sentAt?: Date | string
  viewedAt?: Date | string
  acceptedAt?: Date | string
  
  // Metadata
  templateId?: string
  templateName?: string
  createdBy: string
  createdAt: Date | string
  updatedAt: Date | string
  expiresAt?: Date | string
  
  // Branding
  branding?: ProposalBranding
  
  // Digital Signature
  signature?: DigitalSignature
}

export interface ProposalSection {
  id: string
  type: 'HEADER' | 'TEXT' | 'TABLE' | 'CHART' | 'IMAGE' | 'PRICING' | 'TERMS' | 'SIGNATURE'
  title?: string
  content?: string
  data?: any // For tables, charts, etc.
  order: number
  visible: boolean
}

export interface ProposalAttachment {
  id: string
  name: string
  type: string
  url: string
  size: number
  uploadedAt: Date | string
}

export interface ProposalRecipient {
  id: string
  name: string
  email: string
  role?: string
  company?: string
  viewed: boolean
  viewedAt?: Date | string
  accepted?: boolean
  acceptedAt?: Date | string
}

export interface ProposalBranding {
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  companyWebsite?: string
  footerText?: string
}

export interface DigitalSignature {
  signerName: string
  signerEmail: string
  signedAt: Date | string
  signatureData: string // Base64 encoded signature image
  ipAddress?: string
  userAgent?: string
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface ProposalTemplate {
  id: string
  name: string
  description: string
  type: ProposalType
  category: string
  
  // Template Structure
  sections: TemplateSection[]
  defaultBranding?: ProposalBranding
  
  // Settings
  isDefault: boolean
  isPublic: boolean
  isActive: boolean
  
  // Metadata
  createdBy: string
  createdAt: Date | string
  updatedAt: Date | string
  usageCount: number
}

export interface TemplateSection {
  id: string
  type: ProposalSection['type']
  title?: string
  defaultContent?: string
  order: number
  required: boolean
  config?: Record<string, any>
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface Report {
  id: string
  reportNumber: string
  type: ProposalType
  title: string
  description?: string
  
  // Data Source
  dataSource: 'SHIPMENTS' | 'QUOTES' | 'CARRIERS' | 'CUSTOMS' | 'ANALYTICS' | 'CUSTOM'
  filters: ReportFilter[]
  
  // Content
  sections: ReportSection[]
  charts?: ReportChart[]
  tables?: ReportTable[]
  
  // Export
  exportFormats: ExportFormat[]
  generatedAt?: Date | string
  
  // Schedule
  schedule?: ReportSchedule
  
  // Metadata
  createdBy: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface ReportFilter {
  field: string
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'IN'
  value: any
}

export interface ReportSection {
  id: string
  type: 'SUMMARY' | 'DETAIL' | 'CHART' | 'TABLE' | 'TEXT'
  title: string
  content: any
  order: number
}

export interface ReportChart {
  id: string
  type: 'LINE' | 'BAR' | 'PIE' | 'AREA' | 'SCATTER'
  title: string
  data: any[]
  config?: Record<string, any>
}

export interface ReportTable {
  id: string
  title: string
  columns: string[]
  data: any[][]
  config?: Record<string, any>
}

export interface ReportSchedule {
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  time?: string // HH:mm format
  dayOfWeek?: number // 0-6 for weekly
  dayOfMonth?: number // 1-31 for monthly
  recipients: string[] // Email addresses
  enabled: boolean
}

// ============================================================================
// GENERATION CONFIG
// ============================================================================

export interface ProposalGenerationConfig {
  proposalType: ProposalType
  sourceData: {
    quote?: Quote
    shipment?: Shipment
    carrier?: Carrier
    customs?: CustomsInfo
    analytics?: any
  }
  templateId?: string
  customSections?: ProposalSection[]
  branding?: ProposalBranding
  recipients?: ProposalRecipient[]
  exportFormats?: ExportFormat[]
  includeAttachments?: boolean
  autoSend?: boolean
}

export interface ReportGenerationConfig {
  reportType: ProposalType
  dataSource: Report['dataSource']
  filters: ReportFilter[]
  sections?: ReportSection[]
  charts?: ReportChart[]
  exportFormats?: ExportFormat[]
  schedule?: ReportSchedule
}

// ============================================================================
// EXPORT RESULT
// ============================================================================

export interface ExportResult {
  success: boolean
  format: ExportFormat
  fileUrl?: string
  fileName: string
  fileSize: number
  generatedAt: Date | string
  error?: string
}


