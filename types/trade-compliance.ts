/**
 * Comprehensive Trade Compliance Module Type Definitions
 * Covers Import/Export, Trade Compliance, Licenses, and Regulatory Requirements
 * Integrated with ML Models, Landed Costs, and Process Flows
 */

// ============================================================================
// TRADE DIRECTIONS & TYPES
// ============================================================================

export type TradeDirection = 'IMPORT' | 'EXPORT' | 'RE_EXPORT' | 'TRANSIT'
export type TradeType = 'COMMERCIAL' | 'PERSONAL' | 'SAMPLE' | 'RETURN' | 'REPAIR'
export type ShipmentMode = 'AIR' | 'SEA' | 'LAND' | 'RAIL' | 'COURIER'

// ============================================================================
// COUNTRIES & REGIONS
// ============================================================================

export type CountryCode = 
  | 'SA' // Saudi Arabia
  | 'AE' // UAE
  | 'KW' // Kuwait
  | 'QA' // Qatar
  | 'BH' // Bahrain
  | 'OM' // Oman
  | 'EG' // Egypt
  | 'JO' // Jordan
  | 'LB' // Lebanon
  | 'US' // United States
  | 'GB' // United Kingdom
  | 'CN' // China
  | 'IN' // India
  | 'DE' // Germany
  | 'FR' // France
  | 'JP' // Japan
  | 'KR' // South Korea
  | 'SG' // Singapore
  | 'MY' // Malaysia
  | 'TH' // Thailand

export type RegionCode = 
  | 'GCC' // Gulf Cooperation Council
  | 'MENA' // Middle East and North Africa
  | 'EU' // European Union
  | 'APAC' // Asia Pacific
  | 'NAFTA' // North America
  | 'GLOBAL'

// ============================================================================
// PRODUCT CATEGORIES & CLASSIFICATIONS
// ============================================================================

export type ProductCategory = 
  | 'CHEMICALS'
  | 'FOOD'
  | 'MEDICINE'
  | 'ELECTRONICS'
  | 'MACHINERY'
  | 'TEXTILES'
  | 'AUTOMOTIVE'
  | 'CONSTRUCTION'
  | 'AGRICULTURE'
  | 'COSMETICS'
  | 'TOYS'
  | 'OTHER'

export type HazardClass = 
  | 'EXPLOSIVE'
  | 'FLAMMABLE'
  | 'TOXIC'
  | 'CORROSIVE'
  | 'OXIDIZING'
  | 'RADIOACTIVE'
  | 'NON_HAZARDOUS'

export interface HSClassification {
  hsCode: string // Harmonized System Code (e.g., "1234.56.78")
  description: string
  category: ProductCategory
  hazardClass?: HazardClass
  requiresLicense: boolean
  licenseType?: LicenseType[]
  restrictions?: string[]
}

// ============================================================================
// LICENSE TYPES & REQUIREMENTS
// ============================================================================

export type LicenseType = 
  | 'CIVIL_DEFENSE_CHEMICAL' // For chemicals - Civil Defense
  | 'SFDA_FOOD' // SFDA for food products
  | 'SFDA_MEDICINE' // SFDA for medicines
  | 'SABER_CERTIFICATE' // SABER conformity certificate
  | 'CUSTOMS_CLEARANCE' // Customs clearance permit
  | 'IMPORT_LICENSE' // General import license
  | 'EXPORT_LICENSE' // General export license
  | 'PHYTOSANITARY' // Plant health certificate
  | 'VETERINARY' // Veterinary certificate
  | 'CERTIFICATE_OF_ORIGIN' // Certificate of origin
  | 'COMMERCIAL_INVOICE' // Commercial invoice
  | 'PACKING_LIST' // Packing list
  | 'BILL_OF_LADING' // Bill of lading
  | 'AIRWAY_BILL' // Airway bill
  | 'INSURANCE_CERTIFICATE' // Insurance certificate
  | 'OTHER'

export interface LicenseRequirement {
  id: string
  licenseType: LicenseType
  authority: string // e.g., "Civil Defense", "SFDA", "ZATCA"
  mandatory: boolean
  applicableTo: ProductCategory[]
  applicableCountries: CountryCode[]
  validityPeriod?: number // days
  processingTime?: number // days
  cost?: number
  currency?: string
  documentsRequired: string[]
  conditions?: string[]
  autoRenewable: boolean
}

