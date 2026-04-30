/**
 * Digital Twin Service for Process Lifecycle
 * Digital representation of processes with real-time synchronization
 * More advanced than competitors
 */

import type { EntityLifecycle, LifecycleStage } from "@/types/lifecycle";
import type { ProcessEvent } from "@/types/process-lifecycle";
import { lifecycleService } from "../lifecycle/lifecycleService";

export interface DigitalTwin {
  id: string;
  entityId: string;
  entityType: string;
  physicalState: PhysicalProcessState;
  digitalState: DigitalProcessState;
  synchronization: SynchronizationStatus;
  predictions: TwinPrediction[];
  metadata: {
    created: Date;
    lastSynced: Date;
    version: number;
  };
}

export interface PhysicalProcessState {
  currentStage: string;
  status: string;
  progress: number;
  actualMetrics: {
    duration: number;
    cost: number;
    quality: number;
    resourceUtilization: number;
  };
  lastUpdated: Date;
}

export interface DigitalProcessState {
  model: ProcessModel;
  simulation: SimulationState;
  optimization: OptimizationState;
  lastUpdated: Date;
}

export interface ProcessModel {
  stages: ModelStage[];
  transitions: ModelTransition[];
  rules: ModelRule[];
}

export interface ModelStage {
  id: string;
  name: string;
  expectedDuration: number;
  expectedCost: number;
  dependencies: string[];
}

export interface ModelTransition {
  from: string;
  to: string;
  probability: number;
  averageTime: number;
}

export interface ModelRule {
  id: string;
  type: "constraint" | "optimization" | "validation";
  condition: string;
  action: string;
}

export interface SimulationState {
  scenarios: SimulationScenario[];
  currentScenario: string;
  results: SimulationResult[];
}

export interface SimulationScenario {
  id: string;
  name: string;
  parameters: Record<string, any>;
}

export interface SimulationResult {
  scenarioId: string;
  predictedDuration: number;
  predictedCost: number;
  confidence: number;
}

export interface OptimizationState {
  recommendations: OptimizationRecommendation[];
  appliedOptimizations: string[];
  impact: {
    durationImprovement: number;
    costReduction: number;
    efficiencyGain: number;
  };
}

export interface OptimizationRecommendation {
  id: string;
  type: "process" | "resource" | "timing" | "cost";
  description: string;
  expectedImpact: number;
  implementationEffort: "low" | "medium" | "high";
}

export interface SynchronizationStatus {
  status: "synced" | "syncing" | "out_of_sync" | "error";
  lastSyncTime: Date;
  syncFrequency: number; // milliseconds
  drift: number; // seconds
  errors: string[];
}

export interface TwinPrediction {
  id: string;
  type: "completion" | "bottleneck" | "cost" | "quality";
  predictedValue: number;
  confidence: number;
  timestamp: Date;
  horizon: number; // hours
}

