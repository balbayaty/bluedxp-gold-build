import { aiService } from "../ai/chemcheckService";
import { v4 as uuidv4 } from "uuid";

// Define risk levels
export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
  EXTREME = "EXTREME",
}

// Chemical exposure scenarios
export interface ExposureScenario {
  id: string;
  name: string;
  description: string;
  exposureRoute: "inhalation" | "dermal" | "ingestion" | "eye" | "multiple";
  duration: "acute" | "intermediate" | "chronic";
  frequency: "rare" | "occasional" | "frequent" | "continuous";
  magnitude: "trace" | "low" | "moderate" | "high";
  controlMeasures: string[];
  riskLevel?: RiskLevel;
  recommendedPPE?: string[];
}

// Chemical data for risk assessment
export interface ChemicalRiskData {
  id: string;
  name: string;
  casNumber?: string;
  formula?: string;
  hazardClassifications: string[];
  hazardStatements: string[];
  occupationalExposureLimits?: {
    twa?: number; // Time-weighted average (8-hour)
    stel?: number; // Short-term exposure limit (15-min)
    ceiling?: number; // Ceiling limit
    units: "ppm" | "mg/m3";
  };
  physicalProperties?: {
    physicalState: "solid" | "liquid" | "gas";
    boilingPoint?: number;
    meltingPoint?: number;
    flashPoint?: number;
    vaporPressure?: number;
    specificGravity?: number;
    solubility?: string;
  };
  toxicologyData?: {
    acuteToxicity?: string;
    chronicToxicity?: string;
    carcinogenicity?: string;
    mutagenicityGenotoxicity?: string;
    reproductiveToxicity?: string;
    specificTargetOrganToxicity?: string;
  };
}

// Workplace data
export interface WorkplaceData {
  id: string;
  name: string;
  type: string;
  area: number; // square meters
  ventilationRate?: number; // air changes per hour
  controlMeasures: string[];
  averageOccupancy: number;
  activities: string[];
}

// Risk assessment result
export interface RiskAssessmentResult {
  id: string;
  timestamp: string;
  chemicalId: string;
  chemicalName: string;
  workplaceId: string;
  scenarioId: string;
  scenarioName: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  confidenceScore: number; // 0-1
  reasoningNotes: string[];
  recommendedControls: string[];
  recommendedPPE: string[];
  exposureLimits?: {
    value: number;
    units: string;
    type: string;
    source: string;
  }[];
  emergencyMeasures: string[];
  reviewDate: string; // Date when risk assessment should be reviewed
}

/**
 * Chemical Risk Assessment Service
 * Uses AI to help assess risks of chemicals in various workplace scenarios
 */
