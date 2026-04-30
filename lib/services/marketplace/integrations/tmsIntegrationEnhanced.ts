/**
 * TMS Integration Service - ENHANCED
 * Deep bidirectional integration between Marketplace and Transportation Management System
 * Real-time synchronization, shipment creation, route optimization, tracking
 */

import { eventBus } from "@/lib/services/event-store";
import { marketplaceServiceEnhanced } from "../marketplaceService.enhanced";
import { marketplaceDatabaseAdapter } from "../database/marketplaceDatabaseAdapter";
import type {
  MarketplaceBooking,
  MarketplaceServiceListing,
} from "@/types/marketplace";

export interface TMSCarrierAvailability {
  carrierId: string;
  available: boolean;
  capacity: number;
  nextAvailableDate?: string;
  routes?: {
    origin: string;
    destination: string;
    available: boolean;
  }[];
}

export interface TMSRouteCalculation {
  origin: string;
  destination: string;
  distance: number;
  estimatedTime: number;
  basePrice: number;
  totalPrice: number;
  fuelSurcharge: number;
  route: {
    waypoints: any[];
    distance: number;
    duration: number;
  };
  alternatives?: {
    route: any[];
    distance: number;
    duration: number;
    price: number;
  }[];
}

export interface TMSShipment {
  shipmentId: string;
  bookingId: string;
  carrierId: string;
  status: "PENDING" | "CONFIRMED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  trackingNumber?: string;
  origin: any;
  destination: any;
  estimatedPickup?: string;
  estimatedDelivery?: string;
  actualPickup?: string;
  actualDelivery?: string;
}

export class TMSIntegrationServiceEnhanced {
  private initialized = false;

  /**
   * Initialize TMS integration event handlers
   */
  async initialize(tenantId: string): Promise<void> {
    if (this.initialized) return;

    // ============================================================================
    // MARKETPLACE → TMS EVENTS
    // ============================================================================

    // Transportation booking created → Create TMS shipment
    eventBus.subscribe("marketplace.booking.created", async (event: any) => {
      try {
        const { bookingId, tenantId: eventTenantId } = event.payload || {};
        if (!bookingId || !eventTenantId) return;

        const booking = await marketplaceServiceEnhanced.getBooking(
          eventTenantId,
          bookingId,
        );
        if (!booking) return;

        if (this.isTransportationService(booking.serviceCategory)) {
          await this.createTMSShipment(eventTenantId, booking);
        }
      } catch (error) {
        console.error(
          "Error handling marketplace.booking.created for TMS:",
          error,
        );
      }
    });

    // Booking confirmed → Confirm TMS shipment
    eventBus.subscribe(
      "marketplace.booking.status.updated",
      async (event: any) => {
        try {
          const {
            bookingId,
            newStatus,
            tenantId: eventTenantId,
          } = event.payload || {};
          if (!bookingId || !eventTenantId) return;

          if (newStatus === "CONFIRMED") {
            const booking = await marketplaceServiceEnhanced.getBooking(
              eventTenantId,
              bookingId,
            );
            if (
              booking &&
              this.isTransportationService(booking.serviceCategory)
            ) {
              await this.confirmTMSShipment(eventTenantId, booking);
            }
          }
        } catch (error) {
          console.error("Error handling booking status update for TMS:", error);
        }
      },
    );

    // ============================================================================
    // TMS → MARKETPLACE EVENTS
    // ============================================================================

    // TMS availability updated → Update marketplace listings
    eventBus.subscribe("tms.availability.updated", async (event: any) => {
      try {
        const {
          carrierId,
          availability,
          tenantId: eventTenantId,
        } = event.payload || {};
        if (!carrierId || !eventTenantId) return;

        await this.updateMarketplaceListingsFromAvailability(
          eventTenantId,
          carrierId,
          availability,
        );
      } catch (error) {
        console.error(
          "Error updating marketplace listings from TMS availability:",
          error,
        );
      }
    });

    // TMS pricing updated → Update marketplace pricing
    eventBus.subscribe("tms.pricing.updated", async (event: any) => {
      try {
        const {
          carrierId,
          pricing,
          tenantId: eventTenantId,
        } = event.payload || {};
        if (!carrierId || !eventTenantId) return;

        await this.updateMarketplacePricing(eventTenantId, carrierId, pricing);
      } catch (error) {
        console.error("Error updating marketplace pricing from TMS:", error);
      }
    });

    // TMS tracking updated → Update booking status
    eventBus.subscribe("tms.tracking.updated", async (event: any) => {
      try {
        const {
          shipmentId,
          tracking,
          tenantId: eventTenantId,
        } = event.payload || {};
        if (!shipmentId || !eventTenantId) return;

        await this.updateBookingFromTracking(
          eventTenantId,
          shipmentId,
          tracking,
        );
      } catch (error) {
        console.error("Error updating booking from TMS tracking:", error);
      }
    });

    // TMS shipment status updated → Update booking status
    eventBus.subscribe("tms.shipment.status.updated", async (event: any) => {
      try {
        const {
          shipmentId,
          status,
          tenantId: eventTenantId,
        } = event.payload || {};
        if (!shipmentId || !eventTenantId) return;

        await this.updateBookingStatusFromShipment(
          eventTenantId,
          shipmentId,
          status,
        );
      } catch (error) {
        console.error(
          "Error updating booking status from TMS shipment:",
          error,
        );
      }
    });

    this.initialized = true;
    console.log("✅ TMS Integration Service Enhanced initialized");
  }