export class AdvancedDigitalTwinService {
  private twins: Map<string, DigitalTwin> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Create digital twin
   */
  async createDigitalTwin(
    entityId: string,
    entityType: string,
    lifecycle: EntityLifecycle,
  ): Promise<DigitalTwin> {
    // Build process model from lifecycle
    const model = this.buildProcessModel(lifecycle);

    // Initialize digital state
    const digitalState: DigitalProcessState = {
      model,
      simulation: {
        scenarios: [],
        currentScenario: "",
        results: [],
      },
      optimization: {
        recommendations: [],
        appliedOptimizations: [],
        impact: {
          durationImprovement: 0,
          costReduction: 0,
          efficiencyGain: 0,
        },
      },
      lastUpdated: new Date(),
    };

    // Initialize physical state
    const physicalState: PhysicalProcessState = {
      currentStage: lifecycle.currentStageId,
      status: lifecycle.status,
      progress: lifecycle.progress,
      actualMetrics: {
        duration: this.calculateDuration(lifecycle),
        cost: 0, // Would come from cost mining
        quality: 85, // Default
        resourceUtilization: 0.7, // Default
      },
      lastUpdated: new Date(),
    };

    const twin: DigitalTwin = {
      id: `twin-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      entityId,
      entityType,
      physicalState,
      digitalState,
      synchronization: {
        status: "synced",
        lastSyncTime: new Date(),
        syncFrequency: 5000, // 5 seconds
        drift: 0,
        errors: [],
      },
      predictions: [],
      metadata: {
        created: new Date(),
        lastSynced: new Date(),
        version: 1,
      },
    };

    this.twins.set(twin.id, twin);

    // Start synchronization
    this.startSynchronization(twin.id);

    console.log(`✅ Created digital twin for ${entityType} (${entityId})`);
    return twin;
  }

  /**
   * Build process model
   */
  private buildProcessModel(lifecycle: EntityLifecycle): ProcessModel {
    const stages: ModelStage[] = lifecycle.stages.map((stage) => ({
      id: stage.stageId,
      name: stage.stageId,
      expectedDuration: 3600, // Would come from config
      expectedCost: 100, // Would come from cost model
      dependencies: [], // Would be calculated
    }));

    const transitions: ModelTransition[] = [];
    for (let i = 0; i < lifecycle.stages.length - 1; i++) {
      transitions.push({
        from: lifecycle.stages[i].stageId,
        to: lifecycle.stages[i + 1].stageId,
        probability: 1.0,
        averageTime: 0,
      });
    }

    const rules: ModelRule[] = [
      {
        id: "sequential",
        type: "constraint",
        condition: "stages must execute in order",
        action: "enforce sequence",
      },
    ];

    return {
      stages,
      transitions,
      rules,
    };
  }

  /**
   * Calculate duration
   */
  private calculateDuration(lifecycle: EntityLifecycle): number {
    return (
      lifecycle.stages.reduce((sum, stage) => {
        if (stage.startedAt && stage.completedAt) {
          return (
            sum +
            (new Date(stage.completedAt).getTime() -
              new Date(stage.startedAt).getTime())
          );
        }
        return sum;
      }, 0) / 3600000
    ); // Convert to hours
  }

  /**
   * Start synchronization
   */
  private startSynchronization(twinId: string): void {
    const interval = setInterval(async () => {
      await this.synchronizeTwin(twinId);
    }, 5000); // Sync every 5 seconds

    this.syncIntervals.set(twinId, interval);
  }

  /**
   * Synchronize twin
   */
  private async synchronizeTwin(twinId: string): Promise<void> {
    const twin = this.twins.get(twinId);
    if (!twin) return;

    try {
      // Get latest lifecycle state
      const lifecycle = await lifecycleService.getLifecycle(
        twin.entityId,
        twin.entityType,
      );
      if (!lifecycle) return;

      // Update physical state
      twin.physicalState = {
        currentStage: lifecycle.currentStageId,
        status: lifecycle.status,
        progress: lifecycle.progress,
        actualMetrics: {
          duration: this.calculateDuration(lifecycle),
          cost: twin.physicalState.actualMetrics.cost,
          quality: twin.physicalState.actualMetrics.quality,
          resourceUtilization:
            twin.physicalState.actualMetrics.resourceUtilization,
        },
        lastUpdated: new Date(),
      };

      // Update synchronization status
      twin.synchronization.status = "synced";
      twin.synchronization.lastSyncTime = new Date();
      twin.synchronization.drift = 0;
      twin.metadata.lastSynced = new Date();

      // Generate predictions
      await this.updatePredictions(twin);

      // Update optimizations
      await this.updateOptimizations(twin);

      this.twins.set(twinId, twin);
    } catch (error) {
      console.error(`Error synchronizing twin ${twinId}:`, error);
      if (twin) {
        twin.synchronization.status = "error";
        twin.synchronization.errors.push(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }
  }

  /**
   * Update predictions
   */
  private async updatePredictions(twin: DigitalTwin): Promise<void> {
    // Generate predictions based on current state
    const predictions: TwinPrediction[] = [];

    // Completion prediction
    const remainingStages =
      twin.digitalState.model.stages.length -
      (twin.physicalState.progress / 100) *
        twin.digitalState.model.stages.length;
    const avgDuration =
      twin.digitalState.model.stages.reduce(
        (sum, s) => sum + s.expectedDuration,
        0,
      ) / twin.digitalState.model.stages.length;
    const predictedCompletion = (remainingStages * avgDuration) / 3600; // hours

    predictions.push({
      id: `pred-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "completion",
      predictedValue: predictedCompletion,
      confidence: 0.75,
      timestamp: new Date(),
      horizon: 24,
    });

