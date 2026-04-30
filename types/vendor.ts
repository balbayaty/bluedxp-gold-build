/**
 * Vendor Types
 * Comprehensive vendor type definitions
 */

import type { ProcurementEntity, VendorStatus, VendorClassification } from './procurement'

export interface Vendor extends ProcurementEntity {
  vendorNumber: string
  vendorName: string
  legalName?: string
  status: VendorStatus
  classification: VendorClassification
  
  // Contact Information
  primaryContact?: Contact
  contacts: Contact[]
  email?: string
  phone?: string
  website?: string
  
  // Address Information
  billingAddress?: Address
  shippingAddress?: Address
  addresses: Address[]
  
  // Tax & Legal
  taxId?: string
  vatNumber?: string
  registrationNumber?: string
  legalEntityType?: 'CORPORATION' | 'LLC' | 'PARTNERSHIP' | 'SOLE_PROPRIETORSHIP' | 'OTHER'
  country: string
  
  // Financial Information
  currency?: string
  paymentTerms?: string
  creditLimit?: number
  bankAccount?: BankAccount
  
  // Capabilities
  categories: string[]
  products?: string[]
  services?: string[]
  certifications?: Certification[]
  capabilities?: string[]
  
  // Performance Metrics
  performanceScore?: number
  onTimeDeliveryRate?: number
  qualityAcceptanceRate?: number
  averageLeadTime?: number
  
  // Relationships
  isPreferred: boolean
  isStrategicPartner: boolean
  contractIds?: string[]
  
  // Construction-Specific (Subcontractors)
  subcontractorCategory?: 'CIVIL_WORKS' | 'MEP' | 'FINISHES' | 'SPECIALIZED' | 'SITE_SERVICES'
  licenses?: License[]
  insurance?: Insurance[]
  safetyRecord?: SafetyRecord
  
  // Metadata
  tags?: string[]
  notes?: string
  blacklistReason?: string
  blacklistedAt?: Date | string
}

export interface Contact {
  id: string
  vendorId: string
  firstName: string
  lastName: string
  title?: string
  email?: string
  phone?: string
  mobile?: string
  isPrimary: boolean
  department?: string
}

export interface Address {
  id: string
  vendorId: string
  type: 'BILLING' | 'SHIPPING' | 'MAIN' | 'OTHER'
  street: string
  city: string
  state?: string
  postalCode?: string
  country: string
  isDefault: boolean
}

export interface BankAccount {
  bankName: string
  accountNumber: string
  accountName: string
  iban?: string
  swiftCode?: string
  routingNumber?: string
  currency: string
}

export interface Certification {
  id: string
  vendorId: string
  type: string
  name: string
  issuer: string
  certificateNumber: string
  issuedDate: Date | string
  expiryDate?: Date | string
  fileUrl?: string
  isActive: boolean
}

export interface License {
  id: string
  vendorId: string
  type: string
  licenseNumber: string
  issuer: string
  issuedDate: Date | string
  expiryDate?: Date | string
  fileUrl?: string
  isActive: boolean
}

export interface Insurance {
  id: string
  vendorId: string
  type: 'GENERAL_LIABILITY' | 'PROFESSIONAL_LIABILITY' | 'WORKERS_COMPENSATION' | 'AUTO' | 'OTHER'
  provider: string
  policyNumber: string
  coverageAmount: number
  currency: string
  effectiveDate: Date | string
  expiryDate: Date | string
  fileUrl?: string
  isActive: boolean
}

export interface SafetyRecord {
  vendorId: string
  totalIncidents: number
  lostTimeIncidents: number
  recordableIncidents: number
  lastIncidentDate?: Date | string
  oshaRating?: string
  safetyScore?: number
  lastAuditDate?: Date | string
  auditScore?: number
}

export interface VendorPerformance {
  id: string
  vendorId: string
  period: string // e.g., "2024-Q1"
  startDate: Date | string
  endDate: Date | string
  
  // Metrics
  totalOrders: number
  totalSpend: number
  onTimeDeliveryRate: number
  qualityAcceptanceRate: number
  averageLeadTime: number
  defectRate?: number
  rejectionRate?: number
  
  // Scores
  overallScore: number
  deliveryScore: number
  qualityScore: number
  costScore: number
  serviceScore: number
  
  // Ratings
  rating: 1 | 2 | 3 | 4 | 5
  comments?: string
  reviewedBy?: string
  reviewedAt?: Date | string
}

export interface VendorOnboarding {
  id: string
  vendorId?: string
  vendorNumber?: string
  status: 'REGISTRATION' | 'QUALIFICATION' | 'APPROVAL' | 'SETUP' | 'COMPLETED' | 'REJECTED'
  
  // Registration
  companyName: string
  legalName?: string
  email: string
  phone?: string
  country: string
  
  // Qualification
  financialAssessment?: FinancialAssessment
  capabilityAssessment?: CapabilityAssessment
  complianceCheck?: ComplianceCheck
  
  // Approval
  approvedBy?: string
  approvedAt?: Date | string
  rejectedBy?: string
  rejectedAt?: Date | string
  rejectionReason?: string
  
  // Setup
  setupCompletedAt?: Date | string
  
  createdAt: Date | string
  updatedAt: Date | string
}

export interface FinancialAssessment {
  creditRating?: string
  financialHealth?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  annualRevenue?: number
  yearsInBusiness?: number
  bankReferences?: string[]
  financialStatements?: string[]
}

export interface CapabilityAssessment {
  products?: string[]
  services?: string[]
  capacity?: string
  geographicCoverage?: string[]
  certifications?: string[]
  experience?: string
}

export interface ComplianceCheck {
  regulatoryCompliance: boolean
  qualityCompliance: boolean
  safetyCompliance: boolean
  environmentalCompliance: boolean
  certifications?: string[]
  licenses?: string[]
}

export interface VendorFilter {
  tenantId: string
  status?: VendorStatus[]
  classification?: VendorClassification[]
  category?: string[]
  country?: string
  isPreferred?: boolean
  isStrategicPartner?: boolean
  search?: string
}

export interface VendorCreateInput {
  tenantId: string
  vendorName: string
  legalName?: string
  email?: string
  phone?: string
  website?: string
  country: string
  taxId?: string
  vatNumber?: string
  categories: string[]
  currency?: string
  paymentTerms?: string
  classification?: VendorClassification
}