export class ChemicalRiskAssessmentService {
  private hazardStatementScores: Record<string, number> = {
    // Fatal hazards
    H300: 90, // Fatal if swallowed
    H310: 95, // Fatal in contact with skin
    H330: 95, // Fatal if inhaled

    // Toxic hazards
    H301: 70, // Toxic if swallowed
    H311: 75, // Toxic in contact with skin
    H331: 75, // Toxic if inhaled

    // Harmful hazards
    H302: 50, // Harmful if swallowed
    H312: 50, // Harmful in contact with skin
    H332: 50, // Harmful if inhaled

    // Corrosive/Irritant hazards
    H314: 80, // Causes severe skin burns and eye damage
    H318: 70, // Causes serious eye damage
    H315: 40, // Causes skin irritation
    H319: 40, // Causes serious eye irritation
    H317: 50, // May cause allergic skin reaction

    // Respiratory hazards
    H334: 85, // May cause allergy or asthma symptoms if inhaled
    H335: 50, // May cause respiratory irritation
    H336: 40, // May cause drowsiness or dizziness

    // Specific organ toxicity
    H370: 90, // Causes damage to organs
    H371: 75, // May cause damage to organs
    H372: 85, // Causes damage to organs through prolonged/repeated exposure
    H373: 70, // May cause damage to organs through prolonged/repeated exposure

    // Carcinogenicity, mutagenicity, reproductive toxicity
    H350: 95, // May cause cancer
    H350i: 95, // May cause cancer by inhalation
    H351: 85, // Suspected of causing cancer
    H340: 95, // May cause genetic defects
    H341: 85, // Suspected of causing genetic defects
    H360: 95, // May damage fertility or the unborn child
    H361: 85, // Suspected of damaging fertility or the unborn child
    H362: 70, // May cause harm to breast-fed children

    // Aspiration hazard
    H304: 70, // May be fatal if swallowed and enters airways

    // Environmental hazards - lower scores for human risk assessment
    H400: 40, // Very toxic to aquatic life
    H410: 45, // Very toxic to aquatic life with long lasting effects
    H411: 40, // Toxic to aquatic life with long lasting effects
    H412: 30, // Harmful to aquatic life with long lasting effects
    H413: 25, // May cause long lasting harmful effects to aquatic life

    // Physical hazards
    H200: 90, // Unstable explosive
    H201: 90, // Explosive; mass explosion hazard
    H202: 90, // Explosive; severe projection hazard
    H203: 85, // Explosive; fire, blast or projection hazard
    H204: 80, // Fire or projection hazard
    H205: 85, // May mass explode in fire

    // Flammable hazards
    H220: 75, // Extremely flammable gas
    H221: 65, // Flammable gas
    H222: 70, // Extremely flammable aerosol
    H223: 60, // Flammable aerosol
    H224: 80, // Extremely flammable liquid and vapor
    H225: 70, // Highly flammable liquid and vapor
    H226: 60, // Flammable liquid and vapor
    H228: 60, // Flammable solid

    // Oxidizing hazards
    H270: 70, // May cause or intensify fire; oxidizer
    H271: 80, // May cause fire or explosion; strong oxidizer
    H272: 70, // May intensify fire; oxidizer

    // Gases under pressure
    H280: 40, // Contains gas under pressure; may explode if heated
    H281: 40, // Contains refrigerated gas; may cause cryogenic burns

    // Self-reactive, pyrophoric, self-heating hazards
    H240: 80, // Heating may cause an explosion
    H241: 75, // Heating may cause a fire or explosion
    H242: 65, // Heating may cause a fire
    H250: 75, // Catches fire spontaneously if exposed to air
    H251: 65, // Self-heating; may catch fire
    H252: 60, // Self-heating in large quantities; may catch fire

    // Water-reactive hazards
    H260: 70, // In contact with water releases flammable gases which may ignite spontaneously
    H261: 65, // In contact with water releases flammable gases

    // Corrosive to metals
    H290: 50, // May be corrosive to metals
  };

  // Default scenario risk scores based on exposure characteristics
  private exposureRouteScores: Record<string, number> = {
    inhalation: 75,
    dermal: 65,
    ingestion: 55,
    eye: 60,
    multiple: 85,
  };

  private exposureDurationScores: Record<string, number> = {
    acute: 60,
    intermediate: 75,
    chronic: 90,
  };

  private exposureFrequencyScores: Record<string, number> = {
    rare: 40,
    occasional: 60,
    frequent: 80,
    continuous: 95,
  };

  private exposureMagnitudeScores: Record<string, number> = {
    trace: 30,
    low: 50,
    moderate: 75,
    high: 95,
  };

  /**
   * Calculate base risk score from chemical data
   */
  private calculateBaseRiskScore(chemical: ChemicalRiskData): number {
    // Start with a base score of 20
    let riskScore = 20;

    // Add scores from hazard statements
    for (const statement of chemical.hazardStatements) {
      // Extract H-code (e.g., H300) from statement
      const match = statement.match(/H\d{3}/);
      if (match && this.hazardStatementScores[match[0]]) {
        riskScore = Math.max(riskScore, this.hazardStatementScores[match[0]]);
      }
    }

    // Adjust for physical state if available
    if (chemical.physicalProperties?.physicalState) {
      switch (chemical.physicalProperties.physicalState) {
        case "gas":
          riskScore *= 1.2; // Higher risk for gases (inhalation)
          break;
        case "liquid":
          riskScore *= 1.1; // Moderate risk for liquids (multiple exposure routes)
          break;
        case "solid":
          riskScore *= 1.0; // Base risk for solids
          break;
      }
    }

    // Cap score at 100
    return Math.min(100, riskScore);
  }

