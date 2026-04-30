/**
 * Utility Bill Management Types
 * 
 * Comprehensive type definitions for utility bill management system
 * Supports: Electricity, Water, Gas, Internet, Phone, Waste Management, etc.
 * Features: Tracing, Integration, Analytics, AI-Powered Insights
 * 
 * Aligned with:
 * - Facility Management Module
 * - Energy & Sustainability Service
 * - Warehouse Management Integration
 * - QHSE Compliance
 * - Financial Tracking
 */

// ============================================================================
// CORE UTILITY BILL TYPES
// ============================================================================

export type UtilityType =
  | 'electricity'
  | 'water'
  | 'gas'
  | 'internet'
  | 'phone'
  | 'waste-management'
  | 'sewage'
  | 'cooling'
  | 'heating'
  | 'renewable-energy'
  | 'other'

export type BillStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'paid'
  | 'overdue'
  | 'disputed'
  | 'cancelled'
  | 'void'

export type PaymentStatus =
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'refunded'

export type Currency = 'SAR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'IQD' | 'KWD' | 'BHD' | 'OMR' | 'QAR'

/**
 * Utility Bill - Core entity
 */
export interface UtilityBill {
  id: string
  billNumber: string // Provider's bill number
  accountNumber: string // Account number from provider
  utilityType: UtilityType
  provider: UtilityProvider
  
  // Period & Dates
  billingPeriod: {
    start: Date
    end: Date
  }
  issueDate: Date
  dueDate: Date
  paidDate?: Date
  
  // Financial
  currency: Currency
  subtotal: number
  taxes: TaxBreakdown[]
  fees: FeeBreakdown[]
  discounts: DiscountBreakdown[]
  totalAmount: number
  previousBalance?: number
  payments?: number
  currentBalance: number
  
  // Consumption & Usage
  consumption?: ConsumptionData
  previousReading?: number
  currentReading?: number
  readingDate?: Date
  readingType?: 'actual' | 'estimated' | 'adjusted'
  unitOfMeasure?: string // kWh, m³, liters, etc.
  
  // Tariff & Pricing
  tariff?: TariffDetails
  rateStructure?: RateStructure
  
  // Facility/Warehouse Linking
  facilityId?: string
  facilityName?: string
  warehouseId?: string
  warehouseCode?: string
  warehouseName?: string
  location?: {
    address: string
    city: string
    country: string
    coordinates?: { lat: number; lng: number }
  }
  
  // Status & Workflow
  status: BillStatus
  paymentStatus: PaymentStatus
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: Date
  
  // Documents & Attachments
  originalDocument?: {
    url: string
    fileName: string
    fileType: string
    fileSize: number
    uploadedAt: Date
  }
  attachments?: BillAttachment[]
  
  // Metadata & Tracing
  metadata: {
    source: 'manual' | 'pdf-import' | 'api-integration' | 'email-parsing' | 'ocr'
    importedAt?: Date
    importedBy?: string
    lastVerified?: Date
    verificationStatus?: 'verified' | 'unverified' | 'needs-review'
    dataQuality?: {
      confidence: number // 0-100
      completeness: number // 0-100
      accuracy: number // 0-100
    }
  }
  
  // Integration & Tracing
  traceability: {
    linkedEnergyConsumptionId?: string
    linkedFacilityAssetId?: string
    linkedWorkOrderId?: string
    linkedMaintenanceTaskId?: string
    relatedBills?: string[] // Related bill IDs (e.g., previous month)
    parentBillId?: string // For split bills
    childBillIds?: string[] // For consolidated bills
  }
  
  // Notes & Comments
  notes?: string
  internalNotes?: string
  disputeReason?: string
  
  // Audit Trail
  tenantId?: string
  createdBy?: string
  createdAt: Date
  updatedBy?: string
  updatedAt: Date
  version: number
}

/**
 * Utility Provider Information
 */
export interface UtilityProvider {
  id?: string
  name: string
  type: UtilityType
  providerCode?: string
  contact?: {
    phone?: string
    email?: string
    website?: string
    address?: string
  }
  accountManager?: {
    name: string
    email: string
    phone: string
  }
  billingCycle?: 'monthly' | 'bi-monthly' | 'quarterly' | 'annually'
  paymentMethods?: string[]
  integration?: {
    apiEndpoint?: string
    apiKey?: string
    webhookUrl?: string
    supportsAutoImport?: boolean
  }
}

/**
 * Consumption Data
 */
