/**
 * Feature Playbook Types
 * ========================
 * Comprehensive, deeply-layered type definitions for the Feature Playbook system.
 * This serves as the master reference for development, sales, and strategic planning.
 * 
 * Covers: Compliance, Governance, Regulations, Authorities, Trends, Vision,
 * Technical Architecture, Sales, Implementation, and more.
 */

// =============================================================================
// CORE ENUMS & BASE TYPES
// =============================================================================

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ImplementationStatus = 'production' | 'beta' | 'development' | 'planned' | 'research';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal';
export type MaturityLevel = 'emerging' | 'growing' | 'mature' | 'declining';
export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'highly-complex';

export type IndustrialRevolution = '3IR' | '4IR' | '5IR' | '6IR-Ready';
export type Region = 'global' | 'north-america' | 'europe' | 'middle-east' | 'asia-pacific' | 'africa' | 'latam' | 'gcc' | 'uk' | 'eu' | 'us' | 'china' | 'india' | 'saudi-arabia' | 'uae';

// =============================================================================
// 1. COMPLIANCE & GOVERNANCE LAYER
// =============================================================================

export interface ComplianceStandard {
  /** Standard code (e.g., "ISO 27001", "SOC2 Type II") */
  code: string;
  /** Full name of the standard */
  name: string;
  /** Category of standard */
  category: 'security' | 'quality' | 'environmental' | 'safety' | 'data-privacy' | 'industry-specific' | 'financial' | 'operational';
  /** Brief description */
  description: string;
  /** Is this standard mandatory or recommended? */
  requirement: 'mandatory' | 'recommended' | 'optional' | 'best-practice';
  /** Certification body or authority */
  certificationBody?: string;
  /** Regions where this standard applies */
  regions: Region[];
  /** Link to official documentation */
  officialUrl?: string;
  /** How this feature helps achieve compliance */
  complianceContribution: string;
  /** Specific clauses or controls addressed */
  clausesAddressed?: string[];
}

export interface GovernanceFramework {
  /** Framework name */
  name: string;
  /** Type of governance */
  type: 'corporate' | 'it' | 'data' | 'risk' | 'security' | 'operational' | 'environmental';
  /** Description */
  description: string;
  /** Key principles */
  principles: string[];
  /** How this feature supports governance */
  featureContribution: string;
  /** Maturity model level (if applicable) */
  maturityLevel?: 1 | 2 | 3 | 4 | 5;
}

export interface AuditRequirement {
  /** Audit type */
  type: 'internal' | 'external' | 'regulatory' | 'certification' | 'customer';
  /** Frequency */
  frequency: 'continuous' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'on-demand';
  /** Audit scope description */
  scope: string;
  /** Evidence/documentation required */
  evidenceRequired: string[];
  /** Audit trail capabilities needed */
  auditTrailNeeds: string[];
}

export interface ComplianceLayer {
  /** Industry standards (ISO, NIST, etc.) */
  standards: ComplianceStandard[];
  /** Governance frameworks */
  governanceFrameworks: GovernanceFramework[];
  /** Audit requirements */
  auditRequirements: AuditRequirement[];
  /** Compliance score impact (0-100) */
  complianceScoreImpact: number;
  /** Risk reduction percentage */
  riskReductionPercentage: number;
  /** Certification readiness */
  certificationReadiness: {
    certification: string;
    readinessPercentage: number;
    gapsToAddress: string[];
  }[];
}

// =============================================================================
// 2. REGULATORY & LEGAL LAYER
// =============================================================================

export interface RegulatoryBody {
  /** Short code (e.g., "FDA", "EPA") */
  code: string;
  /** Full name */
  name: string;
  /** Country/region */
  jurisdiction: Region;
  /** Type of regulatory body */
  type: 'government' | 'industry' | 'international' | 'self-regulatory';
  /** Website */
  website?: string;
  /** Key regulations they enforce */
  keyRegulations: string[];
  /** How this feature helps with compliance */
  complianceSupport: string;
}

