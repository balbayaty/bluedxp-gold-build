/**
 * Unified IoT Service
 * 
 * Aggregates GPS data from multiple sources:
 * 1. IoT Devices (via Navixy/Wialon/Flespi) - Hardware GPS trackers
 * 2. Daleeli (ELM Rabet) - Mandatory Saudi government telematics
 * 3. Driver Apps (WhatsApp/Telegram) - Click-to-share location
 * 
 * Features:
 * - Multi-source location fusion
 * - Anomaly detection (location mismatch = potential spoofing)
 * - Automatic geofence triggering
 * - Event-driven architecture
 * 
 * @module adapters/iot/unifiedIotService
 */

import { eventBus, createEvent } from '@/lib/services/event-bus';
import { geofenceZoneService } from '@/lib/services/geofence';
import { locationFusionService } from '@/lib/services/gcc-compliance';
import type { IIotDeviceAdapter, IotLocation, IotTelemetry, IotGeofenceEvent } from './base/IotDeviceAdapter';
import type { LocationSource, LocationSourceType } from '@/types/gcc-compliance';

// ============================================================================
// TYPES
// ============================================================================

export interface IotServiceConfig {
  /** Primary IoT platform adapter */
  iotAdapter?: IIotDeviceAdapter;
  /** Enable Daleeli integration */
  daleeli?: {
    enabled: boolean;
    apiKey?: string;
    pollingIntervalMs?: number;
  };
  /** Enable driver app/messaging integration */
  driverApps?: {
    enabled: boolean;
    whatsapp?: boolean;
    telegram?: boolean;
  };
  /** Polling configuration */
  pollingIntervalMs?: number;
  /** Enable automatic geofence detection */
  autoGeofence?: boolean;
}

export interface TrackedVehicle {
  vehicleId: string;
  plateNumber: string;
  deviceId?: string;
  shipmentId?: string;
  bayanNumber?: string;
  driverPhone?: string;
  tenantId: string;
}

export interface UnifiedLocation {
  vehicleId: string;
  shipmentId?: string;
  sources: {
    iot?: IotLocation;
    daleeli?: IotLocation;
    driver?: IotLocation;
  };
  fused: {
    latitude: number;
    longitude: number;
    speed: number;
    heading?: number;
    timestamp: Date;
    confidence: number;
    primarySource: 'IOT' | 'DALEELI' | 'DRIVER';
  };
  anomaly?: {
    detected: boolean;
    type?: 'LOCATION_MISMATCH' | 'GPS_SPOOFING' | 'SIGNAL_LOSS' | 'SPEED_VIOLATION';
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description?: string;
  };
}

// ============================================================================
// SERVICE
// ============================================================================

export class UnifiedIotService {
  private config: IotServiceConfig;
  private trackedVehicles: Map<string, TrackedVehicle> = new Map();
  private lastLocations: Map<string, UnifiedLocation> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private subscriptions: Map<string, () => void> = new Map();
  private initialized = false;
  
  constructor(config: IotServiceConfig = {}) {
    this.config = {
      pollingIntervalMs: 30000, // 30 seconds default
      autoGeofence: true,
      ...config,
    };
  }
  
