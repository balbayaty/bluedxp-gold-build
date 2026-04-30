/**
 * Vision 2030 Mapper
 *
 * Real-time Vision 2030 alignment calculation
 * Goal tracking and progress measurement
 *
 * @module saudi-alignment
 */

import { eventStore, eventBus, createEvent } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type {
  Vision2030Mapper,
  Vision2030Alignment,
  Vision2030Goal,
  Vision2030Pillar,
} from "./types";

// ============================================================================
// VISION 2030 GOALS
// ============================================================================

/**
 * Vision 2030 goals (comprehensive list)
 */
export const VISION_2030_GOALS: Vision2030Goal[] = [
  // A Vibrant Society
  {
    id: "vibrant-1",
    pillar: "A_VIBRANT_SOCIETY",
    name: "Increase household spending on cultural and entertainment activities",
    description:
      "Increase household spending on cultural and entertainment activities inside the Kingdom from 2.9% to 6%",
    targetYear: 2030,
    kpis: [{ name: "Household spending percentage", target: 6, unit: "%" }],
  },
  {
    id: "vibrant-2",
    pillar: "A_VIBRANT_SOCIETY",
    name: "Increase the number of UNESCO-registered sites",
    description:
      "Increase the number of UNESCO-registered sites in Saudi Arabia",
    targetYear: 2030,
    kpis: [{ name: "UNESCO sites", target: 10, unit: "sites" }],
  },
  {
    id: "vibrant-3",
    pillar: "A_VIBRANT_SOCIETY",
    name: "Increase the number of pilgrims",
    description:
      "Increase the number of Umrah visitors from 8 million to 30 million annually",
    targetYear: 2030,
    kpis: [{ name: "Umrah visitors", target: 30000000, unit: "visitors" }],
  },

  // A Thriving Economy
  {
    id: "economy-1",
    pillar: "A_THRIVING_ECONOMY",
    name: "Increase non-oil government revenue",
    description:
      "Increase non-oil government revenue from SAR 163 billion to SAR 1 trillion",
    targetYear: 2030,
    kpis: [{ name: "Non-oil revenue", target: 1000000000000, unit: "SAR" }],
  },
  {
    id: "economy-2",
    pillar: "A_THRIVING_ECONOMY",
    name: "Increase SME contribution to GDP",
    description: "Increase SME contribution to GDP from 20% to 35%",
    targetYear: 2030,
    kpis: [{ name: "SME GDP contribution", target: 35, unit: "%" }],
  },
  {
    id: "economy-3",
    pillar: "A_THRIVING_ECONOMY",
    name: "Increase women's participation in the workforce",
    description:
      "Increase women's participation in the workforce from 22% to 30%",
    targetYear: 2030,
    kpis: [{ name: "Women workforce participation", target: 30, unit: "%" }],
  },
  {
    id: "economy-4",
    pillar: "A_THRIVING_ECONOMY",
    name: "Increase localization in key sectors",
    description:
      "Increase localization in key sectors (oil and gas, military, etc.)",
    targetYear: 2030,
    kpis: [{ name: "Localization percentage", target: 60, unit: "%" }],
  },

  // An Ambitious Nation
  {
    id: "nation-1",
    pillar: "AN_AMBITIOUS_NATION",
    name: "Increase government effectiveness",
    description: "Improve government effectiveness and efficiency",
    targetYear: 2030,
    kpis: [
      { name: "Government effectiveness score", target: 80, unit: "score" },
    ],
  },
  {
    id: "nation-2",
    pillar: "AN_AMBITIOUS_NATION",
    name: "Increase digital transformation",
    description: "Increase digital transformation across all sectors",
    targetYear: 2030,
    kpis: [{ name: "Digital adoption", target: 90, unit: "%" }],
  },
  {
    id: "nation-3",
    pillar: "AN_AMBITIOUS_NATION",
    name: "Increase renewable energy",
    description: "Increase renewable energy capacity to 58.7 GW",
    targetYear: 2030,
    kpis: [{ name: "Renewable energy capacity", target: 58700, unit: "MW" }],
  },
  {
    id: "nation-4",
    pillar: "AN_AMBITIOUS_NATION",
    name: "Reduce carbon emissions",
    description: "Reduce carbon emissions and achieve net-zero by 2060",
    targetYear: 2030,
    kpis: [{ name: "Carbon reduction", target: 50, unit: "%" }],
  },
];

// ============================================================================
// VISION 2030 MAPPER
// ============================================================================

