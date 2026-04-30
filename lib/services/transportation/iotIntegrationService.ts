/**
 * Transportation IoT Integration Service
 *
 * Integrates transportation shipments with IoT sensors
 * Two integration options:
 * 1. Direct integration with market leaders (certified by authorities)
 * 2. Government authority integration (ELM/Rabet.sa for Saudi Arabia)
 *
 * Vision 2040 aligned - Industry standards and government compliance
 */

import type { Shipment, TrackingEvent } from "@/types/tms";
import { AdvancedIoTManager } from "@/lib/services/iot/iotManager";
import { elmRabetAdapter } from "@/lib/adapters/government/elmRabetAdapter";
import type { IoTDevice, IoTAlert } from "@/types/iot";
import { eventBus } from "@/lib/services/event-store";

export interface TransportationIoTConfig {
  integrationType: "DIRECT" | "GOVERNMENT" | "BOTH";
  directProviders?: {
    provider: string; // 'SENSORNET', 'TELEMATICS_PRO', etc.
    apiKey: string;
    apiUrl: string;
    certified: boolean;
    authority?: string; // Certifying authority
  }[];
  governmentIntegration?: {
    country: string;
    provider: "ELM" | "RABET" | "OTHER";
    config: any;
  };
}

export interface TransportationSensorData {
  shipmentId: string;
  deviceId: string;
  timestamp: Date | string;
  location: {
    lat: number;
    lng: number;
    address: string;
    accuracy: number; // meters
  };
  sensors: {
    temperature?: number; // Celsius
    humidity?: number; // %
    shock?: number; // g-force
    vibration?: number;
    doorOpen?: boolean;
    light?: boolean;
    pressure?: number; // PSI or bar
    tilt?: number; // degrees
    battery?: number; // %
    signal?: number; // dBm
  };
  vehicle?: {
    speed?: number; // km/h
    engineOn?: boolean;
    fuelLevel?: number; // %
    tirePressure?: {
      frontLeft?: number;
      frontRight?: number;
      rearLeft?: number;
      rearRight?: number;
    };
  };
  compliance?: {
    hoursOfService?: number;
    driverId?: string;
    driverName?: string;
  };
  source: "DIRECT" | "GOVERNMENT" | "BOTH";
}

export interface TransportationIoTAlert {
  shipmentId: string;
  alertType:
    | "TEMPERATURE_DEVIATION"
    | "SHOCK_DETECTED"
    | "DOOR_OPENED"
    | "LOCATION_DEVIATION"
    | "COMPLIANCE_VIOLATION"
    | "DEVICE_OFFLINE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  sensorData: TransportationSensorData;
  recommendedAction?: string;
  timestamp: Date | string;
}

export class TransportationIoTIntegrationService {
  private iotManager: AdvancedIoTManager;
  private config: TransportationIoTConfig | null = null;
  private sensorDataCache: Map<string, TransportationSensorData[]> = new Map();
  private alerts: Map<string, TransportationIoTAlert[]> = new Map();

  constructor() {
    this.iotManager = new AdvancedIoTManager();
  }

  /**
   * Initialize IoT integration
   */
  initialize(config: TransportationIoTConfig): void {
    this.config = config;

    // Initialize government integration if configured
    if (config.governmentIntegration) {
      if (
        config.governmentIntegration.provider === "ELM" ||
        config.governmentIntegration.provider === "RABET"
      ) {
        elmRabetAdapter.initialize(config.governmentIntegration.config);
      }
    }

    // Set up IoT device monitoring
    this.setupDeviceMonitoring();
  }

  /**
   * Get real-time sensor data for shipment
   */
  async getSensorData(
    shipmentId: string,
  ): Promise<TransportationSensorData | null> {
    // Try government integration first (if configured)
    if (this.config?.governmentIntegration) {
      const govData = await this.getGovernmentSensorData(shipmentId);
      if (govData) return govData;
    }

    // Try direct integration
    if (
      this.config?.directProviders &&
      this.config.directProviders.length > 0
    ) {
      const directData = await this.getDirectSensorData(shipmentId);
      if (directData) return directData;
    }

    // Try IoT Manager (registered devices)
    const iotData = await this.getIoTManagerData(shipmentId);
    if (iotData) return iotData;

    return null;
  }

