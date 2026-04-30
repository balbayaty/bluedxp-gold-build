/**
 * Copilot ML Feedback Service
 * 
 * Collects and processes user feedback for continuous learning and improvement.
 * This service enables the copilot to:
 * - Learn from successful and unsuccessful interactions
 * - Improve response quality over time
 * - Identify patterns in user preferences
 * - Train ML models for better predictions
 * 
 * 4IR & 5IR Aligned • Continuous Learning • Human-Centric AI
 */

import { eventBus } from "../event-store";
import { createEvent } from "../event-store/utils";
import { knowledgeBaseService } from "../knowledge-base";
import type { KnowledgeCategory } from "@/types/knowledgeBase";

// ============================================================================
// TYPES
// ============================================================================

export type FeedbackType = "positive" | "negative" | "neutral";
export type FeedbackReason = 
  | "helpful" 
  | "accurate" 
  | "fast" 
  | "creative"
  | "unhelpful" 
  | "inaccurate" 
  | "slow" 
  | "confusing"
  | "wrong_action"
  | "great_action"
  | "other";

export interface CopilotFeedback {
  id: string;
  tenantId: string;
  userId: string;
  conversationId: string;
  messageId: string;
  
  // Feedback details
  type: FeedbackType;
  rating?: number; // 1-5 stars
  reason?: FeedbackReason;
  comment?: string;
  
  // Context for learning
  userQuery: string;
  assistantResponse: string;
  toolsUsed?: string[];
  knowledgeUsed?: string[];
  confidence: number;
  responseTime: number;
  
  // Outcome tracking
  userFollowedSuggestion?: boolean;
  actionCompleted?: boolean;
  
  // Metadata
  moduleId?: string;
  pathname?: string;
  timestamp: Date;
}

export interface LearningPattern {
  id: string;
  tenantId: string;
  
  // Pattern identification
  patternType: "query_intent" | "response_style" | "tool_preference" | "error_pattern";
  patternKey: string; // e.g., "create_asn", "navigate_dashboard"
  
  // Statistics
  totalOccurrences: number;
  positiveCount: number;
  negativeCount: number;
  successRate: number;
  averageConfidence: number;
  
  // Learning data
  successfulResponses: string[]; // Top 5 successful response patterns
  failedResponses: string[]; // Top 5 failed response patterns
  preferredTools: string[];
  avoidedTools: string[];
  
  // Time tracking
  firstSeen: Date;
  lastSeen: Date;
  updatedAt: Date;
}

export interface MLTrainingData {
  id: string;
  tenantId: string;
  
  // Input features
  query: string;
  queryTokens: string[];
  queryIntent: string;
  moduleContext: string;
  
  // Output (what worked)
  successfulResponse: string;
  toolsUsed: string[];
  confidence: number;
  
  // Labels
  isPositive: boolean;
  rating: number;
  
  // Metadata
  timestamp: Date;
}

export interface FeedbackStats {
  totalFeedback: number;
  positiveRate: number;
  negativeRate: number;
  averageRating: number;
  topReasons: { reason: FeedbackReason; count: number }[];
  learningProgress: number; // 0-100%
  improvementTrend: "improving" | "stable" | "declining";
}

// ============================================================================
// SERVICE
// ============================================================================

class CopilotMLFeedbackService {
  private feedbacks: Map<string, CopilotFeedback> = new Map();
  private patterns: Map<string, LearningPattern> = new Map();
  private trainingData: MLTrainingData[] = [];
  
  // Thresholds for learning
  private readonly POSITIVE_THRESHOLD = 0.7;
  private readonly NEGATIVE_THRESHOLD = 0.3;
  private readonly MIN_SAMPLES_FOR_PATTERN = 5;
  