export interface ConsumptionData {
  quantity: number
  unit: string // kWh, m³, liters, GB, minutes, etc.
  peakDemand?: number // For electricity
  offPeakConsumption?: number
  onPeakConsumption?: number
  averageDailyConsumption?: number
  consumptionBreakdown?: {
    period: string // e.g., "Week 1", "Day 1-15"
    quantity: number
    cost: number
  }[]
  comparison?: {
    previousPeriod: number
    samePeriodLastYear: number
    percentageChange: number
    trend: 'increasing' | 'decreasing' | 'stable'
  }
}

/**
 * Tax Breakdown
 */
export interface TaxBreakdown {
  type: string // VAT, Sales Tax, Municipal Tax, etc.
  rate: number // percentage
  amount: number
  description?: string
}

/**
 * Fee Breakdown
 */
export interface FeeBreakdown {
  type: string // Service Fee, Connection Fee, Late Fee, etc.
  amount: number
  description?: string
  isRecurring?: boolean
}

/**
 * Discount Breakdown
 */
export interface DiscountBreakdown {
  type: string // Early Payment, Volume Discount, Loyalty, etc.
  amount: number
  percentage?: number
  description?: string
}

/**
 * Tariff Details
 */
export interface TariffDetails {
  tariffName?: string
  tariffCode?: string
  ratePerUnit: number
  tieredRates?: {
    tier: number
    minQuantity: number
    maxQuantity?: number
    rate: number
  }[]
  timeOfUseRates?: {
    period: 'peak' | 'off-peak' | 'shoulder'
    startTime: string
    endTime: string
    rate: number
  }[]
  demandCharges?: {
    peakDemand: number // kW
    rate: number
  }
  fixedCharges?: {
    type: string
    amount: number
  }[]
}

/**
 * Rate Structure
 */
export interface RateStructure {
  type: 'flat' | 'tiered' | 'time-of-use' | 'demand-based' | 'hybrid'
  baseRate: number
  currency: Currency
  unit: string
  effectiveDate: Date
  expiryDate?: Date
}

/**
 * Bill Attachment
 */
export interface BillAttachment {
  id: string
  name: string
  type: string
  url: string
  size: number
  uploadedAt: Date
  uploadedBy?: string
  description?: string
}

// ============================================================================
// ANALYTICS & INSIGHTS TYPES
// ============================================================================

/**
 * Utility Bill Analytics
 */
export interface UtilityBillAnalytics {
  period: {
    start: Date
    end: Date
  }
  summary: {
    totalBills: number
    totalAmount: number
    averageBillAmount: number
    totalConsumption: number
    averageConsumption: number
  }
  byUtilityType: {
    utilityType: UtilityType
    count: number
    totalAmount: number
    totalConsumption: number
    averageAmount: number
    averageConsumption: number
  }[]
  byFacility: {
    facilityId: string
    facilityName: string
    count: number
    totalAmount: number
    totalConsumption: number
  }[]
  byWarehouse: {
    warehouseId: string
    warehouseCode: string
    warehouseName: string
    count: number
    totalAmount: number
    totalConsumption: number
  }[]
  trends: {
    month: string
    totalAmount: number
    totalConsumption: number
    billCount: number
  }[]
  comparisons: ComparisonAnalysis[]
  anomalies: AnomalyDetection[]
  insights: Insight[]
}

/**
 * Comparison Analysis
 */
export interface ComparisonAnalysis {
  type: 'facility' | 'warehouse' | 'period' | 'utility-type' | 'provider'
  dimension: string
  comparisons: {
    label: string
    value: number
    percentageChange?: number
    trend?: 'increasing' | 'decreasing' | 'stable'
  }[]
  insights: string[]
  recommendations?: string[]
}

/**
 * Anomaly Detection
 */
export interface AnomalyDetection {
  id: string
  billId: string
  type: 'spike' | 'drop' | 'unusual-pattern' | 'data-quality' | 'payment-anomaly'
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  detectedAt: Date
  details: {
    expectedValue?: number
    actualValue: number
    deviation: number
    deviationPercentage: number
    confidence: number
  }
  suggestedActions?: string[]
  status: 'new' | 'investigating' | 'resolved' | 'false-positive'
  resolvedAt?: Date
  resolvedBy?: string
}

/**
 * Insight
 */
export interface Insight {
  id: string
  type: 'cost-optimization' | 'consumption-pattern' | 'trend' | 'opportunity' | 'risk' | 'compliance'
  category: string
  title: string
  description: string
  impact: {
    potentialSavings?: number
    consumptionReduction?: number
    riskLevel?: 'low' | 'medium' | 'high'
  }
  confidence: number // 0-100
  priority: 'critical' | 'high' | 'medium' | 'low'
  actionable: boolean
  recommendedActions?: string[]
  relatedBills?: string[]
  relatedFacilities?: string[]
  generatedAt: Date
  generatedBy?: 'system' | 'ai' | 'user'
}