export interface Law {
  /** Law/Act name */
  name: string;
  /** Short code or abbreviation */
  code?: string;
  /** Jurisdiction */
  jurisdiction: Region;
  /** Year enacted */
  yearEnacted: number;
  /** Last amendment year */
  lastAmended?: number;
  /** Category */
  category: 'environmental' | 'safety' | 'data-privacy' | 'trade' | 'labor' | 'chemical' | 'transportation' | 'customs' | 'tax' | 'consumer-protection' | 'anti-corruption' | 'sanctions';
  /** Key provisions */
  keyProvisions: string[];
  /** Penalties for non-compliance */
  penalties: string;
  /** How this feature helps compliance */
  featureContribution: string;
}

export interface Regulation {
  /** Regulation name */
  name: string;
  /** Regulation code/number */
  code: string;
  /** Issuing authority */
  authority: string;
  /** Type */
  type: 'primary' | 'secondary' | 'guideline' | 'directive' | 'standard';
  /** Effective date */
  effectiveDate: string;
  /** Summary */
  summary: string;
  /** Requirements */
  requirements: string[];
  /** Documentation needed */
  documentationRequired: string[];
  /** Reporting obligations */
  reportingObligations: string[];
  /** How feature addresses this */
  featureCompliance: string;
}

export interface TradeCompliance {
  /** Type of trade compliance */
  type: 'export-control' | 'import-control' | 'sanctions' | 'customs' | 'tariff' | 'origin' | 'dual-use';
  /** Regime or program */
  regime: string;
  /** Countries/regions affected */
  affectedRegions: Region[];
  /** Key requirements */
  requirements: string[];
  /** Screening needs */
  screeningRequirements: string[];
  /** License requirements */
  licenseTypes?: string[];
  /** How feature supports */
  featureSupport: string;
}

export interface RegulatoryLayer {
  /** Regulatory bodies */
  regulatoryBodies: RegulatoryBody[];
  /** Applicable laws */
  laws: Law[];
  /** Applicable regulations */
  regulations: Regulation[];
  /** Trade compliance requirements */
  tradeCompliance: TradeCompliance[];
  /** Upcoming regulatory changes */
  upcomingChanges: {
    regulation: string;
    expectedDate: string;
    impact: 'high' | 'medium' | 'low';
    preparationNeeded: string;
  }[];
  /** Jurisdictional coverage */
  jurisdictionalCoverage: Region[];
}

// =============================================================================
// 3. INDUSTRY STANDARDS & AUTHORITIES LAYER
// =============================================================================

export interface IndustryStandard {
  /** Standard code */
  code: string;
  /** Standard name */
  name: string;
  /** Issuing organization */
  organization: string;
  /** Standard category */
  category: 'data-exchange' | 'communication' | 'identification' | 'process' | 'quality' | 'safety' | 'environmental' | 'interoperability';
  /** Version */
  version: string;
  /** Description */
  description: string;
  /** Key specifications */
  specifications: string[];
  /** Implementation requirements */
  implementationRequirements: string[];
  /** How feature implements/supports */
  featureImplementation: string;
}

export interface IndustryAuthority {
  /** Authority name */
  name: string;
  /** Type */
  type: 'standards-body' | 'trade-association' | 'consortium' | 'certification-body' | 'research-institute';
  /** Focus area */
  focusArea: string;
  /** Key standards/programs */
  keyStandards: string[];
  /** Membership type */
  membershipType?: 'member' | 'certified' | 'partner' | 'observer';
  /** How feature aligns */
  featureAlignment: string;
}

export interface IndustryBestPractice {
  /** Practice name */
  name: string;
  /** Category */
  category: string;
  /** Description */
  description: string;
  /** Key principles */
  principles: string[];
  /** Implementation guidance */
  implementationGuidance: string;
  /** Maturity indicators */
  maturityIndicators: string[];
  /** How feature implements */
  featureImplementation: string;
}

export interface IndustryLayer {
  /** Industry standards */
  standards: IndustryStandard[];
  /** Industry authorities */
  authorities: IndustryAuthority[];
  /** Best practices */
  bestPractices: IndustryBestPractice[];
  /** Industry verticals served */
  verticalsServed: string[];
  /** Industry-specific requirements */
  industryRequirements: {
    industry: string;
    requirements: string[];
    featureSupport: string;
  }[];
}

// =============================================================================
// 4. VISION & STRATEGIC ALIGNMENT LAYER
// =============================================================================

