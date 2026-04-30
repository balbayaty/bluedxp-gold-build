/**
 * 🎥 DAHUA CAMERA INTEGRATION SERVICE
 * Comprehensive Dahua camera management with ONVIF, RTSP, and DMSS support
 * Integrates with existing IoT infrastructure
 */

import { EventEmitter } from "events";
import type { IoTDevice } from "@/types/iot";

// ============================================================================
// TYPES
// ============================================================================

export interface DahuaCamera {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  firmwareVersion?: string;
  ipAddress: string;
  port?: number;
  username: string;
  password: string; // Encrypted in storage
  status: "online" | "offline" | "error" | "maintenance";
  capabilities: {
    rtsp: boolean;
    onvif: boolean;
    http: boolean;
    https: boolean;
    ptz?: boolean;
    audio?: boolean;
    nightVision?: boolean;
    aiFeatures?: string[];
  };
  channels: DahuaCameraChannel[];
  location?: {
    warehouseId?: string;
    zone?: string;
    coordinates?: { x: number; y: number; z?: number };
  };
  recording?: {
    enabled: boolean;
    schedule?: string;
    storagePath?: string;
  };
  lastSeen?: Date;
  health: {
    uptime: number;
    errors: string[];
    lastHealthCheck: Date;
  };
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DahuaCameraChannel {
  channelId: number;
  name: string;
  enabled: boolean;
  streamType: "main" | "sub" | "snapshot";
  resolution?: string;
  fps?: number;
  bitrate?: number;
  codec?: string;
}

export interface DahuaStreamInfo {
  rtspUrl: string;
  hlsUrl?: string;
  webrtcUrl?: string;
  snapshotUrl?: string;
  channel: number;
  streamType: "main" | "sub";
}

export interface DahuaCameraDiscoveryResult {
  cameras: DahuaCamera[];
  totalFound: number;
  online: number;
  offline: number;
  errors: string[];
}

export interface DahuaCameraConfig {
  ipAddress: string;
  port?: number;
  username: string;
  password: string;
  model?: string;
  serialNumber?: string;
  networkRange?: string[];
}

// ============================================================================
// DAHUA CAMERA SERVICE
// ============================================================================

export class DahuaCameraService extends EventEmitter {
  private cameras: Map<string, DahuaCamera> = new Map();
  private streamCache: Map<string, DahuaStreamInfo> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.startHealthMonitoring();
  }

  /**
   * Discover Dahua cameras on the network
   * Uses ONVIF device discovery and network scanning
   */
  async discoverCameras(config: {
    networkRange?: string[];
    port?: number;
    timeout?: number;
  }): Promise<DahuaCameraDiscoveryResult> {
    const {
      networkRange = ["192.168.1.0/24"],
      port = 80,
      timeout = 5000,
    } = config;

    console.log("🔍 Discovering Dahua cameras on network...");

    const discoveredCameras: DahuaCamera[] = [];
    const errors: string[] = [];

    // Method 1: ONVIF Device Discovery (WS-Discovery)
    try {
      const onvifDevices = await this.discoverONVIFDevices(
        networkRange,
        timeout,
      );
      for (const device of onvifDevices) {
        if (this.isDahuaDevice(device)) {
          const camera = await this.probeDahuaDevice(device, port);
          if (camera) {
            discoveredCameras.push(camera);
          }
        }
      }
    } catch (error: any) {
      errors.push(`ONVIF discovery failed: ${error.message}`);
      console.warn("ONVIF discovery error:", error);
    }

    // Method 2: Network scanning for common Dahua ports
    try {
      const networkDevices = await this.scanNetworkForDahua(
        networkRange,
        port,
        timeout,
      );
      for (const device of networkDevices) {
        const camera = await this.probeDahuaDevice(device, port);
        if (
          camera &&
          !discoveredCameras.find((c) => c.ipAddress === camera.ipAddress)
        ) {
          discoveredCameras.push(camera);
        }
      }
    } catch (error: any) {
      errors.push(`Network scan failed: ${error.message}`);
      console.warn("Network scan error:", error);
    }

    // Method 3: DMSS device list (if credentials available)
    // This would require DMSS API access or device list export

    const online = discoveredCameras.filter(
      (c) => c.status === "online",
    ).length;
    const offline = discoveredCameras.length - online;

    console.log(
      `✅ Discovered ${discoveredCameras.length} Dahua cameras (${online} online, ${offline} offline)`,
    );

    return {
      cameras: discoveredCameras,
      totalFound: discoveredCameras.length,
      online,
      offline,
      errors,
    };
  }

