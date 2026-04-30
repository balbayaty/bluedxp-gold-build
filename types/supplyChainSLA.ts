/**
 * Multi-Party Supply Chain SLA/KPI Framework
 * 
 * This framework supports SLAs and KPIs for ANY party in the supply chain:
 * - Customers (3PL/4PL clients)
 * - Warehouses (3PL/4PL facilities)
 * - 3PL/4PL Providers
 * - Carriers/Transportation Providers
 * - Vendors/Suppliers
 * - End Recipients/Consignees
 * - Customs Brokers
 * - Freight Forwarders
 * - Any supply chain stakeholder
 * 
 * Based on industry best practices:
 * - SCOR (Supply Chain Operations Reference) Model
 * - ISO 9001, ISO 14001, ISO 45001
 * - APICS/ASCM Standards
 * - Gartner Supply Chain Best Practices
 * - Industry-leading 3PL/4PL frameworks (DHL, FedEx, Kuehne+Nagel, etc.)
 */

// ============================================================================
// PARTY TYPES - All parties in the supply chain
// ============================================================================

export type SupplyChainPartyType =
  | 'CUSTOMER'              // 3PL/4PL client (the company storing goods)
  | 'WAREHOUSE'             // 3PL/4PL warehouse facility
  | '3PL_PROVIDER'          // Third-party logistics provider
  | '4PL_PROVIDER'          // Fourth-party logistics provider
  | 'CARRIER'               // Transportation/carrier company
  | 'VENDOR'                // Supplier/vendor
  | 'END_RECIPIENT'         // Final consignee/end customer
  | 'CUSTOMS_BROKER'        // Customs clearance agent
  | 'FREIGHT_FORWARDER'     // Freight forwarding company
  | 'BROKER'                // Logistics broker
  | 'CONSOLIDATOR'          // Freight consolidator
  | 'DISTRIBUTION_CENTER'   // Distribution center
  | 'CROSS_DOCK'            // Cross-dock facility
  | 'VALUE_ADDED_SERVICE'   // VAS provider
  | 'QUALITY_LAB'           // Quality testing laboratory
  | 'CERTIFICATION_BODY'    // Certification/audit body
  | 'INSURANCE_PROVIDER'    // Insurance company
  | 'BANK'                  // Financial institution
  | 'CUSTOM'                // Custom party type

// ============================================================================
// SERVICE CATEGORIES - All service types in supply chain
// ============================================================================

export type SupplyChainServiceCategory =
  | 'DIGITAL_FULFILLMENT'      // E-commerce and digital order processing
  | 'INBOUND_LOGISTICS'        // Receiving, validation, and intake
  | 'WAREHOUSE_OPERATIONS'     // Storage, inventory management, value-added services
  | 'OUTBOUND_FULFILLMENT'     // Order processing, picking, packing, shipping
  | 'REVERSE_LOGISTICS'        // Returns, exchanges, refurbishment
  | 'VALUE_ADDED_SERVICES'     // Kitting, labeling, customization
  | 'CUSTOMS_CLEARANCE'        // Customs documentation, clearance, and compliance
  | 'TRANSPORTATION'           // Local FCL, LCL, and freight services
  | 'FREIGHT_FORWARDING'       // International freight forwarding and logistics
  | 'DATA_ANALYTICS'           // Reporting, insights, predictive analytics
  | 'SUSTAINABILITY'           // ESG compliance, carbon footprint reduction
  | 'QUALITY_ASSURANCE'        // Quality control, testing, certification
  | 'FINANCIAL_SERVICES'       // Payment processing, financing, insurance
  | 'DOCUMENTATION'            // Documentation, compliance, reporting
  | 'TRACKING_VISIBILITY'      // Real-time tracking and visibility
  | 'CUSTOM'                   // Custom service category

// ============================================================================
// MULTI-PARTY SLA INTERFACE
// ============================================================================

export interface SupplyChainSLA {
  id: string
  name: string
  description: string
  
  // Party Information
  partyType: SupplyChainPartyType
  partyId: string                    // ID of the party (customer ID, warehouse ID, carrier ID, etc.)
  partyName: string                  // Name of the party
  partyRole: 'PROVIDER' | 'RECIPIENT' | 'BOTH'  // Is this party providing or receiving the service?
  
