/**
 * IoT Polling Service
 * 
 * Background service that polls IoT platforms for vehicle locations
 * and publishes updates to the event bus.
 * 
 * Supports:
 * - Configurable polling intervals
 * - Multiple IoT platform adapters
 * - Daleeli integration
 * - Automatic geofence detection
 * - Graceful shutdown
 * 
 * @module services/iot/iotPollingService
 */

import { eventBus, createEvent } from '@/lib/services/event-bus';
import { geofenceZoneService } from '@/lib/services/geofence';
import type { IIotDeviceAdapter, IotLocation } from '@/lib/adapters/iot/base/IotDeviceAdapter';

// ============================================================================
// TYPES
// ============================================================================

export interface PollingConfig {
  /** IoT platform adapter */
  adapter?: IIotDeviceAdapter;
  /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
  intervalMs?: number;
  /** Enable Daleeli polling */
  daleeliEnabled?: boolean;
  /** Daleeli polling interval (default: 60000 = 1 minute) */
  daleeliIntervalMs?: number;
  /** Enable automatic geofence detection */
  autoGeofence?: boolean;
  /** Tenant ID for geofence operations */
  defaultTenantId?: string;
}

export interface TrackedDevice {
  deviceId: string;
  vehicleId?: string;
  plateNumber?: string;
  shipmentId?: string;
  tenantId: string;
  lastLocation?: IotLocation;
  lastUpdate?: Date;
}

// ============================================================================
// SERVICE
// ============================================================================

class IotPollingService {
  private config: PollingConfig;
  private pollingInterval: NodeJS.Timeout | null = null;
  private daleeliInterval: NodeJS.Timeout | null = null;
  private trackedDevices: Map<string, TrackedDevice> = new Map();
  private isRunning = false;
  private initialized = false;

  constructor(config: PollingConfig = {}) {
    this.config = {
      intervalMs: 30000, // 30 seconds
      daleeliIntervalMs: 60000, // 1 minute
      autoGeofence: true,
      defaultTenantId: 'default',
      ...config,
    };
  }

  /**
   * Initialize the polling service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[IoT Polling] Already initialized');
      return;
    }

    console.log('[IoT Polling] 🚀 Initializing IoT Polling Service...');

    // Initialize adapter if provided
    if (this.config.adapter) {
      try {
        await this.config.adapter.initialize();
        console.log(`[IoT Polling] ✅ Connected to ${this.config.adapter.name}`);
      } catch (error) {
        console.error('[IoT Polling] Failed to initialize adapter:', error);
        // Continue without adapter - will use mock data
      }
    }

    // Subscribe to tracking requests
    eventBus.subscribe('iot.track.device', async (event) => {
      const device = event.payload as TrackedDevice;
      if (device?.deviceId) {
        await this.addDevice(device);
      }
    });

    eventBus.subscribe('iot.untrack.device', async (event) => {
      const { deviceId } = event.payload || {};
      if (deviceId) {
        await this.removeDevice(deviceId);
      }
    });

    // Subscribe to shipment dispatch events to auto-track
    eventBus.subscribe('tms.shipment.dispatched', async (event) => {
      const shipment = event.payload?.shipment || event.payload;
      if (shipment?.vehicleId || shipment?.vehiclePlateNumber) {
        await this.addDevice({
          deviceId: shipment.vehicleId || shipment.vehiclePlateNumber,
          vehicleId: shipment.vehicleId,
          plateNumber: shipment.vehiclePlateNumber,
          shipmentId: shipment.id,
          tenantId: shipment.tenantId || this.config.defaultTenantId || 'default',
        });
      }
    });

    // Subscribe to shipment delivery to stop tracking
    eventBus.subscribe('tms.shipment.delivered', async (event) => {
      const shipment = event.payload?.shipment || event.payload;
      if (shipment?.vehicleId) {
        await this.removeDevice(shipment.vehicleId);
      }
    });

    this.initialized = true;
    console.log('[IoT Polling] ✅ IoT Polling Service initialized');
  }

  /**
   * Start polling
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[IoT Polling] Already running');
      return;
    }

    console.log('[IoT Polling] ▶️ Starting polling...');
    console.log(`[IoT Polling] Interval: ${this.config.intervalMs}ms`);
    console.log(`[IoT Polling] Auto-geofence: ${this.config.autoGeofence}`);

    this.isRunning = true;

    // Start main polling loop
    this.pollingInterval = setInterval(async () => {
      await this.pollDevices();
    }, this.config.intervalMs);

    // Start Daleeli polling if enabled
    if (this.config.daleeliEnabled) {
      this.daleeliInterval = setInterval(async () => {
        await this.pollDaleeli();
      }, this.config.daleeliIntervalMs);
      console.log(`[IoT Polling] Daleeli polling: ${this.config.daleeliIntervalMs}ms`);
    }

    // Publish started event
    await eventBus.publish(createEvent('iot.polling.started', {
      intervalMs: this.config.intervalMs,
      daleeliEnabled: this.config.daleeliEnabled,
    }));

    console.log('[IoT Polling] ✅ Polling started');
  }

  /**
   * Stop polling
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('[IoT Polling] ⏹️ Stopping polling...');

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    if (this.daleeliInterval) {
      clearInterval(this.daleeliInterval);
      this.daleeliInterval = null;
    }

    this.isRunning = false;

    await eventBus.publish(createEvent('iot.polling.stopped', {}));
    console.log('[IoT Polling] ✅ Polling stopped');
  }

  /**
   * Add a device to track
   */
  async addDevice(device: TrackedDevice): Promise<void> {
    this.trackedDevices.set(device.deviceId, device);
    console.log(`[IoT Polling] ➕ Added device: ${device.deviceId}`);

    await eventBus.publish(createEvent('iot.device.added', {
      deviceId: device.deviceId,
      shipmentId: device.shipmentId,
    }));
  }

