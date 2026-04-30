/**
 * Unified Intelligence Service
 *
 * Main orchestration service for all intelligence capabilities
 * Coordinates root cause analysis, data mining, process mining, and analytics
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";
import type {
  IntelligenceAnalysisRequest,
  IntelligenceAnalysisResponse,
  UnifiedRootCauseAnalysis,
  DataMiningResult,
  ProcessMiningResult,
  UnifiedAnalytics,
} from "@/types/intelligence-analytics";
import { eventCaptureService } from "./eventCaptureService";

// Import engines (will be created)
let rootCauseEngine: any;
let dataMiningEngine: any;
let processMiningEngine: any;
let analyticsService: any;

export class UnifiedIntelligenceService {
  private static instance: UnifiedIntelligenceService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): UnifiedIntelligenceService {
    if (!UnifiedIntelligenceService.instance) {
      UnifiedIntelligenceService.instance = new UnifiedIntelligenceService();
    }
    return UnifiedIntelligenceService.instance;
  }

  /**
   * Initialize the unified intelligence service
   */
  async initialize(tenantId: string): Promise<void> {
    if (this.isInitialized) {
      console.log("⚠️ Unified Intelligence Service already initialized");
      return;
    }

    console.log("🧠 Initializing Unified Intelligence Service...");

    // Initialize event capture
    await eventCaptureService.initialize();

    // Lazy load engines to avoid circular dependencies
    const { rootCauseAnalysisEngine } =
      await import("../root-cause/rootCauseAnalysisEngine");
    const { dataMiningEngine: dmEngine } =
      await import("../data-mining/dataMiningEngine");
    const { processMiningEngine: pmEngine } =
      await import("../process-mining/processMiningEngine");
    const { analyticsAggregationService } =
      await import("../analytics/analyticsAggregationService");

    rootCauseEngine = rootCauseAnalysisEngine;
    dataMiningEngine = dmEngine;
    processMiningEngine = pmEngine;
    analyticsService = analyticsAggregationService;

    // Initialize engines
    await rootCauseEngine.initialize(tenantId);
    await dataMiningEngine.initialize(tenantId);
    await processMiningEngine.initialize(tenantId);
    await analyticsService.initialize(tenantId);

    // Set up auto-triggers
    await this.setupAutoTriggers();

    this.isInitialized = true;
    console.log("✅ Unified Intelligence Service initialized");
  }

  /**
   * Analyze an event automatically
   */
  async analyzeEvent(params: {
    event: DomainEvent;
    autoTrigger?: boolean;
  }): Promise<void> {
    const { event, autoTrigger = false } = params;

    // Check if we should analyze this event
    if (!autoTrigger && !this.shouldAnalyze(event)) {
      return;
    }

    // Determine analysis type based on event
    const analysisType = this.determineAnalysisType(event);

    try {
      switch (analysisType) {
        case "root-cause":
          await this.analyzeRootCause({
            tenantId: event.metadata?.tenantId || "unknown",
            source: {
              module: this.extractModule(event.type),
              entityType: event.aggregateType,
              entityId: event.aggregateId,
            },
            context: {
              event: event.payload,
              eventType: event.type,
            },
          });
          break;

        case "data-mining":
          // Schedule data mining (don't run immediately)
          await dataMiningEngine.scheduleMining({
            tenantId: event.metadata?.tenantId || "unknown",
            triggerEvent: event,
          });
          break;

        case "process-mining":
          await processMiningEngine.analyzeProcess({
            tenantId: event.metadata?.tenantId || "unknown",
            entityType: event.aggregateType,
            entityId: event.aggregateId,
            events: [event],
          });
          break;
      }
    } catch (error) {
      console.error("Error analyzing event:", error);
    }
  }

  /**
   * Analyze root cause
   */
  async analyzeRootCause(request: {
    tenantId: string;
    issueId?: string;
    issueType?: string;
    source: {
      module: string;
      entityType: string;
      entityId: string;
    };
    context?: Record<string, any>;
  }): Promise<UnifiedRootCauseAnalysis> {
    if (!rootCauseEngine) {
      const { rootCauseAnalysisEngine } =
        await import("../root-cause/rootCauseAnalysisEngine");
      rootCauseEngine = rootCauseAnalysisEngine;
    }

    return await rootCauseEngine.analyzeRootCause(request);
  }

  /**
   * Run data mining
   */
  async runDataMining(request: {
    tenantId: string;
    moduleIds?: string[];
    timeRange?: { start: Date | string; end: Date | string };
    algorithms?: string[];
  }): Promise<DataMiningResult[]> {
    if (!dataMiningEngine) {
      const { dataMiningEngine: dmEngine } =
        await import("../data-mining/dataMiningEngine");
      dataMiningEngine = dmEngine;
    }

    return await dataMiningEngine.mine(request);
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
    if (!processMiningEngine) {
      const { processMiningEngine: pmEngine } =
        await import("../process-mining/processMiningEngine");
      processMiningEngine = pmEngine;
    }

    return await processMiningEngine.discoverProcess(request);
  }

  /**
   * Aggregate analytics
   */
  async aggregateAnalytics(request: {
    tenantId: string;
    moduleIds?: string[];
    timeRange?: { start: Date | string; end: Date | string };
  }): Promise<UnifiedAnalytics> {
    if (!analyticsService) {
      const { analyticsAggregationService } =
        await import("../analytics/analyticsAggregationService");
      analyticsService = analyticsAggregationService;
    }

    return await analyticsService.aggregate(request);
  }

  /**
   * Unified analyze method
   */
  async analyze(
    request: IntelligenceAnalysisRequest,
  ): Promise<IntelligenceAnalysisResponse> {
    const { tenantId, type, source, context, options } = request;

    let result:
      | UnifiedRootCauseAnalysis
      | DataMiningResult
      | ProcessMiningResult
      | UnifiedAnalytics;

    switch (type) {
      case "root-cause":
        result = await this.analyzeRootCause({
          tenantId,
          issueId: source?.entityId,
          issueType: context?.issueType,
          source: source || {
            module: "unknown",
            entityType: "unknown",
            entityId: "unknown",
          },
          context,
        });
        break;

      case "data-mining":
        const miningResults = await this.runDataMining({
          tenantId,
          moduleIds: options?.moduleIds,
          timeRange: options?.timeRange,
          algorithms: options?.algorithms,
        });
        result = miningResults[0]; // Return first result for now
        break;

      case "process-mining":
        result = await this.discoverProcess({
          tenantId,
          processType: context?.processType || "GENERAL",
          moduleIds: options?.moduleIds,
          timeRange: options?.timeRange,
        });
        break;

      case "analytics":
        result = await this.aggregateAnalytics({
          tenantId,
          moduleIds: options?.moduleIds,
          timeRange: options?.timeRange,
        });
        break;

      default:
        throw new Error(`Unknown analysis type: ${type}`);
    }

    // Publish intelligence event
    await eventBus.publish({
      type: `intelligence.${type}.completed`,
      aggregateId: (result as any).id,
      aggregateType: "IntelligenceAnalysis",
      payload: result,
      metadata: { tenantId },
    });

    return {
      id: (result as any).id,
      type,
      result,
      status: "completed",
      timestamp: new Date(),
    };
  }

  /**
   * Set up auto-triggers
   */
  private async setupAutoTriggers(): Promise<void> {
    // Auto-trigger RCA from anomalies
    eventBus.subscribe(
      "intelligence.anomaly.detected",
      async (event: DomainEvent) => {
        await this.analyzeRootCause({
          tenantId: event.metadata?.tenantId || "unknown",
          issueType: "ANOMALY",
          source: {
            module: this.extractModule(event.type),
            entityType: event.aggregateType,
            entityId: event.aggregateId,
          },
          context: event.payload,
        });
      },
    );

    // Auto-trigger RCA from deviations
    eventBus.subscribe(
      "process-lifecycle.deviation.detected",
      async (event: DomainEvent) => {
        await this.analyzeRootCause({
          tenantId: event.metadata?.tenantId || "unknown",
          issueType: "DEVIATION",
          source: {
            module: "process-lifecycle",
            entityType: event.aggregateType,
            entityId: event.aggregateId,
          },
          context: event.payload,
        });
      },
    );

    // Auto-trigger data mining on data changes
    eventBus.subscribe("*.data.updated", async (event: DomainEvent) => {
      await dataMiningEngine.scheduleMining({
        tenantId: event.metadata?.tenantId || "unknown",
        triggerEvent: event,
      });
    });
  }

  /**
   * Check if event should be analyzed
   */
  private shouldAnalyze(event: DomainEvent): boolean {
    const criticalTypes = [
      "exception",
      "deviation",
      "anomaly",
      "incident",
      "error",
      "failed",
    ];
    return criticalTypes.some((type) =>
      event.type.toLowerCase().includes(type),
    );
  }

  /**
   * Determine analysis type from event
   */
  private determineAnalysisType(
    event: DomainEvent,
  ): "root-cause" | "data-mining" | "process-mining" {
    const type = event.type.toLowerCase();

    if (
      type.includes("deviation") ||
      type.includes("exception") ||
      type.includes("incident")
    ) {
      return "root-cause";
    }
    if (type.includes("process") || type.includes("lifecycle")) {
      return "process-mining";
    }
    return "data-mining";
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
export const unifiedIntelligenceService =
  UnifiedIntelligenceService.getInstance();