  // Service Information
  serviceCategory: SupplyChainServiceCategory
  serviceType: string                // Specific service type (e.g., "Dock-to-Stock", "Order-to-Ship")
  
  // SLA Metrics
  targetDuration: number              // Target duration in seconds (or percentage for accuracy metrics)
  warningThreshold: number            // Warning threshold percentage (e.g., 80 = 80% of target)
  criticalThreshold: number           // Critical threshold percentage (e.g., 100 = 100% of target)
  metric: 'duration' | 'percentage' | 'count' | 'custom'
  customFormula?: string              // Custom formula for calculation
  
  // Conditions and Rules
  conditions?: SLACondition[]         // Conditions for when this SLA applies
  dependencies?: string[]              // IDs of other SLAs this depends on
  prerequisites?: string[]             // Prerequisites that must be met
  
  // Responsibility and Accountability
  responsibleParty: SupplyChainPartyType  // Who is responsible for meeting this SLA
  responsiblePartyId: string              // ID of responsible party
  accountableParty?: SupplyChainPartyType  // Who is accountable (may differ from responsible)
  accountablePartyId?: string             // ID of accountable party
  
  // Performance Tiers
  performanceTier?: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'STANDARD'
  tierTarget?: number                 // Target for this specific tier
  
  // Escalation
  escalationRules?: EscalationRule[]
  
  // Status
  isActive: boolean
  isTemplate: boolean                 // Is this a template that can be reused?
  templateId?: string                 // If created from template, reference to template
  
  // Metadata
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string
  updatedBy?: string
  version?: string                    // SLA version number
  effectiveDate?: Date | string       // When this SLA becomes effective
  expiryDate?: Date | string          // When this SLA expires
}

export interface SLACondition {
  id: string
  field: string                       // Field to check (e.g., 'vendor', 'plant', 'priority', 'orderType')
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'between'
  value: string | number | string[] | number[] | { min: number; max: number }
  logicalOperator?: 'AND' | 'OR'     // How to combine with next condition
}

export interface EscalationRule {
  id: string
  level: 'INFORMATIONAL' | 'WARNING' | 'CRITICAL' | 'BREACH'
  threshold: number                   // Percentage of target (e.g., 85 = 85% of target)
  actions: string[]                   // Actions to take
  timeframe: string                   // Timeframe for action (e.g., "Within 2 hours")
  stakeholders: string[]              // Who to notify
  autoTrigger: boolean                // Automatically trigger escalation
}

// ============================================================================
// MULTI-PARTY KPI INTERFACE
// ============================================================================

export interface SupplyChainKPI {
  id: string
  name: string
  description: string
  
  // Party Information
  partyType: SupplyChainPartyType
  partyId: string                    // ID of the party
  partyName: string                  // Name of the party
  partyRole: 'PROVIDER' | 'RECIPIENT' | 'BOTH'
  
  // KPI Metrics
  formula: string                    // Formula for calculation
  target: number                     // Target value
  unit: string                       // Unit of measurement (%, hours, count, currency, etc.)
  category: 'performance' | 'efficiency' | 'compliance' | 'quality' | 'cost' | 'sustainability' | 'custom'
  
  // Calculation
  calculationMethod: 'REAL_TIME' | 'BATCH' | 'SCHEDULED' | 'ON_DEMAND'
  calculationFrequency?: string      // How often to calculate (e.g., "HOURLY", "DAILY", "WEEKLY")
  aggregationMethod?: 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT' | 'CUSTOM'
  
  // Conditions
  conditions?: KPICondition[]        // Conditions for when this KPI applies
  filters?: Record<string, any>      // Data filters
  
  // Responsibility
  responsibleParty: SupplyChainPartyType
  responsiblePartyId: string
  accountableParty?: SupplyChainPartyType
  accountablePartyId?: string
  
  // Benchmarking
  industryBenchmark?: number         // Industry benchmark value
  bestInClass?: number               // Best-in-class value
  baseline?: number                  // Baseline value for comparison
  
  // Status
  isActive: boolean
  isTemplate: boolean
  templateId?: string
  
  // Metadata
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string
  updatedBy?: string
  version?: string
}