// ============================================================================
// REGULATORY AUTHORITIES
// ============================================================================

export type RegulatoryAuthority = 
  | 'CIVIL_DEFENSE' // Saudi Civil Defense
  | 'SFDA' // Saudi Food and Drug Authority
  | 'ZATCA' // Zakat, Tax and Customs Authority
  | 'SABER' // Saudi Product Safety Program
  | 'SASO' // Saudi Standards, Metrology and Quality Organization
  | 'MOC' // Ministry of Commerce
  | 'MOI' // Ministry of Interior
  | 'MOT' // Ministry of Transport
  | 'MISA' // Ministry of Investment
  | 'UAE_MOC' // UAE Ministry of Commerce
  | 'UAE_CUSTOMS' // UAE Customs
  | 'KUWAIT_CUSTOMS' // Kuwait Customs
  | 'QATAR_CUSTOMS' // Qatar Customs
  | 'GLOBAL_CUSTOMS' // Global customs authorities

// ============================================================================
// TRADE COMPLIANCE RECORD
// ============================================================================

export interface TradeComplianceRecord {
  id: string
  tenantId: string
  customerId?: string
  
  // Trade Information
  tradeDirection: TradeDirection
  tradeType: TradeType
  shipmentMode: ShipmentMode
  originCountry: CountryCode
  destinationCountry: CountryCode
  originPort?: string
  destinationPort?: string
  
  // Product Information
  products: TradeProduct[]
  totalValue: number
  currency: string
  
  // Classification
  hsClassifications: HSClassification[]
  
  // License & Document Status
  requiredLicenses: LicenseRequirement[]
  obtainedLicenses: ObtainedLicense[]
  pendingLicenses: PendingLicense[]
  documents: TradeDocument[]
  
  // Compliance Status
  complianceStatus: ComplianceStatus
  complianceScore: number // 0-100
  riskLevel: RiskLevel
  blockingIssues: ComplianceIssue[]
  warnings: ComplianceIssue[]
  
  // Process Flow
  currentStep: ProcessStep
  processFlow: ProcessFlow
  completedSteps: string[]
  nextSteps: ProcessStep[]
  
  // Landed Cost
  landedCost?: LandedCostBreakdown
  
  // ML Predictions
  mlPredictions?: MLPrediction[]
  
  // Timeline
  createdAt: string
  updatedAt: string
  submittedAt?: string
  approvedAt?: string
  clearedAt?: string
  
  // Metadata
  notes?: string
  tags: string[]
}

export interface TradeProduct {
  id: string
  name: string
  description: string
  category: ProductCategory
  hsCode: string
  quantity: number
  unit: string
  unitValue: number
  totalValue: number
  weight: number // kg
  volume: number // m³
  originCountry: CountryCode
  requiresSpecialHandling: boolean
  specialHandlingNotes?: string
}

export interface ObtainedLicense {
  id: string
  licenseType: LicenseType
  licenseNumber: string
  authority: RegulatoryAuthority
  issueDate: string
  expiryDate: string
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED'
  documentUrl?: string
  verified: boolean
  verifiedAt?: string
}

export interface PendingLicense {
  id: string
  licenseType: LicenseType
  authority: RegulatoryAuthority
  applicationDate: string
  expectedIssueDate?: string
  status: 'APPLIED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REQUIRES_ACTION'
  applicationNumber?: string
  requiredDocuments: string[]
  submittedDocuments: string[]
  missingDocuments: string[]
  notes?: string
}

export interface TradeDocument {
  id: string
  documentType: LicenseType | 'OTHER'
  name: string
  fileUrl: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  uploadedAt: string
  verified: boolean
  verifiedBy?: string
  verifiedAt?: string
  expiryDate?: string
  status: 'VALID' | 'EXPIRED' | 'PENDING_VALIDATION' | 'REJECTED'
}

export type ComplianceStatus = 
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'PENDING_LICENSES'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLEARED'
  | 'BLOCKED'
  | 'CANCELLED'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface ComplianceIssue {
  id: string
  type: 'BLOCKING' | 'WARNING' | 'INFO'
  severity: RiskLevel
  title: string
  description: string
  requirementId?: string
  licenseId?: string
  documentId?: string
  resolution?: string
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
}

