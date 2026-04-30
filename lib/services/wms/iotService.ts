/**
 * IoT Service for WMS
 * Device management, sensor data collection, edge computing
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// IOT TYPES
// ============================================================================

export interface IoTDevice {
  id: string;
  deviceId: string;
  name: string;
  type: "SENSOR" | "SCANNER" | "GATEWAY" | "EDGE_COMPUTER" | "OTHER";
  sensorType?:
    | "TEMPERATURE"
    | "HUMIDITY"
    | "PRESSURE"
    | "MOTION"
    | "WEIGHT"
    | "RFID"
    | "BARCODE"
    | "OTHER";
  locationId: string;
  warehouseId: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "ERROR";
  lastSeen?: Date | string;
  batteryLevel?: number; // 0-100
  firmwareVersion?: string;
  configuration?: Record<string, any>;
  metadata?: {
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    installedDate?: Date | string;
  };
}

export interface SensorReading {
  id: string;
  deviceId: string;
  sensorType: string;
  value: number;
  unit: string;
  locationId: string;
  timestamp: Date | string;
  quality?: "GOOD" | "WARNING" | "ERROR";
  metadata?: Record<string, any>;
}

export interface EnvironmentalMonitoring {
  locationId: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  lightLevel?: number;
  airQuality?: number;
  timestamp: Date | string;
  alerts?: Array<{
    type: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    message: string;
  }>;
}

export interface EdgeComputingTask {
  id: string;
  deviceId: string;
  taskType:
    | "DATA_PROCESSING"
    | "ANALYTICS"
    | "DECISION_MAKING"
    | "ALERT_GENERATION";
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  input: Record<string, any>;
  output?: Record<string, any>;
  startedAt?: Date | string;
  completedAt?: Date | string;
  error?: string;
}

// ============================================================================
// IOT SERVICE INTERFACE
// ============================================================================

export interface IoTService {
  // Device Management
  registerDevice(device: Partial<IoTDevice>): Promise<IoTDevice>;
  getDevice(deviceId: string): Promise<IoTDevice | null>;
  getDevicesByLocation(locationId: string): Promise<IoTDevice[]>;
  getDevicesByWarehouse(warehouseId: string): Promise<IoTDevice[]>;
  updateDevice(
    deviceId: string,
    updates: Partial<IoTDevice>,
  ): Promise<IoTDevice>;
  deleteDevice(deviceId: string): Promise<void>;

  // Sensor Data
  recordSensorReading(reading: Partial<SensorReading>): Promise<SensorReading>;
  getSensorReadings(
    deviceId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<SensorReading[]>;
  getLatestReading(deviceId: string): Promise<SensorReading | null>;

  // Environmental Monitoring
  getEnvironmentalMonitoring(
    locationId: string,
  ): Promise<EnvironmentalMonitoring>;
  monitorEnvironment(
    locationId: string,
    duration?: number,
  ): Promise<EnvironmentalMonitoring[]>;

  // Edge Computing
  submitEdgeTask(task: Partial<EdgeComputingTask>): Promise<EdgeComputingTask>;
  getEdgeTask(taskId: string): Promise<EdgeComputingTask | null>;
  getEdgeTasks(deviceId: string): Promise<EdgeComputingTask[]>;

  // Alerts
  checkAlerts(
    locationId: string,
  ): Promise<Array<{ type: string; severity: string; message: string }>>;
}

// ============================================================================
// IOT SERVICE IMPLEMENTATION
// ============================================================================

class IoTServiceImpl implements IoTService {
  private devices: Map<string, IoTDevice> = new Map();
  private readings: Map<string, SensorReading> = new Map();
  private edgeTasks: Map<string, EdgeComputingTask> = new Map();

  async registerDevice(device: Partial<IoTDevice>): Promise<IoTDevice> {
    const deviceRecord: IoTDevice = {
      id: `iot-device-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      deviceId: device.deviceId || `DEV-${Date.now()}`,
      name: device.name || "Unnamed Device",
      type: device.type || "SENSOR",
      sensorType: device.sensorType,
      locationId: device.locationId || "",
      warehouseId: device.warehouseId || "",
      status: device.status || "ACTIVE",
      lastSeen: new Date().toISOString(),
      batteryLevel: device.batteryLevel,
      firmwareVersion: device.firmwareVersion,
      configuration: device.configuration,
      metadata: device.metadata,
    };

    this.devices.set(deviceRecord.deviceId, deviceRecord);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "iot.device_registered",
      aggregateId: deviceRecord.id,
      aggregateType: "IOT_DEVICE",
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        deviceId: deviceRecord.deviceId,
        type: deviceRecord.type,
      },
      payload: {
        device: deviceRecord,
      },
    });

    return deviceRecord;
  }

  async getDevice(deviceId: string): Promise<IoTDevice | null> {
    return this.devices.get(deviceId) || null;
  }

  async getDevicesByLocation(locationId: string): Promise<IoTDevice[]> {
    return Array.from(this.devices.values()).filter(
      (d) => d.locationId === locationId,
    );
  }

  async getDevicesByWarehouse(warehouseId: string): Promise<IoTDevice[]> {
    return Array.from(this.devices.values()).filter(
      (d) => d.warehouseId === warehouseId,
    );
  }

  async updateDevice(
    deviceId: string,
    updates: Partial<IoTDevice>,
  ): Promise<IoTDevice> {
    const existing = this.devices.get(deviceId);
    if (!existing) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    const updated = {
      ...existing,
      ...updates,
      lastSeen: new Date().toISOString(),
    };

    this.devices.set(deviceId, updated);

    return updated;
  }

  async deleteDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    this.devices.delete(deviceId);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "iot.device_deleted",
      aggregateId: device.id,
      aggregateType: "IOT_DEVICE",
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        deviceId,
      },
      payload: {
        deviceId,
      },
    });
  }

  async recordSensorReading(
    reading: Partial<SensorReading>,
  ): Promise<SensorReading> {
    const readingRecord: SensorReading = {
      id: `reading-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      deviceId: reading.deviceId || "",
      sensorType: reading.sensorType || "UNKNOWN",
      value: reading.value || 0,
      unit: reading.unit || "",
      locationId: reading.locationId || "",
      timestamp: reading.timestamp || new Date().toISOString(),
      quality: reading.quality || "GOOD",
      metadata: reading.metadata,
    };

    this.readings.set(readingRecord.id, readingRecord);

    // Update device last seen
    const device = await this.getDevice(readingRecord.deviceId);
    if (device) {
      await this.updateDevice(readingRecord.deviceId, {
        lastSeen: readingRecord.timestamp,
      });
    }

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "iot.sensor_reading",
      aggregateId: readingRecord.deviceId,
      aggregateType: "IOT_DEVICE",
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        deviceId: readingRecord.deviceId,
        sensorType: readingRecord.sensorType,
      },
      payload: {
        reading: readingRecord,
      },
    });

    return readingRecord;
  }

  async getSensorReadings(
    deviceId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<SensorReading[]> {
    let readings = Array.from(this.readings.values()).filter(
      (r) => r.deviceId === deviceId,
    );

    if (startDate) {
      readings = readings.filter((r) => new Date(r.timestamp) >= startDate);
    }

    if (endDate) {
      readings = readings.filter((r) => new Date(r.timestamp) <= endDate);
    }

    return readings.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  async getLatestReading(deviceId: string): Promise<SensorReading | null> {
    const readings = await this.getSensorReadings(deviceId);
    return readings.length > 0 ? readings[0] : null;
  }

  async getEnvironmentalMonitoring(
    locationId: string,
  ): Promise<EnvironmentalMonitoring> {
    const devices = await this.getDevicesByLocation(locationId);
    const sensorDevices = devices.filter((d) => d.type === "SENSOR");

    const monitoring: EnvironmentalMonitoring = {
      locationId,
      timestamp: new Date().toISOString(),
      alerts: [],
    };

    // Get latest readings from each sensor type
    for (const device of sensorDevices) {
      const reading = await this.getLatestReading(device.deviceId);
      if (reading) {
        switch (device.sensorType) {
          case "TEMPERATURE":
            monitoring.temperature = reading.value;
            if (reading.value > 30 || reading.value < 2) {
              monitoring.alerts?.push({
                type: "TEMPERATURE",
                severity:
                  reading.value > 35 || reading.value < 0 ? "CRITICAL" : "HIGH",
                message: `Temperature out of range: ${reading.value}${reading.unit}`,
              });
            }
            break;
          case "HUMIDITY":
            monitoring.humidity = reading.value;
            if (reading.value > 80 || reading.value < 20) {
              monitoring.alerts?.push({
                type: "HUMIDITY",
                severity: "MEDIUM",
                message: `Humidity out of range: ${reading.value}${reading.unit}`,
              });
            }
            break;
          case "PRESSURE":
            monitoring.pressure = reading.value;
            break;
        }
      }
    }

    return monitoring;
  }

  async monitorEnvironment(
    locationId: string,
    duration: number = 3600,
  ): Promise<EnvironmentalMonitoring[]> {
    // Continuous monitoring implementation
    // Returns historical monitoring data for the specified duration
    const monitoringData: EnvironmentalMonitoring[] = [];
    const now = new Date();
    const startTime = new Date(now.getTime() - duration * 1000);

    // Get devices for this location
    const devices = await this.getDevicesByLocation(locationId);
    const sensorDevices = devices.filter((d) => d.type === "SENSOR");

    // Get historical readings for each sensor
    const readingsByTime = new Map<number, EnvironmentalMonitoring>();

    for (const device of sensorDevices) {
      const readings = await this.getSensorReadings(
        device.deviceId,
        startTime,
        now,
      );

      for (const reading of readings) {
        // Round timestamp to nearest minute for aggregation
        const timeKey =
          Math.floor(new Date(reading.timestamp).getTime() / 60000) * 60000;

        const existing = readingsByTime.get(timeKey) || {
          locationId,
          timestamp: new Date(timeKey).toISOString(),
          alerts: [],
        };

        // Populate monitoring data based on sensor type
        switch (device.sensorType) {
          case "TEMPERATURE":
            existing.temperature = reading.value;
            if (reading.value > 30 || reading.value < 2) {
              existing.alerts?.push({
                type: "TEMPERATURE",
                severity:
                  reading.value > 35 || reading.value < 0 ? "CRITICAL" : "HIGH",
                message: `Temperature alert: ${reading.value}${reading.unit}`,
              });
            }
            break;
          case "HUMIDITY":
            existing.humidity = reading.value;
            if (reading.value > 80 || reading.value < 20) {
              existing.alerts?.push({
                type: "HUMIDITY",
                severity: "MEDIUM",
                message: `Humidity alert: ${reading.value}${reading.unit}`,
              });
            }
            break;
          case "PRESSURE":
            existing.pressure = reading.value;
            break;
        }

        readingsByTime.set(timeKey, existing);
      }
    }

    // Convert map to sorted array
    const sortedTimes = Array.from(readingsByTime.keys()).sort((a, b) => a - b);
    for (const time of sortedTimes) {
      const monitoring = readingsByTime.get(time);
      if (monitoring) {
        monitoringData.push(monitoring);
      }
    }

    // If no historical data, return current monitoring
    if (monitoringData.length === 0) {
      const current = await this.getEnvironmentalMonitoring(locationId);
      monitoringData.push(current);
    }

    return monitoringData;
  }

  async submitEdgeTask(
    task: Partial<EdgeComputingTask>,
  ): Promise<EdgeComputingTask> {
    const taskRecord: EdgeComputingTask = {
      id: `edge-task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      deviceId: task.deviceId || "",
      taskType: task.taskType || "DATA_PROCESSING",
      status: "PENDING",
      input: task.input || {},
      startedAt: new Date().toISOString(),
    };

    this.edgeTasks.set(taskRecord.id, taskRecord);

    // Simulate task execution
    setTimeout(async () => {
      taskRecord.status = "COMPLETED";
      taskRecord.completedAt = new Date().toISOString();
      taskRecord.output = { result: "Task completed successfully" };
      this.edgeTasks.set(taskRecord.id, taskRecord);

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "iot.edge_task_completed",
        aggregateId: taskRecord.deviceId,
        aggregateType: "IOT_DEVICE",
        version: 1,
        timestamp: new Date().toISOString(),
        metadata: {
          taskId: taskRecord.id,
        },
        payload: {
          task: taskRecord,
        },
      });
    }, 1000);

    return taskRecord;
  }

  async getEdgeTask(taskId: string): Promise<EdgeComputingTask | null> {
    return this.edgeTasks.get(taskId) || null;
  }

  async getEdgeTasks(deviceId: string): Promise<EdgeComputingTask[]> {
    return Array.from(this.edgeTasks.values())
      .filter((t) => t.deviceId === deviceId)
      .sort(
        (a, b) =>
          new Date(b.startedAt || 0).getTime() -
          new Date(a.startedAt || 0).getTime(),
      );
  }

  async checkAlerts(
    locationId: string,
  ): Promise<Array<{ type: string; severity: string; message: string }>> {
    const monitoring = await this.getEnvironmentalMonitoring(locationId);
    return monitoring.alerts || [];
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const iotService: IoTService = new IoTServiceImpl();