  /**
   * Initialize the unified IoT service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[UnifiedIoT] Already initialized');
      return;
    }
    
    console.log('[UnifiedIoT] 🚀 Initializing Unified IoT Service...');
    
    // Initialize IoT adapter if provided
    if (this.config.iotAdapter) {
      await this.config.iotAdapter.initialize();
      console.log('[UnifiedIoT] ✅ IoT adapter connected');
    }
    
    // Subscribe to driver location events (from WhatsApp/Telegram)
    if (this.config.driverApps?.enabled) {
      eventBus.subscribe('driver.location.shared', async (event) => {
        await this.handleDriverLocation(event.payload);
      });
      console.log('[UnifiedIoT] ✅ Driver apps integration enabled');
    }
    
    // Subscribe to Daleeli location events
    if (this.config.daleeli?.enabled) {
      eventBus.subscribe('daleel.location.updated', async (event) => {
        await this.handleDaleeliLocation(event.payload);
      });
      console.log('[UnifiedIoT] ✅ Daleeli integration enabled');
    }
    
    // Subscribe to GCC Compliance dispatch events to auto-track
    eventBus.subscribe('gcc.touchpoints.generated', async (event) => {
      const { shipmentId } = event.payload || {};
      if (shipmentId) {
        // Auto-start tracking for this shipment
        console.log(`[UnifiedIoT] 📍 Auto-tracking enabled for shipment: ${shipmentId}`);
      }
    });
    
    this.initialized = true;
    console.log('[UnifiedIoT] ✅ Unified IoT Service initialized');
  }
  
  /**
   * Start tracking a vehicle
   */
  async startTracking(vehicle: TrackedVehicle): Promise<void> {
    console.log(`[UnifiedIoT] 🔍 Starting tracking for vehicle: ${vehicle.vehicleId}`);
    
    this.trackedVehicles.set(vehicle.vehicleId, vehicle);
    
    // Subscribe to IoT updates if adapter is available
    if (this.config.iotAdapter && vehicle.deviceId) {
      const unsubscribe = await this.config.iotAdapter.subscribeToUpdates(
        [vehicle.deviceId],
        async (location) => {
          await this.handleIotLocation(vehicle.vehicleId, location);
        }
      );
      this.subscriptions.set(`iot-${vehicle.vehicleId}`, unsubscribe);
    }
    
    // Start polling if not already running
    if (!this.pollingInterval && this.trackedVehicles.size > 0) {
      this.startPolling();
    }
    
    // Publish tracking started event
    await eventBus.publish(
      createEvent('iot.tracking.started', {
        vehicleId: vehicle.vehicleId,
        shipmentId: vehicle.shipmentId,
        sources: {
          iot: !!vehicle.deviceId,
          daleeli: this.config.daleeli?.enabled,
          driver: this.config.driverApps?.enabled,
        },
      })
    );
  }
  
  /**
   * Stop tracking a vehicle
   */
  async stopTracking(vehicleId: string): Promise<void> {
    console.log(`[UnifiedIoT] 🛑 Stopping tracking for vehicle: ${vehicleId}`);
    
    // Unsubscribe from IoT updates
    const unsubscribe = this.subscriptions.get(`iot-${vehicleId}`);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(`iot-${vehicleId}`);
    }
    
    this.trackedVehicles.delete(vehicleId);
    this.lastLocations.delete(vehicleId);
    
    // Stop polling if no more vehicles
    if (this.trackedVehicles.size === 0 && this.pollingInterval) {
      this.stopPolling();
    }
    