// ============================================================================
// BILL COMPARISON TYPES
// ============================================================================

/**
 * Bill Comparison Request
 */
export interface BillComparisonRequest {
  billIds?: string[]
  facilityIds?: string[]
  warehouseIds?: string[]
  utilityTypes?: UtilityType[]
  period?: {
    start: Date
    end: Date
  }
  comparisonType: 'facility' | 'warehouse' | 'period' | 'utility-type' | 'provider'
  metrics: ('amount' | 'consumption' | 'efficiency' | 'cost-per-unit')[]
}

/**
 * Bill Comparison Result
 */
export interface BillComparisonResult {
  comparisonType: string
  period: {
    start: Date
    end: Date
  }
  metrics: {
    metric: string
    values: {
      label: string
      value: number
      percentageChange?: number
      trend?: 'increasing' | 'decreasing' | 'stable'
    }[]
    average?: number
    median?: number
    min?: number
    max?: number
    standardDeviation?: number
  }[]
  insights: string[]
  recommendations: string[]
  charts?: {
    type: 'bar' | 'line' | 'pie' | 'scatter'
    data: any
  }[]
}

// ============================================================================
// BILL TRACEABILITY TYPES
// ============================================================================

/**
 * Bill Traceability Chain
 */
export interface BillTraceabilityChain {
  billId: string
  billNumber: string
  traceability: {
    upstream: {
      provider?: UtilityProvider
      meterReading?: {
        readingId: string
        readingDate: Date
        readingValue: number
        readingType: string
      }
      consumptionSource?: {
        type: 'iot-sensor' | 'manual-reading' | 'estimated'
        sourceId: string
        timestamp: Date
      }
    }
    downstream: {
      linkedEnergyConsumption?: {
        consumptionId: string
        period: { start: Date; end: Date }
        consumption: number
      }
      linkedWorkOrders?: {
        workOrderId: string
        workOrderNumber: string
        type: string
        status: string
      }[]
      linkedMaintenanceTasks?: {
        taskId: string
        taskName: string
        status: string
      }[]
      costAllocations?: {
        department: string
        percentage: number
        amount: number
      }[]
    }
    relatedBills: {
      billId: string
      billNumber: string
      relationship: 'previous' | 'next' | 'same-period-last-year' | 'related-facility'
      period: { start: Date; end: Date }
    }[]
  }
  auditTrail: {
    event: string
    timestamp: Date
    userId?: string
    details?: Record<string, any>
  }[]
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

/**
 * Energy Service Integration
 */
export interface EnergyServiceIntegration {
  billId: string
  energyConsumptionId: string
  syncStatus: 'synced' | 'pending' | 'failed' | 'conflict'
  syncDate?: Date
  discrepancies?: {
    field: string
    billValue: number
    consumptionValue: number
    difference: number
  }[]
}

/**
 * Facility Integration
 */
export interface FacilityIntegration {
  billId: string
  facilityId: string
  assetIds?: string[]
  spaceIds?: string[]
  maintenanceTaskIds?: string[]
  workOrderIds?: string[]
  integrationStatus: 'linked' | 'pending' | 'unlinked'
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

export interface UtilityBillFilters {
  utilityTypes?: UtilityType[]
  facilityIds?: string[]
  warehouseIds?: string[]
  statuses?: BillStatus[]
  paymentStatuses?: PaymentStatus[]
  providerIds?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  amountRange?: {
    min: number
    max: number
  }
  search?: string
  tenantId?: string
}

export interface UtilityBillQuery {
  filters?: UtilityBillFilters
  sortBy?: 'date' | 'amount' | 'consumption' | 'facility' | 'warehouse'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

// ============================================================================
// EXPORT & REPORTING TYPES
// ============================================================================

export interface UtilityBillExport {
  format: 'csv' | 'excel' | 'pdf' | 'json'
  filters?: UtilityBillFilters
  includeAnalytics?: boolean
  includeCharts?: boolean
  columns?: string[]
}

export interface UtilityBillReport {
  reportType: 'summary' | 'detailed' | 'analytics' | 'comparison' | 'trend'
  period: {
    start: Date
    end: Date
  }
  filters?: UtilityBillFilters
  generatedAt: Date
  generatedBy?: string
  data: any
}











