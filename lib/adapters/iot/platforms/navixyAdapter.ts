/**
 * Navixy IoT Platform Adapter
 * 
 * Navixy is a universal telematics platform that supports 300+ GPS device types.
 * 
 * KEY FEATURES FOR SAUDI ARABIA:
 * - Saudi-hosted deployment available (PDPL compliant)
 * - Data residency within Kingdom
 * - Supports all TGA-approved devices (Teltonika, Queclink, Meitrack, etc.)
 * - Real-time tracking via WebSocket
 * - Built-in geofencing
 * - Fuel and temperature monitoring
 * 
 * API Documentation: https://api.navixy.com/
 * 
 * @module adapters/iot/platforms/navixy
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
// NAVIXY API TYPES
// ============================================================================

interface NavixyTracker {
  id: number;
  label: string;
  source: {
    id: number;
    device_id: string;
    model: string;
    phone?: string;
  };
  status: {
    movement_status: 'moving' | 'stopped' | 'parked';
    gps: {
      signal_level?: number;
      updated?: string;
    };
    gsm?: {
      signal_level?: number;
    };
  };
}

interface NavixyLocation {
  tracker_id: number;
  location: {
    lat: number;
    lng: number;
    alt?: number;
    speed?: number;
    heading?: number;
    precision?: number;
    satellites?: number;
    timestamp: string;
  };
  connection_status: 'online' | 'offline' | 'unknown';
  inputs?: Record<string, number | boolean>;
}

interface NavixySensor {
  type: string;
  value: number;
  units?: string;
  label?: string;
}

// ============================================================================
// NAVIXY ADAPTER
// ============================================================================

export class NavixyAdapter extends BaseIotAdapter {
  readonly name = 'Navixy';
  readonly version = '1.0.0';
  readonly supportedDevices = 'UNIVERSAL' as const;
  
  private sessionHash: string | null = null;
  private websocket: WebSocket | null = null;
  private locationCallbacks: Set<(location: IotLocation) => void> = new Set();
  private geofenceCallbacks: Set<(event: IotGeofenceEvent) => void> = new Set();
  
  constructor(config: IotAdapterConfig) {
    super(config);
  }
  
  /**
   * Initialize and authenticate with Navixy
   */
  async initialize(): Promise<void> {
    try {
      // Authenticate to get session hash
      const response = await fetch(`${this.config.baseUrl}/user/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: this.config.auth.username,
          password: this.config.auth.password,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`Navixy auth failed: ${data.status?.description || 'Unknown error'}`);
      }
      
      this.sessionHash = data.hash;
      this.connected = true;
      
      console.log('[Navixy] ✅ Connected to Navixy platform');
    } catch (error) {
      console.error('[Navixy] Authentication failed:', error);
      throw error;
    }
  }
  
  /**
   * Get current location for a device
   */
  async getLocation(deviceId: string): Promise<IotLocation> {
    this.ensureConnected();
    
    const response = await this.apiCall('/tracker/get_state', {
      tracker_id: parseInt(deviceId, 10),
    });
    
    return this.mapNavixyLocation(response);
  }
  
  /**
   * Get locations for multiple devices
   */
  async getLocations(deviceIds: string[]): Promise<IotLocation[]> {
    this.ensureConnected();
    
    const trackerIds = deviceIds.map((id) => parseInt(id, 10));
    const response = await this.apiCall('/tracker/get_states', {
      trackers: trackerIds,
    });
    
    return response.states.map((state: NavixyLocation) => this.mapNavixyLocation(state));
  }
  
  /**
   * List all devices/trackers
   */
  async listDevices(): Promise<IotDeviceStatus[]> {
    this.ensureConnected();
    
    const response = await this.apiCall('/tracker/list');
    
    return response.list.map((tracker: NavixyTracker) => ({
      deviceId: tracker.id.toString(),
      online: tracker.status.gps?.updated
        ? new Date(tracker.status.gps.updated).getTime() > Date.now() - 15 * 60 * 1000
        : false,
      lastSeen: tracker.status.gps?.updated
        ? new Date(tracker.status.gps.updated)
        : new Date(0),
      signalStrength: tracker.status.gsm?.signal_level,
      firmwareVersion: tracker.source.model,
    }));
  }
  
  /**
   * Get device status
   */
  async getDeviceStatus(deviceId: string): Promise<IotDeviceStatus> {
    this.ensureConnected();
    
    const response = await this.apiCall('/tracker/get_state', {
      tracker_id: parseInt(deviceId, 10),
    });
    
    return {
      deviceId,
      online: response.connection_status === 'online',
      lastSeen: new Date(response.location?.timestamp || Date.now()),
      signalStrength: response.gps?.signal_level,
    };
  }
  
  /**
   * Get extended telemetry data
   */
  async getTelemetry(deviceId: string): Promise<IotTelemetry> {
    this.ensureConnected();
    
    const [stateResponse, sensorsResponse] = await Promise.all([
      this.apiCall('/tracker/get_state', { tracker_id: parseInt(deviceId, 10) }),
      this.apiCall('/tracker/sensor/data/read', { tracker_id: parseInt(deviceId, 10) }).catch(() => null),
    ]);
    
    const location = this.mapNavixyLocation(stateResponse);
    
    // Map sensor data
    const telemetry: IotTelemetry = {
      ...location,
    };
    
    if (sensorsResponse?.sensors) {
      for (const sensor of sensorsResponse.sensors as NavixySensor[]) {
        switch (sensor.type) {
          case 'fuel_level':
            telemetry.fuelLevel = sensor.value;
            break;
          case 'temperature':
            telemetry.temperatureSensors = [
              ...(telemetry.temperatureSensors || []),
              { sensorId: sensor.label || 'default', temperature: sensor.value },
            ];
            break;
          case 'weight':
            telemetry.cargoWeight = sensor.value;
            break;
          case 'engine_temp':
            telemetry.engineTemp = sensor.value;
            break;
        }
      }
    }
    
    // Map inputs for ignition, doors, etc.
    if (stateResponse.inputs) {
      if (typeof stateResponse.inputs.ignition === 'boolean') {
        telemetry.ignitionOn = stateResponse.inputs.ignition;
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
    
    const response = await this.apiCall('/track/read', {
      tracker_id: parseInt(deviceId, 10),
      from: from.toISOString(),
      to: to.toISOString(),
    });
    
    return response.track.map((point: any) => ({
      deviceId,
      latitude: point.lat,
      longitude: point.lng,
      altitude: point.alt,
      speed: point.speed || 0,
      heading: point.heading,
      timestamp: new Date(point.timestamp),
      accuracy: point.precision,
      satellites: point.satellites,
    }));
  }
  
  /**
   * Subscribe to real-time location updates via WebSocket
   */
  async subscribeToUpdates(
    deviceIds: string[],
    callback: (location: IotLocation) => void
  ): Promise<() => void> {
    this.ensureConnected();
    this.locationCallbacks.add(callback);
    
    // Connect WebSocket if not already connected
    if (!this.websocket) {
      await this.connectWebSocket();
    }
    
    // Subscribe to tracker updates
    const trackerIds = deviceIds.map((id) => parseInt(id, 10));
    this.websocket?.send(JSON.stringify({
      action: 'subscribe',
      trackers: trackerIds,
    }));
    
    // Return unsubscribe function
    return () => {
      this.locationCallbacks.delete(callback);
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
    
    // Connect WebSocket if not already connected
    if (!this.websocket) {
      await this.connectWebSocket();
    }
    
    return () => {
      this.geofenceCallbacks.delete(callback);
    };
  }
  
  /**
   * Create a geofence on Navixy
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
    alertOnEntry: boolean;
    alertOnExit: boolean;
  }): Promise<string> {
    this.ensureConnected();
    
    const zoneData: any = {
      label: geofence.name,
      type: geofence.type.toLowerCase(),
    };
    
    if (geofence.type === 'CIRCLE' && geofence.coordinates.center) {
      zoneData.center = geofence.coordinates.center;
      zoneData.radius = geofence.coordinates.radius || 500;
    } else if (geofence.type === 'POLYGON' && geofence.coordinates.points) {
      zoneData.points = geofence.coordinates.points;
    }
    
    const response = await this.apiCall('/zone/create', { zone: zoneData });
    
    return response.id.toString();
  }
  
  /**
   * Delete a geofence
   */
  async deleteGeofence(geofenceId: string): Promise<void> {
    this.ensureConnected();
    
    await this.apiCall('/zone/delete', { zone_id: parseInt(geofenceId, 10) });
  }
  
  /**
   * Disconnect from Navixy
   */
  async disconnect(): Promise<void> {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    if (this.sessionHash) {
      try {
        await this.apiCall('/user/logout');
      } catch {
        // Ignore logout errors
      }
    }
    
    this.sessionHash = null;
    this.connected = false;
    this.locationCallbacks.clear();
    this.geofenceCallbacks.clear();
    
    console.log('[Navixy] Disconnected');
  }
  
  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================
  
  private ensureConnected(): void {
    if (!this.connected || !this.sessionHash) {
      throw new Error('Navixy adapter not connected. Call initialize() first.');
    }
  }
  
  private async apiCall(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hash: this.sessionHash,
        ...params,
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Navixy API error: ${data.status?.description || 'Unknown error'}`);
    }
    
    return data;
  }
  
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.config.baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
      this.websocket = new WebSocket(`${wsUrl}/tracker/webstream?hash=${this.sessionHash}`);
      
      this.websocket.onopen = () => {
        console.log('[Navixy] WebSocket connected');
        resolve();
      };
      
      this.websocket.onerror = (error) => {
        console.error('[Navixy] WebSocket error:', error);
        reject(error);
      };
      
      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'location') {
            const location = this.mapNavixyLocation(data);
            this.locationCallbacks.forEach((cb) => cb(location));
          } else if (data.type === 'zone_event') {
            const geofenceEvent: IotGeofenceEvent = {
              deviceId: data.tracker_id.toString(),
              geofenceId: data.zone_id.toString(),
              geofenceName: data.zone_name || '',
              eventType: data.event === 'enter' ? 'ENTRY' : 'EXIT',
              location: this.mapNavixyLocation(data),
              timestamp: new Date(data.timestamp),
            };
            this.geofenceCallbacks.forEach((cb) => cb(geofenceEvent));
          }
        } catch (error) {
          console.error('[Navixy] Error parsing WebSocket message:', error);
        }
      };
      
      this.websocket.onclose = () => {
        console.log('[Navixy] WebSocket disconnected');
        this.websocket = null;
      };
    });
  }
  
  private mapNavixyLocation(data: NavixyLocation | any): IotLocation {
    const loc = data.location || data;
    return {
      deviceId: (data.tracker_id || data.id || '').toString(),
      latitude: loc.lat,
      longitude: loc.lng,
      altitude: loc.alt,
      speed: loc.speed || 0,
      heading: loc.heading,
      timestamp: new Date(loc.timestamp || Date.now()),
      accuracy: loc.precision,
      satellites: loc.satellites,
      rawData: data,
    };
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a Navixy adapter instance
 * 
 * @example
 * ```typescript
 * const adapter = createNavixyAdapter({
 *   // Use Saudi-hosted endpoint for PDPL compliance
 *   baseUrl: 'https://api.sa.navixy.com/v2',
 *   auth: {
 *     username: process.env.NAVIXY_USERNAME!,
 *     password: process.env.NAVIXY_PASSWORD!,
 *   },
 * });
 * 
 * await adapter.initialize();
 * const locations = await adapter.getLocations(['123', '456']);
 * ```
 */
export function createNavixyAdapter(config: IotAdapterConfig): NavixyAdapter {
  return new NavixyAdapter(config);
}