  /**
   * Submit feedback for a copilot interaction
   */
  async submitFeedback(feedback: Omit<CopilotFeedback, "id" | "timestamp">): Promise<CopilotFeedback> {
    const id = `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const fullFeedback: CopilotFeedback = {
      ...feedback,
      id,
      timestamp: new Date(),
    };
    
    // Store feedback
    this.feedbacks.set(id, fullFeedback);
    
    // Process for learning
    await this.processForLearning(fullFeedback);
    
    // Publish event
    await this.publishFeedbackEvent(fullFeedback);
    
    console.log("[ML Feedback] 📊 Feedback submitted:", {
      id,
      type: feedback.type,
      rating: feedback.rating,
      confidence: feedback.confidence,
    });
    
    return fullFeedback;
  }
  
  /**
   * Process feedback for learning patterns
   */
  private async processForLearning(feedback: CopilotFeedback): Promise<void> {
    // Extract intent from query
    const intent = this.extractIntent(feedback.userQuery);
    const patternKey = `${feedback.tenantId}:${intent}`;
    
    // Get or create pattern
    let pattern = this.patterns.get(patternKey);
    if (!pattern) {
      pattern = {
        id: `pattern-${Date.now()}`,
        tenantId: feedback.tenantId,
        patternType: "query_intent",
        patternKey: intent,
        totalOccurrences: 0,
        positiveCount: 0,
        negativeCount: 0,
        successRate: 0,
        averageConfidence: 0,
        successfulResponses: [],
        failedResponses: [],
        preferredTools: [],
        avoidedTools: [],
        firstSeen: new Date(),
        lastSeen: new Date(),
        updatedAt: new Date(),
      };
    }
    
    // Update pattern
    pattern.totalOccurrences++;
    pattern.lastSeen = new Date();
    pattern.updatedAt = new Date();
    
    if (feedback.type === "positive") {
      pattern.positiveCount++;
      
      // Track successful response
      if (pattern.successfulResponses.length < 5) {
        pattern.successfulResponses.push(feedback.assistantResponse.substring(0, 500));
      }
      
      // Track preferred tools
      if (feedback.toolsUsed) {
        for (const tool of feedback.toolsUsed) {
          if (!pattern.preferredTools.includes(tool)) {
            pattern.preferredTools.push(tool);
          }
        }
      }
    } else if (feedback.type === "negative") {
      pattern.negativeCount++;
      
      // Track failed response
      if (pattern.failedResponses.length < 5) {
        pattern.failedResponses.push(feedback.assistantResponse.substring(0, 500));
      }
      
      // Track avoided tools
      if (feedback.toolsUsed) {
        for (const tool of feedback.toolsUsed) {
          if (!pattern.avoidedTools.includes(tool)) {
            pattern.avoidedTools.push(tool);
          }
        }
      }
    }
    
    // Update success rate
    pattern.successRate = pattern.positiveCount / pattern.totalOccurrences;
    
    // Update average confidence
    pattern.averageConfidence = 
      (pattern.averageConfidence * (pattern.totalOccurrences - 1) + feedback.confidence) / 
      pattern.totalOccurrences;
    
    this.patterns.set(patternKey, pattern);
    
    // Generate training data if we have enough samples
    if (pattern.totalOccurrences >= this.MIN_SAMPLES_FOR_PATTERN) {
      await this.generateTrainingData(feedback, intent, pattern);
    }
    
    // Store successful interactions in knowledge base
    if (feedback.type === "positive" && feedback.rating && feedback.rating >= 4) {
      await this.storeInKnowledgeBase(feedback);
    }
  }
  
  /**
   * Extract intent from user query
   */
  private extractIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Common intents
    const intents: { pattern: RegExp; intent: string }[] = [
      { pattern: /create.*asn|asn.*create/i, intent: "create_asn" },
      { pattern: /create.*proposal|proposal.*create/i, intent: "create_proposal" },
      { pattern: /create.*capa|capa.*create/i, intent: "create_capa" },
      { pattern: /create.*order|order.*create/i, intent: "create_order" },
      { pattern: /navigate|go to|open|take me/i, intent: "navigate" },
      { pattern: /analyze|analysis|insight/i, intent: "analyze" },
      { pattern: /optimize|improve|enhance/i, intent: "optimize" },
      { pattern: /list|show.*all|display/i, intent: "list" },
      { pattern: /search|find|look for/i, intent: "search" },
      { pattern: /help|what can you|capabilities/i, intent: "help" },
      { pattern: /explain|how does|what is/i, intent: "explain" },
      { pattern: /report|generate.*report/i, intent: "report" },
      { pattern: /track|status|where is/i, intent: "track" },
    ];
    
    for (const { pattern, intent } of intents) {
      if (pattern.test(lowerQuery)) {
        return intent;
      }
    }
    
    // Default to general query
    return "general_query";
  }
  
  /**
   * Generate training data for ML models
   */
  private async generateTrainingData(
    feedback: CopilotFeedback,
    intent: string,
    pattern: LearningPattern
  ): Promise<void> {
    const trainingItem: MLTrainingData = {
      id: `train-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId: feedback.tenantId,
      query: feedback.userQuery,
      queryTokens: this.tokenize(feedback.userQuery),
      queryIntent: intent,
      moduleContext: feedback.moduleId || "general",
      successfulResponse: feedback.assistantResponse,
      toolsUsed: feedback.toolsUsed || [],
      confidence: feedback.confidence,
      isPositive: feedback.type === "positive",
      rating: feedback.rating || (feedback.type === "positive" ? 4 : 2),
      timestamp: new Date(),
    };
    
