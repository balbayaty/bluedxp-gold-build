/**
 * ETW (e-Waybill) Integration Service for Transportation Module
 *
 * Deep integration between Transportation and ETW modules:
 * - Auto-create ETW when shipment is created
 * - Auto-link ETW to shipments
 * - Sync status between ETW and shipments
 * - ETW data enrichment for shipments
 *
 * 4IR & 5IR Aligned - Complete Ecosystem Integration
 */

import type { Shipment } from "@/types/tms";
import type { ETW, ETWStatus } from "@/types/etw";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";
import { transportationDatabaseAdapterInstance } from "./database/transportationDatabaseAdapter";

// ============================================================================
// TYPES
// ============================================================================

export interface ETWIntegration {
  // Auto-create ETW from shipment
  autoCreateETWFromShipment(shipment: Shipment): Promise<ETW | null>;

  // Link existing ETW to shipment
  linkETWToShipment(
    etwId: string,
    shipmentId: string,
    tenantId: string,
  ): Promise<void>;

  // Get ETW for shipment
  getETWForShipment(shipmentId: string, tenantId: string): Promise<ETW | null>;

  // Sync ETW status to shipment
  syncETWStatusToShipment(
    etwId: string,
    shipmentId: string,
    tenantId: string,
  ): Promise<void>;

  // Sync shipment status to ETW
  syncShipmentStatusToETW(
    shipmentId: string,
    etwId: string,
    tenantId: string,
  ): Promise<void>;

  // Check if ETW is required for shipment
  isETWRequired(shipment: Shipment): boolean;
}

// ============================================================================
// SERVICE
// ============================================================================

export class ETWIntegrationService implements ETWIntegration {
  /**
   * Auto-create ETW from shipment
   */
  async autoCreateETWFromShipment(shipment: Shipment): Promise<ETW | null> {
    if (!shipment.tenantId) {
      throw new Error("Tenant ID is required");
    }

    // Check if ETW is required
    if (!this.isETWRequired(shipment)) {
      return null;
    }

    try {
      // Import ETW service dynamically to avoid circular dependencies
      const { etwService } = await import("@/lib/services/etw/etwService");

      // Create ETW from shipment data
      const etwData = {
        tenantId: shipment.tenantId,
        shipmentId: shipment.id,
        scope: this.mapShipmentToETWScope(shipment),
        mode: this.mapShipmentModeToETWMode(shipment.mode),
        references: {
          shipmentNumber: shipment.shipmentNumber,
          customerReference: shipment.shipmentNumber,
          internalReference: shipment.id,
        },
        parties: this.mapShipmentToETWParties(shipment),
        cargo: this.mapShipmentToETWCargo(shipment),
        route: this.mapShipmentToETWRoute(shipment),
        commercial: this.mapShipmentToETWCommercial(shipment),
        compliance: this.mapShipmentToETWCompliance(shipment),
        createdBy: shipment.createdBy || "system",
      };

      const etw = await etwService.create(etwData as any);

      // Link ETW to shipment
      await this.linkETWToShipment(etw.id, shipment.id, shipment.tenantId);

      // Publish event
      await eventBus.publish(
        createEvent(
          "transportation.etw.auto_created",
          shipment.id,
          "Shipment",
          {
            shipmentId: shipment.id,
            etwId: etw.id,
            etwNumber: etw.etwNumber,
          },
          1,
          {
            tenantId: shipment.tenantId,
            userId: shipment.createdBy || "system",
          },
        ),
      );

      return etw;
    } catch (error) {
      console.error("Error auto-creating ETW from shipment:", error);
      // Don't fail shipment creation if ETW creation fails
      return null;
    }
  }

