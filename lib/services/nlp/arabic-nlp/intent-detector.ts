/**
 * Intent Detector
 *
 * Detects business intent in Arabic communication
 * Target: 86% accuracy vs 71% translation baseline
 *
 * @module arabic-nlp
 */

import { callAI } from "@/utils/aiClient";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type { BusinessIntent, IntentDetection, Entity } from "./types";

// ============================================================================
// INTENT PATTERNS
// ============================================================================

/**
 * Intent patterns (for pattern-based detection)
 */
const INTENT_PATTERNS: Record<BusinessIntent, RegExp[]> = {
  CONFIRMATION: [
    /(نؤكد|نؤكد لكم|نؤكد لك)/gi,
    /(تأكيد|تأكد|تأكيداً)/gi,
    /(موافق|موافقين|موافقة)/gi,
    /(نعم|نعم|أجل)/gi,
    /(تمام|ماشي|زين)/gi,
    /(confirmed|confirm|yes|ok|okay)/gi,
  ],
  CANCELLATION: [
    /(إلغاء|إلغاء|إلغائها)/gi,
    /(إلغاء الحجز|إلغاء الشحنة)/gi,
    /(لا نريد|لا نحتاج)/gi,
    /(cancel|cancellation|canceled)/gi,
  ],
  MODIFICATION: [
    /(تعديل|تغيير|تعديلها)/gi,
    /(نريد تغيير|نريد تعديل)/gi,
    /(modify|change|modification)/gi,
  ],
  INQUIRY: [
    /(استفسار|سؤال|نريد معرفة)/gi,
    /(متى|أين|كيف|لماذا)/gi,
    /(what|when|where|how|why)/gi,
  ],
  COMPLAINT: [
    /(شكوى|مشكلة|مشاكل)/gi,
    /(غير راض|غير راضين)/gi,
    /(complaint|problem|issue)/gi,
  ],
  APPRECIATION: [
    /(شكراً|شكر|مشكور|مشكورين)/gi,
    /(نشكركم|نشكرك)/gi,
    /(thank|thanks|appreciate)/gi,
  ],
  URGENT_REQUEST: [
    /(عاجل|فوري|مستعجل|مستعجلة)/gi,
    /(أولوية|أولوية عالية)/gi,
    /(urgent|asap|immediate)/gi,
  ],
  PAYMENT_CONFIRMATION: [
    /(تم الدفع|تمت عملية الدفع)/gi,
    /(دفعنا|دفعت)/gi,
    /(payment confirmed|paid|payment done)/gi,
  ],
  PAYMENT_INQUIRY: [
    /(متى الدفع|كيف الدفع)/gi,
    /(سؤال عن الدفع)/gi,
    /(payment inquiry|payment question)/gi,
  ],
  DELIVERY_INQUIRY: [
    /(متى التسليم|أين الشحنة)/gi,
    /(سؤال عن التسليم)/gi,
    /(delivery inquiry|where is shipment)/gi,
  ],
  DELIVERY_CONFIRMATION: [
    /(تم التسليم|تم الاستلام)/gi,
    /(استلمنا|استلمت)/gi,
    /(delivered|received|delivery confirmed)/gi,
  ],
  DOCUMENT_REQUEST: [
    /(نريد المستندات|نحتاج الأوراق)/gi,
    /(طلب المستندات)/gi,
    /(documents|papers|document request)/gi,
  ],
  NEGOTIATION: [
    /(تفاوض|تفاوض|تفاوضنا)/gi,
    /(سعر|ثمن|تكلفة)/gi,
    /(negotiate|price|cost)/gi,
  ],
  UNKNOWN: [],
};

// ============================================================================
// ENTITY PATTERNS
// ============================================================================

/**
 * Entity extraction patterns
 */