    this.trainingData.push(trainingItem);
    
    // Keep training data manageable (last 10000 items)
    if (this.trainingData.length > 10000) {
      this.trainingData = this.trainingData.slice(-10000);
    }
    
    console.log("[ML Feedback] 🧠 Training data generated:", {
      intent,
      isPositive: trainingItem.isPositive,
      totalTrainingData: this.trainingData.length,
    });
  }
  
  /**
   * Tokenize query for ML processing
   */
  private tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 2);
  }
  
  /**
   * Store successful interactions in knowledge base
   */
  private async storeInKnowledgeBase(feedback: CopilotFeedback): Promise<void> {
    try {
      await knowledgeBaseService.create({
        tenantId: feedback.tenantId,
        type: "insight",
        category: "general" as KnowledgeCategory,
        content: `Successful copilot interaction:\nQuery: "${feedback.userQuery}"\nResponse: "${feedback.assistantResponse.substring(0, 1000)}"`,
        summary: `Positive feedback for: ${feedback.userQuery.substring(0, 100)}`,
        metadata: {
          source: "copilot_feedback",
          feedbackId: feedback.id,
          rating: feedback.rating,
          toolsUsed: feedback.toolsUsed,
          moduleId: feedback.moduleId,
        },
        keywords: this.tokenize(feedback.userQuery),
        searchableText: `${feedback.userQuery} ${feedback.assistantResponse}`,
        source: "ml_learning",
        confidence: feedback.confidence,
        verified: true,
      });
      
      console.log("[ML Feedback] 📚 Stored in knowledge base:", feedback.id);
    } catch (error) {
      console.warn("[ML Feedback] Failed to store in knowledge base:", error);
    }
  }
  
  /**
   * Publish feedback event
   */
  private async publishFeedbackEvent(feedback: CopilotFeedback): Promise<void> {
    try {
      await eventBus.publish(
        createEvent(
          "copilot.feedback.received",
          feedback.tenantId,
          "CopilotFeedback",
          {
            feedbackId: feedback.id,
            type: feedback.type,
            rating: feedback.rating,
            reason: feedback.reason,
            confidence: feedback.confidence,
          },
          1,
          { tenantId: feedback.tenantId, userId: feedback.userId }
        )
      );
    } catch (error) {
      console.warn("[ML Feedback] Failed to publish event:", error);
    }
  }
  
  /**
   * Get feedback statistics
   */
  getStats(tenantId: string): FeedbackStats {
    const tenantFeedbacks = Array.from(this.feedbacks.values())
      .filter(f => f.tenantId === tenantId);
    
    if (tenantFeedbacks.length === 0) {
      return {
        totalFeedback: 0,
        positiveRate: 0,
        negativeRate: 0,
        averageRating: 0,
        topReasons: [],
        learningProgress: 0,
        improvementTrend: "stable",
      };
    }
    
    const positiveCount = tenantFeedbacks.filter(f => f.type === "positive").length;
    const negativeCount = tenantFeedbacks.filter(f => f.type === "negative").length;
    
    // Calculate average rating
    const ratingsSum = tenantFeedbacks
      .filter(f => f.rating)
      .reduce((sum, f) => sum + (f.rating || 0), 0);
    const ratingsCount = tenantFeedbacks.filter(f => f.rating).length;
    
    // Count reasons
    const reasonCounts = new Map<FeedbackReason, number>();
    for (const f of tenantFeedbacks) {
      if (f.reason) {
        reasonCounts.set(f.reason, (reasonCounts.get(f.reason) || 0) + 1);
      }
    }
    
    const topReasons = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate learning progress (based on pattern coverage)
    const patterns = Array.from(this.patterns.values())
      .filter(p => p.tenantId === tenantId);
    const avgSuccessRate = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length
      : 0;
    
    // Determine improvement trend
    const recentFeedbacks = tenantFeedbacks
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
    const recentPositiveRate = recentFeedbacks.filter(f => f.type === "positive").length / recentFeedbacks.length;
    
    let improvementTrend: "improving" | "stable" | "declining" = "stable";
    const overallPositiveRate = positiveCount / tenantFeedbacks.length;
    if (recentPositiveRate > overallPositiveRate + 0.1) {
      improvementTrend = "improving";
    } else if (recentPositiveRate < overallPositiveRate - 0.1) {
      improvementTrend = "declining";
    }
    
    return {
      totalFeedback: tenantFeedbacks.length,
      positiveRate: positiveCount / tenantFeedbacks.length,
      negativeRate: negativeCount / tenantFeedbacks.length,
      averageRating: ratingsCount > 0 ? ratingsSum / ratingsCount : 0,
      topReasons,
      learningProgress: Math.round(avgSuccessRate * 100),
      improvementTrend,
    };
  }
  
  /**
   * Get learning patterns for a tenant
   */
  getPatterns(tenantId: string): LearningPattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.tenantId === tenantId)
      .sort((a, b) => b.totalOccurrences - a.totalOccurrences);
  }
  
  /**
   * Get recommendations based on learned patterns
   */
  getRecommendations(tenantId: string, query: string): {
    suggestedTools: string[];
    confidenceBoost: number;
    similarSuccessfulResponses: string[];
  } {
    const intent = this.extractIntent(query);
    const patternKey = `${tenantId}:${intent}`;
    const pattern = this.patterns.get(patternKey);
    
    if (!pattern || pattern.totalOccurrences < this.MIN_SAMPLES_FOR_PATTERN) {
      return {
        suggestedTools: [],
        confidenceBoost: 0,
        similarSuccessfulResponses: [],
      };
    }
    
    // Calculate confidence boost based on success rate
    const confidenceBoost = pattern.successRate > this.POSITIVE_THRESHOLD
      ? 0.1
      : pattern.successRate < this.NEGATIVE_THRESHOLD
        ? -0.1
        : 0;
    
    return {
      suggestedTools: pattern.preferredTools.slice(0, 3),
      confidenceBoost,
      similarSuccessfulResponses: pattern.successfulResponses.slice(0, 2),
    };
  }
  
  /**
   * Get training data for ML model export
   */
  getTrainingData(tenantId?: string): MLTrainingData[] {
    if (tenantId) {
      return this.trainingData.filter(t => t.tenantId === tenantId);
    }
    return this.trainingData;
  }
  
  /**
   * Export training data as JSON (for ML model training)
   */
  exportTrainingData(tenantId?: string): string {
    const data = this.getTrainingData(tenantId);
    return JSON.stringify(data, null, 2);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const copilotMLFeedback = new CopilotMLFeedbackService();
export default copilotMLFeedback;
