import { aiService } from "../ai/chemcheckService";

// Define chemical properties relevant to hazard prediction
export interface ChemicalData {
  name: string;
  formula?: string;
  casNumber?: string;
  physicalState?: string;
  functionalGroups?: string[];
  molecularWeight?: number;
  boilingPoint?: number;
  flashPoint?: number;
  autoignitionTemp?: number;
  vaporPressure?: number;
  waterSolubility?: string;
  ph?: number;
  reactivityNotes?: string[];
}

// Hazard categories with descriptions
export enum HazardCategory {
  FLAMMABLE = "Flammable",
  EXPLOSIVE = "Explosive",
  OXIDIZER = "Oxidizer",
  CORROSIVE = "Corrosive",
  TOXIC = "Toxic",
  CARCINOGENIC = "Carcinogenic",
  MUTAGENIC = "Mutagenic",
  REPRODUCTIVE = "Reproductive Toxin",
  ENVIRONMENTAL = "Environmental Hazard",
  COMPRESSED_GAS = "Compressed Gas",
  PYROPHORIC = "Pyrophoric",
  WATER_REACTIVE = "Water Reactive",
  ORGANIC_PEROXIDE = "Organic Peroxide",
  ACUTE_TOXICITY = "Acute Toxicity",
  SKIN_IRRITANT = "Skin Irritant/Corrosive",
  EYE_DAMAGE = "Eye Damage",
  SENSITIZATION = "Respiratory/Skin Sensitization",
  ASPIRATION = "Aspiration Hazard",
}

// The prediction model
export interface HazardPrediction {
  hazardCategory: HazardCategory;
  probabilityScore: number; // 0-1 score
  severityLevel: "Low" | "Medium" | "High" | "Extreme";
  explanation: string;
  precautionaryMeasures: string[];
  confidence: number;
}

// Chemical fingerprints for known hazardous substances
const KNOWN_HAZARD_FINGERPRINTS = {
  flammable: [
    {
      pattern: "alcohol",
      keywords: ["ethanol", "methanol", "isopropanol", "propanol"],
    },
    { pattern: "ketone", keywords: ["acetone", "butanone", "MEK"] },
    { pattern: "aldehyde", keywords: ["formaldehyde", "acetaldehyde"] },
    {
      pattern: "hydrocarbon",
      keywords: ["hexane", "heptane", "gasoline", "petroleum"],
    },
  ],
  oxidizer: [
    {
      pattern: "peroxide",
      keywords: ["hydrogen peroxide", "benzoyl peroxide"],
    },
    { pattern: "nitrate", keywords: ["ammonium nitrate", "potassium nitrate"] },
    {
      pattern: "perchlorate",
      keywords: ["perchloric acid", "ammonium perchlorate"],
    },
  ],
  corrosive: [
    {
      pattern: "strong acid",
      keywords: ["sulfuric acid", "hydrochloric acid", "nitric acid"],
    },
    {
      pattern: "strong base",
      keywords: ["sodium hydroxide", "potassium hydroxide", "lye"],
    },
  ],
  toxic: [
    { pattern: "cyanide", keywords: ["hydrogen cyanide", "potassium cyanide"] },
    { pattern: "mercury", keywords: ["mercury", "methylmercury"] },
    { pattern: "arsenic", keywords: ["arsenic", "arsine"] },
  ],
};

/**
 * Hazard Prediction Service
 * Uses both rule-based and ML-powered analysis to predict chemical hazards
 */
export class HazardPredictionService {
  // Map of CAS numbers to known hazards for quick lookup
  private knownHazardsMap: Map<string, HazardPrediction[]> = new Map();

  constructor() {
    // Initialize with some commonly known hazardous chemicals
    this.initializeKnownHazards();
  }

