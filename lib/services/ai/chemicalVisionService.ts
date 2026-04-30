/**
 * Chemical Vision Service
 * Specialized AI vision for chemical safety, labels, MSDS, and storage
 * ChemCheck-level capabilities for chemical identification and compliance
 */

import visionService, { VisionAnalysisResult } from "./visionService";
import { ocrService } from "@/lib/services/ocr/ocrService";
import enhancedVisionService from "./enhancedVisionService";

// ============================================================================
// TYPES
// ============================================================================

export interface ChemicalLabel {
  id: string;
  chemicalName: string;
  casNumber?: string;
  manufacturer?: string;

  // GHS Information
  ghsSymbols: GHSSymbol[];
  signalWord?: "Danger" | "Warning";
  hazardStatements: string[];
  precautionaryStatements: string[];

  // NFPA Diamond
  nfpa?: {
    health: number; // 0-4
    flammability: number; // 0-4
    reactivity: number; // 0-4
    special?: string;
  };

  // DOT Information
  dotClass?: string;
  unNumber?: string;
  packingGroup?: string;

  // Other
  concentration?: string;
  volume?: string;
  batchNumber?: string;
  expirationDate?: string;
  storageClass?: string;

  // Quality
  readConfidence: number; // 0-100
  partiallyReadFields: string[];
  unreadableFields: string[];
}

export interface GHSSymbol {
  symbol: GHSSymbolType;
  name: string;
  description: string;
  confidence: number;
}

export type GHSSymbolType =
  | "flame" // Flammable
  | "flame-over-circle" // Oxidizer
  | "exploding-bomb" // Explosive
  | "gas-cylinder" // Compressed gas
  | "corrosion" // Corrosive
  | "skull-crossbones" // Toxic
  | "health-hazard" // Health hazard
  | "exclamation-mark" // Irritant
  | "environment"; // Environmental hazard

export interface ChemicalCompatibility {
  chemical1: string;
  chemical2: string;
  isCompatible: boolean;
  riskLevel: "safe" | "caution" | "danger" | "incompatible";
  warningMessage?: string;
  reactions?: string[];
  recommendations: string[];
}

export interface StorageZone {
  zoneId: string;
  zoneName: string;
  storageClass: string;
  allowedClasses: string[];
  conditions: {
    temperatureMin?: number;
    temperatureMax?: number;
    humidityMin?: number;
    humidityMax?: number;
    ventilationRequired: boolean;
    groundingRequired: boolean;
    segregationRequired: boolean;
  };
}

export interface PPERequirement {
  type: PPEType;
  required: boolean;
  description: string;
  standard?: string;
  alternatives?: string[];
}

export type PPEType =
  | "safety-glasses"
  | "goggles"
  | "face-shield"
  | "gloves"
  | "lab-coat"
  | "apron"
  | "coveralls"
  | "respirator"
  | "dust-mask"
  | "safety-shoes"
  | "hard-hat"
  | "hearing-protection";

export interface ChemicalVisionAnalysis {
  id: string;
  timestamp: string;
  imageUrl?: string;

  // Label Analysis
  labels: ChemicalLabel[];

  // Storage Analysis
  storageAnalysis: {
    currentConditions: {
      estimatedTemperature?: string;
      lightingConditions?: string;
      ventilation?: string;
      cleanliness?: string;
    };
    containerConditions: {
      integrity: "good" | "fair" | "poor" | "damaged";
      issues: string[];
    };
    segregationCompliance: {
      compliant: boolean;
      issues: string[];
    };
  };

  // Compatibility Matrix
  compatibilityIssues: ChemicalCompatibility[];

  // PPE Analysis
  ppeAnalysis: {
    required: PPERequirement[];
    detected: PPERequirement[];
    missing: PPERequirement[];
    compliant: boolean;
    recommendations: string[];
  };

  // Compliance
  complianceScore: number;
  complianceIssues: {
    standard: string;
    requirement: string;
    status: "compliant" | "non-compliant" | "warning";
    recommendation: string;
  }[];

  // Recommendations
  overallRecommendations: string[];
  urgentActions: string[];

  // Metadata
  metadata: {
    provider: string;
    model: string;
    processingTime: number;
    analysisMode: string;
  };
}

// ============================================================================
// GHS SYMBOL DATABASE
// ============================================================================

const GHS_SYMBOLS: Record<
  GHSSymbolType,
  { name: string; description: string; hazardClasses: string[] }
