/**
 * Financial Management Types
 * Reuses existing types where possible, extends only for new functionality
 */

import type { Invoice as MarketplaceInvoice, Payment as MarketplacePayment } from '@/types/marketplace'

// ============================================================================
// REUSED TYPES (No Duplication)
// ============================================================================

// Reuse invoice and payment types from marketplace
export type { MarketplaceInvoice, MarketplacePayment }

// ============================================================================
// NEW TYPES (Only for New Functionality)
// ============================================================================

export interface GeneralLedgerEntry {
  id: string
  tenantId: string
  entryNumber: string
  entryDate: Date | string
  journalEntryType: 'MANUAL' | 'AUTOMATIC' | 'REVERSAL' | 'ADJUSTMENT'
  description: string
  debitAccount: string // Account code
  creditAccount: string // Account code
  amount: number
  currency: string
  referenceType?: 'INVOICE' | 'PAYMENT' | 'SALES_ORDER' | 'PURCHASE_ORDER' | 'UTILITY_BILL' | 'OTHER'
  referenceId?: string
  status: 'DRAFT' | 'POSTED' | 'REVERSED'
  postedBy?: string
  postedAt?: Date | string
  createdAt: Date | string
  createdBy: string
}

export interface ChartOfAccounts {
  id: string
  tenantId: string
  accountCode: string
  accountName: string
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
  parentAccountCode?: string
  level: number
  isActive: boolean
  currency: string
  createdAt: Date | string
}

export interface AccountsPayable {
  id: string
  tenantId: string
  vendorId: string
  vendorName: string
  invoiceId: string // References marketplace/transportation/facility invoice
  invoiceSource: 'MARKETPLACE' | 'TRANSPORTATION' | 'FACILITY' | 'MANUAL'
  invoiceNumber: string
  invoiceDate: Date | string
  dueDate: Date | string
  amount: number
  currency: string
  paidAmount: number
  outstandingAmount: number
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paymentTerms: string
  glEntryId?: string // Link to GL entry
  createdAt: Date | string
  updatedAt: Date | string
}

