/**
 * Marketplace Service
 * Core service for managing marketplace listings, bookings, and providers
 * Integration with RFQ, Proposals, and Purchasing modules
 */

import type {
  MarketplaceServiceCategory,
  MarketplaceServiceListing,
  ServiceProvider,
  MarketplaceBooking,
  BookingStatus,
  MarketplaceSearchFilters,
  MarketplaceReview,
  StorageServiceListing,
  CrossDockingServiceListing,
  TransportationServiceListing,
  FreightServiceListing,
  ConsultingServiceListing,
  ManpowerServiceListing,
  TranslationServiceListing,
  WarehouseNetworkListing,
} from "@/types/marketplace";
import { eventBus } from "@/lib/services/event-store";
import { marketplaceNotificationService } from "./marketplaceNotificationService";
import { marketplaceRealtimeService } from "./marketplaceRealtimeService";
import { publishMarketplaceEvent } from "./marketplaceEventHandlers";
import { invoiceService } from "./invoiceService";
import { commissionService } from "./commissionService";
import { MarketplaceDatabaseAdapter } from "./database/marketplaceDatabaseAdapter";

// Database adapter with automatic fallback to in-memory
const dbAdapter = new MarketplaceDatabaseAdapter();

// Initialize mock data on first call (for fallback only)
let initialized = false;

async function initializeMockData() {
  if (!initialized) {
    initialized = true;
    // Mock data initialization is now handled by the database adapter's in-memory fallback
    console.log(
      "✅ Marketplace Service: Using database adapter with automatic fallback",
    );
  }
}

export class MarketplaceService {
  // ============================================================================
  // SERVICE LISTINGS
  // ============================================================================

