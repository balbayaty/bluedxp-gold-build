/**
 * Flespi IoT Platform Adapter
 * 
 * Flespi is a powerful telematics middleware platform supporting 500+ GPS device types.
 * It provides a unified API for heterogeneous device fleets.
 * 
 * KEY FEATURES:
 * - 500+ device protocols supported
 * - Real-time MQTT streaming
 * - Advanced REST API
 * - Raw message access
 * - Protocol analytics
 * - White-label options
 * 
 * API Documentation: https://flespi.io/docs/
 * 
 * @module adapters/iot/platforms/flespi
 */

import {
  BaseIotAdapter,
  IotLocation,
  IotTelemetry,
  IotDeviceStatus,
  IotGeofenceEvent,
  IotAdapterConfig,
} from '../base/IotDeviceAdapter';

// ============================================================================
// FLESPI API TYPES
// ============================================================================

interface FlespiDevice {
  id: number;
  name: string;
  ident: string;
  device_type_id: number;
  protocol_id: number;
  phone?: string;
  telemetry?: FlespiTelemetry;
}

interface FlespiTelemetry {
  timestamp?: number;
  'position.latitude'?: number;
  'position.longitude'?: number;
  'position.altitude'?: number;
  'position.speed'?: number;
  'position.direction'?: number;
  'position.satellites'?: number;
  'position.hdop'?: number;
  'engine.ignition.status'?: boolean;
  'fuel.level'?: number;
  'fuel.consumed'?: number;
  'temperature.sensor.1'?: number;
  'weight.cargo'?: number;
  'battery.voltage'?: number;
  'external.powersource.voltage'?: number;
  'vehicle.mileage'?: number;
  [key: string]: any;
}

interface FlespiMessage extends FlespiTelemetry {
  ident: string;
  'server.timestamp': number;
  'channel.id': number;
}

// ============================================================================
// FLESPI ADAPTER
// ============================================================================

export class FlespiAdapter extends BaseIotAdapter {
  readonly name = 'Flespi';
  readonly version = '1.0.0';
  readonly supportedDevices = 'UNIVERSAL' as const;
  
  private deviceCache: Map<number, FlespiDevice> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private locationCallbacks: Set<(location: IotLocation) => void> = new Set();
  private geofenceCallbacks: Set<(event: IotGeofenceEvent) => void> = new Set();
  
  constructor(config: IotAdapterConfig) {
    super(config);
  }
  
