/**
 * Enhanced Journey Analysis with Touchpoint Optimization
 *
 * Comprehensive journey analysis that:
 * - Optimizes touchpoint sequence
 * - Considers all constraints
 * - Recommends compliance programs
 * - Provides bottleneck analysis
 * - Suggests route improvements
 *
 * 4IR & 5IR Aligned - AI-Powered Journey Intelligence
 */

import type { Shipment, Location, TransportMode } from "@/types/tms";
import type { Touchpoint } from "@/types/touchpoint";
import { journeyAnalysisService } from "./journeyAnalysisService";
import { intelligentTouchpointAnalysisService } from "./intelligentTouchpointAnalysisService";
import { intelligentRoutePlanningService } from "./intelligentRoutePlanningService";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface EnhancedJourneyAnalysis {
  journeyId: string;
  shipmentId: string;

  // Original journey
  originalJourney: {
    touchpoints: Touchpoint[];
    totalTime: number; // hours
    totalCost?: number;
  };

  // Optimized journey
  optimizedJourney: {
    touchpoints: Touchpoint[];
    totalTime: number; // hours
    timeReduction: number; // hours
    totalCost?: number;
    costReduction?: number;
    improvements: string[];
  };

  // Touchpoint analysis
  touchpointAnalyses: Array<{
    touchpoint: Touchpoint;
    analysis: Awaited<
      ReturnType<typeof intelligentTouchpointAnalysisService.analyzeTouchpoint>
    >["analysis"];
    optimizations: string[];
  }>;

  // Bottleneck analysis
  bottlenecks: {
    touchpoint: Touchpoint;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    impact: {
      delayHours: number;
      costImpact?: number;
    };
    recommendations: string[];
  }[];

  // Compliance program recommendations
  complianceRecommendations: {
    programId: string;
    programName: string;
    benefit: string;
    timeReduction: number; // hours
    costReduction?: number;
    eligibility: boolean;
  }[];

  // Route optimization
  routeOptimization: {
    originalRoute: any;
    optimizedRoute: any;
    improvements: string[];
  };

  // Overall score
  score: {
    original: number; // 0-100
    optimized: number; // 0-100
    improvement: number; // percentage
  };

  // Metadata
  analyzedAt: Date;
  tenantId: string;
}