  /**
   * Create TMS shipment for transportation booking
   */
  async createTMSShipment(
    tenantId: string,
    booking: MarketplaceBooking,
  ): Promise<string | null> {
    try {
      const carrierId = booking.providerId;
      if (!carrierId) {
        console.warn("No carrier ID in booking");
        return null;
      }

      // Publish event for TMS to handle
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "tms.shipment.requested",
        aggregateId: booking.id,
        aggregateType: "MARKETPLACE_BOOKING",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          tenantId,
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          carrierId,
          serviceCategory: booking.serviceCategory,
          origin:
            (booking.location as any)?.origin ||
            (booking as any).metadata?.origin,
          destination:
            (booking.location as any)?.destination ||
            (booking as any).metadata?.destination,
          pickupDate: (booking.schedule as any)?.startDate || booking.createdAt,
          deliveryDate: (booking.schedule as any)?.endDate,
          weight: (booking as any).metadata?.weight,
          volume: (booking as any).metadata?.volume,
          quantity: (booking as any).quantity || 1,
          requirements: booking.requirements,
          metadata: (booking as any).metadata,
        },
      });

      // Create integration mapping (will be updated when shipment is created)
      const mappingId =
        await marketplaceDatabaseAdapter.createIntegrationMapping(tenantId, {
          bookingId: booking.id,
          integrationType: "TMS",
          externalId: carrierId,
          mappingData: {
            type: "shipment_request",
            bookingNumber: booking.bookingNumber,
          },
        });

      return mappingId;
    } catch (error) {
      console.error("Failed to create TMS shipment:", error);
      return null;
    }
  }

  /**
   * Confirm TMS shipment when booking is confirmed
   */
  async confirmTMSShipment(
    tenantId: string,
    booking: MarketplaceBooking,
  ): Promise<void> {
    try {
      const carrierId = booking.providerId;
      if (!carrierId) return;

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "tms.shipment.confirm",
        aggregateId: booking.id,
        aggregateType: "MARKETPLACE_BOOKING",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          tenantId,
          bookingId: booking.id,
          carrierId,
        },
      });
    } catch (error) {
      console.error("Failed to confirm TMS shipment:", error);
    }
  }

  /**
   * Update marketplace listings when TMS availability changes
   */
  async updateMarketplaceListingsFromAvailability(
    tenantId: string,
    carrierId: string,
    availability: TMSCarrierAvailability,
  ): Promise<void> {
    try {
      // Find all marketplace listings for this carrier
      const listings = await marketplaceServiceEnhanced.searchListings(
        tenantId,
        {
          providerId: carrierId,
        },
      );

      // Filter for transportation services
      const transportListings = listings.filter(
        (listing: MarketplaceServiceListing) => {
          return (
            listing.serviceCategory === "TRANSPORTATION" ||
            listing.serviceCategory === "FREIGHT"
          );
        },
      );

      // Update each listing
      for (const listing of transportListings) {
        const updatedMetadata = {
          ...((listing as any).metadata || {}),
          tmsAvailability: {
            available: availability.available,
            capacity: availability.capacity,
            nextAvailableDate: availability.nextAvailableDate,
            lastUpdated: new Date().toISOString(),
          },
          routes: availability.routes,
        };

        // Update availability
        let newAvailability: "AVAILABLE" | "LIMITED" | "FULL" = "AVAILABLE";
        if (!availability.available) {
          newAvailability = "FULL";
        } else if (availability.capacity < 10) {
          newAvailability = "LIMITED";
        }

        await marketplaceServiceEnhanced.updateListing(
          tenantId,
          "system",
          listing.id,
          {
            availability: newAvailability,
            metadata: updatedMetadata,
          } as Partial<MarketplaceServiceListing>,
          {
            userRole: "SYSTEM",
          },
        );

        // Publish event
        await eventBus.publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "marketplace.listing.availability.updated",
          aggregateId: listing.id,
          aggregateType: "MARKETPLACE_LISTING",
          version: 1,
          timestamp: new Date().toISOString(),
          payload: {
            tenantId,
            listingId: listing.id,
            carrierId,
            availability: newAvailability,
          },
        });
      }
    } catch (error) {
      console.error(
        "Failed to update marketplace listings from TMS availability:",
        error,
      );
    }
  }

  /**
   * Update marketplace pricing when TMS pricing changes
   */
  async updateMarketplacePricing(
    tenantId: string,
    carrierId: string,
    pricing: any,
  ): Promise<void> {
    try {
      // Find all marketplace listings for this carrier
      const listings = await marketplaceServiceEnhanced.searchListings(
        tenantId,
        {
          providerId: carrierId,
        },
      );

      // Update pricing for each listing
      for (const listing of listings) {
        const updatedPricing = {
          ...((listing as any).pricing || {}),
          basePrice: pricing.basePrice,
          currency: pricing.currency || "SAR",
          fuelSurcharge: pricing.fuelSurcharge,
          lastUpdated: new Date().toISOString(),
        };

        await marketplaceServiceEnhanced.updateListing(
          tenantId,
          "system",
          listing.id,
          {
            pricing: updatedPricing,
          } as Partial<MarketplaceServiceListing>,
          {
            userRole: "SYSTEM",
          },
        );

        // Publish event
        await eventBus.publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "marketplace.listing.pricing.updated",
          aggregateId: listing.id,
          aggregateType: "MARKETPLACE_LISTING",
          version: 1,
          timestamp: new Date().toISOString(),
          payload: {
            tenantId,
            listingId: listing.id,
            carrierId,
            pricing: updatedPricing,
          },
        });
      }
    } catch (error) {
      console.error("Failed to update marketplace pricing from TMS:", error);
    }
  }

  /**
   * Update booking from TMS tracking
   */
  async updateBookingFromTracking(
    tenantId: string,
    shipmentId: string,
    tracking: any,
  ): Promise<void> {
    try {
      // Find booking by shipment ID
      // In a real implementation, we'd query integration mappings
      // For now, update via event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "marketplace.booking.tracking.updated",
        aggregateId: shipmentId,
        aggregateType: "TMS_SHIPMENT",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          tenantId,
          shipmentId,
          tracking,
        },
      });
    } catch (error) {
      console.error("Failed to update booking from TMS tracking:", error);
    }
  }

  /**
   * Update booking status from TMS shipment status
   */
  async updateBookingStatusFromShipment(
    tenantId: string,
    shipmentId: string,
    status: string,
  ): Promise<void> {
    try {
      // Map TMS status to booking status
      let bookingStatus:
        | "PENDING"
        | "CONFIRMED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED" = "PENDING";
      if (status === "CONFIRMED") bookingStatus = "CONFIRMED";
      else if (status === "IN_TRANSIT") bookingStatus = "IN_PROGRESS";
      else if (status === "DELIVERED") bookingStatus = "COMPLETED";
      else if (status === "CANCELLED") bookingStatus = "CANCELLED";

      // Find booking by shipment ID and update
      // In a real implementation, we'd query integration mappings
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "marketplace.booking.status.sync",
        aggregateId: shipmentId,
        aggregateType: "TMS_SHIPMENT",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          tenantId,
          shipmentId,
          bookingStatus,
        },
      });
    } catch (error) {
      console.error(
        "Failed to update booking status from TMS shipment:",
        error,
      );
    }
  }

  /**
   * Get TMS availability for a carrier
   */
  async getTMSAvailability(
    tenantId: string,
    carrierId: string,
  ): Promise<TMSCarrierAvailability | null> {
    try {
      // Publish event to request availability from TMS
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "tms.availability.request",
        aggregateId: carrierId,
        aggregateType: "CARRIER",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          tenantId,
          carrierId,
        },
      });

      // In a real implementation, this would wait for TMS response
      // TMS will publish availability.updated event
      return null;
    } catch (error) {
      console.error("Failed to get TMS availability:", error);
      return null;
    }
  }

  /**
   * Calculate TMS route and pricing
   */
  async calculateRoute(
    tenantId: string,
    origin: string,
    destination: string,
    weight: number,
    volume: number,
  ): Promise<TMSRouteCalculation | null> {
    try {
      // Publish event to request route calculation from TMS
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "tms.route.calculate",
        aggregateId: `route-${origin}-${destination}`,
        aggregateType: "ROUTE",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          tenantId,
          origin,
          destination,
          weight,
          volume,
        },
      });

      // In a real implementation, this would wait for TMS response
      // TMS will publish route.calculated event
      return null;
    } catch (error) {
      console.error("Failed to calculate route:", error);
      return null;
    }
  }

  /**
   * Check if service category is transportation-related
   */
  private isTransportationService(category: string): boolean {
    return category === "TRANSPORTATION" || category === "FREIGHT";
  }

  /**
   * Link marketplace listing to TMS carrier
   */
  async linkListingToCarrier(
    tenantId: string,
    listingId: string,
    carrierId: string,
  ): Promise<string> {
    const listing = await marketplaceServiceEnhanced.getListing(
      tenantId,
      listingId,
    );
    if (!listing) {
      throw new Error(`Listing not found: ${listingId}`);
    }

    // Update listing with carrier ID
    await marketplaceServiceEnhanced.updateListing(
      tenantId,
      "system",
      listingId,
      {
        metadata: {
          ...((listing as any).metadata || {}),
          tmsCarrierId: carrierId,
        },
      } as Partial<MarketplaceServiceListing>,
      {
        userRole: "SYSTEM",
      },
    );

    // Create integration mapping
    return await marketplaceDatabaseAdapter.createIntegrationMapping(tenantId, {
      listingId,
      integrationType: "TMS",
      externalId: carrierId,
      mappingData: {
        type: "carrier_link",
      },
    });
  }
}

export const tmsIntegrationServiceEnhanced =
  new TMSIntegrationServiceEnhanced();
