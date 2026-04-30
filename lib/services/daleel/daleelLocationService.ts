/**
 * Daleel Location Tracking Service
 *
 * Business logic layer for Daleel real-time location tracking
 * Integrates with Event Bus and existing tracking infrastructure
 */

import { DaleelLocationAdapter } from "@/lib/adapters/daleel/locationAdapter";
import { eventBus } from "@/lib/services/event-store";
import type {
  DaleelAdapterConfig,
  VehiclePlate,
  VehicleLocationDTO,
  VehicleLocationDetailsDTO,
  DaleelTrackingData,
} from "@/types/daleel";
import type { TrackingEvent, Location } from "@/types/tms";

export class DaleelLocationService {
  private locationAdapter: DaleelLocationAdapter;
  private config: DaleelAdapterConfig;
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private trackedVehicles: Set<string> = new Set();

  constructor(config: DaleelAdapterConfig) {
    this.config = config;
    this.locationAdapter = new DaleelLocationAdapter(config);
  }

  /**
   * Initialize Daleel location service
   */
  async initialize(): Promise<void> {
    await this.locationAdapter.authenticate();
    await this.setupEventSubscriptions();
  }

  /**
   * Setup event subscriptions for cross-module integration
   */
  private async setupEventSubscriptions(): Promise<void> {
    // Subscribe to shipment events to start tracking
    eventBus.subscribe("tms.shipment.created", async (event) => {
      try {
        const shipment = event.payload as any;
        const vehiclePlate = shipment.vehiclePlateNumber;
        if (vehiclePlate) {
          await this.startTracking(vehiclePlate);
        }
      } catch (error) {
        console.error("[Daleel Service] Failed to start tracking:", error);
      }
    });

    // Subscribe to shipment completion to stop tracking
    eventBus.subscribe("tms.shipment.delivered", async (event) => {
      try {
        const shipment = event.payload as any;
        const vehiclePlate = shipment.vehiclePlateNumber;
        if (vehiclePlate) {
          await this.stopTracking(vehiclePlate);
        }
      } catch (error) {
        console.error("[Daleel Service] Failed to stop tracking:", error);
      }
    });
  }

  // ============================================================================
  // REAL-TIME TRACKING
  // ============================================================================

  /**
   * Start real-time tracking for a vehicle
   */
  async startTracking(vehiclePlate: VehiclePlate | string): Promise<void> {
    const plateKey =
      typeof vehiclePlate === "string"
        ? vehiclePlate
        : `${vehiclePlate.plateNumber}-${vehiclePlate.plateType || ""}`;

    if (this.trackedVehicles.has(plateKey)) {
      return; // Already tracking
    }

    this.trackedVehicles.add(plateKey);

    const plate: VehiclePlate =
      typeof vehiclePlate === "string"
        ? { plateNumber: vehiclePlate }
        : vehiclePlate;

    // Start polling for location updates
    const interval = this.config.pollingInterval || 30000; // Default 30 seconds
    const pollingId = setInterval(async () => {
      try {
        const location =
          await this.locationAdapter.getCurrentLocationDetails(plate);
        if (location.success && location.data) {
          await this.handleLocationUpdate(plate, location.data);
        }
      } catch (error) {
        console.error(
          `[Daleel Service] Error polling location for ${plateKey}:`,
          error,
        );
      }
    }, interval);

    this.pollingIntervals.set(plateKey, pollingId);

    // Get initial location
    try {
      const initialLocation =
        await this.locationAdapter.getCurrentLocationDetails(plate);
      if (initialLocation.success && initialLocation.data) {
        await this.handleLocationUpdate(plate, initialLocation.data);
      }
    } catch (error) {
      console.error(
        `[Daleel Service] Error getting initial location for ${plateKey}:`,
        error,
      );
    }
  }

  /**
   * Stop real-time tracking for a vehicle
   */
  async stopTracking(vehiclePlate: VehiclePlate | string): Promise<void> {
    const plateKey =
      typeof vehiclePlate === "string"
        ? vehiclePlate
        : `${vehiclePlate.plateNumber}-${vehiclePlate.plateType || ""}`;

    const interval = this.pollingIntervals.get(plateKey);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(plateKey);
    }