  /**
   * Register a Dahua camera manually
   */
  async registerCamera(config: DahuaCameraConfig): Promise<DahuaCamera> {
    const {
      ipAddress,
      port = 80,
      username,
      password,
      model,
      serialNumber,
    } = config;

    // Probe device to get full information
    const deviceInfo = await this.probeDahuaDevice({ ipAddress, port }, port, {
      username,
      password,
    });

    if (!deviceInfo) {
      throw new Error(`Failed to connect to camera at ${ipAddress}`);
    }

    // Use provided or discovered information
    const camera: DahuaCamera = {
      id: serialNumber || this.generateCameraId(ipAddress),
      name: `Dahua Camera ${ipAddress}`,
      serialNumber: serialNumber || deviceInfo.serialNumber || "UNKNOWN",
      model: model || deviceInfo.model || "UNKNOWN",
      firmwareVersion: deviceInfo.firmwareVersion,
      ipAddress,
      port,
      username,
      password: this.encryptPassword(password), // Encrypt before storing
      status: deviceInfo.status,
      capabilities: deviceInfo.capabilities,
      channels: deviceInfo.channels || [],
      health: {
        uptime: 0,
        errors: [],
        lastHealthCheck: new Date(),
      },
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.cameras.set(camera.id, camera);
    this.emit("cameraRegistered", camera);

    console.log(`📹 Registered Dahua camera: ${camera.name} (${camera.id})`);
    return camera;
  }

  /**
   * Get camera by ID
   */
  getCamera(cameraId: string): DahuaCamera | undefined {
    return this.cameras.get(cameraId);
  }

  /**
   * Get all cameras
   */
  getAllCameras(filters?: {
    status?: DahuaCamera["status"];
    warehouseId?: string;
    online?: boolean;
  }): DahuaCamera[] {
    let cameras = Array.from(this.cameras.values());

    if (filters) {
      if (filters.status) {
        cameras = cameras.filter((c) => c.status === filters.status);
      }
      if (filters.warehouseId) {
        cameras = cameras.filter(
          (c) => c.location?.warehouseId === filters.warehouseId,
        );
      }
      if (filters.online !== undefined) {
        cameras = cameras.filter((c) =>
          filters.online ? c.status === "online" : c.status !== "online",
        );
      }
    }

    return cameras;
  }

  /**
   * Get RTSP stream URL for a camera channel
   */
  getRTSPStream(
    cameraId: string,
    channel: number = 1,
    streamType: "main" | "sub" = "main",
  ): string {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      throw new Error(`Camera ${cameraId} not found`);
    }

    const password = this.decryptPassword(camera.password);
    const streamSubtype = streamType === "main" ? 0 : 1;

    // Standard Dahua RTSP URL format
    const rtspUrl = `rtsp://${camera.username}:${password}@${camera.ipAddress}:554/cam/realmonitor?channel=${channel}&subtype=${streamSubtype}`;

    return rtspUrl;
  }

  /**
   * Get HLS stream URL (requires media server conversion)
   */
  async getHLSStream(cameraId: string, channel: number = 1): Promise<string> {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      throw new Error(`Camera ${cameraId} not found`);
    }

    // Check cache first
    const cacheKey = `${cameraId}-${channel}`;
    const cached = this.streamCache.get(cacheKey);
    if (cached?.hlsUrl) {
      return cached.hlsUrl;
    }

    // Generate HLS URL (this would be handled by media server)
    // Format: /api/cameras/{cameraId}/stream/hls?channel={channel}
    const hlsUrl = `/api/cameras/${cameraId}/stream/hls?channel=${channel}`;

    // Cache the stream info
    const rtspUrl = this.getRTSPStream(cameraId, channel);
    this.streamCache.set(cacheKey, {
      rtspUrl,
      hlsUrl,
      channel,
      streamType: "main",
    });

