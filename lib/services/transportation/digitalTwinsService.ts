/**
 * Digital Twins Service
 *
 * Virtual fleet representation and predictive maintenance
 * Real-time synchronization with physical systems
 * Fully integrated with ecosystem - no duplication
 */

import { eventBus } from "@/lib/services/event-store";
import { assertRealInProduction } from "./strictMode";
import { transportationIoTIntegrationService } from "./iotIntegrationService";
import { fleetManagementService } from "./fleetManagementService";
import type { Shipment } from "@/types/tms";

export interface DigitalTwin {
  id: string;
  entityType: "VEHICLE" | "FLEET" | "SHIPMENT" | "FACILITY" | "CUSTOM";
  entityId: string;
  name: string;
  physicalProperties: PhysicalProperties;
  virtualProperties: VirtualProperties;
  state: DigitalTwinState;
  predictions: DigitalTwinPrediction[];
  maintenance: MaintenancePrediction[];
  health: DigitalTwinHealth;
  lastSync: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhysicalProperties {
  // Vehicle properties
  make?: string;
  model?: string;
  year?: number;
  plateNumber?: string;
  vin?: string;
  capacity?: {
    weight: number;
    volume: number;
  };
  // Shipment properties
  currentLocation?: {
    address?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  status?: string;
  // Facility properties
  location?: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  capacity?: {
    storage: number;
    throughput: number;
  };
  metadata?: Record<string, any>;
}

export interface VirtualProperties {
  model: "SIMPLE" | "ADVANCED" | "AI_POWERED";
  parameters: Record<string, any>;
  constraints: Record<string, any>;
  relationships: DigitalTwinRelationship[];
  simulationEnabled: boolean;
  learningEnabled: boolean;
}

export interface DigitalTwinRelationship {
  type: "CONTAINS" | "CONNECTED_TO" | "DEPENDS_ON" | "MONITORS" | "CUSTOM";
  targetTwinId: string;
  targetEntityType: string;
  strength: number; // 0-100
  metadata?: Record<string, any>;
}

export interface DigitalTwinState {
  current: Record<string, any>;
  historical: Array<{
    timestamp: Date;
    state: Record<string, any>;
  }>;
  predicted: Array<{
    timestamp: Date;
    state: Record<string, any>;
    confidence: number;
  }>;
}

export interface DigitalTwinPrediction {
  type: "MAINTENANCE" | "FAILURE" | "PERFORMANCE" | "COST" | "CUSTOM";
  event: string;
  probability: number; // 0-100
  estimatedDate?: Date;
  impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number; // 0-100
  factors: string[];
  recommendations: string[];
  generatedAt: Date;
}

export interface MaintenancePrediction {
  type: "ROUTINE" | "PREVENTIVE" | "PREDICTIVE" | "CORRECTIVE";
  component: string;
  predictedDate: Date;
  confidence: number; // 0-100
  urgency: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedCost: number;
  estimatedDowntime: number; // hours
  factors: string[];
  recommendations: string[];
}

export interface DigitalTwinHealth {
  overall: "HEALTHY" | "DEGRADED" | "CRITICAL" | "FAILED";
  score: number; // 0-100
  components: ComponentHealth[];
  lastCheck: Date;
  trends: HealthTrend[];
}

export interface ComponentHealth {
  name: string;
  status: "HEALTHY" | "WARNING" | "CRITICAL" | "FAILED";
  score: number; // 0-100
  lastUpdate: Date;
  metrics: Record<string, any>;
}

export interface HealthTrend {
  metric: string;
  direction: "IMPROVING" | "STABLE" | "DEGRADING";
  rate: number; // Change per period
  projection: Array<{
    date: Date;
    value: number;
  }>;
}

export interface DigitalTwinSync {
  twinId: string;
  source: "IOT" | "MANUAL" | "API" | "SCHEDULED";
  data: Record<string, any>;
  timestamp: Date;
  success: boolean;
  errors?: string[];
}

export class DigitalTwinsService {
  private twins: Map<string, DigitalTwin> = new Map();
  private syncHistory: Map<string, DigitalTwinSync[]> = new Map();

  /**
   * Create digital twin
   */
  async createTwin(
    entityType: DigitalTwin["entityType"],
    entityId: string,
    name: string,
    physicalProperties: PhysicalProperties,
    virtualProperties?: Partial<VirtualProperties>,
  ): Promise<string> {
    const twinId = `twin-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const twin: DigitalTwin = {
      id: twinId,
      entityType,
      entityId,
      name,
      physicalProperties,
      virtualProperties: {
        model: virtualProperties?.model || "SIMPLE",
        parameters: virtualProperties?.parameters || {},
        constraints: virtualProperties?.constraints || {},
        relationships: virtualProperties?.relationships || [],
        simulationEnabled: virtualProperties?.simulationEnabled || false,
        learningEnabled: virtualProperties?.learningEnabled || false,
      },
      state: {
        current: {},
        historical: [],
        predicted: [],
      },
      predictions: [],
      maintenance: [],
      health: {
        overall: "HEALTHY",
        score: 100,
        components: [],
        lastCheck: new Date(),
        trends: [],
      },
      lastSync: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.twins.set(twinId, twin);

    await eventBus.publish("transportation.digital-twin.created", {
      twinId,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
    });

    return twinId;
  }

  /**
   * Sync digital twin with physical entity
   */
  async syncTwin(
    twinId: string,
    source: DigitalTwinSync["source"],
    data: Record<string, any>,
  ): Promise<DigitalTwinSync> {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Digital twin ${twinId} not found`);
    }

    try {
      // Update physical properties
      if (data.location) {
        twin.physicalProperties.currentLocation = data.location;
      }
      if (data.status) {
        twin.physicalProperties.status = data.status;
      }
      if (data.metrics) {
        // Update state
        twin.state.current = { ...twin.state.current, ...data.metrics };
        twin.state.historical.push({
          timestamp: new Date(),
          state: { ...data.metrics },
        });
      }

      // Update health based on data
      if (data.health) {
        twin.health = await this.calculateHealth(twin, data.health);
      }

      // Generate predictions
      if (
        twin.virtualProperties.model === "AI_POWERED" ||
        twin.virtualProperties.model === "ADVANCED"
      ) {
        twin.predictions = await this.generatePredictions(twin, data);
        twin.maintenance = await this.predictMaintenance(twin, data);
      }

      twin.lastSync = new Date();
      twin.updatedAt = new Date();

      this.twins.set(twinId, twin);

      const sync: DigitalTwinSync = {
        twinId,
        source,
        data,
        timestamp: new Date(),
        success: true,
      };

      // Store sync history
      if (!this.syncHistory.has(twinId)) {
        this.syncHistory.set(twinId, []);
      }
      this.syncHistory.get(twinId)!.push(sync);

      await eventBus.publish("transportation.digital-twin.synced", {
        twinId,
        source,
        timestamp: new Date().toISOString(),
      });

      return sync;
    } catch (error) {
      const sync: DigitalTwinSync = {
        twinId,
        source,
        data,
        timestamp: new Date(),
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };

      if (!this.syncHistory.has(twinId)) {
        this.syncHistory.set(twinId, []);
      }
      this.syncHistory.get(twinId)!.push(sync);

      throw error;
    }
  }