  /**
   * Create a new service listing
   */
  async createListing(
    providerId: string,
    category: MarketplaceServiceCategory,
    listing: Partial<MarketplaceServiceListing>,
    tenantId: string = "default",
  ): Promise<MarketplaceServiceListing> {
    await initializeMockData();

    const listingId = `listing-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const fullListing: MarketplaceServiceListing = {
      id: listingId,
      providerId,
      providerName: listing.providerName || "Unknown Provider",
      serviceCategory: category,
      ...listing,
      rating: 0,
      totalBookings: 0,
      availability: "AVAILABLE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as MarketplaceServiceListing;

    // Store in database (with automatic fallback to in-memory)
    await dbAdapter.storeListing(tenantId, fullListing);

    // Publish event
    await eventBus.publish("marketplace.listing.created", {
      listingId,
      providerId,
      category,
      tenantId,
    });

    return fullListing;
  }

  /**
   * Get listing by ID
   */
  async getListing(
    id: string,
    tenantId: string = "default",
  ): Promise<MarketplaceServiceListing | null> {
    await initializeMockData();

    // Get from database (with automatic fallback to in-memory)
    const listing = await dbAdapter.getListing(tenantId, id);
    if (listing) {
      return {
        ...listing,
        serviceCategory:
          (listing as any).serviceCategory || this.getServiceCategory(listing),
      } as MarketplaceServiceListing;
    }
    return null;
  }

  /**
   * Search listings with filters
   */
  async searchListings(
    filters: MarketplaceSearchFilters,
    tenantId: string = "default",
  ): Promise<MarketplaceServiceListing[]> {
    await initializeMockData();

    // Get from database (with automatic fallback to in-memory)
    let results = await dbAdapter.getAllListings(tenantId, filters);

    // Filter by category
    if (filters.category) {
      // Category filtering logic depends on listing type
      results = results.filter((listing) => {
        if (filters.category === "STORAGE" && "serviceType" in listing) {
          return true; // StorageServiceListing
        }
        if (filters.category === "CROSSDOCKING" && "dockDoors" in listing) {
          return true; // CrossDockingServiceListing
        }
        if (
          filters.category === "TRANSPORTATION" &&
          "serviceType" in listing &&
          "routes" in listing
        ) {
          return true; // TransportationServiceListing
        }
        if (
          filters.category === "FREIGHT" &&
          "serviceType" in listing &&
          "routes" in listing
        ) {
          return true; // FreightServiceListing
        }
        if (
          filters.category === "CONSULTING" &&
          "serviceType" in listing &&
          "specialties" in listing
        ) {
          return true; // ConsultingServiceListing
        }
        if (
          filters.category === "MANPOWER" &&
          "serviceType" in listing &&
          "availableStaff" in listing
        ) {
          return true; // ManpowerServiceListing
        }
        if (filters.category === "TRANSLATION" && "languages" in listing) {
          return true; // TranslationServiceListing
        }
        if (
          filters.category === "WAREHOUSE_NETWORK" &&
          "warehouses" in listing
        ) {
          return true; // WarehouseNetworkListing
        }
        return false;
      });
    }

    // Filter by location
    if (filters.location) {
      results = results.filter((listing) => {
        if ("location" in listing) {
          const loc = listing.location as any;
          if (filters.location?.city && loc.city !== filters.location.city) {
            return false;
          }
          if (
            filters.location?.country &&
            loc.country !== filters.location.country
          ) {
            return false;
          }
          // Radius filtering with coordinates (using Haversine formula)
          if (
            filters.location?.coordinates &&
            filters.location?.radiusKm &&
            loc.coordinates
          ) {
            const distance = this.calculateDistance(
              filters.location.coordinates.lat,
              filters.location.coordinates.lng,
              loc.coordinates.lat,
              loc.coordinates.lng,
            );
            if (distance > filters.location.radiusKm) {
              return false;
            }
          }
        }
        return true;
      });
    }

    // Filter by price range
    if (filters.priceRange) {
      results = results.filter((listing) => {
        if ("pricing" in listing) {
          const price = listing.pricing as any;
          const basePrice = price.basePrice || 0;
          if (filters.priceRange?.min && basePrice < filters.priceRange.min) {
            return false;
          }
          if (filters.priceRange?.max && basePrice > filters.priceRange.max) {
            return false;
          }
        }
        return true;
      });
    }

    // Filter by rating
    if (filters.rating?.min) {
      results = results.filter(
        (listing) => listing.rating >= filters.rating!.min!,
      );
    }

    // Filter by availability
    if (filters.availability) {
      results = results.filter(
        (listing) => listing.availability === filters.availability,
      );
    }

    // Sort by rating and total bookings
    results.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.totalBookings - a.totalBookings;
    });

    // Attach service category to results
    return results.map((listing) => ({
      ...listing,
      serviceCategory:
        (listing as any).serviceCategory || this.getServiceCategory(listing),
    })) as MarketplaceServiceListing[];
  }

  /**
   * Update listing
   */
  async updateListing(
    id: string,
    updates: Partial<MarketplaceServiceListing>,
    tenantId: string = "default",
  ): Promise<MarketplaceServiceListing | null> {
    const listing = await dbAdapter.getListing(tenantId, id);
    if (!listing) return null;

    const updated = {
      ...listing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await dbAdapter.storeListing(tenantId, updated);

    // Publish event
    await publishMarketplaceEvent("listing.updated", id, "LISTING", {
      listingId: id,
      updates,
      tenantId,
    });

    // Send real-time update
    await marketplaceRealtimeService.publishMarketplaceUpdate(
      "listing.updated",
      updates,
      id,
    );

    return updated;
  }

  /**
   * Delete listing
   */
  async deleteListing(
    id: string,
    tenantId: string = "default",
  ): Promise<boolean> {
    const listing = await dbAdapter.getListing(tenantId, id);
    if (!listing) return false;

    await dbAdapter.deleteListing(tenantId, id);

    await eventBus.publish("marketplace.listing.deleted", {
      listingId: id,
      tenantId,
    });

    return true;
  }

  // ============================================================================
  // SERVICE PROVIDERS
  // ============================================================================

  /**
   * Register a new service provider
   */
  async registerProvider(
    provider: Partial<ServiceProvider>,
  ): Promise<ServiceProvider> {
    const providerId = `provider-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const fullProvider: ServiceProvider = {
      id: providerId,
      name: provider.name || "Unknown Provider",
      type: provider.type || "COMPANY",
      description: provider.description || "",
      contact: provider.contact || {
        email: "",
        phone: "",
      },
      services: provider.services || [],
      rating: 0,
      totalBookings: 0,
      totalRevenue: 0,
      verified: false,
      certifications: provider.certifications || [],
      joinedDate: new Date().toISOString(),
      status: "ACTIVE",
    };

    providers.set(providerId, fullProvider);

    await eventBus.publish("marketplace.provider.registered", { providerId });

    return fullProvider;
  }

