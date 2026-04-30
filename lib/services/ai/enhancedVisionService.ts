/**
 * Enhanced Vision Service with RAG Integration
 * Combines AI vision with knowledge base for contextual understanding
 * Learns from every analysis and provides industry-specific insights
 */

import visionService, {
  VisionAnalysisResult,
  VisionServiceConfig,
} from "./visionService";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { ocrService } from "@/lib/services/ocr/ocrService";
import { visionCacheService } from "./visionCacheService";

// ============================================================================
// TYPES
// ============================================================================

export interface EnhancedVisionAnalysis extends VisionAnalysisResult {
  // RAG-enhanced context
  contextualInsights?: {
    relevantKnowledge: Array<{
      entry: any;
      relevanceScore: number;
      extractedContext: string;
    }>;
    similarCases: Array<{
      analysis: VisionAnalysisResult;
      similarityScore: number;
      whySimilar: string;
    }>;
    recommendations: string[];
    industryBestPractices?: string[];
  };

  // Learning data
  learning?: {
    patternsDetected: string[];
    confidenceScores: Record<string, number>;
    improvementSuggestions: string[];
    shouldStoreForLearning: boolean;
  };

  // Extracted text from image
  extractedText?: {
    text: string;
    confidence: number;
    language?: string;
    structuredData?: Record<string, any>;
  };

  // Multimodal context
  multimodal?: {
    textExtracted: string;
    metadata?: Record<string, any>;
    relatedDocuments?: string[];
  };

  // Industry-specific analysis
  industryAnalysis?: {
    manufacturing?: ManufacturingAnalysis;
    logistics?: LogisticsAnalysis;
    healthcare?: HealthcareAnalysis;
    chemical?: ChemicalAnalysis;
  };
}

export interface ManufacturingAnalysis {
  defectsDetected: Array<{
    type: string;
    severity: "minor" | "major" | "critical";
    location: string;
    recommendation: string;
  }>;
  qualityScore: number;
  productionLineStatus?: string;
  equipmentCondition?: "good" | "fair" | "poor" | "critical";
}

export interface LogisticsAnalysis {
  packageCondition: "good" | "damaged" | "severely_damaged";
  damageDetails?: Array<{
    type: string;
    location: string;
    severity: string;
  }>;
  loadingCompliance: boolean;
  inventoryCount?: number;
  verificationStatus: "verified" | "needs_review" | "failed";
}

export interface HealthcareAnalysis {
  equipmentSterilization?: "verified" | "needs_verification" | "failed";
  safetyCompliance: boolean;
  documentationComplete: boolean;
  patientSafetyScore: number;
}

export interface ChemicalAnalysis {
  labelReadability: number;
  ghsCompliance: boolean;
  storageCompliance: boolean;
  compatibilityChecked: boolean;
  ppeCompliance: boolean;
}

export interface EnhancedVisionConfig extends VisionServiceConfig {
  enableRAG?: boolean;
  enableLearning?: boolean;
  enableIndustryAnalysis?: boolean;
  industryContext?:
    | "manufacturing"
    | "logistics"
    | "healthcare"
    | "chemical"
    | "general";
  extractText?: boolean;
  searchSimilarCases?: boolean;
  maxKnowledgeResults?: number;
  learningThreshold?: number; // Confidence threshold for storing in knowledge base
}

// ============================================================================
// ENHANCED VISION SERVICE
// ============================================================================

class EnhancedVisionService {
  private defaultConfig: EnhancedVisionConfig = {
    enableRAG: true,
    enableLearning: true,
    enableIndustryAnalysis: true,
    extractText: true,
    searchSimilarCases: true,
    maxKnowledgeResults: 5,
    learningThreshold: 0.7, // Store if confidence > 70%
  };

  /**
   * Analyze image with RAG-enhanced intelligence
   */
  async analyzeWithRAG(
    imageFile: File | string,
    context?: string,
    config?: EnhancedVisionConfig,
  ): Promise<EnhancedVisionAnalysis> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();

