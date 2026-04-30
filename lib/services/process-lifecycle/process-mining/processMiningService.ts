/**
 * Process Mining Service
 * Consolidates process mining functionality from intelligent-orchestration
 * Analyzes process variants, deviations, and performance
 *
 * DATABASE: Now uses ProcessMiningDatabaseAdapter for persistence
 * MULTI-TENANT: Enforces tenant isolation
 */

import type {
  ProcessMiningCase,
  ProcessMiningEvent,
  ProcessDeviation,
} from "@/types/process-lifecycle";
import {
  generateDemoProcessVariants,
  generateDemoProcessMetrics,
  generateDemoProcessCases,
  isDemoModeEnabled,
} from "@/lib/services/demo/demoDataService";
import { getProcessMiningDatabaseAdapter } from "../database/processMiningDatabaseAdapter";

// Get database adapter instance
const dbAdapter = getProcessMiningDatabaseAdapter();

// ============================================================================
// PROCESS MINING SERVICE
// ============================================================================

class ProcessMiningService {
  /**
   * Capture event for process mining
   */
  async captureEvent(data: {
    caseId: string;
    caseType: string;
    event: ProcessMiningEvent;
    tenantId?: string;
  }): Promise<void> {
    const { caseId, caseType, event, tenantId = "default" } = data;

    // Get or create case
    let processCase = await dbAdapter.getCase(caseId, caseType, tenantId);
    if (!processCase) {
      processCase = {
        id: `case-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        caseId,
        caseType,
        startTime: event.timestamp,
        status: "ACTIVE",
        events: [],
        attributes: {},
        performance: {
          duration: 0,
          waitingTime: 0,
          processingTime: 0,
          cycleTime: 0,
          throughput: 0,
          efficiency: 0,
        },
        variants: [],
        deviations: [],
      };
    }

    // Add event to database
    await dbAdapter.addEvent(
      { ...event, caseId, caseType: caseType as any },
      tenantId,
    );

    // Add event to case
    processCase.events.push(event);

    // Update performance
    if (processCase.events.length > 1) {
      const firstEvent = processCase.events[0];
      const lastEvent = processCase.events[processCase.events.length - 1];
      const start = new Date(firstEvent.timestamp).getTime();
      const end = new Date(lastEvent.timestamp).getTime();
      processCase.performance.duration = Math.floor((end - start) / 1000);
    }

    // Detect deviations
    const deviations = this.detectDeviations(processCase);
    processCase.deviations = deviations;

    // Update case in database
    await dbAdapter.createCase(processCase, tenantId);
  }

  /**
   * Get case
   */
  async getCase(
    caseId: string,
    caseType: string,
    tenantId: string = "default",
  ): Promise<ProcessMiningCase | null> {
    return await dbAdapter.getCase(caseId, caseType, tenantId);
  }

  /**
   * Get all cases
   */
  async getAllCases(
    caseType?: string,
    tenantId: string = "default",
  ): Promise<ProcessMiningCase[]> {
    return await dbAdapter.getAllCases(tenantId, caseType);
  }

  /**
   * Analyze process variants
   */
  async analyzeVariants(caseType: string): Promise<
    Array<{
      variantId: string;
      frequency: number;
      averageDuration: number;
      efficiency: number;
      events: string[];
    }>
  > {
    // Return demo data if enabled and no real data
    if (isDemoModeEnabled()) {
      const cases = await this.getAllCases(caseType);
      if (cases.length === 0) {
        return generateDemoProcessVariants(caseType);
      }
    }

    const cases = await this.getAllCases(caseType);
    const variantMap = new Map<
      string,
      {
        cases: ProcessMiningCase[];
        eventSequence: string[];
      }
    >();

    // Group cases by event sequence
    cases.forEach((processCase) => {
      const sequence = processCase.events.map((e) => e.activity).join("->");
      if (!variantMap.has(sequence)) {
        variantMap.set(sequence, {
          cases: [],
          eventSequence: processCase.events.map((e) => e.activity),
        });
      }
      variantMap.get(sequence)!.cases.push(processCase);
    });

    // Calculate variant metrics
    const variants = Array.from(variantMap.entries()).map(
      ([sequence, data]) => {
        const durations = data.cases.map((c) => c.performance.duration);
        const averageDuration =
          durations.reduce((a, b) => a + b, 0) / durations.length;
        const efficiencies = data.cases.map((c) => c.performance.efficiency);
        const averageEfficiency =
          efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;

        return {
          variantId: `variant-${sequence.substring(0, 20)}`,
          frequency: data.cases.length,
          averageDuration,
          efficiency: averageEfficiency,
          events: data.eventSequence,
        };
      },
    );

    return variants.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Detect deviations in a case
   */
  private detectDeviations(processCase: ProcessMiningCase): ProcessDeviation[] {
    const deviations: ProcessDeviation[] = [];

    // Detect delays (events taking too long)
    for (let i = 1; i < processCase.events.length; i++) {
      const prevEvent = processCase.events[i - 1];
      const currentEvent = processCase.events[i];
      const timeDiff =
        new Date(currentEvent.timestamp).getTime() -
        new Date(prevEvent.timestamp).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // If delay > 24 hours, it's a deviation
      if (hoursDiff > 24) {
        deviations.push({
          id: `dev-${Date.now()}-${i}`,
          type: "DELAY",
          severity:
            hoursDiff > 48 ? "CRITICAL" : hoursDiff > 36 ? "HIGH" : "MEDIUM",
          description: `Delay of ${Math.floor(hoursDiff)} hours between ${prevEvent.activity} and ${currentEvent.activity}`,
          impact: hoursDiff,
        });
      }
    }

    return deviations;
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(caseType: string): Promise<{
    totalCases: number;
    averageDuration: number;
    averageEfficiency: number;
    totalDeviations: number;
    criticalDeviations: number;
  }> {
    // Return demo data if enabled and no real data
    if (isDemoModeEnabled()) {
      const cases = await this.getAllCases(caseType);
      if (cases.length === 0) {
        const demoMetrics = generateDemoProcessMetrics(caseType);
        return {
          totalCases: demoMetrics.totalCases,
          averageDuration: demoMetrics.averageDuration,
          averageEfficiency: demoMetrics.averageEfficiency,
          totalDeviations: demoMetrics.totalDeviations,
          criticalDeviations: Math.floor(demoMetrics.totalDeviations * 0.1),
        };
      }
    }

    const cases = await this.getAllCases(caseType);
    const totalCases = cases.length;
    const averageDuration =
      cases.reduce((sum, c) => sum + c.performance.duration, 0) / totalCases ||
      0;
    const averageEfficiency =
      cases.reduce((sum, c) => sum + c.performance.efficiency, 0) /
        totalCases || 0;
    const totalDeviations = cases.reduce(
      (sum, c) => sum + c.deviations.length,
      0,
    );
    const criticalDeviations = cases.reduce(
      (sum, c) =>
        sum + c.deviations.filter((d) => d.severity === "CRITICAL").length,
      0,
    );

    return {
      totalCases,
      averageDuration,
      averageEfficiency,
      totalDeviations,
      criticalDeviations,
    };
  }

  /**
   * Get all cases with demo data fallback
   */
  async getAllCases(caseType?: string): Promise<ProcessMiningCase[]> {
    const realCases = store.getAllCases(caseType);

    // Return demo data if enabled and no real data
    if (isDemoModeEnabled() && realCases.length === 0) {
      return generateDemoProcessCases(caseType || "SALES_ORDER", 100);
    }

    return realCases;
  }
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const processMiningService = new ProcessMiningService();

export default processMiningService;
