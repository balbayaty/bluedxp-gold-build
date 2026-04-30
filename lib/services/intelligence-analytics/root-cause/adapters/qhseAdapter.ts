/**
 * QHSE Module Adapter for Root Cause Analysis
 *
 * Transforms QHSE-specific context and evidence for unified RCA engine
 */

import type { Evidence } from "@/types/intelligence-analytics";

export const qhseAdapter = {
  /**
   * Transform QHSE context for RCA
   */
  async transformContext(
    context: Record<string, any>,
    source: any,
  ): Promise<Record<string, any>> {
    return {
      ...context,
      module: "qhse",
      incidentType: context.incidentType || context.type,
      severity: context.severity || "medium",
      location: context.location,
      involved: context.involved || [],
      description: context.description || context.incidentDescription,
    };
  },

  /**
   * Get QHSE-specific evidence
   */
  async getEvidence(
    source: any,
    context: Record<string, any>,
  ): Promise<Evidence[]> {
    const evidence: Evidence[] = [];

    // Add incident-specific evidence
    if (context.incidentId) {
      evidence.push({
        id: `ev-qhse-incident-${context.incidentId}`,
        type: "observation",
        source: {
          module: "qhse",
          entityType: "incident",
          entityId: context.incidentId,
        },
        data: {
          incidentType: context.incidentType,
          severity: context.severity,
          location: context.location,
        },
        relevance: 0.9,
        quality: 0.9,
        timestamp: new Date(),
      });
    }

    // Add witness statements
    if (context.witnessStatements) {
      for (const statement of context.witnessStatements) {
        evidence.push({
          id: `ev-qhse-witness-${statement.id}`,
          type: "observation",
          source: {
            module: "qhse",
            entityType: "witness-statement",
            entityId: statement.id,
          },
          data: statement,
          relevance: 0.7,
          quality: 0.8,
          timestamp: new Date(statement.timestamp),
        });
      }
    }

    return evidence;
  },
};
