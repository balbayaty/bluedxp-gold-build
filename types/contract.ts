/**
 * Contract Types
 * Comprehensive contract type definitions
 */

import type { ProcurementEntity, ContractStatus, ContractType } from './procurement'

export interface Contract extends ProcurementEntity {
  contractNumber: string
  type: ContractType
  status: ContractStatus
  
  // Parties
  vendorId: string
  vendorName: string
  buyerId: string
  buyerName: string
  
  // Contract Details
  title: string
  description?: string
  startDate: Date | string
  endDate: Date | string
  renewalDate?: Date | string
  autoRenewal: boolean
  
  // Pricing
  pricingType: 'FIXED' | 'VARIABLE' | 'TIERED' | 'VOLUME_BASED' | 'COST_PLUS'
  pricingDetails?: PricingDetails
  currency: string
  
  // Terms & Conditions
  paymentTerms: string
  deliveryTerms?: string
  warrantyTerms?: string
  penaltyTerms?: PenaltyTerm[]
  liabilityTerms?: string
  
  // SLA
  serviceLevelAgreements?: ServiceLevelAgreement[]
  
  // Scope
  scopeOfWork?: string
  items?: ContractItem[]
  categories?: string[]
  
  // Limits
  totalValue?: number
  quantityLimit?: number
  amountLimit?: number
  
  // Approval
  approvedBy?: string
  approvedAt?: Date | string
  signedBy?: string[]
  signedAt?: Date | string[]
  
  // Compliance
  complianceRequirements?: ComplianceRequirement[]
  
  // Project Link (Construction)
  projectId?: string
  projectName?: string
  
  // Metadata
  tags?: string[]
  attachments?: Attachment[]
  notes?: string
  terminationReason?: string
  terminatedAt?: Date | string
}

export interface ContractItem {
  id: string
  contractId: string
  itemCode?: string
  itemName: string
  description?: string
  category?: string
  unit: string
  unitPrice: number
  quantity?: number
  totalPrice?: number
  currency: string
  specifications?: string
}

export interface PricingDetails {
  basePrice?: number
  tieredPricing?: TieredPrice[]
  volumeDiscounts?: VolumeDiscount[]
  priceEscalation?: PriceEscalation
}

export interface TieredPrice {
  minQuantity: number
  maxQuantity?: number
  unitPrice: number
}

export interface VolumeDiscount {
  minQuantity: number
  discountRate: number
  discountAmount?: number
}

export interface PriceEscalation {
  type: 'FIXED' | 'PERCENTAGE' | 'CPI' | 'MARKET_BASED'
  value?: number
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
  effectiveDate?: Date | string
}

export interface PenaltyTerm {
  id: string
  contractId: string
  condition: string
  penaltyType: 'FIXED' | 'PERCENTAGE' | 'DAILY'
  penaltyAmount: number
  currency: string
  description?: string
}

export interface ServiceLevelAgreement {
  id: string
  contractId: string
  kpi: string
  target: number
  unit?: string
  measurementPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
  penalty?: number
  bonus?: number
  currency?: string
}

export interface ComplianceRequirement {
  id: string
  contractId: string
  type: 'REGULATORY' | 'QUALITY' | 'SAFETY' | 'ENVIRONMENTAL' | 'OTHER'
  requirement: string
  standard?: string
  verificationMethod?: string
  frequency?: string
}

export interface Attachment {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string
  uploadedAt: Date | string
  uploadedBy: string
}

export interface ContractAmendment {
  id: string
  contractId: string
  amendmentNumber: string
  amendmentType: 'PRICE' | 'SCOPE' | 'TERM' | 'OTHER'
  description: string
  effectiveDate: Date | string
  originalValue?: number
  amendedValue?: number
  netChange?: number
  currency?: string
  approvedBy?: string
  approvedAt?: Date | string
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  createdAt: Date | string
  createdBy: string
}

export interface ContractFilter {
  tenantId: string
  status?: ContractStatus[]
  type?: ContractType[]
  vendorId?: string
  projectId?: string
  startDateFrom?: Date | string
  startDateTo?: Date | string
  endDateFrom?: Date | string
  endDateTo?: Date | string
  search?: string
}

export interface ContractCreateInput {
  tenantId: string
  type: ContractType
  vendorId: string
  title: string
  description?: string
  startDate: Date | string
  endDate: Date | string
  autoRenewal?: boolean
  pricingType: 'FIXED' | 'VARIABLE' | 'TIERED' | 'VOLUME_BASED' | 'COST_PLUS'
  pricingDetails?: PricingDetails
  currency: string
  paymentTerms: string
  deliveryTerms?: string
  warrantyTerms?: string
  items?: Omit<ContractItem, 'id' | 'contractId'>[]
  totalValue?: number
  quantityLimit?: number
  amountLimit?: number
  projectId?: string
  serviceLevelAgreements?: Omit<ServiceLevelAgreement, 'id' | 'contractId'>[]
  complianceRequirements?: Omit<ComplianceRequirement, 'id' | 'contractId'>[]
  tags?: string[]
  notes?: string
}





