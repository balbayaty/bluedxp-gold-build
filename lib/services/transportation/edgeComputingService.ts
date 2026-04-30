/**
 * Edge Computing Service
 *
 * Edge device management and offline capabilities
 * Low-latency decision-making at the edge
 * Fully integrated with ecosystem - no duplication
 */

import { eventBus } from "@/lib/services/event-store";
import { transportationIoTIntegrationService } from "./iotIntegrationService";

export interface EdgeDevice {
  id: string;
  name: string;
  type:
    | "GATEWAY"
    | "SENSOR_HUB"
    | "VEHICLE_COMPUTER"
    | "MOBILE_DEVICE"
    | "CUSTOM";
  location: {
    address?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  capabilities: EdgeCapability[];
  status: "ONLINE" | "OFFLINE" | "DEGRADED" | "MAINTENANCE";
  lastSeen: Date;
  firmwareVersion?: string;
  hardwareVersion?: string;
  metadata?: Record<string, any>;
}

export interface EdgeCapability {
  type:
    | "DATA_PROCESSING"
    | "DECISION_MAKING"
    | "STORAGE"
    | "COMMUNICATION"
    | "AI_INFERENCE"
    | "CUSTOM";
  name: string;
  enabled: boolean;
  parameters?: Record<string, any>;
}

export interface EdgeApplication {
  id: string;
  name: string;
  version: string;
  deviceId: string;
  status: "DEPLOYED" | "RUNNING" | "STOPPED" | "ERROR";
  deployedAt?: Date;
  lastUpdate?: Date;
  configuration: Record<string, any>;
  resources: {
    cpu: number; // Percentage
    memory: number; // MB
    storage: number; // MB
  };
}

export interface EdgeDecision {
  id: string;
  deviceId: string;
  applicationId: string;
  type: "ROUTING" | "ALERT" | "OPTIMIZATION" | "AUTOMATION" | "CUSTOM";
  decision: any;
  confidence: number; // 0-100
  latency: number; // ms
  timestamp: Date;
  synced: boolean;
}

export interface EdgeData {
  deviceId: string;
  sensorId?: string;
  data: Record<string, any>;
  timestamp: Date;
  processed: boolean;
  synced: boolean;
}

export interface OfflineCapability {
  deviceId: string;
  enabled: boolean;
  syncStrategy: "IMMEDIATE" | "BATCH" | "SCHEDULED" | "MANUAL";
  batchSize?: number;
  syncInterval?: number; // minutes
  maxOfflineDuration?: number; // hours
  lastSync?: Date;
}

export class EdgeComputingService {
  private devices: Map<string, EdgeDevice> = new Map();
  private applications: Map<string, EdgeApplication> = new Map();
  private decisions: Map<string, EdgeDecision> = new Map();
  private offlineCapabilities: Map<string, OfflineCapability> = new Map();

  /**
   * Register edge device
   */
  async registerDevice(
    device: Omit<EdgeDevice, "id" | "lastSeen">,
  ): Promise<string> {
    const deviceId = `edge-device-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const newDevice: EdgeDevice = {
      ...device,
      id: deviceId,
      lastSeen: new Date(),
    };

    this.devices.set(deviceId, newDevice);

    await eventBus.publish("transportation.edge.device.registered", {
      deviceId,
      type: device.type,
      timestamp: new Date().toISOString(),
    });

    return deviceId;
  }

  /**
   * Deploy application to edge device
   */
  async deployApplication(
    deviceId: string,
    application: Omit<
      EdgeApplication,
      "id" | "deviceId" | "status" | "deployedAt"
    >,
  ): Promise<string> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Edge device ${deviceId} not found`);
    }

    if (device.status !== "ONLINE") {
      throw new Error(`Device ${deviceId} is not online`);
    }