  /**
   * Remove a device from tracking
   */
  async removeDevice(deviceId: string): Promise<void> {
    const device = this.trackedDevices.get(deviceId);
    if (device) {
      this.trackedDevices.delete(deviceId);
      console.log(`[IoT Polling] ➖ Removed device: ${deviceId}`);

      await eventBus.publish(createEvent('iot.device.removed', {
        deviceId,
        shipmentId: device.shipmentId,
      }));
    }
  }

  /**
   * Get all tracked devices
   */
  getTrackedDevices(): TrackedDevice[] {
    return Array.from(this.trackedDevices.values());
  }

  /**
   * Get device by ID
   */
  getDevice(deviceId: string): TrackedDevice | undefined {
    return this.trackedDevices.get(deviceId);
  }

  /**
   * Get all current locations
   */
  getAllLocations(): Map<string, IotLocation | undefined> {
    const locations = new Map<string, IotLocation | undefined>();
    for (const [deviceId, device] of this.trackedDevices) {
      locations.set(deviceId, device.lastLocation);
    }
    return locations;
  }

  /**
   * Poll all tracked devices
   */
  private async pollDevices(): Promise<void> {
    if (this.trackedDevices.size === 0) {
      return;
    }

    const deviceIds = Array.from(this.trackedDevices.keys());

    try {
      let locations: IotLocation[];

      if (this.config.adapter?.isConnected()) {
        // Get locations from IoT adapter
        locations = await this.config.adapter.getLocations(deviceIds);
      } else {
        // Generate mock locations for demo
        locations = this.generateMockLocations(deviceIds);
      }

      // Process each location
      for (const location of locations) {
        await this.processLocation(location);
      }

    } catch (error) {
      console.error('[IoT Polling] Error polling devices:', error);
    }
  }

  /**
   * Poll Daleeli for tracked vehicles
   */
  private async pollDaleeli(): Promise<void> {
    const plateNumbers = Array.from(this.trackedDevices.values())
      .filter(d => d.plateNumber)
      .map(d => d.plateNumber!);

    if (plateNumbers.length === 0) {
      return;
    }

    try {
      // Publish poll request event
      for (const plateNumber of plateNumbers) {
        await eventBus.publish(createEvent('daleel.poll.requested', {
          plateNumber,
        }));
      }
    } catch (error) {
      console.error('[IoT Polling] Error polling Daleeli:', error);
    }
  }

