/**
 * CRM Types
 * Extends existing Customer type from tenant (NO DUPLICATION)
 * Only creates new types for CRM-specific functionality
 */

import type { Customer } from '@/types/tenant'

// ============================================================================
// REUSED TYPES (No Duplication)
// ============================================================================

// Reuse Customer type from tenant
export type { Customer }

// ============================================================================
// NEW TYPES (Only for New Functionality)
// ============================================================================

/**
 * CRM Account - Extends WMS Customer with CRM-specific fields
 * NO DUPLICATION - Only adds CRM fields, references Customer ID
 */
export interface CRMAccount extends Customer {
  // CRM-specific fields only
  industry?: string
  annualRevenue?: number
  employeeCount?: number
  website?: string
  parentAccountId?: string // For account hierarchy
  accountType: 'CUSTOMER' | 'PROSPECT' | 'PARTNER' | 'COMPETITOR'
  rating?: 'A' | 'B' | 'C' | 'D'
  crmFields?: {
    source?: string
    territory?: string
    accountOwnerId?: string
    lastContactDate?: Date | string
    nextFollowUpDate?: Date | string
  }
}

export interface Lead {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  title?: string
  source: 'WEBSITE' | 'REFERRAL' | 'EVENT' | 'COLD_CALL' | 'SOCIAL_MEDIA' | 'OTHER'
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST'
  score: number // AI-powered lead score (0-100)
  scoreFactors: Array<{ factor: string; impact: number }>
  assignedTo?: string
  accountId?: string // Links to CRM account when converted
  opportunityId?: string // Links to opportunity when converted
  notes?: string
  tags?: string[]
  createdAt: Date | string
  updatedAt: Date | string
  convertedAt?: Date | string
}

export interface Opportunity {
  id: string
  tenantId: string
  name: string
  description?: string
  accountId: string // References CRM Account (which extends Customer)
  leadId?: string // References Lead if converted from lead
  stage: 'DISCOVERY' | 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST'
  probability: number // 0-100
  value: number
  currency: string
  expectedCloseDate: Date | string
  actualCloseDate?: Date | string
  source: 'LEAD' | 'RFQ' | 'SALES_ORDER' | 'MARKETPLACE' | 'MANUAL'
  sourceId?: string // References RFQ ID, Sales Order ID, etc.
  ownerId: string
  competitor?: string
  notes?: string
  tags?: string[]
  createdAt: Date | string
  updatedAt: Date | string
  closedAt?: Date | string
}

export interface Contact {
  id: string
  tenantId: string
  accountId: string // References CRM Account
  firstName: string
  lastName: string
  email: string
  phone?: string
  mobile?: string
  title?: string
  department?: string
  isPrimary: boolean
  isDecisionMaker: boolean
  employeeId?: string // Links to HR employee if internal contact
  notes?: string
  tags?: string[]
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Activity {
  id: string
  tenantId: string
  type: 'EMAIL' | 'CALL' | 'MEETING' | 'TASK' | 'NOTE' | 'WHATSAPP' | 'SMS'
  subject: string
  description?: string
  relatedTo: {
    type: 'ACCOUNT' | 'OPPORTUNITY' | 'LEAD' | 'CONTACT'
    id: string
  }
  assignedTo?: string
  dueDate?: Date | string
  completedAt?: Date | string
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  outcome?: string
  notes?: string
  metadata?: {
    emailId?: string
    callDuration?: number
    meetingLink?: string
    messageId?: string
  }
  createdAt: Date | string
  createdBy: string
  updatedAt: Date | string
}

export interface SalesForecast {
  id: string
  tenantId: string
  period: {
    startDate: Date | string
    endDate: Date | string
  }
  forecastType: 'PIPELINE' | 'REVENUE' | 'QUOTA'
  opportunities: Array<{
    opportunityId: string
    stage: Opportunity['stage']
    value: number
    probability: number
    weightedValue: number
  }>
  totalPipeline: number
  weightedPipeline: number
  confidence: number // 0-100
  factors: Array<{ description: string; impact: number }>
  createdAt: Date | string
  updatedAt: Date | string
}

// ============================================================================
// CRM INTEGRATION TYPES
// ============================================================================

export interface CRMIntegration {
  module: 'WMS' | 'PROPOSALS_RFQ' | 'MARKETPLACE' | 'HR'
  enabled: boolean
  syncDirection: 'BIDIRECTIONAL' | 'CRM_TO_MODULE' | 'MODULE_TO_CRM'
  lastSyncAt?: Date | string
}

export interface UnifiedCRMData {
  accounts: CRMAccount[]
  leads: Lead[]
  opportunities: Opportunity[]
  contacts: Contact[]
  activities: Activity[]
  forecast: SalesForecast | null
}