    this.trackedVehicles.delete(plateKey);
  }

  /**
   * Handle location update from polling
   */
  private async handleLocationUpdate(
    vehiclePlate: VehiclePlate,
    location: VehicleLocationDetailsDTO,
  ): Promise<void> {
    // Emit event for real-time tracking
    await eventBus.publish({
      type: "daleel.location.updated",
      payload: {
        vehiclePlate,
        location,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "daleel-location-service",
      },
    });

    // Also emit transportation event for TMS integration
    await eventBus.publish({
      type: "transportation.shipment.location.updated",
      payload: {
        vehiclePlate: vehiclePlate.plateNumber,
        location: {
          lat: location.location.latitude,
          lng: location.location.longitude,
          address: location.address,
          city: location.city,
          region: location.region,
          timestamp: location.timestamp,
        },
        speed: location.speed,
        heading: location.heading,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "daleel-location-service",
      },
    });
  }

  // ============================================================================
  // LOCATION QUERIES
  // ============================================================================

  /**
   * Get current location of a vehicle
   */
  async getCurrentLocation(
    vehiclePlate: VehiclePlate,
  ): Promise<VehicleLocationDTO | null> {
    const response =
      await this.locationAdapter.getCurrentLocation(vehiclePlate);
    return response.success && response.data ? response.data : null;
  }

  /**
   * Get current location with details
   */
  async getCurrentLocationDetails(
    vehiclePlate: VehiclePlate,
  ): Promise<VehicleLocationDetailsDTO | null> {
    const response =
      await this.locationAdapter.getCurrentLocationDetails(vehiclePlate);
    return response.success && response.data ? response.data : null;
  }

  /**
   * Get location history for a vehicle
   */
  async getLocationHistory(
    vehiclePlate: VehiclePlate,
    startDate: Date,
    endDate: Date,
  ): Promise<VehicleLocationDTO[]> {
    const response = await this.locationAdapter.getLocationHistory(
      vehiclePlate,
      startDate.toISOString(),
      endDate.toISOString(),
    );
    return response.success && response.data ? response.data : [];
  }

  /**
   * Get current and historical location
   */
  async getCurrentAndHistory(
    vehiclePlate: VehiclePlate,
    startDate: Date,
    endDate: Date,
  ): Promise<DaleelTrackingData | null> {
    const response = await this.locationAdapter.getCurrentAndHistory(
      vehiclePlate,
      startDate.toISOString(),
      endDate.toISOString(),
    );

    if (!response.success || !response.data) {
      return null;
    }

    return {
      vehiclePlate,
      currentLocation:
        response.data.current ||
        response.data.history[response.data.history.length - 1],
      history: response.data.history,
      lastUpdate: new Date().toISOString(),
      speed: response.data.current?.speed,
      heading: response.data.current?.heading,
      address: response.data.current?.address,
    };
  }

  /**
   * Get tracking events for TMS integration
   */
  async getTrackingEvents(
    vehiclePlate: VehiclePlate,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TrackingEvent[]> {
    const start = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const end = endDate || new Date();

    const history = await this.getLocationHistory(vehiclePlate, start, end);
    const current = await this.getCurrentLocationDetails(vehiclePlate);

    const events: TrackingEvent[] = [];

    // Add historical events
    for (const location of history) {
      events.push({
        id: `${vehiclePlate.plateNumber}-${location.timestamp}`,
        shipmentId: vehiclePlate.plateNumber, // Use plate as shipment ID
        timestamp: new Date(location.timestamp),
        status: "IN_TRANSIT",
        location: this.mapDaleelLocationToLocation(location),
        description: `Location update at ${location.address || "Unknown"}`,
      });
    }

    // Add current location if available
    if (current) {
      events.push({
        id: `${vehiclePlate.plateNumber}-current`,
        shipmentId: vehiclePlate.plateNumber,
        timestamp: new Date(current.timestamp),
        status: "IN_TRANSIT",
        location: this.mapDaleelLocationToLocation(current),
        description: "Current location",
      });
    }

    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // ============================================================================
  // MAPPING FUNCTIONS
  // ============================================================================

  private mapDaleelLocationToLocation(
    daleelLocation: VehicleLocationDTO | VehicleLocationDetailsDTO,
  ): Location {
    return {
      id: `${daleelLocation.vehiclePlate.plateNumber}-${daleelLocation.timestamp}`,
      name: daleelLocation.address || "Unknown Location",
      type: "WAREHOUSE",
      address: {
        street: daleelLocation.address || "",
        city: daleelLocation.city || "",
        state: daleelLocation.region,
        postalCode: "",
        country: "Saudi Arabia",
        countryCode: "SA",
      },
      coordinates: {
        lat: daleelLocation.location.latitude,
        lng: daleelLocation.location.longitude,
      },
    };
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    return this.locationAdapter.testConnection();
  }
}
