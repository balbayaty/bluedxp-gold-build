/**
 * WASL Service Layer
 *
 * Business logic layer for WASL (Electronic Freight Forwarder) integration
 * Provides high-level operations and integrates with Event Bus
 */

import { WaslEFFAdapter } from "@/lib/adapters/wasl/adapter";
import { WaslTransportationAdapter } from "@/lib/adapters/wasl/transportationAdapter";
import { eventBus } from "@/lib/services/event-store";
import type {
  WaslAdapterConfig,
  WaslVehicle,
  WaslDriver,
  WaslTrip,
  EffVehicleCreateDto,
  EffDriverCreateDto,
  EffTripCreateDto,
  EffTripUpdateDto,
} from "@/types/wasl";
import type { Shipment } from "@/types/tms";

export class WaslService {
  private effAdapter: WaslEFFAdapter;
  private transportationAdapter: WaslTransportationAdapter;
  private config: WaslAdapterConfig;

  constructor(config: WaslAdapterConfig) {
    this.config = config;
    this.effAdapter = new WaslEFFAdapter(config);
    this.transportationAdapter = new WaslTransportationAdapter(config);
  }

  /**
   * Initialize WASL service
   */
  async initialize(): Promise<void> {
    await this.effAdapter.authenticate();
    await this.setupEventSubscriptions();
  }

  /**
   * Setup event subscriptions for cross-module integration
   */
  private async setupEventSubscriptions(): Promise<void> {
    // Subscribe to TMS events to auto-register trips
    eventBus.subscribe("tms.shipment.created", async (event) => {
      try {
        const shipment = event.payload as Shipment;
        await this.syncShipmentToWasl(shipment);
      } catch (error) {
        console.error("[WASL Service] Failed to sync shipment to WASL:", error);
      }
    });

    // Subscribe to shipment updates
    eventBus.subscribe("tms.shipment.updated", async (event) => {
      try {
        const shipment = event.payload as Shipment;
        await this.updateTripFromShipment(shipment);
      } catch (error) {
        console.error("[WASL Service] Failed to update trip in WASL:", error);
      }
    });
  }

  // ============================================================================
  // VEHICLE MANAGEMENT
  // ============================================================================

  /**
   * Register vehicle in WASL
   */
  async registerVehicle(vehicle: EffVehicleCreateDto): Promise<WaslVehicle> {
    const response = await this.effAdapter.registerVehicle(vehicle);

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to register vehicle");
    }

    // Emit event
    await eventBus.publish({
      type: "wasl.vehicle.registered",
      payload: {
        vehicle: response.data,
        adapter: "wasl-eff",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "wasl-service",
      },
    });

