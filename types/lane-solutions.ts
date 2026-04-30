/**
 * Lane Optimization Solutions & Intelligence System
 * Enterprise-grade solution management for trade lane optimization
 * 
 * Captures real-world solutions implemented:
 * - Trade program enrollments (Golden List, AEO)
 * - Certificate consolidation (TÜV, SGS COA at shipment level)
 * - Document optimization (Bayan grouping)
 * - Root cause analysis with Fishbone factors
 * 
 * Fact-based with references, ROI calculations, and implementation tracking
 * Aligned with IATA, FIATA, WCO, and GCC customs standards
 */

// ============================================================================
// SOLUTION CATEGORIES
// ============================================================================

export type SolutionCategory = 
  | 'TRADE_PROGRAM'           // AEO, Golden List, Trusted Trader
  | 'CERTIFICATE_OPTIMIZATION' // COA consolidation, TÜV certification
  | 'DOCUMENT_CONSOLIDATION'   // Grouping Bayan/shipments
  | 'TIMING_OPTIMIZATION'      // Arrival window management
  | 'PROCESS_AUTOMATION'       // Digital pre-clearance
  | 'CARRIER_OPTIMIZATION'     // Certified carriers, equipment
  | 'STAKEHOLDER_ENGAGEMENT'   // Consignee/shipper programs
  | 'INFRASTRUCTURE'           // Route optimization, facilities

export type ImplementationStatus = 
  | 'PROPOSED' 
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PILOT' 
  | 'PARTIALLY_IMPLEMENTED' 
  | 'FULLY_IMPLEMENTED' 
  | 'ON_HOLD'
  | 'NOT_APPLICABLE'
  | 'DEPRECATED'

export type StakeholderRole = 
  | 'SHIPPER'           // Exporter / our customer
  | 'CONSIGNEE'         // Importer / customer's customer  
  | 'CARRIER'           // Transport provider (us)
  | 'CUSTOMS_BROKER'    // Clearance agent
  | 'CERTIFICATION_BODY' // TÜV, SGS, Intertek
  | 'CUSTOMS_AUTHORITY' // ZATCA, Kuwait Customs
  | 'FREIGHT_FORWARDER' // 3PL/4PL
  | 'REGULATORY_BODY'   // SFDA, SASO, etc.

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// ============================================================================
// ROOT CAUSE ANALYSIS
// ============================================================================

export interface RootCauseAnalysis {
  id: string
  problem: string
  problemStatement: string
  category: 'REGULATORY' | 'OPERATIONAL' | 'DOCUMENTATION' | 'INFRASTRUCTURE' | 'CAPACITY' | 'COMMERCIAL'
  impactAreas: string[]
  severity: RiskLevel
  frequency: 'RARE' | 'OCCASIONAL' | 'FREQUENT' | 'CONSTANT'
  
  // Current vs desired state
  currentState: {
    description: string
    metrics: { name: string; value: number; unit: string }[]
  }
  desiredState: {
    description: string
    metrics: { name: string; value: number; unit: string }[]
  }
  
  // Ishikawa/Fishbone factors
  fishboneAnalysis: {
    people: string[]
    process: string[]
    policy: string[]
    technology: string[]
    environment: string[]
    measurement: string[]
  }
  
  // 5 Whys analysis
  fiveWhys?: string[]
  
  // Contributing factors
  contributingFactors: {
    factor: string
    contribution: number // percentage
    controllable: boolean
  }[]
}

// ============================================================================
// SOLUTION DEFINITION
// ============================================================================

export interface LaneSolution {
  id: string
  code: string                    // e.g., "SOL-KW-001"
  name: string
  category: SolutionCategory
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  
  // Description
  summary: string
  detailedDescription: string
  implementationApproach: string[]
  
  // Problem it solves
  rootCauseId: string
  
  // Stakeholders
  primaryBeneficiary: StakeholderRole
  requiredStakeholders: StakeholderRole[]
  
  // Implementation
  status: ImplementationStatus
  implementationDate?: string
  implementedBy?: StakeholderRole[]
  implementationProgress?: number // 0-100
  
  // Requirements
  requirements: SolutionRequirement[]
  constraints: SolutionConstraint[]
  
  // Impact
  benefits: SolutionBenefit[]
  risks: SolutionRisk[]
  
  // Metrics
  metrics: SolutionMetrics
  kpis: SolutionKPI[]
  
  // References
  references: Reference[]
  
  // Applicability
  applicableLanes: string[]
  applicableCountries: string[]
  applicableCommodities?: string[]
  
  // Related solutions
  relatedSolutions?: string[]
  prerequisiteSolutions?: string[]
  
  // Tags for filtering
  tags: string[]
  
  // Audit trail
  createdAt: string
  updatedAt: string
  version: string
}

export interface SolutionRequirement {
  id: string
  description: string
  responsibleParty: StakeholderRole
  effort: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  timeline: string
  dependencies?: string[]
  cost?: CostEstimate
  documentation?: string[]
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
}

export interface SolutionConstraint {
  id: string
  description: string
  type: 'REGULATORY' | 'COMMERCIAL' | 'OPERATIONAL' | 'TECHNICAL' | 'FINANCIAL'
  severity: 'BLOCKING' | 'MAJOR' | 'MINOR'
  mitigation?: string
  affectedParties: StakeholderRole[]
  workaround?: string
  isActive: boolean
}

