/**
 * ISO-IMS Module Adapter for Root Cause Analysis
 *
 * Transforms ISO-IMS-specific context and evidence for unified RCA engine
 */

import type { Evidence } from "@/types/intelligence-analytics";

export const isoImsAdapter = {
  /**
   * Transform ISO-IMS context for RCA
   */
  async transformContext(
    context: Record<string, any>,
    source: any,
  ): Promise<Record<string, any>> {
    return {
      ...context,
      module: "iso-ims",
      ncrType: context.ncrType || context.type,
      standard: context.standard || "ISO 9001",
      requirement: context.requirement,
      description: context.description || context.ncrDescription,
      severity: context.severity || "medium",
    };
  },

  /**
   * Get ISO-IMS-specific evidence
   */
  async getEvidence(
    source: any,
    context: Record<string, any>,
  ): Promise<Evidence[]> {
    const evidence: Evidence[] = [];

    // Add NCR evidence
    if (context.ncrId) {
      evidence.push({
        id: `ev-iso-ims-ncr-${context.ncrId}`,
        type: "observation",
        source: {
          module: "iso-ims",
          entityType: "ncr",
          entityId: context.ncrId,
        },
        data: {
          ncrType: context.ncrType,
          standard: context.standard,
          requirement: context.requirement,
        },
        relevance: 0.9,
        quality: 0.9,
        timestamp: new Date(),
      });
    }

    // Add compliance evidence
    if (context.complianceScore !== undefined) {
      evidence.push({
        id: `ev-iso-ims-compliance-${Date.now()}`,
        type: "metric",
        source: {
          module: "iso-ims",
          entityType: "compliance",
          entityId: source.entityId,
        },
        data: {
          complianceScore: context.complianceScore,
          standard: context.standard,
        },
        relevance: 0.8,
        quality: 0.9,
        timestamp: new Date(),
      });
    }

    return evidence;
  },
};
