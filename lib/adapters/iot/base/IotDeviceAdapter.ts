/**
 * IoT Device Adapter Base Interface
 * 
 * Defines the contract that all IoT GPS device adapters must implement.
 * This allows the platform to integrate with any GPS device manufacturer
 * or telematics platform through a unified interface.
 * 
 * @module adapters/iot/base
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * GPS location data from an IoT device
 */
export interface IotLocation {
  /** Unique device identifier */
  deviceId: string;
  /** Vehicle/asset identifier */
  vehicleId?: string;
  /** License plate number */
  plateNumber?: string;
  /** Latitude in decimal degrees */
  latitude: number;
  /** Longitude in decimal degrees */
  longitude: number;
  /** Altitude in meters (optional) */
  altitude?: number;
  /** Speed in km/h */
  speed: number;
  /** Heading/bearing in degrees (0-360) */
  heading?: number;
  /** Timestamp of the location fix */
  timestamp: Date;
  /** GPS accuracy in meters */
  accuracy?: number;
  /** Number of satellites used */
  satellites?: number;
  /** Is the vehicle ignition on? */
  ignitionOn?: boolean;
  /** Odometer reading in km */
  odometer?: number;
  /** Raw data from the device */
  rawData?: Record<string, unknown>;
}

/**
 * Extended telemetry data from IoT sensors
 */
export interface IotTelemetry extends IotLocation {
  /** Fuel level percentage (0-100) */
  fuelLevel?: number;
  /** Fuel consumption in liters */
  fuelConsumed?: number;
  /** Engine temperature in Celsius */
  engineTemp?: number;
  /** Coolant temperature in Celsius */
  coolantTemp?: number;
  /** Battery voltage */
  batteryVoltage?: number;
  /** External power voltage */
  externalVoltage?: number;
  /** Total engine hours */
  engineHours?: number;
  /** Driver ID (if available) */
  driverId?: string;
  /** Current cargo weight in kg (from weight sensors) */
  cargoWeight?: number;
  /** Axle weights */
  axleWeights?: number[];
  /** Temperature sensors (for reefer) */
  temperatureSensors?: {
    sensorId: string;
    temperature: number;
    zone?: string;
  }[];
  /** Door status (open/closed) */
  doorStatus?: {
    door: string;
    open: boolean;
    timestamp: Date;
  }[];
  /** Harsh driving events */
  harshEvents?: {
    type: 'HARSH_ACCELERATION' | 'HARSH_BRAKING' | 'HARSH_CORNERING' | 'IMPACT';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    gForce?: number;
    timestamp: Date;
  }[];
}

/**
 * Device status information
 */
export interface IotDeviceStatus {
  deviceId: string;
  online: boolean;
  lastSeen: Date;
  signalStrength?: number;
  batteryLevel?: number;
  firmwareVersion?: string;
  errors?: string[];
}

/**
 * Device configuration
 */
export interface IotDeviceConfig {
  /** Reporting interval in seconds */
  reportingInterval: number;
  /** Reporting interval when moving in seconds */
  movingInterval?: number;
  /** Reporting interval when stationary in seconds */
  stationaryInterval?: number;
  /** Geofence sensitivity in meters */
  geofenceSensitivity?: number;
  /** Enable harsh driving detection */
  harshDrivingDetection?: boolean;
  /** Speed limit for alerts in km/h */
  speedLimit?: number;
}

/**
 * Geofence definition for IoT device
 */
export interface IotGeofence {
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
  alertOnDwell?: boolean;
  dwellThresholdMinutes?: number;
}

/**
 * Geofence event from IoT device
 */
export interface IotGeofenceEvent {
  deviceId: string;
  geofenceId: string;
  geofenceName: string;
  eventType: 'ENTRY' | 'EXIT' | 'DWELL';
  location: IotLocation;
  timestamp: Date;
  dwellTime?: number;
}

/**
 * Adapter authentication configuration
 */
export interface IotAdapterAuth {
  /** API key or token */
  apiKey?: string;
  /** Username for basic auth */
  username?: string;
  /** Password for basic auth */
  password?: string;
  /** OAuth2 client ID */
  clientId?: string;
  /** OAuth2 client secret */
  clientSecret?: string;
  /** OAuth2 access token */
  accessToken?: string;
  /** OAuth2 refresh token */
  refreshToken?: string;
  /** Token expiry */
  tokenExpiry?: Date;
}

/**
 * Adapter configuration
 */
export interface IotAdapterConfig {
  /** Base URL of the telematics API */
  baseUrl: string;
  /** Authentication configuration */
  auth: IotAdapterAuth;
  /** Request timeout in ms */
  timeout?: number;
  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier: number;
  };
  /** Custom headers */
  headers?: Record<string, string>;
}

// ============================================================================
// ADAPTER INTERFACE
// ============================================================================