export interface AccountsReceivable {
  id: string
  tenantId: string
  customerId: string
  customerName: string
  invoiceId: string // References marketplace invoice
  invoiceSource: 'MARKETPLACE' | 'SALES_ORDER' | 'MANUAL'
  invoiceNumber: string
  invoiceDate: Date | string
  dueDate: Date | string
  amount: number
  currency: string
  receivedAmount: number
  outstandingAmount: number
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WRITTEN_OFF'
  paymentTerms: string
  glEntryId?: string // Link to GL entry
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Budget {
  id: string
  tenantId: string
  name: string
  description?: string
  budgetType: 'OPERATIONAL' | 'CAPITAL' | 'PROJECT' | 'DEPARTMENT' | 'COST_CENTER'
  period: {
    startDate: Date | string
    endDate: Date | string
    frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  }
  budgetItems: BudgetItem[]
  totalBudget: number
  currency: string
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'CLOSED'
  approvedBy?: string
  approvedAt?: Date | string
  createdAt: Date | string
  createdBy: string
  updatedAt: Date | string
}

export interface BudgetItem {
  id: string
  budgetId: string
  category: string
  accountCode?: string
  description: string
  budgetedAmount: number
  actualAmount: number
  variance: number
  variancePercentage: number
}

export interface CostCenter {
  id: string
  tenantId: string
  code: string
  name: string
  description?: string
  parentCostCenterId?: string
  department?: string
  managerId?: string
  isActive: boolean
  createdAt: Date | string
}

export interface CostAllocation {
  id: string
  tenantId: string
  costCenterId: string
  sourceType: 'WMS' | 'TMS' | 'FACILITY' | 'HR' | 'OTHER'
  sourceId: string
  amount: number
  currency: string
  allocationMethod: 'DIRECT' | 'PERCENTAGE' | 'ACTIVITY_BASED'
  allocationBasis?: string
  period: {
    startDate: Date | string
    endDate: Date | string
  }
  glEntryId?: string
  createdAt: Date | string
}

export interface FinancialReport {
  id: string
  tenantId: string
  reportType: 'PROFIT_LOSS' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'TRIAL_BALANCE' | 'AGING' | 'CUSTOM'
  name: string
  period: {
    startDate: Date | string
    endDate: Date | string
  }
  data: any // Report-specific data structure
  format: 'JSON' | 'PDF' | 'EXCEL' | 'CSV'
  generatedAt: Date | string
  generatedBy: string
}

export interface FinancialPeriod {
  id: string
  tenantId: string
  periodName: string
  startDate: Date | string
  endDate: Date | string
  status: 'OPEN' | 'CLOSED' | 'LOCKED'
  closedAt?: Date | string
  closedBy?: string
}

// ============================================================================
// FIXED ASSETS ACCOUNTING TYPES
// ============================================================================

export interface FixedAsset {
  id: string
  tenantId: string
  assetNumber: string
  assetName: string
  assetCategory: 'BUILDING' | 'MACHINERY' | 'VEHICLE' | 'EQUIPMENT' | 'FURNITURE' | 'SOFTWARE' | 'INTANGIBLE' | 'OTHER'
  assetType: string
  description?: string
  acquisitionDate: Date | string
  acquisitionCost: number
  currency: string
  depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'UNITS_OF_PRODUCTION' | 'SUM_OF_YEARS' | 'NONE'
  depreciationRate?: number // Percentage
  usefulLife: number // Years
  salvageValue: number
  currentBookValue: number
  accumulatedDepreciation: number
  location?: string
  department?: string
  costCenterId?: string
  assetAccountCode: string // GL account for asset
  depreciationAccountCode: string // GL account for depreciation expense
  accumulatedDepreciationAccountCode: string // GL account for accumulated depreciation
  status: 'ACTIVE' | 'DISPOSED' | 'RETIRED' | 'UNDER_CONSTRUCTION'
  disposedDate?: Date | string
  disposedAmount?: number
  facilityAssetId?: string // Link to Facility Asset (ZERO DUPLICATION)
  createdAt: Date | string
  updatedAt: Date | string
}

export interface DepreciationSchedule {
  id: string
  tenantId: string
  assetId: string
  period: {
    startDate: Date | string
    endDate: Date | string
  }
  depreciationAmount: number
  accumulatedDepreciation: number
  bookValue: number
  glEntryId?: string
  posted: boolean
  postedAt?: Date | string
}

export interface AssetDisposal {
  id: string
  tenantId: string
  assetId: string
  disposalDate: Date | string
  disposalType: 'SALE' | 'SCRAP' | 'DONATION' | 'TRADE_IN' | 'LOSS'
  disposalAmount: number
  gainLoss: number
  glEntryId?: string
  notes?: string
  createdAt: Date | string
  createdBy: string
}

// ============================================================================
// TAX MANAGEMENT TYPES
// ============================================================================

export interface TaxConfiguration {
  id: string
  tenantId: string
  taxType: 'VAT' | 'SALES_TAX' | 'INCOME_TAX' | 'WITHHOLDING_TAX' | 'CUSTOM'
  taxCode: string
  taxName: string
  rate: number // Percentage
  effectiveDate: Date | string
  expiryDate?: Date | string
  isActive: boolean
  jurisdiction: string // e.g., 'SAUDI_ARABIA', 'UAE', 'GLOBAL'
  complianceStandard?: 'ZATCA' | 'GCC' | 'IFRS' | 'GAAP' | 'CUSTOM'
  createdAt: Date | string
  updatedAt: Date | string
}

export interface TaxTransaction {
  id: string
  tenantId: string
  transactionId: string
  transactionType: 'SALE' | 'PURCHASE' | 'EXPENSE' | 'INCOME'
  taxType: string
  taxCode: string
  taxableAmount: number
  taxAmount: number
  currency: string
  taxDate: Date | string
  glEntryId?: string
  invoiceId?: string
  status: 'DRAFT' | 'POSTED' | 'PAID' | 'REFUNDED'
  createdAt: Date | string
}

export interface TaxReturn {
  id: string
  tenantId: string
  returnType: 'VAT' | 'INCOME_TAX' | 'WITHHOLDING_TAX'
  period: {
    startDate: Date | string
    endDate: Date | string
  }
  totalSales: number
  totalPurchases: number
  outputTax: number
  inputTax: number
  netTaxPayable: number
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID'
  submittedAt?: Date | string
  submittedBy?: string
  createdAt: Date | string
}

// ============================================================================
// BANK RECONCILIATION TYPES
// ============================================================================

export interface BankAccount {
  id: string
  tenantId: string
  accountNumber: string
  accountName: string
  bankName: string
  bankCode?: string
  accountType: 'CHECKING' | 'SAVINGS' | 'CASH' | 'CREDIT_CARD' | 'LOAN'
  currency: string
  openingBalance: number
  currentBalance: number
  glAccountCode: string // Link to GL
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface BankStatement {
  id: string
  tenantId: string
  bankAccountId: string
  statementNumber: string
  statementDate: Date | string
  openingBalance: number
  closingBalance: number
  currency: string
  transactions: BankTransaction[]
  importedAt: Date | string
  importedBy: string
  format: 'CSV' | 'OFX' | 'MT940' | 'MANUAL'
  status: 'IMPORTED' | 'RECONCILED' | 'LOCKED'
}

export interface BankTransaction {
  id: string
  tenantId: string
  bankAccountId: string
  statementId: string
  transactionDate: Date | string
  valueDate: Date | string
  description: string
  amount: number
  balance: number
  reference?: string
  type: 'DEBIT' | 'CREDIT'
  matched: boolean
  matchedGlEntryId?: string
  matchedAt?: Date | string
  reconciled: boolean
  reconciledAt?: Date | string
}

export interface BankReconciliation {
  id: string
  tenantId: string
  bankAccountId: string
  statementId: string
  reconciliationDate: Date | string
  openingBalance: number
  closingBalance: number
  bankBalance: number
  glBalance: number
  outstandingDeposits: number
  outstandingWithdrawals: number
  adjustedBalance: number
  difference: number
  status: 'IN_PROGRESS' | 'RECONCILED' | 'LOCKED'
  reconciledBy?: string
  reconciledAt?: Date | string
  notes?: string
}

// ============================================================================
// FINANCIAL CONSOLIDATION TYPES
// ============================================================================

export interface Entity {
  id: string
  tenantId: string
  entityCode: string
  entityName: string
  entityType: 'PARENT' | 'SUBSIDIARY' | 'BRANCH' | 'DIVISION'
  parentEntityId?: string
  currency: string
  reportingCurrency: string
  consolidationMethod: 'FULL' | 'PROPORTIONAL' | 'EQUITY'
  ownershipPercentage: number
  isActive: boolean
  createdAt: Date | string
}

export interface ConsolidationPeriod {
  id: string
  tenantId: string
  periodName: string
  startDate: Date | string
  endDate: Date | string
  reportingCurrency: string
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED'
  completedAt?: Date | string
  completedBy?: string
}

export interface ConsolidationEntry {
  id: string
  tenantId: string
  consolidationPeriodId: string
  entityId: string
  accountCode: string
  localAmount: number
  localCurrency: string
  translatedAmount: number
  reportingCurrency: string
  exchangeRate: number
  entryType: 'ENTITY' | 'ELIMINATION' | 'ADJUSTMENT'
  createdAt: Date | string
}

export interface IntercompanyTransaction {
  id: string
  tenantId: string
  transactionNumber: string
  fromEntityId: string
  toEntityId: string
  transactionDate: Date | string
  transactionType: 'SALE' | 'PURCHASE' | 'LOAN' | 'EXPENSE_ALLOCATION' | 'OTHER'
  amount: number
  currency: string
  description: string
  glEntryId?: string
  eliminated: boolean
  eliminatedAt?: Date | string
  createdAt: Date | string
}

// ============================================================================
// PERIOD END CLOSING TYPES
// ============================================================================

export interface ClosingTask {
  id: string
  tenantId: string
  taskName: string
  taskType: 'ACCRUAL' | 'DEPRECIATION' | 'REVALUATION' | 'PROVISION' | 'REVERSAL' | 'OTHER'
  description: string
  accountCode?: string
  amount?: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
  completedAt?: Date | string
  completedBy?: string
  glEntryId?: string
  order: number
}

export interface PeriodClosing {
  id: string
  tenantId: string
  periodId: string
  closingDate: Date | string
  tasks: ClosingTask[]
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED'
  startedAt?: Date | string
  completedAt?: Date | string
  completedBy?: string
  notes?: string
}

// ============================================================================
// TREASURY MANAGEMENT TYPES
// ============================================================================

export interface CashPosition {
  id: string
  tenantId: string
  date: Date | string
  bankAccountId: string
  openingBalance: number
  receipts: number
  disbursements: number
  closingBalance: number
  currency: string
  createdAt: Date | string
}

export interface CashForecast {
  id: string
  tenantId: string
  forecastName: string
  startDate: Date | string
  endDate: Date | string
  periods: CashForecastPeriod[]
  totalReceipts: number
  totalDisbursements: number
  netCashFlow: number
  openingBalance: number
  closingBalance: number
  currency: string
  createdAt: Date | string
  createdBy: string
}

export interface CashForecastPeriod {
  period: {
    startDate: Date | string
    endDate: Date | string
  }
  receipts: number
  disbursements: number
  netCashFlow: number
  cumulativeBalance: number
}

// ============================================================================
// MULTI-CURRENCY ACCOUNTING TYPES
// ============================================================================

export interface CurrencyConfiguration {
  id: string
  tenantId: string
  baseCurrency: string
  reportingCurrency: string
  functionalCurrencies: string[]
  isActive: boolean
  createdAt: Date | string
}

export interface ExchangeRate {
  id: string
  tenantId: string
  fromCurrency: string
  toCurrency: string
  rate: number
  rateType: 'SPOT' | 'AVERAGE' | 'HISTORICAL'
  effectiveDate: Date | string
  source: 'MANUAL' | 'API' | 'BANK'
  createdAt: Date | string
}

export interface CurrencyRevaluation {
  id: string
  tenantId: string
  revaluationDate: Date | string
  accountCode: string
  currency: string
  originalAmount: number
  originalCurrency: string
  revaluedAmount: number
  exchangeRate: number
  gainLoss: number
  glEntryId?: string
  status: 'DRAFT' | 'POSTED'
  createdAt: Date | string
}

// ============================================================================
// AUDIT TRAIL TYPES
// ============================================================================

export interface AuditLog {
  id: string
  tenantId: string
  entityType: string
  entityId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'APPROVE' | 'REJECT' | 'REVERSE'
  userId: string
  userName: string
  timestamp: Date | string
  changes?: {
    field: string
    oldValue: any
    newValue: any
  }[]
  ipAddress?: string
  userAgent?: string
  notes?: string
}

// ============================================================================
// FP&A TYPES
// ============================================================================

export interface FinancialPlan {
  id: string
  tenantId: string
  planName: string
  planType: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'STRATEGIC'
  startDate: Date | string
  endDate: Date | string
  version: number
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED'
  approvedBy?: string
  approvedAt?: Date | string
  scenarios: FinancialScenario[]
  createdAt: Date | string
  createdBy: string
}

export interface FinancialScenario {
  id: string
  planId: string
  scenarioName: string
  scenarioType: 'BASE' | 'OPTIMISTIC' | 'PESSIMISTIC' | 'CUSTOM'
  assumptions: Record<string, any>
  revenue: number
  expenses: number
  netIncome: number
  cashFlow: number
  createdAt: Date | string
}

export interface FinancialForecast {
  id: string
  tenantId: string
  forecastName: string
  forecastType: 'REVENUE' | 'EXPENSE' | 'CASH_FLOW' | 'BALANCE_SHEET'
  startDate: Date | string
  endDate: Date | string
  periods: ForecastPeriod[]
  method: 'TREND' | 'REGRESSION' | 'MOVING_AVERAGE' | 'EXPONENTIAL_SMOOTHING' | 'ML'
  accuracy?: number
  createdAt: Date | string
  createdBy: string
}

export interface ForecastPeriod {
  period: {
    startDate: Date | string
    endDate: Date | string
  }
  forecastedValue: number
  actualValue?: number
  variance?: number
  variancePercentage?: number
  confidence: number
}

// ============================================================================
// FINANCIAL INTEGRATION TYPES
// ============================================================================

export interface FinancialIntegration {
  module: 'MARKETPLACE' | 'TRANSPORTATION' | 'FACILITY' | 'HR' | 'WMS' | 'TMS'
  enabled: boolean
  autoPostToGL: boolean
  glAccountMapping: Record<string, string> // Source account → GL account
  lastSyncAt?: Date | string
}

export interface UnifiedFinancialData {
  payments: {
    marketplace: MarketplacePayment[]
    transportation: any[]
    facility: any[]
    total: number
  }
  invoices: {
    marketplace: MarketplaceInvoice[]
    transportation: any[]
    facility: any[]
    total: number
  }
  glEntries: GeneralLedgerEntry[]
  accountsPayable: AccountsPayable[]
  accountsReceivable: AccountsReceivable[]
  budgets: Budget[]
  costAllocations: CostAllocation[]
}

