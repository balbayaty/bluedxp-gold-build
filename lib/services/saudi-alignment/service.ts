/**
 * Saudi Alignment Service
 *
 * Main service orchestrating Vision 2030, regulatory tracking, compliance scoring, and reporting
 *
 * @module saudi-alignment
 */

import { vision2030Mapper } from "./vision-2030-mapper";
import { regulatoryTracker } from "./regulatory-tracker";
import { complianceScorer } from "./compliance-scorer";
import { reportGenerator } from "./report-generator";
import { eventBus, createEvent } from "@/lib/services/event-store";
import type {
  SaudiAlignmentService,
  Vision2030Alignment,
  ComplianceStatus,
  ComplianceScore,
} from "./types";

// ============================================================================
// MAIN SERVICE
// ============================================================================

class SaudiAlignmentServiceImpl implements SaudiAlignmentService {
  vision2030Mapper = vision2030Mapper;
  regulatoryTracker = regulatoryTracker;
  complianceScorer = complianceScorer;
  reportGenerator = reportGenerator;

  /**
   * Get comprehensive alignment for entity
   */
  async getComprehensiveAlignment(
    entityId: string,
    entityType: string,
  ): Promise<{
    vision2030: Vision2030Alignment;
    compliance: ComplianceStatus;
    score: ComplianceScore;
  }> {
    // Get all three in parallel
    const [vision2030, compliance, score] = await Promise.all([
      vision2030Mapper.calculateAlignment(entityId, entityType),
      regulatoryTracker.checkCompliance(entityId, entityType),
      complianceScorer.calculateScore(entityId, entityType),
    ]);

    // Publish comprehensive alignment event
    await eventBus.publish(
      createEvent(
        "SaudiAlignmentCalculated",
        entityId,
        entityType,
        {
          entityId,
          entityType,
          vision2030Score: vision2030.overallScore,
          complianceScore: compliance.overallCompliance,
          riskLevel: score.riskLevel,
          violationsCount: score.violations.length,
        },
        1,
        {
          correlationId: `alignment-${Date.now()}`,
          userId: "saudi-alignment-service",
        },
      ),
    );

    return {
      vision2030,
      compliance,
      score,
    };
  }

  /**
   * Get alignment summary
   */
  async getAlignmentSummary(
    entityId: string,
    entityType: string,
  ): Promise<{
    vision2030Score: number;
    complianceScore: number;
    riskLevel: string;
    violationsCount: number;
    recommendations: string[];
  }> {
    const alignment = await this.getComprehensiveAlignment(
      entityId,
      entityType,
    );

    return {
      vision2030Score: alignment.vision2030.overallScore,
      complianceScore: alignment.compliance.overallCompliance,
      riskLevel: alignment.score.riskLevel,
      violationsCount: alignment.score.violations.length,
      recommendations: [
        ...alignment.vision2030.recommendations,
        ...alignment.score.recommendations,
      ].slice(0, 10), // Top 10
    };
  }
}

// Export singleton
export const saudiAlignmentService: SaudiAlignmentService =
  new SaudiAlignmentServiceImpl();

// Export for convenience
export default saudiAlignmentService;