    return {
      plateNumber: response.data.plateNumber,
      plateType: response.data.plateType,
      plateCode: response.data.plateCode,
      vehicleType: vehicle.vehicleType,
      vehicleModel: vehicle.vehicleModel,
      vehicleYear: vehicle.vehicleYear,
      ownerName: vehicle.ownerName,
      ownerNationalId: vehicle.ownerNationalId,
      registrationExpiryDate: vehicle.registrationExpiryDate,
      insuranceExpiryDate: vehicle.insuranceExpiryDate,
      status: "ACTIVE",
      registeredAt: new Date().toISOString(),
    };
  }

  /**
   * Delete vehicle from WASL
   */
  async deleteVehicle(
    plateNumber: string,
    plateType?: string,
    plateCode?: string,
  ): Promise<void> {
    const response = await this.effAdapter.deleteVehicle({
      plateNumber,
      plateType,
      plateCode,
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to delete vehicle");
    }

    // Emit event
    await eventBus.publish({
      type: "wasl.vehicle.deleted",
      payload: {
        plateNumber,
        adapter: "wasl-eff",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "wasl-service",
      },
    });
  }

  // ============================================================================
  // DRIVER MANAGEMENT
  // ============================================================================

  /**
   * Register driver in WASL
   */
  async registerDriver(driver: EffDriverCreateDto): Promise<WaslDriver> {
    const response = await this.effAdapter.registerDriver(driver);

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to register driver");
    }

    // Emit event
    await eventBus.publish({
      type: "wasl.driver.registered",
      payload: {
        driver: response.data,
        adapter: "wasl-eff",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "wasl-service",
      },
    });

    return {
      nationalId: response.data.nationalId,
      fullName: driver.fullName,
      mobileNumber: driver.mobileNumber,
      email: driver.email,
      licenseNumber: driver.licenseNumber,
      licenseType: driver.licenseType,
      licenseExpiryDate: driver.licenseExpiryDate,
      status: "ACTIVE",
      registeredAt: new Date().toISOString(),
    };
  }

  /**
   * Delete driver from WASL
   */
  async deleteDriver(nationalId: string): Promise<void> {
    const response = await this.effAdapter.deleteDriver({ nationalId });

    if (!response.success) {
      throw new Error(response.message || "Failed to delete driver");
    }

    // Emit event
    await eventBus.publish({
      type: "wasl.driver.deleted",
      payload: {
        nationalId,
        adapter: "wasl-eff",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "wasl-service",
      },
    });
  }

  // ============================================================================
  // TRIP MANAGEMENT
  // ============================================================================

  /**
   * Register trip in WASL
   */
  async registerTrip(trip: EffTripCreateDto): Promise<WaslTrip> {
    const response = await this.effAdapter.registerTrip(trip);

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to register trip");
    }

    // Get full trip data
    const tripResponse = await this.effAdapter.getTrip(
      response.data.tripNumber,
    );

    if (!tripResponse.success || !tripResponse.data) {
      throw new Error("Failed to retrieve registered trip");
    }

    const waslTrip: WaslTrip = {
      tripNumber: response.data.tripNumber,
      vehiclePlate: trip.vehiclePlate,
      driverNationalId: trip.driverNationalId,
      origin: trip.origin,
      destination: trip.destination,
      plannedStartDate: trip.plannedStartDate,
      plannedEndDate: trip.plannedEndDate,
      status: "PENDING",
      cargoDescription: trip.cargoDescription,
      cargoWeight: trip.cargoWeight,
      cargoValue: trip.cargoValue,
      tripType: trip.tripType,
      registeredAt: new Date().toISOString(),
    };

    // Emit event
    await eventBus.publish({
      type: "wasl.trip.registered",
      payload: {
        trip: waslTrip,
        adapter: "wasl-eff",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "wasl-service",
      },
    });

    return waslTrip;
  }

  /**
   * Update trip in WASL
   */
  async updateTrip(
    tripNumber: string,
    updates: EffTripUpdateDto,
  ): Promise<WaslTrip> {
    const response = await this.effAdapter.updateTrip(tripNumber, updates);

    if (!response.success) {
      throw new Error(response.message || "Failed to update trip");
    }

    // Get updated trip
    const tripResponse = await this.effAdapter.getTrip(tripNumber);

    if (!tripResponse.success || !tripResponse.data) {
      throw new Error("Failed to retrieve updated trip");
    }

    const waslTrip = tripResponse.data as WaslTrip;

    // Emit event
    await eventBus.publish({
      type: "wasl.trip.updated",
      payload: {
        trip: waslTrip,
        adapter: "wasl-eff",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "wasl-service",
      },
    });

    return waslTrip;
  }

  /**
   * Get trip from WASL
   */
  async getTrip(tripNumber: string): Promise<WaslTrip | null> {
    const response = await this.effAdapter.getTrip(tripNumber);

    if (!response.success || !response.data) {
      return null;
    }

    return response.data as WaslTrip;
  }

  // ============================================================================
  // SHIPMENT INTEGRATION
  // ============================================================================

  /**
   * Sync shipment to WASL (register as trip)
   */
  async syncShipmentToWasl(shipment: Shipment): Promise<WaslTrip> {
    const trip: EffTripCreateDto = {
      tripNumber: shipment.shipmentNumber || shipment.id,
      vehiclePlate: {
        plateNumber: (shipment as any).vehiclePlateNumber || "",
      },
      driverNationalId: (shipment as any).driverNationalId || "",
      origin: {
        address: shipment.origin.address?.street || "",
        city: shipment.origin.address?.city,
        region: shipment.origin.address?.state,
        coordinates: shipment.origin.coordinates
          ? {
              latitude: shipment.origin.coordinates.lat,
              longitude: shipment.origin.coordinates.lng,
            }
          : undefined,
      },
      destination: {
        address: shipment.destination.address?.street || "",
        city: shipment.destination.address?.city,
        region: shipment.destination.address?.state,
        coordinates: shipment.destination.coordinates
          ? {
              latitude: shipment.destination.coordinates.lat,
              longitude: shipment.destination.coordinates.lng,
            }
          : undefined,
      },
      plannedStartDate: shipment.plannedPickupDate
        ? new Date(shipment.plannedPickupDate).toISOString()
        : new Date().toISOString(),
      plannedEndDate: shipment.plannedDeliveryDate
        ? new Date(shipment.plannedDeliveryDate).toISOString()
        : undefined,
      cargoDescription: shipment.description,
      cargoWeight: shipment.totalWeight,
      cargoValue: shipment.declaredValue,
    };

    return this.registerTrip(trip);
  }

  /**
   * Update trip from shipment changes
   */
  async updateTripFromShipment(shipment: Shipment): Promise<WaslTrip> {
    const updates: EffTripUpdateDto = {
      tripNumber: shipment.shipmentNumber || shipment.id,
    };

    // Map status
    if (shipment.status) {
      const statusMap: Record<
        string,
        "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
      > = {
        DRAFT: "PENDING",
        BOOKED: "PENDING",
        PICKED_UP: "IN_PROGRESS",
        IN_TRANSIT: "IN_PROGRESS",
        DELIVERED: "COMPLETED",
        CANCELLED: "CANCELLED",
      };
      updates.status = statusMap[shipment.status] || "PENDING";
    }

    // Map dates
    if (shipment.actualPickupDate) {
      updates.actualStartDate = new Date(
        shipment.actualPickupDate,
      ).toISOString();
    }
    if (shipment.actualDeliveryDate) {
      updates.actualEndDate = new Date(
        shipment.actualDeliveryDate,
      ).toISOString();
    }

    // Map location
    if (shipment.currentLocation) {
      updates.currentLocation = {
        address: shipment.currentLocation.address?.street || "",
        city: shipment.currentLocation.address?.city,
        region: shipment.currentLocation.address?.state,
        coordinates: shipment.currentLocation.coordinates
          ? {
              latitude: shipment.currentLocation.coordinates.lat,
              longitude: shipment.currentLocation.coordinates.lng,
            }
          : undefined,
        timestamp: new Date().toISOString(),
      };
    }

    return this.updateTrip(updates.tripNumber, updates);
  }

  /**
   * Get transportation adapter (for TMS integration)
   */
  getTransportationAdapter(): WaslTransportationAdapter {
    return this.transportationAdapter;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    return this.effAdapter.testConnection();
  }
}
