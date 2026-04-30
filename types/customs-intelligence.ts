/**
 * Customs Intelligence Types
 * Comprehensive type definitions for intelligent customs optimization
 * 4IR & 5IR Aligned - AI-Powered Trade Facilitation
 */

// ============================================================================
// TRADE PROGRAM TYPES (AEO, Trusted Trader, etc.)
// ============================================================================

export type TradeProgramType = 
  | 'AEO' // Authorized Economic Operator
  | 'TRUSTED_TRADER' // Trusted Trader Program
  | 'C_TPAT' // Customs-Trade Partnership Against Terrorism
  | 'FAST' // Free and Secure Trade
  | 'PIP' // Partners in Protection
  | 'AEO_MUTUAL_RECOGNITION' // MRA Programs
  | 'GOLDEN_LIST' // GCC Golden List
  | 'WHITE_LIST' // Saudi White List
  | 'GREEN_LANE' // Green Lane Program
  | 'PREFERRED_OPERATOR' // Preferred Operator Status
  | 'ECONOMIC_OPERATOR' // Economic Operator Registration

export type ProgramTier = 'BASIC' | 'STANDARD' | 'ADVANCED' | 'ELITE' | 'STRATEGIC'

export interface TradeProgram {
  id: string
  type: TradeProgramType
  name: string
  fullName: string
  country: string
  region: string
  authority: string
  authorityFullName: string
  tier: ProgramTier
  
  // Program Details
  description: string
  eligibilityCriteria: EligibilityCriterion[]
  applicationProcess: ApplicationStep[]
  estimatedProcessingTime: {
    min: number // days
    max: number // days
    average: number
  }
  
  // Costs
  applicationFee: { amount: number; currency: string }
  annualFee: { amount: number; currency: string }
  auditCosts: { amount: number; currency: string }
  totalFirstYearCost: { amount: number; currency: string }
  
  // Benefits
  benefits: ProgramBenefit[]
  unlockedCapabilities: UnlockedCapability[]
  
  // Mutual Recognition
  mutualRecognitionAgreements: MutualRecognitionAgreement[]
  
  // Requirements
  requirements: ProgramRequirement[]
  
  // Renewal
  renewalPeriod: number // years
  renewalProcess: string
  
  // Success Metrics
  successMetrics: {
    approvalRate: number // percentage
    averageProcessingTime: number // days
    memberCount: number
    satisfactionScore: number
  }
}

export interface EligibilityCriterion {
  id: string
  category: 'FINANCIAL' | 'COMPLIANCE' | 'SECURITY' | 'OPERATIONAL' | 'LEGAL'
  requirement: string
  description: string
  isMandatory: boolean
  verificationMethod: string
  estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface ApplicationStep {
  order: number
  name: string
  description: string
  duration: { min: number; max: number; unit: 'DAYS' | 'WEEKS' | 'MONTHS' }
  dependencies: string[]
  documents: string[]
  authority: string
  tips: string[]
}

export interface ProgramBenefit {
  id: string
  category: 'TIME_SAVINGS' | 'COST_REDUCTION' | 'PRIORITY_ACCESS' | 'SIMPLIFIED_PROCEDURES' | 'REDUCED_INSPECTIONS' | 'DEFERRED_PAYMENTS' | 'RECOGNITION'
  title: string
  description: string
  quantifiableImpact?: {
    metric: string
    reduction: number // percentage
    annualSavings?: { amount: number; currency: string }
  }
  applicableCountries: string[]
}

export interface UnlockedCapability {
  id: string
  name: string
  description: string
  category: 'CLEARANCE' | 'INSPECTION' | 'PAYMENT' | 'DOCUMENTATION' | 'ACCESS' | 'PRIORITY'
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  beforeProgram: string
  afterProgram: string
  timeSavings?: number // hours
  costSavings?: { amount: number; currency: string }
}

export interface MutualRecognitionAgreement {
  countryCode: string
  countryName: string
  program: string
  status: 'ACTIVE' | 'PENDING' | 'NEGOTIATING'
  benefits: string[]
  effectiveDate?: string
}

export interface ProgramRequirement {
  id: string
  category: 'DOCUMENT' | 'CERTIFICATION' | 'AUDIT' | 'TRAINING' | 'SYSTEM' | 'PROCESS'
  name: string
  description: string
  mandatory: boolean
  estimatedCost: { amount: number; currency: string }
  estimatedTime: number // days
  provider?: string
}

// ============================================================================
// ROOT CAUSE ANALYSIS TYPES
// ============================================================================

export type DelayCategory = 
  | 'DOCUMENTATION' 
  | 'INSPECTION' 
  | 'AUTHORITY_PROCESSING' 
  | 'CERTIFICATE_MISSING'
  | 'TARIFF_CLASSIFICATION'
  | 'VALUATION_DISPUTE'
  | 'SECURITY_CHECK'
  | 'SYSTEM_DOWNTIME'
  | 'OPERATIONAL_HOURS'
  | 'CONGESTION'
  | 'SANCTIONS_CHECK'
  | 'PERMIT_REQUIRED'
  | 'LABORATORY_TESTING'
  | 'QUARANTINE'

export interface RootCauseAnalysis {
  id: string
  touchpointId: string
  touchpointName: string
  
