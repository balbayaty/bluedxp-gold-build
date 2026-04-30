import { aiService } from "../ai/chemcheckService";

// Equipment data interface
export interface EquipmentData {
  id: string;
  name: string;
  type: string;
  installationDate: string;
  lastMaintenanceDate: string;
  maintenanceHistory: MaintenanceRecord[];
  operatingHours: number;
  location: string;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  sensorReadings?: SensorReading[];
  specifications?: Record<string, any>;
  currentStatus: "operational" | "maintenance" | "shutdown" | "warning";
}

// Maintenance record interface
export interface MaintenanceRecord {
  date: string;
  type: "preventive" | "corrective" | "predictive" | "inspection";
  description: string;
  technician: string;
  parts?: {
    name: string;
    partNumber: string;
    quantity: number;
  }[];
  cost?: number;
  duration?: number; // in hours
  findings?: string;
  recommendedActions?: string;
}

// Sensor reading interface
export interface SensorReading {
  timestamp: string;
  sensorId: string;
  sensorType: string; // temperature, pressure, vibration, etc.
  value: number;
  unit: string;
  status: "normal" | "warning" | "critical" | "error";
  location?: string;
}

// Maintenance prediction result interface
export interface MaintenancePrediction {
  equipmentId: string;
  predictionDate: string;
  daysUntilNextMaintenance: number;
  recommendedMaintenance: {
    type: "preventive" | "corrective" | "predictive" | "inspection";
    description: string;
    priority: "low" | "medium" | "high" | "critical";
    parts?: {
      name: string;
      partNumber: string;
      quantity: number;
    }[];
    estimatedDuration: number; // in hours
    estimatedCost?: number;
  }[];
  failureProbability: number; // 0-1 scale
  confidenceScore: number; // 0-1 scale
  reasoningNotes: string[];
  healthIndex: number; // 0-100 scale
}

// Anomaly detection result
export interface AnomalyDetectionResult {
  equipmentId: string;
  detectionDate: string;
  anomalies: {
    sensorId: string;
    sensorType: string;
    timestamp: string;
    value: number;
    expectedRange: {
      min: number;
      max: number;
    };
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    possibleCauses: string[];
    recommendedActions: string[];
  }[];
  normalSensors: string[];
  overallStatus: "normal" | "warning" | "critical";
  confidenceScore: number;
}

/**
 * Predictive Maintenance Service
 * Uses both rules-based analysis and AI to predict maintenance needs and detect anomalies
 */
export class PredictiveMaintenanceService {
  // Equipment type-specific maintenance intervals (in days)
  private maintenanceIntervals: Record<string, Record<string, number>> = {
    pump: {
      inspection: 30,
      preventive: 90,
      overhaul: 365,
    },
    valve: {
      inspection: 45,
      preventive: 180,
      overhaul: 730,
    },
    compressor: {
      inspection: 14,
      preventive: 60,
      overhaul: 365,
    },
    reactor: {
      inspection: 7,
      preventive: 30,
      overhaul: 180,
    },
    "storage tank": {
      inspection: 30,
      preventive: 120,
      overhaul: 730,
    },
    filter: {
      inspection: 14,
      preventive: 60,
      replacement: 180,
    },
    "heat exchanger": {
      inspection: 30,
      cleaning: 90,
      preventive: 180,
    },
    conveyor: {
      inspection: 14,
      preventive: 60,
      overhaul: 365,
    },
  };

  // Normal operating ranges for different sensor types
  private normalRanges: Record<
    string,
    Record<string, { min: number; max: number }>
  > = {
    pump: {
      temperature: { min: 20, max: 85 },
      pressure: { min: 0.5, max: 10 },
      vibration: { min: 0, max: 5 },
      flow: { min: 1, max: 200 },
      current: { min: 5, max: 30 },
    },
    compressor: {
      temperature: { min: 30, max: 100 },
      pressure: { min: 2, max: 20 },
      vibration: { min: 0, max: 6 },
      flow: { min: 10, max: 500 },
      current: { min: 10, max: 50 },
    },
    valve: {
      temperature: { min: 0, max: 80 },
      pressure: { min: 0, max: 15 },
      position: { min: 0, max: 100 },
    },
    // ... other equipment types
  };