export interface SolutionBenefit {
  id: string
  description: string
  category: 'TIME' | 'COST' | 'RELIABILITY' | 'COMPLIANCE' | 'SUSTAINABILITY' | 'QUALITY' | 'SAFETY'
  quantifiedValue: number
  unit: string
  confidence: 'ESTIMATED' | 'PROJECTED' | 'MEASURED'
  beneficiaries: StakeholderRole[]
  measurementMethod?: string
}

export interface SolutionRisk {
  id: string
  description: string
  category: string
  probability: RiskLevel
  impact: RiskLevel
  riskScore: number // probability * impact
  mitigation: string
  contingency?: string
  owner: StakeholderRole
  status: 'OPEN' | 'MITIGATED' | 'ACCEPTED' | 'CLOSED'
}

export interface SolutionMetrics {
  // Time savings
  avgTimeReduction: number
  timeReductionPercentage: number
  timeReductionRange: { min: number; max: number }
  
  // Cost savings
  avgCostSavingsPerShipment: number
  costReductionPercentage: number
  annualCostSavings?: number
  
  // Reliability
  reliabilityImprovement: number
  predictabilityScore?: number
  
  // Volume
  applicableShipmentsPerMonth: number
  adoptionRate?: number
  
  // ROI
  implementationCost: number
  recurringCost?: number
  paybackPeriodMonths: number
  threeYearROI: number
  npv?: number
  irr?: number
  
  // Actual results (if implemented)
  actualResults?: {
    measurementPeriod: string
    measuredAt: string
    timeReduction: number
    costSavings: number
    volumeProcessed: number
    satisfactionScore?: number
  }
}

export interface SolutionKPI {
  id: string
  name: string
  description: string
  targetValue: number
  currentValue: number
  unit: string
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING'
  lastUpdated: string
}

export interface CostEstimate {
  oneTime: number
  recurring?: number
  recurringPeriod?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
  currency: string
  breakdown?: { item: string; amount: number }[]
}

export interface Reference {
  id: string
  title: string
  type: 'REGULATION' | 'OFFICIAL_PORTAL' | 'CERTIFICATION_BODY' | 'CASE_STUDY' | 'DOCUMENTATION' | 'STANDARD' | 'WHITEPAPER'
  url?: string
  authority?: string
  documentNumber?: string
  datePublished?: string
  dateAccessed?: string
  notes?: string
  isVerified: boolean
}

// ============================================================================
// CERTIFICATION BODIES
// ============================================================================

export interface CertificationBody {
  id: string
  name: string
  shortName: string
  type: 'TESTING_LAB' | 'INSPECTION_BODY' | 'CERTIFICATION_BODY' | 'NOTIFIED_BODY'
  logo?: string
  
  // Accreditations
  accreditations: {
    standard: string
    accreditationBody: string
    certificateNumber?: string
    validUntil?: string
  }[]
  
  // Services
  services: {
    name: string
    description: string
    turnaroundTime: string
    priceRange?: string
  }[]
  
  // Coverage
  countries: string[]
  offices: {
    country: string
    city: string
    address?: string
    phone?: string
    email?: string
  }[]
  
  // Contact
  website: string
  generalEmail?: string
  
  // Ratings
  reliabilityScore?: number
  responseTime?: string
}

// ============================================================================
// BENCHMARKS & INSIGHTS
// ============================================================================

export interface LaneBenchmark {
  id: string
  laneCode: string
  category: string
  metric: string
  
  // Values
  currentValue: number
  previousValue?: number
  industryAverage: number
  bestInClass: number
  targetValue: number
  
  // Context
  unit: string
  lowerIsBetter: boolean
  
  // Trend
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING'
  trendPercentage: number
  trendPeriod: string
  
  // Percentile ranking
  percentileRank?: number
  
  // Period
  measurementPeriod: string
  lastUpdated: string
  dataSource: string
}

export interface InsightToggle {
  id: string
  name: string
  icon: string
  colorClass: string
  description: string
  isActive: boolean
  dataType: 'TIME' | 'COST' | 'RELIABILITY' | 'CO2' | 'COMPLIANCE'
}

export interface InsightDataPoint {
  touchpointId: string
  label: string
  baselineValue: number
  currentValue: number
  optimizedValue: number
  unit: string
  improvement: number
  improvementPercentage: number
  trend: 'up' | 'down' | 'stable'
  trendIsPositive: boolean
  solutions: string[] // Solution IDs that impact this point
}

// ============================================================================
// ROI CALCULATOR
// ============================================================================

export interface ROICalculatorInput {
  shipmentsPerMonth: number
  avgShipmentValue: number
  currentClearanceTime: number
  currentCertCostPerTruck: number
  currentRejectionRate: number
  demurrageRatePerHour: number
  truckCostPerHour: number
}

export interface ROICalculatorOutput {
  // Time savings
  totalHoursSavedPerMonth: number
  annualHoursSaved: number
  
  // Cost savings breakdown
  certificationSavings: number
  demurrageSavings: number
  truckUtilizationSavings: number
  totalMonthlySavings: number
  totalAnnualSavings: number
  