  // Primary Analysis
  primaryCause: DelayCategory
  primaryCauseDescription: string
  
  // Deep Analysis
  causeChain: CauseChainLink[]
  contributingFactors: ContributingFactor[]
  
  // Impact Assessment
  averageDelayHours: number
  worstCaseDelayHours: number
  frequencyPercentage: number // how often this issue occurs
  annualCostImpact: { amount: number; currency: string }
  
  // Solutions
  immediateSolutions: Solution[]
  shortTermSolutions: Solution[]
  longTermSolutions: Solution[]
  strategicSolutions: Solution[]
  
  // Program Recommendations
  programRecommendations: TradeProgramRecommendation[]
  
  // Certificates that could help
  helpfulCertificates: CertificateRecommendation[]
  
  // Historical Analysis
  trendAnalysis: {
    improving: boolean
    changePercentage: number
    historicalData: { period: string; avgDelay: number }[]
  }
}

export interface CauseChainLink {
  level: number // 1 = immediate, 2 = secondary, 3 = root
  cause: string
  description: string
  category: DelayCategory
  isControllable: boolean
  owner: 'SHIPPER' | 'CUSTOMS' | 'AUTHORITY' | 'CARRIER' | 'BROKER' | 'EXTERNAL'
}

export interface ContributingFactor {
  factor: string
  description: string
  weight: number // 0-100, how much it contributes
  isAddressable: boolean
  addressingSolution?: string
}

export interface Solution {
  id: string
  title: string
  description: string
  type: 'PROCESS' | 'TECHNOLOGY' | 'PROGRAM' | 'CERTIFICATE' | 'RELATIONSHIP' | 'RESOURCE'
  implementationComplexity: 'LOW' | 'MEDIUM' | 'HIGH'
  estimatedCost: { amount: number; currency: string }
  estimatedTimeToImplement: number // days
  expectedImpact: {
    delayReduction: number // hours
    costSavings: { amount: number; currency: string }
    complianceImprovement: number // percentage
  }
  pros: string[]
  cons: string[]
  prerequisites: string[]
  steps: string[]
  successMetrics: string[]
  roi: {
    paybackPeriod: number // months
    annualROI: number // percentage
  }
}

export interface TradeProgramRecommendation {
  program: TradeProgram
  relevanceScore: number // 0-100
  matchReason: string
  expectedBenefit: string
  implementation: {
    effort: 'LOW' | 'MEDIUM' | 'HIGH'
    timeline: number // months
    cost: { amount: number; currency: string }
  }
  unlocksPotential: string[]
}

export interface CertificateRecommendation {
  certificate: Certificate
  relevanceScore: number
  currentStatus: 'AVAILABLE' | 'OBTAINABLE' | 'NOT_APPLICABLE'
  benefitIfObtained: string
  timeToObtain: number // days
  costToObtain: { amount: number; currency: string }
}

// ============================================================================
// CERTIFICATE & DOCUMENT TYPES
// ============================================================================

export type CertificateType =
  | 'COA' // Certificate of Analysis
  | 'COO' // Certificate of Origin
  | 'COC' // Certificate of Conformity
  | 'MSDS' // Material Safety Data Sheet
  | 'PHYTOSANITARY'
  | 'VETERINARY'
  | 'HALAL'
  | 'ISO'
  | 'SABER'
  | 'SFDA'
  | 'CIVIL_DEFENSE'
  | 'REACH'
  | 'CE_MARK'
  | 'GCC_CONFORMITY'
  | 'FREE_SALE'
  | 'HEALTH'
  | 'FUMIGATION'
  | 'RADIATION'
  | 'DANGEROUS_GOODS'

export interface Certificate {
  id: string
  type: CertificateType
  name: string
  fullName: string
  issuingAuthority: string
  validityPeriod: number // days
  applicableCountries: string[]
  applicableProducts: string[]
  