export interface IndustrialRevolutionAlignment {
  /** Which industrial revolution */
  revolution: IndustrialRevolution;
  /** Alignment score (0-100) */
  alignmentScore: number;
  /** Key pillars addressed */
  pillarsAddressed: string[];
  /** Technologies leveraged */
  technologiesLeveraged: string[];
  /** Capabilities enabled */
  capabilitiesEnabled: string[];
  /** Human-centric aspects (especially for 5IR) */
  humanCentricAspects?: string[];
  /** Sustainability contributions (5IR) */
  sustainabilityContributions?: string[];
}

export interface PlatformVisionAlignment {
  /** BlueDXP strategic pillar */
  strategicPillar: 'intelligence' | 'automation' | 'integration' | 'compliance' | 'sustainability' | 'collaboration' | 'analytics' | 'security';
  /** Alignment strength */
  alignmentStrength: 'core' | 'supporting' | 'enabling' | 'complementary';
  /** How it supports platform vision */
  visionContribution: string;
  /** Cross-module synergies */
  crossModuleSynergies: string[];
  /** Ecosystem value */
  ecosystemValue: string;
}

export interface BusinessValueProposition {
  /** Value category */
  category: 'cost-reduction' | 'revenue-increase' | 'risk-mitigation' | 'efficiency' | 'compliance' | 'competitive-advantage' | 'customer-experience' | 'sustainability';
  /** Value statement */
  statement: string;
  /** Quantified benefit (if measurable) */
  quantifiedBenefit?: string;
  /** ROI timeframe */
  roiTimeframe?: string;
  /** Evidence/proof points */
  proofPoints: string[];
}

export interface StrategicLayer {
  /** Industrial revolution alignment */
  industrialAlignment: IndustrialRevolutionAlignment[];
  /** Platform vision alignment */
  platformAlignment: PlatformVisionAlignment[];
  /** Business value propositions */
  valuePropositions: BusinessValueProposition[];
  /** Strategic importance (1-10) */
  strategicImportance: number;
  /** Market differentiation */
  marketDifferentiation: string[];
  /** Competitive moat */
  competitiveMoat: string[];
  /** Long-term roadmap position */
  roadmapPosition: 'foundational' | 'growth' | 'innovation' | 'optimization';
}

// =============================================================================
// 5. MARKET TRENDS & INTELLIGENCE LAYER
// =============================================================================

export interface MarketTrend {
  /** Trend name */
  name: string;
  /** Category */
  category: 'technology' | 'regulatory' | 'business' | 'social' | 'environmental' | 'economic' | 'geopolitical';
  /** Maturity */
  maturity: MaturityLevel;
  /** Impact level */
  impact: 'transformational' | 'significant' | 'moderate' | 'incremental';
  /** Time horizon */
  timeHorizon: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  /** Description */
  description: string;
  /** How feature addresses trend */
  featureResponse: string;
  /** Market drivers */
  marketDrivers: string[];
  /** Key statistics */
  statistics?: string[];
}

export interface CompetitiveLandscape {
  /** Competitor type */
  competitorType: 'direct' | 'indirect' | 'potential' | 'substitute';
  /** Key competitors */
  keyCompetitors: string[];
  /** Our differentiators */
  ourDifferentiators: string[];
  /** Competitive advantages */
  competitiveAdvantages: string[];
  /** Areas for improvement */
  areasForImprovement: string[];
  /** Market positioning */
  marketPositioning: string;
}

export interface TechnologyTrend {
  /** Technology name */
  name: string;
  /** Category */
  category: 'ai-ml' | 'iot' | 'blockchain' | 'cloud' | 'edge' | 'automation' | 'analytics' | 'security' | 'integration';
  /** Adoption stage */
  adoptionStage: 'innovators' | 'early-adopters' | 'early-majority' | 'late-majority' | 'laggards';
  /** Relevance to feature */
  relevance: 'core' | 'enabling' | 'complementary' | 'future';
  /** Description */
  description: string;
  /** How feature leverages */
  featureLeverage: string;
}

export interface MarketLayer {
  /** Market trends */
  trends: MarketTrend[];
  /** Technology trends */
  technologyTrends: TechnologyTrend[];
  /** Competitive landscape */
  competitiveLandscape: CompetitiveLandscape;
  /** Market size & opportunity */
  marketOpportunity: {
    totalAddressableMarket?: string;
    serviceableMarket?: string;
    growthRate?: string;
    keySegments: string[];
  };
  /** Target industries */
  targetIndustries: string[];
  /** Geographic opportunities */
  geographicOpportunities: Region[];
}

