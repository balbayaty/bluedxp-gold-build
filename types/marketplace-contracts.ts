/**
 * Marketplace Contract Types
 * Service agreements and contracts for marketplace bookings
 */

import type { MarketplaceBooking } from './marketplace'

export interface MarketplaceContract {
  id: string
  bookingId: string
  serviceId: string
  providerId: string
  customerId: string
  
  // Contract Details
  contractNumber: string
  title: string
  description?: string
  type: 'SERVICE_AGREEMENT' | 'MASTER_AGREEMENT' | 'FRAMEWORK_AGREEMENT' | 'PROJECT_CONTRACT'
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'SIGNED' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'CANCELLED'
  
  // Dates
  startDate: string
  endDate: string
  signedAt?: string[]
  createdAt: string
  updatedAt: string
  
  // Parties
  providerName: string
  customerName: string
  providerSigner?: string
  customerSigner?: string
  
  // Terms & Conditions
  terms: ContractTerms
  serviceLevelAgreements?: ServiceLevelAgreement[]
  
  // Pricing
  totalValue: number
  currency: string
  paymentTerms: string
  paymentSchedule?: PaymentSchedule[]
  
  // Scope
  scopeOfWork: string
  deliverables?: string[]
  milestones?: Milestone[]
  
  // Signatures
  signatures: ContractSignature[]
  signatureWorkflowId?: string // Link to digital signature workflow
  
  // Compliance
  complianceRequirements?: string[]
  regulatoryRequirements?: string[]
  
  // Metadata
  attachments?: ContractAttachment[]
  notes?: string
  tags?: string[]
  terminatedAt?: string
  terminationReason?: string
}

export interface ContractTerms {
  paymentTerms: string
  deliveryTerms?: string
  warrantyTerms?: string
  liabilityTerms?: string
  cancellationTerms?: string
  forceMajeure?: string
  disputeResolution?: string
  governingLaw?: string
  jurisdiction?: string
}

export interface ServiceLevelAgreement {
  id: string
  metric: string
  target: number
  unit: string
  measurementPeriod: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  penalty?: {
    type: 'PERCENTAGE' | 'FIXED_AMOUNT'
    value: number
  }
  bonus?: {
    type: 'PERCENTAGE' | 'FIXED_AMOUNT'
    value: number
  }
  currentPerformance?: number
  status?: 'MET' | 'BELOW_TARGET' | 'EXCEEDED'
}

export interface PaymentSchedule {
  id: string
  milestone?: string
  amount: number
  percentage?: number
  dueDate: string
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  paidAt?: string
  paymentReference?: string
}

export interface Milestone {
  id: string
  name: string
  description?: string
  dueDate: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED'
  completedAt?: string
  deliverables?: string[]
}

export interface ContractSignature {
  id: string
  signerId: string
  signerName: string
  signerRole: 'PROVIDER' | 'CUSTOMER' | 'WITNESS' | 'ADMIN'
  signatureType: 'ELECTRONIC' | 'DIGITAL' | 'QUALIFIED_ELECTRONIC'
  signatureId?: string // Link to digital signature service
  status: 'PENDING' | 'SIGNED' | 'REJECTED'
  signedAt?: string
  signatureData?: string
  ipAddress?: string
  userAgent?: string
}

export interface ContractAttachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt: string
  uploadedBy: string
}

export interface ContractTemplate {
  id: string
  name: string
  description?: string
  category: MarketplaceServiceCategory
  type: MarketplaceContract['type']
  template: string // HTML or markdown template
  variables?: string[] // Template variables
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type MarketplaceServiceCategory = 
  | 'STORAGE'
  | 'TRANSPORTATION'
  | 'FREIGHT'
  | 'CONSULTING'
  | 'MANPOWER'
  | 'TRANSLATION'
  | 'CROSS_DOCKING'
  | 'WAREHOUSE_NETWORK'

export interface ContractCreationRequest {
  bookingId: string
  templateId?: string
  terms?: Partial<ContractTerms>
  serviceLevelAgreements?: Omit<ServiceLevelAgreement, 'id' | 'currentPerformance' | 'status'>[]
  paymentSchedule?: Omit<PaymentSchedule, 'id' | 'status'>[]
  milestones?: Omit<Milestone, 'id' | 'status'>[]
  customFields?: Record<string, any>
}

export interface ContractUpdateRequest {
  terms?: Partial<ContractTerms>
  serviceLevelAgreements?: ServiceLevelAgreement[]
  milestones?: Milestone[]
  notes?: string
  attachments?: Omit<ContractAttachment, 'id' | 'uploadedAt' | 'uploadedBy'>[]
}





