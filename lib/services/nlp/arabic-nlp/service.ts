/**
 * Arabic-Native NLP Service
 *
 * Main service orchestrating all Arabic NLP components
 * Target: 86% accuracy vs 71% translation baseline
 *
 * @module arabic-nlp
 */

import { eventStore, eventBus, createEvent } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { arabicNLPEngine } from "./arabic-nlp-engine";
import { dialectProcessor } from "./dialect-processor";
import { inshallahAnalyzer } from "./inshallah-analyzer";
import { culturalContextAnalyzer } from "./cultural-context";
import { intentDetector } from "./intent-detector";
import { sentimentAnalyzer } from "./sentiment-analyzer";
import { calculateCommitmentLevel, validateAnalysis } from "./types";
import type {
  ArabicNLPService,
  ArabicNLPAnalysis,
  AnalysisOptions,
  CommitmentLevel,
} from "./types";

// ============================================================================
// MAIN SERVICE
// ============================================================================

class ArabicNLPServiceImpl implements ArabicNLPService {
  private version = "1.0.0";
  private accuracyTarget = 0.86;

  /**
   * Analyze Arabic text comprehensively
   */
  async analyze(
    text: string,
    options: AnalysisOptions = {},
  ): Promise<ArabicNLPAnalysis> {
    const startTime = Date.now();

    // Default options
    const opts: Required<AnalysisOptions> = {
      includeSentiment: options.includeSentiment !== false,
      includeIntent: options.includeIntent !== false,
      includeCulturalContext: options.includeCulturalContext !== false,
      includeInshallah: options.includeInshallah !== false,
      includeEntities: options.includeEntities !== false,
      targetAccuracy: options.targetAccuracy || this.accuracyTarget,
      useLLM: options.useLLM !== false,
      llmModel: options.llmModel || "auto",
      context: options.context || {},
    };

    // Detect language and dialect
    const languageDetection = arabicNLPEngine.detectLanguage(text);
    const normalizedText = arabicNLPEngine.normalize(text);
    const tokens = arabicNLPEngine.tokenize(text);

    // Analyze sentiment
    const sentiment = opts.includeSentiment
      ? sentimentAnalyzer.analyze(text)
      : {
          sentiment: "neutral" as const,
          confidence: 0.5,
          scores: { positive: 0.33, neutral: 0.33, negative: 0.33 },
          commitmentLevel: "neutral" as CommitmentLevel,
          indicators: [],
        };

    // Detect intent
    const intent = opts.includeIntent
      ? await intentDetector.detectIntent(text, opts.context)
      : {
          intent: "UNKNOWN" as const,
          confidence: 0.1,
          alternatives: [],
          evidence: [],
          entities: [],
        };

    // Analyze cultural context
    const culturalContext = opts.includeCulturalContext
      ? culturalContextAnalyzer.analyze(text)
      : {
          honorifics: [],
          formality: "formal" as const,
          businessPattern: {
            type: "polite" as const,
            indicators: [],
            confidence: 0.5,
          },
          relationshipDepth: "unknown" as const,
          culturalIndicators: [],
        };

    // Analyze Inshallah
    const inshallahAnalysis = opts.includeInshallah
      ? inshallahAnalyzer.analyze(text)
      : {
          detected: false,
          count: 0,
          context: "none" as const,
          commitmentScore: 1.0,
          positions: [],
          surroundingText: [],
        };

    // Extract entities (from intent detection or separately)
    const entities = opts.includeEntities ? intent.entities : [];

    // Calculate commitment level
    const commitmentLevel = calculateCommitmentLevel({
      text,
      originalText: text,
      timestamp: new Date(),
      id: `analysis-${Date.now()}`,
      language: languageDetection.language,
      dialect: languageDetection.dialect,
      languageConfidence: languageDetection.confidence,
      sentiment,
      intent,
      culturalContext,
      inshallahAnalysis,
      entities,
      tokens,
      normalizedText,
      overallConfidence: 0.8,
      qualityScore: 0.8,
      cargoPsychologyCompatible: true,
      commitmentLevel: sentiment.commitmentLevel,
      processingTime: 0,
      version: this.version,
    });

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(
      sentiment.confidence,
      intent.confidence,
      languageDetection.confidence,
      inshallahAnalysis.commitmentScore,
    );

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(
      text,
      languageDetection,
      sentiment,
      intent,
      culturalContext,
    );

    // Create analysis result
    const analysis: ArabicNLPAnalysis = {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      text,
      originalText: text,
      timestamp: new Date(),
      language: languageDetection.language,
      dialect: languageDetection.dialect,
      languageConfidence: languageDetection.confidence,
      sentiment,
      intent,
      culturalContext,
      inshallahAnalysis,
      entities,
      tokens,
      normalizedText,
      overallConfidence,
      qualityScore,
      cargoPsychologyCompatible: true,
      commitmentLevel,
      processingTime: Date.now() - startTime,
      version: this.version,
      model: opts.useLLM ? opts.llmModel : undefined,
    };

    // Validate analysis
    if (!validateAnalysis(analysis)) {
      throw new Error("Invalid analysis result");
    }

    // Store learning signal
    await this.storeLearningSignal(analysis, opts.context);

    // Publish event
    await eventBus.publish(
      createEvent(
        "ArabicNLPAnalysisCompleted",
        opts.context?.shipmentId || "unknown",
        "Shipment",
        {
          analysisId: analysis.id,
          intent: intent.intent,
          sentiment: sentiment.sentiment,
          commitmentLevel,
          confidence: overallConfidence,
        },
        1,
        {
          correlationId: `nlp-${Date.now()}`,
          userId: "arabic-nlp-service",
        },
      ),
    );

    return analysis;
  }

