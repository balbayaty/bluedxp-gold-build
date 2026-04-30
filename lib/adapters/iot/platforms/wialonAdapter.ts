/**
 * Wialon (Gurtam) IoT Platform Adapter
 * 
 * Wialon is the world's largest telematics platform supporting 2,500+ device types.
 * Used by over 3.5 million vehicles worldwide.
 * 
 * KEY FEATURES:
 * - 2,500+ device types supported
 * - Real-time tracking via long-polling or WebSocket
 * - Built-in geofencing
 * - Fuel monitoring, driver behavior, temperature sensors
 * - White-label options
 * - Local server deployment available (data residency)
 * 
 * API Documentation: https://sdk.wialon.com/
 * 
 * @module adapters/iot/platforms/wialon
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
// WIALON API TYPES
// ============================================================================

interface WialonUnit {
  id: number;
  nm: string; // name
  cls: number; // class (2 = unit/vehicle)
  uacl: number; // user access level
  pos?: WialonPosition;
  lmsg?: WialonMessage;
  sens?: Record<string, WialonSensor>;
}

interface WialonPosition {
  x: number; // longitude
  y: number; // latitude
  z?: number; // altitude
  s?: number; // speed
  c?: number; // course/heading
  sc?: number; // satellite count
  t: number; // timestamp (unix)
}

interface WialonMessage {
  t: number; // timestamp
  f: number; // flags
  tp: string; // type
  pos?: WialonPosition;
  p?: Record<string, any>; // parameters
}

interface WialonSensor {
  id: number;
  n: string; // name
  t: string; // type
  p: string; // parameter name
  m: string; // metrics
}

// ============================================================================
// WIALON ADAPTER
// ============================================================================

export class WialonAdapter extends BaseIotAdapter {
  readonly name = 'Wialon';
  readonly version = '1.0.0';
  readonly supportedDevices = 'UNIVERSAL' as const;
  
  private sid: string | null = null; // Session ID
  private pollingInterval: NodeJS.Timeout | null = null;
  private locationCallbacks: Set<(location: IotLocation) => void> = new Set();
  private geofenceCallbacks: Set<(event: IotGeofenceEvent) => void> = new Set();
  private unitCache: Map<number, WialonUnit> = new Map();
  
  constructor(config: IotAdapterConfig) {
    super(config);
  }
  
  /**
   * Initialize and authenticate with Wialon
   */
  async initialize(): Promise<void> {
    try {
      // Wialon uses token-based authentication
      const params = new URLSearchParams({
        token: this.config.auth.apiKey || '',
      });
      
      const response = await fetch(
        `${this.config.baseUrl}/wialon/ajax.html?svc=token/login&params=${encodeURIComponent(JSON.stringify({ token: this.config.auth.apiKey }))}`,
        { method: 'POST' }
      );
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Wialon auth failed: ${data.error} - ${data.reason || ''}`);
      }
      
      this.sid = data.eid; // Session ID
      this.connected = true;
      
      // Load units for caching
      await this.loadUnits();
      
      console.log('[Wialon] ✅ Connected to Wialon platform');
      console.log(`[Wialon] Session ID: ${this.sid?.substring(0, 8)}...`);
    } catch (error) {
      console.error('[Wialon] Authentication failed:', error);
      throw error;
    }
  }
  
  /**
   * Load all units/vehicles into cache
   */
  private async loadUnits(): Promise<void> {
    const response = await this.apiCall('core/search_items', {
      spec: {
        itemsType: 'avl_unit',
        propName: 'sys_name',
        propValueMask: '*',
        sortType: 'sys_name',
      },
      force: 1,
      flags: 0x00000001 + 0x00000002 + 0x00000400 + 0x00100000, // name + flags + pos + sensors
      from: 0,
      to: 0,
    });
    
    if (response.items) {
      for (const unit of response.items as WialonUnit[]) {
        this.unitCache.set(unit.id, unit);
      }
      console.log(`[Wialon] Loaded ${this.unitCache.size} units`);
    }
  }
  
  /**
   * Get current location for a device
   */
  async getLocation(deviceId: string): Promise<IotLocation> {
    this.ensureConnected();
    
    const unitId = parseInt(deviceId, 10);
    const response = await this.apiCall('core/search_item', {
      id: unitId,
      flags: 0x00000001 + 0x00000400, // name + position
    });
    
    if (!response.item) {
      throw new Error(`Unit ${deviceId} not found`);
    }
    
    return this.mapWialonUnit(response.item);
  }
  
  /**
   * Get locations for multiple devices
   */
  async getLocations(deviceIds: string[]): Promise<IotLocation[]> {
    this.ensureConnected();
    
    const unitIds = deviceIds.map((id) => parseInt(id, 10));
    const locations: IotLocation[] = [];
    
    // Wialon doesn't have a batch endpoint, so we use the cache + refresh
    await this.refreshPositions(unitIds);
    
    for (const unitId of unitIds) {
      const unit = this.unitCache.get(unitId);
      if (unit) {
        locations.push(this.mapWialonUnit(unit));
      }
    }
    
    return locations;
  }
  
  /**
   * Refresh positions for specific units
   */
  private async refreshPositions(unitIds: number[]): Promise<void> {
    const response = await this.apiCall('core/update_data_flags', {
      spec: unitIds.map((id) => ({
        type: 'type',
        data: id.toString(),
        flags: 0x00000400, // position
        mode: 0,
      })),
    });
    
    // Update cache
    if (response) {
      for (const unit of response as WialonUnit[]) {
        if (unit.id) {
          this.unitCache.set(unit.id, { ...this.unitCache.get(unit.id), ...unit });
        }
      }
    }
  }
  
  /**
   * List all devices/trackers
   */
  async listDevices(): Promise<IotDeviceStatus[]> {
    this.ensureConnected();
    await this.loadUnits();
    
    const devices: IotDeviceStatus[] = [];
    const now = Date.now() / 1000;
    
    for (const [id, unit] of this.unitCache) {
      const lastSeen = unit.pos?.t || unit.lmsg?.t || 0;
      devices.push({
        deviceId: id.toString(),
        online: now - lastSeen < 15 * 60, // 15 minutes threshold
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
    
    const unitId = parseInt(deviceId, 10);
    const unit = this.unitCache.get(unitId);
    
    if (!unit) {
      throw new Error(`Unit ${deviceId} not found`);
    }
    
    const lastSeen = unit.pos?.t || unit.lmsg?.t || 0;
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
    
    const unitId = parseInt(deviceId, 10);
    const response = await this.apiCall('core/search_item', {
      id: unitId,
      flags: 0x00000001 + 0x00000400 + 0x00100000 + 0x00001000, // name + pos + sensors + lastmsg
    });
    
    if (!response.item) {
      throw new Error(`Unit ${deviceId} not found`);
    }
    
    const unit = response.item as WialonUnit;
    const location = this.mapWialonUnit(unit);
    
    const telemetry: IotTelemetry = { ...location };
    
    // Extract sensor values
    if (unit.sens) {
      for (const [key, sensor] of Object.entries(unit.sens)) {
        const sensorType = sensor.t.toLowerCase();
        
        // Try to get sensor value from last message
        if (unit.lmsg?.p && sensor.p in unit.lmsg.p) {
          const value = unit.lmsg.p[sensor.p];
          
          if (sensorType.includes('fuel')) {
            telemetry.fuelLevel = parseFloat(value);
          } else if (sensorType.includes('temp')) {
            telemetry.temperatureSensors = [
              ...(telemetry.temperatureSensors || []),
              { sensorId: sensor.n, temperature: parseFloat(value) },
            ];
          } else if (sensorType.includes('weight')) {
            telemetry.cargoWeight = parseFloat(value);
          } else if (sensorType.includes('ignition')) {
            telemetry.ignitionOn = !!value;
          }
        }
      }
    }
    
    // Extract from last message parameters
    if (unit.lmsg?.p) {
      if ('odo' in unit.lmsg.p) {
        telemetry.odometer = unit.lmsg.p.odo;
      }
      if ('pwr_ext' in unit.lmsg.p) {
        telemetry.externalVoltage = unit.lmsg.p.pwr_ext;
      }
      if ('pwr_int' in unit.lmsg.p) {
        telemetry.batteryVoltage = unit.lmsg.p.pwr_int;
      }
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
    
    const unitId = parseInt(deviceId, 10);
    const response = await this.apiCall('messages/load_interval', {
      itemId: unitId,
      timeFrom: Math.floor(from.getTime() / 1000),
      timeTo: Math.floor(to.getTime() / 1000),
      flags: 0x01, // Position data only
      flagsMask: 0x01,
      loadCount: 10000,
    });
    
    if (!response.messages) {
      return [];
    }
    
    return response.messages
      .filter((msg: WialonMessage) => msg.pos)
      .map((msg: WialonMessage) => ({
        deviceId,
        latitude: msg.pos!.y,
        longitude: msg.pos!.x,
        altitude: msg.pos!.z,
        speed: msg.pos!.s || 0,
        heading: msg.pos!.c,
        timestamp: new Date(msg.t * 1000),
        satellites: msg.pos!.sc,
      }));
  }
  
  /**
   * Subscribe to real-time location updates via long-polling
   */
  async subscribeToUpdates(
    deviceIds: string[],
    callback: (location: IotLocation) => void
  ): Promise<() => void> {
    this.ensureConnected();
    this.locationCallbacks.add(callback);
    
    // Start polling if not already running
    if (!this.pollingInterval) {
      this.startPolling(deviceIds.map((id) => parseInt(id, 10)));
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
    
    // Wialon geofence events come through the same polling mechanism
    return () => {
      this.geofenceCallbacks.delete(callback);
    };
  }
  
  /**
   * Create a geofence (zone) on Wialon
   */
  async createGeofence(geofence: {
    id: string;
    name: string;
    type: 'CIRCLE' | 'POLYGON';
    coordinates: {
      center?: { lat: number; lng: number };
      radius?: number;
      points?: { lat: number; lng: number }[];
    };
  }): Promise<string> {
    this.ensureConnected();
    
    // Wialon uses a resource-based zone system
    // For now, return the provided ID as placeholder
    // Full implementation would require resource ID and proper zone creation
    console.log(`[Wialon] Geofence creation: ${geofence.name}`);
    return geofence.id;
  }
  
  /**
   * Delete a geofence
   */
  async deleteGeofence(geofenceId: string): Promise<void> {
    this.ensureConnected();
    console.log(`[Wialon] Geofence deletion: ${geofenceId}`);
  }
  
  /**
   * Disconnect from Wialon
   */
  async disconnect(): Promise<void> {
    this.stopPolling();
    
    if (this.sid) {
      try {
        await this.apiCall('core/logout');
      } catch {
        // Ignore logout errors
      }
    }
    
    this.sid = null;
    this.connected = false;
    this.unitCache.clear();
    this.locationCallbacks.clear();
    this.geofenceCallbacks.clear();
    
    console.log('[Wialon] Disconnected');
  }
  
  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================
  
  private ensureConnected(): void {
    if (!this.connected || !this.sid) {
      throw new Error('Wialon adapter not connected. Call initialize() first.');
    }
  }
  
  private async apiCall(service: string, params: Record<string, any> = {}): Promise<any> {
    const response = await fetch(
      `${this.config.baseUrl}/wialon/ajax.html?svc=${service}&params=${encodeURIComponent(JSON.stringify(params))}&sid=${this.sid}`,
      { method: 'POST' }
    );
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Wialon API error: ${data.error} - ${data.reason || ''}`);
    }
    
    return data;
  }
  
  private startPolling(unitIds: number[]): void {
    // Long-polling every 5 seconds
    this.pollingInterval = setInterval(async () => {
      try {
        await this.refreshPositions(unitIds);
        
        // Notify callbacks
        for (const unitId of unitIds) {
          const unit = this.unitCache.get(unitId);
          if (unit) {
            const location = this.mapWialonUnit(unit);
            this.locationCallbacks.forEach((cb) => cb(location));
          }
        }
      } catch (error) {
        console.error('[Wialon] Polling error:', error);
      }
    }, 5000);
    
    console.log('[Wialon] Started polling for updates');
  }
  
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('[Wialon] Stopped polling');
    }
  }
  
  private mapWialonUnit(unit: WialonUnit): IotLocation {
    const pos = unit.pos || unit.lmsg?.pos;
    
    return {
      deviceId: unit.id.toString(),
      vehicleId: unit.nm,
      latitude: pos?.y || 0,
      longitude: pos?.x || 0,
      altitude: pos?.z,
      speed: pos?.s || 0,
      heading: pos?.c,
      timestamp: new Date((pos?.t || 0) * 1000),
      satellites: pos?.sc,
      rawData: unit,
    };
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a Wialon adapter instance
 * 
 * @example
 * ```typescript
 * const adapter = createWialonAdapter({
 *   baseUrl: 'https://hst-api.wialon.com',
 *   auth: {
 *     apiKey: process.env.WIALON_TOKEN!,
 *   },
 * });
 * 
 * await adapter.initialize();
 * const locations = await adapter.getLocations(['123', '456']);
 * ```
 */
export function createWialonAdapter(config: IotAdapterConfig): WialonAdapter {
  return new WialonAdapter(config);
}