// =============================================================================
// 6. TECHNICAL ARCHITECTURE LAYER
// =============================================================================

export interface ArchitecturePattern {
  /** Pattern name */
  name: string;
  /** Pattern type */
  type: 'architectural' | 'design' | 'integration' | 'data' | 'security' | 'deployment';
  /** Description */
  description: string;
  /** When to use */
  whenToUse: string;
  /** Benefits */
  benefits: string[];
  /** Trade-offs */
  tradeoffs: string[];
  /** Implementation details */
  implementationDetails: string;
}

export interface TechnologyStack {
  /** Category */
  category: 'frontend' | 'backend' | 'database' | 'messaging' | 'caching' | 'search' | 'ai-ml' | 'monitoring' | 'security' | 'infrastructure';
  /** Technologies */
  technologies: {
    name: string;
    version?: string;
    purpose: string;
    required: boolean;
  }[];
}

export interface SecurityRequirement {
  /** Security domain */
  domain: 'authentication' | 'authorization' | 'encryption' | 'audit' | 'network' | 'data' | 'application' | 'infrastructure';
  /** Requirement */
  requirement: string;
  /** Criticality */
  criticality: RiskLevel;
  /** Implementation approach */
  implementation: string;
  /** Compliance standards addressed */
  standardsAddressed: string[];
}

export interface PerformanceRequirement {
  /** Metric type */
  metricType: 'latency' | 'throughput' | 'availability' | 'scalability' | 'reliability';
  /** Target value */
  targetValue: string;
  /** Measurement method */
  measurementMethod: string;
  /** SLA tier */
  slaTier: 'platinum' | 'gold' | 'silver' | 'bronze';
}

export interface IntegrationPattern {
  /** Pattern type */
  type: 'api' | 'event-driven' | 'batch' | 'real-time' | 'file-based' | 'database';
  /** Protocol */
  protocol: string;
  /** Format */
  dataFormat: string;
  /** Description */
  description: string;
  /** Use cases */
  useCases: string[];
}

export interface TechnicalLayer {
  /** Architecture patterns used */
  architecturePatterns: ArchitecturePattern[];
  /** Technology stack */
  technologyStack: TechnologyStack[];
  /** Security requirements */
  securityRequirements: SecurityRequirement[];
  /** Performance requirements */
  performanceRequirements: PerformanceRequirement[];
  /** Integration patterns */
  integrationPatterns: IntegrationPattern[];
  /** Scalability approach */
  scalabilityApproach: string;
  /** High availability design */
  highAvailability: string;
  /** Disaster recovery */
  disasterRecovery: string;
  /** Data architecture */
  dataArchitecture: string;
}

// =============================================================================
// 7. SALES & BUSINESS LAYER
// =============================================================================

export interface TargetPersona {
  /** Persona name */
  name: string;
  /** Job titles */
  jobTitles: string[];
  /** Department */
  department: string;
  /** Seniority */
  seniority: 'c-level' | 'vp' | 'director' | 'manager' | 'specialist' | 'analyst';
  /** Key responsibilities */
  responsibilities: string[];
  /** Pain points */
  painPoints: string[];
  /** Goals */
  goals: string[];
  /** Objections */
  commonObjections: string[];
  /** Messaging */
  keyMessaging: string[];
  /** Decision role */
  decisionRole: 'decision-maker' | 'influencer' | 'user' | 'gatekeeper' | 'champion';
}

export interface UseCase {
  /** Use case name */
  name: string;
  /** Industry */
  industry?: string;
  /** Scenario description */
  scenario: string;
  /** Problem addressed */
  problemAddressed: string;
  /** Solution provided */
  solution: string;
  /** Benefits achieved */
  benefits: string[];
  /** ROI metrics */
  roiMetrics?: string[];
  /** Customer quote (if available) */
  customerQuote?: string;
}

export interface PricingConsideration {
  /** Pricing model */
  model: 'per-user' | 'per-device' | 'per-transaction' | 'tiered' | 'usage-based' | 'flat-rate' | 'custom';
  /** Value drivers */
  valueDrivers: string[];
  /** Cost factors */
  costFactors: string[];
  /** Competitive positioning */
  competitivePositioning: string;
  /** Upsell opportunities */
  upsellOpportunities: string[];
}