  // ROI metrics
  implementationCost: number
  paybackPeriodMonths: number
  firstYearROI: number
  threeYearROI: number
  
  // Efficiency gains
  throughputIncrease: number
  reliabilityImprovement: number
}

// ============================================================================
// SAMPLE DATA - ROOT CAUSES
// ============================================================================

export const SA_KW_ROOT_CAUSES: RootCauseAnalysis[] = [
  {
    id: 'rc-kw-customs-bottleneck',
    problem: 'Kuwait Customs Clearance Bottleneck',
    problemStatement: 'Kuwait import customs clearance at Nuwaiseeb BCP takes an average of 55.43 hours, consuming 44% of total transit time and causing significant delays and cost overruns.',
    category: 'REGULATORY',
    impactAreas: ['Transit Time', 'Cost', 'Predictability', 'Customer Satisfaction', 'Fleet Utilization'],
    severity: 'CRITICAL',
    frequency: 'CONSTANT',
    
    currentState: {
      description: 'Average 55.43 hours for import clearance at Nuwaiseeb with high variability (36-82 hours)',
      metrics: [
        { name: 'Average Clearance Time', value: 55.43, unit: 'hours' },
        { name: 'Inspection Rate', value: 45, unit: '%' },
        { name: 'Daily Operating Hours', value: 5, unit: 'hours' },
        { name: 'Clearance Time Variance', value: 46, unit: 'hours' }
      ]
    },
    desiredState: {
      description: 'Reduce import clearance to under 15 hours with predictable processing',
      metrics: [
        { name: 'Target Clearance Time', value: 15, unit: 'hours' },
        { name: 'Target Inspection Rate', value: 10, unit: '%' },
        { name: 'Target Operating Hours', value: 8, unit: 'hours' },
        { name: 'Target Variance', value: 6, unit: 'hours' }
      ]
    },
    
    fishboneAnalysis: {
      people: [
        'Limited customs officers during peak hours',
        'Manual document verification requires skilled staff',
        'High workload per officer (150+ declarations/day)',
        'Staff availability affected by breaks and shifts'
      ],
      process: [
        'Sequential processing (not parallel)',
        'Physical inspection required for non-certified importers',
        'Multiple verification steps for COA/COO',
        'Paper-based document handling',
        'No pre-clearance processing'
      ],
      policy: [
        'BCP operating hours limited to 5 hours daily (8am-1pm)',
        'Friday closure affects weekly throughput',
        'High inspection requirements for chemical products',
        'Individual truck declarations required',
        'No mutual recognition of Saudi certifications'
      ],
      technology: [
        'ASYCUDA system requires manual data entry',
        'No real-time queue management',
        'Limited integration with shipper systems',
        'No automated document verification'
      ],
      environment: [
        'High temperatures limit outdoor inspection hours',
        'Limited covered inspection bays',
        'Peak congestion Sunday-Tuesday',
        'Ramadan/Eid holiday schedule disruptions'
      ],
      measurement: [
        'No SLA for clearance times',
        'Limited visibility into queue position',
        'Inconsistent processing time reporting',
        'No predictive analytics for arrival planning'
      ]
    },
    
    fiveWhys: [
      'Why is clearance time 55+ hours? → BCP only operates 5 hours daily',
      'Why only 5 hours daily? → Customs staffing and policy constraints',
      'Why limited staffing? → Budget constraints and hiring limitations',
      'Why not extended hours for commercial cargo? → No formal trusted trader program adoption',
      'Why no trusted trader adoption? → Importers unaware of benefits and process'
    ],
    
    contributingFactors: [
      { factor: 'Limited operating hours (5hr/day)', contribution: 45, controllable: false },
      { factor: 'High inspection rate for non-certified', contribution: 25, controllable: true },
      { factor: 'Individual truck processing', contribution: 15, controllable: true },
      { factor: 'Manual document verification', contribution: 10, controllable: false },
      { factor: 'Arrival timing mismatch', contribution: 5, controllable: true }
    ]
  },
  {
    id: 'rc-cert-cost',
    problem: 'High Per-Truck Certification Costs',
    problemStatement: 'Each truck requires individual Certificate of Analysis (COA) and separate Bayan declaration, resulting in $150-200 certification cost per truck.',
    category: 'DOCUMENTATION',
    impactAreas: ['Cost', 'Documentation Complexity', 'Processing Time'],
    severity: 'HIGH',
    frequency: 'CONSTANT',
    
    currentState: {
      description: 'Individual COA and Bayan per truck, averaging $175 per truck',
      metrics: [
        { name: 'COA Cost per Truck', value: 175, unit: 'USD' },
        { name: 'Documents per Truck', value: 8, unit: 'documents' },
        { name: 'Processing Time per Truck', value: 4, unit: 'hours' }
      ]
    },
    desiredState: {
      description: 'Consolidated COA covering 3-5 trucks, reducing cost to $50-70 per truck',
      metrics: [
        { name: 'Target Cost per Truck', value: 55, unit: 'USD' },
        { name: 'Target Documents per Truck', value: 3, unit: 'documents' },
        { name: 'Target Processing Time', value: 1.5, unit: 'hours' }
      ]
    },
    
    fishboneAnalysis: {
      people: [
        'Each truck treated as separate shipment by default',
        'Lack of awareness of consolidation options',
        'Shipper quality team requires individual tracking'
      ],
      process: [
        'Legacy process designed for individual trucks',
        'No batch processing workflow established',
        'Testing done per-truck not per-batch',
        'Separate sampling for each truck'
      ],
      policy: [
        'Customs allows up to 5 trucks per Bayan (not utilized)',
        'Certification bodies offer batch testing',
        'Both countries allow consolidated declarations'
      ],
      technology: [
        'TMS not configured for batch declarations',
        'No integration with certification bodies',
        'Manual certificate generation'
      ],
      environment: [
        'High rejection rate at loading disrupts batching',
        'Variable loading times across trucks',
        'Different product batches in same shipment window'
      ],
      measurement: [
        'Cost tracked per shipment not per truck',
        'No consolidation ratio KPI',
        'Savings not measured systematically'
      ]
    },
    
    contributingFactors: [
      { factor: 'Individual truck processing tradition', contribution: 40, controllable: true },
      { factor: 'High loading rejection rate (disrupts batches)', contribution: 30, controllable: false },
      { factor: 'Shipper per-truck quality requirements', contribution: 20, controllable: false },
      { factor: 'Lack of batch coordination', contribution: 10, controllable: true }
    ]
  }
]