  // Benefits when available
  clearanceBenefits: ClearanceBenefit[]
  
  // Requirements to obtain
  requirements: string[]
  obtainingProcess: string[]
  estimatedTime: number // days
  cost: { amount: number; currency: string }
  
  // Impact
  impactOnClearance: {
    withoutCertificate: { avgHours: number; inspectionRate: number }
    withCertificate: { avgHours: number; inspectionRate: number }
  }
}

export interface ClearanceBenefit {
  country: string
  benefit: string
  timeSavings: number // hours
  inspectionReduction: number // percentage
  additionalPerks: string[]
}

// ============================================================================
// REGULATORY KNOWLEDGE BASE TYPES
// ============================================================================

export interface TariffUpdate {
  id: string
  country: string
  hsCode: string
  productDescription: string
  previousRate: number
  newRate: number
  effectiveDate: string
  expiryDate?: string
  source: string
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  analysisNotes: string
  affectedTradeLanes: string[]
}

export interface SanctionsUpdate {
  id: string
  type: 'ENTITY' | 'COUNTRY' | 'SECTOR' | 'PRODUCT'
  sanctioningAuthority: string
  targetName: string
  targetCountry?: string
  sanctionType: 'COMPREHENSIVE' | 'PARTIAL' | 'TARGETED'
  effectiveDate: string
  description: string
  implications: string[]
  complianceRequirements: string[]
  alternatives?: string[]
  source: string
  lastUpdated: string
}

export interface RegulatoryChange {
  id: string
  country: string
  authority: string
  category: 'IMPORT' | 'EXPORT' | 'TRANSIT' | 'DOCUMENTATION' | 'INSPECTION' | 'TARIFF' | 'LICENSING'
  title: string
  description: string
  effectiveDate: string
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  affectedProducts: string[]
  affectedCountries: string[]
  requiredActions: string[]
  source: string
  analysisNotes: string
}

export interface CustomsProgram {
  id: string
  country: string
  name: string
  description: string
  benefits: string[]
  eligibility: string[]
  applicationUrl?: string
  contactInfo?: string
  processingTime: number // days
  fees: { amount: number; currency: string }
}

// ============================================================================
// JOURNEY INTELLIGENCE TYPES
// ============================================================================

export interface JourneyIntelligence {
  journeyId: string
  route: {
    origin: string
    destination: string
    via?: string[]
  }
  
  // Bottleneck Analysis
  bottlenecks: BottleneckIntelligence[]
  
  // Overall Optimization Potential
  currentTotalTime: number // hours
  optimizedTotalTime: number // hours
  potentialTimeSavings: number // hours
  potentialCostSavings: { amount: number; currency: string }
  
  // Recommended Programs
  recommendedPrograms: TradeProgramRecommendation[]
  
  // Certificate Analysis
  certificateAnalysis: CertificateImpactAnalysis[]
  