    const applicationId = `edge-app-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const newApplication: EdgeApplication = {
      ...application,
      id: applicationId,
      deviceId,
      status: "DEPLOYED",
      deployedAt: new Date(),
    };

    this.applications.set(applicationId, newApplication);

    await eventBus.publish("transportation.edge.application.deployed", {
      applicationId,
      deviceId,
      name: application.name,
      timestamp: new Date().toISOString(),
    });

    return applicationId;
  }

  /**
   * Process data at edge
   */
  async processAtEdge(
    deviceId: string,
    applicationId: string,
    data: Record<string, any>,
  ): Promise<EdgeDecision> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Edge device ${deviceId} not found`);
    }

    const application = this.applications.get(applicationId);
    if (!application) {
      throw new Error(`Edge application ${applicationId} not found`);
    }

    if (application.status !== "RUNNING") {
      throw new Error(`Application ${applicationId} is not running`);
    }

    const startTime = Date.now();

    // Process data locally (simplified)
    // In production, would execute actual edge application
    const decision = this.executeEdgeDecision(application, data);

    const latency = Date.now() - startTime;

    const edgeDecision: EdgeDecision = {
      id: `decision-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      deviceId,
      applicationId,
      type: decision.type,
      decision: decision.data,
      confidence: decision.confidence,
      latency,
      timestamp: new Date(),
      synced: false,
    };

    this.decisions.set(edgeDecision.id, edgeDecision);

    // Sync to cloud if online
    if (device.status === "ONLINE") {
      await this.syncDecisionToCloud(edgeDecision);
    } else {
      // Queue for later sync
      await this.queueForSync(edgeDecision);
    }

    await eventBus.publish("transportation.edge.decision.made", {
      decisionId: edgeDecision.id,
      deviceId,
      applicationId,
      type: decision.type,
      latency,
      timestamp: new Date().toISOString(),
    });

    return edgeDecision;
  }

  /**
   * Execute edge decision
   */
  private executeEdgeDecision(
    application: EdgeApplication,
    data: Record<string, any>,
  ): { type: EdgeDecision["type"]; data: any; confidence: number } {
    // Simplified edge decision logic
    // In production, would execute actual ML model or business logic at edge

    // Example: Route optimization at edge
    if (application.name.includes("route")) {
      return {
        type: "ROUTING",
        data: {
          optimizedRoute: data.route,
          estimatedTime: data.estimatedTime,
        },
        confidence: 85,
      };
    }

    // Example: Alert generation
    if (application.name.includes("alert")) {
      const hasAnomaly = this.detectAnomaly(data);
      return {
        type: "ALERT",
        data: {
          alert: hasAnomaly ? "Anomaly detected" : "Normal",
          severity: hasAnomaly ? "HIGH" : "LOW",
        },
        confidence: 90,
      };
    }

    // Default
    return {
      type: "AUTOMATION",
      data: { processed: true },
      confidence: 100,
    };
  }

  /**
   * Detect anomaly (simplified)
   */
  private detectAnomaly(data: Record<string, any>): boolean {
    // Simplified anomaly detection
    // In production, use ML model at edge
    if (data.temperature && (data.temperature < -10 || data.temperature > 50)) {
      return true;
    }
    if (data.shock && data.shock > 10) {
      return true;
    }
    return false;
  }

  /**
   * Sync decision to cloud
   */
  private async syncDecisionToCloud(decision: EdgeDecision): Promise<void> {
    // In production, sync to cloud database/API
    decision.synced = true;
    this.decisions.set(decision.id, decision);

    await eventBus.publish("transportation.edge.decision.synced", {
      decisionId: decision.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Queue for sync (offline mode)
   */
  private async queueForSync(decision: EdgeDecision): Promise<void> {
    // Store for later sync
    // In production, use persistent queue
    decision.synced = false;
    this.decisions.set(decision.id, decision);
  }

  /**
   * Enable offline capability
   */
  async enableOfflineCapability(
    deviceId: string,
    capability: Omit<OfflineCapability, "deviceId">,
  ): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Edge device ${deviceId} not found`);
    }

    const offlineCapability: OfflineCapability = {
      ...capability,
      deviceId,
    };

    this.offlineCapabilities.set(deviceId, offlineCapability);

    await eventBus.publish("transportation.edge.offline.enabled", {
      deviceId,
      syncStrategy: capability.syncStrategy,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Sync offline data
   */
  async syncOfflineData(deviceId: string): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Edge device ${deviceId} not found`);
    }

    const offlineCapability = this.offlineCapabilities.get(deviceId);
    if (!offlineCapability || !offlineCapability.enabled) {
      throw new Error("Offline capability not enabled for this device");
    }

    // Get unsynced decisions
    const unsyncedDecisions = Array.from(this.decisions.values()).filter(
      (d) => d.deviceId === deviceId && !d.synced,
    );

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const decision of unsyncedDecisions) {
      try {
        await this.syncDecisionToCloud(decision);
        synced++;
      } catch (error) {
        failed++;
        errors.push(error instanceof Error ? error.message : "Unknown error");
      }
    }

    // Update last sync
    if (offlineCapability) {
      offlineCapability.lastSync = new Date();
      this.offlineCapabilities.set(deviceId, offlineCapability);
    }

    await eventBus.publish("transportation.edge.offline.synced", {
      deviceId,
      synced,
      failed,
      timestamp: new Date().toISOString(),
    });

    return { synced, failed, errors };
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(
    deviceId: string,
    status: EdgeDevice["status"],
  ): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Edge device ${deviceId} not found`);
    }

    device.status = status;
    device.lastSeen = new Date();
    this.devices.set(deviceId, device);

    await eventBus.publish("transportation.edge.device.status.updated", {
      deviceId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get device by ID
   */
  getDevice(deviceId: string): EdgeDevice | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * Get application by ID
   */
  getApplication(applicationId: string): EdgeApplication | undefined {
    return this.applications.get(applicationId);
  }

  /**
   * List all devices
   */
  listDevices(): EdgeDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * List all applications
   */
  listApplications(deviceId?: string): EdgeApplication[] {
    const allApps = Array.from(this.applications.values());
    return deviceId ? allApps.filter((a) => a.deviceId === deviceId) : allApps;
  }

  /**
   * Get offline capability
   */
  getOfflineCapability(deviceId: string): OfflineCapability | undefined {
    return this.offlineCapabilities.get(deviceId);
  }
}

export const edgeComputingService = new EdgeComputingService();