const ENTITY_PATTERNS = {
  DATE: [
    /\d{1,2}\/\d{1,2}\/\d{4}/g,
    /\d{4}-\d{2}-\d{2}/g,
    /(غداً|بعد غد|اليوم|الآن|الليلة)/g,
    /(tomorrow|today|now|tonight)/gi,
  ],
  TIME: [
    /\d{1,2}:\d{2}/g,
    /(صباح|مساء|عصر|ليل)/g,
    /(morning|evening|afternoon|night)/gi,
  ],
  MONEY: [
    /(\d+)\s*(ريال|دولار|درهم|دينار)/g,
    /(\d+)\s*(SAR|USD|AED|KWD|BHD|QAR|OMR)/gi,
    /(ريال|دولار|درهم|دينار)/g,
  ],
  QUANTITY: [
    /(\d+)\s*(كيلو|طن|قطعة|صندوق|علبة)/g,
    /(\d+)\s*(kg|ton|piece|box|carton)/gi,
  ],
  SHIPMENT_ID: [
    /(شحنة|رقم الشحنة)\s*[:\-]?\s*([A-Z0-9\-]+)/gi,
    /(shipment|shipment number)\s*[:\-]?\s*([A-Z0-9\-]+)/gi,
    /\b([A-Z]{2,}\d{4,})\b/g,
  ],
};

// ============================================================================
// INTENT DETECTOR
// ============================================================================

export class IntentDetector {
  private accuracyTarget = 0.86;
  private useLLM = true; // Use LLM for better accuracy

  /**
   * Detect intent in text
   */
  async detectIntent(
    text: string,
    context?: {
      shipmentId?: string;
      customerId?: string;
      previousMessages?: string[];
    },
  ): Promise<IntentDetection> {
    // Try pattern-based detection first (fast)
    const patternResult = this.detectIntentPattern(text);

    // If high confidence, return it
    if (patternResult.confidence >= 0.85) {
      return patternResult;
    }

    // Otherwise, use LLM for better accuracy
    if (this.useLLM) {
      try {
        const llmResult = await this.detectIntentLLM(text, context);

        // Combine pattern and LLM results
        return this.combineResults(patternResult, llmResult);
      } catch (error) {
        console.warn(
          "LLM intent detection failed, using pattern result:",
          error,
        );
        return patternResult;
      }
    }

    return patternResult;
  }

