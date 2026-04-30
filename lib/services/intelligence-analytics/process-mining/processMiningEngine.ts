/**
 * Unified Process Mining Engine
 *
 * Cross-module process discovery, conformance checking, cost mining
 */

import { eventStore } from "@/lib/services/event-store";
import type {
  ProcessMiningResult,
  ProcessVariant,
  ProcessDeviation,
} from "@/types/intelligence-analytics";

export class ProcessMiningEngine {
  private static instance: ProcessMiningEngine;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): ProcessMiningEngine {
    if (!ProcessMiningEngine.instance) {
      ProcessMiningEngine.instance = new ProcessMiningEngine();
    }
    return ProcessMiningEngine.instance;
  }

  /**
   * Initialize the process mining engine
   */
  async initialize(tenantId: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log("🔍 Initializing Unified Process Mining Engine...");
    this.isInitialized = true;
    console.log("✅ Unified Process Mining Engine initialized");
  }

  /**
   * Discover process
   */
  async discoverProcess(request: {
    tenantId: string;
    processType: string;
    moduleIds?: string[];
    timeRange?: { start: Date | string; end: Date | string };
  }): Promise<ProcessMiningResult> {
    const { tenantId, processType, moduleIds = [], timeRange } = request;

    console.log(
      `🔍 Discovering process: ${processType} for tenant: ${tenantId}`,
    );

    // Get events for process
    const events = await this.getProcessEvents(
      tenantId,
      processType,
      moduleIds,
      timeRange,
    );

    // Discover variants
    const variants = await this.discoverVariants(events, processType);

    // Calculate performance
    const performance = this.calculatePerformance(events, variants);

    // Detect deviations
    const deviations = await this.detectDeviations(events, variants);

    // Calculate cost (if available)
    const costAnalysis = await this.analyzeCost(events, variants);

    const result: ProcessMiningResult = {
      id: `pm-${processType}-${Date.now()}`,
      processType,
      processName: processType,
      sourceModules:
        moduleIds.length > 0
          ? moduleIds
          : Array.from(new Set(events.map((e) => this.extractModule(e.type)))),
      variants,
      performance,
      deviations,
      deviationRate: (deviations.length / events.length) * 100,
      costAnalysis,
      discoveredAt: new Date(),
      caseCount: this.getCaseCount(events),
      eventCount: events.length,
      timeRange: timeRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      tenantId,
    };

    return result;
  }

  /**
   * Analyze process
   */
  async analyzeProcess(request: {
    tenantId: string;
    entityType: string;
    entityId: string;
    events: any[];
  }): Promise<void> {
    // Analyze specific process instance
    const { tenantId, entityType, entityId, events } = request;

    // This can trigger RCA if deviations found
    const deviations = await this.detectDeviations(events, []);
    if (deviations.length > 0) {
      // Trigger RCA
      const { unifiedIntelligenceService } =
        await import("../core/unifiedIntelligenceService");
      await unifiedIntelligenceService.analyzeRootCause({
        tenantId,
        issueType: "DEVIATION",
        source: {
          module: this.extractModule(events[0]?.type || "unknown"),
          entityType,
          entityId,
        },
        context: { deviations },
      });
    }
  }

  /**
   * Get process events
   */
  private async getProcessEvents(
    tenantId: string,
    processType: string,
    moduleIds: string[],
    timeRange?: { start: Date | string; end: Date | string },
  ): Promise<any[]> {
    const events: any[] = [];

    // Get events from event store
    if (timeRange) {
      const allEvents = await eventStore.getEventsByTimeRange(
        new Date(timeRange.start).getTime(),
        new Date(timeRange.end).getTime(),
      );

      for (const event of allEvents) {
        if (event.metadata?.tenantId === tenantId) {
          if (
            moduleIds.length === 0 ||
            moduleIds.includes(this.extractModule(event.type))
          ) {
            if (
              event.aggregateType
                .toLowerCase()
                .includes(processType.toLowerCase()) ||
              processType === "GENERAL"
            ) {
              events.push(event);
            }
          }
        }
      }
    }

    return events;
  }

  /**
   * Discover process variants
   */
  private async discoverVariants(
    events: any[],
    processType: string,
  ): Promise<ProcessVariant[]> {
    const variants: ProcessVariant[] = [];

    // Group events by case (aggregateId)
    const cases = new Map<string, any[]>();
    for (const event of events) {
      const caseId = event.aggregateId;
      if (!cases.has(caseId)) {
        cases.set(caseId, []);
      }
      cases.get(caseId)!.push(event);
    }

    // Group cases by activity sequence (variant)
    const variantMap = new Map<string, any[]>();
    for (const [caseId, caseEvents] of cases.entries()) {
      const sequence = caseEvents
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        )
        .map((e) => e.type)
        .join(" -> ");

      if (!variantMap.has(sequence)) {
        variantMap.set(sequence, []);
      }
      variantMap.get(sequence)!.push(caseId);
    }

    // Create variants
    let variantIndex = 0;
    for (const [sequence, caseIds] of variantMap.entries()) {
      const variantEvents = caseIds.flatMap(
        (caseId) => cases.get(caseId) || [],
      );
      const activities = this.extractActivities(variantEvents);
      const transitions = this.extractTransitions(variantEvents);

      // Calculate compliance rate based on conformance checking
      const complianceRate = this.calculateVariantComplianceRate(
        activities,
        transitions,
        variantEvents,
      );

      // Calculate optimization score based on multiple factors
      const optimizationScore = this.calculateOptimizationScore(
        variantEvents,
        activities,
        transitions,
        complianceRate,
      );

      variants.push({
        id: `variant-${variantIndex++}`,
        variantId: `variant-${variantIndex}`,
        frequency: caseIds.length,
        percentage: (caseIds.length / cases.size) * 100,
        averageDuration: this.calculateAverageDuration(variantEvents),
        medianDuration: this.calculateMedianDuration(variantEvents),
        complianceRate,
        optimizationScore,
        isOptimal: variantIndex === 0, // First variant is optimal for now
        activities,
        transitions,
        cases: caseIds,
      });
    }

    // Sort by frequency
    return variants.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Extract activities
   */
  private extractActivities(events: any[]): any[] {
    const activityMap = new Map<string, any[]>();

    for (const event of events) {
      const activity = event.type;
      if (!activityMap.has(activity)) {
        activityMap.set(activity, []);
      }
      activityMap.get(activity)!.push(event);
    }

    return Array.from(activityMap.entries()).map(([name, eventList]) => {
      // Calculate duration from event data
      const durations = eventList.map((e) => {
        // Check for duration in event payload
        if (e.payload?.duration) {
          return Number(e.payload.duration);
        }
        // Check for start/end timestamps in payload
        if (e.payload?.startTime && e.payload?.endTime) {
          const start = new Date(e.payload.startTime).getTime();
          const end = new Date(e.payload.endTime).getTime();
          return (end - start) / (1000 * 60); // Duration in minutes
        }
        // Check for processing time metadata
        if (e.metadata?.processingTimeMs) {
          return Number(e.metadata.processingTimeMs) / (1000 * 60); // Convert to minutes
        }
        // Estimate based on activity type
        return this.estimateActivityDuration(name);
      });

      const validDurations = durations.filter((d) => d > 0);

      return {
        id: name,
        name,
        frequency: eventList.length,
        averageDuration:
          validDurations.length > 0
            ? validDurations.reduce((a, b) => a + b, 0) / validDurations.length
            : this.estimateActivityDuration(name),
        minDuration:
          validDurations.length > 0 ? Math.min(...validDurations) : 0,
        maxDuration:
          validDurations.length > 0 ? Math.max(...validDurations) : 0,
      };
    });
  }

  /**
   * Estimate activity duration based on activity type
   */
  private estimateActivityDuration(activityName: string): number {
    const name = activityName.toLowerCase();

    // Default durations in minutes based on activity patterns
    if (name.includes("created") || name.includes("submitted")) {
      return 5; // Quick creation/submission
    }
    if (name.includes("approved") || name.includes("reviewed")) {
      return 30; // Review/approval takes time
    }
    if (name.includes("completed") || name.includes("finished")) {
      return 60; // Completion activities
    }
    if (name.includes("shipped") || name.includes("delivered")) {
      return 120; // Delivery activities
    }
    if (name.includes("processing") || name.includes("in_progress")) {
      return 45; // Processing activities
    }

    return 15; // Default duration
  }

  /**
   * Extract transitions
   */
  private extractTransitions(events: any[]): any[] {
    const transitions: any[] = [];
    const sortedEvents = events.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const from = sortedEvents[i].type;
      const to = sortedEvents[i + 1].type;
      transitions.push({
        from,
        to,
        frequency: 1,
        probability: 1,
        averageTime:
          new Date(sortedEvents[i + 1].timestamp).getTime() -
          new Date(sortedEvents[i].timestamp).getTime(),
      });
    }

    // Aggregate transitions
    const transitionMap = new Map<string, any>();
    for (const trans of transitions) {
      const key = `${trans.from}->${trans.to}`;
      if (!transitionMap.has(key)) {
        transitionMap.set(key, { ...trans, frequency: 0 });
      }
      const existing = transitionMap.get(key)!;
      existing.frequency++;
      existing.averageTime = (existing.averageTime + trans.averageTime) / 2;
    }

    // Calculate probabilities
    const fromCounts = new Map<string, number>();
    for (const trans of Array.from(transitionMap.values())) {
      fromCounts.set(
        trans.from,
        (fromCounts.get(trans.from) || 0) + trans.frequency,
      );
    }

    return Array.from(transitionMap.values()).map((trans) => ({
      ...trans,
      probability: trans.frequency / (fromCounts.get(trans.from) || 1),
    }));
  }

  /**
   * Calculate variant compliance rate
   */
  private calculateVariantComplianceRate(
    activities: any[],
    transitions: any[],
    events: any[],
  ): number {
    let complianceScore = 100;

    // Check for missing required activities (deduct points)
    const requiredActivities = ["start", "process", "complete"];
    const activityNames = new Set(activities.map((a) => a.name.toLowerCase()));
    const missingRequired = requiredActivities.filter(
      (req) => !Array.from(activityNames).some((name) => name.includes(req)),
    );
    complianceScore -= missingRequired.length * 10;

    // Check for invalid transitions (deduct points)
    const invalidTransitions = transitions.filter(
      (t) => t.probability < 0.1, // Very rare transitions might indicate issues
    );
    complianceScore -= Math.min(invalidTransitions.length * 5, 20);

    // Check for duplicate activities (deduct points)
    const activityCounts = new Map<string, number>();
    events.forEach((e) => {
      const count = activityCounts.get(e.type) || 0;
      activityCounts.set(e.type, count + 1);
    });
    const duplicates = Array.from(activityCounts.values()).filter((c) => c > 3);
    complianceScore -= Math.min(duplicates.length * 3, 15);

    // Check for timing issues (deduct points)
    let timingIssues = 0;
    for (let i = 1; i < events.length; i++) {
      const timeDiff =
        new Date(events[i].timestamp).getTime() -
        new Date(events[i - 1].timestamp).getTime();
      if (timeDiff < 0) timingIssues++; // Events out of order
    }
    complianceScore -= Math.min(timingIssues * 5, 20);

    return Math.max(0, Math.min(100, complianceScore));
  }

  /**
   * Calculate optimization score
   */
  private calculateOptimizationScore(
    events: any[],
    activities: any[],
    transitions: any[],
    complianceRate: number,
  ): number {
    let score = 0;

    // Factor 1: Compliance (30%)
    score += (complianceRate / 100) * 30;

    // Factor 2: Activity efficiency (25%)
    const avgActivityDuration =
      activities.reduce((sum, a) => sum + a.averageDuration, 0) /
      (activities.length || 1);
    const activityEfficiency = Math.max(
      0,
      100 - Math.min(avgActivityDuration, 100),
    );
    score += (activityEfficiency / 100) * 25;

    // Factor 3: Transition smoothness (20%)
    const avgTransitionProbability =
      transitions.reduce((sum, t) => sum + t.probability, 0) /
      (transitions.length || 1);
    score += avgTransitionProbability * 20;

    // Factor 4: Path simplicity (15%) - fewer activities is better
    const simplicityScore = Math.max(0, 100 - activities.length * 5);
    score += (simplicityScore / 100) * 15;

    // Factor 5: Frequency bonus (10%) - more frequent = more optimized
    const frequencyBonus = Math.min(10, events.length / 10);
    score += frequencyBonus;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate performance
   */
  private calculatePerformance(events: any[], variants: ProcessVariant[]): any {
    const durations = variants.map((v) => v.averageDuration);

    // Calculate efficiency based on optimal vs actual performance
    const optimalDuration = Math.min(...durations);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const efficiency = Math.max(
      0,
      Math.min(100, (optimalDuration / avgDuration) * 100),
    );

    return {
      averageDuration: avgDuration,
      medianDuration: this.calculateMedian(durations),
      minDuration: optimalDuration,
      maxDuration: Math.max(...durations),
      efficiency,
      complianceRate:
        variants.reduce((sum, v) => sum + v.complianceRate, 0) /
        variants.length,
    };
  }

  /**
   * Detect deviations
   */
  private async detectDeviations(
    events: any[],
    variants: ProcessVariant[],
  ): Promise<ProcessDeviation[]> {
    const deviations: ProcessDeviation[] = [];

    // Simple deviation detection: events with error/exception
    const errorEvents = events.filter(
      (e) =>
        e.type.toLowerCase().includes("error") ||
        e.type.toLowerCase().includes("exception") ||
        e.type.toLowerCase().includes("failed"),
    );

    for (const event of errorEvents) {
      deviations.push({
        id: `dev-${event.id}`,
        type: "OTHER",
        severity: "high",
        description: `Deviation detected: ${event.type}`,
        affectedCases: 1,
        impact: {
          duration: 0,
          cost: 0,
          compliance: 0,
        },
        recommendations: [
          "Investigate root cause",
          "Implement corrective action",
        ],
      });
    }

    return deviations;
  }

  /**
   * Analyze cost
   */
  private async analyzeCost(
    events: any[],
    variants: ProcessVariant[],
  ): Promise<any> {
    // Extract cost data from events
    let totalCost = 0;
    const costPerVariant: Record<string, number> = {};
    const costBreakdown: Record<string, number> = {
      labor: 0,
      materials: 0,
      overhead: 0,
      other: 0,
    };

    // Calculate costs from event payloads
    for (const event of events) {
      // Check for cost data in event payload
      if (event.payload?.cost) {
        totalCost += Number(event.payload.cost);
      }
      if (event.payload?.laborCost) {
        costBreakdown.labor += Number(event.payload.laborCost);
        totalCost += Number(event.payload.laborCost);
      }
      if (event.payload?.materialCost) {
        costBreakdown.materials += Number(event.payload.materialCost);
        totalCost += Number(event.payload.materialCost);
      }
      if (event.payload?.overheadCost) {
        costBreakdown.overhead += Number(event.payload.overheadCost);
        totalCost += Number(event.payload.overheadCost);
      }
    }

    // Calculate cost per variant
    for (const variant of variants) {
      const variantEvents = events.filter((e) =>
        variant.cases.includes(e.aggregateId),
      );
      let variantCost = 0;

      for (const event of variantEvents) {
        if (event.payload?.cost) {
          variantCost += Number(event.payload.cost);
        }
        if (event.payload?.laborCost) {
          variantCost += Number(event.payload.laborCost);
        }
        if (event.payload?.materialCost) {
          variantCost += Number(event.payload.materialCost);
        }
      }

      costPerVariant[variant.id] =
        variant.cases.length > 0 ? variantCost / variant.cases.length : 0;
    }

    // Calculate average cost
    const averageCost = events.length > 0 ? totalCost / events.length : 100;

    // Identify optimization opportunities based on cost analysis
    const optimizationOpportunities: string[] = [];

    // High labor cost
    if (costBreakdown.labor > totalCost * 0.6) {
      optimizationOpportunities.push(
        "Automate manual steps to reduce labor costs",
      );
    }

    // Variant cost analysis
    const variantCosts = Object.values(costPerVariant).filter((c) => c > 0);
    if (variantCosts.length > 1) {
      const maxCost = Math.max(...variantCosts);
      const minCost = Math.min(...variantCosts);
      if (maxCost > minCost * 1.5) {
        optimizationOpportunities.push(
          "Standardize on low-cost process variants",
        );
      }
    }

    // Duration-based optimization
    const slowVariants = variants.filter((v) => v.averageDuration > 24);
    if (slowVariants.length > 0) {
      optimizationOpportunities.push(
        "Reduce processing time for slow variants",
      );
    }

    // Default recommendations if none found
    if (optimizationOpportunities.length === 0) {
      optimizationOpportunities.push("Review resource allocation");
      optimizationOpportunities.push("Consider batch processing");
    }

    return {
      averageCost: Math.round(averageCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      costBreakdown,
      costPerVariant,
      optimizationOpportunities,
    };
  }

  /**
   * Calculate average duration
   */
  private calculateAverageDuration(events: any[]): number {
    if (events.length < 2) return 0;
    const sorted = events.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const duration =
      new Date(sorted[sorted.length - 1].timestamp).getTime() -
      new Date(sorted[0].timestamp).getTime();
    return duration / (60 * 60 * 1000); // Convert to hours
  }

  /**
   * Calculate median duration
   */
  private calculateMedianDuration(events: any[]): number {
    return this.calculateAverageDuration(events); // Simplified
  }

  /**
   * Calculate median
   */
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Get case count
   */
  private getCaseCount(events: any[]): number {
    return new Set(events.map((e) => e.aggregateId)).size;
  }

  /**
   * Extract module from event type
   */
  private extractModule(eventType: string): string {
    const parts = eventType.split(".");
    return parts[0] || "unknown";
  }
}

// Export singleton instance
export const processMiningEngine = ProcessMiningEngine.getInstance();