// ============================================================================
// SAMPLE DATA - SAUDI-KUWAIT LANE SOLUTIONS
// ============================================================================

export const SA_KW_SOLUTIONS: LaneSolution[] = [
  {
    id: 'sol-kw-golden-list',
    code: 'SOL-KW-001',
    name: 'Kuwait Golden List Enrollment',
    category: 'TRADE_PROGRAM',
    priority: 'CRITICAL',
    
    summary: 'Enroll consignee/importer in Kuwait Customs Golden List program for priority clearance and reduced inspections',
    
    detailedDescription: `The Kuwait Golden List (القائمة الذهبية) is Kuwait's trusted trader program administered by the General Administration of Customs. It provides enrolled importers with significant privileges at all border crossing points including Nuwaiseeb.

**Program Benefits:**
• Priority lane access at BCPs (skip regular queue)
• Reduced physical inspection rate (from ~45% to <10%)
• Extended processing hours (up to 3 additional hours daily)
• Simplified documentation requirements
• Dedicated customs officer assignment
• Post-clearance audit instead of pre-clearance holds
• Green channel for repeat shipments

**Eligibility Criteria:**
• Minimum 2 years customs history with clean record
• Annual import value exceeding KWD 500,000
• Valid trade license and CR
• No outstanding customs violations
• Bank guarantee or insurance bond
• Compliance with customs valuation rules`,

    implementationApproach: [
      'Identify consignee eligibility and interest',
      'Gather required documentation (trade license, import history, bank guarantee)',
      'Submit application via Kuwait Customs portal or in person',
      'Undergo compliance audit and facility inspection',
      'Receive Golden List certification (4-8 weeks)',
      'Update customs broker with new status codes',
      'Monitor compliance and maintain status'
    ],
    
    rootCauseId: 'rc-kw-customs-bottleneck',
    
    primaryBeneficiary: 'CONSIGNEE',
    requiredStakeholders: ['CONSIGNEE', 'CUSTOMS_BROKER', 'CUSTOMS_AUTHORITY'],
    
    status: 'FULLY_IMPLEMENTED',
    implementationDate: '2024-06-15',
    implementedBy: ['CONSIGNEE', 'CUSTOMS_BROKER'],
    implementationProgress: 100,
    
    requirements: [
      {
        id: 'req-gl-1',
        description: 'Consignee must have minimum 2 years clean customs history',
        responsibleParty: 'CONSIGNEE',
        effort: 'LOW',
        timeline: 'Pre-existing requirement',
        status: 'COMPLETED'
      },
      {
        id: 'req-gl-2',
        description: 'Submit Golden List application with supporting documents',
        responsibleParty: 'CONSIGNEE',
        effort: 'MEDIUM',
        timeline: '2-4 weeks',
        documentation: [
          'Commercial Registration (CR)',
          'Trade License',
          'Tax Clearance Certificate',
          'Bank Guarantee (KWD 50,000)',
          '2-year import history report',
          'Compliance declaration'
        ],
        status: 'COMPLETED'
      },
      {
        id: 'req-gl-3',
        description: 'Pass customs compliance audit and facility inspection',
        responsibleParty: 'CUSTOMS_AUTHORITY',
        effort: 'HIGH',
        timeline: '4-8 weeks',
        status: 'COMPLETED'
      }
    ],
    
    constraints: [
      {
        id: 'con-gl-1',
        description: 'Only applicable to importers with established Kuwait presence and trading history',
        type: 'REGULATORY',
        severity: 'BLOCKING',
        affectedParties: ['CONSIGNEE'],
        isActive: true
      },
      {
        id: 'con-gl-2',
        description: 'Bank guarantee of KWD 50,000 required',
        type: 'FINANCIAL',
        severity: 'MAJOR',
        mitigation: 'Can use insurance bond as alternative',
        affectedParties: ['CONSIGNEE'],
        isActive: true
      }
    ],
    
    benefits: [
      {
        id: 'ben-gl-1',
        description: 'Reduced clearance time at Nuwaiseeb BCP',
        category: 'TIME',
        quantifiedValue: 40,
        unit: 'hours reduction',
        confidence: 'MEASURED',
        beneficiaries: ['CONSIGNEE', 'CARRIER', 'SHIPPER'],
        measurementMethod: 'Average clearance time before/after enrollment'
      },
      {
        id: 'ben-gl-2',
        description: 'Lower physical inspection rate',
        category: 'RELIABILITY',
        quantifiedValue: 35,
        unit: 'percentage points reduction',
        confidence: 'MEASURED',
        beneficiaries: ['CONSIGNEE', 'SHIPPER']
      },
      {
        id: 'ben-gl-3',
        description: 'Reduced demurrage and detention costs',
        category: 'COST',
        quantifiedValue: 450,
        unit: 'USD per shipment',
        confidence: 'MEASURED',
        beneficiaries: ['CONSIGNEE', 'SHIPPER']
      }
    ],
    
    risks: [
      {
        id: 'risk-gl-1',
        description: 'Golden List status can be revoked for compliance violations',
        category: 'Compliance',
        probability: 'LOW',
        impact: 'HIGH',
        riskScore: 6,
        mitigation: 'Implement continuous compliance monitoring',
        owner: 'CONSIGNEE',
        status: 'MITIGATED'
      }
    ],
    
    metrics: {
      avgTimeReduction: 40,
      timeReductionPercentage: 72,
      timeReductionRange: { min: 35, max: 48 },
      avgCostSavingsPerShipment: 450,
      costReductionPercentage: 35,
      annualCostSavings: 70200,
      reliabilityImprovement: 25,
      predictabilityScore: 85,
      applicableShipmentsPerMonth: 13,
      adoptionRate: 100,
      implementationCost: 5000,
      recurringCost: 1000,
      paybackPeriodMonths: 0.5,
      threeYearROI: 4100,
      actualResults: {
        measurementPeriod: 'Jul-Nov 2024',
        measuredAt: '2024-11-30',
        timeReduction: 38.5,
        costSavings: 425,
        volumeProcessed: 65,
        satisfactionScore: 92
      }
    },
    
    kpis: [
      {
        id: 'kpi-gl-1',
        name: 'Average Clearance Time',
        description: 'Time from BCP arrival to release',
        targetValue: 15,
        currentValue: 16.93,
        unit: 'hours',
        trend: 'IMPROVING',
        lastUpdated: '2024-11-30'
      }
    ],
    
    references: [
      {
        id: 'ref-gl-1',
        title: 'Kuwait Customs Golden List Program',
        type: 'OFFICIAL_PORTAL',
        url: 'https://www.customs.gov.kw/en/services/golden-list',
        authority: 'Kuwait General Administration of Customs',
        dateAccessed: '2024-12-01',
        isVerified: true
      }
    ],
    
    applicableLanes: ['SA-KW-001'],
    applicableCountries: ['KW'],
    applicableCommodities: ['Chemicals', 'Industrial Products'],
    
    relatedSolutions: ['sol-kw-coa-consolidation'],
    prerequisiteSolutions: [],
    
    tags: ['trade-program', 'customs', 'trusted-trader', 'kuwait', 'golden-list'],
    
    createdAt: '2024-04-01',
    updatedAt: '2024-12-01',
    version: '2.1'
  },
  
  {
    id: 'sol-kw-coa-consolidation',
    code: 'SOL-KW-002',
    name: 'Certificate of Analysis (COA) Consolidation via Third-Party Certification',
    category: 'CERTIFICATE_OPTIMIZATION',
    priority: 'HIGH',
    
    summary: 'Group multiple trucks into single Bayan/shipment with one consolidated COA from TÜV, SGS, or equivalent certification body',
    
    detailedDescription: `Instead of issuing separate Bayan declarations and COA certificates for each truck, consolidate multiple trucks into a single shipment declaration with one comprehensive Certificate of Analysis issued by an internationally accredited certification body.

**Implementation Model:**
• Partner with accredited certification body (TÜV SÜD, SGS, Intertek, Bureau Veritas)
• Issue COA at shipment level covering multiple trucks (same product batch)
• Single Bayan declaration references all trucks in the consolidated shipment
• Customs processes as one declaration with breakdown to individual trucks

**Consolidation Ratios:**
• Current state: 1 truck = 1 Bayan = 1 COA
• Implemented: 3 trucks = 1 Bayan = 1 COA
• Target: 5 trucks = 1 Bayan = 1 COA (blocked by constraints)

**Cost Impact:**
• Individual COA: $150-175 per truck
• Consolidated COA: $250-300 for 3 trucks = $85-100 per truck
• Savings: ~40-45% reduction in certification costs

**Why We Can't Go Higher (5 trucks):**
• High rejection rate at loading (quality/safety) disrupts larger batches
• Shipper quality requirements mandate per-batch tracking
• Variable loading times make synchronization difficult
• Different customer orders requiring separate documentation`,

    implementationApproach: [
      'Engage accredited third-party certification body (TÜV, SGS)',
      'Confirm export country (Saudi) allows consolidated declarations via FASAH',
      'Confirm import country (Kuwait) accepts consolidated COA',
      'Define batch composition rules (same product, same production batch)',
      'Coordinate truck scheduling for synchronized departures',
      'Update customs broker with consolidated declaration procedures',
      'Implement batch tracking in TMS',
      'Monitor consolidation ratio and adjust based on constraints'
    ],
    
    rootCauseId: 'rc-cert-cost',
    
    primaryBeneficiary: 'SHIPPER',
    requiredStakeholders: ['SHIPPER', 'CERTIFICATION_BODY', 'CUSTOMS_BROKER', 'CARRIER'],
    
    status: 'PARTIALLY_IMPLEMENTED',
    implementationDate: '2024-08-20',
    implementedBy: ['SHIPPER', 'CERTIFICATION_BODY', 'CUSTOMS_BROKER'],
    implementationProgress: 60,
    
    requirements: [
      {
        id: 'req-coa-1',
        description: 'Engage accredited third-party certification body',
        responsibleParty: 'SHIPPER',
        effort: 'MEDIUM',
        timeline: '2-3 weeks',
        cost: { oneTime: 500, currency: 'USD' },
        status: 'COMPLETED'
      },
      {
        id: 'req-coa-2',
        description: 'Confirm FASAH allows consolidated Bayan declarations',
        responsibleParty: 'CUSTOMS_BROKER',
        effort: 'LOW',
        timeline: '1 week',
        status: 'COMPLETED'
      }
    ],
    
    constraints: [
      {
        id: 'con-coa-1',
        description: 'Cannot exceed 3 trucks per batch due to high loading rejection rate (15-20%)',
        type: 'OPERATIONAL',
        severity: 'MAJOR',
        mitigation: 'Pre-inspection protocol, buffer trucks in planning',
        workaround: 'Plan 4 trucks expecting 1 rejection to achieve 3-truck batch',
        affectedParties: ['CARRIER', 'SHIPPER'],
        isActive: true
      },
      {
        id: 'con-coa-2',
        description: 'All trucks in batch must carry same product from same production batch',
        type: 'TECHNICAL',
        severity: 'MAJOR',
        affectedParties: ['SHIPPER', 'CERTIFICATION_BODY'],
        isActive: true
      }
    ],
    
    benefits: [
      {
        id: 'ben-coa-1',
        description: 'Reduced COA certification costs',
        category: 'COST',
        quantifiedValue: 43,
        unit: '% cost reduction',
        confidence: 'MEASURED',
        beneficiaries: ['SHIPPER', 'CONSIGNEE']
      },
      {
        id: 'ben-coa-2',
        description: 'Faster customs declaration processing',
        category: 'TIME',
        quantifiedValue: 2,
        unit: 'hours saved per truck',
        confidence: 'MEASURED',
        beneficiaries: ['CARRIER', 'CONSIGNEE']
      }
    ],
    
    risks: [
      {
        id: 'risk-coa-1',
        description: 'Batch delay if one truck has issues (all trucks in batch affected)',
        category: 'Operational',
        probability: 'MEDIUM',
        impact: 'MEDIUM',
        riskScore: 9,
        mitigation: 'Pre-departure inspection, maintain buffer capacity',
        owner: 'CARRIER',
        status: 'MITIGATED'
      }
    ],
    
    metrics: {
      avgTimeReduction: 2,
      timeReductionPercentage: 4,
      timeReductionRange: { min: 1.5, max: 3 },
      avgCostSavingsPerShipment: 75,
      costReductionPercentage: 43,
      annualCostSavings: 9000,
      reliabilityImprovement: 10,
      applicableShipmentsPerMonth: 10,
      adoptionRate: 75,
      implementationCost: 500,
      paybackPeriodMonths: 0.5,
      threeYearROI: 5300,
      actualResults: {
        measurementPeriod: 'Sep-Nov 2024',
        measuredAt: '2024-11-30',
        timeReduction: 1.8,
        costSavings: 72,
        volumeProcessed: 28
      }
    },
    
    kpis: [
      {
        id: 'kpi-coa-1',
        name: 'Consolidation Ratio',
        description: 'Average trucks per consolidated Bayan',
        targetValue: 5,
        currentValue: 3,
        unit: 'trucks/Bayan',
        trend: 'STABLE',
        lastUpdated: '2024-11-30'
      }
    ],
    
    references: [
      {
        id: 'ref-coa-1',
        title: 'TÜV SÜD Chemical Testing & Certification',
        type: 'CERTIFICATION_BODY',
        url: 'https://www.tuvsud.com/en/services/testing/chemical-testing',
        authority: 'TÜV SÜD',
        isVerified: true
      },
      {
        id: 'ref-coa-2',
        title: 'FASAH Portal - Consolidated Declarations',
        type: 'OFFICIAL_PORTAL',
        url: 'https://www.fasah.sa/',
        authority: 'ZATCA',
        isVerified: true
      }
    ],
    
    applicableLanes: ['SA-KW-001'],
    applicableCountries: ['SA', 'KW'],
    applicableCommodities: ['Chemicals', 'Petrochemicals'],
    
    relatedSolutions: ['sol-kw-golden-list'],
    prerequisiteSolutions: [],
    
    tags: ['certificate', 'coa', 'consolidation', 'tuv', 'sgs', 'bayan', 'cost-reduction'],
    
    createdAt: '2024-07-15',
    updatedAt: '2024-12-01',
    version: '1.3'
  }
]

