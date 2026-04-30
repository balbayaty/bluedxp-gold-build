/**
 * Warehouse Process Mining Service
 * Integrates process mining for warehouse operations
 * NO DUPLICATION - Reuses existing processDiscovery service
 */

import { processDiscovery } from "@/lib/services/process-lifecycle/process-mining/processDiscovery";
import type {
  ProcessModel,
  EventLog,
} from "@/lib/services/process-lifecycle/process-mining/processDiscovery";
import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// WAREHOUSE PROCESS MINING TYPES
// ============================================================================

export interface WarehouseProcessMetrics {
  warehouseId: string;
  processType: "receiving" | "putaway" | "picking" | "shipping" | "cycle_count";
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  bottleneckActivities: string[];
  variantCount: number;
  efficiency: number;
}

export interface WarehouseProcessOptimization {
  warehouseId: string;
  processType: string;
  recommendations: Array<{
    activity: string;
    issue: string;
    recommendation: string;
    expectedImprovement: number;
    priority: "HIGH" | "MEDIUM" | "LOW";
  }>;
}

// ============================================================================
// WAREHOUSE PROCESS MINING SERVICE
// ============================================================================

class WarehouseProcessMiningService {
  private eventLogs: Map<string, EventLog> = new Map();
  private processModels: Map<string, ProcessModel> = new Map();

  /**
   * Initialize process mining for warehouse
   * Captures warehouse events automatically
   */
  initialize(warehouseId: string): void {
    // Subscribe to warehouse events
    eventBus.subscribe(`warehouse.${warehouseId}.*`, (event: DomainEvent) => {
      this.captureEvent(warehouseId, event);
    });

    // Subscribe to WMS events
    eventBus.subscribe("wms.*", (event: DomainEvent) => {
      if (event.payload?.warehouseId === warehouseId) {
        this.captureEvent(warehouseId, event);
      }
    });
  }

  /**
   * Capture event for process mining
   */
  private captureEvent(warehouseId: string, event: DomainEvent): void {
    const log = this.eventLogs.get(warehouseId) || {
      cases: [],
      events: [],
      startTime: new Date(),
      endTime: new Date(),
    };

    // Add event to log
    log.events.push({
      id: event.id,
      caseId: event.aggregateId,
      activity: event.type,
      timestamp: new Date(event.timestamp),
      resource: event.payload?.userId || "system",
      attributes: event.payload || {},
    });

    log.endTime = new Date();
    this.eventLogs.set(warehouseId, log);
  }

  /**
   * Discover warehouse process model
   */
  async discoverProcess(
    warehouseId: string,
    processType:
      | "receiving"
      | "putaway"
      | "picking"
      | "shipping"
      | "cycle_count",
  ): Promise<ProcessModel> {
    const log = this.eventLogs.get(warehouseId);
    if (!log || log.events.length === 0) {
      throw new Error(`No events captured for warehouse ${warehouseId}`);
    }

    // Filter events by process type
    const filteredEvents = log.events.filter(
      (e) =>
        e.activity.includes(processType.toUpperCase()) ||
        e.attributes?.processType === processType,
    );

    const filteredLog: EventLog = {
      ...log,
      events: filteredEvents,
    };

    // Discover process model
    const model =
      await processDiscovery.discoverWithHeuristicMining(filteredLog);
    this.processModels.set(`${warehouseId}-${processType}`, model);

    return model;
  }

  /**
   * Get process metrics
   */
  async getProcessMetrics(
    warehouseId: string,
    processType:
      | "receiving"
      | "putaway"
      | "picking"
      | "shipping"
      | "cycle_count",
  ): Promise<WarehouseProcessMetrics> {
    const model = await this.discoverProcess(warehouseId, processType);

    const durations = model.activities
      .filter((a) => a.averageDuration)
      .map((a) => a.averageDuration || 0);

    const avgDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    // Identify bottlenecks (activities with longest duration)
    const bottlenecks = model.activities
      .filter((a) => a.averageDuration && a.averageDuration > avgDuration * 1.5)
      .map((a) => a.name)
      .slice(0, 3);

    return {
      warehouseId,
      processType,
      averageDuration: avgDuration,
      minDuration: Math.min(...durations, 0),
      maxDuration: Math.max(...durations, 0),
      bottleneckActivities: bottlenecks,
      variantCount: model.metadata.caseCount,
      efficiency: model.metadata.confidence,
    };
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(
    warehouseId: string,
    processType:
      | "receiving"
      | "putaway"
      | "picking"
      | "shipping"
      | "cycle_count",
  ): Promise<WarehouseProcessOptimization> {
    const metrics = await this.getProcessMetrics(warehouseId, processType);
    const model = await this.discoverProcess(warehouseId, processType);

    const recommendations: WarehouseProcessOptimization["recommendations"] = [];

    // Analyze bottlenecks
    metrics.bottleneckActivities.forEach((activity) => {
      const activityData = model.activities.find((a) => a.name === activity);
      if (activityData && activityData.averageDuration) {
        recommendations.push({
          activity,
          issue: `Activity takes ${Math.round(activityData.averageDuration)} minutes on average`,
          recommendation: `Optimize ${activity} workflow to reduce processing time`,
          expectedImprovement: Math.round(activityData.averageDuration * 0.3), // 30% improvement
          priority:
            activityData.averageDuration > metrics.averageDuration * 2
              ? "HIGH"
              : "MEDIUM",
        });
      }
    });

    // Analyze variants
    if (metrics.variantCount > 5) {
      recommendations.push({
        activity: "Process Variants",
        issue: `Too many process variants (${metrics.variantCount}) indicate inconsistent execution`,
        recommendation: "Standardize process execution to reduce variants",
        expectedImprovement: 20,
        priority: "MEDIUM",
      });
    }

    return {
      warehouseId,
      processType,
      recommendations,
    };
  }
}

export const warehouseProcessMiningService =
  new WarehouseProcessMiningService();
