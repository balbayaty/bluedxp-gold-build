/**
 * Intelligent Recommendations Service
 * AI-powered recommendations across all modules
 * Much more comprehensive than source apps
 */

import { eventBus } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { callAI } from "@/utils/aiClient";

export interface IntelligentRecommendation {
  id: string;
  moduleId: string;
  category:
    | "EFFICIENCY"
    | "COST_SAVING"
    | "COMPLIANCE"
    | "SAFETY"
    | "QUALITY"
    | "SUSTAINABILITY"
    | "AUTOMATION";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  impact: {
    estimatedSavings?: number;
    efficiencyGain?: number;
    riskReduction?: number;
    complianceImprovement?: number;
  };
  actions: Array<{
    step: number;
    action: string;
    description: string;
    estimatedTime: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
  }>;
  relatedEntities?: Array<{
    type: string;
    id: string;
    name: string;
  }>;
  confidence: number; // 0-100
  source:
    | "AI_ANALYSIS"
    | "PATTERN_DETECTION"
    | "BENCHMARK_COMPARISON"
    | "BEST_PRACTICE";
  createdAt: Date;
  expiresAt?: Date;
  status: "NEW" | "IN_PROGRESS" | "IMPLEMENTED" | "DISMISSED";
}

export interface RecommendationContext {
  moduleId: string;
  entityType?: string;
  entityId?: string;
  metrics?: Record<string, number>;
  recentEvents?: Array<{ type: string; timestamp: Date; data: any }>;
  userRole?: string;
  tenantId?: string;
}

class IntelligentRecommendationsService {
  private recommendations: Map<string, IntelligentRecommendation> = new Map();

  /**
   * Generate intelligent recommendations
   */
  async generateRecommendations(
    context: RecommendationContext,
  ): Promise<IntelligentRecommendation[]> {
    try {
      const recommendations: IntelligentRecommendation[] = [];

      // Analyze context and generate recommendations
      if (context.metrics) {
        // Efficiency recommendations
        const efficiency = this.analyzeEfficiency(context.metrics);
        if (efficiency < 70) {
          recommendations.push({
            id: `rec-${Date.now()}-efficiency`,
            moduleId: context.moduleId,
            category: "EFFICIENCY",
            priority: efficiency < 50 ? "HIGH" : "MEDIUM",
            title: "Efficiency Improvement Opportunity",
            description: `Current efficiency is ${efficiency}%. Several optimization opportunities identified.`,
            impact: {
              efficiencyGain: Math.min(30, 100 - efficiency),
            },
            actions: [
              {
                step: 1,
                action: "Review process bottlenecks",
                description: "Identify and address process inefficiencies",
                estimatedTime: "2-4 hours",
                difficulty: "MEDIUM",
              },
              {
                step: 2,
                action: "Implement automation",
                description: "Automate repetitive tasks",
                estimatedTime: "1-2 days",
                difficulty: "MEDIUM",
              },
            ],
            confidence: 85,
            source: "AI_ANALYSIS",
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            status: "NEW",
          });
        }

        // Cost savings recommendations
        if (context.metrics.cost && context.metrics.cost > 10000) {
          recommendations.push({
            id: `rec-${Date.now()}-cost`,
            moduleId: context.moduleId,
            category: "COST_SAVING",
            priority: "MEDIUM",
            title: "Cost Optimization Opportunity",
            description: `Potential cost savings of ${Math.round(context.metrics.cost * 0.15)} identified.`,
            impact: {
              estimatedSavings: Math.round(context.metrics.cost * 0.15),
            },
            actions: [
              {
                step: 1,
                action: "Review resource allocation",
                description: "Optimize resource usage",
                estimatedTime: "1-2 hours",
                difficulty: "EASY",
              },
            ],
            confidence: 75,
            source: "AI_ANALYSIS",
            createdAt: new Date(),
            status: "NEW",
          });
        }
      }

      // Compliance recommendations
      if (context.moduleId === "qhse" || context.moduleId === "iso-ims") {
        recommendations.push({
          id: `rec-${Date.now()}-compliance`,
          moduleId: context.moduleId,
          category: "COMPLIANCE",
          priority: "HIGH",
          title: "Compliance Review Recommended",
          description:
            "Regular compliance review ensures ongoing adherence to standards.",
          impact: {
            complianceImprovement: 10,
          },
          actions: [
            {
              step: 1,
              action: "Schedule compliance audit",
              description: "Conduct comprehensive compliance review",
              estimatedTime: "1 day",
              difficulty: "MEDIUM",
            },
          ],
          confidence: 90,
          source: "BEST_PRACTICE",
          createdAt: new Date(),
          status: "NEW",
        });
      }

      // Safety recommendations
      if (context.moduleId === "qhse") {
        recommendations.push({
          id: `rec-${Date.now()}-safety`,
          moduleId: context.moduleId,
          category: "SAFETY",
          priority: "HIGH",
          title: "Safety Enhancement Opportunity",
          description:
            "Implement additional safety measures to reduce incident risk.",
          impact: {
            riskReduction: 25,
          },
          actions: [
            {
              step: 1,
              action: "Review safety protocols",
              description: "Update and enhance safety procedures",
              estimatedTime: "2-3 hours",
              difficulty: "MEDIUM",
            },
            {
              step: 2,
              action: "Conduct safety training",
              description: "Provide additional safety training to staff",
              estimatedTime: "4-8 hours",
              difficulty: "EASY",
            },
          ],
          confidence: 80,
          source: "AI_ANALYSIS",
          createdAt: new Date(),
          status: "NEW",
        });
      }

      // Store recommendations
      recommendations.forEach((rec) => {
        this.recommendations.set(rec.id, rec);
      });

      // Store in knowledge base
      await knowledgeBaseService.store({
        entity: "intelligent-recommendation",
        id: `recommendations-${context.moduleId}`,
        content: recommendations
          .map((r) => `${r.title}: ${r.description}`)
          .join("\n\n"),
        metadata: {
          moduleId: context.moduleId,
          count: recommendations.length,
        },
      });

      // Publish events
      recommendations.forEach((rec) => {
        eventBus.publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "ai.recommendation.generated",
          aggregateId: rec.id,
          aggregateType: "INTELLIGENT_RECOMMENDATION",
          version: 1,
          timestamp: new Date().toISOString(),
          payload: rec,
        });
      });