    // Check cache first (if enabled)
    const imageHash = await this.hashImage(imageFile);
    const cachedResult = visionCacheService.get(imageHash, context, {
      enableSimilarityCache: true,
    });

    if (cachedResult && "contextualInsights" in cachedResult) {
      return cachedResult as EnhancedVisionAnalysis;
    }

    // Step 1: Extract text from image if enabled
    let extractedText: EnhancedVisionAnalysis["extractedText"] | undefined;
    if (mergedConfig.extractText) {
      try {
        extractedText = await this.extractTextFromImage(imageFile);
      } catch (error) {
        console.warn("Text extraction failed (non-critical):", error);
      }
    }

    // Step 2: Build enhanced context with RAG
    let enhancedContext = context || "";
    let relevantKnowledge: EnhancedVisionAnalysis["contextualInsights"] =
      undefined;

    if (mergedConfig.enableRAG) {
      // Search knowledge base for relevant context
      const searchQuery =
        extractedText?.text || context || "warehouse operations safety quality";

      try {
        const knowledgeResults = await knowledgeBaseService.semanticSearch({
          query: searchQuery,
          limit: mergedConfig.maxKnowledgeResults || 5,
          threshold: 0.5,
        });

        if (knowledgeResults.length > 0) {
          // Build context from retrieved knowledge
          const knowledgeContext = knowledgeResults
            .map((result) => {
              const content =
                typeof result.entry.content === "string"
                  ? result.entry.content
                  : JSON.stringify(result.entry.content);
              return `[Relevant Knowledge - ${(result.score * 100).toFixed(0)}% match]: ${content.substring(0, 200)}`;
            })
            .join("\n\n");

          enhancedContext = `${context || ""}\n\nRelevant Knowledge from Previous Analyses:\n${knowledgeContext}`;

          relevantKnowledge = {
            relevantKnowledge: knowledgeResults.map((result) => ({
              entry: result.entry,
              relevanceScore: result.score,
              extractedContext:
                typeof result.entry.content === "string"
                  ? result.entry.content.substring(0, 300)
                  : JSON.stringify(result.entry.content).substring(0, 300),
            })),
            similarCases: [],
            recommendations: [],
          };
        }
      } catch (error) {
        console.warn("Knowledge base search failed (non-critical):", error);
      }
    }

    // Step 3: Perform vision analysis with enhanced context
    const visionResult = await visionService.analyzeImage(
      imageFile,
      enhancedContext,
      {
        provider: mergedConfig.provider,
        enableRootCauseAnalysis: mergedConfig.enableRootCauseAnalysis,
        enableThumbnailGeneration: mergedConfig.enableThumbnailGeneration,
      },
    );

    // Step 4: Find similar cases if enabled
    let similarCases: EnhancedVisionAnalysis["contextualInsights"]["similarCases"] =
      [];
    if (mergedConfig.searchSimilarCases && visionResult.analysis.description) {
      try {
        const similarResults = await knowledgeBaseService.semanticSearch({
          query: visionResult.analysis.description,
          limit: 3,
          threshold: 0.6,
        });

        similarCases = similarResults
          .filter((result) => {
            // Only include if it's a vision analysis
            return (
              result.entry.type === "vision_analysis" ||
              result.entry.metadata?.imageId
            );
          })
          .map((result) => ({
            analysis:
              result.entry.metadata?.visionResult ||
              ({
                id: result.entry.id,
                timestamp: result.entry.createdAt,
                analysis: {
                  description:
                    typeof result.entry.content === "string"
                      ? result.entry.content
                      : JSON.stringify(result.entry.content),
                  detectedObjects: [],
                  safetyIssues: [],
                  qualityIssues: [],
                  complianceIssues: [],
                },
                metadata: {
                  provider: "knowledge_base",
                  model: "semantic_search",
                  processingTime: 0,
                },
              } as VisionAnalysisResult),
            similarityScore: result.score,
            whySimilar: `Similar analysis from ${result.entry.createdAt}: ${typeof result.entry.content === "string" ? result.entry.content.substring(0, 100) : "Previous vision analysis"}`,
          }));
      } catch (error) {
        console.warn("Similar cases search failed (non-critical):", error);
      }
    }