// ============================================================================
// PROCESS FLOW
// ============================================================================

export interface ProcessFlow {
  id: string
  name: string
  description: string
  steps: ProcessStep[]
  applicableTo: TradeDirection[]
  applicableCountries: CountryCode[]
  applicableCategories: ProductCategory[]
}

export interface ProcessStep {
  id: string
  stepNumber: number
  name: string
  description: string
  stepType: ProcessStepType
  required: boolean
  parallel: boolean // Can run in parallel with other steps
  estimatedDuration?: number // hours
  dependencies: string[] // Step IDs that must complete first
  responsibleRole?: string
  responsibleUserId?: string
  status: ProcessStepStatus
  startedAt?: string
  completedAt?: string
  blockedBy?: string[]
  documentsRequired?: string[]
  licensesRequired?: LicenseType[]
  cost?: number
  currency?: string
}

export type ProcessStepType = 
  | 'DOCUMENT_PREPARATION'
  | 'LICENSE_APPLICATION'
  | 'LICENSE_APPROVAL'
  | 'CUSTOMS_DECLARATION'
  | 'CUSTOMS_CLEARANCE'
  | 'INSPECTION'
  | 'PAYMENT'
  | 'SHIPPING'
  | 'DELIVERY'
  | 'OTHER'

export type ProcessStepStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'SKIPPED'
  | 'FAILED'

// ============================================================================
// LANDED COST BREAKDOWN
// ============================================================================

export interface LandedCostBreakdown {
  id: string
  tradeComplianceRecordId: string
  
  // Product Costs
  productCost: CostItem
  freightCost: CostItem
  insuranceCost: CostItem
  
  // Customs & Duties
  customsDuty: CostItem
  vat: CostItem
  exciseTax?: CostItem
  otherTaxes: CostItem[]
  
  // License & Compliance Costs
  licenseFees: CostItem[]
  complianceFees: CostItem[]
  inspectionFees: CostItem[]
  
  // Handling & Logistics
  handlingFees: CostItem[]
  storageFees: CostItem[]
  documentationFees: CostItem[]
  
  // Other Costs
  bankCharges?: CostItem
  currencyConversion?: CostItem
  otherFees: CostItem[]
  
  // Totals
  subtotal: number
  totalTaxes: number
  totalFees: number
  totalCost: number
  currency: string
  
  // Exchange Rates
  exchangeRates: ExchangeRate[]
  
  // Breakdown by Product
  productBreakdown: ProductCostBreakdown[]
  
  calculatedAt: string
  calculatedBy?: string
}

export interface CostItem {
  id: string
  name: string
  description?: string
  amount: number
  currency: string
  exchangeRate?: number
  amountInBaseCurrency: number
  baseCurrency: string
  category: CostCategory
  required: boolean
  estimated: boolean
  actual?: number
  variance?: number
  notes?: string
}

export type CostCategory = 
  | 'PRODUCT'
  | 'FREIGHT'
  | 'INSURANCE'
  | 'CUSTOMS_DUTY'
  | 'VAT'
  | 'EXCISE_TAX'
  | 'LICENSE_FEE'
  | 'COMPLIANCE_FEE'
  | 'INSPECTION_FEE'
  | 'HANDLING_FEE'
  | 'STORAGE_FEE'
  | 'DOCUMENTATION_FEE'
  | 'BANK_CHARGE'
  | 'CURRENCY_CONVERSION'
  | 'OTHER'

export interface ExchangeRate {
  fromCurrency: string
  toCurrency: string
  rate: number
  date: string
  source: string
}

export interface ProductCostBreakdown {
  productId: string
  productName: string
  productCost: number
  freightAllocation: number
  dutyAllocation: number
  vatAllocation: number
  licenseFeesAllocation: number
  otherFeesAllocation: number
  totalCost: number
  costPerUnit: number
}

// ============================================================================
// ML PREDICTIONS & RECOMMENDATIONS
// ============================================================================

export interface MLPrediction {
  id: string
  modelId: string
  modelName: string
  predictionType: MLPredictionType
  input: Record<string, any>
  output: Record<string, any>
  confidence: number // 0-100
  timestamp: string
  accuracy?: number
}