  /**
   * Calculate scenario-specific risk score
   */
  private calculateScenarioRiskScore(
    baseScore: number,
    scenario: ExposureScenario,
  ): number {
    // Start with the base chemical risk
    let scenarioScore = baseScore;

    // Adjust for exposure route
    const routeScore = this.exposureRouteScores[scenario.exposureRoute] || 70;

    // Adjust for exposure duration
    const durationScore = this.exposureDurationScores[scenario.duration] || 70;

    // Adjust for exposure frequency
    const frequencyScore =
      this.exposureFrequencyScores[scenario.frequency] || 70;

    // Adjust for exposure magnitude
    const magnitudeScore =
      this.exposureMagnitudeScores[scenario.magnitude] || 70;

    // Calculate average exposure factor
    const exposureFactor =
      (routeScore + durationScore + frequencyScore + magnitudeScore) / 400;

    // Apply exposure factor to base score
    scenarioScore = scenarioScore * exposureFactor;

    // Reduce score based on control measures (each good control measure reduces risk)
    const controlReduction = scenario.controlMeasures.length * 5;
    scenarioScore = Math.max(10, scenarioScore - controlReduction);

    // Cap score at 100
    return Math.min(100, scenarioScore);
  }

  /**
   * Convert numeric score to risk level
   */
  private riskScoreToLevel(score: number): RiskLevel {
    if (score >= 90) return RiskLevel.EXTREME;
    if (score >= 75) return RiskLevel.VERY_HIGH;
    if (score >= 50) return RiskLevel.HIGH;
    if (score >= 25) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  /**
   * Determine recommended PPE based on hazards and scenario
   */
  private determineRecommendedPPE(
    chemical: ChemicalRiskData,
    scenario: ExposureScenario,
  ): string[] {
    const recommendations: string[] = [];

    // Check for respiratory hazards
    const respiratoryHazards = chemical.hazardStatements.some(
      (h) =>
        h.includes("H330") ||
        h.includes("H331") ||
        h.includes("H332") ||
        h.includes("H334") ||
        h.includes("H335") ||
        h.includes("H336"),
    );

    // Check for skin hazards
    const skinHazards = chemical.hazardStatements.some(
      (h) =>
        h.includes("H310") ||
        h.includes("H311") ||
        h.includes("H312") ||
        h.includes("H314") ||
        h.includes("H315") ||
        h.includes("H317"),
    );

    // Check for eye hazards
    const eyeHazards = chemical.hazardStatements.some(
      (h) => h.includes("H318") || h.includes("H319"),
    );

    // Add respiratory protection
    if (
      respiratoryHazards ||
      scenario.exposureRoute === "inhalation" ||
      scenario.exposureRoute === "multiple"
    ) {
      if (
        chemical.physicalProperties?.physicalState === "gas" ||
        scenario.magnitude === "high" ||
        scenario.magnitude === "moderate"
      ) {
        recommendations.push(
          "SCBA or full-face respirator with appropriate filters",
        );
      } else {
        recommendations.push("Half-face respirator with appropriate filters");
      }
    }

    // Add skin protection
    if (
      skinHazards ||
      scenario.exposureRoute === "dermal" ||
      scenario.exposureRoute === "multiple"
    ) {
      // Check for corrosive hazards
      if (chemical.hazardStatements.some((h) => h.includes("H314"))) {
        recommendations.push("Chemical-resistant full body coverall");
        recommendations.push("Chemical-resistant gloves (heavy duty)");
        recommendations.push("Chemical-resistant boots");
      } else {
        recommendations.push("Chemical-resistant gloves");
        recommendations.push("Lab coat or coveralls");
      }
    }

    // Add eye protection
    if (
      eyeHazards ||
      scenario.exposureRoute === "eye" ||
      scenario.exposureRoute === "multiple"
    ) {
      if (chemical.hazardStatements.some((h) => h.includes("H318"))) {
        recommendations.push("Full face shield");
      }
      recommendations.push("Chemical splash goggles");
    }

    // General PPE always recommended
    if (recommendations.length === 0) {
      recommendations.push("Safety glasses");
      recommendations.push("Gloves appropriate for mechanical hazards");
    }

    return recommendations;
  }

  /**
   * Determine recommended controls based on risk assessment
   */
  private determineRecommendedControls(
    chemical: ChemicalRiskData,
    scenario: ExposureScenario,
    workplace: WorkplaceData,
    riskLevel: RiskLevel,
  ): string[] {
    const recommendations: string[] = [];

    // Add engineering controls
    if (riskLevel === RiskLevel.EXTREME || riskLevel === RiskLevel.VERY_HIGH) {
      recommendations.push(
        "Consider process or material substitution to eliminate the hazard",
      );
      recommendations.push(
        "Implement closed process systems to contain the chemical",
      );
    }

    if (
      riskLevel === RiskLevel.EXTREME ||
      riskLevel === RiskLevel.VERY_HIGH ||
      riskLevel === RiskLevel.HIGH
    ) {
      recommendations.push(
        "Install local exhaust ventilation to capture emissions at source",
      );
      recommendations.push(
        "Implement strict access control to hazardous areas",
      );
    }

    // Ventilation recommendations
    if (!workplace.ventilationRate || workplace.ventilationRate < 6) {
      recommendations.push(
        "Improve general ventilation to at least 6-10 air changes per hour",
      );
    } else if (
      workplace.ventilationRate < 10 &&
      (riskLevel === RiskLevel.EXTREME || riskLevel === RiskLevel.VERY_HIGH)
    ) {
      recommendations.push(
        "Increase ventilation rate to at least 10-15 air changes per hour",
      );
    }

    // Add administrative controls
    if (riskLevel === RiskLevel.EXTREME || riskLevel === RiskLevel.VERY_HIGH) {
      recommendations.push(
        "Develop and implement detailed emergency response procedures",
      );
      recommendations.push(
        "Conduct regular air monitoring and exposure assessments",
      );
      recommendations.push(
        "Implement job rotation to minimize individual exposure time",
      );
    }

    if (riskLevel !== RiskLevel.LOW) {
      recommendations.push(
        "Provide comprehensive training on chemical hazards and safe handling",
      );
      recommendations.push(
        "Establish standard operating procedures for all work with this chemical",
      );
      recommendations.push(
        "Maintain and regularly inspect all control measures",
      );
    }

    // Storage and handling controls
    recommendations.push(
      "Store chemical in accordance with compatibility guidelines",
    );
    recommendations.push(
      "Maintain inventory control and limit quantities to operational minimum",
    );

    // Specific controls for physical hazards
    if (
      chemical.hazardStatements.some(
        (h) => h.includes("H22") || h.includes("H23"),
      )
    ) {
      // Flammable
      recommendations.push(
        "Eliminate ignition sources in storage and use areas",
      );
      recommendations.push(
        "Ensure proper electrical classification in storage and use areas",
      );
      recommendations.push(
        "Install fire detection and suppression systems appropriate for the hazard",
      );
    }

    return recommendations;
  }

  /**
   * Generate emergency measures based on chemical properties
   */
  private generateEmergencyMeasures(chemical: ChemicalRiskData): string[] {
    const measures: string[] = [];

    // General emergency measures
    measures.push("Evacuate personnel to safe areas");
    measures.push("Call emergency response team");

    // Spill response
    measures.push(
      "Contain spill and collect with appropriate absorbent material",
    );

    // Fire response
    if (
      chemical.hazardStatements.some(
        (h) =>
          h.includes("H220") ||
          h.includes("H221") ||
          h.includes("H222") ||
          h.includes("H223") ||
          h.includes("H224") ||
          h.includes("H225") ||
          h.includes("H226") ||
          h.includes("H228"),
      )
    ) {
      measures.push(
        "Use appropriate fire extinguishing agents (not water for water-reactive chemicals)",
      );
      measures.push(
        "Cool containers with water spray to prevent pressure buildup and explosion",
      );
    }

    // First aid measures based on exposure routes
    measures.push(
      "If inhaled: Remove person to fresh air and keep comfortable for breathing",
    );
    measures.push(
      "In case of skin contact: Wash with plenty of water; Remove contaminated clothing",
    );
    measures.push(
      "In case of eye contact: Rinse cautiously with water for several minutes; Remove contact lenses if present",
    );
    measures.push(
      "If swallowed: Rinse mouth, do NOT induce vomiting, seek immediate medical attention",
    );

    return measures;
  }

  /**
   * Rules-based risk assessment
   */
  private performRulesBasedAssessment(
    chemical: ChemicalRiskData,
    scenario: ExposureScenario,
    workplace: WorkplaceData,
  ): RiskAssessmentResult {
    // Calculate base risk score from chemical properties
    const baseRiskScore = this.calculateBaseRiskScore(chemical);

    // Calculate scenario-specific risk score
    const riskScore = this.calculateScenarioRiskScore(baseRiskScore, scenario);

    // Determine risk level
    const riskLevel = this.riskScoreToLevel(riskScore);

    // Determine recommended PPE
    const recommendedPPE = this.determineRecommendedPPE(chemical, scenario);

    // Determine recommended controls
    const recommendedControls = this.determineRecommendedControls(
      chemical,
      scenario,
      workplace,
      riskLevel,
    );

    // Generate emergency measures
    const emergencyMeasures = this.generateEmergencyMeasures(chemical);

    // Create result
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      chemicalId: chemical.id,
      chemicalName: chemical.name,
      workplaceId: workplace.id,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      riskLevel: riskLevel,
      riskScore: Math.round(riskScore),
      confidenceScore: 0.8, // Rules-based has reasonable confidence
      reasoningNotes: [
        `Base risk score for chemical: ${Math.round(baseRiskScore)}`,
        `Adjusted for ${scenario.exposureRoute} exposure, ${scenario.frequency} frequency, ${scenario.magnitude} magnitude`,
        `${scenario.controlMeasures.length} control measures in place`,
      ],
      recommendedControls,
      recommendedPPE,
      exposureLimits: chemical.occupationalExposureLimits
        ? [
            {
              value: chemical.occupationalExposureLimits.twa || 0,
              units: chemical.occupationalExposureLimits.units,
              type: "TWA (8-hour)",
              source: "OEL Database",
            },
          ]
        : undefined,
      emergencyMeasures,
      reviewDate: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 1 year in future
    };
  }