// ============================================================================
// CERTIFICATION BODIES
// ============================================================================

export const CERTIFICATION_BODIES: CertificationBody[] = [
  {
    id: 'tuv-sud',
    name: 'TÜV SÜD AG',
    shortName: 'TÜV SÜD',
    type: 'CERTIFICATION_BODY',
    accreditations: [
      { standard: 'ISO/IEC 17025', accreditationBody: 'DAkkS', validUntil: '2026-12-31' },
      { standard: 'ISO/IEC 17065', accreditationBody: 'DAkkS', validUntil: '2026-12-31' }
    ],
    services: [
      { name: 'Chemical Testing', description: 'Full chemical analysis and COA issuance', turnaroundTime: '3-5 business days' },
      { name: 'Product Certification', description: 'CE, GCC conformity marks', turnaroundTime: '2-4 weeks' }
    ],
    countries: ['SA', 'KW', 'AE', 'QA', 'BH', 'OM'],
    offices: [
      { country: 'SA', city: 'Riyadh', phone: '+966-11-XXX-XXXX', email: 'riyadh@tuvsud.com' },
      { country: 'AE', city: 'Dubai', phone: '+971-4-XXX-XXXX', email: 'dubai@tuvsud.com' }
    ],
    website: 'https://www.tuvsud.com',
    reliabilityScore: 95,
    responseTime: '24 hours'
  },
  {
    id: 'sgs',
    name: 'SGS SA',
    shortName: 'SGS',
    type: 'CERTIFICATION_BODY',
    accreditations: [
      { standard: 'ISO/IEC 17025', accreditationBody: 'SAS', validUntil: '2026-06-30' }
    ],
    services: [
      { name: 'Testing & Analysis', description: 'Comprehensive chemical and material testing', turnaroundTime: '2-5 business days' }
    ],
    countries: ['SA', 'KW', 'AE', 'QA', 'BH', 'OM'],
    offices: [
      { country: 'SA', city: 'Dammam', phone: '+966-13-XXX-XXXX', email: 'dammam@sgs.com' },
      { country: 'KW', city: 'Kuwait City', phone: '+965-XXXX-XXXX', email: 'kuwait@sgs.com' }
    ],
    website: 'https://www.sgs.com',
    reliabilityScore: 94,
    responseTime: '12 hours'
  },
  {
    id: 'intertek',
    name: 'Intertek Group plc',
    shortName: 'Intertek',
    type: 'CERTIFICATION_BODY',
    accreditations: [
      { standard: 'ISO/IEC 17025', accreditationBody: 'UKAS', validUntil: '2025-12-31' }
    ],
    services: [
      { name: 'Total Quality Assurance', description: 'End-to-end quality testing and certification', turnaroundTime: '3-5 business days' }
    ],
    countries: ['SA', 'KW', 'AE', 'QA', 'BH', 'OM'],
    offices: [
      { country: 'SA', city: 'Dammam', phone: '+966-13-XXX-XXXX' },
      { country: 'AE', city: 'Dubai', phone: '+971-4-XXX-XXXX', email: 'dubai@intertek.com' }
    ],
    website: 'https://www.intertek.com',
    reliabilityScore: 92,
    responseTime: '24 hours'
  }
]

