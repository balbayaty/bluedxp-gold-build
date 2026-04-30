/**
 * Arabic-Native NLP Engine Types
 *
 * Comprehensive type definitions for native Arabic language processing
 * Target: 86% accuracy vs 71% translation baseline
 *
 * @module arabic-nlp
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Language detection result
 */
export type Language = "ar" | "en" | "mixed" | "unknown";

/**
 * Dialect types
 */
export type ArabicDialect =
  | "gulf" // Gulf Arabic (Saudi, UAE, Kuwait, Qatar, Bahrain, Oman)
  | "levantine" // Levantine Arabic (Syria, Lebanon, Jordan, Palestine)
  | "egyptian" // Egyptian Arabic
  | "maghrebi" // Maghrebi Arabic (Morocco, Algeria, Tunisia)
  | "msa" // Modern Standard Arabic
  | "mixed" // Mixed dialects
  | "unknown";

/**
 * Sentiment types
 */
export type Sentiment = "positive" | "neutral" | "negative" | "mixed";

/**
 * Commitment level (for cargo psychology)
 */
export type CommitmentLevel =
  | "highly_committed"
  | "committed"
  | "neutral"
  | "uncertain"
  | "highly_uncertain";

/**
 * Formality level
 */
export type FormalityLevel = "formal" | "informal" | "mixed";

/**
 * Intent types for business communication
 */
export type BusinessIntent =
  | "CONFIRMATION" // Confirming shipment/order
  | "CANCELLATION" // Cancelling shipment/order
  | "MODIFICATION" // Modifying shipment/order
  | "INQUIRY" // Asking for information
  | "COMPLAINT" // Complaining about service
  | "APPRECIATION" // Expressing gratitude
  | "URGENT_REQUEST" // Urgent request
  | "PAYMENT_CONFIRMATION" // Confirming payment
  | "PAYMENT_INQUIRY" // Asking about payment
  | "DELIVERY_INQUIRY" // Asking about delivery
  | "DELIVERY_CONFIRMATION" // Confirming delivery
  | "DOCUMENT_REQUEST" // Requesting documents
  | "NEGOTIATION" // Negotiating price/terms
  | "UNKNOWN"; // Unknown intent

// ============================================================================
// INSHALLAH ANALYSIS
// ============================================================================

/**
 * Inshallah context types
 */
export type InshallahContext =
  | "with_date" // "Inshallah tomorrow" - relatively committed
  | "with_time" // "Inshallah at 3pm" - committed
  | "alone" // Just "Inshallah" - uncertain
  | "repeated" // "Inshallah inshallah" - very uncertain
  | "with_condition" // "Inshallah if..." - conditional
  | "none"; // No inshallah detected

/**
 * Inshallah analysis result
 */
export interface InshallahAnalysis {
  detected: boolean;
  count: number;
  context: InshallahContext;
  commitmentScore: number; // 0-1, higher = more committed
  positions: number[]; // Character positions where found
  surroundingText: string[]; // Text around each occurrence
}

// ============================================================================
// CULTURAL CONTEXT
// ============================================================================

/**
 * Honorific types
 */
export type HonorificType =
  | "sir" // سيدي / أستاذ
  | "madam" // سيدتي / أستاذة
  | "brother" // أخي / أخ
  | "sister" // أختي / أخت
  | "uncle" // عمي / عم
  | "aunt" // عمتي / عمة
  | "excellency" // معالي / فضيلة
  | "honorable" // فخامة
  | "none";

/**
 * Cultural context analysis
 */
export interface CulturalContext {
  honorifics: Honorific[];
  formality: FormalityLevel;
  businessPattern: BusinessPattern;
  relationshipDepth:
    | "strategic"
    | "regular"
    | "occasional"
    | "one_time"
    | "unknown";
  culturalIndicators: CulturalIndicator[];
}

/**
 * Honorific information
 */
export interface Honorific {
  type: HonorificType;
  text: string;
  position: number;
  confidence: number;
}

/**
 * Business communication patterns
 */
export interface BusinessPattern {
  type: "direct" | "indirect" | "polite" | "urgent" | "casual" | "formal";
  indicators: string[];
  confidence: number;
}

/**
 * Cultural indicators
 */
export interface CulturalIndicator {
  type: "greeting" | "blessing" | "prayer" | "proverb" | "expression";
  text: string;
  meaning: string;
  position: number;
}

// ============================================================================
// INTENT DETECTION
// ============================================================================

/**
 * Intent detection result
 */
export interface IntentDetection {
  intent: BusinessIntent;
  confidence: number; // 0-1
  alternatives: Array<{
    intent: BusinessIntent;
    confidence: number;
  }>;
  evidence: string[]; // Phrases/words that indicate intent
  entities: Entity[];
}

/**
 * Named entity
 */
export interface Entity {
  type:
    | "PERSON"
    | "ORGANIZATION"
    | "DATE"
    | "TIME"
    | "LOCATION"
    | "MONEY"
    | "QUANTITY"
    | "PRODUCT"
    | "SHIPMENT_ID";
  text: string;
  value?: any;
  position: number;
  confidence: number;
}

// ============================================================================
// SENTIMENT ANALYSIS
// ============================================================================

/**
 * Sentiment analysis result
 */
export interface SentimentAnalysis {
  sentiment: Sentiment;
  confidence: number;
  scores: {
    positive: number;
    neutral: number;
    negative: number;
  };
  commitmentLevel: CommitmentLevel;
  indicators: SentimentIndicator[];
}

/**
 * Sentiment indicator
 */
export interface SentimentIndicator {
  type:
    | "positive_word"
    | "negative_word"
    | "emoticon"
    | "punctuation"
    | "intensifier";
  text: string;
  position: number;
  impact: number; // -1 to 1
}