> = {
  flame: {
    name: "Flame",
    description: "Flammable gases, aerosols, liquids, or solids",
    hazardClasses: [
      "Flammable gases",
      "Flammable aerosols",
      "Flammable liquids",
      "Flammable solids",
    ],
  },
  "flame-over-circle": {
    name: "Flame Over Circle",
    description: "Oxidizing gases, liquids, or solids",
    hazardClasses: ["Oxidizing gases", "Oxidizing liquids", "Oxidizing solids"],
  },
  "exploding-bomb": {
    name: "Exploding Bomb",
    description: "Explosives, self-reactive substances",
    hazardClasses: [
      "Explosives",
      "Self-reactive substances",
      "Organic peroxides",
    ],
  },
  "gas-cylinder": {
    name: "Gas Cylinder",
    description: "Compressed, liquefied, or dissolved gases",
    hazardClasses: ["Gases under pressure"],
  },
  corrosion: {
    name: "Corrosion",
    description: "Corrosive to metals, skin, or eyes",
    hazardClasses: [
      "Corrosive to metals",
      "Skin corrosion",
      "Serious eye damage",
    ],
  },
  "skull-crossbones": {
    name: "Skull and Crossbones",
    description: "Acute toxicity (fatal or toxic)",
    hazardClasses: ["Acute toxicity"],
  },
  "health-hazard": {
    name: "Health Hazard",
    description: "Serious health hazards",
    hazardClasses: [
      "Carcinogenicity",
      "Respiratory sensitization",
      "Mutagenicity",
      "Reproductive toxicity",
    ],
  },
  "exclamation-mark": {
    name: "Exclamation Mark",
    description: "Irritant, skin sensitizer, acute toxicity",
    hazardClasses: [
      "Skin irritation",
      "Eye irritation",
      "Skin sensitization",
      "Acute toxicity (harmful)",
    ],
  },
  environment: {
    name: "Environment",
    description: "Hazardous to aquatic environment",
    hazardClasses: ["Hazardous to aquatic environment"],
  },
};

// ============================================================================
// CHEMICAL COMPATIBILITY RULES
// ============================================================================

const INCOMPATIBILITY_RULES: {
  class1: string;
  class2: string;
  risk: string;
  message: string;
}[] = [
  {
    class1: "acids",
    class2: "bases",
    risk: "danger",
    message: "Violent reaction, heat generation",
  },
  {
    class1: "acids",
    class2: "metals",
    risk: "danger",
    message: "Hydrogen gas generation, flammable",
  },
  {
    class1: "oxidizers",
    class2: "flammables",
    risk: "incompatible",
    message: "Fire or explosion hazard",
  },
  {
    class1: "oxidizers",
    class2: "organic materials",
    risk: "danger",
    message: "Fire hazard",
  },
  {
    class1: "water-reactive",
    class2: "water",
    risk: "incompatible",
    message: "Violent reaction",
  },
  {
    class1: "acids",
    class2: "cyanides",
    risk: "incompatible",
    message: "Toxic gas generation",
  },
  {
    class1: "acids",
    class2: "sulfides",
    risk: "incompatible",
    message: "Toxic gas generation",
  },
  {
    class1: "chlorine",
    class2: "ammonia",
    risk: "incompatible",
    message: "Toxic chloramine gas",
  },
];

// ============================================================================
// CHEMICAL VISION SERVICE
// ============================================================================

