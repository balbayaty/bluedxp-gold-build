/**
 * Learning & Feedback Service
 * Continuous improvement through feedback collection and analysis
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import type {
  MatchingFeedback,
  RequirementLearning,
  RequirementCompleteness,
} from "@/types/marketplace-requirements";
import { aiMatchingService } from "./aiMatchingService";
import { mlModelRegistry } from "@/lib/services/ml-registry";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// TYPES
// ============================================================================

export interface LearningInsight {
  category: string;
  insight: string;
  impact: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  evidence: string[];
  recommendations: string[];
  lastUpdated: string;
}

export interface ImprovementMetrics {
  period: {
    start: string;
    end: string;
  };
  matchingAccuracy: {
    current: number; // 0-100
    previous: number;
    improvement: number; // %
  };
  completeness: {
    average: number;
    improvement: number;
  };
  satisfaction: {
    customer: number;
    provider: number;
    improvement: number;
  };
  topImprovements: Array<{
    area: string;
    improvement: number;
    impact: string;
  }>;
}

// ============================================================================
// LEARNING & FEEDBACK SERVICE
// ============================================================================

export class LearningFeedbackService {
  /**
   * Submit feedback for matching
   */
  async submitFeedback(feedback: MatchingFeedback): Promise<void> {
    // Store feedback
    await aiMatchingService.submitFeedback(feedback);

    // Update learning models
    await this.updateLearningModels(feedback);

    // Generate insights
    await this.generateInsights(feedback);

    // Publish event
    await eventBus.publish("marketplace.learning.feedback", {
      feedbackId: feedback.id,
      outcome: feedback.outcome,
      accuracy: feedback.accuracy,
    });
  }

  /**
   * Get learning insights for a category
   */
  async getLearningInsights(category: string): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Analyze common missing fields
    const missingFieldsInsight = await this.analyzeMissingFields(category);
    if (missingFieldsInsight) {
      insights.push(missingFieldsInsight);
    }

    // Analyze matching patterns
    const matchingInsight = await this.analyzeMatchingPatterns(category);
    if (matchingInsight) {
      insights.push(matchingInsight);
    }

    // Analyze satisfaction patterns
    const satisfactionInsight =
      await this.analyzeSatisfactionPatterns(category);
    if (satisfactionInsight) {
      insights.push(satisfactionInsight);
    }

    return insights;
  }

  /**
   * Get improvement metrics
   */
  async getImprovementMetrics(period: {
    start: string;
    end: string;
  }): Promise<ImprovementMetrics> {
    // Get feedback data for period
    const feedbacks = await this.getFeedbacksForPeriod(period);

    // Calculate metrics
    const matchingAccuracy = this.calculateMatchingAccuracy(feedbacks, period);
    const completeness = this.calculateCompletenessImprovement(
      feedbacks,
      period,
    );
    const satisfaction = this.calculateSatisfactionImprovement(
      feedbacks,
      period,
    );

    // Identify top improvements
    const topImprovements = this.identifyTopImprovements(feedbacks);

    return {
      period,
      matchingAccuracy,
      completeness,
      satisfaction,
      topImprovements,
    };
  }

  /**
   * Get recommendations for improvement
   */
  async getImprovementRecommendations(category: string): Promise<string[]> {
    const recommendations: string[] = [];

    // Get learning insights
    const insights = await this.getLearningInsights(category);

    // Extract recommendations from insights
    for (const insight of insights) {
      recommendations.push(...insight.recommendations);
    }

    // Add category-specific recommendations
    const categoryRecommendations =
      await this.getCategorySpecificRecommendations(category);
    recommendations.push(...categoryRecommendations);

    return recommendations.slice(0, 10); // Top 10
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async updateLearningModels(
    feedback: MatchingFeedback,
  ): Promise<void> {
    try {
      // Update ML models with new feedback
      const models = await mlModelRegistry.getAllModels();
      const matchingModel = models.find(
        (m) => m.name === "marketplace-matching" && m.status === "deployed",
      );

      if (matchingModel) {
        // Trigger model retraining if needed
        // This would be handled by the ML registry's auto-retraining
        await eventBus.publish("ml.model.feedback", {
          modelId: matchingModel.id,
          feedback: {
            accuracy: feedback.accuracy,
            outcome: feedback.outcome,
            missingInformation: feedback.missingInformation,
          },
        });
      }
    } catch (error) {
      console.warn("Failed to update learning models:", error);
    }
  }

  private async generateInsights(feedback: MatchingFeedback): Promise<void> {
    // Store insights in knowledge base
    try {
      await knowledgeBaseService.addDocument({
        title: `Matching Feedback: ${feedback.outcome}`,
        content: JSON.stringify({
          accuracy: feedback.accuracy,
          missingInformation: feedback.missingInformation,
          suggestions: feedback.suggestions,
        }),
        category: "marketplace" as any,
        tags: ["feedback", "matching", feedback.outcome.toLowerCase()],
        metadata: {
          feedbackId: feedback.id,
          category: feedback.requirementId, // Would extract category
        },
      });
    } catch (error) {
      console.warn("Failed to store insight in knowledge base:", error);
    }
  }

  private async analyzeMissingFields(
    category: string,
  ): Promise<LearningInsight | null> {
    // Get all feedback for this category
    const feedbacks = await this.getFeedbacksForCategory(category);

    if (feedbacks.length === 0) {
      return null;
    }

    // Count missing fields
    const fieldCounts: Record<string, number> = {};
    for (const feedback of feedbacks) {
      if (feedback.missingInformation) {
        for (const field of feedback.missingInformation) {
          fieldCounts[field] = (fieldCounts[field] || 0) + 1;
        }
      }
    }

    // Find most common missing fields
    const topMissing = Object.entries(fieldCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (topMissing.length === 0) {
      return null;
    }

    const recommendations: string[] = [];
    for (const [field, count] of topMissing) {
      const percentage = (count / feedbacks.length) * 100;
      if (percentage > 30) {
        recommendations.push(
          `Add ${field} as a required field (missing in ${Math.round(percentage)}% of requests)`,
        );
      }
    }

    return {
      category,
      insight: `Common missing fields: ${topMissing.map(([f]) => f).join(", ")}`,
      impact: topMissing[0][1] > feedbacks.length * 0.5 ? "HIGH" : "MEDIUM",
      confidence: 80,
      evidence: topMissing.map(
        ([field, count]) => `${field}: missing in ${count} requests`,
      ),
      recommendations,
      lastUpdated: new Date().toISOString(),
    };
  }

  private async analyzeMatchingPatterns(
    category: string,
  ): Promise<LearningInsight | null> {
    const feedbacks = await this.getFeedbacksForCategory(category);

    if (feedbacks.length === 0) {
      return null;
    }

    // Analyze accuracy patterns
    const highAccuracy = feedbacks.filter((f) => f.accuracy >= 4).length;
    const lowAccuracy = feedbacks.filter((f) => f.accuracy <= 2).length;
    const avgAccuracy =
      feedbacks.reduce((sum, f) => sum + f.accuracy, 0) / feedbacks.length;

    const recommendations: string[] = [];
    if (avgAccuracy < 3.5) {
      recommendations.push(
        "Improve matching algorithm - current accuracy is below target",
      );
    }
    if (lowAccuracy > highAccuracy) {
      recommendations.push(
        "Review matching criteria - too many low-accuracy matches",
      );
    }

    return {
      category,
      insight: `Average matching accuracy: ${avgAccuracy.toFixed(1)}/5`,
      impact: avgAccuracy < 3 ? "HIGH" : avgAccuracy < 4 ? "MEDIUM" : "LOW",
      confidence: 85,
      evidence: [
        `High accuracy (≥4): ${highAccuracy}`,
        `Low accuracy (≤2): ${lowAccuracy}`,
      ],
      recommendations,
      lastUpdated: new Date().toISOString(),
    };
  }

  private async analyzeSatisfactionPatterns(
    category: string,
  ): Promise<LearningInsight | null> {
    const feedbacks = await this.getFeedbacksForCategory(category);

    if (feedbacks.length === 0) {
      return null;
    }

    const withSatisfaction = feedbacks.filter(
      (f) => f.customerSatisfaction || f.providerSatisfaction,
    );
    if (withSatisfaction.length === 0) {
      return null;
    }

    const avgCustomer =
      withSatisfaction
        .filter((f) => f.customerSatisfaction)
        .reduce((sum, f) => sum + (f.customerSatisfaction || 0), 0) /
      withSatisfaction.filter((f) => f.customerSatisfaction).length;

    const avgProvider =
      withSatisfaction
        .filter((f) => f.providerSatisfaction)
        .reduce((sum, f) => sum + (f.providerSatisfaction || 0), 0) /
      withSatisfaction.filter((f) => f.providerSatisfaction).length;

    const recommendations: string[] = [];
    if (avgCustomer < 4) {
      recommendations.push("Focus on improving customer satisfaction");
    }
    if (avgProvider < 4) {
      recommendations.push("Focus on improving provider satisfaction");
    }

    return {
      category,
      insight: `Customer satisfaction: ${avgCustomer.toFixed(1)}/5, Provider: ${avgProvider.toFixed(1)}/5`,
      impact: avgCustomer < 3.5 || avgProvider < 3.5 ? "HIGH" : "MEDIUM",
      confidence: 80,
      evidence: [`Based on ${withSatisfaction.length} feedback entries`],
      recommendations,
      lastUpdated: new Date().toISOString(),
    };
  }

  private async getFeedbacksForPeriod(period: {
    start: string;
    end: string;
  }): Promise<MatchingFeedback[]> {
    // Would fetch from database
    // For now, return empty array
    return [];
  }

  private async getFeedbacksForCategory(
    category: string,
  ): Promise<MatchingFeedback[]> {
    // Would fetch from database
    // For now, return empty array
    return [];
  }

  private calculateMatchingAccuracy(
    feedbacks: MatchingFeedback[],
    period: { start: string; end: string },
  ): ImprovementMetrics["matchingAccuracy"] {
    if (feedbacks.length === 0) {
      return {
        current: 0,
        previous: 0,
        improvement: 0,
      };
    }

    const current =
      feedbacks
        .filter((f) => new Date(f.createdAt) >= new Date(period.start))
        .reduce((sum, f) => sum + f.accuracy, 0) /
      feedbacks.filter((f) => new Date(f.createdAt) >= new Date(period.start))
        .length;

    const previous =
      feedbacks
        .filter((f) => {
          const date = new Date(f.createdAt);
          return (
            date < new Date(period.start) &&
            date >=
              new Date(
                new Date(period.start).getTime() -
                  (period.end === period.start ? 30 : 0) * 24 * 60 * 60 * 1000,
              )
          );
        })
        .reduce((sum, f) => sum + f.accuracy, 0) /
      feedbacks.filter((f) => {
        const date = new Date(f.createdAt);
        return (
          date < new Date(period.start) &&
          date >=
            new Date(
              new Date(period.start).getTime() -
                (period.end === period.start ? 30 : 0) * 24 * 60 * 60 * 1000,
            )
        );
      }).length;

    const improvement =
      previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      current: Math.round(current * 20), // Convert to 0-100
      previous: Math.round(previous * 20),
      improvement: Math.round(improvement * 100) / 100,
    };
  }

  private calculateCompletenessImprovement(
    feedbacks: MatchingFeedback[],
    period: { start: string; end: string },
  ): ImprovementMetrics["completeness"] {
    // Would calculate from requirement completeness data
    return {
      average: 75,
      improvement: 5,
    };
  }

  private calculateSatisfactionImprovement(
    feedbacks: MatchingFeedback[],
    period: { start: string; end: string },
  ): ImprovementMetrics["satisfaction"] {
    const currentFeedbacks = feedbacks.filter(
      (f) => new Date(f.createdAt) >= new Date(period.start),
    );
    const previousFeedbacks = feedbacks.filter(
      (f) => new Date(f.createdAt) < new Date(period.start),
    );

    const currentCustomer =
      currentFeedbacks
        .filter((f) => f.customerSatisfaction)
        .reduce((sum, f) => sum + (f.customerSatisfaction || 0), 0) /
      (currentFeedbacks.filter((f) => f.customerSatisfaction).length || 1);

    const previousCustomer =
      previousFeedbacks
        .filter((f) => f.customerSatisfaction)
        .reduce((sum, f) => sum + (f.customerSatisfaction || 0), 0) /
      (previousFeedbacks.filter((f) => f.customerSatisfaction).length || 1);

    const currentProvider =
      currentFeedbacks
        .filter((f) => f.providerSatisfaction)
        .reduce((sum, f) => sum + (f.providerSatisfaction || 0), 0) /
      (currentFeedbacks.filter((f) => f.providerSatisfaction).length || 1);

    const previousProvider =
      previousFeedbacks
        .filter((f) => f.providerSatisfaction)
        .reduce((sum, f) => sum + (f.providerSatisfaction || 0), 0) /
      (previousFeedbacks.filter((f) => f.providerSatisfaction).length || 1);

    const customerImprovement =
      previousCustomer > 0
        ? ((currentCustomer - previousCustomer) / previousCustomer) * 100
        : 0;
    const providerImprovement =
      previousProvider > 0
        ? ((currentProvider - previousProvider) / previousProvider) * 100
        : 0;

    return {
      customer: Math.round(currentCustomer * 20),
      provider: Math.round(currentProvider * 20),
      improvement:
        Math.round(((customerImprovement + providerImprovement) / 2) * 100) /
        100,
    };
  }

  private identifyTopImprovements(
    feedbacks: MatchingFeedback[],
  ): ImprovementMetrics["topImprovements"] {
    // Analyze feedback to identify top improvement areas
    const improvements: Record<string, number> = {};

    for (const feedback of feedbacks) {
      if (feedback.suggestions) {
        for (const suggestion of feedback.suggestions) {
          const area = suggestion.split(":")[0] || suggestion;
          improvements[area] = (improvements[area] || 0) + 1;
        }
      }
    }

    return Object.entries(improvements)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([area, count]) => ({
        area,
        improvement: count,
        impact:
          count > feedbacks.length * 0.3
            ? "HIGH"
            : count > feedbacks.length * 0.1
              ? "MEDIUM"
              : "LOW",
      }));
  }

  private async getCategorySpecificRecommendations(
    category: string,
  ): Promise<string[]> {
    // Category-specific recommendations based on learning
    const recommendations: Record<string, string[]> = {
      STORAGE: [
        "Always collect capacity requirements in detail",
        "Ask about temperature and humidity needs",
        "Include access hours in requirements",
      ],
      TRANSPORTATION: [
        "Collect exact origin and destination addresses",
        "Include cargo dimensions and weight",
        "Ask about special handling requirements",
      ],
      CONSULTING: [
        "Collect project scope in detail",
        "Ask about required certifications",
        "Include timeline and budget constraints",
      ],
    };

    return recommendations[category] || [];
  }
}

// Singleton instance
export const learningFeedbackService = new LearningFeedbackService();
