import { aiService } from "../ai/chemcheckService";

// Define hazard interaction levels
export enum InteractionLevel {
  SAFE = "SAFE",
  CAUTION = "CAUTION",
  DANGER = "DANGER",
  EXTREME_DANGER = "EXTREME_DANGER",
  UNKNOWN = "UNKNOWN",
}

// Define chemical properties relevant to compatibility
export interface ChemicalProperties {
  id: string;
  name: string;
  formula?: string;
  casNumber?: string;
  hazardLevel?: string;
  physicalState?: string;
  incompatibles?: string[];
  storageConditions?: string[];
  reactivityHazards?: string[];
}

// Define the compatibility result type
export interface CompatibilityResult {
  level: InteractionLevel;
  explanation: string;
  recommendations: string[];
  confidence: number;
}

// Common chemical incompatibility rules database
const CHEMICAL_INCOMPATIBILITY_RULES = [
  {
    pattern: ["acid", "base"],
    level: InteractionLevel.DANGER,
    explanation: "Acids and bases can react violently",
  },
  {
    pattern: ["acid", "cyanide"],
    level: InteractionLevel.EXTREME_DANGER,
    explanation: "Can produce highly toxic hydrogen cyanide gas",
  },
  {
    pattern: ["oxidizer", "flammable"],
    level: InteractionLevel.EXTREME_DANGER,
    explanation: "Can cause fire or explosion",
  },
  {
    pattern: ["water reactive", "water"],
    level: InteractionLevel.DANGER,
    explanation: "Can react violently with water",
  },
  {
    pattern: ["peroxide", "organic"],
    level: InteractionLevel.DANGER,
    explanation: "Can cause explosive reactions",
  },
  {
    pattern: ["bleach", "ammonia"],
    level: InteractionLevel.EXTREME_DANGER,
    explanation: "Can produce toxic chloramine gas",
  },
];

// Some predefined classifications to assist the compatibility system
const CHEMICAL_CLASSIFICATIONS = {
  acids: [
    "sulfuric acid",
    "hydrochloric acid",
    "nitric acid",
    "phosphoric acid",
    "acetic acid",
  ],
  bases: [
    "sodium hydroxide",
    "potassium hydroxide",
    "ammonia",
    "calcium hydroxide",
  ],
  oxidizers: [
    "hydrogen peroxide",
    "potassium permanganate",
    "sodium hypochlorite",
    "nitric acid",
    "bleach",
  ],
  flammables: [
    "acetone",
    "ethanol",
    "methanol",
    "toluene",
    "gasoline",
    "hexane",
  ],
  waterReactive: [
    "sodium",
    "potassium",
    "lithium",
    "calcium carbide",
    "aluminum phosphide",
  ],
  peroxides: [
    "hydrogen peroxide",
    "benzoyl peroxide",
    "methyl ethyl ketone peroxide",
  ],
  toxics: ["cyanide", "arsenic", "mercury", "lead compounds", "formaldehyde"],
};

/**
 * Chemical Compatibility Prediction Service
 * Uses both rule-based reasoning and AI analysis to predict chemical compatibility
 */
export class ChemicalCompatibilityService {
  // Rule-based compatibility check using the predefined rules
  private checkRuleBasedCompatibility(
    chemical1: ChemicalProperties,
    chemical2: ChemicalProperties,
  ): CompatibilityResult | null {
    // Check explicit incompatibilities from the chemicals data
    if (
      chemical1.incompatibles?.some(
        (inc) =>
          chemical2.name.toLowerCase().includes(inc.toLowerCase()) ||
          (chemical2.formula &&
            inc.toLowerCase() === chemical2.formula.toLowerCase()),
      )
    ) {
      return {
        level: InteractionLevel.DANGER,
        explanation: `${chemical1.name} is explicitly listed as incompatible with ${chemical2.name}`,
        recommendations: ["Store separately", "Use dedicated storage cabinets"],
        confidence: 0.95,
      };
    }

    // Check chemical groups and classifications
    for (const rule of CHEMICAL_INCOMPATIBILITY_RULES) {
      const pattern1 = rule.pattern[0];
      const pattern2 = rule.pattern[1];

      // Check if chemicals match the rule pattern
      const isMatch =
        (this.matchesPattern(chemical1, pattern1) &&
          this.matchesPattern(chemical2, pattern2)) ||
        (this.matchesPattern(chemical1, pattern2) &&
          this.matchesPattern(chemical2, pattern1));

      if (isMatch) {
        return {
          level: rule.level,
          explanation: rule.explanation,
          recommendations: this.getRecommendations(rule.level),
          confidence: 0.85,
        };
      }
    }

    return null;
  }