  /**
   * Enhance the assessment with AI insights
   */
  private async enhanceWithAI(
    chemical: ChemicalRiskData,
    scenario: ExposureScenario,
    workplace: WorkplaceData,
    baseAssessment: RiskAssessmentResult,
  ): Promise<RiskAssessmentResult> {
    try {
      // Create a detailed prompt for the AI
      const aiPrompt = `
Analyze this chemical risk assessment data and enhance the baseline assessment:

CHEMICAL DATA:
${JSON.stringify(chemical, null, 2)}

EXPOSURE SCENARIO:
${JSON.stringify(scenario, null, 2)}

WORKPLACE DATA:
${JSON.stringify(workplace, null, 2)}

BASELINE RISK ASSESSMENT:
${JSON.stringify(baseAssessment, null, 2)}

Please analyze the information above and enhance the risk assessment with additional insights.
Focus on:
1. Any hazard interactions not captured in the baseline assessment
2. Additional control measures that would be specifically effective
3. More precise PPE recommendations based on the specific chemical properties
4. Specialized emergency procedures needed for this chemical
5. Any additional reasoning notes that provide valuable context for risk management

Format your response as a JSON object that includes:
- additionalReasoningNotes: array of strings with additional insights
- enhancedRecommendedControls: array of strings with additional or refined controls
- enhancedRecommendedPPE: array of strings with specific PPE recommendations
- enhancedEmergencyMeasures: array of strings with additional emergency procedures
- suggestedRiskAdjustment: number between -15 and 15 representing suggested adjustment to risk score
- confidenceScore: number between 0 and 1 indicating confidence in enhanced assessment
      `;

      // Get AI analysis
      const result = await aiService.analyzeDocument(aiPrompt, {
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      // Parse AI response
      let aiEnhancements;
      try {
        aiEnhancements =
          typeof result.analysis === "string"
            ? JSON.parse(result.analysis)
            : result.analysis;
      } catch (error) {
        console.error("Error parsing AI response:", error);
        // Return base assessment if can't parse AI response
        return baseAssessment;
      }

      // Merge base assessment with AI enhancements
      const enhancedAssessment = { ...baseAssessment };

      // Update reasoning notes
      if (
        aiEnhancements.additionalReasoningNotes &&
        Array.isArray(aiEnhancements.additionalReasoningNotes)
      ) {
        enhancedAssessment.reasoningNotes = [
          ...baseAssessment.reasoningNotes,
          ...aiEnhancements.additionalReasoningNotes,
        ];
      }

      // Update recommended controls
      if (
        aiEnhancements.enhancedRecommendedControls &&
        Array.isArray(aiEnhancements.enhancedRecommendedControls)
      ) {
        enhancedAssessment.recommendedControls = [
          ...new Set([
            ...baseAssessment.recommendedControls,
            ...aiEnhancements.enhancedRecommendedControls,
          ]),
        ];
      }

      // Update recommended PPE
      if (
        aiEnhancements.enhancedRecommendedPPE &&
        Array.isArray(aiEnhancements.enhancedRecommendedPPE)
      ) {
        enhancedAssessment.recommendedPPE = [
          ...new Set([
            ...baseAssessment.recommendedPPE,
            ...aiEnhancements.enhancedRecommendedPPE,
          ]),
        ];
      }

      // Update emergency measures
      if (
        aiEnhancements.enhancedEmergencyMeasures &&
        Array.isArray(aiEnhancements.enhancedEmergencyMeasures)
      ) {
        enhancedAssessment.emergencyMeasures = [
          ...new Set([
            ...baseAssessment.emergencyMeasures,
            ...aiEnhancements.enhancedEmergencyMeasures,
          ]),
        ];
      }

      // Adjust risk score if suggested
      if (typeof aiEnhancements.suggestedRiskAdjustment === "number") {
        const adjustment = Math.max(
          -15,
          Math.min(15, aiEnhancements.suggestedRiskAdjustment),
        );
        enhancedAssessment.riskScore = Math.max(
          0,
          Math.min(100, baseAssessment.riskScore + adjustment),
        );
        enhancedAssessment.riskLevel = this.riskScoreToLevel(
          enhancedAssessment.riskScore,
        );
      }

      // Update confidence score if provided
      if (typeof aiEnhancements.confidenceScore === "number") {
        enhancedAssessment.confidenceScore = Math.max(
          0,
          Math.min(1, aiEnhancements.confidenceScore),
        );
      }

      // Add timestamp of enhancement
      enhancedAssessment.timestamp = new Date().toISOString();

      return enhancedAssessment;
    } catch (error) {
      console.error("Error in AI enhancement:", error);
      return baseAssessment;
    }
  }

  /**
   * Main method to perform risk assessment
   */
  public async performRiskAssessment(
    chemical: ChemicalRiskData,
    scenario: ExposureScenario,
    workplace: WorkplaceData,
  ): Promise<RiskAssessmentResult> {
    // First, perform rules-based assessment
    const baseAssessment = this.performRulesBasedAssessment(
      chemical,
      scenario,
      workplace,
    );

    // Then enhance with AI if available
    try {
      const enhancedAssessment = await this.enhanceWithAI(
        chemical,
        scenario,
        workplace,
        baseAssessment,
      );
      return enhancedAssessment;
    } catch (error) {
      console.error(
        "Error enhancing with AI, returning rules-based assessment:",
        error,
      );
      return baseAssessment;
    }
  }

  /**
   * Batch process multiple scenarios for the same chemical
   */
  public async batchProcessScenarios(
    chemical: ChemicalRiskData,
    scenarios: ExposureScenario[],
    workplace: WorkplaceData,
  ): Promise<RiskAssessmentResult[]> {
    const results: RiskAssessmentResult[] = [];

    for (const scenario of scenarios) {
      const assessment = await this.performRiskAssessment(
        chemical,
        scenario,
        workplace,
      );
      results.push(assessment);
    }

    return results;
  }
}

// Export singleton instance
export const chemicalRiskAssessmentService =
  new ChemicalRiskAssessmentService();