    // Step 5: Generate recommendations
    const recommendations = this.generateRecommendations(
      visionResult,
      relevantKnowledge,
      extractedText,
    );

    // Step 6: Industry-specific analysis
    let industryAnalysis:
      | EnhancedVisionAnalysis["industryAnalysis"]
      | undefined;
    if (mergedConfig.enableIndustryAnalysis && mergedConfig.industryContext) {
      industryAnalysis = await this.performIndustryAnalysis(
        visionResult,
        mergedConfig.industryContext,
        extractedText,
      );
    }

    // Step 7: Learning analysis
    let learning: EnhancedVisionAnalysis["learning"] | undefined;
    if (mergedConfig.enableLearning) {
      learning = this.analyzeForLearning(visionResult, extractedText);
    }

    // Step 8: Store in knowledge base for learning (if threshold met)
    if (
      mergedConfig.enableLearning &&
      learning &&
      learning.shouldStoreForLearning
    ) {
      try {
        await this.storeForLearning(
          visionResult,
          extractedText,
          enhancedContext,
          mergedConfig,
        );
      } catch (error) {
        console.warn("Failed to store for learning (non-critical):", error);
      }
    }

    // Build enhanced result
    const enhancedResult: EnhancedVisionAnalysis = {
      ...visionResult,
      extractedText,
      contextualInsights: {
        ...relevantKnowledge,
        similarCases:
          similarCases.length > 0
            ? similarCases
            : relevantKnowledge?.similarCases || [],
        recommendations,
        industryBestPractices: this.getIndustryBestPractices(
          mergedConfig.industryContext,
        ),
      },
      learning,
      industryAnalysis,
      multimodal: {
        textExtracted: extractedText?.text || "",
        metadata: {
          ragEnabled: mergedConfig.enableRAG,
          learningEnabled: mergedConfig.enableLearning,
          industryContext: mergedConfig.industryContext,
        },
      },
    };

    // Cache result
    visionCacheService.set(imageHash, enhancedResult, context);