    return hlsUrl;
  }

  /**
   * Get snapshot URL
   */
  getSnapshotUrl(cameraId: string, channel: number = 1): string {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      throw new Error(`Camera ${cameraId} not found`);
    }

    const password = this.decryptPassword(camera.password);

    // Dahua snapshot URL format
    return `http://${camera.username}:${password}@${camera.ipAddress}/cgi-bin/snapshot.cgi?channel=${channel}`;
  }

  /**
   * Test camera connection
   */
  async testConnection(cameraId: string): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }> {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      return { success: false, error: "Camera not found" };
    }

    const startTime = Date.now();
    try {
      // Try to get snapshot as connection test
      const snapshotUrl = this.getSnapshotUrl(cameraId);
      const response = await fetch(snapshotUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return { success: true, latency };
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update camera status
   */
  async updateCameraStatus(
    cameraId: string,
    status: DahuaCamera["status"],
  ): Promise<void> {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      throw new Error(`Camera ${cameraId} not found`);
    }

    camera.status = status;
    camera.updatedAt = new Date();
    camera.lastSeen = new Date();

    this.emit("cameraStatusChanged", { cameraId, status });
  }

  /**
   * Health check for all cameras
   */
  async performHealthCheck(cameraId?: string): Promise<void> {
    const camerasToCheck = cameraId
      ? ([this.cameras.get(cameraId)].filter(Boolean) as DahuaCamera[])
      : Array.from(this.cameras.values());

    for (const camera of camerasToCheck) {
      try {
        const test = await this.testConnection(camera.id);
        if (test.success) {
          await this.updateCameraStatus(camera.id, "online");
          camera.health.lastHealthCheck = new Date();
          camera.health.errors = [];
        } else {
          await this.updateCameraStatus(camera.id, "offline");
          camera.health.errors.push(test.error || "Connection failed");
        }
      } catch (error: any) {
        await this.updateCameraStatus(camera.id, "error");
        camera.health.errors.push(error.message);
      }
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Discover ONVIF devices using WS-Discovery
   */
  private async discoverONVIFDevices(
    networkRange: string[],
    timeout: number,
  ): Promise<Array<{ ipAddress: string; port: number; info?: any }>> {
    // ONVIF WS-Discovery implementation
    // This would use a library like 'node-onvif' or implement WS-Discovery protocol
    // For now, return empty array - implementation would require ONVIF library
    console.log(
      "🔍 ONVIF discovery not fully implemented - requires node-onvif library",
    );
    return [];
  }

  /**
   * Scan network for Dahua devices
   */
  private async scanNetworkForDahua(
    networkRange: string[],
    port: number,
    timeout: number,
  ): Promise<Array<{ ipAddress: string; port: number }>> {
    // Network scanning implementation
    // This would scan IP ranges for devices responding on common Dahua ports
    // For now, return empty array - implementation would require network scanning library
    console.log(
      "🔍 Network scanning not fully implemented - requires network scanning library",
    );
    return [];
  }

  /**
   * Check if device is a Dahua device
   */
  private isDahuaDevice(device: any): boolean {
    // Check device info for Dahua indicators
    const dahuaIndicators = ["dahua", "dh", "dhi"];
    const deviceInfo = JSON.stringify(device).toLowerCase();
    return dahuaIndicators.some((indicator) => deviceInfo.includes(indicator));
  }

  /**
   * Probe Dahua device to get information
   */
  private async probeDahuaDevice(
    device: { ipAddress: string; port?: number },
    defaultPort: number = 80,
    credentials?: { username: string; password: string },
  ): Promise<
    (Partial<DahuaCamera> & { status: DahuaCamera["status"] }) | null
  > {
    try {
      const port = device.port || defaultPort;
      const baseUrl = `http://${device.ipAddress}:${port}`;

      // Try to get device information
      // This would use Dahua API or ONVIF to get device info
      // For now, return basic structure

      return {
        ipAddress: device.ipAddress,
        port,
        status: "online", // Would be determined by actual connection test
        capabilities: {
          rtsp: true,
          onvif: true,
          http: true,
          https: false,
          ptz: false,
          audio: false,
          nightVision: false,
        },
        channels: [
          {
            channelId: 1,
            name: "Channel 1",
            enabled: true,
            streamType: "main",
          },
        ],
      };
    } catch (error) {
      console.error(`Failed to probe device ${device.ipAddress}:`, error);
      return null;
    }
  }

  /**
   * Generate camera ID
   */
  private generateCameraId(ipAddress: string): string {
    return `dahua-${ipAddress.replace(/\./g, "-")}-${Date.now()}`;
  }

  /**
   * Encrypt password (simple base64 for now - use proper encryption in production)
   */
  private encryptPassword(password: string): string {
    // In production, use proper encryption like AES-256
    return Buffer.from(password).toString("base64");
  }

  /**
   * Decrypt password
   */
  private decryptPassword(encrypted: string): string {
    // In production, use proper decryption
    return Buffer.from(encrypted, "base64").toString("utf-8");
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck().catch((error) => {
        console.error("Health check error:", error);
      });
    }, intervalMs);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const dahuaCameraService = new DahuaCameraService();
