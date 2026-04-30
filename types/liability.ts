/**
 * Liability Types
 * Types for liability assessment and insurance claims
 */

export type LiabilityParty = 
  | 'warehouse'
  | 'carrier'
  | 'supplier'
  | 'customer'
  | 'third_party'
  | 'shared'
  | 'undetermined'

export type LiabilityStatus = 
  | 'pending'
  | 'assessed'
  | 'disputed'
  | 'resolved'
  | 'closed'

export interface LiabilityAssessment {
  id: string
  damageRecordId: string
  assessmentDate: Date | string
  parties: {
    warehouse?: { name: string; percentage: number }
    carrier?: { name: string; percentage: number }
    supplier?: { name: string; percentage: number }
    customer?: { name: string; percentage: number }
    thirdParty?: { name: string; percentage: number }
  }
  primaryFault: LiabilityParty
  faultPercentage: Record<LiabilityParty, number>
  assessmentDetails: {
    damageAnalysis: string
    rootCause: string
    contributingFactors: string[]
    evidence: string[]
  }
  financialImpact: {
    totalValue: number
    claimableAmount: number
    deductible: number
    netClaim: number
    currency: string
  }
  insurance: {
    claimable: boolean
    claimNumber?: string
    insuranceProvider?: string
    policyNumber?: string
    claimStatus?: 'not_submitted' | 'submitted' | 'approved' | 'rejected' | 'pending'
  }
  compliance: {
    compliant: boolean
    violations: string[]
    requiredActions: string[]
    regulatoryRequirements: string[]
  }
  status: LiabilityStatus
  assessedBy?: string
  reviewedBy?: string
  notes?: string
  tenantId?: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface LiabilityRule {
  id: string
  name: string
  description: string
  conditions: LiabilityRuleCondition[]
  actions: LiabilityRuleAction[]
  priority: number
  enabled: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface LiabilityRuleCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
}

export interface LiabilityRuleAction {
  type: 'assign_fault' | 'calculate_percentage' | 'set_claimable' | 'add_violation' | 'require_action'
  parameters: Record<string, any>
}