  // Helper method to check if a chemical matches a specific pattern/classification
  private matchesPattern(
    chemical: ChemicalProperties,
    pattern: string,
  ): boolean {
    const chemName = chemical.name.toLowerCase();

    // Check direct name matching
    if (chemName.includes(pattern)) return true;

    // Check if belongs to a classification group
    switch (pattern) {
      case "acid":
        return (
          CHEMICAL_CLASSIFICATIONS.acids.some((acid) =>
            chemName.includes(acid),
          ) ||
          (chemical.storageConditions || []).some((cond) =>
            cond.toLowerCase().includes("acid"),
          )
        );
      case "base":
        return CHEMICAL_CLASSIFICATIONS.bases.some((base) =>
          chemName.includes(base),
        );
      case "oxidizer":
        return (
          CHEMICAL_CLASSIFICATIONS.oxidizers.some((ox) =>
            chemName.includes(ox),
          ) ||
          (chemical.hazardLevel === "Extreme" && chemName.includes("oxide"))
        );
      case "flammable":
        return (
          CHEMICAL_CLASSIFICATIONS.flammables.some((fl) =>
            chemName.includes(fl),
          ) ||
          (chemical.storageConditions || []).some(
            (cond) =>
              cond.toLowerCase().includes("flammable") ||
              cond.toLowerCase().includes("fire") ||
              cond.toLowerCase().includes("flame"),
          )
        );
      case "water reactive":
        return CHEMICAL_CLASSIFICATIONS.waterReactive.some((wr) =>
          chemName.includes(wr),
        );
      case "peroxide":
        return CHEMICAL_CLASSIFICATIONS.peroxides.some((p) =>
          chemName.includes(p),
        );
      case "cyanide":
        return chemName.includes("cyanide");
      case "ammonia":
        return chemName.includes("ammonia");
      case "bleach":
        return chemName.includes("bleach") || chemName.includes("hypochlorite");
      default:
        return false;
    }
  }

  // Get safety recommendations based on interaction level
  private getRecommendations(level: InteractionLevel): string[] {
    switch (level) {
      case InteractionLevel.EXTREME_DANGER:
        return [
          "Store in separate hazard class storage areas",
          "Use secondary containment",
          "Implement strict inventory control",
          "Establish emergency response protocols",
          "Train staff on specific hazards",
        ];
      case InteractionLevel.DANGER:
        return [
          "Store in separate cabinets",
          "Use compatible storage containers",
          "Maintain physical separation",
          "Regular safety inspections",
        ];
      case InteractionLevel.CAUTION:
        return [
          "Monitor storage conditions",
          "Use compatible containers",
          "Regular inventory checks",
        ];
      case InteractionLevel.SAFE:
        return [
          "Follow standard storage protocols",
          "Regular inventory management",
        ];
      default:
        return [
          "Consult material safety data sheets",
          "Seek expert advice before storing together",
        ];
    }
  }

  // Use AI to analyze chemical compatibility when rules are insufficient
  private async analyzeWithAI(
    chemical1: ChemicalProperties,
    chemical2: ChemicalProperties,
  ): Promise<CompatibilityResult> {
    try {
      // Prepare chemical data for AI analysis
      const chemicalData = `
Chemical 1: ${chemical1.name} (${chemical1.formula || "N/A"})
CAS: ${chemical1.casNumber || "N/A"}
Hazard Level: ${chemical1.hazardLevel || "N/A"}
Physical State: ${chemical1.physicalState || "N/A"}
Incompatibles: ${chemical1.incompatibles?.join(", ") || "N/A"}
Storage Conditions: ${chemical1.storageConditions?.join(", ") || "N/A"}

Chemical 2: ${chemical2.name} (${chemical2.formula || "N/A"})
CAS: ${chemical2.casNumber || "N/A"}
Hazard Level: ${chemical2.hazardLevel || "N/A"}
Physical State: ${chemical2.physicalState || "N/A"}
Incompatibles: ${chemical2.incompatibles?.join(", ") || "N/A"}
Storage Conditions: ${chemical2.storageConditions?.join(", ") || "N/A"}
`;

      // Submit to AI service for analysis
      const analysisPrompt = `Analyze the compatibility between these two chemicals for storage purposes:
${chemicalData}

Considering chemical properties, reactivity, and safety considerations, provide:
1. Compatibility level (SAFE, CAUTION, DANGER, or EXTREME_DANGER)
2. Brief explanation of the compatibility rating
3. Storage recommendations
4. Confidence level (0-1)

Format your response as JSON:
{
  "level": "LEVEL",
  "explanation": "Short explanation",
  "recommendations": ["Rec 1", "Rec 2"],
  "confidence": 0.X
}`;

      const result = await aiService.analyzeDocument(analysisPrompt, {
        temperature: 0.1, // Low temperature for more deterministic results
        response_format: { type: "json_object" },
      });

      // Parse the AI response
      try {
        const parsedResponse =
          typeof result.analysis === "string"
            ? JSON.parse(result.analysis)
            : result.analysis;

        // Validate required fields
        if (
          parsedResponse.level &&
          parsedResponse.explanation &&
          parsedResponse.recommendations &&
          parsedResponse.confidence !== undefined
        ) {
          return {
            level: this.validateLevel(parsedResponse.level),
            explanation: parsedResponse.explanation,
            recommendations: Array.isArray(parsedResponse.recommendations)
              ? parsedResponse.recommendations
              : [parsedResponse.recommendations],
            confidence:
              typeof parsedResponse.confidence === "number"
                ? parsedResponse.confidence
                : 0.5,
          };
        }
      } catch (e) {
        console.error("Error parsing AI compatibility analysis:", e);
      }

      // Fallback in case the AI response parsing fails
      return {
        level: InteractionLevel.UNKNOWN,
        explanation: "AI analysis was inconclusive",
        recommendations: [
          "Consult SDS",
          "Use professional judgment",
          "Consider separation",
        ],
        confidence: 0.3,
      };
    } catch (error) {
      console.error("Error in AI compatibility analysis:", error);
      return {
        level: InteractionLevel.UNKNOWN,
        explanation: "Unable to perform AI analysis",
        recommendations: [
          "Consult SDS",
          "Use professional judgment",
          "Consider separation",
        ],
        confidence: 0.1,
      };
    }
  }