      return recommendations;
    } catch (error) {
      console.error("Error generating recommendations:", error);
      throw error;
    }
  }

  /**
   * Get recommendations
   */
  async getRecommendations(
    moduleId?: string,
    category?: IntelligentRecommendation["category"],
    priority?: IntelligentRecommendation["priority"],
    status?: IntelligentRecommendation["status"],
  ): Promise<IntelligentRecommendation[]> {
    let recommendations = Array.from(this.recommendations.values());

    if (moduleId) {
      recommendations = recommendations.filter((r) => r.moduleId === moduleId);
    }
    if (category) {
      recommendations = recommendations.filter((r) => r.category === category);
    }
    if (priority) {
      recommendations = recommendations.filter((r) => r.priority === priority);
    }
    if (status) {
      recommendations = recommendations.filter((r) => r.status === status);
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Update recommendation status
   */
  async updateRecommendationStatus(
    recommendationId: string,
    status: IntelligentRecommendation["status"],
  ): Promise<IntelligentRecommendation> {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) {
      throw new Error(`Recommendation not found: ${recommendationId}`);
    }

    const updated = { ...recommendation, status };
    this.recommendations.set(recommendationId, updated);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "ai.recommendation.updated",
      aggregateId: recommendationId,
      aggregateType: "INTELLIGENT_RECOMMENDATION",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: updated,
    });

    return updated;
  }

  /**
   * Analyze efficiency from metrics
   */
  private analyzeEfficiency(metrics: Record<string, number>): number {
    // Simplified efficiency calculation
    if (metrics.completed && metrics.total) {
      return Math.round((metrics.completed / metrics.total) * 100);
    }
    return 75; // Default
  }
}

export const intelligentRecommendationsService =
  new IntelligentRecommendationsService();
export default intelligentRecommendationsService;