  /**
   * Link ETW to shipment
   */
  async linkETWToShipment(
    etwId: string,
    shipmentId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      // Import ETW service
      const { etwService } = await import("@/lib/services/etw/etwService");

      // Link via ETW service
      await etwService.linkToShipment(etwId, shipmentId, tenantId);

      // Update shipment with ETW reference
      const shipment = await transportationDatabaseAdapterInstance.getShipment(
        tenantId,
        shipmentId,
      );
      if (shipment) {
        // Store ETW reference in shipment metadata or custom field
        // Note: This would require adding etwId to Shipment type or using metadata
        await eventBus.publish(
          createEvent(
            "transportation.shipment.etw.linked",
            shipmentId,
            "Shipment",
            {
              shipmentId,
              etwId,
            },
            1,
            {
              tenantId,
              userId: "system",
            },
          ),
        );
      }
    } catch (error) {
      console.error("Error linking ETW to shipment:", error);
      throw error;
    }
  }

  /**
   * Get ETW for shipment
   */
  async getETWForShipment(
    shipmentId: string,
    tenantId: string,
  ): Promise<ETW | null> {
    try {
      const { etwService } = await import("@/lib/services/etw/etwService");

      // List ETWs filtered by shipmentId
      const result = await etwService.list({
        tenantId,
        shipmentId,
        limit: 1,
        offset: 0,
      });

      return result.etws.length > 0 ? result.etws[0] : null;
    } catch (error) {
      console.error("Error getting ETW for shipment:", error);
      return null;
    }
  }

  /**
   * Sync ETW status to shipment
   */
  async syncETWStatusToShipment(
    etwId: string,
    shipmentId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      const { etwService } = await import("@/lib/services/etw/etwService");
      const etw = await etwService.get(etwId, tenantId);

      if (!etw) {
        return;
      }

      const shipment = await transportationDatabaseAdapterInstance.getShipment(
        tenantId,
        shipmentId,
      );
      if (!shipment) {
        return;
      }

      // Map ETW status to shipment status
      const newShipmentStatus = this.mapETWStatusToShipmentStatus(etw.status);

      if (newShipmentStatus && newShipmentStatus !== shipment.status) {
        // Update shipment status
        const updatedShipment: Shipment = {
          ...shipment,
          status: newShipmentStatus,
          updatedAt: new Date().toISOString(),
        };

        await transportationDatabaseAdapterInstance.storeShipment(
          updatedShipment,
          {
            tenantId,
            createdBy: shipment.createdBy || "system",
          },
        );

        // Publish event
        await eventBus.publish(
          createEvent(
            "transportation.shipment.status.updated_from_etw",
            shipmentId,
            "Shipment",
            {
              shipmentId,
              etwId,
              oldStatus: shipment.status,
              newStatus: newShipmentStatus,
              etwStatus: etw.status,
            },
            1,
            {
              tenantId,
              userId: "system",
            },
          ),
        );
      }
    } catch (error) {
      console.error("Error syncing ETW status to shipment:", error);
    }
  }

  /**
   * Sync shipment status to ETW
   */
  async syncShipmentStatusToETW(
    shipmentId: string,
    etwId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      const { etwService } = await import("@/lib/services/etw/etwService");
      const shipment = await transportationDatabaseAdapterInstance.getShipment(
        tenantId,
        shipmentId,
      );

      if (!shipment) {
        return;
      }

      const etw = await etwService.get(etwId, tenantId);
      if (!etw) {
        return; // ETW not found, cannot sync
      }

      // Map shipment status to ETW status
      const newETWStatus = this.mapShipmentStatusToETWStatus(shipment.status);

      if (newETWStatus && newETWStatus !== etw.status) {
        await etwService.updateStatus(
          etwId,
          newETWStatus,
          tenantId,
          shipment.createdBy || "system",
        );

        // Publish event
        await eventBus.publish(
          createEvent(
            "etw.status.updated_from_shipment",
            etwId,
            "ETW",
            {
              etwId,
              shipmentId,
              oldStatus: etw.status,
              newStatus: newETWStatus,
              shipmentStatus: shipment.status,
            },
            1,
            {
              tenantId,
              userId: shipment.createdBy || "system",
            },
          ),
        );
      }
    } catch (error) {
      console.error("Error syncing shipment status to ETW:", error);
    }
  }

  /**
   * Check if ETW is required for shipment
   */
  isETWRequired(shipment: Shipment): boolean {
    // ETW is typically required for:
    // - Cross-border shipments
    // - Certain cargo types
    // - Regulatory requirements

    // Check if origin and destination are in different countries
    const originCountry = shipment.origin?.address?.country;
    const destinationCountry = shipment.destination?.address?.country;

    if (
      originCountry &&
      destinationCountry &&
      originCountry !== destinationCountry
    ) {
      return true; // Cross-border shipment
    }

    // Check for hazmat or special cargo
    if (shipment.hazmat || shipment.specialHandling) {
      return true;
    }

    // Check mode - some modes require ETW
    if (["ROAD", "MULTIMODAL"].includes(shipment.mode)) {
      return true;
    }

    return false;
  }

  // ============================================================================
  // MAPPING FUNCTIONS
  // ============================================================================

  private mapShipmentToETWScope(
    shipment: Shipment,
  ): "LOCAL" | "INTERCITY" | "CROSS_BORDER" | "MULTIMODAL" {
    const originCountry = shipment.origin?.address?.country;
    const destinationCountry = shipment.destination?.address?.country;

    if (shipment.mode === "MULTIMODAL") {
      return "MULTIMODAL";
    }

    if (
      originCountry &&
      destinationCountry &&
      originCountry !== destinationCountry
    ) {
      return "CROSS_BORDER";
    }

    // Check if same city (LOCAL) or different city (INTERCITY)
    const originCity = shipment.origin?.address?.city;
    const destinationCity = shipment.destination?.address?.city;

    if (originCity && destinationCity && originCity === destinationCity) {
      return "LOCAL";
    }

    return "INTERCITY";
  }

  private mapShipmentModeToETWMode(
    shipmentMode: Shipment["mode"],
  ): "AIR" | "SEA" | "LAND" | "RAIL" | "MULTIMODAL" | "EXPRESS" | "COURIER" {
    const mapping: Record<
      Shipment["mode"],
      "AIR" | "SEA" | "LAND" | "RAIL" | "MULTIMODAL" | "EXPRESS" | "COURIER"
    > = {
      AIR: "AIR",
      SEA: "SEA",
      ROAD: "LAND",
      RAIL: "RAIL",
      MULTIMODAL: "MULTIMODAL",
      EXPRESS: "EXPRESS",
      COURIER: "COURIER",
    };
    return mapping[shipmentMode] || "LAND";
  }

  private mapShipmentToETWParties(shipment: Shipment): any[] {
    // Map shipment parties to ETW parties format (matching PartySchema)
    const parties: any[] = [
      {
        id: `consignor-${shipment.id}`,
        type: "SHIPPER" as const,
        name:
          shipment.origin?.address?.city ||
          shipment.origin?.address?.address ||
          "Unknown Consignor",
        legalName: shipment.origin?.address?.address,
        contact: {
          name: shipment.origin?.address?.city || "Unknown",
          phone: shipment.origin?.address?.phone || "",
          email: shipment.origin?.address?.email || "",
          address: shipment.origin?.address?.address || "",
        },
        location: shipment.origin
          ? {
              id: shipment.origin.id || "origin",
              name: shipment.origin.address?.city || "Origin",
              type: "ORIGIN" as const,
              address: shipment.origin.address || {},
              coordinates: shipment.origin.coordinates,
            }
          : undefined,
        verified: false,
      },
      {
        id: `consignee-${shipment.id}`,
        type: "CONSIGNEE" as const,
        name:
          shipment.destination?.address?.city ||
          shipment.destination?.address?.address ||
          "Unknown Consignee",
        legalName: shipment.destination?.address?.address,
        contact: {
          name: shipment.destination?.address?.city || "Unknown",
          phone: shipment.destination?.address?.phone || "",
          email: shipment.destination?.address?.email || "",
          address: shipment.destination?.address?.address || "",
        },
        location: shipment.destination
          ? {
              id: shipment.destination.id || "destination",
              name: shipment.destination.address?.city || "Destination",
              type: "DESTINATION" as const,
              address: shipment.destination.address || {},
              coordinates: shipment.destination.coordinates,
            }
          : undefined,
        verified: false,
      },
    ];

    if (shipment.carrierName) {
      parties.push({
        id: `carrier-${shipment.carrierId || shipment.id}`,
        type: "CARRIER" as const,
        name: shipment.carrierName,
        contact: {
          name: shipment.carrierName,
          phone: "",
          email: "",
          address: "",
        },
        verified: false,
      });
    }

    return parties;
  }

  private mapShipmentToETWCargo(shipment: Shipment): any {
    // Map shipment items to ETW cargo items
    const items =
      shipment.items?.map((item) => ({
        description: item.description || "Cargo Item",
        quantity: item.quantity || 1,
        weight: item.weight || 0,
        volume: item.volume || 0,
        value: item.value || 0,
        unit: "KG",
        packaging: "PALLET", // Default packaging type
        hsCode: item.hsCode, // Harmonized System code if available
      })) || [];

    // If no items, create a single item from totals
    if (items.length === 0 && shipment.totalWeight) {
      items.push({
        description: "General Cargo",
        quantity: 1,
        weight: shipment.totalWeight || 0,
        volume: shipment.totalVolume || 0,
        value: shipment.totalValue || 0,
        unit: "KG",
        packaging: "PALLET",
      });
    }

    return {
      items,
      totalWeight: shipment.totalWeight || 0,
      totalVolume: shipment.totalVolume || 0,
      totalValue: shipment.totalValue || 0,
      currency: shipment.currency || "SAR",
      packaging: {
        type: "PALLET",
        count: shipment.items?.length || 1,
      },
    };
  }

  private mapShipmentToETWRoute(shipment: Shipment): any {
    // Map shipment origin/destination to ETW Location format
    const mapToETWLocation = (
      location: Shipment["origin"] | Shipment["destination"],
      type: "ORIGIN" | "DESTINATION",
    ) => {
      if (!location) {
        return {
          id: `${type.toLowerCase()}-${shipment.id}`,
          name: type === "ORIGIN" ? "Origin" : "Destination",
          type,
          address: {
            street: "",
            city: "",
            postalCode: "",
            country: "",
            countryCode: "",
          },
        };
      }

      return {
        id: location.id || `${type.toLowerCase()}-${shipment.id}`,
        name:
          location.address?.city ||
          location.address?.address ||
          (type === "ORIGIN" ? "Origin" : "Destination"),
        type,
        address: {
          street: location.address?.address || location.address?.street || "",
          city: location.address?.city || "",
          state: location.address?.state,
          postalCode:
            location.address?.postalCode || location.address?.zipCode || "",
          country: location.address?.country || "",
          countryCode:
            location.address?.countryCode ||
            location.address?.country?.substring(0, 2).toUpperCase() ||
            "",
        },
        coordinates: location.coordinates,
        contact:
          location.address?.phone || location.address?.email
            ? {
                name: location.address?.city || "",
                phone: location.address?.phone || "",
                email: location.address?.email || "",
              }
            : undefined,
      };
    };

    return {
      origin: mapToETWLocation(shipment.origin, "ORIGIN"),
      destination: mapToETWLocation(shipment.destination, "DESTINATION"),
      waypoints:
        shipment.route?.waypoints?.map((wp) =>
          mapToETWLocation(wp as any, "WAYPOINT"),
        ) || [],
      mode: this.mapShipmentModeToETWMode(shipment.mode),
      distance: shipment.route?.distance,
      estimatedDuration: shipment.transitTime?.estimated,
    };
  }

  private mapShipmentToETWCommercial(shipment: Shipment): any {
    return {
      contractType: "SPOT", // Default to spot, can be enhanced
      rate: {
        base: shipment.freightCharges?.total || shipment.totalValue || 0,
        currency: shipment.currency || "SAR",
        surcharges: [],
      },
    };
  }

  private mapShipmentToETWCompliance(shipment: Shipment): any {
    return {
      hazardous: shipment.hazmat || false,
      msdsId: shipment.hazmat ? undefined : undefined, // Can be linked later
      msdsReference: shipment.hazmat ? undefined : undefined,
      temperatureControl: shipment.temperatureControl?.required
        ? {
            required: true,
            min: shipment.temperatureControl.min,
            max: shipment.temperatureControl.max,
            current: shipment.temperatureControl.current,
          }
        : undefined,
      specialHandling: shipment.specialHandling
        ? [shipment.specialHandling]
        : undefined,
      restrictedGoods: shipment.hazmat || false,
      customsValue: shipment.totalValue || undefined,
      incoterms: shipment.incoterms || undefined,
    };
  }

  private mapETWStatusToShipmentStatus(
    etwStatus: ETWStatus,
  ): Shipment["status"] | null {
    const mapping: Record<ETWStatus, Shipment["status"] | null> = {
      DRAFT: "DRAFT",
      SUBMITTED: "BOOKED",
      IN_TRANSIT: "IN_TRANSIT",
      AT_BORDER: "CUSTOMS_CLEARANCE",
      DELIVERED: "DELIVERED",
      CANCELLED: "CANCELLED",
      REJECTED: "EXCEPTION",
    };
    return mapping[etwStatus] || null;
  }

  private mapShipmentStatusToETWStatus(
    shipmentStatus: Shipment["status"],
  ): ETWStatus | null {
    const mapping: Record<Shipment["status"], ETWStatus | null> = {
      DRAFT: "DRAFT",
      QUOTED: "DRAFT",
      BOOKED: "SUBMITTED",
      PICKED_UP: "IN_TRANSIT",
      IN_TRANSIT: "IN_TRANSIT",
      AT_PORT: "IN_TRANSIT",
      CUSTOMS_CLEARANCE: "AT_BORDER",
      OUT_FOR_DELIVERY: "IN_TRANSIT",
      DELIVERED: "DELIVERED",
      EXCEPTION: "REJECTED",
      RETURNED: "CANCELLED",
      CANCELLED: "CANCELLED",
    };
    return mapping[shipmentStatus] || null;
  }
}

export const etwIntegrationService = new ETWIntegrationService();