// ============================================================================
// COMPREHENSIVE ANALYSIS RESULT
// ============================================================================

/**
 * Complete Arabic NLP analysis result
 */
export interface ArabicNLPAnalysis {
  // Basic info
  id: string;
  text: string;
  originalText: string;
  timestamp: Date;

  // Language detection
  language: Language;
  dialect: ArabicDialect;
  languageConfidence: number;

  // Core analysis
  sentiment: SentimentAnalysis;
  intent: IntentDetection;
  culturalContext: CulturalContext;
  inshallahAnalysis: InshallahAnalysis;

  // Advanced features
  entities: Entity[];
  tokens: Token[];
  normalizedText: string;

  // Confidence and quality
  overallConfidence: number;
  qualityScore: number;

  // Integration
  cargoPsychologyCompatible: boolean;
  commitmentLevel: CommitmentLevel;

  // Metadata
  processingTime: number; // milliseconds
  model?: string;
  version: string;
}

/**
 * Token information
 */
export interface Token {
  text: string;
  normalized: string;
  position: number;
  type: "word" | "number" | "punctuation" | "emoticon" | "other";
  arabic?: boolean;
  dialect?: ArabicDialect;
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

/**
 * Main Arabic NLP Service interface
 */
export interface ArabicNLPService {
  /**
   * Analyze Arabic text comprehensively
   */
  analyze(text: string, options?: AnalysisOptions): Promise<ArabicNLPAnalysis>;

  /**
   * Detect intent in business communication
   */
  detectIntent(text: string): Promise<IntentDetection>;

  /**
   * Analyze sentiment
   */
  analyzeSentiment(text: string): Promise<SentimentAnalysis>;

  /**
   * Analyze cultural context
   */
  analyzeCulturalContext(text: string): Promise<CulturalContext>;

  /**
   * Analyze Inshallah usage
   */
  analyzeInshallah(text: string): Promise<InshallahAnalysis>;

  /**
   * Detect language and dialect
   */
  detectLanguage(text: string): Promise<{
    language: Language;
    dialect: ArabicDialect;
    confidence: number;
  }>;

  /**
   * Normalize Arabic text
   */
  normalize(text: string): Promise<string>;

  /**
   * Tokenize Arabic text
   */
  tokenize(text: string): Promise<Token[]>;
}

/**
 * Analysis options
 */
export interface AnalysisOptions {
  includeSentiment?: boolean;
  includeIntent?: boolean;
  includeCulturalContext?: boolean;
  includeInshallah?: boolean;
  includeEntities?: boolean;
  targetAccuracy?: number; // Target accuracy (default: 0.86)
  useLLM?: boolean; // Use LLM for advanced analysis
  llmModel?: "gpt-4" | "claude-3-opus" | "claude-3-sonnet" | "auto";
  context?: {
    shipmentId?: string;
    customerId?: string;
    previousMessages?: string[];
  };
}

// ============================================================================
// DIALECT PATTERNS
// ============================================================================

/**
 * Gulf dialect patterns
 */
export interface GulfDialectPattern {
  pattern: RegExp | string;
  meaning: string;
  msaEquivalent?: string;
  examples: string[];
  context?: string[];
}

/**
 * Regional variations
 */
export interface RegionalVariation {
  region: "saudi" | "uae" | "kuwait" | "qatar" | "bahrain" | "oman";
  variations: Array<{
    gulf: string;
    regional: string;
    meaning: string;
  }>;
}

// ============================================================================
// LEARNING & IMPROVEMENT
// ============================================================================

/**
 * Learning signal for improving accuracy
 */
export interface LearningSignal {
  id: string;
  text: string;
  predictedIntent: BusinessIntent;
  actualIntent?: BusinessIntent;
  predictedSentiment: Sentiment;
  actualSentiment?: Sentiment;
  confidence: number;
  wasCorrect: boolean;
  timestamp: Date;
  feedback?: string;
}

/**
 * Accuracy metrics
 */
export interface AccuracyMetrics {
  intentAccuracy: number;
  sentimentAccuracy: number;
  overallAccuracy: number;
  sampleSize: number;
  lastUpdated: Date;
  targetAccuracy: number; // 0.86
  improvement: number; // Percentage points above baseline (0.71)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate analysis result
 */
export function validateAnalysis(analysis: ArabicNLPAnalysis): boolean {
  return (
    analysis.text.length > 0 &&
    analysis.language !== "unknown" &&
    analysis.overallConfidence >= 0 &&
    analysis.overallConfidence <= 1
  );
}

/**
 * Calculate commitment level from analysis
 */
export function calculateCommitmentLevel(
  analysis: ArabicNLPAnalysis,
): CommitmentLevel {
  // High commitment indicators
  if (
    analysis.intent.intent === "CONFIRMATION" &&
    analysis.sentiment.sentiment === "positive" &&
    !analysis.inshallahAnalysis.detected &&
    analysis.culturalContext.formality === "formal"
  ) {
    return "highly_committed";
  }

  // Committed indicators
  if (
    (analysis.intent.intent === "CONFIRMATION" ||
      analysis.intent.intent === "PAYMENT_CONFIRMATION") &&
    analysis.sentiment.sentiment !== "negative" &&
    (analysis.inshallahAnalysis.context === "with_date" ||
      analysis.inshallahAnalysis.context === "with_time")
  ) {
    return "committed";
  }

  // Uncertain indicators
  if (
    analysis.inshallahAnalysis.detected &&
    (analysis.inshallahAnalysis.context === "alone" ||
      analysis.inshallahAnalysis.context === "repeated")
  ) {
    return analysis.inshallahAnalysis.count >= 2
      ? "highly_uncertain"
      : "uncertain";
  }

  // Default
  return "neutral";
}