export interface SalesLayer {
  /** Target personas */
  targetPersonas: TargetPersona[];
  /** Use cases */
  useCases: UseCase[];
  /** Key selling points */
  keySellingPoints: string[];
  /** Competitive advantages */
  competitiveAdvantages: string[];
  /** Objection handling */
  objectionHandling: {
    objection: string;
    response: string;
  }[];
  /** Pricing considerations */
  pricingConsiderations: PricingConsideration;
  /** Demo scenarios */
  demoScenarios: string[];
  /** Proof points */
  proofPoints: string[];
  /** Sales enablement materials */
  salesMaterials: string[];
}

// =============================================================================
// 8. IMPLEMENTATION & OPERATIONS LAYER
// =============================================================================

export interface ImplementationPhase {
  /** Phase name */
  name: string;
  /** Phase number */
  phase: number;
  /** Duration */
  duration: string;
  /** Key activities */
  activities: string[];
  /** Deliverables */
  deliverables: string[];
  /** Success criteria */
  successCriteria: string[];
  /** Dependencies */
  dependencies: string[];
  /** Risks */
  risks: string[];
}

export interface Prerequisite {
  /** Category */
  category: 'technical' | 'organizational' | 'data' | 'process' | 'training' | 'licensing';
  /** Requirement */
  requirement: string;
  /** Criticality */
  criticality: 'blocking' | 'important' | 'nice-to-have';
  /** How to validate */
  validationMethod: string;
}

export interface BestPractice {
  /** Category */
  category: 'configuration' | 'security' | 'performance' | 'maintenance' | 'governance' | 'adoption';
  /** Practice */
  practice: string;
  /** Rationale */
  rationale: string;
  /** Implementation guidance */
  guidance: string;
}

export interface CommonPitfall {
  /** Pitfall description */
  pitfall: string;
  /** Impact */
  impact: string;
  /** How to avoid */
  avoidance: string;
  /** Recovery if encountered */
  recovery: string;
}

export interface ImplementationLayer {
  /** Implementation phases */
  phases: ImplementationPhase[];
  /** Prerequisites */
  prerequisites: Prerequisite[];
  /** Best practices */
  bestPractices: BestPractice[];
  /** Common pitfalls */
  commonPitfalls: CommonPitfall[];
  /** Resource requirements */
  resourceRequirements: {
    role: string;
    effort: string;
    skills: string[];
  }[];
  /** Training requirements */
  trainingRequirements: string[];
  /** Change management */
  changeManagement: string[];
  /** Success metrics */
  successMetrics: string[];
}

// =============================================================================
// 9. SUSTAINABILITY & ESG LAYER
// =============================================================================

export interface EnvironmentalImpact {
  /** Impact category */
  category: 'carbon' | 'energy' | 'waste' | 'water' | 'emissions' | 'resources';
  /** Impact type */
  type: 'reduction' | 'optimization' | 'monitoring' | 'reporting';
  /** Description */
  description: string;
  /** Metrics */
  metrics: string[];
  /** Contribution to sustainability goals */
  goalContribution: string;
}

export interface ESGAlignment {
  /** ESG pillar */
  pillar: 'environmental' | 'social' | 'governance';
  /** Specific aspect */
  aspect: string;
  /** How feature contributes */
  contribution: string;
  /** Reporting frameworks supported */
  reportingFrameworks: string[];
  /** SDG alignment (UN Sustainable Development Goals) */
  sdgAlignment?: number[];
}

export interface SustainabilityLayer {
  /** Environmental impacts */
  environmentalImpacts: EnvironmentalImpact[];
  /** ESG alignment */
  esgAlignment: ESGAlignment[];
  /** Carbon footprint considerations */
  carbonFootprint: {
    directImpact: string;
    indirectBenefits: string[];
    offsetOpportunities: string[];
  };
  /** Circular economy contribution */
  circularEconomy: string[];
  /** Sustainability certifications supported */
  certifications: string[];
}

// =============================================================================
// 10. DOCUMENTATION & SUPPORT LAYER
// =============================================================================