  // Default normal ranges if equipment-specific not found
  private defaultNormalRanges: Record<string, { min: number; max: number }> = {
    temperature: { min: 10, max: 90 },
    pressure: { min: 0, max: 15 },
    vibration: { min: 0, max: 10 },
    flow: { min: 0, max: 300 },
    level: { min: 5, max: 95 },
    ph: { min: 6, max: 9 },
    current: { min: 0, max: 50 },
    voltage: { min: 220, max: 240 },
    rpm: { min: 0, max: 3600 },
  };

  /**
   * Calculate days since last maintenance
   */
  private daysSinceLastMaintenance(lastMaintenanceDate: string): number {
    const lastDate = new Date(lastMaintenanceDate);
    const currentDate = new Date();
    const diffTime = currentDate.getTime() - lastDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate equipment age in days
   */
  private getEquipmentAge(installationDate: string): number {
    const installDate = new Date(installationDate);
    const currentDate = new Date();
    const diffTime = currentDate.getTime() - installDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate a health index based on maintenance history and sensor readings
   * Returns a value from 0-100 (0=poor, 100=excellent)
   */
  private calculateHealthIndex(equipment: EquipmentData): number {
    // Start with base health score of 100
    let healthIndex = 100;

    // Deduct points for age
    const age = this.getEquipmentAge(equipment.installationDate);
    // Age factor: older equipment gets more penalty
    const agePenalty = Math.min(30, (age / 365) * 5);
    healthIndex -= agePenalty;

    // Deduct for time since last maintenance
    const daysSinceLastMaintenance = this.daysSinceLastMaintenance(
      equipment.lastMaintenanceDate,
    );
    // Find the recommended interval for this equipment type
    let recommendedInterval = 90; // Default
    const equipType = equipment.type.toLowerCase();
    for (const [type, intervals] of Object.entries(this.maintenanceIntervals)) {
      if (equipType.includes(type)) {
        recommendedInterval = intervals["preventive"];
        break;
      }
    }

    // Calculate maintenance delay penalty
    const maintenanceDelayPenalty =
      (Math.max(0, daysSinceLastMaintenance - recommendedInterval) / 30) * 10;
    healthIndex -= Math.min(30, maintenanceDelayPenalty);

    // Deduct for corrective maintenance history
    const correctiveMaintenanceCount = equipment.maintenanceHistory.filter(
      (m) => m.type === "corrective",
    ).length;
    const correctivePenalty = correctiveMaintenanceCount * 5;
    healthIndex -= Math.min(20, correctivePenalty);

    // Analyze sensor readings if available
    if (equipment.sensorReadings && equipment.sensorReadings.length > 0) {
      // Count warnings and critical readings
      const warningCount = equipment.sensorReadings.filter(
        (r) => r.status === "warning",
      ).length;
      const criticalCount = equipment.sensorReadings.filter(
        (r) => r.status === "critical",
      ).length;

      const sensorPenalty = warningCount * 2 + criticalCount * 5;
      healthIndex -= Math.min(30, sensorPenalty);
    }

    // Ensure health index stays within 0-100 range
    return Math.max(0, Math.min(100, Math.round(healthIndex)));
  }

  /**
   * Use rules-based prediction for maintenance
   */
  private predictMaintenanceRulesBased(
    equipment: EquipmentData,
  ): MaintenancePrediction {
    const equipmentType = equipment.type.toLowerCase();
    const healthIndex = this.calculateHealthIndex(equipment);
    const daysSinceLastMaintenance = this.daysSinceLastMaintenance(
      equipment.lastMaintenanceDate,
    );

    // Find applicable maintenance intervals
    let intervals = this.maintenanceIntervals["pump"]; // Default to pump if type not found
    for (const [type, typeIntervals] of Object.entries(
      this.maintenanceIntervals,
    )) {
      if (equipmentType.includes(type)) {
        intervals = typeIntervals;
        break;
      }
    }

    // Determine the next maintenance type
    let nextMaintenanceType:
      | "preventive"
      | "corrective"
      | "predictive"
      | "inspection" = "inspection";
    if (daysSinceLastMaintenance >= intervals["overhaul"]) {
      nextMaintenanceType = "preventive"; // Major preventive maintenance
    } else if (daysSinceLastMaintenance >= intervals["preventive"]) {
      nextMaintenanceType = "preventive"; // Regular preventive
    } else {
      nextMaintenanceType = "inspection";
    }

    // Factor in health index
    if (healthIndex < 50) {
      nextMaintenanceType = "corrective"; // Bad health means corrective maintenance needed
    } else if (healthIndex < 70) {
      nextMaintenanceType = "preventive"; // Preventive to avoid future issues
    }

    // Calculate days until next maintenance
    let daysUntilNextMaintenance =
      intervals[
        nextMaintenanceType === "preventive" ? "preventive" : "inspection"
      ] - daysSinceLastMaintenance;

    // If health is poor, accelerate maintenance
    if (healthIndex < 50) {
      daysUntilNextMaintenance = Math.max(0, daysUntilNextMaintenance - 30);
    } else if (healthIndex < 70) {
      daysUntilNextMaintenance = Math.max(0, daysUntilNextMaintenance - 15);
    }

    // If days is negative, maintenance is overdue
    daysUntilNextMaintenance = Math.max(0, daysUntilNextMaintenance);

    // Calculate failure probability based on health index
    const failureProbability = Math.min(1, Math.max(0, 1 - healthIndex / 100));

    // Create the prediction
    return {
      equipmentId: equipment.id,
      predictionDate: new Date().toISOString(),
      daysUntilNextMaintenance,
      recommendedMaintenance: [
        {
          type: nextMaintenanceType,
          description: `${nextMaintenanceType.charAt(0).toUpperCase() + nextMaintenanceType.slice(1)} maintenance for ${equipment.name}`,
          priority:
            healthIndex < 50 ? "high" : healthIndex < 70 ? "medium" : "low",
          estimatedDuration: nextMaintenanceType === "preventive" ? 8 : 2,
        },
      ],
      failureProbability,
      confidenceScore: 0.7, // Rule-based has moderate confidence
      reasoningNotes: [
        `Equipment age: ${this.getEquipmentAge(equipment.installationDate)} days`,
        `Days since last maintenance: ${daysSinceLastMaintenance}`,
        `Health index: ${healthIndex}/100`,
      ],
      healthIndex,
    };
  }

  /**
   * Use AI to enhance maintenance prediction
   */
  private async enhancePredictionWithAI(
    equipment: EquipmentData,
    baselinePrediction: MaintenancePrediction,
  ): Promise<MaintenancePrediction> {
    try {
      // Prepare equipment data for AI analysis
      const equipmentData = {
        id: equipment.id,
        name: equipment.name,
        type: equipment.type,
        age: this.getEquipmentAge(equipment.installationDate),
        operatingHours: equipment.operatingHours,
        daysSinceLastMaintenance: this.daysSinceLastMaintenance(
          equipment.lastMaintenanceDate,
        ),
        maintenanceHistory: equipment.maintenanceHistory.slice(-5), // Last 5 maintenance records
        currentStatus: equipment.currentStatus,
        healthIndex: baselinePrediction.healthIndex,
        sensorReadings: equipment.sensorReadings
          ? equipment.sensorReadings
              .sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime(),
              )
              .slice(0, 20)
          : [], // Latest 20 sensor readings if available
      };

      const analysisPrompt = `Analyze this equipment maintenance data and enhance the baseline prediction:
      
Equipment Data:
${JSON.stringify(equipmentData, null, 2)}

Baseline Prediction:
${JSON.stringify(baselinePrediction, null, 2)}

Based on the equipment data, maintenance history, and sensor readings, enhance the baseline prediction.
Pay special attention to:
1. Any patterns in maintenance history that suggest recurring issues
2. Sensor readings that indicate deterioration or impending failure
3. The relationship between operating hours and past maintenance needs
4. Any specific maintenance needs not captured in the baseline prediction

Provide an enhanced prediction with any adjusted values, new recommended maintenance steps, and updated reasoning.
Focus on being accurate and specific with maintenance recommendations based on the equipment type.

Format your response as a JSON object with the same structure as the baseline prediction:
{
  "equipmentId": "...",
  "predictionDate": "...",
  "daysUntilNextMaintenance": number,
  "recommendedMaintenance": [
    {
      "type": "preventive|corrective|predictive|inspection",
      "description": "detailed description",
      "priority": "low|medium|high|critical",
      "parts": [optional list of required parts],
      "estimatedDuration": number,
      "estimatedCost": number (optional)
    }
  ],
  "failureProbability": number (0-1),
  "confidenceScore": number (0-1),
  "reasoningNotes": ["note1", "note2", ...],
  "healthIndex": number (0-100)
}`;

      const result = await aiService.analyzeDocument(analysisPrompt, {
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      try {
        const enhancedPrediction =
          typeof result.analysis === "string"
            ? JSON.parse(result.analysis)
            : result.analysis;

        // Validate the enhanced prediction
        if (
          enhancedPrediction &&
          enhancedPrediction.equipmentId === equipment.id
        ) {
          // Preserve original prediction date
          enhancedPrediction.predictionDate = baselinePrediction.predictionDate;

          // Ensure the health index is still within range
          enhancedPrediction.healthIndex = Math.max(
            0,
            Math.min(100, enhancedPrediction.healthIndex),
          );

          // Ensure failure probability is within range
          enhancedPrediction.failureProbability = Math.max(
            0,
            Math.min(1, enhancedPrediction.failureProbability),
          );

          return enhancedPrediction;
        }
      } catch (error) {
        console.error("Error parsing AI enhanced prediction:", error);
      }

      // Return baseline if AI enhancement fails
      return baselinePrediction;
    } catch (error) {
      console.error("Error in AI prediction enhancement:", error);
      return baselinePrediction;
    }
  }

  /**
   * Detect anomalies in sensor readings
   */
  private detectAnomaliesInReadings(
    equipment: EquipmentData,
  ): AnomalyDetectionResult {
    const anomalies: AnomalyDetectionResult["anomalies"] = [];
    const normalSensors: string[] = [];

    // Skip if no sensor readings
    if (!equipment.sensorReadings || equipment.sensorReadings.length === 0) {
      return {
        equipmentId: equipment.id,
        detectionDate: new Date().toISOString(),
        anomalies: [],
        normalSensors: [],
        overallStatus: "normal",
        confidenceScore: 0,
      };
    }

    // Group readings by sensor
    const sensorGroups = equipment.sensorReadings.reduce(
      (groups, reading) => {
        const key = reading.sensorId;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(reading);
        return groups;
      },
      {} as Record<string, SensorReading[]>,
    );

    // Find equipment type-specific normal ranges
    const equipmentType = equipment.type.toLowerCase();
    let equipmentRanges = this.normalRanges["pump"]; // Default

    for (const type in this.normalRanges) {
      if (equipmentType.includes(type)) {
        equipmentRanges = this.normalRanges[type];
        break;
      }
    }

    // Check each sensor for anomalies
    for (const [sensorId, readings] of Object.entries(sensorGroups)) {
      // Sort readings by timestamp (most recent first)
      readings.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      // Get most recent reading
      const latestReading = readings[0];
      const sensorType = latestReading.sensorType.toLowerCase();

      // Determine normal range for this sensor type
      let normalRange = this.defaultNormalRanges[sensorType] || {
        min: 0,
        max: 100,
      };

      // If equipment-specific range exists, use it
      if (equipmentRanges && equipmentRanges[sensorType]) {
        normalRange = equipmentRanges[sensorType];
      }

      // Check if reading is outside normal range
      if (
        latestReading.value < normalRange.min ||
        latestReading.value > normalRange.max
      ) {
        // Determine severity
        let severity: "low" | "medium" | "high" | "critical" = "low";
        const minDiff = Math.max(0, normalRange.min - latestReading.value);
        const maxDiff = Math.max(0, latestReading.value - normalRange.max);
        const percentDeviation =
          Math.max(minDiff, maxDiff) / (normalRange.max - normalRange.min);

        if (percentDeviation > 0.5) {
          severity = "critical";
        } else if (percentDeviation > 0.3) {
          severity = "high";
        } else if (percentDeviation > 0.1) {
          severity = "medium";
        }

        // Generate possible causes
        const possibleCauses = this.generatePossibleCauses(
          sensorType,
          latestReading.value,
          normalRange,
        );

        // Add anomaly
        anomalies.push({
          sensorId,
          sensorType: latestReading.sensorType,
          timestamp: latestReading.timestamp,
          value: latestReading.value,
          expectedRange: normalRange,
          severity,
          description: `Abnormal ${sensorType} reading: ${latestReading.value} ${latestReading.unit}`,
          possibleCauses,
          recommendedActions: this.generateRecommendedActions(
            sensorType,
            severity,
            possibleCauses,
          ),
        });
      } else {
        normalSensors.push(sensorId);
      }
    }

    // Determine overall status
    let overallStatus: "normal" | "warning" | "critical" = "normal";
    if (anomalies.some((a) => a.severity === "critical")) {
      overallStatus = "critical";
    } else if (anomalies.some((a) => a.severity === "high")) {
      overallStatus = "warning";
    } else if (anomalies.length > 0) {
      overallStatus = "warning";
    }

    return {
      equipmentId: equipment.id,
      detectionDate: new Date().toISOString(),
      anomalies,
      normalSensors,
      overallStatus,
      confidenceScore: 0.85, // Rules-based anomaly detection has high confidence
    };
  }

  /**
   * Generate possible causes for anomalies
   */
  private generatePossibleCauses(
    sensorType: string,
    value: number,
    normalRange: { min: number; max: number },
  ): string[] {
    const causes: string[] = [];
    const isHigh = value > normalRange.max;
    const isLow = value < normalRange.min;

    switch (sensorType.toLowerCase()) {
      case "temperature":
        if (isHigh) {
          causes.push("Excessive friction in moving parts");
          causes.push("Inadequate cooling or ventilation");
          causes.push("Electrical overload");
          causes.push("Blocked cooling system");
        } else if (isLow) {
          causes.push("Cooling system over-performance");
          causes.push("Ambient temperature effects");
          causes.push("Sensor calibration error");
        }
        break;

      case "pressure":
        if (isHigh) {
          causes.push("Downstream blockage or restriction");
          causes.push("Valve misalignment or closure");
          causes.push("System overpressurization");
        } else if (isLow) {
          causes.push("Leakage in the system");
          causes.push("Pump cavitation");
          causes.push("Insufficient input pressure");
          causes.push("Worn seals or gaskets");
        }
        break;

      case "vibration":
        if (isHigh) {
          causes.push("Mechanical imbalance");
          causes.push("Misalignment of components");
          causes.push("Loose mounting or foundation issues");
          causes.push("Bearing wear or damage");
          causes.push("Resonance effects");
        }
        break;

      case "flow":
        if (isHigh) {
          causes.push("Control valve failure");
          causes.push("Upstream pressure increase");
          causes.push("Sensor calibration error");
        } else if (isLow) {
          causes.push("Partial blockage in pipework");
          causes.push("Pump performance degradation");
          causes.push("Filter clogging");
          causes.push("Valve not fully open");
        }
        break;

      case "current":
        if (isHigh) {
          causes.push("Mechanical overload or binding");
          causes.push("Short circuit in wiring");
          causes.push("Failing motor insulation");
          causes.push("Excessive load on equipment");
        } else if (isLow) {
          causes.push("Phase loss or imbalance");
          causes.push("Loose connections");
          causes.push("Under-voltage condition");
        }
        break;

      case "level":
        if (isHigh) {
          causes.push("Input flow exceeds output capability");
          causes.push("Outlet valve restriction");
          causes.push("Control system failure");
        } else if (isLow) {
          causes.push("Leakage from tank or vessel");
          causes.push("Insufficient supply");
          causes.push("Inlet valve restriction");
        }
        break;

      default:
        causes.push("Unusual operating conditions");
        causes.push("Possible sensor or calibration error");
        causes.push("Equipment wear or deterioration");
    }

    return causes;
  }

  /**
   * Generate recommended actions based on anomalies
   */
  private generateRecommendedActions(
    sensorType: string,
    severity: string,
    causes: string[],
  ): string[] {
    const actions: string[] = [];

    // Add generic actions based on severity
    if (severity === "critical") {
      actions.push("Immediately shut down equipment and investigate");
      actions.push("Contact maintenance supervisor");
    } else if (severity === "high") {
      actions.push("Schedule urgent inspection within 24 hours");
      actions.push("Monitor continuously for worsening conditions");
    } else {
      actions.push("Schedule inspection during next maintenance window");
      actions.push("Increase monitoring frequency");
    }

    // Add sensor-specific actions
    switch (sensorType.toLowerCase()) {
      case "temperature":
        actions.push("Check cooling system functionality");
        actions.push("Inspect for blockages in air/fluid flow paths");
        if (causes.some((c) => c.includes("friction"))) {
          actions.push("Inspect bearings and moving parts for wear");
          actions.push("Check lubrication levels and quality");
        }
        break;

      case "pressure":
        actions.push("Inspect system for leaks or blockages");
        actions.push("Verify valve positions and operation");
        if (causes.some((c) => c.includes("cavitation"))) {
          actions.push("Check suction conditions and inlet restrictions");
        }
        break;

      case "vibration":
        actions.push("Perform alignment check");
        actions.push("Inspect for loose fasteners or mounting");
        actions.push(
          "Consider vibration analysis to identify specific frequencies",
        );
        if (causes.some((c) => c.includes("bearing"))) {
          actions.push("Inspect and possibly replace bearings");
        }
        break;

      case "flow":
        actions.push("Inspect for blockages in pipework");
        actions.push("Check pump performance and inlet conditions");
        actions.push("Inspect and clean filters/strainers");
        break;

      case "current":
        actions.push("Check for loose electrical connections");
        actions.push("Inspect motor windings and insulation");
        actions.push("Verify power supply quality");
        if (causes.some((c) => c.includes("mechanical"))) {
          actions.push("Check for mechanical binding or excessive load");
        }
        break;
    }

    return actions;
  }

  /**
   * Enhance anomaly detection with AI
   */
  private async enhanceAnomalyDetectionWithAI(
    equipment: EquipmentData,
    baselineResult: AnomalyDetectionResult,
  ): Promise<AnomalyDetectionResult> {
    try {
      // If no anomalies found in baseline, no need for AI enhancement
      if (baselineResult.anomalies.length === 0) {
        return baselineResult;
      }

      // Extract sensor readings timeline for key analysis
      const timelineData: Record<string, any[]> = {};

      if (equipment.sensorReadings && equipment.sensorReadings.length > 0) {
        // Group by sensor type
        for (const reading of equipment.sensorReadings) {
          if (!timelineData[reading.sensorType]) {
            timelineData[reading.sensorType] = [];
          }

          timelineData[reading.sensorType].push({
            timestamp: reading.timestamp,
            value: reading.value,
            unit: reading.unit,
            status: reading.status,
          });
        }

        // Sort each group by timestamp
        for (const sensorType in timelineData) {
          timelineData[sensorType].sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          );

          // Keep only the last 10 readings for each sensor type
          if (timelineData[sensorType].length > 10) {
            timelineData[sensorType] = timelineData[sensorType].slice(-10);
          }
        }
      }

      const analysisPrompt = `Analyze this equipment anomaly detection data and enhance the results:
      
Equipment Data:
${JSON.stringify(
  {
    id: equipment.id,
    name: equipment.name,
    type: equipment.type,
    age: this.getEquipmentAge(equipment.installationDate),
    operatingHours: equipment.operatingHours,
    currentStatus: equipment.currentStatus,
  },
  null,
  2,
)}

Sensor Readings Timeline:
${JSON.stringify(timelineData, null, 2)}

Baseline Anomaly Detection:
${JSON.stringify(baselineResult, null, 2)}

Based on the equipment data and sensor readings timeline, enhance the anomaly detection results.
Look for:
1. Patterns or trends in sensor readings that may indicate developing issues
2. Correlations between different sensor anomalies that suggest a common cause
3. More specific and accurate possible causes based on the equipment type and reading patterns
4. Prioritized and actionable recommended actions

Provide an enhanced anomaly detection result with improved descriptions, causes, and recommended actions.

Format your response as a JSON object with the same structure as the baseline result:
{
  "equipmentId": "...",
  "detectionDate": "...",
  "anomalies": [
    {
      "sensorId": "...",
      "sensorType": "...",
      "timestamp": "...",
      "value": number,
      "expectedRange": { "min": number, "max": number },
      "severity": "low|medium|high|critical",
      "description": "detailed description",
      "possibleCauses": ["cause1", "cause2", ...],
      "recommendedActions": ["action1", "action2", ...]
    }
  ],
  "normalSensors": ["sensorId1", "sensorId2", ...],
  "overallStatus": "normal|warning|critical",
  "confidenceScore": number (0-1)
}`;

      const result = await aiService.analyzeDocument(analysisPrompt, {
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      try {
        const enhancedResult =
          typeof result.analysis === "string"
            ? JSON.parse(result.analysis)
            : result.analysis;

        // Validate the enhanced result
        if (enhancedResult && enhancedResult.equipmentId === equipment.id) {
          // Preserve original detection date
          enhancedResult.detectionDate = baselineResult.detectionDate;

          // Ensure confidence score is within range
          enhancedResult.confidenceScore = Math.max(
            0,
            Math.min(1, enhancedResult.confidenceScore),
          );

          return enhancedResult;
        }
      } catch (error) {
        console.error("Error parsing AI enhanced anomaly detection:", error);
      }

      // Return baseline if AI enhancement fails
      return baselineResult;
    } catch (error) {
      console.error("Error in AI anomaly detection enhancement:", error);
      return baselineResult;
    }
  }

  /**
   * Public method to predict maintenance needs for equipment
   */
  async predictMaintenance(
    equipment: EquipmentData,
  ): Promise<MaintenancePrediction> {
    // Generate baseline prediction using rules
    const baselinePrediction = this.predictMaintenanceRulesBased(equipment);

    // Enhance with AI if we have enough data
    if (
      equipment.maintenanceHistory.length > 0 ||
      (equipment.sensorReadings && equipment.sensorReadings.length > 0)
    ) {
      return this.enhancePredictionWithAI(equipment, baselinePrediction);
    }

    return baselinePrediction;
  }

  /**
   * Public method to detect anomalies in equipment sensor readings
   */
  async detectAnomalies(
    equipment: EquipmentData,
  ): Promise<AnomalyDetectionResult> {
    // Skip if no sensor readings
    if (!equipment.sensorReadings || equipment.sensorReadings.length === 0) {
      return {
        equipmentId: equipment.id,
        detectionDate: new Date().toISOString(),
        anomalies: [],
        normalSensors: [],
        overallStatus: "normal",
        confidenceScore: 0,
      };
    }

    // Generate baseline anomaly detection using rules
    const baselineResult = this.detectAnomaliesInReadings(equipment);

    // Enhance with AI if anomalies were found
    if (baselineResult.anomalies.length > 0) {
      return this.enhanceAnomalyDetectionWithAI(equipment, baselineResult);
    }

    return baselineResult;
  }

  /**
   * Batch process multiple equipment items
   */
  async batchProcessEquipment(equipmentList: EquipmentData[]): Promise<{
    maintenancePredictions: MaintenancePrediction[];
    anomalyDetections: AnomalyDetectionResult[];
    criticalEquipment: string[];
    summaryReport: string;
  }> {
    const maintenancePredictions: MaintenancePrediction[] = [];
    const anomalyDetections: AnomalyDetectionResult[] = [];
    const criticalEquipment: string[] = [];

    // Process each equipment
    for (const equipment of equipmentList) {
      const maintenancePrediction = await this.predictMaintenance(equipment);
      const anomalyDetection = await this.detectAnomalies(equipment);

      maintenancePredictions.push(maintenancePrediction);
      anomalyDetections.push(anomalyDetection);

      // Check if equipment is critical
      if (
        maintenancePrediction.failureProbability > 0.7 ||
        anomalyDetection.overallStatus === "critical" ||
        maintenancePrediction.healthIndex < 30
      ) {
        criticalEquipment.push(equipment.id);
      }
    }

    // Generate summary report
    const summaryReport = this.generateBatchSummaryReport(
      equipmentList,
      maintenancePredictions,
      anomalyDetections,
      criticalEquipment,
    );

    return {
      maintenancePredictions,
      anomalyDetections,
      criticalEquipment,
      summaryReport,
    };
  }

  /**
   * Generate a summary report for batch processing
   */
  private generateBatchSummaryReport(
    equipmentList: EquipmentData[],
    maintenancePredictions: MaintenancePrediction[],
    anomalyDetections: AnomalyDetectionResult[],
    criticalEquipment: string[],
  ): string {
    // Total equipment count
    const totalEquipment = equipmentList.length;

    // Equipment needing maintenance within 30 days
    const urgentMaintenance = maintenancePredictions.filter(
      (p) => p.daysUntilNextMaintenance <= 30,
    ).length;

    // Equipment with anomalies
    const withAnomalies = anomalyDetections.filter(
      (a) => a.anomalies.length > 0,
    ).length;

    // Average health index
    const avgHealthIndex =
      maintenancePredictions.reduce((sum, p) => sum + p.healthIndex, 0) /
      totalEquipment;

    // Generate the report
    return `Maintenance Planning Summary:
Total Equipment: ${totalEquipment}
Critical Equipment: ${criticalEquipment.length} (${((criticalEquipment.length / totalEquipment) * 100).toFixed(1)}%)
Equipment Needing Maintenance within 30 Days: ${urgentMaintenance} (${((urgentMaintenance / totalEquipment) * 100).toFixed(1)}%)
Equipment with Anomalies: ${withAnomalies} (${((withAnomalies / totalEquipment) * 100).toFixed(1)}%)
Average Health Index: ${avgHealthIndex.toFixed(1)}/100

CRITICAL EQUIPMENT REQUIRING IMMEDIATE ATTENTION:
${criticalEquipment
  .map((id) => {
    const equipment = equipmentList.find((e) => e.id === id);
    return `- ${equipment?.name || id} (${equipment?.type || "Unknown Type"})`;
  })
  .join("\n")}`;
  }
}

// Export singleton instance
export const predictiveMaintenanceService = new PredictiveMaintenanceService();