/**
 * Base interface for all IoT device adapters
 * 
 * Implementations:
 * - WialonAdapter (universal platform)
 * - NavixyAdapter (universal platform, Saudi-hosted)
 * - FlespiAdapter (universal platform)
 * - TeltonikaAdapter (direct device)
 * - QueclinkAdapter (direct device)
 * - MeitrackAdapter (direct device)
 */
export interface IIotDeviceAdapter {
  /** Adapter name/identifier */
  readonly name: string;
  
  /** Adapter version */
  readonly version: string;
  
  /** Supported device types (for direct adapters) or 'UNIVERSAL' for platforms */
  readonly supportedDevices: string[] | 'UNIVERSAL';
  
  /**
   * Initialize the adapter and authenticate
   */
  initialize(): Promise<void>;
  
  /**
   * Check if adapter is connected and authenticated
   */
  isConnected(): boolean;
  
  /**
   * Get current location for a single device
   */
  getLocation(deviceId: string): Promise<IotLocation>;
  
  /**
   * Get current locations for multiple devices
   */
  getLocations(deviceIds: string[]): Promise<IotLocation[]>;
  
  /**
   * Get all devices/vehicles
   */
  listDevices(): Promise<IotDeviceStatus[]>;
  
  /**
   * Get device status
   */
  getDeviceStatus(deviceId: string): Promise<IotDeviceStatus>;
  
  /**
   * Get extended telemetry data
   */
  getTelemetry(deviceId: string): Promise<IotTelemetry>;
  
  /**
   * Get location history for a device
   */
  getLocationHistory(
    deviceId: string,
    from: Date,
    to: Date
  ): Promise<IotLocation[]>;
  
  /**
   * Subscribe to real-time location updates
   * Returns a cleanup function to unsubscribe
   */
  subscribeToUpdates(
    deviceIds: string[],
    callback: (location: IotLocation) => void
  ): Promise<() => void>;
  
  /**
   * Subscribe to geofence events
   * Returns a cleanup function to unsubscribe
   */
  subscribeToGeofenceEvents(
    callback: (event: IotGeofenceEvent) => void
  ): Promise<() => void>;
  
  /**
   * Create a geofence on the device/platform
   */
  createGeofence?(geofence: IotGeofence): Promise<string>;
  
  /**
   * Delete a geofence
   */
  deleteGeofence?(geofenceId: string): Promise<void>;
  
  /**
   * Update device configuration
   */
  configureDevice?(
    deviceId: string,
    config: Partial<IotDeviceConfig>
  ): Promise<void>;
  
  /**
   * Send command to device (if supported)
   */
  sendCommand?(
    deviceId: string,
    command: string,
    params?: Record<string, unknown>
  ): Promise<void>;
  
  /**
   * Disconnect and cleanup
   */
  disconnect(): Promise<void>;
}

// ============================================================================
// ABSTRACT BASE ADAPTER
// ============================================================================

/**
 * Abstract base class for IoT adapters
 * Provides common functionality and enforces interface implementation
 */
export abstract class BaseIotAdapter implements IIotDeviceAdapter {
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly supportedDevices: string[] | 'UNIVERSAL';
  
  protected config: IotAdapterConfig;
  protected connected = false;
  
  constructor(config: IotAdapterConfig) {
    this.config = config;
  }
  
  abstract initialize(): Promise<void>;
  
  isConnected(): boolean {
    return this.connected;
  }
  
  abstract getLocation(deviceId: string): Promise<IotLocation>;
  abstract getLocations(deviceIds: string[]): Promise<IotLocation[]>;
  abstract listDevices(): Promise<IotDeviceStatus[]>;
  abstract getDeviceStatus(deviceId: string): Promise<IotDeviceStatus>;
  abstract getTelemetry(deviceId: string): Promise<IotTelemetry>;
  abstract getLocationHistory(
    deviceId: string,
    from: Date,
    to: Date
  ): Promise<IotLocation[]>;
  abstract subscribeToUpdates(
    deviceIds: string[],
    callback: (location: IotLocation) => void
  ): Promise<() => void>;
  abstract subscribeToGeofenceEvents(
    callback: (event: IotGeofenceEvent) => void
  ): Promise<() => void>;
  abstract disconnect(): Promise<void>;
  
  /**
   * Helper to make authenticated HTTP requests
   */
  protected async fetch(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...(options.headers as Record<string, string>),
    };
    
    // Add authentication headers based on config
    if (this.config.auth.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.auth.apiKey}`;
    } else if (this.config.auth.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.auth.accessToken}`;
    } else if (this.config.auth.username && this.config.auth.password) {
      const credentials = Buffer.from(
        `${this.config.auth.username}:${this.config.auth.password}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`IoT API error: ${response.status} ${response.statusText}`);
    }
    
    return response;
  }
}