export interface DocumentationType {
  /** Document type */
  type: 'user-guide' | 'admin-guide' | 'api-docs' | 'integration-guide' | 'training' | 'compliance' | 'faq' | 'troubleshooting';
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Target audience */
  targetAudience: string[];
  /** Status */
  status: 'available' | 'in-progress' | 'planned';
  /** Location/path */
  path?: string;
}

export interface SupportRequirement {
  /** Support tier */
  tier: 'self-service' | 'standard' | 'premium' | 'enterprise';
  /** Channels */
  channels: string[];
  /** Response times */
  responseTimes: {
    priority: string;
    responseTime: string;
    resolutionTime: string;
  }[];
  /** Escalation path */
  escalationPath: string[];
}

export interface DocumentationLayer {
  /** Documentation types */
  documentation: DocumentationType[];
  /** Support requirements */
  supportRequirements: SupportRequirement;
  /** Training programs */
  trainingPrograms: {
    name: string;
    type: 'self-paced' | 'instructor-led' | 'certification';
    duration: string;
    targetAudience: string;
  }[];
  /** Knowledge base articles */
  knowledgeBaseTopics: string[];
  /** Video tutorials */
  videoTutorials: string[];
}

// =============================================================================
// MASTER FEATURE PLAYBOOK TYPE
// =============================================================================

export interface FeaturePlaybook {
  // ===== CORE IDENTIFICATION =====
  /** Unique feature ID */
  id: string;
  /** Feature name */
  name: string;
  /** Feature description */
  description: string;
  /** Feature category */
  category: string;
  /** Module(s) this belongs to */
  modules: string[];
  
  // ===== STATUS & PRIORITY =====
  /** Implementation status */
  status: ImplementationStatus;
  /** Priority level */
  priority: PriorityLevel;
  /** Implementation phase */
  phase: number;
  /** Estimated implementation time */
  estimatedTime: string;
  /** Complexity level */
  complexity: ComplexityLevel;
  
  // ===== KEY CAPABILITIES =====
  /** Core capabilities */
  capabilities: string[];
  /** Key features */
  keyFeatures: string[];
  /** Benefits */
  benefits: string[];
  
  // ===== DEEP LAYERS =====
  /** 1. Compliance & Governance */
  compliance: ComplianceLayer;
  /** 2. Regulatory & Legal */
  regulatory: RegulatoryLayer;
  /** 3. Industry Standards & Authorities */
  industry: IndustryLayer;
  /** 4. Vision & Strategic Alignment */
  strategic: StrategicLayer;
  /** 5. Market Trends & Intelligence */
  market: MarketLayer;
  /** 6. Technical Architecture */
  technical: TechnicalLayer;
  /** 7. Sales & Business */
  sales: SalesLayer;
  /** 8. Implementation & Operations */
  implementation: ImplementationLayer;
  /** 9. Sustainability & ESG */
  sustainability: SustainabilityLayer;
  /** 10. Documentation & Support */
  documentation: DocumentationLayer;
  
  // ===== DEPENDENCIES & INTEGRATIONS =====
  /** Module dependencies */
  moduleDependencies: string[];
  /** Service dependencies */
  serviceDependencies: string[];
  /** External integrations */
  externalIntegrations: string[];
  /** API dependencies */
  apiDependencies: string[];
  
  // ===== METADATA =====
  /** Last updated */
  lastUpdated: string;
  /** Owner */
  owner: string;
  /** Contributors */
  contributors: string[];
  /** Version */
  version: string;
  /** Tags for searchability */
  tags: string[];
}

// =============================================================================
// HELPER TYPES FOR UI
// =============================================================================

export interface PlaybookSection {
  id: string;
  name: string;
  icon: string;
  description: string;
  subsections: {
    id: string;
    name: string;
    count?: number;
  }[];
}

export interface PlaybookFilter {
  category?: string;
  status?: ImplementationStatus;
  priority?: PriorityLevel;
  phase?: number;
  module?: string;
  region?: Region;
  industry?: string;
  tags?: string[];
}

export interface PlaybookSummary {
  totalFeatures: number;
  byStatus: Record<ImplementationStatus, number>;
  byPriority: Record<PriorityLevel, number>;
  byPhase: Record<number, number>;
  complianceScore: number;
  strategicAlignment: number;
  implementationProgress: number;
}

