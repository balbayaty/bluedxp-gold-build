/**
 * Universal Lifecycle Management Service
 * Platform-wide lifecycle management for all entity types
 * Integrates with Event Store, Event Bus, and Evidence Service
 */

import { eventStore, eventBus } from "@/lib/services/event-store";
import { evidenceService } from "@/lib/services/evidence/evidenceService";
import { moduleRegistry } from "@/lib/modules/registry";
import { callAI } from "@/utils/aiClient";
import { lifecycleDatabaseAdapter } from "../database/lifecycleDatabaseAdapter";
import type {
  LifecycleService,
  LifecycleConfig,
  EntityLifecycle,
  LifecycleStage,
  StageTransition,
  LifecycleUpdate,
  LifecycleSubscription,
  StageAnalytics,
  PredictiveInsight,
  ModuleStatus,
  EvidenceReference,
  Comment,
  EvidenceInput,
  CommentInput,
  AnalyticsFilter,
  EntityType,
  StageStatus,
  StageTransitionType,
} from "@/types/lifecycle";

// ============================================================================
// SUBSCRIPTION STORAGE (Subscriptions kept in-memory for real-time)
// ============================================================================

class LifecycleStore {
  private subscriptions: Map<string, Set<(update: LifecycleUpdate) => void>> =
    new Map();
  private subscriptionCounter: number = 0;

  // Subscriptions (real-time, kept in-memory)
  subscribe(key: string, callback: (update: LifecycleUpdate) => void): string {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key)!.add(callback);
    return `sub-${this.subscriptionCounter++}-${Date.now()}`;
  }

  unsubscribe(key: string, callback: (update: LifecycleUpdate) => void): void {
    const callbacks = this.subscriptions.get(key);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(key);
      }
    }
  }

  notify(key: string, update: LifecycleUpdate): void {
    const callbacks = this.subscriptions.get(key);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(update);
        } catch (error) {
          console.error("Error in lifecycle subscription callback:", error);
        }
      });
    }
  }
}

const store = new LifecycleStore();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user ID from context
 * Checks context parameter first, then falls back to system
 */
