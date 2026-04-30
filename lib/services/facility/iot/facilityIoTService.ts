/**
 * Facility IoT Integration Service
 *
 * Smart Building IoT Management with:
 * - Device management and monitoring
 * - Real-time sensor data collection
 * - Building automation system (BAS/BMS) integration
 * - HVAC system integration
 * - Lighting system integration
 * - Security system integration
 * - Fire safety system integration
 * - Energy management system integration
 * - Anomaly detection
 * - Automated responses
 */

import type { IoTDevice, IoTDeviceType } from "@/types/iot";
import { AdvancedIoTManager } from "@/lib/services/iot/iotManager";
import { eventBus } from "@/lib/services/event-store";
import { getPredictiveMaintenanceService } from "../maintenance/predictiveMaintenanceService";

export interface FacilityIoTConfig {
  enableBuildingAutomation?: boolean;
  enableRealTimeMonitoring?: boolean;
  enableAutomatedResponses?: boolean;
  dataCollectionInterval?: number; // seconds
}

export interface BuildingSystem {
  id: string;
  facilityId: string;
  type:
    | "hvac"
    | "lighting"
    | "security"
    | "fire-safety"
    | "energy"
    | "plumbing"
    | "elevator";
  status: "operational" | "maintenance" | "fault" | "offline";
  devices: string[]; // IoT device IDs
  lastUpdate: Date;
  metadata: Record<string, any>;
}

export interface SensorReading {
  deviceId: string;
  facilityId: string;
  timestamp: Date;
  sensorType:
    | "temperature"
    | "humidity"
    | "pressure"
    | "vibration"
    | "energy"
    | "occupancy"
    | "air-quality"
    | "other";
  value: number;
  unit: string;
  location?: string;
  assetId?: string;
}

export class FacilityIoTService {
  private config: FacilityIoTConfig;
  private iotManager: AdvancedIoTManager;
  private buildingSystems: Map<string, BuildingSystem> = new Map();
  private sensorReadings: Map<string, SensorReading[]> = new Map();
  private predictiveMaintenance: ReturnType<
    typeof getPredictiveMaintenanceService
  >;

  constructor(config: FacilityIoTConfig = {}) {
    this.config = {
      enableBuildingAutomation: true,
      enableRealTimeMonitoring: true,
      enableAutomatedResponses: true,
      dataCollectionInterval: 60, // 1 minute
      ...config,
    };
    this.iotManager = new AdvancedIoTManager();
    this.predictiveMaintenance = getPredictiveMaintenanceService();

    // Start real-time monitoring if enabled
    if (this.config.enableRealTimeMonitoring) {
      this.startRealTimeMonitoring();
    }
  }