// ============================================================================
// LANE BENCHMARKS
// ============================================================================

export const SA_KW_BENCHMARKS: LaneBenchmark[] = [
  {
    id: 'bench-kw-clearance',
    laneCode: 'SA-KW-001',
    category: 'Customs Clearance',
    metric: 'Import Clearance Time',
    currentValue: 16.93,
    previousValue: 55.43,
    industryAverage: 24,
    bestInClass: 8,
    targetValue: 12,
    unit: 'hours',
    lowerIsBetter: true,
    trend: 'IMPROVING',
    trendPercentage: -69,
    trendPeriod: 'vs. pre-optimization',
    percentileRank: 25,
    measurementPeriod: 'Q4 2024',
    lastUpdated: '2024-12-01',
    dataSource: 'Internal TMS Data'
  },
  {
    id: 'bench-kw-cert-cost',
    laneCode: 'SA-KW-001',
    category: 'Cost Efficiency',
    metric: 'Certification Cost per Truck',
    currentValue: 85,
    previousValue: 175,
    industryAverage: 120,
    bestInClass: 45,
    targetValue: 50,
    unit: 'USD',
    lowerIsBetter: true,
    trend: 'IMPROVING',
    trendPercentage: -51,
    trendPeriod: 'vs. pre-consolidation',
    percentileRank: 35,
    measurementPeriod: 'Q4 2024',
    lastUpdated: '2024-12-01',
    dataSource: 'Finance Records'
  },
  {
    id: 'bench-kw-otd',
    laneCode: 'SA-KW-001',
    category: 'Reliability',
    metric: 'On-Time Delivery Rate',
    currentValue: 78,
    previousValue: 52,
    industryAverage: 85,
    bestInClass: 95,
    targetValue: 90,
    unit: '%',
    lowerIsBetter: false,
    trend: 'IMPROVING',
    trendPercentage: 50,
    trendPeriod: 'vs. 6 months ago',
    percentileRank: 40,
    measurementPeriod: 'Q4 2024',
    lastUpdated: '2024-12-01',
    dataSource: 'Delivery Reports'
  }
]

