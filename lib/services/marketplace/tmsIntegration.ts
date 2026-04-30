import { eventBus } from "@/lib/services/event-store";
import { marketplaceService } from "./marketplaceService";
import type { MarketplaceBooking } from "@/types/marketplace";

/**
 * TMS Integration Service
 * Handles integration between Marketplace and Transportation Management System
 */
class TMSIntegrationService {
  /**
   * Initialize TMS event handlers
   */
  initialize() {
    // Listen for marketplace booking events
    eventBus.subscribe("marketplace.booking.created", async (event) => {
      const booking = await marketplaceService.getBooking(
        event.payload.bookingId,
      );
      if (booking && this.isTransportationService(booking.serviceCategory)) {
        await this.createTMSShipment(booking);
      }
    });

    eventBus.subscribe("marketplace.booking.status.updated", async (event) => {
      if (event.payload.status === "confirmed") {
        const booking = await marketplaceService.getBooking(
          event.payload.bookingId,
        );
        if (booking && this.isTransportationService(booking.serviceCategory)) {
          await this.confirmTMSShipment(booking);
        }
      }
    });

    // Listen for TMS events
    eventBus.subscribe("tms.availability.updated", async (event) => {
      await this.updateMarketplaceListings(
        event.payload.carrierId,
        event.payload.availability,
      );
    });

    eventBus.subscribe("tms.pricing.updated", async (event) => {
      await this.updateMarketplacePricing(
        event.payload.carrierId,
        event.payload.pricing,
      );
    });
  }

  /**
   * Create TMS shipment for transportation booking
   */
  private async createTMSShipment(booking: MarketplaceBooking): Promise<void> {
    await eventBus.publish("tms.shipment.requested", {
      bookingId: booking.id,
      carrierId: booking.providerId,
      serviceCategory: booking.serviceCategory,
      origin: booking.metadata?.origin,
      destination: booking.metadata?.destination,
      pickupDate: booking.startDate,
      deliveryDate: booking.endDate,
      weight: booking.metadata?.weight,
      volume: booking.metadata?.volume,
      quantity: booking.quantity,
      metadata: booking.metadata,
    });
  }

  /**
   * Confirm TMS shipment when booking is confirmed
   */
  private async confirmTMSShipment(booking: MarketplaceBooking): Promise<void> {
    await eventBus.publish("tms.shipment.confirm", {
      bookingId: booking.id,
      carrierId: booking.providerId,
    });
  }

  /**
   * Update marketplace listings when TMS availability changes
   */
  private async updateMarketplaceListings(
    carrierId: string,
    availability: any,
  ): Promise<void> {
    const listings = await marketplaceService.searchListings({
      filters: {
        providerId: carrierId,
        category: ["transportation", "freight"],
      },
    });

    for (const listing of listings) {
      if (listing.providerId === carrierId) {
        const updatedListing = {
          ...listing,
          metadata: {
            ...listing.metadata,
            availableCapacity: availability.available,
            totalCapacity: availability.total,
          },
        };

        await marketplaceService.updateListing(listing.id, updatedListing);
      }
    }
  }

  /**
   * Update marketplace pricing when TMS pricing changes
   */
  private async updateMarketplacePricing(
    carrierId: string,
    pricing: any,
  ): Promise<void> {
    const listings = await marketplaceService.searchListings({
      filters: {
        providerId: carrierId,
        category: ["transportation", "freight"],
      },
    });

    for (const listing of listings) {
      if (listing.providerId === carrierId) {
        const updatedListing = {
          ...listing,
          price: pricing.basePrice,
          metadata: {
            ...listing.metadata,
            pricing: pricing,
          },
        };

        await marketplaceService.updateListing(listing.id, updatedListing);
      }
    }
  }

  /**
   * Check if service category is transportation-related
   */
  private isTransportationService(category: string): boolean {
    return category === "transportation" || category === "freight";
  }

  /**
   * Get TMS availability for a carrier
   */
  async getTMSAvailability(carrierId: string): Promise<{
    available: boolean;
    capacity: number;
    nextAvailableDate?: string;
  } | null> {
    // This would call actual TMS service
    // For now, return mock data
    return {
      available: true,
      capacity: 100,
      nextAvailableDate: new Date().toISOString(),
    };
  }

  /**
   * Calculate TMS route and pricing
   */
  async calculateRoute(
    origin: string,
    destination: string,
    weight: number,
    volume: number,
  ): Promise<{
    distance: number;
    estimatedTime: number;
    basePrice: number;
    totalPrice: number;
    route: any[];
  }> {
    // This would call actual TMS service for route calculation
    // For now, return mock data
    return {
      distance: 500,
      estimatedTime: 8,
      basePrice: 1000,
      totalPrice: 1200,
      route: [],
    };
  }
}

export const tmsIntegrationService = new TMSIntegrationService();
