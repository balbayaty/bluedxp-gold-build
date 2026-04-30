/**
 * Predictive Maintenance Service (Facility)
 *
 * Single canonical implementation (deduplicated).
 * Provides anomaly detection hooks used by Facility IoT, and optional
 * failure prediction utilities for future expansion.
 */

import type { FacilityAsset } from "@/types/facility";
import { getAssetService } from "../asset/assetService";
import { eventBus } from "@/lib/services/event-store";

export interface PredictiveMaintenanceConfig {
  enableAnomalyDetection?: boolean;
  enableMLModels?: boolean;
  confidenceThreshold?: number; // 0-100
}

export interface AnomalyDetection {
  assetId: string;
  anomalyType: "vibration" | "temperature" | "energy" | "performance" | "other";
  severity: "critical" | "high" | "medium" | "low";
  confidence: number; // 0-100
  description: string;
  detectedAt: Date;
  recommendedActions: string[];
}

export class PredictiveMaintenanceService {
  private config: Required<PredictiveMaintenanceConfig>;
  private assetService: ReturnType<typeof getAssetService>;

  constructor(config: PredictiveMaintenanceConfig = {}) {
    this.config = {
      enableAnomalyDetection: config.enableAnomalyDetection ?? true,
      enableMLModels: config.enableMLModels ?? false,
      confidenceThreshold: config.confidenceThreshold ?? 70,
    };
    this.assetService = getAssetService();
  }

  /**
   * Detect anomalies from sensor readings (used by FacilityIoTService).
   *
   * `sensorData` is provider-specific; we treat it as a bag of numeric readings.
   */
  async detectAnomalies(
    assetId: string,
    sensorData: Record<string, unknown>,
  ): Promise<AnomalyDetection[]> {
    if (!this.config.enableAnomalyDetection) return [];

    const asset: FacilityAsset | null =
      await this.assetService.getAsset(assetId);
    if (!asset) return [];

    const anomalies: AnomalyDetection[] = [];
    const now = new Date();

    const temp =
      typeof sensorData.temperature === "number"
        ? sensorData.temperature
        : undefined;
    const vibration =
      typeof sensorData.vibration === "number"
        ? sensorData.vibration
        : undefined;
    const energy =
      typeof sensorData.energy === "number" ? sensorData.energy : undefined;

    if (typeof temp === "number" && temp > 80) {
      anomalies.push({
        assetId,
        anomalyType: "temperature",
        severity: temp > 95 ? "critical" : "high",
        confidence: Math.min(95, 60 + (temp - 80) * 2),
        description: `High temperature detected (${temp})`,
        detectedAt: now,
        recommendedActions: [
          "Inspect cooling/ventilation",
          "Check load and operating conditions",
        ],
      });
    }

    if (typeof vibration === "number" && vibration > 7) {
      anomalies.push({
        assetId,
        anomalyType: "vibration",
        severity: vibration > 10 ? "critical" : "high",
        confidence: Math.min(95, 60 + (vibration - 7) * 5),
        description: `Excessive vibration detected (${vibration})`,
        detectedAt: now,
        recommendedActions: [
          "Inspect bearings and mounts",
          "Schedule condition assessment",
        ],
      });
    }

    if (typeof energy === "number" && energy > 1.5) {
      anomalies.push({
        assetId,
        anomalyType: "energy",
        severity: energy > 2 ? "high" : "medium",
        confidence: Math.min(90, 55 + (energy - 1.5) * 50),
        description: `Energy usage anomaly detected (${energy})`,
        detectedAt: now,
        recommendedActions: [
          "Verify operating mode",
          "Check for mechanical resistance or leaks",
        ],
      });
    }

    // Emit events for downstream workflows
    for (const a of anomalies) {
      if (a.confidence < this.config.confidenceThreshold) continue;
      await eventBus.publish({
        id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        type: "facility.maintenance.anomaly.detected",
        aggregateId: assetId,
        aggregateType: "FacilityAsset",
        version: 1,
        timestamp: new Date(),
        data: { assetId, anomaly: a },
        metadata: {},
      });
    }

    return anomalies;
  }
}

let predictiveMaintenanceServiceInstance: PredictiveMaintenanceService | null =
  null;

export function getPredictiveMaintenanceService(
  config?: PredictiveMaintenanceConfig,
): PredictiveMaintenanceService {
  if (!predictiveMaintenanceServiceInstance) {
    predictiveMaintenanceServiceInstance = new PredictiveMaintenanceService(
      config,
    );
  }
  return predictiveMaintenanceServiceInstance;
}