// ============================================================================
// INSIGHT TOGGLE DEFINITIONS
// ============================================================================

export const INSIGHT_TOGGLES: InsightToggle[] = [
  {
    id: 'time-savings',
    name: 'Time Savings',
    icon: 'ri-time-line',
    colorClass: 'cyan',
    description: 'Hours saved at each touchpoint through optimization',
    isActive: false,
    dataType: 'TIME'
  },
  {
    id: 'cost-savings',
    name: 'Cost Impact',
    icon: 'ri-money-dollar-circle-line',
    colorClass: 'emerald',
    description: 'USD saved per shipment through solutions',
    isActive: false,
    dataType: 'COST'
  },
  {
    id: 'reliability',
    name: 'Reliability',
    icon: 'ri-shield-check-line',
    colorClass: 'purple',
    description: 'Predictability and consistency improvements',
    isActive: false,
    dataType: 'RELIABILITY'
  },
  {
    id: 'co2-impact',
    name: 'CO₂ Impact',
    icon: 'ri-leaf-line',
    colorClass: 'green',
    description: 'Emission reductions from efficiency gains',
    isActive: false,
    dataType: 'CO2'
  }
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getSolutionsByLane(laneCode: string): LaneSolution[] {
  return SA_KW_SOLUTIONS.filter(s => s.applicableLanes.includes(laneCode))
}

export function getSolutionsByCategory(category: SolutionCategory): LaneSolution[] {
  return SA_KW_SOLUTIONS.filter(s => s.category === category)
}

export function getSolutionsByStatus(status: ImplementationStatus): LaneSolution[] {
  return SA_KW_SOLUTIONS.filter(s => s.status === status)
}

export function getBenchmarksByLane(laneCode: string): LaneBenchmark[] {
  return SA_KW_BENCHMARKS.filter(b => b.laneCode === laneCode)
}

export function getCertificationBodyById(id: string): CertificationBody | undefined {
  return CERTIFICATION_BODIES.find(cb => cb.id === id)
}

export function calculateTotalSavings(solutions: LaneSolution[]): {
  totalTimeSaved: number
  totalCostSaved: number
  totalReliabilityGain: number
} {
  return solutions.reduce((acc, sol) => ({
    totalTimeSaved: acc.totalTimeSaved + (sol.metrics.avgTimeReduction || 0),
    totalCostSaved: acc.totalCostSaved + (sol.metrics.avgCostSavingsPerShipment || 0),
    totalReliabilityGain: acc.totalReliabilityGain + (sol.metrics.reliabilityImprovement || 0)
  }), { totalTimeSaved: 0, totalCostSaved: 0, totalReliabilityGain: 0 })
}

export function calculateROI(input: ROICalculatorInput): ROICalculatorOutput {
  const implementedSolutions = SA_KW_SOLUTIONS.filter(s => 
    s.status === 'FULLY_IMPLEMENTED' || s.status === 'PARTIALLY_IMPLEMENTED'
  )
  
  const totalTimeSaved = implementedSolutions.reduce((sum, s) => sum + s.metrics.avgTimeReduction, 0)
  const totalCostSavedPerShipment = implementedSolutions.reduce((sum, s) => sum + s.metrics.avgCostSavingsPerShipment, 0)
  
  const monthlyShipments = input.shipmentsPerMonth
  const annualShipments = monthlyShipments * 12
  
  const demurrageSavings = totalTimeSaved * input.demurrageRatePerHour * monthlyShipments
  const certificationSavings = (input.currentCertCostPerTruck - 85) * monthlyShipments
  const truckUtilizationSavings = totalTimeSaved * input.truckCostPerHour * monthlyShipments / 24
  
  const totalMonthlySavings = demurrageSavings + certificationSavings + truckUtilizationSavings
  const totalAnnualSavings = totalMonthlySavings * 12
  
  const implementationCost = implementedSolutions.reduce((sum, s) => sum + s.metrics.implementationCost, 0)
  const paybackPeriodMonths = implementationCost / totalMonthlySavings
  
  return {
    totalHoursSavedPerMonth: totalTimeSaved * monthlyShipments,
    annualHoursSaved: totalTimeSaved * annualShipments,
    certificationSavings,
    demurrageSavings,
    truckUtilizationSavings,
    totalMonthlySavings,
    totalAnnualSavings,
    implementationCost,
    paybackPeriodMonths,
    firstYearROI: ((totalAnnualSavings - implementationCost) / implementationCost) * 100,
    threeYearROI: ((totalAnnualSavings * 3 - implementationCost) / implementationCost) * 100,
    throughputIncrease: (totalTimeSaved / input.currentClearanceTime) * 100,
    reliabilityImprovement: 25
  }
}
