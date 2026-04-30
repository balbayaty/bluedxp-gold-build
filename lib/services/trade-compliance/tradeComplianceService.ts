/**
 * Comprehensive Trade Compliance Service
 * Handles Import/Export Compliance, License Management, Process Flows, and Landed Costs
 * Integrated with ML Models for Requirement Prediction and Risk Assessment
 */

import {
  TradeComplianceRecord,
  TradeDirection,
  TradeType,
  ShipmentMode,
  CountryCode,
  ProductCategory,
  LicenseType,
  LicenseRequirement,
  ComplianceStatus,
  RiskLevel,
  ComplianceIssue,
  ProcessFlow,
  ProcessStep,
  ProcessStepType,
  ProcessStepStatus,
  LandedCostBreakdown,
  CostItem,
  CostCategory,
  MLPrediction,
  MLPredictionType,
  RequirementPrediction,
  CostPrediction,
  TimelinePrediction,
  RiskAssessment,
  HSClassification,
  CivilDefenseLicense,
  SFDALicense,
  RegulatoryFramework,
} from "@/types/trade-compliance";
import { mlModelRegistry } from "../ml-registry";

// ============================================================================
// IN-MEMORY STORAGE (Will be replaced with database)
// ============================================================================

class TradeComplianceStore {
  private records: Map<string, TradeComplianceRecord> = new Map();
  private processFlows: Map<string, ProcessFlow> = new Map();
  private regulatoryFrameworks: Map<string, RegulatoryFramework> = new Map();
  private licenseRequirements: Map<string, LicenseRequirement> = new Map();
  private civilDefenseLicenses: Map<string, CivilDefenseLicense> = new Map();
  private sfdaLicenses: Map<string, SFDALicense> = new Map();

  // Records
  getRecord(id: string): TradeComplianceRecord | undefined {
    return this.records.get(id);
  }

  setRecord(record: TradeComplianceRecord): void {
    this.records.set(record.id, record);
  }

  getRecordsByTenant(tenantId: string): TradeComplianceRecord[] {
    return Array.from(this.records.values()).filter(
      (r) => r.tenantId === tenantId,
    );
  }

  // Process Flows
  getProcessFlow(id: string): ProcessFlow | undefined {
    return this.processFlows.get(id);
  }

  setProcessFlow(flow: ProcessFlow): void {
    this.processFlows.set(flow.id, flow);
  }

  // Regulatory Frameworks
  getRegulatoryFramework(id: string): RegulatoryFramework | undefined {
    return this.regulatoryFrameworks.get(id);
  }

  setRegulatoryFramework(framework: RegulatoryFramework): void {
    this.regulatoryFrameworks.set(framework.id, framework);
  }

  // License Requirements
  getLicenseRequirement(id: string): LicenseRequirement | undefined {
    return this.licenseRequirements.get(id);
  }

  setLicenseRequirement(requirement: LicenseRequirement): void {
    this.licenseRequirements.set(requirement.id, requirement);
  }

  // Civil Defense Licenses
  getCivilDefenseLicense(id: string): CivilDefenseLicense | undefined {
    return this.civilDefenseLicenses.get(id);
  }

  setCivilDefenseLicense(license: CivilDefenseLicense): void {
    this.civilDefenseLicenses.set(license.id, license);
  }

  // SFDA Licenses
  getSFDALicense(id: string): SFDALicense | undefined {
    return this.sfdaLicenses.get(id);
  }

  setSFDALicense(license: SFDALicense): void {
    this.sfdaLicenses.set(license.id, license);
  }
}

const store = new TradeComplianceStore();

// ============================================================================
// TRADE COMPLIANCE RECORD MANAGEMENT
// ============================================================================

/**
 * Create a new trade compliance record
 */