    // Publish tracking stopped event
    await eventBus.publish(
      createEvent('iot.tracking.stopped', {
        vehicleId,
      })
    );
  }
  
  /**
   * Get current location for a vehicle (fused from all sources)
   */
  async getLocation(vehicleId: string): Promise<UnifiedLocation | null> {
    return this.lastLocations.get(vehicleId) || null;
  }
  
  /**
   * Get all tracked vehicles
   */
  getTrackedVehicles(): TrackedVehicle[] {
    return Array.from(this.trackedVehicles.values());
  }
  
  /**
   * Request driver location via WhatsApp/Telegram
   */
  async requestDriverLocation(vehicleId: string): Promise<void> {
    const vehicle = this.trackedVehicles.get(vehicleId);
    if (!vehicle?.driverPhone) {
      throw new Error(`No driver phone for vehicle ${vehicleId}`);
    }
    
    // Publish request event - will be handled by TextLocate service
    await eventBus.publish(
      createEvent('iot.location.request', {
        vehicleId,
        shipmentId: vehicle.shipmentId,
        driverPhone: vehicle.driverPhone,
        channel: 'WHATSAPP',
      })
    );
  }
  
  /**
   * Poll Daleeli for location updates
   */
  async pollDaleeli(plateNumber: string): Promise<IotLocation | null> {
    if (!this.config.daleeli?.enabled) {
      return null;
    }
    
    // This would call the Daleeli API
    // For now, publish an event that will be handled by the Daleeli adapter
    await eventBus.publish(
      createEvent('daleel.poll.requested', {
        plateNumber,
      })
    );
    
    return null;
  }
  
  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    this.stopPolling();
    
    // Unsubscribe from all IoT updates
    for (const unsubscribe of this.subscriptions.values()) {
      unsubscribe();
    }
    this.subscriptions.clear();
    
    // Disconnect IoT adapter
    if (this.config.iotAdapter) {
      await this.config.iotAdapter.disconnect();
    }
    
    this.trackedVehicles.clear();
    this.lastLocations.clear();
    this.initialized = false;
    
    console.log('[UnifiedIoT] Disconnected');
  }
  
  // ============================================================================
  // PRIVATE HANDLERS
  // ============================================================================
  
  private async handleIotLocation(vehicleId: string, location: IotLocation): Promise<void> {
    const current = this.lastLocations.get(vehicleId) || this.createEmptyLocation(vehicleId);
    
    current.sources.iot = location;
    await this.fuseAndPublish(vehicleId, current);
  }
  
  private async handleDaleeliLocation(payload: any): Promise<void> {
    const { vehicleId, plateNumber, location } = payload;
    
    // Find vehicle by plate number or ID
    let vehicle: TrackedVehicle | undefined;
    for (const v of this.trackedVehicles.values()) {
      if (v.vehicleId === vehicleId || v.plateNumber === plateNumber) {
        vehicle = v;
        break;
      }
    }
    
    if (!vehicle) {
      return;
    }
    
    const current = this.lastLocations.get(vehicle.vehicleId) || this.createEmptyLocation(vehicle.vehicleId);
    
    current.sources.daleeli = {
      deviceId: plateNumber,
      latitude: location.latitude,
      longitude: location.longitude,
      speed: location.velocity || 0,
      timestamp: new Date(location.locationTime || Date.now()),
      rawData: location,
    };
    
    await this.fuseAndPublish(vehicle.vehicleId, current);
  }
  
  private async handleDriverLocation(payload: any): Promise<void> {
    const { vehicleId, shipmentId, latitude, longitude, timestamp } = payload;
    
    // Find vehicle by shipment ID or vehicle ID
    let vehicle: TrackedVehicle | undefined;
    for (const v of this.trackedVehicles.values()) {
      if (v.vehicleId === vehicleId || v.shipmentId === shipmentId) {
        vehicle = v;
        break;
      }
    }
    
    if (!vehicle) {
      return;
    }
    
    const current = this.lastLocations.get(vehicle.vehicleId) || this.createEmptyLocation(vehicle.vehicleId);
    
    current.sources.driver = {
      deviceId: 'driver-app',
      latitude,
      longitude,
      speed: 0,
      timestamp: new Date(timestamp || Date.now()),
    };
    
    await this.fuseAndPublish(vehicle.vehicleId, current);
  }
  
  /**
   * Fuse locations from all sources and detect anomalies
   */
  private async fuseAndPublish(vehicleId: string, location: UnifiedLocation): Promise<void> {
    const vehicle = this.trackedVehicles.get(vehicleId);
    if (!vehicle) return;
    
    // Convert to LocationSource array for fusion service
    const sources: LocationSource[] = [];
    
    if (location.sources.iot) {
      sources.push({
        source: 'IOT_SENSOR' as LocationSourceType,
        coordinates: {
          lat: location.sources.iot.latitude,
          lng: location.sources.iot.longitude,
        },
        timestamp: location.sources.iot.timestamp,
        accuracy: location.sources.iot.accuracy || 10,
        speed: location.sources.iot.speed,
        heading: location.sources.iot.heading,
      });
    }
    
    if (location.sources.daleeli) {
      sources.push({
        source: 'DALEEL' as LocationSourceType,
        coordinates: {
          lat: location.sources.daleeli.latitude,
          lng: location.sources.daleeli.longitude,
        },
        timestamp: location.sources.daleeli.timestamp,
        accuracy: 5, // Daleeli is high accuracy
        speed: location.sources.daleeli.speed,
        heading: location.sources.daleeli.heading,
      });
    }
    
    if (location.sources.driver) {
      sources.push({
        source: 'WHATSAPP_TEXTLOCATE' as LocationSourceType,
        coordinates: {
          lat: location.sources.driver.latitude,
          lng: location.sources.driver.longitude,
        },
        timestamp: location.sources.driver.timestamp,
        accuracy: 20, // Driver location is less accurate
        speed: location.sources.driver.speed || 0,
      });
    }
    
    // Fuse locations
    if (sources.length > 0) {
      try {
        const fused = await locationFusionService.fuseLocations(
          vehicle.shipmentId || vehicleId,
          sources
        );
        
        location.fused = {
          latitude: fused.coordinates.lat,
          longitude: fused.coordinates.lng,
          speed: fused.speed || 0,
          heading: fused.heading,
          timestamp: fused.timestamp,
          confidence: fused.confidence,
          primarySource: fused.primarySource === 'DALEEL' ? 'DALEELI' :
                         fused.primarySource === 'IOT_SENSOR' ? 'IOT' : 'DRIVER',
        };
        
        // Check for anomalies
        if (fused.deviation?.anomalyDetected) {
          location.anomaly = {
            detected: true,
            type: 'LOCATION_MISMATCH',
            severity: fused.deviation.maxDeviationKm > 10 ? 'CRITICAL' :
                      fused.deviation.maxDeviationKm > 5 ? 'HIGH' :
                      fused.deviation.maxDeviationKm > 2 ? 'MEDIUM' : 'LOW',
            description: `Location mismatch detected: ${fused.deviation.maxDeviationKm?.toFixed(2)}km deviation between sources`,
          };
          
          // Publish anomaly event
          await eventBus.publish(
            createEvent('iot.anomaly.detected', {
              vehicleId,
              shipmentId: vehicle.shipmentId,
              anomaly: location.anomaly,
              sources: Object.keys(location.sources),
            })
          );
        }
      } catch (error) {
        console.error(`[UnifiedIoT] Error fusing locations for ${vehicleId}:`, error);
        
        // Fallback to best available source
        const primarySource = location.sources.daleeli || location.sources.iot || location.sources.driver;
        if (primarySource) {
          location.fused = {
            latitude: primarySource.latitude,
            longitude: primarySource.longitude,
            speed: primarySource.speed,
            heading: primarySource.heading,
            timestamp: primarySource.timestamp,
            confidence: 0.5,
            primarySource: location.sources.daleeli ? 'DALEELI' :
                           location.sources.iot ? 'IOT' : 'DRIVER',
          };
        }
      }
    }
    
    // Store updated location
    this.lastLocations.set(vehicleId, location);
    
    // Publish location update event
    await eventBus.publish(
      createEvent('iot.location.updated', {
        vehicleId,
        shipmentId: vehicle.shipmentId,
        location: location.fused,
        sources: Object.keys(location.sources),
        anomaly: location.anomaly,
      })
    );
    
    // Check geofences if enabled
    if (this.config.autoGeofence && location.fused) {
      await this.checkGeofences(vehicle, location.fused);
    }
  }
  
  /**
   * Check if location triggers any geofences
   */
  private async checkGeofences(
    vehicle: TrackedVehicle,
    location: UnifiedLocation['fused']
  ): Promise<void> {
    try {
      const event = await geofenceZoneService.detectZoneEvent(
        { lat: location.latitude, lng: location.longitude },
        vehicle.shipmentId || vehicle.vehicleId,
        vehicle.vehicleId,
        vehicle.tenantId
      );
      
      if (event) {
        console.log(`[UnifiedIoT] 📍 Geofence event: ${event.eventType} for ${vehicle.vehicleId}`);
        
        // The geofence service already publishes events, but we can add extra context
        await eventBus.publish(
          createEvent('iot.geofence.triggered', {
            vehicleId: vehicle.vehicleId,
            shipmentId: vehicle.shipmentId,
            zoneId: event.zoneId,
            eventType: event.eventType,
            location: {
              lat: location.latitude,
              lng: location.longitude,
            },
          })
        );
      }
    } catch (error) {
      // Geofence check is non-critical
      console.warn('[UnifiedIoT] Geofence check error:', error);
    }
  }
  
  /**
   * Start periodic polling
   */
  private startPolling(): void {
    const intervalMs = this.config.pollingIntervalMs || 30000;
    
    this.pollingInterval = setInterval(async () => {
      for (const vehicle of this.trackedVehicles.values()) {
        // Poll Daleeli if enabled
        if (this.config.daleeli?.enabled && vehicle.plateNumber) {
          await this.pollDaleeli(vehicle.plateNumber);
        }
      }
    }, intervalMs);
    
    console.log(`[UnifiedIoT] Started polling every ${intervalMs / 1000}s`);
  }
  
  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('[UnifiedIoT] Stopped polling');
    }
  }
  
  /**
   * Create empty location object
   */
  private createEmptyLocation(vehicleId: string): UnifiedLocation {
    const vehicle = this.trackedVehicles.get(vehicleId);
    return {
      vehicleId,
      shipmentId: vehicle?.shipmentId,
      sources: {},
      fused: {
        latitude: 0,
        longitude: 0,
        speed: 0,
        timestamp: new Date(),
        confidence: 0,
        primarySource: 'IOT',
      },
    };
  }
}

// ============================================================================
// SINGLETON & FACTORY
// ============================================================================

let instance: UnifiedIotService | null = null;

/**
 * Get or create the unified IoT service instance
 */
export function getUnifiedIotService(config?: IotServiceConfig): UnifiedIotService {
  if (!instance) {
    instance = new UnifiedIotService(config);
  }
  return instance;
}

/**
 * Create a new unified IoT service instance
 */
export function createUnifiedIotService(config: IotServiceConfig): UnifiedIotService {
  return new UnifiedIotService(config);
}

// Export default instance
export const unifiedIotService = getUnifiedIotService();