    // Cost prediction
    const predictedCost = twin.digitalState.model.stages.reduce(
      (sum, s) => sum + s.expectedCost,
      0,
    );
    predictions.push({
      id: `pred-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "cost",
      predictedValue: predictedCost,
      confidence: 0.7,
      timestamp: new Date(),
      horizon: 24,
    });

    twin.predictions = predictions.slice(-10); // Keep last 10 predictions
  }

  /**
   * Update optimizations
   */
  private async updateOptimizations(twin: DigitalTwin): Promise<void> {
    // Generate optimization recommendations
    const recommendations: OptimizationRecommendation[] = [];

    // Check for bottlenecks
    if (
      twin.physicalState.actualMetrics.duration >
      (twin.digitalState.model.stages.reduce(
        (sum, s) => sum + s.expectedDuration,
        0,
      ) /
        3600) *
        1.2
    ) {
      recommendations.push({
        id: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "timing",
        description: "Process duration exceeds expected - optimize stages",
        expectedImpact: 15,
        implementationEffort: "medium",
      });
    }

    // Check resource utilization
    if (twin.physicalState.actualMetrics.resourceUtilization < 0.6) {
      recommendations.push({
        id: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "resource",
        description: "Low resource utilization - optimize allocation",
        expectedImpact: 10,
        implementationEffort: "low",
      });
    }

    twin.digitalState.optimization.recommendations = recommendations;
  }

  /**
   * Get digital twin
   */
  getDigitalTwin(twinId: string): DigitalTwin | null {
    return this.twins.get(twinId) || null;
  }

  /**
   * Get twin by entity
   */
  getTwinByEntity(entityId: string, entityType: string): DigitalTwin | null {
    return (
      Array.from(this.twins.values()).find(
        (t) => t.entityId === entityId && t.entityType === entityType,
      ) || null
    );
  }

  /**
   * Simulate scenario on twin
   */
  async simulateScenario(
    twinId: string,
    scenario: SimulationScenario,
  ): Promise<SimulationResult> {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error("Digital twin not found");
    }

    // Run simulation
    const result: SimulationResult = {
      scenarioId: scenario.id,
      predictedDuration:
        twin.digitalState.model.stages.reduce(
          (sum, s) => sum + s.expectedDuration,
          0,
        ) / 3600,
      predictedCost: twin.digitalState.model.stages.reduce(
        (sum, s) => sum + s.expectedCost,
        0,
      ),
      confidence: 0.8,
    };

    // Add to simulation results
    twin.digitalState.simulation.results.push(result);
    twin.digitalState.simulation.currentScenario = scenario.id;

    this.twins.set(twinId, twin);
    return result;
  }

  /**
   * Apply optimization
   */
  async applyOptimization(
    twinId: string,
    optimizationId: string,
  ): Promise<void> {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error("Digital twin not found");
    }

    const optimization = twin.digitalState.optimization.recommendations.find(
      (opt) => opt.id === optimizationId,
    );

    if (!optimization) {
      throw new Error("Optimization not found");
    }

    // Apply optimization (would update model)
    twin.digitalState.optimization.appliedOptimizations.push(optimizationId);
    twin.digitalState.optimization.impact.durationImprovement +=
      optimization.expectedImpact;
    twin.metadata.version++;

    this.twins.set(twinId, twin);
  }

  /**
   * Cleanup
   */
  cleanup(twinId: string): void {
    const interval = this.syncIntervals.get(twinId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(twinId);
    }
    this.twins.delete(twinId);
  }
}

// Singleton instance
export const digitalTwinService = new AdvancedDigitalTwinService();

export default digitalTwinService;