  // Initialize the known hazards database
  private initializeKnownHazards() {
    // Acetone (CAS: 67-64-1)
    this.knownHazardsMap.set("67-64-1", [
      {
        hazardCategory: HazardCategory.FLAMMABLE,
        probabilityScore: 0.95,
        severityLevel: "High",
        explanation:
          "Highly flammable liquid and vapor with low flash point (-20°C)",
        precautionaryMeasures: [
          "Keep away from heat, hot surfaces, sparks, open flames",
          "Keep container tightly closed",
          "Ground and bond container and receiving equipment",
          "Use explosion-proof equipment",
        ],
        confidence: 0.98,
      },
      {
        hazardCategory: HazardCategory.EYE_DAMAGE,
        probabilityScore: 0.85,
        severityLevel: "Medium",
        explanation: "Causes serious eye irritation",
        precautionaryMeasures: [
          "Wear eye protection",
          "If in eyes: Rinse cautiously with water for several minutes",
        ],
        confidence: 0.9,
      },
    ]);

    // Sulfuric Acid (CAS: 7664-93-9)
    this.knownHazardsMap.set("7664-93-9", [
      {
        hazardCategory: HazardCategory.CORROSIVE,
        probabilityScore: 0.98,
        severityLevel: "Extreme",
        explanation: "Causes severe skin burns and eye damage",
        precautionaryMeasures: [
          "Do not breathe dust/fume/gas/mist/vapors/spray",
          "Wear protective gloves/protective clothing/eye protection/face protection",
          "IF ON SKIN (or hair): Remove immediately all contaminated clothing. Rinse skin with water",
        ],
        confidence: 0.99,
      },
    ]);

    // Hydrogen Peroxide (CAS: 7722-84-1)
    this.knownHazardsMap.set("7722-84-1", [
      {
        hazardCategory: HazardCategory.OXIDIZER,
        probabilityScore: 0.92,
        severityLevel: "High",
        explanation: "Strong oxidizer that may intensify fire",
        precautionaryMeasures: [
          "Keep away from clothing and other combustible materials",
          "Store away from flammable materials",
          "Wear fire/flame resistant clothing",
        ],
        confidence: 0.95,
      },
      {
        hazardCategory: HazardCategory.CORROSIVE,
        probabilityScore: 0.85,
        severityLevel: "Medium",
        explanation: "Causes skin irritation and serious eye damage",
        precautionaryMeasures: [
          "Wear protective gloves and eye protection",
          "If on skin: Wash with plenty of water",
        ],
        confidence: 0.9,
      },
    ]);
  }

  // Apply pattern-based matching to identify hazards based on chemical properties
  private detectHazardsFromPatterns(
    chemical: ChemicalData,
  ): HazardPrediction[] {
    const hazards: HazardPrediction[] = [];
    const chemicalNameLower = chemical.name.toLowerCase();

    // Check for flammability based on properties and name
    if (chemical.flashPoint !== undefined && chemical.flashPoint < 60) {
      // Flash point below 60°C is typically flammable
      hazards.push({
        hazardCategory: HazardCategory.FLAMMABLE,
        probabilityScore: 0.9,
        severityLevel: chemical.flashPoint < 23 ? "High" : "Medium",
        explanation: `Flammable based on flash point: ${chemical.flashPoint}°C`,
        precautionaryMeasures: [
          "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources",
          "Keep container tightly closed",
          "Ground and bond container and receiving equipment",
        ],
        confidence: 0.95,
      });
    }

    // Check known fingerprints
    for (const [hazardType, fingerprints] of Object.entries(
      KNOWN_HAZARD_FINGERPRINTS,
    )) {
      for (const fingerprint of fingerprints) {
        if (
          chemicalNameLower.includes(fingerprint.pattern) ||
          fingerprint.keywords.some((keyword) =>
            chemicalNameLower.includes(keyword),
          )
        ) {
          const hazardCategory = this.mapHazardTypeToCategory(hazardType);
          if (hazardCategory) {
            hazards.push({
              hazardCategory,
              probabilityScore: 0.8,
              severityLevel: "Medium",
              explanation: `Contains ${fingerprint.pattern} group known to be ${hazardType}`,
              precautionaryMeasures:
                this.getDefaultPrecautionsForHazard(hazardCategory),
              confidence: 0.85,
            });
          }
        }
      }
    }

    // Check physical state-based hazards
    if (chemical.physicalState) {
      const state = chemical.physicalState.toLowerCase();

      if (state.includes("gas") || state.includes("compressed")) {
        hazards.push({
          hazardCategory: HazardCategory.COMPRESSED_GAS,
          probabilityScore: 0.85,
          severityLevel: "Medium",
          explanation: "Compressed or liquefied gas under pressure",
          precautionaryMeasures: [
            "Protect from sunlight",
            "Store in a well-ventilated place",
            "Do not expose to temperatures exceeding 50°C/122°F",
          ],
          confidence: 0.9,
        });
      }

      if (
        state.includes("corrosive") ||
        (chemical.ph !== undefined && (chemical.ph < 2 || chemical.ph > 11.5))
      ) {
        hazards.push({
          hazardCategory: HazardCategory.CORROSIVE,
          probabilityScore: 0.9,
          severityLevel: "High",
          explanation: `Corrosive based on pH: ${chemical.ph}`,
          precautionaryMeasures: [
            "Do not breathe dust or mist",
            "Wear protective gloves/protective clothing/eye protection/face protection",
            "Store locked up",
          ],
          confidence: 0.92,
        });
      }
    }

    // Check for water reactivity from notes
    if (
      chemical.reactivityNotes?.some(
        (note) =>
          note.toLowerCase().includes("water reactive") ||
          note.toLowerCase().includes("reacts with water"),
      )
    ) {
      hazards.push({
        hazardCategory: HazardCategory.WATER_REACTIVE,
        probabilityScore: 0.85,
        severityLevel: "High",
        explanation: "Reacts with water to produce flammable or toxic gases",
        precautionaryMeasures: [
          "Keep away from any possible contact with water",
          "Handle under inert gas",
          "Protect from moisture",
        ],
        confidence: 0.88,
      });
    }

    return hazards;
  }

