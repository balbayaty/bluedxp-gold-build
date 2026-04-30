/**
 * Bayan Electronic Freight Forwarder Service
 *
 * Business logic layer for Bayan EFF services
 * Integrates with Event Bus and TMS module
 */

import {
  BayanFreightForwarderAdapter,
  BayanCarrierAdapter,
} from "@/lib/adapters/bayan/adapter";
import { eventBus } from "@/lib/services/event-store";
import type {
  BayanAdapterConfig,
  CreateTripRequest,
  CreateTripResponse,
  TripDetailsDTO,
  AddWaybillDTO,
  UpdateWaybillDTO,
  WaybillResponse,
  CloseWaybillRequest,
  CancelWaybillRequest,
  CreateCarrierTripRequest,
  UpdateVehicleOrDriverRequest,
  CreateExceptionalWaybillDTO,
} from "@/types/bayan";
import type { Shipment } from "@/types/tms";

export class BayanService {
  private freightForwarderAdapter: BayanFreightForwarderAdapter;
  private carrierAdapter: BayanCarrierAdapter;
  private config: BayanAdapterConfig;

  constructor(config: BayanAdapterConfig) {
    this.config = config;
    this.freightForwarderAdapter = new BayanFreightForwarderAdapter(config);
    this.carrierAdapter = new BayanCarrierAdapter(config);
  }

  /**
   * Initialize Bayan service
   */
  async initialize(): Promise<void> {
    await this.freightForwarderAdapter.authenticate();
    await this.carrierAdapter.authenticate();
    await this.setupEventSubscriptions();
  }

  /**
   * Setup event subscriptions for cross-module integration
   */
  private async setupEventSubscriptions(): Promise<void> {
    // Subscribe to shipment events
    eventBus.subscribe("tms.shipment.created", async (event) => {
      try {
        const shipment = event.payload as Shipment;
        await this.syncShipmentToBayan(shipment);
      } catch (error) {
        console.error("[Bayan Service] Failed to sync shipment:", error);
      }
    });
  }

  // ============================================================================
  // FREIGHT FORWARDER OPERATIONS
  // ============================================================================

  /**
   * Create freight forwarder trip
   */
  async createFreightForwarderTrip(
    request: CreateTripRequest,
  ): Promise<TripDetailsDTO> {
    const response = await this.freightForwarderAdapter.createTrip(request);

    if (!response.success || !response.tripId) {
      throw new Error(response.message || "Failed to create trip");
    }

    // Get full trip details
    const trip = await this.freightForwarderAdapter.getTrip(response.tripId);
    if (!trip) {
      throw new Error("Failed to retrieve created trip");
    }

    // Emit event
    await eventBus.publish({
      type: "bayan.trip.created",
      payload: {
        trip,
        adapter: "bayan-freight-forwarder",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "bayan-service",
      },
    });

    return trip;
  }

  /**
   * Add waybill to trip
   */
  async addWaybill(request: AddWaybillDTO): Promise<WaybillResponse> {
    const response = await this.freightForwarderAdapter.addWaybill(request);

    if (!response.success) {
      throw new Error(response.message || "Failed to add waybill");
    }

    // Emit event
    await eventBus.publish({
      type: "bayan.waybill.added",
      payload: {
        waybill: response.data,
        tripId: request.tripId,
        adapter: "bayan-freight-forwarder",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "bayan-service",
      },
    });

    return response;
  }

  /**
   * Close waybill
   */
  async closeWaybill(request: CloseWaybillRequest): Promise<WaybillResponse> {
    const response = await this.freightForwarderAdapter.closeWaybill(request);

    if (!response.success) {
      throw new Error(response.message || "Failed to close waybill");
    }

    // Emit event
    await eventBus.publish({
      type: "bayan.waybill.closed",
      payload: {
        waybillId: request.waybillId,
        adapter: "bayan-freight-forwarder",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "bayan-service",
      },
    });

    return response;
  }

  // ============================================================================
  // CARRIER OPERATIONS
  // ============================================================================

  /**
   * Create carrier trip
   */
  async createCarrierTrip(
    request: CreateCarrierTripRequest,
  ): Promise<TripDetailsDTO> {
    const response = await this.carrierAdapter.createCarrierTrip(request);

    if (!response.success || !response.tripId) {
      throw new Error(response.message || "Failed to create carrier trip");
    }

    // Get full trip details
    const trip = await this.carrierAdapter.getCarrierTrip(response.tripId);
    if (!trip) {
      throw new Error("Failed to retrieve created carrier trip");
    }

    // Emit event
    await eventBus.publish({
      type: "bayan.carrier.trip.created",
      payload: {
        trip,
        adapter: "bayan-carrier",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "bayan-service",
      },
    });

    return trip;
  }

  /**
   * Create exceptional waybill
   */
  async createExceptionalWaybill(
    request: CreateExceptionalWaybillDTO,
  ): Promise<WaybillResponse> {
    const response =
      await this.carrierAdapter.createExceptionalWaybill(request);

    if (!response.success) {
      throw new Error(
        response.message || "Failed to create exceptional waybill",
      );
    }

    // Emit event
    await eventBus.publish({
      type: "bayan.waybill.exceptional.created",
      payload: {
        waybill: response.data,
        tripId: request.tripId,
        adapter: "bayan-carrier",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "bayan-service",
      },
    });

    return response;
  }

  // ============================================================================
  // SHIPMENT INTEGRATION
  // ============================================================================

  /**
   * Sync shipment to Bayan (create trip)
   */
  async syncShipmentToBayan(shipment: Shipment): Promise<TripDetailsDTO> {
    const request: CreateTripRequest = {
      vehicle: {
        vehiclePlate: {
          plateNumber: (shipment as any).vehiclePlateNumber || "",
        },
        vehicleType: (shipment as any).vehicleType,
        vehicleModel: (shipment as any).vehicleModel,
      },
      driver: {
        nationalId: (shipment as any).driverNationalId || "",
        fullName: (shipment as any).driverName || "",
        licenseNumber: (shipment as any).driverLicenseNumber,
      },
      origin: {
        address: shipment.origin.address?.street || "",
        city: shipment.origin.address?.city,
        region: shipment.origin.address?.state,
        country: shipment.origin.address?.country,
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
        country: shipment.destination.address?.country,
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
      customer: shipment.customer
        ? {
            name: shipment.customer.name || "",
            nationalId: shipment.customer.nationalId,
            commercialRegistration: shipment.customer.commercialRegistration,
            mobileNumber: shipment.customer.phone,
            email: shipment.customer.email,
            address: shipment.customer.address,
          }
        : undefined,
    };

    return this.createFreightForwarderTrip(request);
  }

  /**
   * Get freight forwarder adapter
   */
  getFreightForwarderAdapter(): BayanFreightForwarderAdapter {
    return this.freightForwarderAdapter;
  }

  /**
   * Get carrier adapter
   */
  getCarrierAdapter(): BayanCarrierAdapter {
    return this.carrierAdapter;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.freightForwarderAdapter.authenticate();
      return {
        success: true,
        message: "Bayan API connection successful",
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Bayan API connection failed: ${error.message}`,
      };
    }
  }
}