  /**
   * Detect intent using patterns
   */
  private detectIntentPattern(text: string): IntentDetection {
    const scores: Record<BusinessIntent, number> = {} as any;
    const evidence: Record<BusinessIntent, string[]> = {} as any;

    // Initialize scores
    for (const intent of Object.keys(INTENT_PATTERNS) as BusinessIntent[]) {
      scores[intent] = 0;
      evidence[intent] = [];
    }

    // Score each intent
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          scores[intent as BusinessIntent] += matches.length;
          evidence[intent as BusinessIntent].push(...matches);
        }
      }
    }

    // Find best intent
    let maxScore = 0;
    let bestIntent: BusinessIntent = "UNKNOWN";

    for (const [intent, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        bestIntent = intent as BusinessIntent;
      }
    }

    // Calculate confidence
    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
    const confidence = totalScore > 0 ? maxScore / totalScore : 0.1;

    // Get alternatives
    const alternatives = Object.entries(scores)
      .filter(([intent, score]) => intent !== bestIntent && score > 0)
      .map(([intent, score]) => ({
        intent: intent as BusinessIntent,
        confidence: totalScore > 0 ? score / totalScore : 0,
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    // Extract entities
    const entities = this.extractEntities(text);

    return {
      intent: bestIntent,
      confidence: Math.min(1.0, confidence),
      alternatives,
      evidence: evidence[bestIntent] || [],
      entities,
    };
  }

  /**
   * Detect intent using LLM (for higher accuracy)
   */
  private async detectIntentLLM(
    text: string,
    context?: {
      shipmentId?: string;
      customerId?: string;
      previousMessages?: string[];
    },
  ): Promise<IntentDetection> {
    const systemPrompt = `You are an expert in Arabic business communication analysis. 
Analyze the following Arabic text and determine the business intent.

Available intents:
- CONFIRMATION: Confirming shipment/order
- CANCELLATION: Cancelling shipment/order
- MODIFICATION: Modifying shipment/order
- INQUIRY: Asking for information
- COMPLAINT: Complaining about service
- APPRECIATION: Expressing gratitude
- URGENT_REQUEST: Urgent request
- PAYMENT_CONFIRMATION: Confirming payment
- PAYMENT_INQUIRY: Asking about payment
- DELIVERY_INQUIRY: Asking about delivery
- DELIVERY_CONFIRMATION: Confirming delivery
- DOCUMENT_REQUEST: Requesting documents
- NEGOTIATION: Negotiating price/terms
- UNKNOWN: Unknown intent

Consider:
- Gulf dialect variations
- Cultural context
- Business communication patterns
- Implicit vs explicit meaning

Respond in JSON format:
{
  "intent": "INTENT_TYPE",
  "confidence": 0.0-1.0,
  "evidence": ["phrase1", "phrase2"],
  "alternatives": [{"intent": "INTENT", "confidence": 0.0-1.0}]
}`;

    const userPrompt = `Text to analyze: "${text}"
${context?.previousMessages ? `Previous messages: ${context.previousMessages.join("; ")}` : ""}`;

    try {
      const response = await callAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          provider: "auto",
          model: "gpt-4",
          temperature: 0.3,
        },
      );

      // Parse JSON response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);

        // Extract entities
        const entities = this.extractEntities(text);

        return {
          intent: result.intent || "UNKNOWN",
          confidence: result.confidence || 0.5,
          alternatives: result.alternatives || [],
          evidence: result.evidence || [],
          entities,
        };
      }
    } catch (error) {
      console.warn("LLM intent detection error:", error);
    }

    // Fallback to pattern-based
    return this.detectIntentPattern(text);
  }

  /**
   * Combine pattern and LLM results
   */
  private combineResults(
    patternResult: IntentDetection,
    llmResult: IntentDetection,
  ): IntentDetection {
    // Weight LLM result more (70%) if confidence is high
    if (llmResult.confidence >= 0.7) {
      return {
        intent: llmResult.intent,
        confidence: llmResult.confidence * 0.7 + patternResult.confidence * 0.3,
        alternatives: [
          ...llmResult.alternatives,
          ...patternResult.alternatives.filter(
            (a) => a.intent !== llmResult.intent,
          ),
        ].slice(0, 3),
        evidence: [
          ...new Set([...llmResult.evidence, ...patternResult.evidence]),
        ],
        entities: [...llmResult.entities, ...patternResult.entities],
      };
    }

    // Otherwise, use pattern result
    return patternResult;
  }

  /**
   * Extract entities from text
   */
  private extractEntities(text: string): Entity[] {
    const entities: Entity[] = [];

    // Extract dates
    for (const pattern of ENTITY_PATTERNS.DATE) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: "DATE",
          text: match[0],
          value: match[0],
          position: match.index,
          confidence: 0.9,
        });
      }
    }

    // Extract times
    for (const pattern of ENTITY_PATTERNS.TIME) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: "TIME",
          text: match[0],
          value: match[0],
          position: match.index,
          confidence: 0.9,
        });
      }
    }

    // Extract money
    for (const pattern of ENTITY_PATTERNS.MONEY) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: "MONEY",
          text: match[0],
          value: {
            amount: match[1],
            currency: match[2],
          },
          position: match.index,
          confidence: 0.85,
        });
      }
    }

    // Extract quantities
    for (const pattern of ENTITY_PATTERNS.QUANTITY) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: "QUANTITY",
          text: match[0],
          value: {
            amount: match[1],
            unit: match[2],
          },
          position: match.index,
          confidence: 0.85,
        });
      }
    }

    // Extract shipment IDs
    for (const pattern of ENTITY_PATTERNS.SHIPMENT_ID) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: "SHIPMENT_ID",
          text: match[2] || match[1],
          value: match[2] || match[1],
          position: match.index,
          confidence: 0.8,
        });
      }
    }

    // Remove duplicates and sort by position
    const uniqueEntities = entities.filter(
      (e, i, arr) =>
        arr.findIndex((a) => a.position === e.position && a.type === e.type) ===
        i,
    );

    return uniqueEntities.sort((a, b) => a.position - b.position);
  }

  /**
   * Learn from feedback (for improving accuracy)
   */
  async learnFromFeedback(
    text: string,
    predictedIntent: BusinessIntent,
    actualIntent: BusinessIntent,
    wasCorrect: boolean,
  ): Promise<void> {
    // Store learning signal in Knowledge Base
    try {
      await knowledgeBaseService.learn({
        tenantId: "default",
        agentId: "arabic-nlp-intent-detector",
        type: "intent_prediction",
        trigger: `Intent prediction for: ${text.substring(0, 50)}`,
        input: {
          text: text.substring(0, 200),
          predictedIntent,
        },
        output: {
          actualIntent,
          wasCorrect,
        },
        confidence: wasCorrect ? 1.0 : 0.0,
        success: wasCorrect,
      });
    } catch (error) {
      console.warn("Error storing learning signal:", error);
    }
  }
}

// Export singleton
export const intentDetector = new IntentDetector();