  // Regulatory Alerts
  regulatoryAlerts: RegulatoryChange[]
  
  // Predictive Insights
  predictions: {
    nextQuarterTrend: 'IMPROVING' | 'STABLE' | 'WORSENING'
    anticipatedChanges: string[]
    riskFactors: string[]
    opportunities: string[]
  }
}

export interface BottleneckIntelligence {
  touchpointId: string
  touchpointName: string
  category: 'Origin' | 'Transport' | 'Customs' | 'Destination'
  
  // Current State
  currentAvgHours: number
  percentageOfJourney: number
  bottleneckSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  
  // Root Cause
  rootCauseAnalysis: RootCauseAnalysis
  
  // Optimization
  optimizationPotential: number // hours
  optimizationStrategies: OptimizationStrategy[]
  
  // Quick Wins
  quickWins: Solution[]
  
  // Long-term Solutions
  strategicSolutions: Solution[]
}

export interface OptimizationStrategy {
  id: string
  name: string
  description: string
  approach: 'PROGRAM_ENROLLMENT' | 'CERTIFICATE_ACQUISITION' | 'PROCESS_IMPROVEMENT' | 'TECHNOLOGY' | 'RELATIONSHIP' | 'SCHEDULING'
  expectedImpact: {
    timeSavings: number // hours
    costSavings: { amount: number; currency: string }
    reliabilityImprovement: number // percentage
  }
  implementation: {
    effort: 'LOW' | 'MEDIUM' | 'HIGH'
    timeline: number // weeks
    cost: { amount: number; currency: string }
    dependencies: string[]
  }
  relatedPrograms?: TradeProgram[]
  relatedCertificates?: Certificate[]
}

export interface CertificateImpactAnalysis {
  certificate: Certificate
  currentStatus: 'AVAILABLE' | 'MISSING' | 'EXPIRED' | 'PENDING'
  impactIfAvailable: {
    touchpointsAffected: string[]
    totalTimeSavings: number // hours
    inspectionReduction: number // percentage
    priorityAccess: boolean
  }
  recommendation: 'OBTAIN' | 'RENEW' | 'MAINTAIN' | 'NOT_REQUIRED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  acquisitionPlan?: {
    steps: string[]
    timeline: number // days
    cost: { amount: number; currency: string }
  }
}

// ============================================================================
// COMPARISON & ANALYSIS TYPES
// ============================================================================

export interface ProgramComparison {
  programs: TradeProgram[]
  comparisonMatrix: {
    criterion: string
    category: string
    values: { programId: string; value: string | number; score: number }[]
  }[]
  overallScores: { programId: string; score: number; rank: number }[]
  recommendation: {
    bestOverall: string
    bestForSpeed: string
    bestForCost: string
    bestForCoverage: string
    reasoning: string
  }
}

export interface ROIAnalysis {
  programId: string
  initialInvestment: { amount: number; currency: string }
  annualCosts: { amount: number; currency: string }
  annualBenefits: {
    timeSavings: { hours: number; monetaryValue: { amount: number; currency: string } }
    costReductions: { amount: number; currency: string }
    inspectionReductions: { percentage: number; monetaryValue: { amount: number; currency: string } }
    penaltyAvoidance: { amount: number; currency: string }
    opportunityCosts: { amount: number; currency: string }
  }
  netAnnualBenefit: { amount: number; currency: string }
  paybackPeriod: number // months
  fiveYearROI: number // percentage
  breakEvenPoint: string // date
}

// ============================================================================
// KNOWLEDGE BASE SYNC TYPES
// ============================================================================

export interface KnowledgeBaseStatus {
  lastUpdated: string
  sources: {
    name: string
    type: 'TARIFF' | 'SANCTIONS' | 'REGULATORY' | 'PROGRAM' | 'CERTIFICATE'
    lastSync: string
    status: 'SYNCED' | 'PENDING' | 'ERROR'
    recordCount: number
  }[]
  pendingAlerts: number
  criticalUpdates: number
}