  // Validate and normalize the interaction level
  private validateLevel(level: string): InteractionLevel {
    level = level.toUpperCase();

    switch (level) {
      case "SAFE":
        return InteractionLevel.SAFE;
      case "CAUTION":
        return InteractionLevel.CAUTION;
      case "DANGER":
        return InteractionLevel.DANGER;
      case "EXTREME_DANGER":
      case "EXTREME DANGER":
      case "EXTREME":
        return InteractionLevel.EXTREME_DANGER;
      default:
        return InteractionLevel.UNKNOWN;
    }
  }

  /**
   * Public method to predict chemical compatibility
   * Uses both rule-based and AI approaches
   */
  async predictCompatibility(
    chemical1: ChemicalProperties,
    chemical2: ChemicalProperties,
  ): Promise<CompatibilityResult> {
    // First try the rule-based approach
    const ruleBasedResult = this.checkRuleBasedCompatibility(
      chemical1,
      chemical2,
    );

    if (ruleBasedResult) {
      return ruleBasedResult;
    }

    // If rule-based approach doesn't find a match, use AI
    return this.analyzeWithAI(chemical1, chemical2);
  }

  /**
   * Check compatibility for multiple chemicals at once
   * Returns a compatibility matrix
   */
  async checkBatchCompatibility(chemicals: ChemicalProperties[]): Promise<{
    matrix: Array<Array<CompatibilityResult | null>>;
    summary: string;
    criticalPairs: Array<{
      chem1: string;
      chem2: string;
      result: CompatibilityResult;
    }>;
  }> {
    const n = chemicals.length;
    const matrix: Array<Array<CompatibilityResult | null>> = Array(n)
      .fill(null)
      .map(() => Array(n).fill(null));
    const criticalPairs: Array<{
      chem1: string;
      chem2: string;
      result: CompatibilityResult;
    }> = [];

    // Populate the compatibility matrix
    for (let i = 0; i < n; i++) {
      // Diagonal is always safe (chemical with itself)
      matrix[i][i] = {
        level: InteractionLevel.SAFE,
        explanation: "Same chemical",
        recommendations: ["Standard storage procedures"],
        confidence: 1.0,
      };

      // Check compatibility with other chemicals
      for (let j = i + 1; j < n; j++) {
        const result = await this.predictCompatibility(
          chemicals[i],
          chemicals[j],
        );
        matrix[i][j] = result;
        matrix[j][i] = result; // Compatibility is symmetric

        // Track critical pairs (danger or extreme danger)
        if (
          result.level === InteractionLevel.DANGER ||
          result.level === InteractionLevel.EXTREME_DANGER
        ) {
          criticalPairs.push({
            chem1: chemicals[i].name,
            chem2: chemicals[j].name,
            result,
          });
        }
      }
    }

    // Generate summary
    let summary = "Chemical Compatibility Analysis Complete";
    if (criticalPairs.length > 0) {
      summary = `WARNING: ${criticalPairs.length} incompatible chemical pair(s) detected. Review critical pairs section for details.`;
    }

    return {
      matrix,
      summary,
      criticalPairs,
    };
  }
}

// Export singleton instance
export const chemicalCompatibilityService = new ChemicalCompatibilityService();
