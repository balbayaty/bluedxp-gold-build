/**
 * WMS Integration Service - ENHANCED
 * Deep bidirectional integration between Marketplace and Warehouse Management System
 * Real-time synchronization, capacity management, location assignments
 */

import { eventBus } from "@/lib/services/event-store";
import { marketplaceServiceEnhanced } from "../marketplaceService.enhanced";
import { marketplaceDatabaseAdapter } from "../database/marketplaceDatabaseAdapter";
import type {
  MarketplaceBooking,
  MarketplaceServiceListing,
} from "@/types/marketplace";

export interface WMSCapacityData {
  warehouseId: string;
  total: number;
  available: number;
  utilized: number;
  utilizationRate: number;
  zones?: {
    zoneId: string;
    zoneName: string;
    capacity: number;
    available: number;
  }[];
}

export interface WMSLocationAssignment {
  assignmentId: string;
  bookingId: string;
  warehouseId: string;
  locationId?: string;
  locationCode?: string;
  zoneId?: string;
  status: "PENDING" | "ASSIGNED" | "ACTIVE" | "RELEASED";
  assignedAt?: string;
  releasedAt?: string;
}

export class WMSIntegrationServiceEnhanced {
  private initialized = false;

  /**
   * Initialize WMS integration event handlers
   */
  async initialize(tenantId: string): Promise<void> {
    if (this.initialized) return;

    // ============================================================================
    // MARKETPLACE → WMS EVENTS
    // ============================================================================

    // Storage booking created → Request WMS location assignment
    eventBus.subscribe("marketplace.booking.created", async (event: any) => {
      try {
        const { bookingId, tenantId: eventTenantId } = event.payload || {};
        if (!bookingId || !eventTenantId) return;

        const booking = await marketplaceServiceEnhanced.getBooking(
          eventTenantId,
          bookingId,
        );
        if (!booking) return;

        if (this.isStorageOrCrossDocking(booking.serviceCategory)) {
          await this.createWMSLocationAssignment(eventTenantId, booking);
        }
      } catch (error) {
        console.error(
          "Error handling marketplace.booking.created for WMS:",
          error,
        );
      }
    });

    // Booking confirmed → Activate WMS location assignment
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

          if (newStatus === "CONFIRMED" || newStatus === "IN_PROGRESS") {
            const booking = await marketplaceServiceEnhanced.getBooking(
              eventTenantId,
              bookingId,
            );
            if (
              booking &&
              this.isStorageOrCrossDocking(booking.serviceCategory)
            ) {
              await this.activateWMSLocationAssignment(eventTenantId, booking);
            }
          }
        } catch (error) {
          console.error("Error handling booking status update for WMS:", error);
        }
      },
    );

    // Booking completed → Release WMS location
    eventBus.subscribe("marketplace.booking.completed", async (event: any) => {
      try {
        const { bookingId, tenantId: eventTenantId } = event.payload || {};
        if (!bookingId || !eventTenantId) return;

        await this.releaseWMSLocation(eventTenantId, bookingId);
      } catch (error) {
        console.error("Error releasing WMS location:", error);
      }
    });

    // ============================================================================
    // WMS → MARKETPLACE EVENTS
    // ============================================================================

    // WMS capacity updated → Update marketplace listings
    eventBus.subscribe("wms.capacity.updated", async (event: any) => {
      try {
        const {
          warehouseId,
          capacity,
          tenantId: eventTenantId,
        } = event.payload || {};
        if (!warehouseId || !eventTenantId) return;

        await this.updateMarketplaceListingsFromCapacity(
          eventTenantId,
          warehouseId,
          capacity,
        );
      } catch (error) {
        console.error(
          "Error updating marketplace listings from WMS capacity:",
          error,
        );
      }
    });

    // WMS inventory updated → Update marketplace availability
    eventBus.subscribe("wms.inventory.updated", async (event: any) => {
      try {
        const {
          warehouseId,
          inventory,
          tenantId: eventTenantId,
        } = event.payload || {};
        if (!warehouseId || !eventTenantId) return;

        await this.updateMarketplaceAvailability(
          eventTenantId,
          warehouseId,
          inventory,
        );
      } catch (error) {
        console.error(
          "Error updating marketplace availability from WMS inventory:",
          error,
        );
      }
    });

    // WMS location assigned → Update booking with location info
    eventBus.subscribe("wms.location.assigned", async (event: any) => {
      try {
        const {
          bookingId,
          locationAssignment,
          tenantId: eventTenantId,
        } = event.payload || {};
        if (!bookingId || !eventTenantId) return;

        await this.updateBookingWithLocation(
          eventTenantId,
          bookingId,
          locationAssignment,
        );
      } catch (error) {
        console.error("Error updating booking with WMS location:", error);
      }
    });

    this.initialized = true;
    console.log("✅ WMS Integration Service Enhanced initialized");
  }

  /**
   * Create WMS location assignment for storage booking
   */
  async createWMSLocationAssignment(
    tenantId: string,
    booking: MarketplaceBooking,
  ): Promise<string | null> {
    try {
      const warehouseId =
        (booking as any).metadata?.warehouseId ||
        (booking as any).wmsWarehouseId;
      if (!warehouseId) {
        console.warn("No warehouse ID in booking metadata");
        return null;
      }

      // Publish event for WMS to handle
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "wms.location.assignment.requested",
        aggregateId: booking.id,
        aggregateType: "MARKETPLACE_BOOKING",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          tenantId,
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          warehouseId,
          serviceCategory: booking.serviceCategory,
          startDate: (booking.schedule as any)?.startDate || booking.createdAt,
          endDate: (booking.schedule as any)?.endDate,
          quantity: (booking as any).quantity || 1,
          requirements: booking.requirements,
          metadata: (booking as any).metadata,
        },
      });

      // Create integration mapping
      const mappingId =
        await marketplaceDatabaseAdapter.createIntegrationMapping(tenantId, {
          bookingId: booking.id,
          integrationType: "WMS",
          externalId: warehouseId,
          mappingData: {
            type: "location_assignment_request",
            bookingNumber: booking.bookingNumber,
          },
        });

      return mappingId;
    } catch (error) {
      console.error("Failed to create WMS location assignment:", error);
      return null;
    }
  }

  /**
   * Activate WMS location assignment when booking is confirmed
   */
  async activateWMSLocationAssignment(
    tenantId: string,
    booking: MarketplaceBooking,
  ): Promise<void> {
    try {
      const warehouseId =
        (booking as any).metadata?.warehouseId ||
        (booking as any).wmsWarehouseId;
      if (!warehouseId) return;

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "wms.location.assignment.activate",
        aggregateId: booking.id,
        aggregateType: "MARKETPLACE_BOOKING",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          tenantId,
          bookingId: booking.id,
          warehouseId,
        },
      });
    } catch (error) {
      console.error("Failed to activate WMS location assignment:", error);
    }
  }

  /**
   * Release WMS location when booking is completed
   */
  async releaseWMSLocation(tenantId: string, bookingId: string): Promise<void> {
    try {
      const booking = await marketplaceServiceEnhanced.getBooking(
        tenantId,
        bookingId,
      );
      if (!booking) return;

      const warehouseId =
        (booking as any).metadata?.warehouseId ||
        (booking as any).wmsWarehouseId;
      if (!warehouseId) return;

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "wms.location.assignment.release",
        aggregateId: bookingId,
        aggregateType: "MARKETPLACE_BOOKING",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          tenantId,
          bookingId,
          warehouseId,
        },
      });
    } catch (error) {
      console.error("Failed to release WMS location:", error);
    }
  }

  /**
   * Update marketplace listings when WMS capacity changes
   */
  async updateMarketplaceListingsFromCapacity(
    tenantId: string,
    warehouseId: string,
    capacity: WMSCapacityData,
  ): Promise<void> {
    try {
      // Find all marketplace listings linked to this warehouse
      const listings = await marketplaceServiceEnhanced.searchListings(
        tenantId,
        {
          // Search for listings with this warehouse ID in metadata
        },
      );

      // Filter listings for this warehouse
      const warehouseListings = listings.filter(
        (listing: MarketplaceServiceListing) => {
          const listingWarehouseId =
            (listing as any).wmsWarehouseId ||
            (listing as any).metadata?.warehouseId ||
            (listing as any).metadata?.wmsWarehouseId;
          return listingWarehouseId === warehouseId;
        },
      );

      // Update each listing
      for (const listing of warehouseListings) {
        const updatedMetadata = {
          ...((listing as any).metadata || {}),
          wmsCapacity: {
            total: capacity.total,
            available: capacity.available,
            utilized: capacity.utilized,
            utilizationRate: capacity.utilizationRate,
            lastUpdated: new Date().toISOString(),
          },
          zones: capacity.zones,
        };

        // Update availability based on capacity
        let newAvailability: "AVAILABLE" | "LIMITED" | "FULL" = "AVAILABLE";
        if (capacity.utilizationRate >= 0.95) {
          newAvailability = "FULL";
        } else if (capacity.utilizationRate >= 0.8) {
          newAvailability = "LIMITED";
        }

        await marketplaceServiceEnhanced.updateListing(
          tenantId,
          "system", // System update
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
            warehouseId,
            availability: newAvailability,
            capacity,
          },
        });
      }
    } catch (error) {
      console.error(
        "Failed to update marketplace listings from WMS capacity:",
        error,
      );
    }
  }

  /**
   * Update marketplace availability based on inventory
   */
  async updateMarketplaceAvailability(
    tenantId: string,
    warehouseId: string,
    inventory: any,
  ): Promise<void> {
    try {
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "marketplace.availability.updated",
        aggregateId: warehouseId,
        aggregateType: "WAREHOUSE",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          tenantId,
          warehouseId,
          inventory,
        },
      });
    } catch (error) {
      console.error("Failed to update marketplace availability:", error);
    }
  }

  /**
   * Update booking with WMS location assignment
   */
  async updateBookingWithLocation(
    tenantId: string,
    bookingId: string,
    locationAssignment: WMSLocationAssignment,
  ): Promise<void> {
    try {
      const booking = await marketplaceServiceEnhanced.getBooking(
        tenantId,
        bookingId,
      );
      if (!booking) return;

      const updatedMetadata = {
        ...((booking as any).metadata || {}),
        wmsLocationAssignment: {
          assignmentId: locationAssignment.assignmentId,
          locationId: locationAssignment.locationId,
          locationCode: locationAssignment.locationCode,
          zoneId: locationAssignment.zoneId,
          status: locationAssignment.status,
          assignedAt: locationAssignment.assignedAt,
        },
      };

      // Update booking metadata
      await marketplaceServiceEnhanced.updateBookingStatus(
        tenantId,
        "system",
        bookingId,
        booking.status, // Keep same status
        {
          userRole: "SYSTEM",
        },
      );

      // Create integration mapping
      await marketplaceDatabaseAdapter.createIntegrationMapping(tenantId, {
        bookingId,
        integrationType: "WMS",
        externalId: locationAssignment.assignmentId,
        mappingData: {
          type: "location_assignment",
          locationId: locationAssignment.locationId,
          locationCode: locationAssignment.locationCode,
          status: locationAssignment.status,
        },
      });
    } catch (error) {
      console.error("Failed to update booking with WMS location:", error);
    }
  }

  /**
   * Get WMS capacity for a warehouse
   */
  async getWMSCapacity(
    tenantId: string,
    warehouseId: string,
  ): Promise<WMSCapacityData | null> {
    try {
      // Publish event to request capacity from WMS
      const response = await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "wms.capacity.request",
        aggregateId: warehouseId,
        aggregateType: "WAREHOUSE",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          tenantId,
          warehouseId,
        },
      });

      // In a real implementation, this would wait for WMS response
      // For now, return null (WMS will publish capacity.updated event)
      return null;
    } catch (error) {
      console.error("Failed to get WMS capacity:", error);
      return null;
    }
  }

  /**
   * Create cross-docking task in WMS
   */
  async createCrossDockingTask(
    tenantId: string,
    booking: MarketplaceBooking,
  ): Promise<string | null> {
    try {
      const warehouseId =
        (booking as any).metadata?.warehouseId ||
        (booking as any).wmsWarehouseId;
      if (!warehouseId) return null;

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "wms.crossdock.task.requested",
        aggregateId: booking.id,
        aggregateType: "MARKETPLACE_BOOKING",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          tenantId,
          bookingId: booking.id,
          warehouseId,
          inboundDate:
            (booking.schedule as any)?.startDate || booking.createdAt,
          outboundDate: (booking.schedule as any)?.endDate,
          items: (booking as any).metadata?.items || [],
          requirements: booking.requirements,
        },
      });

      const taskId = `crossdock-task-${booking.id}`;

      // Create integration mapping
      await marketplaceDatabaseAdapter.createIntegrationMapping(tenantId, {
        bookingId: booking.id,
        integrationType: "WMS",
        externalId: taskId,
        mappingData: {
          type: "crossdock_task",
          warehouseId,
        },
      });

      return taskId;
    } catch (error) {
      console.error("Failed to create cross-docking task:", error);
      return null;
    }
  }

  /**
   * Check if service category is storage or cross-docking
   */
  private isStorageOrCrossDocking(category: string): boolean {
    return category === "STORAGE" || category === "CROSSDOCKING";
  }

  /**
   * Link marketplace listing to WMS warehouse
   */
  async linkListingToWarehouse(
    tenantId: string,
    listingId: string,
    warehouseId: string,
  ): Promise<string> {
    const listing = await marketplaceServiceEnhanced.getListing(
      tenantId,
      listingId,
    );
    if (!listing) {
      throw new Error(`Listing not found: ${listingId}`);
    }

    // Update listing with warehouse ID
    await marketplaceServiceEnhanced.updateListing(
      tenantId,
      "system",
      listingId,
      {
        metadata: {
          ...((listing as any).metadata || {}),
          wmsWarehouseId: warehouseId,
        },
      } as Partial<MarketplaceServiceListing>,
      {
        userRole: "SYSTEM",
      },
    );

    // Create integration mapping
    return await marketplaceDatabaseAdapter.createIntegrationMapping(tenantId, {
      listingId,
      integrationType: "WMS",
      externalId: warehouseId,
      mappingData: {
        type: "warehouse_link",
      },
    });
  }
}

export const wmsIntegrationServiceEnhanced =
  new WMSIntegrationServiceEnhanced();
