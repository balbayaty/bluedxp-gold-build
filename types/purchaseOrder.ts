/**
 * Purchase Order Types
 * Comprehensive purchase order type definitions
 */

import type { ProcurementEntity, PurchaseOrderType, PurchaseOrderStatus, ApprovalStatus, BudgetCheckResult, CostAllocation, MatchingType } from './procurement'

export interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  lineNumber: number
  requisitionItemId?: string
  itemCode?: string
  itemName: string
  description?: string
  category?: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  currency: string
  taxRate?: number
  taxAmount?: number
  discountRate?: number
  discountAmount?: number
  netAmount: number
  deliveryDate?: Date | string
  projectId?: string
  phaseId?: string
  workPackageId?: string
  costCode?: string
  specifications?: string
  notes?: string
  
  // Receipt tracking
  quantityReceived?: number
  quantityInvoiced?: number
  quantityPending?: number
}

export interface PurchaseOrder extends ProcurementEntity {
  poNumber: string
  type: PurchaseOrderType
  status: PurchaseOrderStatus
  
  // Vendor Information
  vendorId: string
  vendorName: string
  vendorNumber?: string
  vendorContact?: string
  vendorEmail?: string
  vendorPhone?: string
  
  // Requisition Link
  requisitionId?: string
  requisitionNumber?: string
  
  // Contract Link
  contractId?: string
  contractNumber?: string
  
  // Items
  items: PurchaseOrderItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  currency: string
  
  // Budget & Finance
  budgetId?: string
  budgetName?: string
  budgetCheck?: BudgetCheckResult
  commitmentId?: string
  
  // Approval
  approvalWorkflowId?: string
  currentApprover?: string
  approvalStatus: ApprovalStatus
  approvalHistory: ApprovalHistory[]
  
  // Terms & Conditions
  paymentTerms: string // e.g., "Net 30", "2/10 Net 30"
  deliveryTerms?: string // Incoterms
  deliveryAddress?: Address
  billingAddress?: Address
  
  // Dates
  poDate: Date | string
  requiredDate?: Date | string
  deliveryDate?: Date | string
  confirmedDate?: Date | string
  approvedDate?: Date | string
  
  // Receipt & Invoice Tracking
  totalQuantityOrdered: number
  totalQuantityReceived: number
  totalQuantityInvoiced: number
  receiptStatus: 'PENDING' | 'PARTIAL' | 'COMPLETE'
  invoiceStatus: 'PENDING' | 'PARTIAL' | 'COMPLETE' | 'PAID'
  
  // Matching
  matchingType?: MatchingType
  isMatched: boolean
  
  // Cost Allocation
  costAllocations?: CostAllocation[]
  
  // Project Information (Construction)
  projectId?: string
  projectName?: string
  phaseId?: string
  workPackageId?: string
  
  // Metadata
  tags?: string[]
  attachments?: Attachment[]
  notes?: string
  cancellationReason?: string
}

export interface Address {
  street: string
  city: string
  state?: string
  postalCode?: string
  country: string
  contactName?: string
  contactPhone?: string
}

export interface ApprovalHistory {
  id: string
  purchaseOrderId: string
  approverId: string
  approverName: string
  approverRole: string
  action: 'APPROVED' | 'REJECTED' | 'DELEGATED'
  comments?: string
  approvedAt: Date | string
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

export interface PurchaseOrderFilter {
  tenantId: string
  status?: PurchaseOrderStatus[]
  type?: PurchaseOrderType[]
  vendorId?: string
  requisitionId?: string
  projectId?: string
  budgetId?: string
  dateFrom?: Date | string
  dateTo?: Date | string
  minAmount?: number
  maxAmount?: number
  currency?: string
  tags?: string[]
  search?: string
}

export interface PurchaseOrderCreateInput {
  tenantId: string
  type: PurchaseOrderType
  vendorId: string
  requisitionId?: string
  contractId?: string
  items: Omit<PurchaseOrderItem, 'id' | 'purchaseOrderId' | 'lineNumber' | 'quantityReceived' | 'quantityInvoiced' | 'quantityPending'>[]
  paymentTerms: string
  deliveryTerms?: string
  deliveryAddress?: Address
  billingAddress?: Address
  requiredDate?: Date | string
  deliveryDate?: Date | string
  projectId?: string
  phaseId?: string
  workPackageId?: string
  budgetId?: string
  tags?: string[]
  notes?: string
}

export interface PurchaseOrderUpdateInput {
  items?: Omit<PurchaseOrderItem, 'id' | 'purchaseOrderId'>[]
  paymentTerms?: string
  deliveryTerms?: string
  deliveryAddress?: Address
  billingAddress?: Address
  requiredDate?: Date | string
  deliveryDate?: Date | string
  tags?: string[]
  notes?: string
}

export interface PurchaseOrderChangeOrder {
  id: string
  purchaseOrderId: string
  changeOrderNumber: string
  changeType: 'QUANTITY' | 'PRICE' | 'DELIVERY_DATE' | 'SCOPE' | 'OTHER'
  description: string
  originalValue: number
  changeValue: number
  netChange: number
  currency: string
  approvedBy?: string
  approvedAt?: Date | string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: Date | string
  createdBy: string
}





