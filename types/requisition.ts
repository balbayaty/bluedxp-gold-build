/**
 * Requisition Types
 * Comprehensive requisition type definitions
 */

import type { ProcurementEntity, RequisitionType, RequisitionStatus, ApprovalStatus, BudgetCheckResult, CostAllocation } from './procurement'

export interface RequisitionItem {
  id: string
  requisitionId: string
  lineNumber: number
  itemCode?: string
  itemName: string
  description?: string
  category?: string
  quantity: number
  unit: string
  unitPrice?: number
  totalPrice: number
  currency: string
  vendorId?: string
  vendorName?: string
  deliveryDate?: Date | string
  projectId?: string
  phaseId?: string
  workPackageId?: string
  costCode?: string
  specifications?: string
  notes?: string
}

export interface Requisition extends ProcurementEntity {
  requisitionNumber: string
  type: RequisitionType
  status: RequisitionStatus
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  
  // Requisition Details
  title: string
  description?: string
  requestedBy: string
  requestedByName?: string
  department?: string
  projectId?: string
  projectName?: string
  phaseId?: string
  workPackageId?: string
  
  // Items
  items: RequisitionItem[]
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
  
  // Sourcing
  sourcingMethod?: 'DIRECT_PURCHASE' | 'RFQ' | 'RFP' | 'RFI' | 'AUCTION' | 'CONTRACT'
  preferredVendorId?: string
  contractId?: string
  
  // Dates
  requestedDate: Date | string
  requiredDate?: Date | string
  approvedDate?: Date | string
  
  // Conversion
  convertedToPOId?: string
  convertedToPONumber?: string
  convertedAt?: Date | string
  
  // Cost Allocation
  costAllocations?: CostAllocation[]
  
  // Metadata
  tags?: string[]
  attachments?: Attachment[]
  notes?: string
  rejectionReason?: string
}

export interface ApprovalHistory {
  id: string
  requisitionId: string
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

export interface RequisitionTemplate {
  id: string
  tenantId: string
  name: string
  description?: string
  type: RequisitionType
  category?: string
  items: RequisitionTemplateItem[]
  approvalWorkflowId?: string
  budgetId?: string
  projectId?: string
  isActive: boolean
  createdAt: Date | string
  createdBy: string
}

export interface RequisitionTemplateItem {
  id: string
  templateId: string
  lineNumber: number
  itemCode?: string
  itemName: string
  description?: string
  category?: string
  unit: string
  unitPrice?: number
  quantity?: number
  specifications?: string
}

export interface RequisitionFilter {
  tenantId: string
  status?: RequisitionStatus[]
  type?: RequisitionType[]
  requestedBy?: string
  department?: string
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

export interface RequisitionCreateInput {
  tenantId: string
  type: RequisitionType
  title: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  requestedBy: string
  department?: string
  projectId?: string
  phaseId?: string
  workPackageId?: string
  items: Omit<RequisitionItem, 'id' | 'requisitionId' | 'lineNumber'>[]
  budgetId?: string
  sourcingMethod?: 'DIRECT_PURCHASE' | 'RFQ' | 'RFP' | 'RFI' | 'AUCTION' | 'CONTRACT'
  preferredVendorId?: string
  contractId?: string
  requiredDate?: Date | string
  tags?: string[]
  notes?: string
}

export interface RequisitionUpdateInput {
  title?: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  items?: Omit<RequisitionItem, 'id' | 'requisitionId'>[]
  requiredDate?: Date | string
  tags?: string[]
  notes?: string
}