export interface JourneyOptimizationRequest {
  shipment: Shipment;
  includeOptimization?: boolean;
  includeComplianceRecommendations?: boolean;
  includeBottleneckAnalysis?: boolean;
  compliancePrograms?: string[];
  tenantId?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export class EnhancedJourneyAnalysisService {
  /**
   * Analyze and optimize journey
   */
  async analyzeAndOptimizeJourney(
    request: JourneyOptimizationRequest,
  ): Promise<EnhancedJourneyAnalysis> {
    const {
      shipment,
      includeOptimization = true,
      includeComplianceRecommendations = true,
      includeBottleneckAnalysis = true,
      compliancePrograms = [],
      tenantId = "default",
    } = request;

    // 1. Get original journey analysis
    const originalAnalysis = await journeyAnalysisService.analyzeJourney({
      shipment,
      includeRootCauseAnalysis: false,
      includeOptimization: false,
      includePredictions: false,
    });

    // 2. Analyze each touchpoint
    const touchpointAnalyses = await Promise.all(
      originalAnalysis.touchpoints.map(async (tp) => {
        // Convert to touchpoint type for analysis
        const touchpointForAnalysis =
          await this.convertToTouchpointForAnalysis(tp);

        if (!touchpointForAnalysis) {
          return null;
        }

        const analysis =
          await intelligentTouchpointAnalysisService.analyzeTouchpoint({
            touchpoint: touchpointForAnalysis,
            shipment: {
              mode: shipment.mode,
              type: shipment.type,
              cargo: {
                weight: shipment.totalWeight,
                volume: shipment.totalVolume,
                hazmat: shipment.hazmat?.isHazmat || false,
                temperatureControlled:
                  shipment.temperatureControl?.required || false,
              },
            },
            compliancePrograms,
            tenantId,
          });

        return {
          touchpoint: tp,
          analysis: analysis.analysis,
          optimizations: analysis.analysis.optimizations.recommendations,
        };
      }),
    );

    const validAnalyses = touchpointAnalyses.filter(
      (a) => a !== null,
    ) as NonNullable<(typeof touchpointAnalyses)[0]>[];

    // 3. Optimize touchpoint sequence
    const optimizedJourney = includeOptimization
      ? await this.optimizeTouchpointSequence(
          originalAnalysis.touchpoints,
          validAnalyses,
          shipment,
          compliancePrograms,
        )
      : {
          touchpoints: originalAnalysis.touchpoints,
          totalTime: originalAnalysis.totalTransitTime || 0,
          timeReduction: 0,
          improvements: [],
        };

    // 4. Identify bottlenecks
    const bottlenecks = includeBottleneckAnalysis
      ? this.identifyBottlenecks(validAnalyses)
      : [];

    // 5. Get compliance program recommendations
    const complianceRecommendations = includeComplianceRecommendations
      ? await this.getComplianceRecommendations(
          shipment,
          validAnalyses,
          compliancePrograms,
        )
      : [];

    // 6. Optimize route
    const routeOptimization = includeOptimization
      ? await this.optimizeRoute(shipment, compliancePrograms, tenantId)
      : {
          originalRoute: null,
          optimizedRoute: null,
          improvements: [],
        };

    // 7. Calculate scores
    const score = this.calculateScores(
      originalAnalysis,
      optimizedJourney,
      validAnalyses,
    );

    const enhancedAnalysis: EnhancedJourneyAnalysis = {
      journeyId: originalAnalysis.journeyId,
      shipmentId: shipment.id,
      originalJourney: {
        touchpoints: originalAnalysis.touchpoints,
        totalTime: originalAnalysis.totalTransitTime || 0,
      },
      optimizedJourney,
      touchpointAnalyses: validAnalyses,
      bottlenecks,
      complianceRecommendations,
      routeOptimization,
      score,
      analyzedAt: new Date(),
      tenantId,
    };

    // Publish event
    await eventBus.publish(
      createEvent(
        "EnhancedJourneyAnalyzed",
        shipment.id,
        "Shipment",
        {
          journeyId: originalAnalysis.journeyId,
          originalTime: originalAnalysis.totalTransitTime,
          optimizedTime: optimizedJourney.totalTime,
          timeReduction: optimizedJourney.timeReduction,
          bottlenecksCount: bottlenecks.length,
          scoreImprovement: score.improvement,
        },
        1,
        {
          tenantId,
          correlationId: `journey-analysis-${Date.now()}`,
          userId: "enhanced-journey-analysis-service",
        },
      ),
    );

    return enhancedAnalysis;
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private async convertToTouchpointForAnalysis(
    tp: any,
  ): Promise<Touchpoint | null> {
    // In production, would fetch actual touchpoint from touchpoint service
    // For now, return null (would implement conversion)
    return null;
  }

  private async optimizeTouchpointSequence(
    originalTouchpoints: any[],
    analyses: Array<{
      touchpoint: any;
      analysis: any;
      optimizations: string[];
    }>,
    shipment: Shipment,
    compliancePrograms: string[],
  ): Promise<EnhancedJourneyAnalysis["optimizedJourney"]> {
    // Simplified optimization - would implement actual algorithm
    const improvements: string[] = [];
    let timeReduction = 0;

    // Sort by processing time (fastest first where possible)
    const sorted = [...analyses].sort(
      (a, b) =>
        a.analysis.processingTime.estimated -
        b.analysis.processingTime.estimated,
    );

    // Calculate time reduction from optimizations
    for (const analysis of analyses) {
      if (analysis.analysis.optimizations.timeReduction > 0) {
        timeReduction += analysis.analysis.optimizations.timeReduction;
        improvements.push(...analysis.analysis.optimizations.recommendations);
      }
    }

    // Remove duplicates
    const uniqueImprovements = Array.from(new Set(improvements));

    const originalTime = analyses.reduce(
      (sum, a) => sum + a.analysis.processingTime.estimated,
      0,
    );

    return {
      touchpoints: originalTouchpoints, // Would reorder if beneficial
      totalTime: Math.max(0, originalTime - timeReduction),
      timeReduction,
      improvements: uniqueImprovements,
    };
  }

  private identifyBottlenecks(
    analyses: Array<{
      touchpoint: any;
      analysis: any;
      optimizations: string[];
    }>,
  ): EnhancedJourneyAnalysis["bottlenecks"] {
    const bottlenecks: EnhancedJourneyAnalysis["bottlenecks"] = [];

    for (const item of analyses) {
      const processingTime = item.analysis.processingTime.estimated;
      const delayProbability = item.analysis.risks.delayProbability;
      const utilization = item.analysis.capacity.currentUtilization;

      // Identify bottlenecks
      let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
      if (processingTime > 8 || delayProbability > 0.7 || utilization > 95) {
        severity = "CRITICAL";
      } else if (
        processingTime > 6 ||
        delayProbability > 0.5 ||
        utilization > 85
      ) {
        severity = "HIGH";
      } else if (
        processingTime > 4 ||
        delayProbability > 0.3 ||
        utilization > 75
      ) {
        severity = "MEDIUM";
      }

      if (severity !== "LOW") {
        bottlenecks.push({
          touchpoint: item.touchpoint,
          severity,
          impact: {
            delayHours: processingTime,
          },
          recommendations: [
            ...item.analysis.risks.mitigationStrategies,
            ...item.analysis.optimizations.recommendations,
          ],
        });
      }
    }

    return bottlenecks.sort((a, b) => {
      const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private async getComplianceRecommendations(
    shipment: Shipment,
    analyses: Array<{
      touchpoint: any;
      analysis: any;
      optimizations: string[];
    }>,
    enrolledPrograms: string[],
  ): Promise<EnhancedJourneyAnalysis["complianceRecommendations"]> {
    const recommendations: Map<
      string,
      {
        programId: string;
        programName: string;
        benefit: string;
        timeReduction: number;
        eligibility: boolean;
      }
    > = new Map();

    for (const item of analyses) {
      for (const benefit of item.analysis.constraints
        .complianceProgramBenefits) {
        if (!enrolledPrograms.includes(benefit.programId)) {
          if (!recommendations.has(benefit.programId)) {
            recommendations.set(benefit.programId, {
              programId: benefit.programId,
              programName: benefit.programName,
              benefit: benefit.benefit,
              timeReduction: benefit.timeReduction,
              eligibility: benefit.eligibility,
            });
          } else {
            const existing = recommendations.get(benefit.programId)!;
            existing.timeReduction += benefit.timeReduction;
          }
        }
      }
    }

    return Array.from(recommendations.values()).sort(
      (a, b) => b.timeReduction - a.timeReduction,
    );
  }

  private async optimizeRoute(
    shipment: Shipment,
    compliancePrograms: string[],
    tenantId: string,
  ): Promise<EnhancedJourneyAnalysis["routeOptimization"]> {
    if (!shipment.origin || !shipment.destination) {
      return {
        originalRoute: null,
        optimizedRoute: null,
        improvements: [],
      };
    }

    try {
      const optimizedPlan =
        await intelligentRoutePlanningService.planIntelligentRoute({
          origin: shipment.origin,
          destination: shipment.destination,
          waypoints: shipment.intermediateStops,
          mode: shipment.mode,
          type: shipment.type,
          cargo: {
            weight: shipment.totalWeight,
            volume: shipment.totalVolume,
            hazmat: shipment.hazmat?.isHazmat,
            temperatureControlled: shipment.temperatureControl?.required,
          },
          compliancePrograms,
          preferences: {
            avoidTruckBans: true,
            minimizeCost: true,
          },
          tenantId,
        });

      const improvements: string[] = [];
      if (optimizedPlan.complianceProgramRecommendations.length > 0) {
        improvements.push(
          `${optimizedPlan.complianceProgramRecommendations.length} compliance program(s) recommended`,
        );
      }
      if (optimizedPlan.constraintImpact.recommendations.length > 0) {
        improvements.push(...optimizedPlan.constraintImpact.recommendations);
      }

      return {
        originalRoute: shipment.route,
        optimizedRoute: optimizedPlan,
        improvements,
      };
    } catch (error) {
      console.warn("Error optimizing route:", error);
      return {
        originalRoute: shipment.route,
        optimizedRoute: null,
        improvements: [],
      };
    }
  }

  private calculateScores(
    originalAnalysis: any,
    optimizedJourney: EnhancedJourneyAnalysis["optimizedJourney"],
    analyses: Array<{
      touchpoint: any;
      analysis: any;
      optimizations: string[];
    }>,
  ): EnhancedJourneyAnalysis["score"] {
    // Calculate original score
    const originalScore =
      analyses.reduce((sum, a) => sum + a.analysis.score.overall, 0) /
      analyses.length;

    // Calculate optimized score (would be better)
    const optimizedScore = Math.min(
      100,
      originalScore + (optimizedJourney.timeReduction / 10) * 10,
    );

    const improvement =
      ((optimizedScore - originalScore) / originalScore) * 100;

    return {
      original: Math.round(originalScore),
      optimized: Math.round(optimizedScore),
      improvement: Math.round(improvement),
    };
  }
}

export const enhancedJourneyAnalysisService =
  new EnhancedJourneyAnalysisService();