  /**
   * Get provider by ID
   */
  async getProvider(
    id: string,
    tenantId: string = "default",
  ): Promise<ServiceProvider | null> {
    return await dbAdapter.getProvider(tenantId, id);
  }

  /**
   * Get provider listings
   */
  async getProviderListings(
    providerId: string,
    tenantId: string = "default",
  ): Promise<MarketplaceServiceListing[]> {
    const allListings = await dbAdapter.getAllListings(tenantId, {});
    return allListings
      .filter((listing) => listing.providerId === providerId)
      .map((listing) => ({
        ...listing,
        serviceCategory:
          (listing as any).serviceCategory || this.getServiceCategory(listing),
      })) as MarketplaceServiceListing[];
  }

  /**
   * Update provider
   */
  async updateProvider(
    id: string,
    updates: Partial<ServiceProvider>,
  ): Promise<ServiceProvider | null> {
    const provider = providers.get(id);
    if (!provider) return null;

    const updated = {
      ...provider,
      ...updates,
    };

    providers.set(id, updated);

    await eventBus.publish("marketplace.provider.updated", { providerId: id });

    return updated;
  }

  // ============================================================================
  // BOOKINGS
  // ============================================================================

  /**
   * Create a booking
   */
  async createBooking(
    customerId: string,
    customerName: string,
    serviceId: string,
    bookingDetails: Partial<MarketplaceBooking>,
    tenantId: string = "default",
  ): Promise<MarketplaceBooking> {
    const listing = await dbAdapter.getListing(tenantId, serviceId);
    if (!listing) {
      throw new Error(`Service listing not found: ${serviceId}`);
    }

    const allBookings = await dbAdapter.getAllBookings(tenantId, {});
    const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const bookingNumber = `BK-${new Date().getFullYear()}-${String(allBookings.length + 1).padStart(6, "0")}`;

    const booking: MarketplaceBooking = {
      id: bookingId,
      bookingNumber,
      customerId,
      customerName,
      providerId: listing.providerId,
      providerName: listing.providerName,
      serviceId,
      serviceCategory: this.getServiceCategory(listing),
      serviceDetails: bookingDetails.serviceDetails || {},
      status: "PENDING",
      pricing: bookingDetails.pricing || {
        basePrice:
          "pricing" in listing ? (listing.pricing as any).basePrice : 0,
        currency:
          "pricing" in listing ? (listing.pricing as any).currency : "SAR",
        total: "pricing" in listing ? (listing.pricing as any).basePrice : 0,
      },
      schedule: bookingDetails.schedule || {
        startDate: new Date().toISOString(),
      },
      location: bookingDetails.location,
      requirements: bookingDetails.requirements,
      notes: bookingDetails.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store booking in database
    await dbAdapter.storeBooking(tenantId, booking);

    // Update listing booking count
    listing.totalBookings++;
    await dbAdapter.storeListing(tenantId, listing);

    // Send notifications
    await marketplaceNotificationService.notifyBookingCreated(booking, listing);

    // Publish events
    await publishMarketplaceEvent("booking.created", bookingId, "BOOKING", {
      bookingId,
      customerId,
      providerId: listing.providerId,
      serviceId,
      category: listing.category,
    });

    // Send real-time update
    await marketplaceRealtimeService.publishMarketplaceUpdate(
      "booking.status.changed",
      { status: booking.status },
      undefined,
      bookingId,
    );

    // Integrate with RFQ/Proposals module
    await eventBus.publish("rfq.marketplace.booking", {
      bookingId,
      serviceId,
      customerId,
    });

    // Auto-generate invoice for confirmed bookings
    if (booking.status === "CONFIRMED" && booking.pricing) {
      const invoiceItems = [
        {
          description: listing.title,
          quantity: 1,
          unitPrice: booking.pricing.total,
          total: booking.pricing.total,
        },
      ];
      await invoiceService.generateInvoice(booking, invoiceItems);
    }

    return booking;
  }

  /**
   * Get booking by ID
   */
  async getBooking(id: string): Promise<MarketplaceBooking | null> {
    return bookings.get(id) || null;
  }

  /**
   * Get customer bookings
   */
  async getCustomerBookings(
    customerId: string,
    tenantId: string = "default",
  ): Promise<MarketplaceBooking[]> {
    return await dbAdapter.getCustomerBookings(tenantId, customerId);
  }

  /**
   * Get provider bookings
   */
  async getProviderBookings(
    providerId: string,
    tenantId: string = "default",
  ): Promise<MarketplaceBooking[]> {
    return await dbAdapter.getProviderBookings(tenantId, providerId);
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    id: string,
    status: BookingStatus,
    tenantId: string = "default",
  ): Promise<MarketplaceBooking | null> {
    const booking = await dbAdapter.getBooking(tenantId, id);
    if (!booking) return null;

    const updated = {
      ...booking,
      status,
      updatedAt: new Date().toISOString(),
    };

    const oldStatus = booking.status;
    await dbAdapter.storeBooking(tenantId, updated);

    // Send notifications
    await marketplaceNotificationService.notifyBookingStatusChange(
      updated,
      oldStatus,
      status,
    );

    // Publish events
    await publishMarketplaceEvent("booking.status.updated", id, "BOOKING", {
      bookingId: id,
      oldStatus,
      newStatus: status,
    });

    // Send real-time update
    await marketplaceRealtimeService.publishMarketplaceUpdate(
      "booking.status.changed",
      { status, oldStatus },
      undefined,
      id,
    );

    // Handle payment and commission when booking is confirmed
    if (
      status === "CONFIRMED" &&
      oldStatus !== "CONFIRMED" &&
      updated.pricing
    ) {
      // Generate invoice if not already generated
      const existingInvoice = await invoiceService.getInvoiceByBooking(id);
      if (!existingInvoice) {
        const listing = await dbAdapter.getListing(tenantId, updated.serviceId);
        if (listing) {
          const invoiceItems = [
            {
              description: listing.title,
              quantity: 1,
              unitPrice: updated.pricing.total,
              total: updated.pricing.total,
            },
          ];
          await invoiceService.generateInvoice(updated, invoiceItems);
        }
      }
    }

    // Calculate commission when payment is completed (handled by payment service event)

    return updated;
  }

  // ============================================================================
  // REVIEWS & RATINGS
  // ============================================================================

  /**
   * Add review
   */
  async addReview(
    review: Partial<MarketplaceReview>,
    tenantId: string = "default",
  ): Promise<MarketplaceReview> {
    const reviewId = `review-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const fullReview: MarketplaceReview = {
      id: reviewId,
      bookingId: review.bookingId!,
      serviceId: review.serviceId!,
      providerId: review.providerId!,
      customerId: review.customerId!,
      customerName: review.customerName || "Anonymous",
      rating: review.rating || 0,
      review: review.review || "",
      categories: review.categories || {
        quality: review.rating || 0,
        timeliness: review.rating || 0,
        communication: review.rating || 0,
        value: review.rating || 0,
      },
      helpful: 0,
      verified: true,
      createdAt: new Date().toISOString(),
    };

    // Store review in database
    await dbAdapter.storeReview(tenantId, fullReview);

    // Update listing rating
    const listing = await dbAdapter.getListing(tenantId, review.serviceId!);
    if (listing) {
      // Calculate new average rating
      const allReviews = await dbAdapter.getListingReviews(
        tenantId,
        review.serviceId!,
      );
      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      listing.rating = Math.round(avgRating * 10) / 10;
      listing.totalReviews = allReviews.length;
      await dbAdapter.storeListing(tenantId, listing);

      // Send notification
      await marketplaceNotificationService.notifyReviewSubmitted(
        reviewId,
        review.serviceId!,
        review.providerId!,
      );

      // Send real-time update
      await marketplaceRealtimeService.publishMarketplaceUpdate(
        "review.added",
        { reviewId, rating: fullReview.rating },
        review.serviceId,
      );
    }

    // Update provider rating
    const provider = await dbAdapter.getProvider(tenantId, review.providerId!);
    if (provider) {
      const providerReviews = await dbAdapter.getProviderReviews(
        tenantId,
        review.providerId!,
      );
      const avgRating =
        providerReviews.reduce((sum, r) => sum + r.rating, 0) /
        providerReviews.length;
      provider.rating = Math.round(avgRating * 10) / 10;
      await dbAdapter.storeProvider(tenantId, provider);
    }

    await eventBus.publish("marketplace.review.added", { reviewId, tenantId });

    return fullReview;
  }

  /**
   * Get service reviews
   */
  async getServiceReviews(
    serviceId: string,
    tenantId: string = "default",
  ): Promise<MarketplaceReview[]> {
    return await dbAdapter.getListingReviews(tenantId, serviceId);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get service category from listing
   */
  private getServiceCategory(
    listing: MarketplaceServiceListing,
  ): MarketplaceServiceCategory {
    if ("serviceType" in listing) {
      const serviceType = (listing as any).serviceType;
      if (
        serviceType === "GENERAL_STORAGE" ||
        serviceType === "COLD_STORAGE" ||
        serviceType === "HAZMAT_STORAGE"
      ) {
        return "STORAGE";
      }
      if (
        serviceType === "FTL" ||
        serviceType === "LTL" ||
        serviceType === "EXPRESS"
      ) {
        return "TRANSPORTATION";
      }
      if (
        serviceType === "FCL" ||
        serviceType === "LCL" ||
        serviceType === "AIR_FREIGHT"
      ) {
        return "FREIGHT";
      }
      if (
        serviceType === "CIVIL_DEFENSE" ||
        serviceType === "SAUDIZATION" ||
        serviceType === "COMPLIANCE"
      ) {
        return "CONSULTING";
      }
      if (serviceType === "WAREHOUSE_STAFF" || serviceType === "DRIVERS") {
        return "MANPOWER";
      }
    }
    if ("dockDoors" in listing) {
      return "CROSSDOCKING";
    }
    if ("languages" in listing) {
      return "TRANSLATION";
    }
    if ("warehouses" in listing) {
      return "WAREHOUSE_NETWORK";
    }
    return "OTHER";
  }

  /**
   * Search bookings with filters
   */
  async searchBookings(filters: {
    customerId?: string;
    providerId?: string;
    serviceId?: string;
    status?: BookingStatus;
    category?: MarketplaceServiceCategory;
    dateRange?: { start: string; end: string };
  }): Promise<MarketplaceBooking[]> {
    let results = Array.from(bookings.values());

    if (filters.customerId) {
      results = results.filter((b) => b.customerId === filters.customerId);
    }

    if (filters.providerId) {
      results = results.filter((b) => b.providerId === filters.providerId);
    }

    if (filters.serviceId) {
      results = results.filter((b) => b.serviceId === filters.serviceId);
    }

    if (filters.status) {
      results = results.filter((b) => b.status === filters.status);
    }

    if (filters.category) {
      results = results.filter((b) => b.serviceCategory === filters.category);
    }

    if (filters.dateRange) {
      results = results.filter((b) => {
        const bookingDate = new Date(b.createdAt);
        return (
          bookingDate >= new Date(filters.dateRange!.start) &&
          bookingDate <= new Date(filters.dateRange!.end)
        );
      });
    }

    return results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(): Promise<{
    totalListings: number;
    totalProviders: number;
    totalBookings: number;
    categories: Record<MarketplaceServiceCategory, number>;
    averageRating: number;
  }> {
    if (!initialized) {
      await initializeMockData();
      initialized = true;
    }
    const totalListings = listings.size;
    const totalProviders = providers.size;
    const totalBookings = bookings.size;

    const categories: Record<string, number> = {};
    Array.from(listings.values()).forEach((listing) => {
      const category = this.getServiceCategory(listing);
      categories[category] = (categories[category] || 0) + 1;
    });

    const allRatings = Array.from(listings.values()).map((l) => l.rating);
    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
        : 0;

    return {
      totalListings,
      totalProviders,
      totalBookings,
      categories: categories as Record<MarketplaceServiceCategory, number>,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// Singleton instance
export const marketplaceService = new MarketplaceService();