  // Map hazard type strings to enum values
  private mapHazardTypeToCategory(hazardType: string): HazardCategory | null {
    switch (hazardType.toLowerCase()) {
      case "flammable":
        return HazardCategory.FLAMMABLE;
      case "oxidizer":
        return HazardCategory.OXIDIZER;
      case "corrosive":
        return HazardCategory.CORROSIVE;
      case "toxic":
        return HazardCategory.TOXIC;
      case "carcinogenic":
        return HazardCategory.CARCINOGENIC;
      case "explosive":
        return HazardCategory.EXPLOSIVE;
      default:
        return null;
    }
  }

  // Default precautions based on hazard category
  private getDefaultPrecautionsForHazard(category: HazardCategory): string[] {
    switch (category) {
      case HazardCategory.FLAMMABLE:
        return [
          "Keep away from heat, hot surfaces, sparks, open flames",
          "Keep container tightly closed",
          "Ground and bond container and receiving equipment",
        ];
      case HazardCategory.OXIDIZER:
        return [
          "Keep away from clothing and other combustible materials",
          "Store away from flammable materials",
        ];
      case HazardCategory.CORROSIVE:
        return [
          "Do not breathe dust/fume/gas/mist/vapors/spray",
          "Wear protective gloves/protective clothing/eye protection/face protection",
        ];
      case HazardCategory.TOXIC:
        return [
          "Do not breathe dust/fume/gas/mist/vapors/spray",
          "Wash thoroughly after handling",
          "Do not eat, drink or smoke when using this product",
        ];
      default:
        return [
          "Handle in accordance with good industrial hygiene and safety procedures",
        ];
    }
  }

  // Use AI to predict hazards when other methods are insufficient
  private async predictHazardsWithAI(
    chemical: ChemicalData,
  ): Promise<HazardPrediction[]> {
    try {
      // Prepare chemical data for AI analysis
      const chemicalData = `
Chemical Name: ${chemical.name}
Formula: ${chemical.formula || "N/A"}
CAS Number: ${chemical.casNumber || "N/A"}
Physical State: ${chemical.physicalState || "N/A"}
Functional Groups: ${chemical.functionalGroups?.join(", ") || "N/A"}
Molecular Weight: ${chemical.molecularWeight || "N/A"}
Boiling Point: ${chemical.boilingPoint ? `${chemical.boilingPoint}°C` : "N/A"}
Flash Point: ${chemical.flashPoint ? `${chemical.flashPoint}°C` : "N/A"}
Auto-ignition Temperature: ${chemical.autoignitionTemp ? `${chemical.autoignitionTemp}°C` : "N/A"}
Vapor Pressure: ${chemical.vaporPressure || "N/A"}
Water Solubility: ${chemical.waterSolubility || "N/A"}
pH: ${chemical.ph || "N/A"}
Reactivity Notes: ${chemical.reactivityNotes?.join(", ") || "N/A"}
`;

      // Submit to AI service for analysis
      const analysisPrompt = `Analyze the following chemical and predict its hazards:
${chemicalData}

Based on the chemical properties, predict the top 3 most likely hazards for this substance.
For each hazard, include:
1. Hazard category (select from: ${Object.values(HazardCategory).join(", ")})
2. Probability score (0-1)
3. Severity level (Low, Medium, High, or Extreme)
4. Brief explanation of why this hazard applies
5. 2-4 precautionary measures to mitigate this hazard
6. Confidence in this prediction (0-1)

Format your response as a JSON array of hazard predictions:
[
  {
    "hazardCategory": "Category name",
    "probabilityScore": 0.X,
    "severityLevel": "Level",
    "explanation": "Brief explanation",
    "precautionaryMeasures": ["Measure 1", "Measure 2"],
    "confidence": 0.X
  },
  ...
]
`;

      const result = await aiService.analyzeDocument(analysisPrompt, {
        temperature: 0.2, // Low temperature for more deterministic results
        response_format: { type: "json_object" },
      });

      // Parse the AI response
      try {
        let predictions: HazardPrediction[] = [];

        if (result.analysis) {
          const parsedResponse =
            typeof result.analysis === "string"
              ? JSON.parse(result.analysis)
              : result.analysis;

          if (Array.isArray(parsedResponse)) {
            // Convert the response to proper HazardPrediction objects
            predictions = parsedResponse.map((item) => ({
              hazardCategory: this.validateHazardCategory(item.hazardCategory),
              probabilityScore:
                typeof item.probabilityScore === "number"
                  ? item.probabilityScore
                  : 0.5,
              severityLevel: this.validateSeverityLevel(item.severityLevel),
              explanation: item.explanation || "No explanation provided",
              precautionaryMeasures: Array.isArray(item.precautionaryMeasures)
                ? item.precautionaryMeasures
                : ["Handle with care"],
              confidence:
                typeof item.confidence === "number" ? item.confidence : 0.5,
            }));
          }
        }

        // Return validated predictions, or fallback if empty
        return predictions.length > 0
          ? predictions
          : this.getFallbackPrediction(chemical);
      } catch (e) {
        console.error("Error parsing AI hazard prediction:", e);
        return this.getFallbackPrediction(chemical);
      }
    } catch (error) {
      console.error("Error in AI hazard prediction:", error);
      return this.getFallbackPrediction(chemical);
    }
  }