export async function createTradeComplianceRecord(
  data: Omit<
    TradeComplianceRecord,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "complianceStatus"
    | "complianceScore"
    | "riskLevel"
    | "blockingIssues"
    | "warnings"
    | "currentStep"
    | "processFlow"
    | "completedSteps"
    | "nextSteps"
    | "tags"
  >,
): Promise<TradeComplianceRecord> {
  const id = `tcr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const now = new Date().toISOString();

  // Predict requirements using ML
  const requirementPrediction = await predictRequirements(data);

  // Determine process flow
  const processFlow = await determineProcessFlow(data);

  // Assess risk
  const riskAssessment = await assessRisk(data);

  // Calculate initial compliance score
  const complianceScore = calculateInitialComplianceScore(
    requirementPrediction,
    riskAssessment,
  );

  // Determine compliance status
  const complianceStatus: ComplianceStatus =
    complianceScore >= 80 ? "IN_PROGRESS" : "PENDING_LICENSES";

  // Identify blocking issues and warnings
  const { blockingIssues, warnings } = identifyComplianceIssues(
    data,
    requirementPrediction,
    riskAssessment,
  );

  // Get current step
  const currentStep =
    processFlow.steps.find((s) => s.status === "PENDING") ||
    processFlow.steps[0];

  // Get next steps
  const nextSteps = getNextSteps(processFlow, currentStep.id);

  const record: TradeComplianceRecord = {
    ...data,
    id,
    complianceStatus,
    complianceScore,
    riskLevel: riskAssessment.overallRisk,
    blockingIssues,
    warnings,
    currentStep,
    processFlow,
    completedSteps: [],
    nextSteps,
    requiredLicenses: requirementPrediction.requiredLicenses
      .map((lt) =>
        getLicenseRequirementByType(
          lt,
          data.originCountry,
          data.destinationCountry,
          data.products[0]?.category,
        ),
      )
      .filter((lr): lr is LicenseRequirement => !!lr),
    tags: [],
    createdAt: now,
    updatedAt: now,
  };

  store.setRecord(record);
  return record;
}

/**
 * Update trade compliance record
 */
export async function updateTradeComplianceRecord(
  id: string,
  updates: Partial<TradeComplianceRecord>,
): Promise<TradeComplianceRecord> {
  const record = store.getRecord(id);
  if (!record) {
    throw new Error(`Trade compliance record ${id} not found`);
  }

  const updated: TradeComplianceRecord = {
    ...record,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Recalculate compliance if relevant fields changed
  if (updates.products || updates.obtainedLicenses || updates.documents) {
    const complianceScore = await recalculateComplianceScore(updated);
    updated.complianceScore = complianceScore;
    updated.complianceStatus = determineComplianceStatus(
      complianceScore,
      updated.blockingIssues,
    );
  }

  store.setRecord(updated);
  return updated;
}

// ============================================================================
// ML-BASED REQUIREMENT PREDICTION
// ============================================================================

/**
 * Predict required licenses and documents using ML models
 */
async function predictRequirements(
  data: Omit<TradeComplianceRecord, "id" | "createdAt" | "updatedAt">,
): Promise<RequirementPrediction> {
  try {
    // Try to use ML model for prediction
    const modelId = "trade-compliance-requirement-predictor";
    const prediction = await mlModelRegistry.predict(modelId, {
      tradeDirection: data.tradeDirection,
      originCountry: data.originCountry,
      destinationCountry: data.destinationCountry,
      productCategories: data.products.map((p) => p.category),
      hsCodes: data.products.map((p) => p.hsCode),
      shipmentMode: data.shipmentMode,
    });

    if (prediction && prediction.confidence > 70) {
      return {
        requiredLicenses: prediction.output.requiredLicenses || [],
        requiredDocuments: prediction.output.requiredDocuments || [],
        confidence: prediction.confidence,
        reasoning: prediction.output.reasoning || "ML model prediction",
        alternativeRequirements: prediction.output.alternativeRequirements,
      };
    }
  } catch (error) {
    console.warn("ML prediction failed, using rule-based approach:", error);
  }

  // Fallback to rule-based prediction
  return ruleBasedRequirementPrediction(data);
}

/**
 * Rule-based requirement prediction (fallback)
 */
function ruleBasedRequirementPrediction(
  data: Omit<TradeComplianceRecord, "id" | "createdAt" | "updatedAt">,
): RequirementPrediction {
  const requiredLicenses: LicenseType[] = [];
  const requiredDocuments: string[] = ["COMMERCIAL_INVOICE", "PACKING_LIST"];

  // Add based on trade direction
  if (data.tradeDirection === "IMPORT") {
    requiredLicenses.push("IMPORT_LICENSE");
    requiredDocuments.push("BILL_OF_LADING", "CERTIFICATE_OF_ORIGIN");
  } else if (data.tradeDirection === "EXPORT") {
    requiredLicenses.push("EXPORT_LICENSE");
    requiredDocuments.push("AIRWAY_BILL", "CERTIFICATE_OF_ORIGIN");
  }

  // Add based on product categories
  for (const product of data.products) {
    if (product.category === "CHEMICALS") {
      requiredLicenses.push("CIVIL_DEFENSE_CHEMICAL");
    } else if (product.category === "FOOD") {
      requiredLicenses.push("SFDA_FOOD");
    } else if (product.category === "MEDICINE") {
      requiredLicenses.push("SFDA_MEDICINE");
    }

    // SABER for most products in Saudi Arabia
    if (data.destinationCountry === "SA" || data.originCountry === "SA") {
      requiredLicenses.push("SABER_CERTIFICATE");
    }
  }

  // Add customs clearance
  requiredLicenses.push("CUSTOMS_CLEARANCE");

  return {
    requiredLicenses: Array.from(new Set(requiredLicenses)),
    requiredDocuments: Array.from(new Set(requiredDocuments)),
    confidence: 75,
    reasoning:
      "Rule-based prediction based on trade direction, product categories, and countries",
  };
}

/**
 * Get license requirement by type
 */
function getLicenseRequirementByType(
  licenseType: LicenseType,
  originCountry: CountryCode,
  destinationCountry: CountryCode,
  productCategory?: ProductCategory,
): LicenseRequirement | null {
  // This would typically come from a database or configuration
  // For now, return a basic structure
  return {
    id: `lr-${licenseType}-${Date.now()}`,
    licenseType,
    authority: getAuthorityForLicenseType(licenseType),
    mandatory: true,
    applicableTo: productCategory ? [productCategory] : [],
    applicableCountries: [originCountry, destinationCountry],
    validityPeriod: 365,
    processingTime: getProcessingTimeForLicense(licenseType),
    cost: getCostForLicense(licenseType),
    currency: "SAR",
    documentsRequired: getDocumentsForLicense(licenseType),
    conditions: [],
    autoRenewable: false,
  };
}

function getAuthorityForLicenseType(licenseType: LicenseType): string {
  const authorityMap: Record<LicenseType, string> = {
    CIVIL_DEFENSE_CHEMICAL: "Civil Defense",
    SFDA_FOOD: "SFDA",
    SFDA_MEDICINE: "SFDA",
    SABER_CERTIFICATE: "SABER",
    CUSTOMS_CLEARANCE: "ZATCA",
    IMPORT_LICENSE: "MOC",
    EXPORT_LICENSE: "MOC",
    PHYTOSANITARY: "MOA",
    VETERINARY: "MOA",
    CERTIFICATE_OF_ORIGIN: "MOC",
    COMMERCIAL_INVOICE: "MOC",
    PACKING_LIST: "MOC",
    BILL_OF_LADING: "Shipping Company",
    AIRWAY_BILL: "Airline",
    INSURANCE_CERTIFICATE: "Insurance Company",
    OTHER: "Various",
  };
  return authorityMap[licenseType] || "Various";
}

function getProcessingTimeForLicense(licenseType: LicenseType): number {
  const processingTimes: Record<LicenseType, number> = {
    CIVIL_DEFENSE_CHEMICAL: 14,
    SFDA_FOOD: 21,
    SFDA_MEDICINE: 30,
    SABER_CERTIFICATE: 7,
    CUSTOMS_CLEARANCE: 3,
    IMPORT_LICENSE: 7,
    EXPORT_LICENSE: 5,
    PHYTOSANITARY: 7,
    VETERINARY: 7,
    CERTIFICATE_OF_ORIGIN: 1,
    COMMERCIAL_INVOICE: 1,
    PACKING_LIST: 1,
    BILL_OF_LADING: 1,
    AIRWAY_BILL: 1,
    INSURANCE_CERTIFICATE: 1,
    OTHER: 5,
  };
  return processingTimes[licenseType] || 5;
}

function getCostForLicense(licenseType: LicenseType): number {
  const costs: Record<LicenseType, number> = {
    CIVIL_DEFENSE_CHEMICAL: 500,
    SFDA_FOOD: 1000,
    SFDA_MEDICINE: 2000,
    SABER_CERTIFICATE: 300,
    CUSTOMS_CLEARANCE: 200,
    IMPORT_LICENSE: 500,
    EXPORT_LICENSE: 300,
    PHYTOSANITARY: 200,
    VETERINARY: 200,
    CERTIFICATE_OF_ORIGIN: 50,
    COMMERCIAL_INVOICE: 0,
    PACKING_LIST: 0,
    BILL_OF_LADING: 0,
    AIRWAY_BILL: 0,
    INSURANCE_CERTIFICATE: 0,
    OTHER: 100,
  };
  return costs[licenseType] || 100;
}

function getDocumentsForLicense(licenseType: LicenseType): string[] {
  const documents: Record<LicenseType, string[]> = {
    CIVIL_DEFENSE_CHEMICAL: ["MSDS", "Storage Plan", "Safety Certificate"],
    SFDA_FOOD: [
      "Product Specification",
      "Test Results",
      "Manufacturing Certificate",
    ],
    SFDA_MEDICINE: [
      "Product Specification",
      "Clinical Data",
      "Manufacturing Certificate",
    ],
    SABER_CERTIFICATE: ["Test Report", "Certificate of Conformity"],
    CUSTOMS_CLEARANCE: ["Commercial Invoice", "Packing List", "Bill of Lading"],
    IMPORT_LICENSE: ["Commercial Registration", "Import Permit Application"],
    EXPORT_LICENSE: ["Commercial Registration", "Export Permit Application"],
    PHYTOSANITARY: ["Phytosanitary Certificate", "Plant Health Certificate"],
    VETERINARY: ["Veterinary Certificate", "Health Certificate"],
    CERTIFICATE_OF_ORIGIN: ["Commercial Invoice", "Manufacturing Certificate"],
    COMMERCIAL_INVOICE: [],
    PACKING_LIST: [],
    BILL_OF_LADING: [],
    AIRWAY_BILL: [],
    INSURANCE_CERTIFICATE: [],
    OTHER: [],
  };
  return documents[licenseType] || [];
}

// ============================================================================
// PROCESS FLOW MANAGEMENT
// ============================================================================

/**
 * Determine appropriate process flow for trade compliance record
 */
async function determineProcessFlow(
  data: Omit<TradeComplianceRecord, "id" | "createdAt" | "updatedAt">,
): Promise<ProcessFlow> {
  // Get or create process flow based on trade direction and countries
  const flowId = `flow-${data.tradeDirection}-${data.originCountry}-${data.destinationCountry}`;
  let flow = store.getProcessFlow(flowId);

  if (!flow) {
    flow = createDefaultProcessFlow(data);
    store.setProcessFlow(flow);
  }

  return flow;
}

/**
 * Create default process flow
 */
function createDefaultProcessFlow(
  data: Omit<TradeComplianceRecord, "id" | "createdAt" | "updatedAt">,
): ProcessFlow {
  const steps: ProcessStep[] = [];

  // Step 1: Document Preparation
  steps.push({
    id: "step-1",
    stepNumber: 1,
    name: "Document Preparation",
    description: "Prepare all required documents",
    stepType: "DOCUMENT_PREPARATION",
    required: true,
    parallel: false,
    estimatedDuration: 24,
    dependencies: [],
    status: "PENDING",
    documentsRequired: ["COMMERCIAL_INVOICE", "PACKING_LIST"],
  });

  // Step 2: License Applications
  if (data.tradeDirection === "IMPORT" || data.tradeDirection === "EXPORT") {
    steps.push({
      id: "step-2",
      stepNumber: 2,
      name: "License Applications",
      description: "Apply for required licenses",
      stepType: "LICENSE_APPLICATION",
      required: true,
      parallel: true,
      estimatedDuration: 168, // 7 days
      dependencies: ["step-1"],
      status: "PENDING",
      licensesRequired: ["IMPORT_LICENSE", "EXPORT_LICENSE"],
    });
  }

  // Step 3: Special License Applications (Civil Defense, SFDA)
  const hasChemicals = data.products.some((p) => p.category === "CHEMICALS");
  const hasFood = data.products.some((p) => p.category === "FOOD");
  const hasMedicine = data.products.some((p) => p.category === "MEDICINE");

  if (hasChemicals) {
    steps.push({
      id: "step-3-civil-defense",
      stepNumber: 3,
      name: "Civil Defense License",
      description: "Apply for Civil Defense license for chemicals",
      stepType: "LICENSE_APPLICATION",
      required: true,
      parallel: true,
      estimatedDuration: 336, // 14 days
      dependencies: ["step-1"],
      status: "PENDING",
      licensesRequired: ["CIVIL_DEFENSE_CHEMICAL"],
    });
  }

  if (hasFood) {
    steps.push({
      id: "step-3-sfda-food",
      stepNumber: 3,
      name: "SFDA Food License",
      description: "Apply for SFDA license for food products",
      stepType: "LICENSE_APPLICATION",
      required: true,
      parallel: true,
      estimatedDuration: 504, // 21 days
      dependencies: ["step-1"],
      status: "PENDING",
      licensesRequired: ["SFDA_FOOD"],
    });
  }

  if (hasMedicine) {
    steps.push({
      id: "step-3-sfda-medicine",
      stepNumber: 3,
      name: "SFDA Medicine License",
      description: "Apply for SFDA license for medicines",
      stepType: "LICENSE_APPLICATION",
      required: true,
      parallel: true,
      estimatedDuration: 720, // 30 days
      dependencies: ["step-1"],
      status: "PENDING",
      licensesRequired: ["SFDA_MEDICINE"],
    });
  }

  // Step 4: Customs Declaration
  steps.push({
    id: "step-4",
    stepNumber: 4,
    name: "Customs Declaration",
    description: "Submit customs declaration",
    stepType: "CUSTOMS_DECLARATION",
    required: true,
    parallel: false,
    estimatedDuration: 24,
    dependencies: ["step-2"],
    status: "PENDING",
  });

  // Step 5: Customs Clearance
  steps.push({
    id: "step-5",
    stepNumber: 5,
    name: "Customs Clearance",
    description: "Obtain customs clearance",
    stepType: "CUSTOMS_CLEARANCE",
    required: true,
    parallel: false,
    estimatedDuration: 72, // 3 days
    dependencies: ["step-4"],
    status: "PENDING",
  });

  // Step 6: Shipping
  steps.push({
    id: "step-6",
    stepNumber: 6,
    name: "Shipping",
    description: "Arrange and execute shipment",
    stepType: "SHIPPING",
    required: true,
    parallel: false,
    estimatedDuration: 168, // 7 days
    dependencies: ["step-5"],
    status: "PENDING",
  });

  return {
    id: `flow-${data.tradeDirection}-${data.originCountry}-${data.destinationCountry}`,
    name: `${data.tradeDirection} Process Flow`,
    description: `Process flow for ${data.tradeDirection} from ${data.originCountry} to ${data.destinationCountry}`,
    steps,
    applicableTo: [data.tradeDirection],
    applicableCountries: [data.originCountry, data.destinationCountry],
    applicableCategories: data.products.map(
      (p) => p.category,
    ) as ProductCategory[],
  };
}

/**
 * Get next steps in process flow
 */
function getNextSteps(
  processFlow: ProcessFlow,
  currentStepId: string,
): ProcessStep[] {
  const currentStep = processFlow.steps.find((s) => s.id === currentStepId);
  if (!currentStep) return [];

  // Find steps that depend on current step or can run in parallel
  return processFlow.steps.filter((step) => {
    if (step.id === currentStepId) return false;
    if (step.status === "COMPLETED") return false;
    return (
      step.dependencies.includes(currentStepId) ||
      (step.parallel &&
        step.dependencies.every(
          (dep) =>
            processFlow.steps.find((s) => s.id === dep)?.status === "COMPLETED",
        ))
    );
  });
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

/**
 * Assess compliance risk using ML models
 */
async function assessRisk(
  data: Omit<TradeComplianceRecord, "id" | "createdAt" | "updatedAt">,
): Promise<RiskAssessment> {
  try {
    const modelId = "trade-compliance-risk-assessor";
    const prediction = await mlModelRegistry.predict(modelId, {
      tradeDirection: data.tradeDirection,
      originCountry: data.originCountry,
      destinationCountry: data.destinationCountry,
      productCategories: data.products.map((p) => p.category),
      shipmentMode: data.shipmentMode,
      totalValue: data.totalValue,
    });

    if (prediction && prediction.confidence > 70) {
      return prediction.output as RiskAssessment;
    }
  } catch (error) {
    console.warn(
      "ML risk assessment failed, using rule-based approach:",
      error,
    );
  }

  // Fallback to rule-based risk assessment
  return ruleBasedRiskAssessment(data);
}

/**
 * Rule-based risk assessment (fallback)
 */
function ruleBasedRiskAssessment(
  data: Omit<TradeComplianceRecord, "id" | "createdAt" | "updatedAt">,
): RiskAssessment {
  let riskScore = 0;
  const riskFactors: Array<{
    factor: string;
    riskLevel: RiskLevel;
    impact: string;
    probability: number;
  }> = [];

  // High value increases risk
  if (data.totalValue > 1000000) {
    riskScore += 20;
    riskFactors.push({
      factor: "High Value Shipment",
      riskLevel: "MEDIUM",
      impact: "Increased scrutiny from customs",
      probability: 0.7,
    });
  }

  // Chemicals increase risk
  if (data.products.some((p) => p.category === "CHEMICALS")) {
    riskScore += 30;
    riskFactors.push({
      factor: "Chemical Products",
      riskLevel: "HIGH",
      impact: "Requires Civil Defense license and special handling",
      probability: 0.9,
    });
  }

  // Food/Medicine increases risk
  if (
    data.products.some(
      (p) => p.category === "FOOD" || p.category === "MEDICINE",
    )
  ) {
    riskScore += 25;
    riskFactors.push({
      factor: "Food/Medicine Products",
      riskLevel: "HIGH",
      impact: "Requires SFDA license and testing",
      probability: 0.8,
    });
  }

  // Complex routes increase risk
  if (
    data.originCountry !== data.destinationCountry &&
    !areCountriesInSameRegion(data.originCountry, data.destinationCountry)
  ) {
    riskScore += 15;
    riskFactors.push({
      factor: "Cross-Region Shipment",
      riskLevel: "MEDIUM",
      impact: "Multiple regulatory frameworks apply",
      probability: 0.6,
    });
  }

  // Determine overall risk level
  let overallRisk: RiskLevel = "LOW";
  if (riskScore >= 70) overallRisk = "CRITICAL";
  else if (riskScore >= 50) overallRisk = "HIGH";
  else if (riskScore >= 30) overallRisk = "MEDIUM";

  return {
    overallRisk,
    riskScore: Math.min(100, riskScore),
    riskFactors,
    mitigationStrategies: generateMitigationStrategies(riskFactors),
    confidence: 75,
  };
}

function areCountriesInSameRegion(
  country1: CountryCode,
  country2: CountryCode,
): boolean {
  const gccCountries: CountryCode[] = ["SA", "AE", "KW", "QA", "BH", "OM"];
  return gccCountries.includes(country1) && gccCountries.includes(country2);
}

function generateMitigationStrategies(
  riskFactors: Array<{ factor: string; riskLevel: RiskLevel }>,
): string[] {
  const strategies: string[] = [];

  for (const factor of riskFactors) {
    if (factor.factor.includes("Chemical")) {
      strategies.push("Apply for Civil Defense license well in advance");
      strategies.push("Ensure proper storage and handling documentation");
    }
    if (factor.factor.includes("Food") || factor.factor.includes("Medicine")) {
      strategies.push("Apply for SFDA license early");
      strategies.push("Prepare all test results and certificates");
    }
    if (factor.factor.includes("High Value")) {
      strategies.push("Ensure proper insurance coverage");
      strategies.push("Prepare detailed documentation");
    }
  }

  return Array.from(new Set(strategies));
}

// ============================================================================
// COMPLIANCE SCORING
// ============================================================================

function calculateInitialComplianceScore(
  requirementPrediction: RequirementPrediction,
  riskAssessment: RiskAssessment,
): number {
  let score = 100;

  // Deduct for high risk
  score -= riskAssessment.riskScore * 0.3;

  // Deduct for many requirements
  score -= requirementPrediction.requiredLicenses.length * 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

async function recalculateComplianceScore(
  record: TradeComplianceRecord,
): Promise<number> {
  let score = 100;

  // Check obtained licenses
  const requiredLicenseTypes = record.requiredLicenses.map(
    (lr) => lr.licenseType,
  );
  const obtainedLicenseTypes = record.obtainedLicenses.map(
    (l) => l.licenseType,
  );
  const missingLicenses = requiredLicenseTypes.filter(
    (lt) => !obtainedLicenseTypes.includes(lt),
  );

  score -= missingLicenses.length * 10;

  // Check documents
  const requiredDocuments = record.requiredLicenses.flatMap(
    (lr) => lr.documentsRequired,
  );
  const obtainedDocuments = record.documents.map((d) => d.name);
  const missingDocuments = requiredDocuments.filter(
    (doc) => !obtainedDocuments.includes(doc),
  );

  score -= missingDocuments.length * 5;

  // Check blocking issues
  score -= record.blockingIssues.length * 15;

  // Check warnings
  score -= record.warnings.length * 5;

  // Check expired licenses
  const expiredLicenses = record.obtainedLicenses.filter(
    (l) => l.status === "EXPIRED",
  );
  score -= expiredLicenses.length * 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function determineComplianceStatus(
  complianceScore: number,
  blockingIssues: ComplianceIssue[],
): ComplianceStatus {
  if (blockingIssues.length > 0) return "BLOCKED";
  if (complianceScore >= 90) return "APPROVED";
  if (complianceScore >= 70) return "IN_PROGRESS";
  if (complianceScore >= 50) return "PENDING_REVIEW";
  return "PENDING_LICENSES";
}

function identifyComplianceIssues(
  data: Omit<TradeComplianceRecord, "id" | "createdAt" | "updatedAt">,
  requirementPrediction: RequirementPrediction,
  riskAssessment: RiskAssessment,
): { blockingIssues: ComplianceIssue[]; warnings: ComplianceIssue[] } {
  const blockingIssues: ComplianceIssue[] = [];
  const warnings: ComplianceIssue[] = [];

  // Check for missing critical licenses
  if (
    data.products.some((p) => p.category === "CHEMICALS") &&
    !requirementPrediction.requiredLicenses.includes("CIVIL_DEFENSE_CHEMICAL")
  ) {
    blockingIssues.push({
      id: `issue-${Date.now()}-1`,
      type: "BLOCKING",
      severity: "CRITICAL",
      title: "Missing Civil Defense License",
      description: "Chemical products require Civil Defense license",
      resolved: false,
    });
  }

  // Check for high risk factors
  if (
    riskAssessment.overallRisk === "CRITICAL" ||
    riskAssessment.overallRisk === "HIGH"
  ) {
    warnings.push({
      id: `issue-${Date.now()}-2`,
      type: "WARNING",
      severity: riskAssessment.overallRisk,
      title: "High Risk Shipment",
      description: `Risk assessment indicates ${riskAssessment.overallRisk.toLowerCase()} risk level`,
      resolved: false,
    });
  }

  return { blockingIssues, warnings };
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const tradeComplianceService = {
  // Records
  createTradeComplianceRecord,
  updateTradeComplianceRecord,
  getRecord: (id: string) => store.getRecord(id),
  getRecordsByTenant: (tenantId: string) => store.getRecordsByTenant(tenantId),

  // Process Flows
  getProcessFlow: (id: string) => store.getProcessFlow(id),
  setProcessFlow: (flow: ProcessFlow) => store.setProcessFlow(flow),

  // Predictions
  predictRequirements,
  assessRisk,
};

export default tradeComplianceService;