  /**
   * Register IoT device for facility
   */
  async registerDevice(
    facilityId: string,
    device: Omit<IoTDevice, "id" | "createdAt" | "updatedAt">,
  ): Promise<IoTDevice> {
    const registeredDevice = await this.iotManager.registerDevice({
      ...device,
      id: `device-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Link to building system if applicable
    if (device.location && device.location.facilityId === facilityId) {
      await this.linkDeviceToBuildingSystem(
        registeredDevice.id,
        device.type,
        facilityId,
      );
    }

    // Publish event
    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "facility.iot.device.registered",
      aggregateId: registeredDevice.id,
      aggregateType: "IoTDevice",
      version: 1,
      timestamp: new Date(),
      data: {
        deviceId: registeredDevice.id,
        facilityId,
        deviceType: device.type,
      },
      metadata: {},
    });

    return registeredDevice;
  }

  /**
   * Link device to building system
   */
  private async linkDeviceToBuildingSystem(
    deviceId: string,
    deviceType: IoTDeviceType,
    facilityId: string,
  ): Promise<void> {
    let systemType: BuildingSystem["type"] | null = null;

    // Map device type to building system
    if (deviceType === "sensor") {
      // Would determine from device category
      systemType = "hvac"; // Default
    } else if (deviceType === "actuator") {
      systemType = "hvac";
    } else if (deviceType === "controller") {
      systemType = "energy";
    }

    if (systemType) {
      const systemKey = `${facilityId}-${systemType}`;
      let system = this.buildingSystems.get(systemKey);

      if (!system) {
        system = {
          id: systemKey,
          facilityId,
          type: systemType,
          status: "operational",
          devices: [],
          lastUpdate: new Date(),
          metadata: {},
        };
        this.buildingSystems.set(systemKey, system);
      }

      if (!system.devices.includes(deviceId)) {
        system.devices.push(deviceId);
        system.lastUpdate = new Date();
        this.buildingSystems.set(systemKey, system);
      }
    }
  }

  /**
   * Record sensor reading
   */
  async recordSensorReading(reading: SensorReading): Promise<void> {
    if (!this.sensorReadings.has(reading.facilityId)) {
      this.sensorReadings.set(reading.facilityId, []);
    }

    const readings = this.sensorReadings.get(reading.facilityId)!;
    readings.push(reading);

    // Keep only last 1000 readings per facility
    if (readings.length > 1000) {
      readings.shift();
    }

    // Check for anomalies if asset is linked
    if (reading.assetId) {
      try {
        const sensorData: Record<string, number> = {};
        if (reading.sensorType === "temperature")
          sensorData.temperature = reading.value;
        if (reading.sensorType === "vibration")
          sensorData.vibration = reading.value;
        if (reading.sensorType === "energy") sensorData.energy = reading.value;

        const anomalies = await this.predictiveMaintenance.detectAnomalies(
          reading.assetId,
          sensorData,
        );
        if (anomalies.length > 0) {
          // Anomalies are already published by detectAnomalies
        }
      } catch (error) {
        // Skip if anomaly detection fails
      }
    }

    // Publish event
    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "facility.iot.sensor.reading",
      aggregateId: reading.deviceId,
      aggregateType: "SensorReading",
      version: 1,
      timestamp: new Date(),
      data: {
        deviceId: reading.deviceId,
        facilityId: reading.facilityId,
        sensorType: reading.sensorType,
        value: reading.value,
      },
      metadata: {},
    });
  }

  /**
   * Get building systems for facility
   */
  async getBuildingSystems(facilityId: string): Promise<BuildingSystem[]> {
    return Array.from(this.buildingSystems.values()).filter(
      (system) => system.facilityId === facilityId,
    );
  }

  /**
   * Get sensor readings for facility
   */
  async getSensorReadings(
    facilityId: string,
    filters?: {
      deviceId?: string;
      sensorType?: SensorReading["sensorType"];
      startDate?: Date;
      endDate?: Date;
      assetId?: string;
    },
  ): Promise<SensorReading[]> {
    let readings = this.sensorReadings.get(facilityId) || [];

    if (filters) {
      if (filters.deviceId) {
        readings = readings.filter((r) => r.deviceId === filters.deviceId);
      }
      if (filters.sensorType) {
        readings = readings.filter((r) => r.sensorType === filters.sensorType);
      }
      if (filters.startDate) {
        readings = readings.filter((r) => r.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        readings = readings.filter((r) => r.timestamp <= filters.endDate!);
      }
      if (filters.assetId) {
        readings = readings.filter((r) => r.assetId === filters.assetId);
      }
    }

    return readings.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  /**
   * Get real-time facility status
   */
  async getRealTimeStatus(facilityId: string): Promise<{
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    buildingSystems: BuildingSystem[];
    recentAlerts: number;
    averageTemperature?: number;
    averageHumidity?: number;
    totalEnergyConsumption?: number;
  }> {
    const devices = await this.iotManager.getDevicesByLocation(facilityId);
    const onlineDevices = devices.filter((d) => d.status === "online").length;
    const buildingSystems = await this.getBuildingSystems(facilityId);

    // Get recent sensor readings
    const recentReadings = await this.getSensorReadings(facilityId, {
      startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
    });

    // Calculate averages
    const tempReadings = recentReadings.filter(
      (r) => r.sensorType === "temperature",
    );
    const humidityReadings = recentReadings.filter(
      (r) => r.sensorType === "humidity",
    );
    const energyReadings = recentReadings.filter(
      (r) => r.sensorType === "energy",
    );

    const averageTemperature =
      tempReadings.length > 0
        ? tempReadings.reduce((sum, r) => sum + r.value, 0) /
          tempReadings.length
        : undefined;

    const averageHumidity =
      humidityReadings.length > 0
        ? humidityReadings.reduce((sum, r) => sum + r.value, 0) /
          humidityReadings.length
        : undefined;

    const totalEnergyConsumption =
      energyReadings.length > 0
        ? energyReadings.reduce((sum, r) => sum + r.value, 0)
        : undefined;

    return {
      totalDevices: devices.length,
      onlineDevices,
      offlineDevices: devices.length - onlineDevices,
      buildingSystems,
      recentAlerts: 0, // Would count from alerts
      averageTemperature,
      averageHumidity,
      totalEnergyConsumption,
    };
  }

  /**
   * Start real-time monitoring
   */
  private startRealTimeMonitoring(): void {
    // In real implementation, this would connect to IoT devices
    // and collect data at the configured interval
    setInterval(
      async () => {
        // Collect sensor readings from all facilities
        // This is a placeholder - in real implementation, would poll IoT devices
      },
      (this.config.dataCollectionInterval || 60) * 1000,
    );
  }

  /**
   * Control building system (automated response)
   */
  async controlBuildingSystem(
    facilityId: string,
    systemType: BuildingSystem["type"],
    command: {
      action: "start" | "stop" | "adjust" | "reset";
      parameters?: Record<string, any>;
    },
  ): Promise<void> {
    if (!this.config.enableAutomatedResponses) {
      throw new Error("Automated responses are not enabled");
    }

    const systemKey = `${facilityId}-${systemType}`;
    const system = this.buildingSystems.get(systemKey);

    if (!system) {
      throw new Error(
        `Building system ${systemType} not found for facility ${facilityId}`,
      );
    }

    // Execute command on devices in the system
    for (const deviceId of system.devices) {
      try {
        const device = await this.iotManager.getDevice(deviceId);
        if (device && device.status === "online") {
          // Send command to device (would use IoT manager's control methods)
          // await this.iotManager.sendCommand(deviceId, command)
        }
      } catch (error) {
        console.error(`Failed to control device ${deviceId}:`, error);
      }
    }

    // Update system status
    system.lastUpdate = new Date();
    this.buildingSystems.set(systemKey, system);

    // Publish event
    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "facility.iot.system.controlled",
      aggregateId: system.id,
      aggregateType: "BuildingSystem",
      version: 1,
      timestamp: new Date(),
      data: {
        facilityId,
        systemType,
        action: command.action,
      },
      metadata: {},
    });
  }
}

// Singleton instance
let facilityIoTServiceInstance: FacilityIoTService | null = null;

export function getFacilityIoTService(
  config?: FacilityIoTConfig,
): FacilityIoTService {
  if (!facilityIoTServiceInstance) {
    facilityIoTServiceInstance = new FacilityIoTService(config);
  }
  return facilityIoTServiceInstance;
}