function getUserFromContext(context?: Record<string, any>): string {
  // Check context for userId
  if (context?.userId) {
    return context.userId;
  }

  // Check context for user object
  if (context?.user?.id) {
    return context.user.id;
  }

  // Check for user in metadata
  if (context?.metadata?.userId) {
    return context.metadata.userId;
  }

  // Try to get from browser localStorage (client-side only)
  if (typeof window !== "undefined") {
    try {
      const savedUser = localStorage.getItem("current-user");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData?.id) {
          return userData.id;
        }
        if (userData?.email) {
          return userData.email;
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  // Fallback to system
  return "system";
}

// ============================================================================
// LIFECYCLE SERVICE IMPLEMENTATION
// ============================================================================

class LifecycleServiceImpl implements LifecycleService {
  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  async registerLifecycle(
    entityType: EntityType,
    config: LifecycleConfig,
  ): Promise<void> {
    // Validate config
    if (!config.stages || config.stages.length === 0) {
      throw new Error(
        `Lifecycle config for ${entityType} must have at least one stage`,
      );
    }

    // Ensure stages are ordered
    const sortedStages = [...config.stages].sort((a, b) => a.order - b.order);
    config.stages = sortedStages;

    await this.registerLifecycleConfig(entityType, config, "default");
  }

  async getLifecycleConfig(
    entityType: EntityType,
    tenantId: string = "default",
  ): Promise<LifecycleConfig | null> {
    return await lifecycleDatabaseAdapter.getConfig(tenantId, entityType);
  }

  async getAllConfigs(
    tenantId: string = "default",
  ): Promise<LifecycleConfig[]> {
    // For now return empty, would need to query all entity types
    return [];
  }

  // ============================================================================
  // LIFECYCLE MANAGEMENT
  // ============================================================================

  async getLifecycle(
    entityId: string,
    entityType: EntityType,
    tenantId: string = "default",
  ): Promise<EntityLifecycle | null> {
    return await lifecycleDatabaseAdapter.getLifecycle(
      tenantId,
      entityType,
      entityId,
    );
  }

  /**
   * Get all lifecycles of a specific entity type
   */
  async getLifecyclesByType(
    entityType: EntityType,
    tenantId: string = "default",
  ): Promise<EntityLifecycle[]> {
    return await lifecycleDatabaseAdapter.getAllLifecycles(
      tenantId,
      entityType,
    );
  }

  /**
   * Get in-progress lifecycles (for real-time SLA tracking)
   */
  async getInProgressLifecycles(
    entityType?: EntityType,
    tenantId: string = "default",
  ): Promise<EntityLifecycle[]> {
    const allLifecycles = await lifecycleDatabaseAdapter.getAllLifecycles(
      tenantId,
      entityType,
    );
    return allLifecycles.filter((lc) => lc.status === "IN_PROGRESS");
  }

  async initializeLifecycle(
    entityId: string,
    entityType: EntityType,
    initialData?: Record<string, any>,
    tenantId: string = "default",
  ): Promise<EntityLifecycle> {
    const config = await this.getLifecycleConfig(entityType, tenantId);
    if (!config) {
      throw new Error(`No lifecycle configuration found for ${entityType}`);
    }

    const firstStage = config.stages[0];
    if (!firstStage) {
      throw new Error(`No stages defined for ${entityType}`);
    }

    const now = new Date().toISOString();

    const lifecycle: EntityLifecycle = {
      entityId,
      entityType,
      currentStage: firstStage,
      currentStageId: firstStage.id,
      status: "IN_PROGRESS",
      progress: 0,
      startedAt: now,
      updatedAt: now,
      stages: [
        {
          stageId: firstStage.id,
          stage: firstStage,
          status: "IN_PROGRESS",
          startedAt: now,
        },
      ],
      transitions: [],
      metadata: initialData || {},
    };

    const key = `${entityType}:${entityId}`;
    await lifecycleDatabaseAdapter.storeLifecycle(tenantId, lifecycle);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "lifecycle.initialized",
      aggregateId: entityId,
      aggregateType: entityType,
      version: 1,
      timestamp: now,
      metadata: {
        entityId,
        entityType,
        initialStage: firstStage.id,
      },
      payload: lifecycle,
    });

    return lifecycle;
  }

  async transitionStage(
    entityId: string,
    entityType: EntityType,
    toStageId: string,
    context?: Record<string, any>,
    tenantId: string = "default",
  ): Promise<EntityLifecycle> {
    const key = `${entityType}:${entityId}`;
    const lifecycle = await lifecycleDatabaseAdapter.getLifecycle(
      tenantId,
      entityType,
      entityId,
    );
    if (!lifecycle) {
      throw new Error(`Lifecycle not found for ${entityId} (${entityType})`);
    }

    const config = this.getLifecycleConfig(entityType);
    if (!config) {
      throw new Error(`No lifecycle configuration found for ${entityType}`);
    }

    const toStage = config.stages.find((s) => s.id === toStageId);
    if (!toStage) {
      throw new Error(
        `Stage ${toStageId} not found in ${entityType} lifecycle`,
      );
    }

    const fromStageId = lifecycle.currentStageId;
    const fromStage = lifecycle.currentStage;

    // Complete current stage
    const currentStageInstance = lifecycle.stages.find(
      (s) => s.stageId === fromStageId,
    );
    if (currentStageInstance) {
      currentStageInstance.status = "COMPLETED";
      currentStageInstance.completedAt = new Date().toISOString();
      if (currentStageInstance.startedAt) {
        const start = new Date(currentStageInstance.startedAt).getTime();
        const end = new Date().getTime();
        currentStageInstance.duration = Math.floor((end - start) / 1000);
      }
    }

    // Create transition record
    const transition: StageTransition = {
      id: `trans-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      fromStageId,
      toStageId,
      transitionType: "MANUAL",
      triggeredBy: context?.userId || "system",
      triggeredAt: new Date().toISOString(),
      reason: context?.reason,
      context: context || {},
    };

    // Add new stage instance
    const newStageInstance = {
      stageId: toStageId,
      stage: toStage,
      status: "IN_PROGRESS" as StageStatus,
      startedAt: new Date().toISOString(),
    };

    // Update lifecycle
    lifecycle.currentStage = toStage;
    lifecycle.currentStageId = toStageId;
    lifecycle.stages.push(newStageInstance);
    lifecycle.transitions.push(transition);
    lifecycle.updatedAt = new Date().toISOString();

    // Calculate progress
    const totalStages = config.stages.length;
    const completedStages = lifecycle.stages.filter(
      (s) => s.status === "COMPLETED",
    ).length;
    lifecycle.progress = Math.round((completedStages / totalStages) * 100);

    // Check if completed
    if (toStageId === config.stages[config.stages.length - 1].id) {
      lifecycle.status = "COMPLETED";
      lifecycle.completedAt = new Date().toISOString();
    }

    await lifecycleDatabaseAdapter.storeLifecycle(tenantId, lifecycle);

    // Publish update
    const update: LifecycleUpdate = {
      entityId,
      entityType,
      updateType: "stage_changed",
      stageId: toStageId,
      previousStageId: fromStageId,
      status: lifecycle.status,
      progress: lifecycle.progress,
      timestamp: new Date().toISOString(),
      triggeredBy: context?.userId,
      context,
    };

    store.notify(key, update);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "lifecycle.stage_transitioned",
      aggregateId: entityId,
      aggregateType: entityType,
      version: lifecycle.transitions.length + 1,
      timestamp: new Date().toISOString(),
      metadata: {
        entityId,
        entityType,
        fromStageId,
        toStageId,
      },
      payload: transition,
    });

    return lifecycle;
  }

  async getCurrentStage(
    entityId: string,
    entityType: EntityType,
  ): Promise<LifecycleStage | null> {
    const lifecycle = await this.getLifecycle(entityId, entityType);
    return lifecycle?.currentStage || null;
  }

  async getStageHistory(
    entityId: string,
    entityType: EntityType,
  ): Promise<StageTransition[]> {
    const lifecycle = await this.getLifecycle(entityId, entityType);
    return lifecycle?.transitions || [];
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  subscribe(
    entityId: string,
    entityType: EntityType,
    callback: (update: LifecycleUpdate) => void,
  ): LifecycleSubscription {
    const key = `${entityType}:${entityId}`;
    const subId = store.subscribe(key, callback);

    return {
      id: subId,
      entityId,
      entityType,
      unsubscribe: () => {
        store.unsubscribe(key, callback);
      },
    };
  }

  unsubscribe(subscription: LifecycleSubscription): void {
    subscription.unsubscribe();
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  async getStageAnalytics(
    entityType: EntityType,
    stageId?: string,
    filters?: AnalyticsFilter,
  ): Promise<StageAnalytics[]> {
    // Get all lifecycle events from event store
    const lifecycleEvents = eventStore.getEventsByType(
      "lifecycle.stage_transitioned",
    );

    // Filter by entity type and time range
    const config = this.getLifecycleConfig(entityType);
    if (!config) {
      return [];
    }

    const now = new Date();
    const timeRange = filters?.timeRange || {
      start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: now,
    };

    // Filter events by entity type and time range
    const relevantEvents = lifecycleEvents.filter((event) => {
      if (event.aggregateType !== entityType) return false;
      const eventTime = new Date(event.timestamp);
      if (eventTime < timeRange.start || eventTime > timeRange.end)
        return false;
      return true;
    });

    // Get all lifecycles from database for this entity type
    const allLifecycles = await lifecycleDatabaseAdapter.getAllLifecycles(
      "default",
      entityType,
    );

    // Calculate analytics per stage
    const stageAnalyticsMap = new Map<
      string,
      {
        instances: number[];
        durations: number[];
        completions: number;
        slaBreaches: number;
      }
    >();

    // Process each lifecycle
    for (const lifecycle of allLifecycles) {
      for (const stageInstance of lifecycle.stages) {
        const sid = stageInstance.stageId;

        // Filter by stageId if provided
        if (stageId && sid !== stageId) continue;

        if (!stageAnalyticsMap.has(sid)) {
          stageAnalyticsMap.set(sid, {
            instances: [],
            durations: [],
            completions: 0,
            slaBreaches: 0,
          });
        }

        const stats = stageAnalyticsMap.get(sid)!;
        stats.instances.push(1);

        // Calculate duration if stage is completed
        if (
          stageInstance.status === "COMPLETED" &&
          stageInstance.startedAt &&
          stageInstance.completedAt
        ) {
          const start = new Date(stageInstance.startedAt).getTime();
          const end = new Date(stageInstance.completedAt).getTime();
          const duration = Math.floor((end - start) / 1000); // seconds
          stats.durations.push(duration);
          stats.completions++;

          // Check SLA breach
          const stage = config.stages.find((s) => s.id === sid);
          if (stage?.sla?.maxDuration) {
            if (duration > stage.sla.maxDuration) {
              stats.slaBreaches++;
            }
          }
        }
      }
    }

    // Convert to StageAnalytics array
    const analytics: StageAnalytics[] = [];

    for (const [sid, stats] of stageAnalyticsMap.entries()) {
      const stage = config.stages.find((s) => s.id === sid);
      if (!stage) continue;

      const totalInstances = stats.instances.length;
      const completedInstances = stats.completions;
      const durations = stats.durations;

      const averageDuration =
        durations.length > 0
          ? durations.reduce((sum, d) => sum + d, 0) / durations.length
          : 0;

      const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
      const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;

      const completionRate =
        totalInstances > 0 ? (completedInstances / totalInstances) * 100 : 0;

      const slaComplianceRate =
        completedInstances > 0
          ? ((completedInstances - stats.slaBreaches) / completedInstances) *
            100
          : 100;

      // Calculate bottleneck score (0-100)
      // Higher score = more bottleneck
      // Based on: average wait time, completion rate, SLA compliance
      const avgWaitTime = averageDuration;
      const maxWaitTime = maxDuration;
      const waitTimeScore =
        maxWaitTime > 0 ? Math.min(100, (avgWaitTime / maxWaitTime) * 100) : 0;
      const completionScore = 100 - completionRate;
      const slaScore = 100 - slaComplianceRate;
      const bottleneckScore = Math.round(
        waitTimeScore * 0.4 + completionScore * 0.3 + slaScore * 0.3,
      );

      // Resource utilization (estimated based on completion rate and duration)
      const resourceUtilization = Math.min(
        100,
        completionRate *
          (averageDuration > 0 ? 100 / (averageDuration / 60) : 1),
      );

      analytics.push({
        stageId: sid,
        totalInstances,
        averageDuration,
        minDuration,
        maxDuration,
        slaComplianceRate: Math.round(slaComplianceRate * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
        bottleneckScore: Math.min(100, Math.max(0, bottleneckScore)),
        resourceUtilization: Math.min(
          100,
          Math.max(0, Math.round(resourceUtilization * 100) / 100),
        ),
      });
    }

    // Sort by bottleneck score (highest first)
    return analytics.sort((a, b) => b.bottleneckScore - a.bottleneckScore);
  }

  async getPredictiveInsights(
    entityId: string,
    entityType: EntityType,
  ): Promise<PredictiveInsight[]> {
    const lifecycle = await this.getLifecycle(entityId, entityType);
    if (!lifecycle) {
      return [];
    }

    // Get stage analytics for context
    const stageAnalytics = await this.getStageAnalytics(entityType);

    // Get current stage info
    const currentStage = lifecycle.currentStage;
    const currentStageAnalytics = stageAnalytics.find(
      (a) => a.stageId === currentStage?.id,
    );

    // Build context for AI
    const context = {
      entityId,
      entityType,
      currentStage: currentStage?.name || "Unknown",
      currentStageId: lifecycle.currentStageId,
      progress: lifecycle.progress,
      status: lifecycle.status,
      startedAt: lifecycle.startedAt,
      stageAnalytics: currentStageAnalytics
        ? {
            averageDuration: currentStageAnalytics.averageDuration,
            bottleneckScore: currentStageAnalytics.bottleneckScore,
            slaComplianceRate: currentStageAnalytics.slaComplianceRate,
            completionRate: currentStageAnalytics.completionRate,
          }
        : null,
      transitions: lifecycle.transitions.length,
      stagesCompleted: lifecycle.stages.filter((s) => s.status === "COMPLETED")
        .length,
      totalStages: lifecycle.stages.length,
    };

    // Prepare AI prompt
    const systemPrompt = `You are an AI process analyst for a warehouse management system. Analyze lifecycle data and provide predictive insights.`;

    const userPrompt = `Analyze the following lifecycle data and provide predictive insights:

Entity: ${entityType} (${entityId})
Current Stage: ${context.currentStage}
Progress: ${context.progress}%
Status: ${context.status}
Stages Completed: ${context.stagesCompleted}/${context.totalStages}
Transitions: ${context.transitions}

${
  currentStageAnalytics
    ? `
Current Stage Analytics:
- Average Duration: ${Math.round(currentStageAnalytics.averageDuration / 60)} minutes
- Bottleneck Score: ${currentStageAnalytics.bottleneckScore}/100
- SLA Compliance: ${currentStageAnalytics.slaComplianceRate.toFixed(1)}%
- Completion Rate: ${currentStageAnalytics.completionRate.toFixed(1)}%
`
    : ""
}

Provide insights in JSON format with this structure:
{
  "insights": [
    {
      "type": "risk|optimization|bottleneck|sla_breach|resource|cost",
      "severity": "low|medium|high|critical",
      "title": "Short title",
      "description": "Detailed description",
      "confidence": 0-100,
      "recommendations": ["recommendation1", "recommendation2"],
      "actionable": true/false
    }
  ]
}

Focus on:
1. Risk of delays or SLA breaches
2. Bottleneck identification
3. Optimization opportunities
4. Resource allocation needs
5. Cost implications`;

    try {
      const aiResponse = await callAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          temperature: 0.3,
          maxTokens: 2000,
        },
      );

      // Parse AI response
      let insights: PredictiveInsight[] = [];

      try {
        // Try to extract JSON from response
        const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.insights && Array.isArray(parsed.insights)) {
            insights = parsed.insights.map((insight: any, index: number) => ({
              id: `insight-${entityId}-${Date.now()}-${index}`,
              type: insight.type || "optimization",
              severity: insight.severity || "medium",
              title: insight.title || "Insight",
              description: insight.description || "",
              stageId: currentStage?.id,
              confidence: Math.min(100, Math.max(0, insight.confidence || 75)),
              recommendations: Array.isArray(insight.recommendations)
                ? insight.recommendations
                : [],
              actionable: insight.actionable !== false,
              expiresAt: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
              ).toISOString(), // 7 days
            }));
          }
        }
      } catch (parseError) {
        console.error("Error parsing AI insights:", parseError);
        // Fallback: create a basic insight from the response
        insights = [
          {
            id: `insight-${entityId}-${Date.now()}`,
            type: "optimization",
            severity: "medium",
            title: "AI Analysis",
            description: aiResponse.content.substring(0, 500),
            stageId: currentStage?.id,
            confidence: 70,
            recommendations: [
              "Review AI analysis for specific recommendations",
            ],
            actionable: true,
          },
        ];
      }

      // Add rule-based insights if AI didn't provide enough
      if (insights.length === 0 || insights.length < 2) {
        // Risk insight based on bottleneck score
        if (
          currentStageAnalytics &&
          currentStageAnalytics.bottleneckScore > 70
        ) {
          insights.push({
            id: `insight-${entityId}-bottleneck-${Date.now()}`,
            type: "bottleneck",
            severity:
              currentStageAnalytics.bottleneckScore > 85 ? "critical" : "high",
            title: `Bottleneck Detected: ${currentStage?.name}`,
            description: `Stage "${currentStage?.name}" has a bottleneck score of ${currentStageAnalytics.bottleneckScore}/100, indicating potential delays.`,
            stageId: currentStage?.id,
            predictedValue: currentStageAnalytics.bottleneckScore,
            confidence: 85,
            recommendations: [
              "Review resource allocation for this stage",
              "Consider parallel processing",
              "Automate manual tasks",
              "Investigate root causes of delays",
            ],
            actionable: true,
          });
        }

        // SLA breach risk
        if (
          currentStageAnalytics &&
          currentStageAnalytics.slaComplianceRate < 90
        ) {
          insights.push({
            id: `insight-${entityId}-sla-${Date.now()}`,
            type: "sla_breach",
            severity:
              currentStageAnalytics.slaComplianceRate < 80 ? "high" : "medium",
            title: "SLA Compliance Risk",
            description: `Current SLA compliance rate is ${currentStageAnalytics.slaComplianceRate.toFixed(1)}%, below target of 95%.`,
            stageId: currentStage?.id,
            predictedValue: currentStageAnalytics.slaComplianceRate,
            confidence: 90,
            recommendations: [
              "Identify and address bottleneck stages",
              "Optimize process flow",
              "Increase resource allocation for critical stages",
            ],
            actionable: true,
          });
        }
      }

      return insights;
    } catch (error) {
      console.error("Error generating AI insights:", error);
      // Return empty array on error (graceful degradation)
      return [];
    }
  }

  // ============================================================================
  // MODULE INTEGRATION
  // ============================================================================

  async getModuleStatus(
    entityId: string,
    entityType: EntityType,
    stageId: string,
  ): Promise<ModuleStatus[]> {
    const lifecycle = await this.getLifecycle(entityId, entityType);
    if (!lifecycle) {
      return [];
    }

    const stageInstance = lifecycle.stages.find((s) => s.stageId === stageId);
    if (!stageInstance) {
      return [];
    }

    const stage = lifecycle.currentStage;
    if (!stage || !stage.moduleIntegrations) {
      return [];
    }

    // Get enabled modules from registry
    const enabledModules = moduleRegistry.getEnabledModules();
    const moduleStatuses: ModuleStatus[] = [];

    // Check each module integration defined in the stage
    for (const integration of stage.moduleIntegrations) {
      const moduleDef = enabledModules.find((m) => m.id === integration.module);

      if (moduleDef) {
        // Check if module is enabled
        const isEnabled = moduleRegistry.isModuleEnabled(integration.module);

        // Get last sync time from lifecycle metadata or stage metadata
        const lastSyncKey = `module_sync_${integration.module}_${stageId}`;
        const lastSync =
          stageInstance.metadata?.[lastSyncKey] ||
          lifecycle.metadata?.[lastSyncKey];

        // Determine status based on module state
        let status: "connected" | "disconnected" | "syncing" | "error" =
          "disconnected";
        if (isEnabled) {
          if (lastSync) {
            const syncTime = new Date(lastSync);
            const timeSinceSync = Date.now() - syncTime.getTime();
            // Consider synced if within last hour
            status =
              timeSinceSync < 60 * 60 * 1000 ? "connected" : "disconnected";
          } else {
            status = "disconnected";
          }
        }

        moduleStatuses.push({
          module: integration.module,
          moduleName: module.name,
          status,
          lastSync: lastSync ? new Date(lastSync).toISOString() : undefined,
          data: {
            action: integration.action,
            label: integration.label,
            enabled: isEnabled,
          },
        });
      } else {
        // Module not found in registry
        moduleStatuses.push({
          module: integration.module,
          moduleName: integration.module,
          status: "disconnected",
          error: `Module ${integration.module} not found in registry`,
        });
      }
    }

    return moduleStatuses;
  }

  async syncModule(
    entityId: string,
    entityType: EntityType,
    stageId: string,
    module: string,
    tenantId: string = "default",
  ): Promise<void> {
    const key = `${entityType}:${entityId}`;
    const lifecycle = await lifecycleDatabaseAdapter.getLifecycle(
      tenantId,
      entityType,
      entityId,
    );
    if (!lifecycle) {
      throw new Error(`Lifecycle not found for ${entityId} (${entityType})`);
    }

    // Check if module is enabled
    if (!moduleRegistry.isModuleEnabled(module)) {
      throw new Error(`Module ${module} is not enabled`);
    }

    const stageInstance = lifecycle.stages.find((s) => s.stageId === stageId);
    if (!stageInstance) {
      throw new Error(`Stage ${stageId} not found in lifecycle`);
    }

    // Update module status to syncing
    const moduleStatuses = await this.getModuleStatus(
      entityId,
      entityType,
      stageId,
    );
    const moduleStatus = moduleStatuses.find((ms) => ms.module === module);

    if (moduleStatus) {
      moduleStatus.status = "syncing";
    }

    try {
      // Get module definition
      const moduleDef = moduleRegistry.getModule(module);
      if (!moduleDef) {
        throw new Error(`Module ${module} not found`);
      }

      // Publish sync event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "lifecycle.module_sync_started",
        aggregateId: entityId,
        aggregateType: entityType,
        version: lifecycle.transitions.length + 1,
        timestamp: new Date().toISOString(),
        metadata: {
          entityId,
          entityType,
          stageId,
          module,
        },
        payload: {
          module,
          moduleName: moduleDef.name,
          stageId,
          startedAt: new Date().toISOString(),
        },
      });

      // Simulate module sync (in production, this would call actual module service)
      // For now, we'll just update the metadata
      const syncTime = new Date().toISOString();
      const syncKey = `module_sync_${module}_${stageId}`;

      if (!stageInstance.metadata) {
        stageInstance.metadata = {};
      }
      stageInstance.metadata[syncKey] = syncTime;

      if (!lifecycle.metadata) {
        lifecycle.metadata = {};
      }
      lifecycle.metadata[syncKey] = syncTime;

      lifecycle.updatedAt = new Date().toISOString();
      await lifecycleDatabaseAdapter.storeLifecycle(tenantId, lifecycle);

      // Publish sync completed event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "lifecycle.module_synced",
        aggregateId: entityId,
        aggregateType: entityType,
        version: lifecycle.transitions.length + 2,
        timestamp: new Date().toISOString(),
        metadata: {
          entityId,
          entityType,
          stageId,
          module,
        },
        payload: {
          module,
          moduleName: moduleDef.name,
          stageId,
          syncedAt: syncTime,
        },
      });

      // Notify subscribers
      const update: LifecycleUpdate = {
        entityId,
        entityType,
        updateType: "module_synced",
        stageId,
        timestamp: syncTime,
        context: { module },
      };
      store.notify(key, update);
    } catch (error) {
      // Update status to error
      if (moduleStatus) {
        moduleStatus.status = "error";
        moduleStatus.error =
          error instanceof Error ? error.message : "Unknown error";
      }

      // Publish error event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "lifecycle.module_sync_failed",
        aggregateId: entityId,
        aggregateType: entityType,
        version: lifecycle.transitions.length + 1,
        timestamp: new Date().toISOString(),
        metadata: {
          entityId,
          entityType,
          stageId,
          module,
        },
        payload: {
          module,
          stageId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  }

  // ============================================================================
  // EVIDENCE
  // ============================================================================

  async getEvidence(
    entityId: string,
    entityType: EntityType,
    stageId?: string,
  ): Promise<EvidenceReference[]> {
    const lifecycle = await this.getLifecycle(entityId, entityType);
    if (!lifecycle) return [];

    if (stageId) {
      const stageInstance = lifecycle.stages.find((s) => s.stageId === stageId);
      return stageInstance?.evidence || [];
    }

    // Return all evidence from all stages
    const allEvidence: EvidenceReference[] = [];
    lifecycle.stages.forEach((stage) => {
      if (stage.evidence) {
        allEvidence.push(...stage.evidence);
      }
    });
    return allEvidence;
  }

  async attachEvidence(
    entityId: string,
    entityType: EntityType,
    stageId: string,
    evidence: EvidenceInput,
    tenantId: string = "default",
  ): Promise<EvidenceReference> {
    const key = `${entityType}:${entityId}`;
    const lifecycle = await lifecycleDatabaseAdapter.getLifecycle(
      tenantId,
      entityType,
      entityId,
    );
    if (!lifecycle) {
      throw new Error(`Lifecycle not found for ${entityId} (${entityType})`);
    }

    const stageInstance = lifecycle.stages.find((s) => s.stageId === stageId);
    if (!stageInstance) {
      throw new Error(`Stage ${stageId} not found in lifecycle`);
    }

    // Get user from context
    const userId = getUserFromContext(evidence.context);

    const evidenceRef: EvidenceReference = {
      id: `evid-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      evidenceId: evidence.evidenceId,
      evidenceType: evidence.evidenceType,
      attachedAt: new Date().toISOString(),
      attachedBy: userId,
      description: evidence.description,
    };

    if (!stageInstance.evidence) {
      stageInstance.evidence = [];
    }
    stageInstance.evidence.push(evidenceRef);

    lifecycle.updatedAt = new Date().toISOString();
    await lifecycleDatabaseAdapter.storeLifecycle(tenantId, lifecycle);

    return evidenceRef;
  }

  // ============================================================================
  // COMMENTS
  // ============================================================================

  async addComment(
    entityId: string,
    entityType: EntityType,
    stageId: string,
    comment: CommentInput,
    tenantId: string = "default",
  ): Promise<Comment> {
    const key = `${entityType}:${entityId}`;
    const lifecycle = await lifecycleDatabaseAdapter.getLifecycle(
      tenantId,
      entityType,
      entityId,
    );
    if (!lifecycle) {
      throw new Error(`Lifecycle not found for ${entityId} (${entityType})`);
    }

    const stageInstance = lifecycle.stages.find((s) => s.stageId === stageId);
    if (!stageInstance) {
      throw new Error(`Stage ${stageId} not found in lifecycle`);
    }

    // Get user from context
    const userId = getUserFromContext(comment.context);

    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      stageId,
      author: userId,
      content: comment.content,
      createdAt: new Date().toISOString(),
      attachments: comment.attachments,
    };

    if (!stageInstance.comments) {
      stageInstance.comments = [];
    }
    stageInstance.comments.push(newComment);

    lifecycle.updatedAt = new Date().toISOString();
    await lifecycleDatabaseAdapter.storeLifecycle(tenantId, lifecycle);

    return newComment;
  }

  async getComments(
    entityId: string,
    entityType: EntityType,
    stageId?: string,
  ): Promise<Comment[]> {
    const lifecycle = await this.getLifecycle(entityId, entityType);
    if (!lifecycle) return [];

    if (stageId) {
      const stageInstance = lifecycle.stages.find((s) => s.stageId === stageId);
      return stageInstance?.comments || [];
    }

    // Return all comments from all stages
    const allComments: Comment[] = [];
    lifecycle.stages.forEach((stage) => {
      if (stage.comments) {
        allComments.push(...stage.comments);
      }
    });
    return allComments;
  }
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const lifecycleService: LifecycleService = new LifecycleServiceImpl();

export default lifecycleService;