    return enhancedResult;
  }

  /**
   * Hash image for caching
   */
  private async hashImage(imageFile: File | string): Promise<string> {
    try {
      if (imageFile instanceof File) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        // Simple hash (in production, would use proper image hashing)
        return this.hashBuffer(buffer);
      } else if (typeof imageFile === "string") {
        return this.hashString(imageFile);
      }
      return `img-${Date.now()}`;
    } catch (error) {
      return `img-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
  }

  /**
   * Hash buffer
   */
  private hashBuffer(buffer: Buffer): string {
    let hash = 0;
    for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
      hash = (hash << 5) - hash + buffer[i];
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Hash string
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Extract text from image using OCR
   */
  private async extractTextFromImage(
    imageFile: File | string,
  ): Promise<EnhancedVisionAnalysis["extractedText"]> {
    try {
      let imageBuffer: Buffer;

      if (imageFile instanceof File) {
        const arrayBuffer = await imageFile.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else if (typeof imageFile === "string") {
        if (imageFile.startsWith("data:")) {
          // Data URL - extract base64
          const base64Data = imageFile.split(",")[1];
          imageBuffer = Buffer.from(base64Data, "base64");
        } else if (imageFile.startsWith("http")) {
          // URL - fetch and convert
          const response = await fetch(imageFile);
          const arrayBuffer = await response.arrayBuffer();
          imageBuffer = Buffer.from(arrayBuffer);
        } else {
          throw new Error("Invalid image format");
        }
      } else {
        throw new Error("Invalid image input");
      }

      // Use OCR service
      const ocrResult = await ocrService.extractTextFromImage(imageBuffer, {
        language: "eng",
        psm: 6,
      });

      // Try to extract structured data
      const structuredData = this.extractStructuredData(ocrResult.text);

      return {
        text: ocrResult.text,
        confidence: ocrResult.confidence / 100,
        language: ocrResult.language,
        structuredData,
      };
    } catch (error) {
      console.error("Text extraction error:", error);
      throw error;
    }
  }

  /**
   * Extract structured data from text
   */
  private extractStructuredData(text: string): Record<string, any> {
    const structured: Record<string, any> = {};

    // Extract dates
    const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g;
    const dates = text.match(datePattern);
    if (dates) structured.dates = dates;

    // Extract numbers
    const numberPattern = /\b(\d+\.?\d*)\b/g;
    const numbers = text.match(numberPattern);
    if (numbers) structured.numbers = numbers.slice(0, 10); // Limit to 10

    // Extract emails
    const emailPattern = /\b[\w\.-]+@[\w\.-]+\.\w+\b/g;
    const emails = text.match(emailPattern);
    if (emails) structured.emails = emails;

    // Extract URLs
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlPattern);
    if (urls) structured.urls = urls;

    return structured;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    visionResult: VisionAnalysisResult,
    relevantKnowledge?: EnhancedVisionAnalysis["contextualInsights"],
    extractedText?: EnhancedVisionAnalysis["extractedText"],
  ): string[] {
    const recommendations: string[] = [];

    // Safety recommendations
    if (
      visionResult.analysis.safetyIssues &&
      visionResult.analysis.safetyIssues.length > 0
    ) {
      const criticalIssues = visionResult.analysis.safetyIssues.filter(
        (i) => i.severity === "critical",
      );
      if (criticalIssues.length > 0) {
        recommendations.push(
          `URGENT: Address ${criticalIssues.length} critical safety issue(s) immediately`,
        );
      }
    }

    // Quality recommendations
    if (
      visionResult.analysis.qualityIssues &&
      visionResult.analysis.qualityIssues.length > 0
    ) {
      recommendations.push(
        `Review ${visionResult.analysis.qualityIssues.length} quality issue(s) and take corrective action`,
      );
    }

    // Compliance recommendations
    if (
      visionResult.analysis.complianceIssues &&
      visionResult.analysis.complianceIssues.length > 0
    ) {
      recommendations.push(
        `Address ${visionResult.analysis.complianceIssues.length} compliance issue(s) to maintain standards`,
      );
    }

    // Root cause recommendations
    if (visionResult.analysis.rootCauseAnalysis?.recommendations) {
      recommendations.push(
        ...visionResult.analysis.rootCauseAnalysis.recommendations,
      );
    }

    // Knowledge-based recommendations
    if (
      relevantKnowledge?.relevantKnowledge &&
      relevantKnowledge.relevantKnowledge.length > 0
    ) {
      recommendations.push(
        `Based on ${relevantKnowledge.relevantKnowledge.length} similar case(s), consider reviewing historical patterns`,
      );
    }

    return recommendations;
  }

  /**
   * Perform industry-specific analysis
   */
  private async performIndustryAnalysis(
    visionResult: VisionAnalysisResult,
    industry: string,
    extractedText?: EnhancedVisionAnalysis["extractedText"],
  ): Promise<EnhancedVisionAnalysis["industryAnalysis"]> {
    const analysis: EnhancedVisionAnalysis["industryAnalysis"] = {};

    switch (industry) {
      case "manufacturing":
        analysis.manufacturing = this.analyzeManufacturing(
          visionResult,
          extractedText,
        );
        break;
      case "logistics":
        analysis.logistics = this.analyzeLogistics(visionResult, extractedText);
        break;
      case "healthcare":
        analysis.healthcare = this.analyzeHealthcare(
          visionResult,
          extractedText,
        );
        break;
      case "chemical":
        analysis.chemical = this.analyzeChemical(visionResult, extractedText);
        break;
    }

    return analysis;
  }

  private analyzeManufacturing(
    visionResult: VisionAnalysisResult,
    extractedText?: EnhancedVisionAnalysis["extractedText"],
  ): ManufacturingAnalysis {
    const defects =
      visionResult.analysis.qualityIssues?.map((issue) => ({
        type: issue.type,
        severity: issue.severity,
        location: "Detected in image",
        recommendation: `Address ${issue.type} issue`,
      })) || [];

    const qualityScore = 100 - defects.length * 10;

    return {
      defectsDetected: defects,
      qualityScore: Math.max(0, qualityScore),
      equipmentCondition: defects.some((d) => d.severity === "critical")
        ? "critical"
        : defects.some((d) => d.severity === "major")
          ? "poor"
          : defects.length > 0
            ? "fair"
            : "good",
    };
  }

  private analyzeLogistics(
    visionResult: VisionAnalysisResult,
    extractedText?: EnhancedVisionAnalysis["extractedText"],
  ): LogisticsAnalysis {
    const damageIssues =
      visionResult.analysis.qualityIssues?.filter((i) => i.type === "damage") ||
      [];
    const packageCondition = damageIssues.some((i) => i.severity === "critical")
      ? "severely_damaged"
      : damageIssues.length > 0
        ? "damaged"
        : "good";

    return {
      packageCondition,
      damageDetails: damageIssues.map((issue) => ({
        type: issue.type,
        location: "Detected in image",
        severity: issue.severity,
      })),
      loadingCompliance: visionResult.analysis.complianceIssues?.length === 0,
      verificationStatus:
        damageIssues.length === 0 ? "verified" : "needs_review",
    };
  }

  private analyzeHealthcare(
    visionResult: VisionAnalysisResult,
    extractedText?: EnhancedVisionAnalysis["extractedText"],
  ): HealthcareAnalysis {
    const safetyCompliant = visionResult.analysis.safetyIssues?.length === 0;
    const complianceIssues =
      visionResult.analysis.complianceIssues?.length || 0;

    return {
      equipmentSterilization:
        complianceIssues === 0 ? "verified" : "needs_verification",
      safetyCompliance: safetyCompliant,
      documentationComplete: extractedText
        ? extractedText.text.length > 50
        : false,
      patientSafetyScore: safetyCompliant
        ? 100
        : Math.max(0, 100 - complianceIssues * 20),
    };
  }

  private analyzeChemical(
    visionResult: VisionAnalysisResult,
    extractedText?: EnhancedVisionAnalysis["extractedText"],
  ): ChemicalAnalysis {
    return {
      labelReadability: extractedText ? extractedText.confidence * 100 : 0,
      ghsCompliance: visionResult.analysis.complianceIssues?.length === 0,
      storageCompliance:
        visionResult.analysis.complianceIssues?.filter((i) =>
          i.standard.includes("storage"),
        ).length === 0,
      compatibilityChecked: false, // Would use chemical compatibility service
      ppeCompliance:
        visionResult.analysis.safetyIssues?.filter((i) =>
          i.issue.toLowerCase().includes("ppe"),
        ).length === 0,
    };
  }

  /**
   * Analyze results for learning opportunities
   */
  private analyzeForLearning(
    visionResult: VisionAnalysisResult,
    extractedText?: EnhancedVisionAnalysis["extractedText"],
  ): EnhancedVisionAnalysis["learning"] {
    const patternsDetected: string[] = [];
    const confidenceScores: Record<string, number> = {};

    // Analyze detected objects
    if (visionResult.analysis.detectedObjects) {
      visionResult.analysis.detectedObjects.forEach((obj) => {
        patternsDetected.push(`Object: ${obj.object}`);
        confidenceScores[`object_${obj.object}`] = obj.confidence;
      });
    }

    // Analyze issues
    if (visionResult.analysis.safetyIssues) {
      visionResult.analysis.safetyIssues.forEach((issue) => {
        patternsDetected.push(`Safety: ${issue.issue}`);
        confidenceScores[`safety_${issue.issue}`] = issue.confidence;
      });
    }

    // Determine if should store for learning
    const avgConfidence =
      Object.values(confidenceScores).reduce((a, b) => a + b, 0) /
      (Object.keys(confidenceScores).length || 1);
    const shouldStoreForLearning =
      avgConfidence > 0.7 && patternsDetected.length > 0;

    return {
      patternsDetected,
      confidenceScores,
      improvementSuggestions: this.generateImprovementSuggestions(visionResult),
      shouldStoreForLearning,
    };
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovementSuggestions(
    visionResult: VisionAnalysisResult,
  ): string[] {
    const suggestions: string[] = [];

    if (
      visionResult.analysis.detectedObjects &&
      visionResult.analysis.detectedObjects.length === 0
    ) {
      suggestions.push(
        "Consider improving image quality or lighting for better object detection",
      );
    }

    if (visionResult.metadata.processingTime > 5000) {
      suggestions.push(
        "Analysis took longer than expected - consider optimizing image size",
      );
    }

    return suggestions;
  }

  /**
   * Store analysis in knowledge base for learning
   */
  private async storeForLearning(
    visionResult: VisionAnalysisResult,
    extractedText: EnhancedVisionAnalysis["extractedText"] | undefined,
    context: string,
    config: EnhancedVisionConfig,
  ): Promise<void> {
    try {
      const content = [
        visionResult.analysis.description,
        extractedText?.text,
        `Detected Objects: ${visionResult.analysis.detectedObjects?.map((o) => o.object).join(", ")}`,
        `Safety Issues: ${visionResult.analysis.safetyIssues?.map((i) => i.issue).join(", ")}`,
        `Quality Issues: ${visionResult.analysis.qualityIssues?.map((i) => i.issue).join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      await knowledgeBaseService.learn({
        type: "vision_analysis",
        category: "ai_vision",
        content,
        metadata: {
          imageId: visionResult.id,
          timestamp: visionResult.timestamp,
          provider: visionResult.metadata.provider,
          model: visionResult.metadata.model,
          industryContext: config.industryContext,
          visionResult: visionResult,
        },
        tags: [
          "vision",
          "ai_analysis",
          config.industryContext || "general",
          ...(visionResult.analysis.detectedObjects?.map(
            (o) => `object_${o.object}`,
          ) || []),
        ],
      });
    } catch (error) {
      console.error("Failed to store for learning:", error);
      throw error;
    }
  }

  /**
   * Get industry best practices
   */
  private getIndustryBestPractices(industry?: string): string[] {
    const practices: Record<string, string[]> = {
      manufacturing: [
        "Maintain clean production environment",
        "Regular equipment inspection",
        "Quality control at every stage",
        "Document all defects for analysis",
      ],
      logistics: [
        "Verify package condition before shipping",
        "Document damage with photos",
        "Ensure proper loading procedures",
        "Maintain loading compliance records",
      ],
      healthcare: [
        "Verify equipment sterilization",
        "Maintain safety compliance",
        "Document all procedures",
        "Ensure patient safety standards",
      ],
      chemical: [
        "Verify chemical labels are readable",
        "Check GHS compliance",
        "Ensure proper storage segregation",
        "Verify PPE requirements",
      ],
    };

    return (
      practices[industry || "general"] || [
        "Follow industry best practices",
        "Maintain compliance standards",
        "Document all findings",
        "Take corrective action promptly",
      ]
    );
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const enhancedVisionService = new EnhancedVisionService();
export default enhancedVisionService;