  /**
   * Initialize and authenticate with Flespi
   */
  async initialize(): Promise<void> {
    try {
      // Flespi uses token-based authentication via header
      const response = await fetch(`${this.config.baseUrl}/platform/customer`, {
        headers: {
          'Authorization': `FlespiToken ${this.config.auth.apiKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Flespi auth failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.errors && data.errors.length > 0) {
        throw new Error(`Flespi auth failed: ${data.errors[0].reason}`);
      }
      
      this.connected = true;
      
      // Load devices into cache
      await this.loadDevices();
      
      console.log('[Flespi] ✅ Connected to Flespi platform');
    } catch (error) {
      console.error('[Flespi] Authentication failed:', error);
      throw error;
    }
  }
  
  /**
   * Load all devices into cache
   */
  private async loadDevices(): Promise<void> {
    const devices = await this.apiCall('/gw/devices/all');
    
    if (devices.result) {
      for (const device of devices.result as FlespiDevice[]) {
        this.deviceCache.set(device.id, device);
      }
      console.log(`[Flespi] Loaded ${this.deviceCache.size} devices`);
    }
  }
  
  /**
   * Get current location for a device
   */
  async getLocation(deviceId: string): Promise<IotLocation> {
    this.ensureConnected();
    
    const id = parseInt(deviceId, 10);
    const response = await this.apiCall(`/gw/devices/${id}/telemetry`);
    
    if (!response.result || response.result.length === 0) {
      throw new Error(`Device ${deviceId} telemetry not found`);
    }
    
    const device = this.deviceCache.get(id);
    return this.mapFlespiTelemetry(deviceId, device?.name, response.result[0].telemetry);
  }
  
  /**
   * Get locations for multiple devices
   */
  async getLocations(deviceIds: string[]): Promise<IotLocation[]> {
    this.ensureConnected();
    
    const ids = deviceIds.map((id) => parseInt(id, 10));
    const locations: IotLocation[] = [];
    
    // Flespi supports batch telemetry fetch
    const selector = ids.join(',');
    const response = await this.apiCall(`/gw/devices/${selector}/telemetry`);
    
    if (response.result) {
      for (const item of response.result) {
        const device = this.deviceCache.get(item.id);
        locations.push(this.mapFlespiTelemetry(
          item.id.toString(),
          device?.name,
          item.telemetry
        ));
      }
    }
    
    return locations;
  }
  
  /**
   * List all devices
   */
  async listDevices(): Promise<IotDeviceStatus[]> {
    this.ensureConnected();
    await this.loadDevices();
    
    const devices: IotDeviceStatus[] = [];
    const now = Date.now() / 1000;
    
    for (const [id, device] of this.deviceCache) {
      const lastSeen = device.telemetry?.timestamp || 0;
      devices.push({
        deviceId: id.toString(),
        online: now - lastSeen < 15 * 60,
        lastSeen: new Date(lastSeen * 1000),
      });
    }
    
    return devices;
  }
  
  /**
   * Get device status
   */
  async getDeviceStatus(deviceId: string): Promise<IotDeviceStatus> {
    this.ensureConnected();
    
    const id = parseInt(deviceId, 10);
    const response = await this.apiCall(`/gw/devices/${id}`);
    
    if (!response.result || response.result.length === 0) {
      throw new Error(`Device ${deviceId} not found`);
    }
    
    const device = response.result[0] as FlespiDevice;
    const lastSeen = device.telemetry?.timestamp || 0;
    const now = Date.now() / 1000;
    
    return {
      deviceId,
      online: now - lastSeen < 15 * 60,
      lastSeen: new Date(lastSeen * 1000),
    };
  }
  
  /**
   * Get extended telemetry data
   */
  async getTelemetry(deviceId: string): Promise<IotTelemetry> {
    this.ensureConnected();
    
    const id = parseInt(deviceId, 10);
    const response = await this.apiCall(`/gw/devices/${id}/telemetry`);
    
    if (!response.result || response.result.length === 0) {
      throw new Error(`Device ${deviceId} telemetry not found`);
    }
    
    const device = this.deviceCache.get(id);
    const tel = response.result[0].telemetry as FlespiTelemetry;
    const location = this.mapFlespiTelemetry(deviceId, device?.name, tel);
    
    const telemetry: IotTelemetry = {
      ...location,
      fuelLevel: tel['fuel.level'],
      fuelConsumed: tel['fuel.consumed'],
      batteryVoltage: tel['battery.voltage'],
      externalVoltage: tel['external.powersource.voltage'],
      odometer: tel['vehicle.mileage'],
      ignitionOn: tel['engine.ignition.status'],
      cargoWeight: tel['weight.cargo'],
    };
    
    // Temperature sensors
    const tempSensors: { sensorId: string; temperature: number }[] = [];
    for (const [key, value] of Object.entries(tel)) {
      if (key.startsWith('temperature.sensor.') && typeof value === 'number') {
        tempSensors.push({
          sensorId: key.replace('temperature.sensor.', ''),
          temperature: value,
        });
      }
    }
    if (tempSensors.length > 0) {
      telemetry.temperatureSensors = tempSensors;
    }
    
    return telemetry;
  }
  
  /**
   * Get location history
   */
  async getLocationHistory(
    deviceId: string,
    from: Date,
    to: Date
  ): Promise<IotLocation[]> {
    this.ensureConnected();
    
    const id = parseInt(deviceId, 10);
    const fromTs = Math.floor(from.getTime() / 1000);
    const toTs = Math.floor(to.getTime() / 1000);
    
    const response = await this.apiCall(
      `/gw/devices/${id}/messages?data={"from":${fromTs},"to":${toTs},"fields":"position.latitude,position.longitude,position.altitude,position.speed,position.direction,position.satellites,timestamp"}`
    );
    
    if (!response.result) {
      return [];
    }
    
    return response.result.map((msg: FlespiMessage) => ({
      deviceId,
      latitude: msg['position.latitude'] || 0,
      longitude: msg['position.longitude'] || 0,
      altitude: msg['position.altitude'],
      speed: msg['position.speed'] || 0,
      heading: msg['position.direction'],
      timestamp: new Date((msg.timestamp || 0) * 1000),
      satellites: msg['position.satellites'],
    }));
  }
  
  /**
   * Subscribe to real-time location updates
   */
  async subscribeToUpdates(
    deviceIds: string[],
    callback: (location: IotLocation) => void
  ): Promise<() => void> {
    this.ensureConnected();
    this.locationCallbacks.add(callback);
    
    // Start polling if not already running
    // For production, use MQTT streaming instead
    if (!this.pollingInterval) {
      this.startPolling(deviceIds);
    }
    
    return () => {
      this.locationCallbacks.delete(callback);
      if (this.locationCallbacks.size === 0) {
        this.stopPolling();
      }
    };
  }
  
  /**
   * Subscribe to geofence events
   */
  async subscribeToGeofenceEvents(
    callback: (event: IotGeofenceEvent) => void
  ): Promise<() => void> {
    this.ensureConnected();
    this.geofenceCallbacks.add(callback);
    
    return () => {
      this.geofenceCallbacks.delete(callback);
    };
  }
  
  /**
   * Disconnect from Flespi
   */
  async disconnect(): Promise<void> {
    this.stopPolling();
    this.connected = false;
    this.deviceCache.clear();
    this.locationCallbacks.clear();
    this.geofenceCallbacks.clear();
    
    console.log('[Flespi] Disconnected');
  }
  
  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================
  
  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Flespi adapter not connected. Call initialize() first.');
    }
  }
  
  private async apiCall(endpoint: string): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `FlespiToken ${this.config.auth.apiKey}`,
      },
    });
    
    const data = await response.json();
    
    if (data.errors && data.errors.length > 0) {
      throw new Error(`Flespi API error: ${data.errors[0].reason}`);
    }
    
    return data;
  }
  
  private startPolling(deviceIds: string[]): void {
    this.pollingInterval = setInterval(async () => {
      try {
        const locations = await this.getLocations(deviceIds);
        for (const location of locations) {
          this.locationCallbacks.forEach((cb) => cb(location));
        }
      } catch (error) {
        console.error('[Flespi] Polling error:', error);
      }
    }, 5000);
    
    console.log('[Flespi] Started polling for updates');
  }
  
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('[Flespi] Stopped polling');
    }
  }
  
  private mapFlespiTelemetry(
    deviceId: string,
    deviceName: string | undefined,
    tel: FlespiTelemetry
  ): IotLocation {
    return {
      deviceId,
      vehicleId: deviceName,
      latitude: tel['position.latitude'] || 0,
      longitude: tel['position.longitude'] || 0,
      altitude: tel['position.altitude'],
      speed: tel['position.speed'] || 0,
      heading: tel['position.direction'],
      timestamp: new Date((tel.timestamp || 0) * 1000),
      satellites: tel['position.satellites'],
      accuracy: tel['position.hdop'] ? tel['position.hdop'] * 5 : undefined,
      ignitionOn: tel['engine.ignition.status'],
      rawData: tel,
    };
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a Flespi adapter instance
 * 
 * @example
 * ```typescript
 * const adapter = createFlespiAdapter({
 *   baseUrl: 'https://flespi.io',
 *   auth: {
 *     apiKey: process.env.FLESPI_TOKEN!,
 *   },
 * });
 * 
 * await adapter.initialize();
 * const locations = await adapter.getLocations(['123', '456']);
 * ```
 */
export function createFlespiAdapter(config: IotAdapterConfig): FlespiAdapter {
  return new FlespiAdapter(config);
}