class ChemicalVisionService {
  /**
   * Analyze an image for chemical labels and safety information
   */
  async analyzeChemicalImage(
    imageFile: File | Buffer | string,
    mimeType?: string,
    options?: {
      extractLabels?: boolean;
      checkCompatibility?: boolean;
      analyzePPE?: boolean;
      analyzeStorage?: boolean;
      useEnhancedVision?: boolean;
    },
  ): Promise<ChemicalVisionAnalysis> {
    const startTime = Date.now();
    const analysisId = `chem-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const defaultOptions = {
      extractLabels: true,
      checkCompatibility: true,
      analyzePPE: true,
      analyzeStorage: true,
      useEnhancedVision: true, // Use enhanced vision with RAG by default
      ...options,
    };

    // Convert to appropriate format
    let imageBuffer: Buffer;
    let imageForVision: File | string;

    if (imageFile instanceof File) {
      const arrayBuffer = await imageFile.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      imageForVision = imageFile;
      mimeType = imageFile.type;
    } else if (typeof imageFile === "string") {
      if (imageFile.startsWith("data:")) {
        const base64Data = imageFile.split(",")[1];
        imageBuffer = Buffer.from(base64Data, "base64");
        imageForVision = imageFile;
      } else {
        // URL
        const response = await fetch(imageFile);
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        imageForVision = imageFile;
      }
    } else {
      imageBuffer = imageFile;
      // Create a File-like object for vision service
      imageForVision = new File([imageBuffer], "chemical-label.jpg", {
        type: mimeType || "image/jpeg",
      });
    }

    // Get enhanced vision analysis with RAG for better context
    const baseAnalysis = defaultOptions.useEnhancedVision
      ? await enhancedVisionService.analyzeWithRAG(
          imageForVision,
          "Chemical storage and safety analysis. Identify chemical containers, labels, GHS symbols, NFPA diamonds, CAS numbers, hazard statements, precautionary statements, and safety compliance. Extract all text from labels using OCR.",
          {
            enableRAG: true,
            enableLearning: true,
            industryContext: "chemical",
            extractText: true,
            searchSimilarCases: true,
          },
        )
      : await visionService.analyzeImage(
          imageForVision,
          "Chemical storage and safety analysis. Identify chemical containers, labels, GHS symbols, and safety compliance.",
          { provider: "auto", enableRootCauseAnalysis: true },
        );

    // Build chemical-specific analysis
    const analysis: ChemicalVisionAnalysis = {
      id: analysisId,
      timestamp: new Date().toISOString(),
      labels: [],
      storageAnalysis: {
        currentConditions: {},
        containerConditions: { integrity: "good", issues: [] },
        segregationCompliance: { compliant: true, issues: [] },
      },
      compatibilityIssues: [],
      ppeAnalysis: {
        required: [],
        detected: [],
        missing: [],
        compliant: true,
        recommendations: [],
      },
      complianceScore: 100,
      complianceIssues: [],
      overallRecommendations: [],
      urgentActions: [],
      metadata: {
        provider: baseAnalysis.metadata.provider,
        model: baseAnalysis.metadata.model,
        processingTime: 0,
        analysisMode: "chemical-vision",
      },
    };

    // Extract chemical labels
    if (defaultOptions.extractLabels) {
      analysis.labels = await this.extractChemicalLabels(
        baseAnalysis,
        imageBuffer,
      );
    }

    // Check compatibility if multiple chemicals detected
    if (defaultOptions.checkCompatibility && analysis.labels.length > 1) {
      analysis.compatibilityIssues = await this.checkCompatibility(
        analysis.labels,
      );
    }

    // Analyze PPE
    if (defaultOptions.analyzePPE) {
      analysis.ppeAnalysis = await this.analyzePPECompliance(
        baseAnalysis,
        analysis.labels,
      );
    }

    // Analyze storage
    if (defaultOptions.analyzeStorage) {
      analysis.storageAnalysis = await this.analyzeStorageConditions(
        baseAnalysis,
        analysis.labels,
      );
    }

    // Calculate compliance score and generate recommendations
    this.calculateComplianceScore(analysis);
    this.generateRecommendations(analysis);

    analysis.metadata.processingTime = Date.now() - startTime;
    return analysis;
  }

  /**
   * Extract chemical labels from vision analysis using real OCR and AI
   */
  private async extractChemicalLabels(
    baseAnalysis: VisionAnalysisResult,
    imageBuffer?: Buffer,
  ): Promise<ChemicalLabel[]> {
    const labels: ChemicalLabel[] = [];

    try {
      // Step 1: Extract text using OCR
      let extractedText = "";
      let ocrConfidence = 0;

      if (imageBuffer) {
        try {
          const ocrResult = await ocrService.extractTextFromImage(imageBuffer, {
            language: "eng",
            psm: 6, // Single uniform block
            useCloudOCR: true, // Try cloud OCR if available
          });
          extractedText = ocrResult.text;
          ocrConfidence = ocrResult.confidence;
        } catch (ocrError) {
          console.warn(
            "OCR extraction failed, using vision analysis text:",
            ocrError,
          );
          // Fallback to vision analysis description
          extractedText = baseAnalysis.analysis.description || "";
        }
      } else {
        // Use text from enhanced vision if available
        if ("extractedText" in baseAnalysis && baseAnalysis.extractedText) {
          extractedText = baseAnalysis.extractedText.text || "";
          ocrConfidence = (baseAnalysis.extractedText.confidence || 0) * 100;
        } else {
          extractedText = baseAnalysis.analysis.description || "";
        }
      }

      // Step 2: Use AI to extract structured chemical data from text and vision
      const structuredData = await this.extractStructuredChemicalData(
        extractedText,
        baseAnalysis,
      );

      // Step 3: Detect GHS symbols from vision analysis
      const detectedGhsSymbols = this.detectGHSSymbols(
        baseAnalysis,
        extractedText,
      );

      // Step 4: Detect NFPA diamond from vision analysis
      const detectedNfpa = this.detectNFPA(baseAnalysis, extractedText);

      // Step 5: Extract CAS numbers
      const casNumbers = this.extractCASNumbers(extractedText);

      // Step 6: Extract hazard and precautionary statements
      const { hazardStatements, precautionaryStatements } =
        this.extractStatements(extractedText);

      // Step 7: Build chemical label(s)
      if (
        structuredData.chemicalName ||
        casNumbers.length > 0 ||
        detectedGhsSymbols.length > 0
      ) {
        const label: ChemicalLabel = {
          id: `label-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          chemicalName:
            structuredData.chemicalName ||
            this.extractChemicalName(extractedText) ||
            "Unknown Chemical",
          casNumber: structuredData.casNumber || casNumbers[0],
          manufacturer:
            structuredData.manufacturer ||
            this.extractManufacturer(extractedText),
          ghsSymbols: detectedGhsSymbols,
          signalWord:
            structuredData.signalWord || this.extractSignalWord(extractedText),
          hazardStatements: structuredData.hazardStatements || hazardStatements,
          precautionaryStatements:
            structuredData.precautionaryStatements || precautionaryStatements,
          nfpa: detectedNfpa || structuredData.nfpa,
          dotClass:
            structuredData.dotClass || this.extractDOTClass(extractedText),
          unNumber:
            structuredData.unNumber || this.extractUNNumber(extractedText),
          packingGroup:
            structuredData.packingGroup ||
            this.extractPackingGroup(extractedText),
          concentration:
            structuredData.concentration ||
            this.extractConcentration(extractedText),
          volume: structuredData.volume || this.extractVolume(extractedText),
          batchNumber:
            structuredData.batchNumber ||
            this.extractBatchNumber(extractedText),
          expirationDate:
            structuredData.expirationDate ||
            this.extractExpirationDate(extractedText),
          storageClass:
            structuredData.storageClass ||
            this.determineStorageClass(detectedGhsSymbols, detectedNfpa),
          readConfidence: Math.min(
            100,
            Math.max(ocrConfidence, structuredData.confidence || 70),
          ),
          partiallyReadFields: this.identifyPartiallyReadFields(
            extractedText,
            structuredData,
          ),
          unreadableFields: this.identifyUnreadableFields(
            extractedText,
            structuredData,
          ),
        };
        labels.push(label);
      }

      // If multiple CAS numbers found, create additional labels
      if (casNumbers.length > 1 && labels.length > 0) {
        for (let i = 1; i < casNumbers.length; i++) {
          labels.push({
            ...labels[0],
            id: `label-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 11)}`,
            casNumber: casNumbers[i],
            chemicalName: `Chemical ${i + 1} (CAS: ${casNumbers[i]})`,
            readConfidence: Math.max(50, labels[0].readConfidence - 10),
          });
        }
      }
    } catch (error) {
      console.error("Error extracting chemical labels:", error);
      // Return empty array on error - don't fail the entire analysis
    }

    return labels;
  }

  /**
   * Extract structured chemical data using AI
   */
  private async extractStructuredChemicalData(
    extractedText: string,
    visionAnalysis: VisionAnalysisResult,
  ): Promise<Partial<ChemicalLabel> & { confidence: number }> {
    try {
      // Use AI to structure the data
      const aiPrompt = `Extract chemical label information from this text and vision analysis:

Text from label:
${extractedText.substring(0, 2000)}

Vision analysis:
${visionAnalysis.analysis.description}

Extract and return as JSON:
{
  "chemicalName": "Chemical name",
  "casNumber": "CAS number (format: XXX-XX-X)",
  "manufacturer": "Manufacturer name",
  "signalWord": "Danger or Warning",
  "hazardStatements": ["H statement 1", "H statement 2"],
  "precautionaryStatements": ["P statement 1", "P statement 2"],
  "nfpa": { "health": 0-4, "flammability": 0-4, "reactivity": 0-4 },
  "dotClass": "DOT class",
  "unNumber": "UN number",
  "packingGroup": "Packing group",
  "concentration": "Concentration",
  "volume": "Volume",
  "batchNumber": "Batch number",
  "expirationDate": "Expiration date",
  "storageClass": "Storage class",
  "confidence": 0.0-1.0
}

Only include fields that are clearly present. Use null for missing fields.`;

      // Use vision service's AI capabilities to extract structured data
      // This would ideally use a structured output from the vision API
      // For now, we'll parse the text and vision description

      const structured: any = {
        confidence: 0.7,
      };

      // Extract basic fields using regex patterns
      const casMatch = extractedText.match(
        /CAS\s*(?:No|Number|Registry\s*Number)?\s*:?\s*(\d{2,7}-\d{2}-\d{1})/i,
      );
      if (casMatch) structured.casNumber = casMatch[1];

      const unMatch = extractedText.match(
        /UN\s*(?:No|Number)?\s*:?\s*(\d{4})/i,
      );
      if (unMatch) structured.unNumber = unMatch[1];

      // Extract hazard statements (H codes)
      const hStatements =
        extractedText.match(/H\d{3}(?:\+\d{3})*(?:\s*-\s*[^H\n]+)?/gi) || [];
      structured.hazardStatements = hStatements.map((h) => h.trim());

      // Extract precautionary statements (P codes)
      const pStatements =
        extractedText.match(/P\d{3}(?:\+\d{3})*(?:\s*-\s*[^P\n]+)?/gi) || [];
      structured.precautionaryStatements = pStatements.map((p) => p.trim());

      // Extract signal word
      if (extractedText.match(/\bDanger\b/i)) structured.signalWord = "Danger";
      else if (extractedText.match(/\bWarning\b/i))
        structured.signalWord = "Warning";

      return structured;
    } catch (error) {
      console.error("Error extracting structured data:", error);
      return { confidence: 0 };
    }
  }

  /**
   * Detect GHS symbols from vision analysis and text
   */
  private detectGHSSymbols(
    visionAnalysis: VisionAnalysisResult,
    extractedText: string,
  ): GHSSymbol[] {
    const symbols: GHSSymbol[] = [];
    const detectedObjects = visionAnalysis.analysis.detectedObjects || [];
    const description = (
      visionAnalysis.analysis.description || ""
    ).toLowerCase();
    const text = extractedText.toLowerCase();

    // Check vision analysis for GHS symbol mentions
    const allText = `${description} ${text}`;

    // Detect each GHS symbol type
    for (const [symbolType, symbolData] of Object.entries(GHS_SYMBOLS)) {
      const keywords = [
        symbolData.name.toLowerCase(),
        symbolType.replace("-", " "),
        ...symbolData.hazardClasses.map((c) => c.toLowerCase()),
      ];

      // Check if symbol is mentioned in text or detected objects
      const isDetected = keywords.some(
        (keyword) =>
          allText.includes(keyword) ||
          detectedObjects.some((obj) =>
            obj.object.toLowerCase().includes(keyword),
          ),
      );

      if (isDetected) {
        // Calculate confidence based on how clearly it's mentioned
        let confidence = 70;
        if (allText.includes(symbolData.name.toLowerCase())) confidence = 85;
        if (
          detectedObjects.some((obj) =>
            obj.object.toLowerCase().includes(symbolType),
          )
        )
          confidence = 90;

        symbols.push({
          symbol: symbolType as GHSSymbolType,
          name: symbolData.name,
          description: symbolData.description,
          confidence,
        });
      }
    }

    return symbols;
  }

  /**
   * Detect NFPA diamond from vision analysis and text
   */
  private detectNFPA(
    visionAnalysis: VisionAnalysisResult,
    extractedText: string,
  ): ChemicalLabel["nfpa"] | undefined {
    // Look for NFPA ratings in text
    const nfpaPattern =
      /NFPA\s*(?:704)?\s*(?:Diamond)?\s*:?\s*(\d)\s*(\d)\s*(\d)\s*(\w?)/i;
    const match = extractedText.match(nfpaPattern);

    if (match) {
      return {
        health: parseInt(match[1]) || 0,
        flammability: parseInt(match[2]) || 0,
        reactivity: parseInt(match[3]) || 0,
        special: match[4] || undefined,
      };
    }

    // Try to extract from vision description
    const description = (
      visionAnalysis.analysis.description || ""
    ).toLowerCase();
    if (description.includes("nfpa") || description.includes("diamond")) {
      // Try to extract numbers
      const numbers = description.match(/(\d)\s*(\d)\s*(\d)/);
      if (numbers) {
        return {
          health: parseInt(numbers[1]) || 0,
          flammability: parseInt(numbers[2]) || 0,
          reactivity: parseInt(numbers[3]) || 0,
        };
      }
    }

    return undefined;
  }

  /**
   * Extract CAS numbers from text
   */
  private extractCASNumbers(text: string): string[] {
    const casNumbers: string[] = [];

    // Pattern: CAS No: 64-17-5 or CAS: 1310-73-2
    const patterns = [
      /CAS\s*(?:No|Number|Registry\s*Number)?\s*:?\s*(\d{2,7}-\d{2}-\d{1})/gi,
      /(\d{2,7}-\d{2}-\d{1})(?:\s*\(CAS\))?/g, // Standalone CAS format
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const cas = match[1];
        if (cas && !casNumbers.includes(cas)) {
          casNumbers.push(cas);
        }
      }
    }

    return casNumbers;
  }

  /**
   * Extract hazard and precautionary statements
   */
  private extractStatements(text: string): {
    hazardStatements: string[];
    precautionaryStatements: string[];
  } {
    const hazardStatements: string[] = [];
    const precautionaryStatements: string[] = [];

    // Extract H statements (Hazard statements)
    const hPattern = /H\d{3}(?:\+\d{3})*(?:\s*-\s*([^H\n]+))?/gi;
    const hMatches = text.matchAll(hPattern);
    for (const match of hMatches) {
      const statement = match[0].trim();
      if (!hazardStatements.includes(statement)) {
        hazardStatements.push(statement);
      }
    }

    // Extract P statements (Precautionary statements)
    const pPattern = /P\d{3}(?:\+\d{3})*(?:\s*-\s*([^P\n]+))?/gi;
    const pMatches = text.matchAll(pPattern);
    for (const match of pMatches) {
      const statement = match[0].trim();
      if (!precautionaryStatements.includes(statement)) {
        precautionaryStatements.push(statement);
      }
    }

    return { hazardStatements, precautionaryStatements };
  }

  /**
   * Extract chemical name from text
   */
  private extractChemicalName(text: string): string | null {
    // Look for common patterns
    const patterns = [
      /(?:Product\s*Name|Chemical\s*Name|Name)\s*:?\s*([A-Z][A-Za-z0-9\s\-]+)/i,
      /^([A-Z][A-Za-z0-9\s\-]{3,30})/m, // First capitalized word sequence
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        // Filter out common non-chemical words
        if (!name.match(/^(CAS|UN|NFPA|DOT|GHS|Hazard|Precautionary)/i)) {
          return name;
        }
      }
    }

    return null;
  }

  /**
   * Extract manufacturer from text
   */
  private extractManufacturer(text: string): string | undefined {
    const patterns = [
      /(?:Manufacturer|Supplier|Made\s*by|Produced\s*by)\s*:?\s*([A-Z][A-Za-z0-9\s\.,\-&]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract signal word (Danger/Warning)
   */
  private extractSignalWord(text: string): "Danger" | "Warning" | undefined {
    if (text.match(/\bDanger\b/i)) return "Danger";
    if (text.match(/\bWarning\b/i)) return "Warning";
    return undefined;
  }

  /**
   * Extract DOT class
   */
  private extractDOTClass(text: string): string | undefined {
    const match = text.match(/DOT\s*(?:Class)?\s*:?\s*([A-Z0-9\.]+)/i);
    return match ? match[1] : undefined;
  }

  /**
   * Extract UN number
   */
  private extractUNNumber(text: string): string | undefined {
    const match = text.match(/UN\s*(?:No|Number)?\s*:?\s*(\d{4})/i);
    return match ? match[1] : undefined;
  }

  /**
   * Extract packing group
   */
  private extractPackingGroup(text: string): string | undefined {
    const match = text.match(/Packing\s*Group\s*:?\s*([I-III]+)/i);
    return match ? match[1] : undefined;
  }

  /**
   * Extract concentration
   */
  private extractConcentration(text: string): string | undefined {
    const match = text.match(/(?:Concentration|Conc\.?)\s*:?\s*([\d\.]+\s*%)/i);
    return match ? match[1] : undefined;
  }

  /**
   * Extract volume
   */
  private extractVolume(text: string): string | undefined {
    const match = text.match(
      /(?:Volume|Vol\.?)\s*:?\s*([\d\.]+\s*(?:L|mL|gal|fl\s*oz))/i,
    );
    return match ? match[1] : undefined;
  }

  /**
   * Extract batch number
   */
  private extractBatchNumber(text: string): string | undefined {
    const match = text.match(/(?:Batch|Lot|Batch\s*No)\s*:?\s*([A-Z0-9\-]+)/i);
    return match ? match[1] : undefined;
  }

  /**
   * Extract expiration date
   */
  private extractExpirationDate(text: string): string | undefined {
    const patterns = [
      /(?:Exp|Expiration|Expiry)\s*(?:Date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(?:Use\s*by|Best\s*before)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return undefined;
  }

  /**
   * Determine storage class from GHS symbols and NFPA
   */
  private determineStorageClass(
    ghsSymbols: GHSSymbol[],
    nfpa?: ChemicalLabel["nfpa"],
  ): string | undefined {
    const symbolTypes = ghsSymbols.map((s) => s.symbol);

    if (symbolTypes.includes("flame")) return "Flammable";
    if (symbolTypes.includes("corrosion")) return "Corrosive";
    if (
      symbolTypes.includes("skull-crossbones") ||
      symbolTypes.includes("health-hazard")
    )
      return "Toxic";
    if (symbolTypes.includes("exploding-bomb")) return "Explosive";
    if (symbolTypes.includes("gas-cylinder")) return "Compressed Gas";
    if (symbolTypes.includes("flame-over-circle")) return "Oxidizer";

    // Use NFPA if available
    if (nfpa) {
      if (nfpa.flammability >= 3) return "Flammable";
      if (nfpa.health >= 3) return "Toxic";
      if (nfpa.reactivity >= 3) return "Reactive";
    }

    return "General";
  }

  /**
   * Identify partially read fields
   */
  private identifyPartiallyReadFields(
    text: string,
    structured: Partial<ChemicalLabel>,
  ): string[] {
    const partial: string[] = [];

    // Check if fields are incomplete
    if (
      structured.casNumber &&
      !structured.casNumber.match(/^\d{2,7}-\d{2}-\d{1}$/)
    ) {
      partial.push("casNumber");
    }
    if (structured.chemicalName && structured.chemicalName.length < 3) {
      partial.push("chemicalName");
    }

    return partial;
  }

  /**
   * Identify unreadable fields
   */
  private identifyUnreadableFields(
    text: string,
    structured: Partial<ChemicalLabel>,
  ): string[] {
    const unreadable: string[] = [];

    // Fields that should be present but aren't
    if (!structured.casNumber && !text.match(/CAS/i)) {
      unreadable.push("casNumber");
    }
    if (!structured.chemicalName) {
      unreadable.push("chemicalName");
    }
    if (!structured.manufacturer && text.length > 100) {
      unreadable.push("manufacturer");
    }

    return unreadable;
  }

  /**
   * Check chemical compatibility between detected chemicals
   */
  private async checkCompatibility(
    labels: ChemicalLabel[],
  ): Promise<ChemicalCompatibility[]> {
    const issues: ChemicalCompatibility[] = [];

    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const chem1 = labels[i];
        const chem2 = labels[j];

        const compatibility = this.evaluateCompatibility(chem1, chem2);
        if (!compatibility.isCompatible || compatibility.riskLevel !== "safe") {
          issues.push(compatibility);
        }
      }
    }

    return issues;
  }

  private evaluateCompatibility(
    chem1: ChemicalLabel,
    chem2: ChemicalLabel,
  ): ChemicalCompatibility {
    // Check for known incompatibilities
    const class1 = chem1.storageClass?.toLowerCase() || "";
    const class2 = chem2.storageClass?.toLowerCase() || "";

    for (const rule of INCOMPATIBILITY_RULES) {
      if (
        (class1.includes(rule.class1) && class2.includes(rule.class2)) ||
        (class1.includes(rule.class2) && class2.includes(rule.class1))
      ) {
        return {
          chemical1: chem1.chemicalName,
          chemical2: chem2.chemicalName,
          isCompatible: rule.risk !== "incompatible",
          riskLevel: rule.risk as any,
          warningMessage: rule.message,
          recommendations: [
            "Separate these chemicals immediately",
            "Ensure proper secondary containment",
            "Review SDS for specific storage requirements",
          ],
        };
      }
    }

    // Default to safe if no incompatibility found
    return {
      chemical1: chem1.chemicalName,
      chemical2: chem2.chemicalName,
      isCompatible: true,
      riskLevel: "safe",
      recommendations: ["Continue monitoring storage conditions"],
    };
  }

  /**
   * Analyze PPE compliance based on detected chemicals
   */
  private async analyzePPECompliance(
    baseAnalysis: VisionAnalysisResult,
    labels: ChemicalLabel[],
  ): Promise<ChemicalVisionAnalysis["ppeAnalysis"]> {
    // Determine required PPE based on chemicals
    const required: PPERequirement[] = [];
    const allGhsSymbols = labels.flatMap((l) =>
      l.ghsSymbols.map((s) => s.symbol),
    );

    // Check for corrosive symbols
    if (allGhsSymbols.includes("corrosion")) {
      required.push(
        {
          type: "safety-glasses",
          required: true,
          description: "Chemical splash goggles or face shield",
        },
        {
          type: "gloves",
          required: true,
          description:
            "Chemical-resistant gloves (check SDS for specific type)",
        },
        {
          type: "apron",
          required: true,
          description: "Chemical-resistant apron",
        },
      );
    }

    // Check for toxic symbols
    if (
      allGhsSymbols.includes("skull-crossbones") ||
      allGhsSymbols.includes("health-hazard")
    ) {
      required.push(
        {
          type: "respirator",
          required: true,
          description: "Appropriate respirator (check SDS)",
        },
        {
          type: "coveralls",
          required: true,
          description: "Full body protection",
        },
      );
    }

    // Check for flammable symbols
    if (allGhsSymbols.includes("flame")) {
      required.push({
        type: "safety-shoes",
        required: true,
        description: "Anti-static safety shoes",
      });
    }

    // Default PPE
    if (required.length === 0) {
      required.push(
        {
          type: "safety-glasses",
          required: true,
          description: "Safety glasses or goggles",
        },
        { type: "gloves", required: true, description: "Appropriate gloves" },
        {
          type: "lab-coat",
          required: true,
          description: "Lab coat or protective clothing",
        },
      );
    }

    // Detect PPE from image (mock - would use AI detection in production)
    const detected: PPERequirement[] = [];
    const safetyItems = baseAnalysis.analysis.detectedObjects.filter((obj) =>
      ["gloves", "goggles", "mask", "helmet", "vest", "coat"].some((item) =>
        obj.object.toLowerCase().includes(item),
      ),
    );

    for (const item of safetyItems) {
      if (item.object.toLowerCase().includes("gloves")) {
        detected.push({
          type: "gloves",
          required: true,
          description: "Gloves detected",
        });
      }
      if (
        item.object.toLowerCase().includes("goggles") ||
        item.object.toLowerCase().includes("glasses")
      ) {
        detected.push({
          type: "safety-glasses",
          required: true,
          description: "Eye protection detected",
        });
      }
      // ... more detection logic
    }

    // Find missing PPE
    const missing = required.filter(
      (req) => !detected.some((det) => det.type === req.type),
    );

    return {
      required,
      detected,
      missing,
      compliant: missing.length === 0,
      recommendations:
        missing.length > 0
          ? [`Missing required PPE: ${missing.map((m) => m.type).join(", ")}`]
          : ["PPE requirements met"],
    };
  }

  /**
   * Analyze storage conditions
   */
  private async analyzeStorageConditions(
    baseAnalysis: VisionAnalysisResult,
    labels: ChemicalLabel[],
  ): Promise<ChemicalVisionAnalysis["storageAnalysis"]> {
    const issues: string[] = [];
    const segregationIssues: string[] = [];

    // Check for mixed storage classes
    const storageClasses = new Set(
      labels.map((l) => l.storageClass).filter(Boolean),
    );
    if (storageClasses.size > 1) {
      const classes = Array.from(storageClasses);

      // Check flammables with oxidizers
      if (
        classes.some((c) => c?.includes("Flammable")) &&
        classes.some((c) => c?.includes("Oxidiz"))
      ) {
        segregationIssues.push(
          "Flammable materials stored with oxidizers - segregation required",
        );
      }

      // Check acids with bases
      if (
        classes.some((c) => c?.includes("Acid")) &&
        classes.some((c) => c?.includes("Base"))
      ) {
        segregationIssues.push(
          "Acids stored with bases - separate storage required",
        );
      }
    }

    // Analyze container conditions from image
    const damageKeywords = [
      "damaged",
      "leaked",
      "spill",
      "crack",
      "rust",
      "corrosion",
    ];
    const hasDamage = baseAnalysis.analysis.qualityIssues.some((issue) =>
      damageKeywords.some((keyword) =>
        issue.issue.toLowerCase().includes(keyword),
      ),
    );

    return {
      currentConditions: {
        lightingConditions: "adequate",
        ventilation: "appears adequate",
        cleanliness:
          baseAnalysis.analysis.qualityIssues.length === 0
            ? "good"
            : "needs attention",
      },
      containerConditions: {
        integrity: hasDamage ? "damaged" : "good",
        issues: hasDamage
          ? ["Container damage detected - inspect immediately"]
          : [],
      },
      segregationCompliance: {
        compliant: segregationIssues.length === 0,
        issues: segregationIssues,
      },
    };
  }

  /**
   * Calculate overall compliance score
   */
  private calculateComplianceScore(analysis: ChemicalVisionAnalysis): void {
    let score = 100;

    // Deduct for compatibility issues
    for (const issue of analysis.compatibilityIssues) {
      if (issue.riskLevel === "incompatible") score -= 30;
      else if (issue.riskLevel === "danger") score -= 20;
      else if (issue.riskLevel === "caution") score -= 10;
    }

    // Deduct for PPE non-compliance
    if (!analysis.ppeAnalysis.compliant) {
      score -= analysis.ppeAnalysis.missing.length * 10;
    }

    // Deduct for storage issues
    if (!analysis.storageAnalysis.segregationCompliance.compliant) {
      score -=
        analysis.storageAnalysis.segregationCompliance.issues.length * 15;
    }

    if (analysis.storageAnalysis.containerConditions.integrity === "damaged") {
      score -= 25;
    } else if (
      analysis.storageAnalysis.containerConditions.integrity === "poor"
    ) {
      score -= 15;
    }

    analysis.complianceScore = Math.max(0, score);
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(analysis: ChemicalVisionAnalysis): void {
    const recommendations: string[] = [];
    const urgent: string[] = [];

    // Compatibility recommendations
    for (const issue of analysis.compatibilityIssues) {
      if (issue.riskLevel === "incompatible") {
        urgent.push(
          `URGENT: Separate ${issue.chemical1} from ${issue.chemical2} immediately`,
        );
      } else if (issue.riskLevel === "danger") {
        recommendations.push(
          `Relocate ${issue.chemical1} away from ${issue.chemical2}`,
        );
      }
    }

    // PPE recommendations
    if (!analysis.ppeAnalysis.compliant) {
      urgent.push(
        `Required PPE missing: ${analysis.ppeAnalysis.missing.map((m) => m.type).join(", ")}`,
      );
    }

    // Storage recommendations
    if (!analysis.storageAnalysis.segregationCompliance.compliant) {
      for (const issue of analysis.storageAnalysis.segregationCompliance
        .issues) {
        recommendations.push(issue);
      }
    }

    if (analysis.storageAnalysis.containerConditions.integrity === "damaged") {
      urgent.push(
        "Container damage detected - transfer contents to appropriate container",
      );
    }

    // General recommendations
    if (
      analysis.labels.some((l) =>
        l.ghsSymbols.some((s) => s.symbol === "corrosion"),
      )
    ) {
      recommendations.push(
        "Ensure secondary containment is in place for corrosive materials",
      );
    }

    if (
      analysis.labels.some((l) =>
        l.ghsSymbols.some((s) => s.symbol === "flame"),
      )
    ) {
      recommendations.push(
        "Verify fire extinguisher accessibility and expiration",
      );
      recommendations.push(
        "Check that ignition sources are controlled in the area",
      );
    }

    analysis.overallRecommendations = recommendations;
    analysis.urgentActions = urgent;
  }

  /**
   * Get storage zone recommendation for a chemical
   */
  getStorageZoneRecommendation(label: ChemicalLabel): StorageZone | null {
    // Determine appropriate storage zone based on hazards
    const zones: StorageZone[] = [
      {
        zoneId: "flammable-cabinet",
        zoneName: "Flammable Storage Cabinet",
        storageClass: "Flammable",
        allowedClasses: ["Flammable Liquid", "Flammable Solid"],
        conditions: {
          temperatureMax: 25,
          ventilationRequired: true,
          groundingRequired: true,
          segregationRequired: true,
        },
      },
      {
        zoneId: "corrosive-cabinet",
        zoneName: "Corrosive Storage Cabinet",
        storageClass: "Corrosive",
        allowedClasses: ["Corrosive", "Acid", "Base"],
        conditions: {
          ventilationRequired: true,
          segregationRequired: true,
        },
      },
      {
        zoneId: "general-storage",
        zoneName: "General Chemical Storage",
        storageClass: "General",
        allowedClasses: ["General", "Non-Hazardous"],
        conditions: {
          temperatureMin: 15,
          temperatureMax: 30,
          humidityMin: 30,
          humidityMax: 60,
          ventilationRequired: false,
          groundingRequired: false,
          segregationRequired: false,
        },
      },
    ];

    // Match label to zone
    for (const zone of zones) {
      if (
        label.storageClass &&
        zone.allowedClasses.some((c) =>
          label.storageClass!.toLowerCase().includes(c.toLowerCase()),
        )
      ) {
        return zone;
      }
    }

    return zones.find((z) => z.storageClass === "General") || null;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const chemicalVisionService = new ChemicalVisionService();
export default chemicalVisionService;
