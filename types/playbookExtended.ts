/**
 * Extended Playbook Types - Deep Layers
 * ======================================
 * Additional deeply-layered type definitions for maximum coverage.
 * These extend the base FeaturePlaybook with specialized layers.
 */

// =============================================================================
// 11. DATA PRIVACY & PROTECTION LAYER
// =============================================================================

export interface DataClassification {
  /** Classification level */
  level: 'public' | 'internal' | 'confidential' | 'restricted' | 'top-secret';
  /** Data types handled */
  dataTypes: string[];
  /** Retention period */
  retentionPeriod: string;
  /** Disposal method */
  disposalMethod: string;
  /** Encryption requirements */
  encryptionRequired: boolean;
  /** Access restrictions */
  accessRestrictions: string[];
}

export interface PrivacyRight {
  /** Right name */
  name: string;
  /** Legal basis */
  legalBasis: string[];
  /** How feature supports */
  featureSupport: string;
  /** Automation level */
  automationLevel: 'full' | 'partial' | 'manual';
  /** Response SLA */
  responseSLA: string;
}

export interface DataTransfer {
  /** Transfer type */
  type: 'domestic' | 'cross-border' | 'third-party' | 'cloud';
  /** Legal mechanism */
  legalMechanism: string;
  /** Safeguards */
  safeguards: string[];
  /** Countries/regions involved */
  regions: string[];
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface PrivacyLayer {
  /** Data classifications */
  dataClassifications: DataClassification[];
  /** Privacy rights supported */
  privacyRights: PrivacyRight[];
  /** Data transfers */
  dataTransfers: DataTransfer[];
  /** Privacy by design principles */
  privacyByDesign: string[];
  /** Data minimization approach */
  dataMinimization: string;
  /** Consent management */
  consentManagement: {
    required: boolean;
    mechanisms: string[];
    granularity: string;
    withdrawal: string;
  };
  /** Privacy impact assessment */
  piaRequired: boolean;
  piaFindings?: string[];
  /** Data Protection Officer requirements */
  dpoRequired: boolean;
}

// =============================================================================
// 12. AI ETHICS & RESPONSIBLE AI LAYER
// =============================================================================

export interface AIEthicsPrinciple {
  /** Principle name */
  name: string;
  /** Description */
  description: string;
  /** Implementation approach */
  implementation: string;
  /** Measurement method */
  measurement: string;
  /** Compliance level */
  complianceLevel: 'full' | 'partial' | 'planned';
}

export interface BiasAssessment {
  /** Bias type */
  type: 'data' | 'algorithmic' | 'interaction' | 'emergent';
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high';
  /** Mitigation measures */
  mitigations: string[];
  /** Monitoring approach */
  monitoring: string;
}

export interface ExplainabilityFeature {
  /** Feature type */
  type: 'local' | 'global' | 'counterfactual' | 'feature-importance';
  /** Implementation */
  implementation: string;
  /** User-facing explanation */
  userExplanation: string;
  /** Audit capability */
  auditCapability: string;
}

export interface AIEthicsLayer {
  /** Ethical principles */
  principles: AIEthicsPrinciple[];
  /** Bias assessments */
  biasAssessments: BiasAssessment[];
  /** Explainability features */
  explainability: ExplainabilityFeature[];
  /** Human oversight */
  humanOversight: {
    required: boolean;
    level: 'human-in-the-loop' | 'human-on-the-loop' | 'human-in-command';
    escalationCriteria: string[];
  };
  /** AI risk classification (EU AI Act) */
  euAIActClassification: 'minimal' | 'limited' | 'high' | 'unacceptable';
  /** Transparency requirements */
  transparencyRequirements: string[];
  /** AI governance */
  aiGovernance: {
    framework: string;
    reviewFrequency: string;
    responsibleParty: string;
  };
}

// =============================================================================
// 13. RISK ASSESSMENT MATRIX LAYER
// =============================================================================

export interface RiskCategory {
  /** Category name */
  name: string;
  /** Description */
  description: string;
  /** Risk factors */
  riskFactors: string[];
}

export interface RiskItem {
  /** Risk ID */
  id: string;
  /** Risk name */
  name: string;
  /** Category */
  category: string;
  /** Description */
  description: string;
  /** Likelihood (1-5) */
  likelihood: 1 | 2 | 3 | 4 | 5;
  /** Impact (1-5) */
  impact: 1 | 2 | 3 | 4 | 5;
  /** Risk score (likelihood * impact) */
  riskScore: number;
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Mitigation strategies */
  mitigations: string[];
  /** Residual risk after mitigation */
  residualRisk: 'low' | 'medium' | 'high';
  /** Risk owner */
  owner: string;
  /** Review frequency */
  reviewFrequency: string;
  /** Status */
  status: 'identified' | 'assessed' | 'mitigated' | 'accepted' | 'transferred';
}

export interface RiskMatrix {
  /** Risk categories */
  categories: RiskCategory[];
  /** Individual risks */
  risks: RiskItem[];
  /** Overall risk score */
  overallRiskScore: number;
  /** Risk appetite alignment */
  riskAppetiteAlignment: 'within' | 'at-threshold' | 'exceeds';
  /** Risk treatment strategy */
  treatmentStrategy: 'avoid' | 'mitigate' | 'transfer' | 'accept';
}

// =============================================================================
// 14. SUPPLY CHAIN COMPLIANCE LAYER
// =============================================================================

export interface SupplyChainRequirement {
  /** Requirement type */
  type: 'traceability' | 'provenance' | 'sustainability' | 'ethics' | 'quality' | 'security';
  /** Standard/regulation */
  standard: string;
  /** Requirements */
  requirements: string[];
  /** Feature support */
  featureSupport: string;
  /** Verification method */
  verificationMethod: string;
}

export interface DueDiligence {
  /** Due diligence type */
  type: 'supplier' | 'material' | 'conflict-minerals' | 'human-rights' | 'environmental';
  /** Legal basis */
  legalBasis: string[];
  /** Assessment criteria */
  criteria: string[];
  /** Reporting requirements */
  reporting: string[];
  /** Feature capabilities */
  featureCapabilities: string[];
}

export interface SupplyChainLayer {
  /** Supply chain requirements */
  requirements: SupplyChainRequirement[];
  /** Due diligence */
  dueDiligence: DueDiligence[];
  /** Chain of custody */
  chainOfCustody: {
    supported: boolean;
    methods: string[];
    verificationLevel: string;
  };
  /** Supplier risk management */
  supplierRisk: {
    assessmentFrequency: string;
    riskFactors: string[];
    monitoringCapabilities: string[];
  };
  /** Conflict minerals compliance */
  conflictMinerals?: {
    applicable: boolean;
    regulations: string[];
    reportingCapabilities: string[];
  };
}

// =============================================================================
// 15. ACCESSIBILITY & INCLUSION LAYER
// =============================================================================

export interface AccessibilityStandard {
  /** Standard code */
  code: string;
  /** Standard name */
  name: string;
  /** Conformance level */
  conformanceLevel: 'A' | 'AA' | 'AAA';
  /** Compliance percentage */
  compliancePercentage: number;
  /** Gaps to address */
  gaps: string[];
}

export interface AssistiveTechnology {
  /** Technology type */
  type: 'screen-reader' | 'voice-control' | 'switch-access' | 'magnification' | 'braille';
  /** Support level */
  supportLevel: 'full' | 'partial' | 'planned';
  /** Tested with */
  testedWith: string[];
}

export interface AccessibilityLayer {
  /** Standards compliance */
  standards: AccessibilityStandard[];
  /** Assistive technology support */
  assistiveTechnology: AssistiveTechnology[];
  /** Keyboard navigation */
  keyboardNavigation: {
    fullSupport: boolean;
    shortcuts: string[];
    skipLinks: boolean;
  };
  /** Color/contrast */
  colorContrast: {
    minimumRatio: string;
    colorBlindModes: string[];
  };
  /** Cognitive accessibility */
  cognitiveAccessibility: string[];
  /** Testing approach */
  testingApproach: string[];
  /** Accessibility statement URL */
  accessibilityStatementUrl?: string;
}

// =============================================================================
// 16. LOCALIZATION & INTERNATIONALIZATION LAYER
// =============================================================================

export interface LanguageSupport {
  /** Language code */
  code: string;
  /** Language name */
  name: string;
  /** Support level */
  supportLevel: 'full' | 'partial' | 'ui-only' | 'planned';
  /** RTL support (for Arabic, Hebrew, etc.) */
  rtlSupport: boolean;
  /** Translation completeness */
  completeness: number;
}

export interface RegionalConfiguration {
  /** Region code */
  region: string;
  /** Date format */
  dateFormat: string;
  /** Number format */
  numberFormat: string;
  /** Currency */
  currency: string;
  /** Time zone handling */
  timeZone: string;
  /** Legal requirements */
  legalRequirements: string[];
}

export interface LocalizationLayer {
  /** Supported languages */
  languages: LanguageSupport[];
  /** Regional configurations */
  regionalConfigs: RegionalConfiguration[];
  /** Cultural considerations */
  culturalConsiderations: string[];
  /** Content adaptation */
  contentAdaptation: string[];
  /** Legal/regulatory localization */
  legalLocalization: string[];
  /** Unicode support */
  unicodeSupport: boolean;
  /** Translation management */
  translationManagement: string;
}

// =============================================================================
// 17. INSURANCE & LIABILITY LAYER
// =============================================================================

export interface InsuranceRequirement {
  /** Insurance type */
  type: 'cyber' | 'professional-indemnity' | 'product-liability' | 'general' | 'errors-omissions';
  /** Required */
  required: boolean;
  /** Minimum coverage */
  minimumCoverage?: string;
  /** Typical coverage areas */
  coverageAreas: string[];
  /** Risk factors affecting premiums */
  riskFactors: string[];
}

export interface LiabilityConsideration {
  /** Liability type */
  type: 'contractual' | 'statutory' | 'tortious' | 'product' | 'professional';
  /** Description */
  description: string;
  /** Mitigation measures */
  mitigations: string[];
  /** Indemnification provisions */
  indemnification: string[];
}

export interface InsuranceLiabilityLayer {
  /** Insurance requirements */
  insuranceRequirements: InsuranceRequirement[];
  /** Liability considerations */
  liabilityConsiderations: LiabilityConsideration[];
  /** Limitation of liability */
  limitationOfLiability: string[];
  /** Warranty provisions */
  warranties: string[];
  /** Disclaimer requirements */
  disclaimers: string[];
}

// =============================================================================
// 18. INTEROPERABILITY & INTEGRATION LAYER
// =============================================================================

export interface IntegrationEndpoint {
  /** Endpoint type */
  type: 'rest' | 'graphql' | 'grpc' | 'soap' | 'websocket' | 'webhook' | 'file' | 'database';
  /** Endpoint name */
  name: string;
  /** Description */
  description: string;
  /** Authentication methods */
  authentication: string[];
  /** Rate limits */
  rateLimits?: string;
  /** SLA */
  sla?: string;
}

export interface DataExchangeFormat {
  /** Format name */
  name: string;
  /** Standard */
  standard?: string;
  /** Use cases */
  useCases: string[];
  /** Validation support */
  validation: boolean;
  /** Transformation capabilities */
  transformation: string[];
}

export interface ThirdPartyIntegration {
  /** Integration name */
  name: string;
  /** Category */
  category: 'erp' | 'crm' | 'wms' | 'tms' | 'iot' | 'analytics' | 'ai' | 'security' | 'communication' | 'other';
  /** Integration type */
  integrationType: 'native' | 'api' | 'middleware' | 'custom';
  /** Status */
  status: 'certified' | 'supported' | 'community' | 'planned';
  /** Vendors */
  vendors: string[];
  /** Documentation link */
  documentationUrl?: string;
}

export interface InteroperabilityLayer {
  /** Integration endpoints */
  endpoints: IntegrationEndpoint[];
  /** Data exchange formats */
  dataFormats: DataExchangeFormat[];
  /** Third-party integrations */
  thirdPartyIntegrations: ThirdPartyIntegration[];
  /** API versioning strategy */
  apiVersioning: string;
  /** Backward compatibility */
  backwardCompatibility: string;
  /** Migration support */
  migrationSupport: string[];
  /** Integration testing */
  integrationTesting: string[];
}

// =============================================================================
// 19. COST & FINANCIAL MODELING LAYER
// =============================================================================

export interface CostComponent {
  /** Cost category */
  category: 'license' | 'infrastructure' | 'implementation' | 'training' | 'support' | 'customization' | 'integration';
  /** Description */
  description: string;
  /** Cost model */
  costModel: 'fixed' | 'variable' | 'usage-based' | 'tiered';
  /** Typical range */
  typicalRange?: string;
  /** Factors affecting cost */
  costFactors: string[];
}

export interface ROIModel {
  /** Benefit category */
  category: 'cost-savings' | 'revenue-increase' | 'productivity' | 'risk-reduction' | 'compliance';
  /** Description */
  description: string;
  /** Quantification method */
  quantificationMethod: string;
  /** Typical benefit range */
  typicalBenefitRange: string;
  /** Time to realize */
  timeToRealize: string;
}

export interface TCOConsideration {
  /** Consideration */
  consideration: string;
  /** Year 1-3 impact */
  shortTermImpact: string;
  /** Year 4-5 impact */
  longTermImpact: string;
  /** Hidden costs to consider */
  hiddenCosts: string[];
}

export interface FinancialLayer {
  /** Cost components */
  costComponents: CostComponent[];
  /** ROI models */
  roiModels: ROIModel[];
  /** TCO considerations */
  tcoConsiderations: TCOConsideration[];
  /** Payback period */
  typicalPaybackPeriod: string;
  /** Budget planning guidance */
  budgetPlanning: string[];
  /** Cost optimization opportunities */
  costOptimization: string[];
}

// =============================================================================
// 20. PERFORMANCE BENCHMARKS LAYER
// =============================================================================

export interface Benchmark {
  /** Benchmark name */
  name: string;
  /** Category */
  category: 'throughput' | 'latency' | 'availability' | 'scalability' | 'reliability' | 'efficiency';
  /** Metric */
  metric: string;
  /** Our performance */
  ourPerformance: string;
  /** Industry average */
  industryAverage?: string;
  /** Best in class */
  bestInClass?: string;
  /** Test conditions */
  testConditions: string;
  /** Measurement method */
  measurementMethod: string;
}

export interface ScalabilityTest {
  /** Test name */
  name: string;
  /** Scenario */
  scenario: string;
  /** Load parameters */
  loadParameters: string;
  /** Results */
  results: string;
  /** Bottlenecks identified */
  bottlenecks?: string[];
  /** Recommendations */
  recommendations: string[];
}

export interface BenchmarkLayer {
  /** Performance benchmarks */
  benchmarks: Benchmark[];
  /** Scalability tests */
  scalabilityTests: ScalabilityTest[];
  /** Performance SLAs */
  performanceSLAs: {
    metric: string;
    target: string;
    measurement: string;
  }[];
  /** Optimization opportunities */
  optimizationOpportunities: string[];
  /** Monitoring approach */
  monitoringApproach: string[];
}

// =============================================================================
// TOOLTIP INFO TYPE (for UI hover-over)
// =============================================================================

export interface TooltipInfo {
  /** Short summary (1 line) */
  summary: string;
  /** Detailed explanation */
  details: string;
  /** Key points (bullet list) */
  keyPoints: string[];
  /** Related items */
  relatedItems?: string[];
  /** Learn more link */
  learnMoreUrl?: string;
  /** Criticality indicator */
  criticality?: 'info' | 'warning' | 'critical';
  /** Last updated */
  lastUpdated?: string;
}

export interface TooltipRegistry {
  [key: string]: TooltipInfo;
}

// =============================================================================
// EXTENDED FEATURE PLAYBOOK (Full Version)
// =============================================================================

export interface ExtendedFeaturePlaybook {
  // Base playbook fields (from FeaturePlaybook)
  id: string;
  name: string;
  description: string;
  category: string;
  modules: string[];
  status: 'production' | 'beta' | 'development' | 'planned' | 'research';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  phase: number;
  estimatedTime: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'highly-complex';
  capabilities: string[];
  keyFeatures: string[];
  benefits: string[];
  
  // Extended layers
  privacy: PrivacyLayer;
  aiEthics?: AIEthicsLayer; // Only for AI-enabled features
  riskMatrix: RiskMatrix;
  supplyChain?: SupplyChainLayer; // Only for supply chain features
  accessibility: AccessibilityLayer;
  localization: LocalizationLayer;
  insuranceLiability: InsuranceLiabilityLayer;
  interoperability: InteroperabilityLayer;
  financial: FinancialLayer;
  benchmarks: BenchmarkLayer;
  
  // Tooltip registry for UI hover-over
  tooltips: TooltipRegistry;
  
  // Metadata
  lastUpdated: string;
  version: string;
  owner: string;
  reviewers: string[];
  approvalStatus: 'draft' | 'review' | 'approved' | 'published';
}