export type MLPredictionType = 
  | 'REQUIREMENT_PREDICTION' // Predict required licenses/documents
  | 'COST_PREDICTION' // Predict landed costs
  | 'TIMELINE_PREDICTION' // Predict processing time
  | 'RISK_ASSESSMENT' // Assess compliance risk
  | 'BLOCKING_ISSUE_PREDICTION' // Predict potential blocking issues
  | 'LICENSE_APPROVAL_PROBABILITY' // Predict license approval probability

export interface RequirementPrediction {
  requiredLicenses: LicenseType[]
  requiredDocuments: string[]
  confidence: number
  reasoning: string
  alternativeRequirements?: LicenseType[]
}

export interface CostPrediction {
  estimatedTotalCost: number
  costBreakdown: Partial<LandedCostBreakdown>
  confidence: number
  varianceRange: { min: number; max: number }
  factors: string[]
}

export interface TimelinePrediction {
  estimatedDuration: number // hours
  stepTimelines: Array<{ stepId: string; estimatedDuration: number }>
  confidence: number
  factors: string[]
  bottlenecks?: string[]
}

export interface RiskAssessment {
  overallRisk: RiskLevel
  riskScore: number // 0-100
  riskFactors: RiskFactor[]
  mitigationStrategies: string[]
  confidence: number
}

export interface RiskFactor {
  factor: string
  riskLevel: RiskLevel
  impact: string
  probability: number // 0-1
  mitigation?: string
}

// ============================================================================
// REGULATORY FRAMEWORKS
// ============================================================================

export interface RegulatoryFramework {
  id: string
  name: string
  region: RegionCode
  countries: CountryCode[]
  authority: RegulatoryAuthority
  category: ProductCategory[]
  requirements: FrameworkRequirement[]
  lastUpdated: string
  version: string
}

export interface FrameworkRequirement {
  id: string
  requirement: string
  description: string
  mandatory: boolean
  applicableTo: ProductCategory[]
  licenseType?: LicenseType
  documentsRequired: string[]
  conditions?: string[]
  exemptions?: string[]
}

// ============================================================================
// CIVIL DEFENSE INTEGRATION
// ============================================================================

export interface CivilDefenseLicense {
  id: string
  licenseNumber: string
  applicantName: string
  chemicalName: string
  chemicalFormula?: string
  casNumber?: string
  unNumber?: string
  hazardClass: HazardClass
  quantity: number
  unit: string
  storageLocation: string
  purpose: string
  applicationDate: string
  issueDate?: string
  expiryDate?: string
  status: 'APPLIED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  rejectionReason?: string
  requiredDocuments: string[]
  submittedDocuments: string[]
  inspectionDate?: string
  inspectionResult?: string
  notes?: string
}

// ============================================================================
// SFDA INTEGRATION
// ============================================================================

export interface SFDALicense {
  id: string
  licenseType: 'FOOD' | 'MEDICINE' | 'COSMETICS' | 'MEDICAL_DEVICE'
  licenseNumber: string
  productName: string
  productCategory: ProductCategory
  manufacturer: string
  countryOfOrigin: CountryCode
  applicationDate: string
  issueDate?: string
  expiryDate?: string
  status: 'APPLIED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  rejectionReason?: string
  requiredDocuments: string[]
  submittedDocuments: string[]
  testResults?: TestResult[]
  notes?: string
}

export interface TestResult {
  testType: string
  testDate: string
  result: 'PASS' | 'FAIL' | 'PENDING'
  certificateUrl?: string
  notes?: string
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  TradeComplianceRecord,
  TradeProduct,
  ObtainedLicense,
  PendingLicense,
  TradeDocument,
  ComplianceIssue,
  ProcessFlow,
  ProcessStep,
  LandedCostBreakdown,
  CostItem,
  ExchangeRate,
  ProductCostBreakdown,
  MLPrediction,
  RequirementPrediction,
  CostPrediction,
  TimelinePrediction,
  RiskAssessment,
  RiskFactor,
  RegulatoryFramework,
  FrameworkRequirement,
  CivilDefenseLicense,
  SFDALicense,
  TestResult,
  HSClassification,
  LicenseRequirement,
}