export class Vision2030MapperImpl implements Vision2030Mapper {
  /**
   * Calculate Vision 2030 alignment for entity
   */
  async calculateAlignment(
    entityId: string,
    entityType: string,
  ): Promise<Vision2030Alignment> {
    // Get entity data from Event Store
    const events = await eventStore.getEvents(entityId);

    // Extract metrics from events
    const metrics = this.extractMetricsFromEvents(events, entityType);

    // Calculate alignment for each goal
    const goalAlignments = VISION_2030_GOALS.map((goal) => {
      const alignmentScore = this.calculateGoalAlignment(goal, metrics);
      const contribution = this.calculateContribution(goal, alignmentScore);
      const evidence = this.getEvidenceForGoal(goal, events);

      return {
        goalId: goal.id,
        goalName: goal.name,
        alignmentScore,
        contribution,
        evidence,
      };
    });

    // Calculate pillar scores
    const pillarScores = this.calculatePillarScores(goalAlignments);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(pillarScores);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      goalAlignments,
      pillarScores,
    );

    return {
      overallScore,
      pillarScores,
      goalAlignments,
      recommendations,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get all Vision 2030 goals
   */
  getAllGoals(): Vision2030Goal[] {
    return VISION_2030_GOALS;
  }

  /**
   * Track progress towards goals
   */
  async trackProgress(
    goalId: string,
    metrics: Record<string, number>,
  ): Promise<void> {
    const goal = VISION_2030_GOALS.find((g) => g.id === goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`);
    }

    // Store progress in Knowledge Base
    try {
      await knowledgeBaseService.learn({
        tenantId: "default",
        agentId: "vision-2030-mapper",
        type: "goal_progress",
        trigger: `Progress tracking for goal ${goalId}`,
        input: {
          goalId,
          goalName: goal.name,
          metrics,
        },
        output: {
          progress: this.calculateProgress(goal, metrics),
        },
        confidence: 0.9,
        success: true,
      });
    } catch (error) {
      console.warn("Error storing goal progress:", error);
    }

    // Publish event
    await eventBus.publish(
      createEvent(
        "Vision2030GoalProgress",
        goalId,
        "Vision2030Goal",
        {
          goalId,
          goalName: goal.name,
          metrics,
          progress: this.calculateProgress(goal, metrics),
        },
        1,
        {
          correlationId: `progress-${Date.now()}`,
          userId: "vision-2030-mapper",
        },
      ),
    );
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Extract metrics from events
   */
  private extractMetricsFromEvents(
    events: any[],
    entityType: string,
  ): Record<string, number> {
    const metrics: Record<string, number> = {};

    // Extract various metrics based on entity type
    if (entityType === "Shipment" || entityType === "Transportation") {
      // Transportation-related metrics
      const carbonEvents = events.filter(
        (e) => e.type?.includes("carbon") || e.type?.includes("emission"),
      );
      if (carbonEvents.length > 0) {
        metrics.carbonFootprintTracking = 1;
        metrics.carbonReduction = this.calculateAverageReduction(carbonEvents);
      }

      const digitalEvents = events.filter(
        (e) => e.type?.includes("digital") || e.type?.includes("automation"),
      );
      metrics.digitalTransformation = digitalEvents.length > 0 ? 1 : 0;
      metrics.digitalAdoption =
        (digitalEvents.length / Math.max(1, events.length)) * 100;
    }

    if (entityType === "Warehouse" || entityType === "Facility") {
      // Facility-related metrics
      const renewableEvents = events.filter(
        (e) => e.type?.includes("renewable") || e.type?.includes("solar"),
      );
      metrics.renewableEnergyUsage = renewableEvents.length > 0 ? 1 : 0;
      metrics.renewableEnergyPercentage = renewableEvents.length > 0 ? 50 : 0; // Would calculate from actual data
    }

    return metrics;
  }

  /**
   * Calculate goal alignment
   */
  private calculateGoalAlignment(
    goal: Vision2030Goal,
    metrics: Record<string, number>,
  ): number {
    let score = 0;
    let maxScore = 0;

    for (const kpi of goal.kpis) {
      maxScore += 100;
      const metricValue =
        metrics[kpi.name.toLowerCase().replace(/\s+/g, "_")] || 0;
      const progress = Math.min(100, (metricValue / kpi.target) * 100);
      score += progress;
    }

    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  }

  /**
   * Calculate contribution
   */
  private calculateContribution(
    goal: Vision2030Goal,
    alignmentScore: number,
  ): number {
    // Weight by pillar importance
    const pillarWeights: Record<Vision2030Pillar, number> = {
      A_VIBRANT_SOCIETY: 0.3,
      A_THRIVING_ECONOMY: 0.4,
      AN_AMBITIOUS_NATION: 0.3,
    };

    return alignmentScore * (pillarWeights[goal.pillar] || 0.33);
  }

  /**
   * Get evidence for goal
   */
  private getEvidenceForGoal(goal: Vision2030Goal, events: any[]): string[] {
    const evidence: string[] = [];

    // Find relevant events
    const relevantEvents = events.filter((e) => {
      const eventType = e.type?.toLowerCase() || "";
      const goalName = goal.name.toLowerCase();

      return goalName.split(" ").some((word) => eventType.includes(word));
    });

    evidence.push(...relevantEvents.map((e) => `${e.type} at ${e.timestamp}`));

    return evidence.slice(0, 5); // Limit to 5 most relevant
  }

  /**
   * Calculate pillar scores
   */
  private calculatePillarScores(
    goalAlignments: Array<{
      goalId: string;
      goalName: string;
      alignmentScore: number;
      contribution: number;
      evidence: string[];
    }>,
  ): Record<Vision2030Pillar, number> {
    const pillarScores: Record<Vision2030Pillar, number> = {
      A_VIBRANT_SOCIETY: 0,
      A_THRIVING_ECONOMY: 0,
      AN_AMBITIOUS_NATION: 0,
    };

    const pillarCounts: Record<Vision2030Pillar, number> = {
      A_VIBRANT_SOCIETY: 0,
      A_THRIVING_ECONOMY: 0,
      AN_AMBITIOUS_NATION: 0,
    };

    for (const alignment of goalAlignments) {
      const goal = VISION_2030_GOALS.find((g) => g.id === alignment.goalId);
      if (goal) {
        pillarScores[goal.pillar] += alignment.alignmentScore;
        pillarCounts[goal.pillar]++;
      }
    }

    // Average scores
    for (const pillar of Object.keys(pillarScores) as Vision2030Pillar[]) {
      if (pillarCounts[pillar] > 0) {
        pillarScores[pillar] = pillarScores[pillar] / pillarCounts[pillar];
      }
    }

    return pillarScores;
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(
    pillarScores: Record<Vision2030Pillar, number>,
  ): number {
    const weights: Record<Vision2030Pillar, number> = {
      A_VIBRANT_SOCIETY: 0.3,
      A_THRIVING_ECONOMY: 0.4,
      AN_AMBITIOUS_NATION: 0.3,
    };

    return Object.entries(pillarScores).reduce(
      (sum, [pillar, score]) =>
        sum + score * weights[pillar as Vision2030Pillar],
      0,
    );
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    goalAlignments: Array<{
      goalId: string;
      goalName: string;
      alignmentScore: number;
      contribution: number;
      evidence: string[];
    }>,
    pillarScores: Record<Vision2030Pillar, number>,
  ): string[] {
    const recommendations: string[] = [];

    // Find low-scoring goals
    const lowScoringGoals = goalAlignments.filter((a) => a.alignmentScore < 50);
    for (const alignment of lowScoringGoals.slice(0, 3)) {
      const goal = VISION_2030_GOALS.find((g) => g.id === alignment.goalId);
      if (goal) {
        recommendations.push(
          `Improve alignment with "${goal.name}" - current score: ${alignment.alignmentScore.toFixed(1)}%`,
        );
      }
    }

    // Find low-scoring pillars
    const lowScoringPillars = Object.entries(pillarScores)
      .filter(([_, score]) => score < 60)
      .map(([pillar, _]) => pillar);

    for (const pillar of lowScoringPillars) {
      recommendations.push(
        `Focus on ${pillar.replace(/_/g, " ")} - current pillar score: ${pillarScores[pillar as Vision2030Pillar].toFixed(1)}%`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Excellent Vision 2030 alignment - continue current initiatives",
      );
    }

    return recommendations;
  }

  /**
   * Calculate progress
   */
  private calculateProgress(
    goal: Vision2030Goal,
    metrics: Record<string, number>,
  ): number {
    return this.calculateGoalAlignment(goal, metrics);
  }

  /**
   * Calculate average reduction
   */
  private calculateAverageReduction(events: any[]): number {
    // Would calculate from actual event data
    return events.length > 0 ? 10 : 0; // Placeholder
  }
}

// Export singleton
export const vision2030Mapper: Vision2030Mapper = new Vision2030MapperImpl();