  /**
   * Process a location update
   */
  private async processLocation(location: IotLocation): Promise<void> {
    const device = this.trackedDevices.get(location.deviceId);
    if (!device) return;

    // Update device with new location
    device.lastLocation = location;
    device.lastUpdate = new Date();
    this.trackedDevices.set(location.deviceId, device);

    // Publish location update
    await eventBus.publish(createEvent('iot.location.updated', {
      deviceId: location.deviceId,
      vehicleId: device.vehicleId,
      shipmentId: device.shipmentId,
      plateNumber: device.plateNumber,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed,
        heading: location.heading,
        timestamp: location.timestamp,
      },
      source: 'IOT',
    }));

    // Check geofences if enabled
    if (this.config.autoGeofence) {
      await this.checkGeofence(device, location);
    }
  }

  /**
   * Check if location triggers a geofence
   */
  private async checkGeofence(device: TrackedDevice, location: IotLocation): Promise<void> {
    try {
      const event = await geofenceZoneService.detectZoneEvent(
        { lat: location.latitude, lng: location.longitude },
        device.shipmentId || device.deviceId,
        device.vehicleId || device.deviceId,
        device.tenantId
      );

      if (event) {
        console.log(`[IoT Polling] 📍 Geofence ${event.eventType}: ${device.deviceId} at zone ${event.zoneId}`);
      }
    } catch (error) {
      // Geofence check is non-critical
    }
  }

  /**
   * Generate mock locations for demo
   */
  private generateMockLocations(deviceIds: string[]): IotLocation[] {
    // Saudi Arabia coordinates for demo
    const baseLocations: Record<string, { lat: number; lng: number }> = {
      jeddah: { lat: 21.4858, lng: 39.1925 },
      riyadh: { lat: 24.7136, lng: 46.6753 },
      dammam: { lat: 26.4207, lng: 50.0888 },
      makkah: { lat: 21.3891, lng: 39.8579 },
    };

    const cities = Object.values(baseLocations);

    return deviceIds.map((deviceId, index) => {
      const device = this.trackedDevices.get(deviceId);
      const prevLocation = device?.lastLocation;

      // Start from a base location or continue from previous
      let lat: number, lng: number;

      if (prevLocation) {
        // Simulate movement (random direction, ~1km movement)
        const bearing = Math.random() * 360;
        const distance = 0.5 + Math.random() * 1; // 0.5 - 1.5 km
        const radBearing = bearing * (Math.PI / 180);
        lat = prevLocation.latitude + (distance / 111) * Math.cos(radBearing);
        lng = prevLocation.longitude + (distance / 111) * Math.sin(radBearing);
      } else {
        // Start at random city
        const city = cities[index % cities.length];
        lat = city.lat + (Math.random() - 0.5) * 0.1;
        lng = city.lng + (Math.random() - 0.5) * 0.1;
      }

      return {
        deviceId,
        vehicleId: device?.vehicleId,
        plateNumber: device?.plateNumber,
        latitude: lat,
        longitude: lng,
        speed: 40 + Math.random() * 60, // 40-100 km/h
        heading: Math.random() * 360,
        timestamp: new Date(),
        accuracy: 5 + Math.random() * 10,
      };
    });
  }

  /**
   * Check if service is running
   */
  isPolling(): boolean {
    return this.isRunning;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// ============================================================================
// SINGLETON & FACTORY
// ============================================================================

let instance: IotPollingService | null = null;

/**
 * Get or create the IoT polling service instance
 */
export function getIotPollingService(config?: PollingConfig): IotPollingService {
  if (!instance) {
    instance = new IotPollingService(config);
  }
  return instance;
}

/**
 * Create a new IoT polling service instance
 */
export function createIotPollingService(config: PollingConfig): IotPollingService {
  return new IotPollingService(config);
}

// Export the default instance
export const iotPollingService = getIotPollingService();

export { IotPollingService };
