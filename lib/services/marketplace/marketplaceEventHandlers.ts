/**
 * Marketplace Event Handlers
 * Subscribes to events from other modules and reacts accordingly
 * Publishes marketplace events for other modules to consume
 */

import { eventBus } from "@/lib/services/event-store";
import { marketplaceService } from "./marketplaceService";
import { marketplaceNotificationService } from "./marketplaceNotificationService";
import { commissionService } from "./commissionService";
import { invoiceService } from "./invoiceService";
import type { DomainEvent } from "@/types/cqrs";

/**
 * Initialize marketplace event handlers
 */
export function initializeMarketplaceEventHandlers() {
  // ============================================================================
  // SUBSCRIBE TO EXTERNAL EVENTS
  // ============================================================================

  // WMS Events - Update marketplace listings when warehouse capacity changes
  eventBus.subscribe(
    "wms.warehouse.capacity.updated",
    async (event: DomainEvent) => {
      try {
        const { warehouseId, availableCapacity, totalCapacity } =
          event.payload || {};

        // Find storage listings for this warehouse
        const listings = await marketplaceService.searchListings({
          category: "STORAGE",
          location: { warehouseId },
        });

        // Update availability for each listing
        for (const listing of listings) {
          if (
            listing.category === "STORAGE" &&
            "availableCapacity" in listing
          ) {
            await marketplaceService.updateListing(listing.id, {
              ...listing,
              availableCapacity: availableCapacity || 0,
              totalCapacity: totalCapacity || 0,
              availability:
                availableCapacity && availableCapacity > 0
                  ? "AVAILABLE"
                  : "FULL",
            } as any);
          }
        }

        // Publish marketplace event
        await eventBus.publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "marketplace.listing.availability.updated",
          aggregateId: warehouseId,
          aggregateType: "WAREHOUSE",
          version: 1,
          timestamp: new Date().toISOString(),
          payload: {
            warehouseId,
            listingsUpdated: listings.length,
          },
        });
      } catch (error) {
        console.error("Error handling WMS capacity update:", error);
      }
    },
  );

  // TMS Events - Update transportation listings when carrier availability changes
  eventBus.subscribe(
    "tms.carrier.availability.updated",
    async (event: DomainEvent) => {
      try {
        const { carrierId, availableCapacity, routes } = event.payload || {};

        // Find transportation listings for this carrier
        const listings = await marketplaceService.searchListings({
          category: "TRANSPORTATION",
          providerId: carrierId,
        });

        // Update availability
        for (const listing of listings) {
          await marketplaceService.updateListing(listing.id, {
            ...listing,
            availability:
              availableCapacity && availableCapacity > 0
                ? "AVAILABLE"
                : "UNAVAILABLE",
          } as any);
        }

        await eventBus.publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "marketplace.listing.availability.updated",
          aggregateId: carrierId,
          aggregateType: "CARRIER",
          version: 1,
          timestamp: new Date().toISOString(),
          payload: { carrierId, listingsUpdated: listings.length },
        });
      } catch (error) {
        console.error("Error handling TMS carrier availability update:", error);
      }
    },
  );

  // RFQ Events - Suggest marketplace services when RFQ is created
  eventBus.subscribe(
    "proposals-rfq.rfq.created",
    async (event: DomainEvent) => {
      try {
        const { rfqId, services, location } = event.payload || {};

        // Find matching marketplace listings
        const suggestions = await marketplaceService.searchListings({
          category: services?.[0]?.category as any,
          location: location
            ? { city: location.city, country: location.country }
            : undefined,
        });

        // Publish suggestion event
        await eventBus.publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "marketplace.rfq.suggestions.generated",
          aggregateId: rfqId,
          aggregateType: "RFQ",
          version: 1,
          timestamp: new Date().toISOString(),
          payload: {
            rfqId,
            suggestions: suggestions.slice(0, 10).map((l) => ({
              listingId: l.id,
              title: l.title,
              providerName: l.providerName,
              price: l.pricing?.basePrice,
              rating: l.rating,
            })),
          },
        });

        // Send notification to RFQ creator
        await marketplaceNotificationService.notifyRFQSuggestions(
          rfqId,
          suggestions.slice(0, 5),
        );
      } catch (error) {
        console.error("Error handling RFQ creation:", error);
      }
    },
  );

  // Purchase Order Events - Auto-create booking when PO is approved
  eventBus.subscribe("purchase-order.approved", async (event: DomainEvent) => {
    try {
      const { purchaseOrderId, items, serviceId } = event.payload || {};

      // If PO includes marketplace service, auto-create booking
      if (serviceId) {
        const listing = await marketplaceService.getListing(serviceId);
        if (listing) {
          const booking = await marketplaceService.createBooking({
            listingId: serviceId,
            customerId: event.metadata?.userId || "system",
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            quantity: items?.[0]?.quantity || 1,
            specialRequirements: `Auto-created from PO ${purchaseOrderId}`,
            status: "PENDING",
          });

          await eventBus.publish({
            id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: "marketplace.booking.auto.created",
            aggregateId: booking.id,
            aggregateType: "BOOKING",
            version: 1,
            timestamp: new Date().toISOString(),
            payload: {
              bookingId: booking.id,
              purchaseOrderId,
              listingId: serviceId,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error handling PO approval:", error);
    }
  });

  // ============================================================================
  // MARKETPLACE EVENT REACTIONS
  // ============================================================================

  // When booking is created, trigger WMS/TMS workflows
  eventBus.subscribe(
    "marketplace.booking.created",
    async (event: DomainEvent) => {
      try {
        const { bookingId, listingId, category } = event.payload || {};
        const listing = await marketplaceService.getListing(listingId);

        if (!listing) return;

        // Trigger appropriate workflow based on service category
        switch (category || listing.category) {
          case "STORAGE":
            // Trigger WMS location assignment
            await eventBus.publish({
              id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              type: "wms.location.assignment.requested",
              aggregateId: bookingId,
              aggregateType: "BOOKING",
              version: 1,
              timestamp: new Date().toISOString(),
              payload: {
                bookingId,
                warehouseId: listing.location?.warehouseId,
                capacity: event.payload?.quantity || 1,
              },
            });
            break;

          case "TRANSPORTATION":
          case "FREIGHT":
            // Trigger TMS shipment creation
            await eventBus.publish({
              id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              type: "tms.shipment.creation.requested",
              aggregateId: bookingId,
              aggregateType: "BOOKING",
              version: 1,
              timestamp: new Date().toISOString(),
              payload: {
                bookingId,
                carrierId: listing.providerId,
                origin: listing.location,
                destination: event.payload?.destination,
              },
            });
            break;

          case "CROSSDOCKING":
            // Trigger WMS cross-dock task
            await eventBus.publish({
              id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              type: "wms.crossdock.task.requested",
              aggregateId: bookingId,
              aggregateType: "BOOKING",
              version: 1,
              timestamp: new Date().toISOString(),
              payload: {
                bookingId,
                warehouseId: listing.location?.warehouseId,
              },
            });
            break;
        }
      } catch (error) {
        console.error("Error handling booking creation:", error);
      }
    },
  );

  // When booking is confirmed, update availability
  eventBus.subscribe(
    "marketplace.booking.confirmed",
    async (event: DomainEvent) => {
      try {
        const { bookingId, listingId, quantity } = event.payload || {};
        const listing = await marketplaceService.getListing(listingId);

        if (
          listing &&
          listing.category === "STORAGE" &&
          "availableCapacity" in listing
        ) {
          const currentCapacity = (listing as any).availableCapacity || 0;
          const newCapacity = Math.max(0, currentCapacity - (quantity || 1));

          await marketplaceService.updateListing(listingId, {
            ...listing,
            availableCapacity: newCapacity,
            availability: newCapacity > 0 ? "AVAILABLE" : "FULL",
          } as any);
        }
      } catch (error) {
        console.error("Error handling booking confirmation:", error);
      }
    },
  );

  // When booking is cancelled, restore availability
  eventBus.subscribe(
    "marketplace.booking.cancelled",
    async (event: DomainEvent) => {
      try {
        const { bookingId, listingId, quantity } = event.payload || {};
        const listing = await marketplaceService.getListing(listingId);

        if (
          listing &&
          listing.category === "STORAGE" &&
          "availableCapacity" in listing
        ) {
          const currentCapacity = (listing as any).availableCapacity || 0;
          const newCapacity = currentCapacity + (quantity || 1);

          await marketplaceService.updateListing(listingId, {
            ...listing,
            availableCapacity: newCapacity,
            availability: "AVAILABLE",
          } as any);
        }
      } catch (error) {
        console.error("Error handling booking cancellation:", error);
      }
    },
  );

  // When payment is completed, calculate commission
  eventBus.subscribe(
    "marketplace.payment.completed",
    async (event: DomainEvent) => {
      try {
        const { paymentId, bookingId, amount } = event.payload || {};
        const booking = await marketplaceService.getBooking(bookingId);

        if (booking) {
          // Calculate commission
          await commissionService.calculateCommission(
            paymentId,
            bookingId,
            booking.providerId,
            booking.customerId,
            amount,
            booking.serviceCategory,
          );

          // Mark invoice as paid
          const invoice = await invoiceService.getInvoiceByBooking(bookingId);
          if (invoice) {
            await invoiceService.markInvoiceAsPaid(invoice.id, paymentId);
          }
        }
      } catch (error) {
        console.error("Error handling payment completion:", error);
      }
    },
  );

  console.log("✅ Marketplace event handlers initialized");
}

/**
 * Publish marketplace events
 */
export async function publishMarketplaceEvent(
  type: string,
  aggregateId: string,
  aggregateType: string,
  payload: any,
) {
  await eventBus.publish({
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: `marketplace.${type}`,
    aggregateId,
    aggregateType,
    version: 1,
    timestamp: new Date().toISOString(),
    payload,
  });
}