  /**
   * Get historical sensor data
   */
  async getHistoricalSensorData(
    shipmentId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TransportationSensorData[]> {
    // Check cache first
    const cached = this.sensorDataCache.get(shipmentId) || [];
    const filtered = cached.filter(
      (d) =>
        new Date(d.timestamp) >= timeRange.from &&
        new Date(d.timestamp) <= timeRange.to,
    );

    if (filtered.length > 0) {
      return filtered;
    }

    // Fetch from sources
    const data: TransportationSensorData[] = [];

    // Government integration
    if (this.config?.governmentIntegration) {
      const govData = await this.getGovernmentHistoricalData(
        shipmentId,
        timeRange,
      );
      data.push(...govData);
    }

    // Direct integration
    if (this.config?.directProviders) {
      const directData = await this.getDirectHistoricalData(
        shipmentId,
        timeRange,
      );
      data.push(...directData);
    }

    // IoT Manager
    const iotData = await this.getIoTManagerHistoricalData(
      shipmentId,
      timeRange,
    );
    data.push(...iotData);

    // Cache data
    this.sensorDataCache.set(shipmentId, data);

    return data.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }

  /**
   * Monitor shipment with IoT sensors
   */
  async monitorShipment(shipment: Shipment): Promise<void> {
    // Register shipment with IoT manager
    const deviceId = await this.registerShipmentDevice(shipment);

    // Set up real-time monitoring
    await this.setupRealTimeMonitoring(shipment.id, deviceId);

    // Set up alerts
    await this.setupAlerts(shipment);

    // Publish event
    await eventBus.publish("transportation.iot.monitoring.started", {
      shipmentId: shipment.id,
      deviceId,
    });
  }

  /**
   * Get alerts for shipment
   */
  async getAlerts(shipmentId: string): Promise<TransportationIoTAlert[]> {
    return this.alerts.get(shipmentId) || [];
  }

  /**
   * Check for compliance violations
   */
  async checkCompliance(shipmentId: string): Promise<{
    compliant: boolean;
    violations: string[];
    details: any;
  }> {
    // Get sensor data
    const sensorData = await this.getSensorData(shipmentId);
    if (!sensorData) {
      return {
        compliant: true,
        violations: [],
        details: {},
      };
    }

    const violations: string[] = [];

    // Check temperature (if required)
    if (sensorData.sensors.temperature !== undefined) {
      // In production, check against shipment requirements
      // For now, check basic thresholds
      if (
        sensorData.sensors.temperature < -10 ||
        sensorData.sensors.temperature > 50
      ) {
        violations.push("Temperature out of acceptable range");
      }
    }

    // Check hours of service (if available)
    if (sensorData.compliance?.hoursOfService !== undefined) {
      if (sensorData.compliance.hoursOfService > 11) {
        violations.push("Hours of service exceeded");
      }
    }

    // Check shock/vibration
    if (sensorData.sensors.shock && sensorData.sensors.shock > 5) {
      violations.push("Excessive shock detected - possible damage");
    }

    return {
      compliant: violations.length === 0,
      violations,
      details: sensorData,
    };
  }

  /**
   * Get government sensor data (ELM/Rabet.sa)
   */
  private async getGovernmentSensorData(
    shipmentId: string,
  ): Promise<TransportationSensorData | null> {
    if (!this.config?.governmentIntegration) return null;

    try {
      // Get truck ID from shipment
      const truckId = await this.getTruckIdFromShipment(shipmentId);
      if (!truckId) return null;

      // Get truck data from ELM/Rabet
      const truckData = await elmRabetAdapter.getTruckData(truckId);
      if (!truckData.success || !truckData.data) return null;

      // Convert to sensor data format
      return {
        shipmentId,
        deviceId: `gov-${truckId}`,
        timestamp: truckData.data.currentLocation.timestamp,
        location: {
          lat: truckData.data.currentLocation.lat,
          lng: truckData.data.currentLocation.lng,
          address: truckData.data.currentLocation.address,
          accuracy: truckData.data.sensors.gpsAccuracy || 10,
        },
        sensors: {
          temperature: truckData.data.sensors.temperature,
          humidity: truckData.data.sensors.humidity,
          shock: truckData.data.sensors.shock,
          doorOpen: truckData.data.sensors.doorOpen,
        },
        vehicle: {
          speed: truckData.data.sensors.speed,
          engineOn: truckData.data.sensors.engineOn,
          fuelLevel: truckData.data.sensors.fuelLevel,
          tirePressure: truckData.data.sensors.tirePressure,
        },
        compliance: {
          hoursOfService: truckData.data.compliance.hoursOfService?.driving,
          driverId: truckData.data.driverId,
          driverName: truckData.data.driverName,
        },
        source: "GOVERNMENT",
      };
    } catch (error) {
      console.error("Error getting government sensor data:", error);
      return null;
    }
  }

  /**
   * Get direct provider sensor data
   */
  private async getDirectSensorData(
    shipmentId: string,
  ): Promise<TransportationSensorData | null> {
    if (
      !this.config?.directProviders ||
      this.config.directProviders.length === 0
    ) {
      return null;
    }

    // Try each provider
    for (const provider of this.config.directProviders) {
      try {
        const data = await this.callDirectProviderAPI(provider, shipmentId);
        if (data) {
          return {
            ...data,
            source: "DIRECT",
          };
        }
      } catch (error) {
        console.error(`Error getting data from ${provider.provider}:`, error);
      }
    }

    return null;
  }

  /**
   * Get IoT Manager data
   */
  private async getIoTManagerData(
    shipmentId: string,
  ): Promise<TransportationSensorData | null> {
    try {
      // Find device associated with shipment
      const devices = await this.iotManager.getDevices({
        category: "TRANSPORTATION",
      });

      const shipmentDevice = devices.find(
        (d) => d.metadata?.shipmentId === shipmentId,
      );

      if (!shipmentDevice) return null;

      // Get latest data from device
      const deviceData = await this.iotManager.getDeviceData(shipmentDevice.id);
      if (!deviceData || deviceData.length === 0) return null;

      const latestData = deviceData[deviceData.length - 1];

      return {
        shipmentId,
        deviceId: shipmentDevice.id,
        timestamp: latestData.timestamp,
        location: {
          lat: latestData.location?.lat || 0,
          lng: latestData.location?.lng || 0,
          address: latestData.location?.address || "",
          accuracy: latestData.location?.accuracy || 10,
        },
        sensors: {
          temperature: latestData.sensors?.temperature,
          humidity: latestData.sensors?.humidity,
          shock: latestData.sensors?.shock,
          vibration: latestData.sensors?.vibration,
          doorOpen: latestData.sensors?.doorOpen,
          light: latestData.sensors?.light,
          pressure: latestData.sensors?.pressure,
          tilt: latestData.sensors?.tilt,
          battery: latestData.sensors?.battery,
          signal: latestData.sensors?.signal,
        },
        source: "DIRECT",
      };
    } catch (error) {
      console.error("Error getting IoT Manager data:", error);
      return null;
    }
  }

  /**
   * Register shipment device with IoT Manager
   */
  private async registerShipmentDevice(shipment: Shipment): Promise<string> {
    const device = await this.iotManager.registerDevice({
      name: `Shipment ${shipment.shipmentNumber}`,
      type: "SENSOR",
      category: "TRANSPORTATION",
      connectivity: {
        protocol: "GPS",
        network: "CELLULAR",
      },
      capabilities: {
        sensors: ["GPS", "TEMPERATURE", "HUMIDITY", "SHOCK"],
        edgeProcessing: false,
      },
      metadata: {
        shipmentId: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        mode: shipment.mode,
        type: shipment.type,
      },
      tenantId: shipment.tenantId,
    });

    return device;
  }

  /**
   * Set up real-time monitoring
   */
  private async setupRealTimeMonitoring(
    shipmentId: string,
    deviceId: string,
  ): Promise<void> {
    // Set up polling or WebSocket connection
    // In production, use WebSocket for real-time updates
    setInterval(async () => {
      const sensorData = await this.getSensorData(shipmentId);
      if (sensorData) {
        // Cache data
        const cached = this.sensorDataCache.get(shipmentId) || [];
        cached.push(sensorData);
        // Keep only last 1000 readings
        if (cached.length > 1000) {
          cached.shift();
        }
        this.sensorDataCache.set(shipmentId, cached);

        // Check for alerts
        await this.checkAlerts(shipmentId, sensorData);

        // Publish event
        await eventBus.publish("transportation.iot.data.received", {
          shipmentId,
          deviceId,
          timestamp: sensorData.timestamp,
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Set up alerts
   */
  private async setupAlerts(shipment: Shipment): Promise<void> {
    // Set up alert rules based on shipment requirements
    // Temperature alerts
    if (shipment.temperatureControl?.required) {
      // Alert if temperature goes out of range
    }

    // Shock alerts
    // Alert if excessive shock detected

    // Location alerts
    // Alert if route deviation
  }

  /**
   * Check for alerts
   */
  private async checkAlerts(
    shipmentId: string,
    sensorData: TransportationSensorData,
  ): Promise<void> {
    const alerts: TransportationIoTAlert[] = [];

    // Temperature deviation
    if (sensorData.sensors.temperature !== undefined) {
      // Check against shipment requirements
      // For now, use basic thresholds
      if (
        sensorData.sensors.temperature < -10 ||
        sensorData.sensors.temperature > 50
      ) {
        alerts.push({
          shipmentId,
          alertType: "TEMPERATURE_DEVIATION",
          severity:
            sensorData.sensors.temperature < -5 ||
            sensorData.sensors.temperature > 45
              ? "CRITICAL"
              : "HIGH",
          message: `Temperature deviation: ${sensorData.sensors.temperature}°C`,
          sensorData,
          recommendedAction:
            "Check cargo condition and adjust temperature control",
          timestamp: sensorData.timestamp,
        });
      }
    }

    // Shock detection
    if (sensorData.sensors.shock && sensorData.sensors.shock > 5) {
      alerts.push({
        shipmentId,
        alertType: "SHOCK_DETECTED",
        severity: sensorData.sensors.shock > 10 ? "CRITICAL" : "MEDIUM",
        message: `Excessive shock detected: ${sensorData.sensors.shock}g`,
        sensorData,
        recommendedAction: "Inspect cargo for damage",
        timestamp: sensorData.timestamp,
      });
    }

    // Door opened
    if (sensorData.sensors.doorOpen) {
      alerts.push({
        shipmentId,
        alertType: "DOOR_OPENED",
        severity: "MEDIUM",
        message: "Cargo door opened",
        sensorData,
        recommendedAction: "Verify authorized access",
        timestamp: sensorData.timestamp,
      });
    }

    // Store alerts
    const existingAlerts = this.alerts.get(shipmentId) || [];
    existingAlerts.push(...alerts);
    this.alerts.set(shipmentId, existingAlerts);

    // Publish alert events
    for (const alert of alerts) {
      await eventBus.publish("transportation.iot.alert", alert);
    }
  }

  /**
   * Set up device monitoring
   */
  private setupDeviceMonitoring(): void {
    // Listen to IoT Manager events
    this.iotManager.on("deviceAlert", async (alert: IoTAlert) => {
      // Handle device alerts
      if (alert.deviceId && alert.deviceId.startsWith("shipment-")) {
        const shipmentId = alert.metadata?.shipmentId;
        if (shipmentId) {
          await eventBus.publish("transportation.iot.device.alert", {
            shipmentId,
            alert,
          });
        }
      }
    });
  }

  /**
   * Get truck ID from shipment
   */
  private async getTruckIdFromShipment(
    shipmentId: string,
  ): Promise<string | null> {
    // In production, query database
    // For now, return null
    return null;
  }

  /**
   * Call direct provider API
   */
  private async callDirectProviderAPI(
    provider: NonNullable<TransportationIoTConfig["directProviders"]>[0],
    shipmentId: string,
  ): Promise<TransportationSensorData | null> {
    // In production, call provider API
    // For now, return null
    return null;
  }

  /**
   * Get government historical data
   */
  private async getGovernmentHistoricalData(
    shipmentId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TransportationSensorData[]> {
    const truckId = await this.getTruckIdFromShipment(shipmentId);
    if (!truckId) return [];

    const sensorData = await elmRabetAdapter.getSensorData(truckId, timeRange);
    if (!sensorData) return [];

    // Convert to TransportationSensorData format
    const data: TransportationSensorData[] = [];

    if (sensorData.location) {
      for (const loc of sensorData.location) {
        data.push({
          shipmentId,
          deviceId: `gov-${truckId}`,
          timestamp: loc.timestamp,
          location: {
            lat: loc.lat,
            lng: loc.lng,
            address: "",
            accuracy: 10,
          },
          sensors: {
            temperature: sensorData.temperature?.find(
              (t) =>
                Math.abs(
                  new Date(t.timestamp).getTime() -
                    new Date(loc.timestamp).getTime(),
                ) < 60000,
            )?.value,
            humidity: sensorData.humidity?.find(
              (h) =>
                Math.abs(
                  new Date(h.timestamp).getTime() -
                    new Date(loc.timestamp).getTime(),
                ) < 60000,
            )?.value,
          },
          source: "GOVERNMENT",
        });
      }
    }

    return data;
  }

  /**
   * Get direct historical data
   */
  private async getDirectHistoricalData(
    shipmentId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TransportationSensorData[]> {
    // In production, call provider APIs
    return [];
  }

  /**
   * Get IoT Manager historical data
   */
  private async getIoTManagerHistoricalData(
    shipmentId: string,
    timeRange: { from: Date; to: Date },
  ): Promise<TransportationSensorData[]> {
    try {
      const devices = await this.iotManager.getDevices({
        category: "TRANSPORTATION",
      });

      const shipmentDevice = devices.find(
        (d) => d.metadata?.shipmentId === shipmentId,
      );
      if (!shipmentDevice) return [];

      const deviceData = await this.iotManager.getDeviceData(shipmentDevice.id);
      if (!deviceData) return [];

      return deviceData
        .filter((d) => {
          const timestamp = new Date(d.timestamp);
          return timestamp >= timeRange.from && timestamp <= timeRange.to;
        })
        .map((d) => ({
          shipmentId,
          deviceId: shipmentDevice.id,
          timestamp: d.timestamp,
          location: {
            lat: d.location?.lat || 0,
            lng: d.location?.lng || 0,
            address: d.location?.address || "",
            accuracy: d.location?.accuracy || 10,
          },
          sensors: d.sensors,
          source: "DIRECT" as const,
        }));
    } catch (error) {
      console.error("Error getting IoT Manager historical data:", error);
      return [];
    }
  }
}

export const transportationIoTIntegrationService =
  new TransportationIoTIntegrationService();
