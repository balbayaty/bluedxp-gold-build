/**
 * Correlation Service
 *
 * Finds correlations between factors across modules
 */

import { eventStore } from "@/lib/services/event-store";
import type { Correlation, Evidence } from "@/types/intelligence-analytics";

export class CorrelationService {
  private static instance: CorrelationService;

  private constructor() {}

  static getInstance(): CorrelationService {
    if (!CorrelationService.instance) {
      CorrelationService.instance = new CorrelationService();
    }
    return CorrelationService.instance;
  }

  /**
   * Find correlations
   */
  async findCorrelations(params: {
    tenantId: string;
    evidence: Evidence[];
    timeWindow?: number; // milliseconds
  }): Promise<Correlation[]> {
    const { tenantId, evidence, timeWindow = 3600000 } = evidence; // 1 hour default
    const correlations: Correlation[] = [];

    // Find correlations between evidence items
    for (let i = 0; i < evidence.length; i++) {
      for (let j = i + 1; j < evidence.length; j++) {
        const ev1 = evidence[i];
        const ev2 = evidence[j];

        // Check temporal correlation
        const timeDiff = Math.abs(
          new Date(ev1.timestamp).getTime() - new Date(ev2.timestamp).getTime(),
        );

        if (timeDiff < timeWindow) {
          // Calculate correlation strength
          const correlation = this.calculateCorrelation(ev1, ev2);

          if (Math.abs(correlation) > 0.3) {
            // Only significant correlations
            correlations.push({
              id: `corr-${ev1.id}-${ev2.id}`,
              factor1: ev1.id,
              factor2: ev2.id,
              correlation,
              significance: this.calculateSignificance(ev1, ev2, correlation),
              evidence: [ev1.id, ev2.id],
              modules: [ev1.source.module, ev2.source.module],
              timestamp: new Date(),
            });
          }
        }
      }
    }

    // Find module correlations
    const moduleCorrelations = this.findModuleCorrelations(evidence, tenantId);
    correlations.push(...moduleCorrelations);

    return correlations.sort(
      (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation),
    );
  }

  /**
   * Calculate correlation between two evidence items
   */
  private calculateCorrelation(ev1: Evidence, ev2: Evidence): number {
    let correlation = 0;

    // Same module correlation
    if (ev1.source.module === ev2.source.module) {
      correlation += 0.3;
    }

    // Same entity type correlation
    if (ev1.source.entityType === ev2.source.entityType) {
      correlation += 0.2;
    }

    // Type-based correlation
    if (ev1.type === ev2.type) {
      correlation += 0.2;
    }

    // Data similarity (simple check)
    if (this.isDataSimilar(ev1.data, ev2.data)) {
      correlation += 0.3;
    }

    return Math.min(correlation, 1.0);
  }

  /**
   * Check if data is similar
   */
  private isDataSimilar(data1: any, data2: any): boolean {
    // Simple similarity check
    const str1 = JSON.stringify(data1);
    const str2 = JSON.stringify(data2);

    // Check for common keys
    if (typeof data1 === "object" && typeof data2 === "object") {
      const keys1 = Object.keys(data1);
      const keys2 = Object.keys(data2);
      const commonKeys = keys1.filter((k) => keys2.includes(k));
      return commonKeys.length > keys1.length * 0.5;
    }

    return false;
  }

  /**
   * Calculate significance
   */
  private calculateSignificance(
    ev1: Evidence,
    ev2: Evidence,
    correlation: number,
  ): number {
    let significance = Math.abs(correlation);

    // Higher significance for high-quality evidence
    significance += (ev1.quality + ev2.quality) * 0.2;

    // Higher significance for high-relevance evidence
    significance += (ev1.relevance + ev2.relevance) * 0.2;

    return Math.min(significance, 1.0);
  }

  /**
   * Find correlations between modules
   */
  private findModuleCorrelations(
    evidence: Evidence[],
    tenantId: string,
  ): Correlation[] {
    const correlations: Correlation[] = [];
    const moduleGroups = new Map<string, Evidence[]>();

    // Group evidence by module
    for (const ev of evidence) {
      if (!moduleGroups.has(ev.source.module)) {
        moduleGroups.set(ev.source.module, []);
      }
      moduleGroups.get(ev.source.module)!.push(ev);
    }

    // Find correlations between modules
    const modules = Array.from(moduleGroups.keys());
    for (let i = 0; i < modules.length; i++) {
      for (let j = i + 1; j < modules.length; j++) {
        const module1 = modules[i];
        const module2 = modules[j];
        const evs1 = moduleGroups.get(module1)!;
        const evs2 = moduleGroups.get(module2)!;

        // Check if modules have correlated events
        const correlation = this.calculateModuleCorrelation(evs1, evs2);

        if (Math.abs(correlation) > 0.3) {
          correlations.push({
            id: `corr-module-${module1}-${module2}`,
            factor1: module1,
            factor2: module2,
            correlation,
            significance: 0.7,
            evidence: [evs1[0]?.id || "", evs2[0]?.id || ""],
            modules: [module1, module2],
            timestamp: new Date(),
          });
        }
      }
    }

    return correlations;
  }

  /**
   * Calculate correlation between modules
   */
  private calculateModuleCorrelation(
    evs1: Evidence[],
    evs2: Evidence[],
  ): number {
    // Simple correlation: check if events occur close in time
    let correlations = 0;
    let total = 0;

    for (const ev1 of evs1) {
      for (const ev2 of evs2) {
        const timeDiff = Math.abs(
          new Date(ev1.timestamp).getTime() - new Date(ev2.timestamp).getTime(),
        );
        if (timeDiff < 3600000) {
          // Within 1 hour
          correlations++;
        }
        total++;
      }
    }

    return total > 0 ? correlations / total : 0;
  }
}

// Export singleton instance
export const correlationService = CorrelationService.getInstance();
