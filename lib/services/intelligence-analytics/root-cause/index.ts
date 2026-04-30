/**
 * Root Cause Analysis Service
 * Re-export from the comprehensive root cause analysis engine
 */

import { RootCauseAnalysisEngine } from "./rootCauseAnalysisEngine";

// Create singleton instance
const engine = new RootCauseAnalysisEngine();

export const rootCauseService = {
  /**
   * Analyze root cause for any entity
   */
  async analyzeRootCause(
    entityId: string,
    entityType: string,
    issue: string,
    tenantId: string,
    context?: Record<string, any>,
  ) {
    return engine.analyze({
      entityId,
      entityType,
      issue,
      tenantId,
      context,
    });
  },

  /**
   * Get historical root cause analyses
   */
  async getHistoricalAnalyses(
    entityType: string,
    issue: string,
    tenantId: string,
  ) {
    // This would query the knowledge base for similar analyses
    return [];
  },
};
