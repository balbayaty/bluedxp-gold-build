/**
 * Trade Compliance Module Adapter for Root Cause Analysis
 *
 * Transforms Trade Compliance-specific context and evidence for unified RCA engine
 */

import type { Evidence } from "@/types/intelligence-analytics";

export const tradeComplianceAdapter = {
  /**
   * Transform Trade Compliance context for RCA
   */
  async transformContext(
    context: Record<string, any>,
    source: any,
  ): Promise<Record<string, any>> {
    return {
      ...context,
      module: "trade-compliance",
      delayCategory: context.delayCategory || context.category,
      country: context.country,
      touchpoint: context.touchpoint,
      delayHours: context.delayHours || context.avgDelayHours,
      description: context.description || `Customs delay in ${context.country}`,
    };
  },

  /**
   * Get Trade Compliance-specific evidence
   */
  async getEvidence(
    source: any,
    context: Record<string, any>,
  ): Promise<Evidence[]> {
    const evidence: Evidence[] = [];

    // Add delay evidence
    if (context.delayHours || context.avgDelayHours) {
      evidence.push({
        id: `ev-trade-compliance-delay-${Date.now()}`,
        type: "metric",
        source: {
          module: "trade-compliance",
          entityType: "delay",
          entityId: source.entityId,
        },
        data: {
          delayHours: context.delayHours || context.avgDelayHours,
          country: context.country,
          touchpoint: context.touchpoint,
          category: context.delayCategory,
        },
        relevance: 0.9,
        quality: 0.9,
        timestamp: new Date(),
      });
    }

    // Add touchpoint evidence
    if (context.touchpointId) {
      evidence.push({
        id: `ev-trade-compliance-touchpoint-${context.touchpointId}`,
        type: "observation",
        source: {
          module: "trade-compliance",
          entityType: "touchpoint",
          entityId: context.touchpointId,
        },
        data: {
          touchpointName: context.touchpoint,
          country: context.country,
        },
        relevance: 0.8,
        quality: 0.8,
        timestamp: new Date(),
      });
    }

    return evidence;
  },
};
