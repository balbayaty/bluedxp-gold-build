/**
 * Procurement & Purchasing Types
 * Comprehensive type definitions for procurement module
 * Multi-industry support with deep construction specialization
 */

export type RequisitionType = 
  | 'MATERIAL' 
  | 'SERVICE' 
  | 'CAPITAL' 
  | 'PROJECT' 
  | 'MRO' 
  | 'EQUIPMENT'

export type RequisitionStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CONVERTED_TO_PO'

export type PurchaseOrderType = 
  | 'STANDARD'
  | 'BLANKET'
  | 'CONTRACT'
  | 'SERVICE'
  | 'PROJECT'

export type PurchaseOrderStatus = 
  | 'CREATED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'CONFIRMED'
  | 'GOODS_RECEIPT'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'INVOICED'
  | 'COMPLETED'
  | 'CANCELLED'

export type VendorStatus = 
  | 'PENDING'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'BLACKLISTED'

export type VendorClassification = 
  | 'PREFERRED'
  | 'APPROVED'
  | 'RESTRICTED'
  | 'BLACKLISTED'
  | 'STRATEGIC_PARTNER'

export type ContractStatus = 
  | 'DRAFT'
  | 'NEGOTIATION'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'TERMINATED'
  | 'RENEWED'

export type ContractType = 
  | 'MASTER_AGREEMENT'
  | 'PURCHASE_CONTRACT'
  | 'PROJECT_CONTRACT'
  | 'BLANKET_CONTRACT'
  | 'SERVICE_CONTRACT'

export type GoodsReceiptStatus = 
  | 'PENDING'
  | 'PARTIAL'
  | 'COMPLETE'
  | 'REJECTED'
  | 'QUALITY_HOLD'

export type InvoiceStatus = 
  | 'RECEIVED'
  | 'PENDING_MATCHING'
  | 'MATCHED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PAID'
  | 'DISPUTED'
  | 'CANCELLED'

export type MatchingType = 
  | '2_WAY' // PO vs Invoice
  | '3_WAY' // PO vs GRN vs Invoice
  | '4_WAY' // PO vs GRN vs Invoice vs Contract

export type SourcingMethod = 
  | 'DIRECT_PURCHASE'
  | 'RFQ'
  | 'RFP'
  | 'RFI'
  | 'AUCTION'
  | 'CONTRACT'

export type ApprovalStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DELEGATED'

export interface ProcurementEntity {
  id: string
  tenantId: string
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  updatedBy?: string
}

export interface BudgetCheckResult {
  available: number
  committed: number
  spent: number
  totalBudget: number
  isWithinBudget: boolean
  variance?: number
  variancePercentage?: number
  alerts?: string[]
}

export interface Commitment {
  id: string
  tenantId: string
  entityType: 'REQUISITION' | 'PURCHASE_ORDER'
  entityId: string
  budgetId: string
  amount: number
  currency: string
  committedAt: Date | string
  releasedAt?: Date | string
  status: 'ACTIVE' | 'RELEASED' | 'CANCELLED'
}

export interface CostAllocation {
  id: string
  tenantId: string
  procurementEntityId: string
  procurementEntityType: 'REQUISITION' | 'PURCHASE_ORDER' | 'INVOICE'
  costCenterId: string
  projectId?: string
  phaseId?: string
  workPackageId?: string
  costCode?: string
  amount: number
  currency: string
  allocationType: 'DIRECT' | 'PERCENTAGE' | 'ACTIVITY_BASED'
  allocatedAt: Date | string
}

export interface ProcurementMetrics {
  totalRequisitions: number
  pendingApprovals: number
  totalPurchaseOrders: number
  openPurchaseOrders: number
  totalSpend: number
  committedSpend: number
  budgetVariance: number
  vendorCount: number
  averageCycleTime: number
  costSavings: number
}





