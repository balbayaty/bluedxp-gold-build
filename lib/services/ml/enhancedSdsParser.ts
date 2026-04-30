/**
 * Enhanced SDS Parser with Full Integration
 * Integrates OCR, Knowledge Base, ML Registry, and Self-Learning
 * Reusable across all modules
 */

import { SDSParserService, SDSData } from "./sds-parser";
import { ocrService } from "../ocr/ocrService";
import { knowledgeBaseService } from "../knowledge-base";

export interface EnhancedParsingOptions {
  enableOCR?: boolean;
  enableLearning?: boolean;
  enableKnowledgeBase?: boolean;
  enableMLEnhancement?: boolean;
  minConfidence?: number;
  tenantId?: string;
  module?: string;
  submissionId?: string;
}

export interface EnhancedParsingResult extends SDSData {
  metadata: {
    confidence: number;
    processingTime: number;
    methodsUsed: string[];
    ocrUsed: boolean;
    learningApplied: boolean;
    knowledgeBaseQueried: boolean;
    mlEnhanced: boolean;
    errors: string[];
    warnings: string[];
  };
}

class EnhancedSDSParser {
  private baseParser: SDSParserService;

  constructor() {
    this.baseParser = new SDSParserService();
  }

  /**
   * Enhanced parsing with all integrations
   */
  async parseEnhanced(
    rawText: string | Buffer,
    options: EnhancedParsingOptions = {},
  ): Promise<EnhancedParsingResult> {
    const startTime = Date.now();
    const methodsUsed: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let ocrUsed = false;
    let learningApplied = false;
    let knowledgeBaseQueried = false;
    let mlEnhanced = false;

    try {
      // Step 1: Convert buffer to text if needed
      let text =
        typeof rawText === "string" ? rawText : rawText.toString("utf-8");

      // Step 2: Check if OCR is needed (text too short or appears to be image)
      if (options.enableOCR !== false && text.length < 100) {
        if (rawText instanceof Buffer) {
          try {
            const ocrResult = await ocrService.extractTextFromImage(rawText, {
              language: "eng",
              psm: 6,
            });

            if (ocrResult.text && ocrResult.text.length > 50) {
              text = ocrResult.text;
              ocrUsed = true;
              methodsUsed.push("OCR");
              console.log(
                "[enhanced-parser] OCR extracted text:",
                ocrResult.text.length,
                "chars",
              );
            }
          } catch (ocrError) {
            warnings.push(
              `OCR failed: ${ocrError instanceof Error ? ocrError.message : "Unknown error"}`,
            );
          }
        }
      }

      // Step 3: Query knowledge base for similar documents
      let knowledgeBaseData: any = null;
      if (options.enableKnowledgeBase !== false) {
        try {
          const kbResults = await knowledgeBaseService.search({
            query: text.substring(0, 200), // Use first 200 chars as query
            filters: {
              type: "fact",
              category: "chemical",
            },
            limit: 5,
          });

          if (kbResults.results.length > 0) {
            knowledgeBaseQueried = true;
            methodsUsed.push("KnowledgeBase");
            knowledgeBaseData = kbResults.results[0].entry;
            console.log(
              "[enhanced-parser] Found knowledge base entry:",
              knowledgeBaseData.id,
            );
          }
        } catch (kbError) {
          warnings.push(
            `Knowledge base query failed: ${kbError instanceof Error ? kbError.message : "Unknown"}`,
          );
        }
      }

      // Step 4: Parse with self-learning if enabled
      let parsedData: SDSData;
      if (options.enableLearning !== false) {
        parsedData = await selfLearningParserService.parseWithLearning(text, {
          fileName: options.submissionId,
          fileType: "text",
          submissionId: options.submissionId,
          tenantId: options.tenantId,
        });
        learningApplied = true;
        methodsUsed.push("SelfLearning");
      } else {
        parsedData = await this.baseParser.parseSDS(text);
        methodsUsed.push("BaseParser");
      }

      // Step 5: Enhance with knowledge base data
      if (knowledgeBaseData) {
        parsedData = this.mergeKnowledgeBaseData(parsedData, knowledgeBaseData);
        methodsUsed.push("KnowledgeBaseMerge");
      }

      // Step 6: ML enhancement if enabled
      if (options.enableMLEnhancement !== false) {
        const mlEnhancedData = await this.enhanceWithML(parsedData, text);
        if (mlEnhancedData) {
          parsedData = { ...parsedData, ...mlEnhancedData };
          mlEnhanced = true;
          methodsUsed.push("MLEnhancement");
        }
      }

      // Step 7: Validate confidence
      const confidence = parsedData.confidence || 0.5;
      if (confidence < (options.minConfidence || 0.7)) {
        warnings.push(`Low confidence: ${confidence}`);
      }

      // Step 8: Learn from this parsing
      if (
        options.enableLearning !== false &&
        confidence >= (options.minConfidence || 0.7)
      ) {
        await this.storeForLearning(parsedData, text, options);
      }

      return {
        ...parsedData,
        metadata: {
          confidence,
          processingTime: Date.now() - startTime,
          methodsUsed,
          ocrUsed,
          learningApplied,
          knowledgeBaseQueried,
          mlEnhanced,
          errors,
          warnings,
        },
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown error");

      // Fallback to base parser
      const fallback = await this.baseParser.parseSDS(
        typeof rawText === "string" ? rawText : rawText.toString("utf-8"),
      );

      return {
        ...fallback,
        metadata: {
          confidence: 0.1,
          processingTime: Date.now() - startTime,
          methodsUsed: ["BaseParser", "Fallback"],
          ocrUsed,
          learningApplied: false,
          knowledgeBaseQueried,
          mlEnhanced: false,
          errors,
          warnings,
        },
      };
    }
  }

  /**
   * Merge knowledge base data with parsed data
   */
  private mergeKnowledgeBaseData(parsed: SDSData, kbData: any): SDSData {
    // Use KB data to fill missing fields
    if (!parsed.casNumber && kbData.metadata?.casNumber) {
      parsed.casNumber = kbData.metadata.casNumber;
    }
    if (
      !parsed.manufacturer ||
      parsed.manufacturer === "Unknown Manufacturer"
    ) {
      if (kbData.metadata?.manufacturer) {
        parsed.manufacturer = kbData.metadata.manufacturer;
      }
    }
    // Increase confidence if KB data matches
    if (
      kbData.confidence &&
      kbData.confidence > (parsed.confidence || 0) * 100
    ) {
      parsed.confidence = Math.min(1, (parsed.confidence || 0) + 0.1);
    }
    return parsed;
  }

  /**
   * Enhance with ML model predictions
   */
  private async enhanceWithML(
    data: SDSData,
    text: string,
  ): Promise<Partial<SDSData> | null> {
    try {
      const model = await mlRegistryService.getModel("msds-parser-v1");
      if (!model || model.status !== "deployed") {
        return null;
      }

      // Use ML model to predict missing fields
      // This would call the deployed model
      // For now, return null (would be implemented with actual ML inference)
      return null;
    } catch (error) {
      console.error("[enhanced-parser] ML enhancement error:", error);
      return null;
    }
  }

  /**
   * Store parsing result for learning
   */
  private async storeForLearning(
    data: SDSData,
    text: string,
    options: EnhancedParsingOptions,
  ): Promise<void> {
    try {
      // Store in knowledge base
      await knowledgeBaseService.create({
        agentId: "msds-parser",
        tenantId: options.tenantId,
        type: "fact",
        category: "chemical",
        content: `MSDS for ${data.chemicalName} (CAS: ${data.casNumber || "N/A"})`,
        summary: `Parsed MSDS with ${(data.confidence || 0) * 100}% confidence`,
        keywords: [
          data.chemicalName,
          data.casNumber || "",
          data.manufacturer,
        ].filter(Boolean),
        searchableText: text.substring(0, 1000),
        source: "parsing",
        confidence: Math.round((data.confidence || 0) * 100),
        verified: false,
        feedbackScore: 0,
        usageCount: 0,
        status: "active",
        metadata: {
          casNumber: data.casNumber,
          manufacturer: data.manufacturer,
          module: options.module,
          submissionId: options.submissionId,
        },
      });
    } catch (error) {
      console.error("[enhanced-parser] Error storing for learning:", error);
    }
  }

  /**
   * Parse with OCR for scanned documents
   */
  async parseWithOCR(
    fileBuffer: Buffer,
    fileType: "pdf" | "image",
    options: EnhancedParsingOptions = {},
  ): Promise<EnhancedParsingResult> {
    try {
      let text = "";

      if (fileType === "pdf") {
        const ocrResult = await ocrService.extractTextFromPDF(fileBuffer, {
          language: "eng",
          psm: 6,
        });
        text = ocrResult.text;
      } else {
        const ocrResult = await ocrService.extractTextFromImage(fileBuffer, {
          language: "eng",
          psm: 6,
        });
        text = ocrResult.text;
      }

      if (!text || text.length < 50) {
        throw new Error("OCR failed to extract sufficient text");
      }

      return await this.parseEnhanced(text, {
        ...options,
        enableOCR: false, // Already done
      });
    } catch (error) {
      throw new Error(
        `OCR parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export const enhancedSdsParser = new EnhancedSDSParser();