  /**
   * Detect intent in business communication
   */
  async detectIntent(text: string): Promise<import("./types").IntentDetection> {
    return intentDetector.detectIntent(text);
  }

  /**
   * Analyze sentiment
   */
  async analyzeSentiment(
    text: string,
  ): Promise<import("./types").SentimentAnalysis> {
    return sentimentAnalyzer.analyze(text);
  }

  /**
   * Analyze cultural context
   */
  async analyzeCulturalContext(
    text: string,
  ): Promise<import("./types").CulturalContext> {
    return culturalContextAnalyzer.analyze(text);
  }

  /**
   * Analyze Inshallah usage
   */
  async analyzeInshallah(
    text: string,
  ): Promise<import("./types").InshallahAnalysis> {
    return inshallahAnalyzer.analyze(text);
  }

  /**
   * Detect language and dialect
   */
  async detectLanguage(text: string): Promise<{
    language: import("./types").Language;
    dialect: import("./types").ArabicDialect;
    confidence: number;
  }> {
    return arabicNLPEngine.detectLanguage(text);
  }

  /**
   * Normalize Arabic text
   */
  async normalize(text: string): Promise<string> {
    return arabicNLPEngine.normalize(text);
  }

  /**
   * Tokenize Arabic text
   */
  async tokenize(text: string): Promise<import("./types").Token[]> {
    return arabicNLPEngine.tokenize(text);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(
    sentimentConfidence: number,
    intentConfidence: number,
    languageConfidence: number,
    inshallahScore: number,
  ): number {
    // Weighted average
    const weights = {
      sentiment: 0.25,
      intent: 0.35,
      language: 0.2,
      inshallah: 0.2,
    };

    return (
      sentimentConfidence * weights.sentiment +
      intentConfidence * weights.intent +
      languageConfidence * weights.language +
      inshallahScore * weights.inshallah
    );
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(
    text: string,
    languageDetection: {
      language: import("./types").Language;
      dialect: import("./types").ArabicDialect;
      confidence: number;
    },
    sentiment: import("./types").SentimentAnalysis,
    intent: import("./types").IntentDetection,
    culturalContext: import("./types").CulturalContext,
  ): number {
    let score = 0;

    // Text length (longer = better quality, up to a point)
    const lengthScore = Math.min(1.0, text.length / 100);
    score += lengthScore * 0.1;

    // Language detection confidence
    score += languageDetection.confidence * 0.2;

    // Sentiment confidence
    score += sentiment.confidence * 0.2;

    // Intent confidence
    score += intent.confidence * 0.3;

    // Cultural context richness
    const culturalScore = Math.min(
      1.0,
      culturalContext.honorifics.length * 0.1 +
        culturalContext.culturalIndicators.length * 0.1,
    );
    score += culturalScore * 0.2;

    return Math.min(1.0, score);
  }

  /**
   * Store learning signal
   */
  private async storeLearningSignal(
    analysis: ArabicNLPAnalysis,
    context?: {
      shipmentId?: string;
      customerId?: string;
      previousMessages?: string[];
    },
  ): Promise<void> {
    try {
      await knowledgeBaseService.learn({
        tenantId: "default",
        agentId: "arabic-nlp-service",
        type: "text_analysis",
        trigger: `Arabic NLP analysis for: ${analysis.text.substring(0, 50)}`,
        input: {
          text: analysis.text.substring(0, 200),
          language: analysis.language,
          dialect: analysis.dialect,
        },
        output: {
          intent: analysis.intent.intent,
          sentiment: analysis.sentiment.sentiment,
          commitmentLevel: analysis.commitmentLevel,
          confidence: analysis.overallConfidence,
        },
        confidence: analysis.overallConfidence,
        success: analysis.overallConfidence >= this.accuracyTarget,
      });
    } catch (error) {
      console.warn("Error storing learning signal:", error);
    }
  }
}

// Export singleton
export const arabicNLPService: ArabicNLPService = new ArabicNLPServiceImpl();

// Export for convenience
export default arabicNLPService;