  // Validate hazard category from AI response
  private validateHazardCategory(category: string): HazardCategory {
    if (!category) return HazardCategory.FLAMMABLE; // Default

    // Try to match the input to a valid category
    const normalizedCategory = category.toUpperCase().replace(/[_\s-]/g, "_");

    for (const validCategory of Object.values(HazardCategory)) {
      const normalizedValidCategory = validCategory
        .toUpperCase()
        .replace(/[_\s-]/g, "_");
      if (
        normalizedCategory === normalizedValidCategory ||
        normalizedCategory.includes(normalizedValidCategory) ||
        normalizedValidCategory.includes(normalizedCategory)
      ) {
        return validCategory;
      }
    }

    // If no match found, return a sensible default
    if (normalizedCategory.includes("TOXIC")) return HazardCategory.TOXIC;
    if (normalizedCategory.includes("FLAM")) return HazardCategory.FLAMMABLE;
    if (normalizedCategory.includes("CORR")) return HazardCategory.CORROSIVE;
    if (normalizedCategory.includes("OXI")) return HazardCategory.OXIDIZER;

    return HazardCategory.FLAMMABLE; // Default fallback
  }

  // Validate severity level from AI response
  private validateSeverityLevel(
    level: string,
  ): "Low" | "Medium" | "High" | "Extreme" {
    if (!level) return "Medium"; // Default

    const normalizedLevel = level.toLowerCase();

    if (
      normalizedLevel.includes("extreme") ||
      normalizedLevel.includes("very high")
    )
      return "Extreme";
    if (normalizedLevel.includes("high") || normalizedLevel.includes("severe"))
      return "High";
    if (
      normalizedLevel.includes("medium") ||
      normalizedLevel.includes("moderate")
    )
      return "Medium";
    if (normalizedLevel.includes("low") || normalizedLevel.includes("mild"))
      return "Low";

    return "Medium"; // Default fallback
  }

  // Generate a fallback prediction if AI analysis fails
  private getFallbackPrediction(chemical: ChemicalData): HazardPrediction[] {
    return [
      {
        hazardCategory: HazardCategory.FLAMMABLE,
        probabilityScore: 0.5,
        severityLevel: "Medium",
        explanation:
          "Generic hazard prediction when specific data is unavailable",
        precautionaryMeasures: [
          "Handle with care",
          "Follow standard laboratory safety procedures",
          "Consult the Safety Data Sheet (SDS)",
        ],
        confidence: 0.3,
      },
    ];
  }

  /**
   * Public method to predict hazards for a chemical
   * First checks known database, then patterns, then AI
   */
  async predictHazards(chemical: ChemicalData): Promise<HazardPrediction[]> {
    // Check if we have this chemical in our known hazards database by CAS number
    if (chemical.casNumber && this.knownHazardsMap.has(chemical.casNumber)) {
      return this.knownHazardsMap.get(chemical.casNumber) || [];
    }

    // Apply pattern-based detection
    const patternHazards = this.detectHazardsFromPatterns(chemical);
    if (patternHazards.length > 0) {
      return patternHazards;
    }

    // If no results from patterns, use AI
    return this.predictHazardsWithAI(chemical);
  }

  /**
   * Batch prediction for multiple chemicals
   */
  async batchPredictHazards(
    chemicals: ChemicalData[],
  ): Promise<Map<string, HazardPrediction[]>> {
    const results = new Map<string, HazardPrediction[]>();

    for (const chemical of chemicals) {
      const hazards = await this.predictHazards(chemical);
      results.set(chemical.name, hazards);
    }

    return results;
  }
}

// Export singleton instance
export const hazardPredictionService = new HazardPredictionService();