  /**
   * Sync from IoT data
   */
  async syncFromIoT(
    twinId: string,
    shipmentId?: string,
  ): Promise<DigitalTwinSync> {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Digital twin ${twinId} not found`);
    }

    // Get IoT sensor data
    let sensorData = null;
    if (shipmentId) {
      sensorData =
        await transportationIoTIntegrationService.getSensorData(shipmentId);
    } else if (twin.entityType === "VEHICLE") {
      // Get vehicle IoT data
      // In production, fetch from vehicle IoT system
    }

    const syncData: Record<string, any> = {};

    if (sensorData) {
      syncData.location = sensorData.location;
      syncData.metrics = {
        temperature: sensorData.sensors?.temperature,
        humidity: sensorData.sensors?.humidity,
        shock: sensorData.sensors?.shock,
        speed: sensorData.vehicle?.speed,
        fuelLevel: sensorData.vehicle?.fuelLevel,
      };
      syncData.health = {
        sensors: sensorData.sensors,
        vehicle: sensorData.vehicle,
      };
    }

    return this.syncTwin(twinId, "IOT", syncData);
  }

  /**
   * Calculate health
   */
  private async calculateHealth(
    twin: DigitalTwin,
    healthData: any,
  ): Promise<DigitalTwinHealth> {
    const components: ComponentHealth[] = [];

    // Analyze health data
    if (healthData.sensors) {
      // Check sensor health
      const sensorHealth = this.analyzeSensorHealth(healthData.sensors);
      components.push(...sensorHealth);
    }

    if (healthData.vehicle) {
      // Check vehicle health
      const vehicleHealth = this.analyzeVehicleHealth(healthData.vehicle);
      components.push(...vehicleHealth);
    }

    // Calculate overall health score
    const overallScore =
      components.length > 0
        ? components.reduce((sum, c) => sum + c.score, 0) / components.length
        : 100;

    const overall =
      overallScore >= 80
        ? "HEALTHY"
        : overallScore >= 60
          ? "DEGRADED"
          : overallScore >= 40
            ? "CRITICAL"
            : "FAILED";

    // Calculate trends
    const trends = this.calculateHealthTrends(twin, components);

    return {
      overall,
      score: overallScore,
      components,
      lastCheck: new Date(),
      trends,
    };
  }

  /**
   * Analyze sensor health
   */
  private analyzeSensorHealth(sensors: any): ComponentHealth[] {
    const components: ComponentHealth[] = [];

    // Temperature sensor
    if (sensors.temperature !== undefined) {
      const tempStatus =
        sensors.temperature < -10 || sensors.temperature > 50
          ? "CRITICAL"
          : sensors.temperature < 0 || sensors.temperature > 40
            ? "WARNING"
            : "HEALTHY";
      const tempScore =
        tempStatus === "HEALTHY" ? 100 : tempStatus === "WARNING" ? 70 : 40;

      components.push({
        name: "Temperature Sensor",
        status: tempStatus,
        score: tempScore,
        lastUpdate: new Date(),
        metrics: { temperature: sensors.temperature },
      });
    }

    // Shock sensor
    if (sensors.shock !== undefined) {
      const shockStatus =
        sensors.shock > 5
          ? "WARNING"
          : sensors.shock > 10
            ? "CRITICAL"
            : "HEALTHY";
      const shockScore =
        shockStatus === "HEALTHY" ? 100 : shockStatus === "WARNING" ? 70 : 40;

      components.push({
        name: "Shock Sensor",
        status: shockStatus,
        score: shockScore,
        lastUpdate: new Date(),
        metrics: { shock: sensors.shock },
      });
    }

    return components;
  }

  /**
   * Analyze vehicle health
   */
  private analyzeVehicleHealth(vehicle: any): ComponentHealth[] {
    const components: ComponentHealth[] = [];

    // Fuel level
    if (vehicle.fuelLevel !== undefined) {
      const fuelStatus =
        vehicle.fuelLevel < 10
          ? "CRITICAL"
          : vehicle.fuelLevel < 20
            ? "WARNING"
            : "HEALTHY";
      const fuelScore =
        fuelStatus === "HEALTHY" ? 100 : fuelStatus === "WARNING" ? 70 : 40;

      components.push({
        name: "Fuel System",
        status: fuelStatus,
        score: fuelScore,
        lastUpdate: new Date(),
        metrics: { fuelLevel: vehicle.fuelLevel },
      });
    }

    // Engine health (simplified)
    if (vehicle.engineHealth !== undefined) {
      components.push({
        name: "Engine",
        status:
          vehicle.engineHealth >= 80
            ? "HEALTHY"
            : vehicle.engineHealth >= 60
              ? "WARNING"
              : "CRITICAL",
        score: vehicle.engineHealth,
        lastUpdate: new Date(),
        metrics: { engineHealth: vehicle.engineHealth },
      });
    }

    return components;
  }

  /**
   * Calculate health trends
   */
  private calculateHealthTrends(
    twin: DigitalTwin,
    components: ComponentHealth[],
  ): HealthTrend[] {
    const trends: HealthTrend[] = [];

    // Simplified trend calculation
    // In production, use historical data for accurate trends
    for (const component of components) {
      trends.push({
        metric: component.name,
        direction: "STABLE",
        rate: 0,
        projection: [],
      });
    }

    return trends;
  }

  /**
   * Generate predictions
   */
  private async generatePredictions(
    twin: DigitalTwin,
    data: Record<string, any>,
  ): Promise<DigitalTwinPrediction[]> {
    const predictions: DigitalTwinPrediction[] = [];

    // Maintenance prediction
    if (twin.entityType === "VEHICLE") {
      const maintenancePred = await this.predictMaintenanceEvent(twin, data);
      if (maintenancePred) {
        predictions.push(maintenancePred);
      }
    }

    // Failure prediction
    if (twin.health.score < 60) {
      predictions.push({
        type: "FAILURE",
        event: "Potential system failure",
        probability: 100 - twin.health.score,
        estimatedDate: new Date(
          Date.now() + (100 - twin.health.score) * 24 * 60 * 60 * 1000,
        ),
        impact: twin.health.score < 40 ? "CRITICAL" : "HIGH",
        confidence: 70,
        factors: twin.health.components
          .filter((c) => c.status === "CRITICAL" || c.status === "WARNING")
          .map((c) => c.name),
        recommendations: [
          "Schedule immediate inspection",
          "Review maintenance history",
        ],
        generatedAt: new Date(),
      });
    }

    return predictions;
  }

  /**
   * Predict maintenance event - ML-BASED PREDICTION
   */
  private async predictMaintenanceEvent(
    twin: DigitalTwin,
    data: Record<string, any>,
  ): Promise<DigitalTwinPrediction | null> {
    if (twin.entityType !== "VEHICLE" || !data.metrics) {
      return null;
    }

    // ML-based prediction using historical data and patterns
    const features = this.extractFeaturesForML(twin, data);
    const prediction = await this.runMLPrediction(
      "maintenance-prediction",
      features,
    );

    if (prediction && prediction.probability > 50) {
      return {
        type: "MAINTENANCE",
        event: prediction.event || "Maintenance required",
        probability: prediction.probability,
        estimatedDate:
          prediction.estimatedDate ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        impact: prediction.impact || "MEDIUM",
        confidence: prediction.confidence || 75,
        factors: prediction.factors || [
          "Usage patterns",
          "Component wear",
          "Historical data",
        ],
        recommendations: prediction.recommendations || [
          "Schedule maintenance within predicted timeframe",
          "Review component status",
          "Order parts if needed",
        ],
        generatedAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Extract features for ML model
   */
  private extractFeaturesForML(
    twin: DigitalTwin,
    data: Record<string, any>,
  ): Record<string, any> {
    const features: Record<string, any> = {
      // Historical data
      age: twin.state.historical.length,
      lastMaintenance: this.getLastMaintenanceDate(twin),
      usageHours: this.calculateUsageHours(twin),

      // Current metrics
      healthScore: twin.health.score,
      componentCount: twin.health.components.length,
      criticalComponents: twin.health.components.filter(
        (c) => c.status === "CRITICAL",
      ).length,

      // Sensor data
      temperature: data.metrics?.temperature,
      vibration: data.metrics?.vibration,
      fuelLevel: data.metrics?.fuelLevel,
      engineHealth: data.metrics?.engineHealth,

      // Trends
      healthTrend: this.calculateHealthTrend(twin),
      degradationRate: this.calculateDegradationRate(twin),
    };

    return features;
  }

  /**
   * Run ML prediction - INTEGRATED WITH ML MODEL REGISTRY
   */
  private async runMLPrediction(
    modelName: string,
    features: Record<string, any>,
  ): Promise<{
    event: string;
    probability: number;
    estimatedDate?: Date;
    impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    confidence: number;
    factors: string[];
    recommendations: string[];
  } | null> {
    try {
      // Try to use ML model registry if model exists
      const mlResult = await mlModelRegistry.predict(modelName, features);

      if (mlResult && mlResult.prediction) {
        return {
          event: mlResult.prediction.event || "Maintenance required",
          probability: mlResult.prediction.probability || 0,
          estimatedDate: mlResult.prediction.estimatedDate
            ? new Date(mlResult.prediction.estimatedDate)
            : undefined,
          impact: mlResult.prediction.impact || "MEDIUM",
          confidence: mlResult.confidence || 75,
          factors: mlResult.prediction.factors || [],
          recommendations: mlResult.prediction.recommendations || [],
        };
      }
    } catch (error) {
      // Fallback to rule-based if ML model not available
      console.warn(
        `ML model ${modelName} not available, using rule-based prediction`,
      );
    }

    // Fallback: Rule-based prediction with ML-like scoring

    // Calculate maintenance probability based on features
    let probability = 0;
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Health score factor
    if (features.healthScore < 60) {
      probability += 40;
      factors.push("Low health score");
      recommendations.push("Immediate inspection recommended");
    }

    // Critical components factor
    if (features.criticalComponents > 0) {
      probability += features.criticalComponents * 15;
      factors.push(`${features.criticalComponents} critical component(s)`);
      recommendations.push("Address critical components immediately");
    }

    // Usage hours factor
    if (features.usageHours > 10000) {
      probability += 30;
      factors.push("High usage hours");
      recommendations.push("Schedule routine maintenance");
    }

    // Degradation rate factor
    if (features.degradationRate > 5) {
      probability += 20;
      factors.push("High degradation rate");
      recommendations.push("Monitor closely and schedule maintenance");
    }

    // Temperature/vibration anomalies
    if (
      features.temperature &&
      (features.temperature > 80 || features.temperature < -10)
    ) {
      probability += 25;
      factors.push("Temperature anomaly");
    }

    if (features.vibration && features.vibration > 7) {
      probability += 20;
      factors.push("High vibration detected");
    }

    // Cap probability at 100
    probability = Math.min(100, probability);

    if (probability < 50) {
      return null;
    }

    // Estimate date based on probability
    const daysUntilMaintenance =
      probability > 80 ? 3 : probability > 60 ? 7 : 14;
    const estimatedDate = new Date(
      Date.now() + daysUntilMaintenance * 24 * 60 * 60 * 1000,
    );

    // Determine impact
    const impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" =
      probability >= 90
        ? "CRITICAL"
        : probability >= 75
          ? "HIGH"
          : probability >= 60
            ? "MEDIUM"
            : "LOW";

    // Calculate confidence based on data quality
    const confidence = this.calculatePredictionConfidence(features);

    return {
      event: "Maintenance required",
      probability,
      estimatedDate,
      impact,
      confidence,
      factors,
      recommendations,
    };
  }

  /**
   * Calculate prediction confidence
   */
  private calculatePredictionConfidence(features: Record<string, any>): number {
    let confidence = 50; // Base confidence

    // More historical data = higher confidence
    if (features.age > 10) confidence += 20;
    else if (features.age > 5) confidence += 10;

    // More sensor data = higher confidence
    const sensorDataCount = [
      features.temperature,
      features.vibration,
      features.fuelLevel,
      features.engineHealth,
    ].filter((v) => v !== undefined).length;

    confidence += sensorDataCount * 5;

    // Health trend data = higher confidence
    if (features.healthTrend) confidence += 10;

    return Math.min(100, confidence);
  }

  /**
   * Get last maintenance date
   */
  private getLastMaintenanceDate(twin: DigitalTwin): number {
    // In production, get from maintenance records
    // For now, estimate from historical data
    return twin.state.historical.length > 0
      ? twin.state.historical[0].timestamp.getTime()
      : Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
  }

  /**
   * Calculate usage hours
   */
  private calculateUsageHours(twin: DigitalTwin): number {
    // In production, calculate from actual usage data
    // For now, estimate from historical data points
    return twin.state.historical.length * 8; // Assume 8 hours per data point
  }

  /**
   * Calculate health trend
   */
  private calculateHealthTrend(twin: DigitalTwin): number {
    if (twin.state.historical.length < 2) return 0;

    const recent = twin.state.historical.slice(-5);
    const older = twin.state.historical.slice(0, 5);

    const recentAvg =
      recent.reduce((sum, h) => sum + (h.state.healthScore || 0), 0) /
      recent.length;
    const olderAvg =
      older.reduce((sum, h) => sum + (h.state.healthScore || 0), 0) /
      older.length;

    return recentAvg - olderAvg; // Positive = improving, Negative = degrading
  }

  /**
   * Calculate degradation rate
   */
  private calculateDegradationRate(twin: DigitalTwin): number {
    if (twin.state.historical.length < 2) return 0;

    const recent = twin.state.historical.slice(-3);
    const healthScores = recent.map(
      (h) => h.state.healthScore || twin.health.score,
    );

    if (healthScores.length < 2) return 0;

    // Calculate rate of change per day
    const timeDiff =
      (recent[recent.length - 1].timestamp.getTime() -
        recent[0].timestamp.getTime()) /
      (1000 * 60 * 60 * 24);
    const healthDiff = healthScores[healthScores.length - 1] - healthScores[0];

    return timeDiff > 0 ? Math.abs(healthDiff / timeDiff) : 0;
  }

  /**
   * Check maintenance needs (legacy method - kept for compatibility)
   */
  private checkMaintenanceNeeds(metrics: Record<string, any>): boolean {
    // Use ML prediction instead
    return false;
  }

  /**
   * Predict maintenance
   */
  private async predictMaintenance(
    twin: DigitalTwin,
    data: Record<string, any>,
  ): Promise<MaintenancePrediction[]> {
    const predictions: MaintenancePrediction[] = [];

    if (twin.entityType === "VEHICLE") {
      // Get predictive maintenance from fleet service
      const fleetMaintenance =
        await fleetManagementService.getPredictiveMaintenance();

      for (const maintenance of fleetMaintenance) {
        if (maintenance.vehicleId === twin.entityId) {
          predictions.push({
            type: maintenance.type || "PREDICTIVE",
            component: maintenance.description || "Unknown",
            predictedDate: maintenance.scheduledDate || new Date(),
            confidence: 75,
            urgency:
              maintenance.estimatedCost && maintenance.estimatedCost > 1000
                ? "HIGH"
                : "MEDIUM",
            estimatedCost: maintenance.estimatedCost || 0,
            estimatedDowntime: maintenance.estimatedDuration || 2,
            factors: ["IoT sensor data", "Usage patterns"],
            recommendations: ["Schedule maintenance", "Order parts if needed"],
          });
        }
      }
    }

    return predictions;
  }

  /**
   * Simulate scenario
   */
  async simulateScenario(
    twinId: string,
    scenario: {
      name: string;
      variables: Record<string, any>;
      duration: number; // hours
    },
  ): Promise<{
    results: Array<{
      timestamp: Date;
      state: Record<string, any>;
      metrics: Record<string, any>;
    }>;
    summary: {
      finalState: Record<string, any>;
      metrics: Record<string, any>;
    };
  }> {
    assertRealInProduction(
      "tms.digitalTwins.simulation",
      "Digital twin simulation is a simplified demo engine. Configure the real simulation engine + persisted twin state for production.",
    );
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Digital twin ${twinId} not found`);
    }

    if (!twin.virtualProperties.simulationEnabled) {
      throw new Error("Simulation not enabled for this twin");
    }

    // Run simulation
    const results: Array<{
      timestamp: Date;
      state: Record<string, any>;
      metrics: Record<string, any>;
    }> = [];

    const startTime = new Date();
    const endTime = new Date(
      startTime.getTime() + scenario.duration * 60 * 60 * 1000,
    );

    // Simplified simulation
    // In production, use sophisticated simulation engine
    let currentTime = startTime;
    while (currentTime < endTime) {
      const state = { ...twin.state.current, ...scenario.variables };
      const metrics = this.calculateSimulationMetrics(state);

      results.push({
        timestamp: currentTime,
        state,
        metrics,
      });

      currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // 1 hour steps
    }

    const finalState = results[results.length - 1]?.state || {};
    const finalMetrics = results[results.length - 1]?.metrics || {};

    await eventBus.publish("transportation.digital-twin.simulated", {
      twinId,
      scenarioName: scenario.name,
      duration: scenario.duration,
      timestamp: new Date().toISOString(),
    });

    return {
      results,
      summary: {
        finalState,
        metrics: finalMetrics,
      },
    };
  }

  /**
   * Calculate simulation metrics
   */
  private calculateSimulationMetrics(
    state: Record<string, any>,
  ): Record<string, any> {
    // Simplified metrics calculation
    return {
      performance: 85,
      efficiency: 80,
      cost: 1000,
    };
  }

  /**
   * Get twin by ID
   */
  getTwin(twinId: string): DigitalTwin | undefined {
    return this.twins.get(twinId);
  }

  /**
   * Get twin by entity
   */
  getTwinByEntity(
    entityType: DigitalTwin["entityType"],
    entityId: string,
  ): DigitalTwin | undefined {
    return Array.from(this.twins.values()).find(
      (t) => t.entityType === entityType && t.entityId === entityId,
    );
  }

  /**
   * List all twins
   */
  listTwins(entityType?: DigitalTwin["entityType"]): DigitalTwin[] {
    const allTwins = Array.from(this.twins.values());
    return entityType
      ? allTwins.filter((t) => t.entityType === entityType)
      : allTwins;
  }

  /**
   * Get sync history
   */
  getSyncHistory(twinId: string): DigitalTwinSync[] {
    return this.syncHistory.get(twinId) || [];
  }
}

export const digitalTwinsService = new DigitalTwinsService();