export interface KPICondition {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'between'
  value: string | number | string[] | number[] | { min: number; max: number }
  logicalOperator?: 'AND' | 'OR'
}

// ============================================================================
// SLA/KPI COMPLIANCE RESULT
// ============================================================================

export interface SupplyChainSLAComplianceResult {
  id: string
  slaId: string
  slaName: string
  
  // Party Information
  partyType: SupplyChainPartyType
  partyId: string
  partyName: string
  
  // Transaction/Order Information
  transactionId: string              // Order ID, ASN ID, Shipment ID, etc.
  transactionType: string            // 'ORDER', 'ASN', 'SHIPMENT', 'RETURN', etc.
  
  // Compliance Metrics
  targetDuration: number
  actualDuration: number
  compliancePercentage: number
  status: 'MET' | 'WARNING' | 'CRITICAL' | 'BREACH'
  
  // Timing
  startTime: Date | string
  endTime?: Date | string
  targetEndTime: Date | string
  actualEndTime?: Date | string
  
  // Breach Information
  breachReason?: string
  breachDetails?: Record<string, any>
  remediationActions?: string[]
  
  // Dependencies
  dependentSLAs?: string[]           // IDs of dependent SLAs
  prerequisiteSLAs?: string[]        // IDs of prerequisite SLAs
  
  // Calculated At
  calculatedAt: Date | string
}

export interface SupplyChainKPIResult {
  id: string
  kpiId: string
  kpiName: string
  
  // Party Information
  partyType: SupplyChainPartyType
  partyId: string
  partyName: string
  
  // KPI Metrics
  value: number
  target: number
  unit: string
  status: 'MET' | 'WARNING' | 'CRITICAL' | 'BELOW_TARGET'
  
  // Comparison
  vsBaseline?: number                 // Change vs baseline
  vsIndustryBenchmark?: number        // Change vs industry benchmark
  vsBestInClass?: number              // Change vs best-in-class
  
  // Period
  periodStart: Date | string
  periodEnd: Date | string
  calculatedAt: Date | string
}

// ============================================================================
// SLA/KPI TEMPLATE - For reusable configurations
// ============================================================================

export interface SupplyChainSLATemplate {
  id: string
  name: string
  description: string
  partyType: SupplyChainPartyType
  serviceCategory: SupplyChainServiceCategory
  serviceType: string
  defaultTargetDuration: number
  defaultWarningThreshold: number
  defaultCriticalThreshold: number
  defaultConditions?: SLACondition[]
  defaultEscalationRules?: EscalationRule[]
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface SupplyChainKPITemplate {
  id: string
  name: string
  description: string
  partyType: SupplyChainPartyType
  formula: string
  defaultTarget: number
  unit: string
  category: 'performance' | 'efficiency' | 'compliance' | 'quality' | 'cost' | 'sustainability' | 'custom'
  defaultConditions?: KPICondition[]
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

// ============================================================================
// INTELLIGENT SLA/KPI ENGINE
// ============================================================================

export interface IntelligentSLAEngine {
  // Auto-detect applicable SLAs based on transaction context
  detectApplicableSLAs: (context: TransactionContext) => SupplyChainSLA[]
  
  // Calculate SLA compliance in real-time
  calculateSLACompliance: (sla: SupplyChainSLA, transaction: any) => SupplyChainSLAComplianceResult
  
  // Predict SLA breach risk
  predictBreachRisk: (sla: SupplyChainSLA, currentProgress: number, elapsedTime: number) => {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    probability: number
    recommendedActions: string[]
  }
  
  // Auto-optimize SLA targets based on historical performance
  optimizeSLATargets: (sla: SupplyChainSLA, historicalData: SupplyChainSLAComplianceResult[]) => SupplyChainSLA
  
  // Suggest SLA improvements
  suggestImprovements: (sla: SupplyChainSLA, complianceResults: SupplyChainSLAComplianceResult[]) => string[]
}

export interface TransactionContext {
  transactionType: string            // 'ORDER', 'ASN', 'SHIPMENT', etc.
  partyType: SupplyChainPartyType
  partyId: string
  serviceCategory: SupplyChainServiceCategory
  attributes: Record<string, any>     // Any relevant attributes (vendor, priority, orderType, etc.)
}

