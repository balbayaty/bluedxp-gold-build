import { eventBus } from "@/lib/services/event-store";
import { marketplaceService } from "./marketplaceService";
import type { MarketplaceBooking } from "@/types/marketplace";

/**
 * WMS Integration Service
 * Handles integration between Marketplace and Warehouse Management System
 */
class WMSIntegrationService {
  /**
   * Initialize WMS event handlers
   */
  initialize() {
    // Listen for marketplace booking events
    eventBus.subscribe("marketplace.booking.created", async (event) => {
      const booking = await marketplaceService.getBooking(
        event.payload.bookingId,
      );
      if (booking && this.isStorageOrCrossDocking(booking.serviceCategory)) {
        await this.createWMSLocationAssignment(booking);
      }
    });

    eventBus.subscribe("marketplace.booking.status.updated", async (event) => {
      if (event.payload.status === "confirmed") {
        const booking = await marketplaceService.getBooking(
          event.payload.bookingId,
        );
        if (booking && this.isStorageOrCrossDocking(booking.serviceCategory)) {
          await this.activateWMSLocationAssignment(booking);
        }
      }
    });

    // Listen for WMS events
    eventBus.subscribe("wms.capacity.updated", async (event) => {
      await this.updateMarketplaceListings(
        event.payload.warehouseId,
        event.payload.capacity,
      );
    });

    eventBus.subscribe("wms.inventory.updated", async (event) => {
      await this.updateMarketplaceAvailability(
        event.payload.warehouseId,
        event.payload.inventory,
      );
    });
  }

  /**
   * Create WMS location assignment for storage booking
   */
  private async createWMSLocationAssignment(
    booking: MarketplaceBooking,
  ): Promise<void> {
    // This would integrate with actual WMS service
    // For now, publish an event that WMS can listen to
    await eventBus.publish("wms.location.assignment.requested", {
      bookingId: booking.id,
      warehouseId: booking.metadata?.warehouseId,
      serviceCategory: booking.serviceCategory,
      startDate: booking.startDate,
      endDate: booking.endDate,
      quantity: booking.quantity,
      metadata: booking.metadata,
    });
  }

  /**
   * Activate WMS location assignment when booking is confirmed
   */
  private async activateWMSLocationAssignment(
    booking: MarketplaceBooking,
  ): Promise<void> {
    await eventBus.publish("wms.location.assignment.activate", {
      bookingId: booking.id,
      warehouseId: booking.metadata?.warehouseId,
    });
  }

  /**
   * Update marketplace listings when WMS capacity changes
   */
  private async updateMarketplaceListings(
    warehouseId: string,
    capacity: any,
  ): Promise<void> {
    // Find all marketplace listings for this warehouse
    const listings = await marketplaceService.searchListings({
      filters: {
        metadata: { warehouseId },
      },
    });

    // Update availability in listings
    for (const listing of listings) {
      if (listing.metadata?.warehouseId === warehouseId) {
        const updatedListing = {
          ...listing,
          metadata: {
            ...listing.metadata,
            availableCapacity: capacity.available,
            totalCapacity: capacity.total,
            utilizationRate: capacity.utilizationRate,
          },
        };

        await marketplaceService.updateListing(listing.id, updatedListing);
      }
    }
  }

  /**
   * Update marketplace availability based on inventory
   */
  private async updateMarketplaceAvailability(
    warehouseId: string,
    inventory: any,
  ): Promise<void> {
    // Similar to updateMarketplaceListings but for inventory-specific updates
    await eventBus.publish("marketplace.availability.updated", {
      warehouseId,
      inventory,
    });
  }

  /**
   * Check if service category is storage or cross-docking
   */
  private isStorageOrCrossDocking(category: string): boolean {
    return category === "storage" || category === "crossdocking";
  }

  /**
   * Get WMS capacity for a warehouse
   */
  async getWMSCapacity(warehouseId: string): Promise<{
    total: number;
    available: number;
    utilized: number;
    utilizationRate: number;
  } | null> {
    // This would call actual WMS service
    // For now, return mock data
    return {
      total: 10000,
      available: 5000,
      utilized: 5000,
      utilizationRate: 0.5,
    };
  }

  /**
   * Create cross-docking task in WMS
   */
  async createCrossDockingTask(booking: MarketplaceBooking): Promise<string> {
    await eventBus.publish("wms.crossdock.task.requested", {
      bookingId: booking.id,
      warehouseId: booking.metadata?.warehouseId,
      inboundDate: booking.startDate,
      outboundDate: booking.endDate,
      items: booking.metadata?.items || [],
    });

    return `task-${booking.id}`;
  }
}

export const wmsIntegrationService = new WMSIntegrationService();
