/**
 * BIM Marketplace Service
 *
 * Comprehensive marketplace platform for BIM models, services, professionals, and tools.
 * Features:
 * - Model marketplace (buy/sell/share BIM models)
 * - Professional services marketplace
 * - Service marketplace (modeling, analysis, coordination)
 * - Tool marketplace (plugins, software, APIs)
 * - Template marketplace
 * - AI-powered search and recommendations
 * - Reviews and ratings
 * - Booking and transaction management
 * - Integration with existing marketplace module
 */

import type {
  BIMMarketplaceListing,
  BIMMarketplaceSearchFilters,
  BIMMarketplaceSearchResult,
  BIMMarketplaceBooking,
  BIMProvider,
  BIMMarketplaceCategory,
} from "@/types/bim-marketplace";
import { eventBus } from "@/lib/services/event-store";
import type { BIMModel } from "@/types/facility";

export interface BIMMarketplaceServiceConfig {
  enableAIRecommendations?: boolean;
  enableRealTimeUpdates?: boolean;
  enableAnalytics?: boolean;
  defaultCurrency?: string;
  maxFileSize?: number;
}

export class BIMMarketplaceService {
  private config: BIMMarketplaceServiceConfig;
  private listings: Map<string, BIMMarketplaceListing> = new Map();
  private providers: Map<string, BIMProvider> = new Map();
  private bookings: Map<string, BIMMarketplaceBooking> = new Map();

  constructor(config: BIMMarketplaceServiceConfig = {}) {
    this.config = {
      enableAIRecommendations: true,
      enableRealTimeUpdates: true,
      enableAnalytics: true,
      defaultCurrency: "USD",
      maxFileSize: 500 * 1024 * 1024, // 500MB
      ...config,
    };
  }

  /**
   * Create marketplace listing
   */
  async createListing(
    providerId: string,
    listing: Omit<
      BIMMarketplaceListing,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "reviews"
      | "averageRating"
      | "reviewCount"
      | "viewCount"
      | "favoriteCount"
    >,
  ): Promise<BIMMarketplaceListing> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const newListing: BIMMarketplaceListing = {
      ...listing,
      id: `bim-listing-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      providerId,
      providerName: provider.displayName || provider.name,
      providerRating: provider.averageRating,
      providerVerified: provider.verified,
      reviews: [],
      averageRating: 0,
      reviewCount: 0,
      viewCount: 0,
      favoriteCount: 0,
      status: listing.status || "draft",
      featured: listing.featured || false,
      verified: listing.verified || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.listings.set(newListing.id, newListing);

    // Publish event
    await eventBus.publish("bim.marketplace.listing.created", {
      listingId: newListing.id,
      providerId,
      type: listing.type,
      category: listing.category,
    });

    return newListing;
  }

  /**
   * Search marketplace listings
   */
  async searchListings(
    filters: BIMMarketplaceSearchFilters,
  ): Promise<BIMMarketplaceSearchResult> {
    let results = Array.from(this.listings.values());

    // Apply filters
    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query) ||
          l.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    if (filters.category && filters.category.length > 0) {
      results = results.filter((l) => filters.category!.includes(l.category));
    }

    if (filters.type && filters.type.length > 0) {
      results = results.filter((l) => filters.type!.includes(l.type));
    }

    if (filters.rating?.min) {
      results = results.filter((l) => l.averageRating >= filters.rating!.min!);
    }

    if (filters.verified !== undefined) {
      results = results.filter((l) => l.verified === filters.verified);
    }

    if (filters.featured !== undefined) {
      results = results.filter((l) => l.featured === filters.featured);
    }

    if (filters.availability && filters.availability.length > 0) {
      results = results.filter((l) =>
        filters.availability!.includes(l.availability),
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((l) =>
        filters.tags!.some((tag) => l.tags.includes(tag)),
      );
    }

    if (filters.compatibleSoftware && filters.compatibleSoftware.length > 0) {
      results = results.filter((l) =>
        filters.compatibleSoftware!.some((software) =>
          l.compatibleSoftware.includes(software),
        ),
      );
    }

    // Sort
    const sortBy = filters.sortBy || "relevance";
    switch (sortBy) {
      case "rating":
        results.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case "price-low":
        results.sort(
          (a, b) => (a.pricing.amount || 0) - (b.pricing.amount || 0),
        );
        break;
      case "price-high":
        results.sort(
          (a, b) => (b.pricing.amount || 0) - (a.pricing.amount || 0),
        );
        break;
      case "newest":
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case "popular":
        results.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case "downloads":
        results.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
        break;
      default:
        // Relevance (default)
        break;
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedResults = results.slice(start, end);

    // Calculate facets
    const facets = {
      categories: this.calculateFacet(results, "category"),
      priceRanges: this.calculatePriceRanges(results),
      ratings: this.calculateFacet(results, "averageRating", (r) =>
        Math.floor(r.averageRating).toString(),
      ),
      locations: this.calculateFacet(
        results,
        "location",
        (r) => r.location?.city || r.location?.region || "Unknown",
      ),
      tags: this.calculateTagFacet(results),
    };

    return {
      listings: paginatedResults,
      total: results.length,
      page,
      limit,
      hasMore: end < results.length,
      facets,
    };
  }

  /**
   * Get listing by ID
   */
  async getListing(listingId: string): Promise<BIMMarketplaceListing | null> {
    const listing = this.listings.get(listingId);
    if (listing) {
      // Increment view count
      listing.viewCount++;
      this.listings.set(listingId, listing);

      // Publish event
      await eventBus.publish("bim.marketplace.listing.viewed", {
        listingId,
        viewCount: listing.viewCount,
      });
    }
    return listing || null;
  }

  /**
   * Update listing
   */
  async updateListing(
    listingId: string,
    updates: Partial<BIMMarketplaceListing>,
  ): Promise<BIMMarketplaceListing> {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error(`Listing ${listingId} not found`);
    }

    const updatedListing: BIMMarketplaceListing = {
      ...listing,
      ...updates,
      updatedAt: new Date(),
    };

    this.listings.set(listingId, updatedListing);

    // Publish event
    await eventBus.publish("bim.marketplace.listing.updated", {
      listingId,
      changes: Object.keys(updates),
    });

    return updatedListing;
  }

  /**
   * Create booking
   */
  async createBooking(
    listingId: string,
    buyerId: string,
    booking: Omit<
      BIMMarketplaceBooking,
      "id" | "createdAt" | "updatedAt" | "messages" | "status"
    >,
  ): Promise<BIMMarketplaceBooking> {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error(`Listing ${listingId} not found`);
    }

    const newBooking: BIMMarketplaceBooking = {
      ...booking,
      id: `bim-booking-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      listingId,
      listingType: listing.type,
      providerId: listing.providerId,
      providerName: listing.providerName,
      status: "pending",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.bookings.set(newBooking.id, newBooking);

    // Publish event
    await eventBus.publish("bim.marketplace.booking.created", {
      bookingId: newBooking.id,
      listingId,
      buyerId,
      providerId: listing.providerId,
    });

    return newBooking;
  }

  /**
   * Get bookings for user
   */
  async getBookings(
    userId: string,
    role: "buyer" | "provider",
  ): Promise<BIMMarketplaceBooking[]> {
    const allBookings = Array.from(this.bookings.values());
    if (role === "buyer") {
      return allBookings.filter((b) => b.buyerId === userId);
    } else {
      return allBookings.filter((b) => b.providerId === userId);
    }
  }

  /**
   * Register provider
   */
  async registerProvider(
    provider: Omit<BIMProvider, "id" | "createdAt" | "updatedAt">,
  ): Promise<BIMProvider> {
    const newProvider: BIMProvider = {
      ...provider,
      id: `bim-provider-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      averageRating: 0,
      totalReviews: 0,
      totalListings: 0,
      portfolio: provider.portfolio || [],
      verificationBadges: provider.verificationBadges || [],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.providers.set(newProvider.id, newProvider);

    // Publish event
    await eventBus.publish("bim.marketplace.provider.registered", {
      providerId: newProvider.id,
      type: provider.type,
    });

    return newProvider;
  }

  /**
   * Get provider by ID
   */
  async getProvider(providerId: string): Promise<BIMProvider | null> {
    return this.providers.get(providerId) || null;
  }

  /**
   * Add review to listing
   */
  async addReview(
    listingId: string,
    review: Omit<
      import("@/types/bim-marketplace").BIMMarketplaceReview,
      "id" | "createdAt" | "updatedAt"
    >,
  ): Promise<import("@/types/bim-marketplace").BIMMarketplaceReview> {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error(`Listing ${listingId} not found`);
    }

    const newReview: import("@/types/bim-marketplace").BIMMarketplaceReview = {
      ...review,
      id: `bim-review-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      listingId,
      createdAt: new Date(),
    };

    listing.reviews.push(newReview);

    // Recalculate average rating
    const totalRating = listing.reviews.reduce((sum, r) => sum + r.rating, 0);
    listing.averageRating = totalRating / listing.reviews.length;
    listing.reviewCount = listing.reviews.length;

    this.listings.set(listingId, listing);

    // Update provider rating
    const provider = this.providers.get(listing.providerId);
    if (provider) {
      const providerListings = Array.from(this.listings.values()).filter(
        (l) => l.providerId === provider.id,
      );
      const providerTotalRating = providerListings.reduce(
        (sum, l) => sum + l.averageRating,
        0,
      );
      provider.averageRating = providerTotalRating / providerListings.length;
      provider.totalReviews = providerListings.reduce(
        (sum, l) => sum + l.reviewCount,
        0,
      );
      this.providers.set(provider.id, provider);
    }

    // Publish event
    await eventBus.publish("bim.marketplace.review.added", {
      reviewId: newReview.id,
      listingId,
      rating: newReview.rating,
    });

    return newReview;
  }

  /**
   * Get AI recommendations
   */
  async getRecommendations(
    userId: string,
    limit: number = 10,
  ): Promise<BIMMarketplaceListing[]> {
    // In real implementation, use ML model for recommendations
    // For now, return featured listings
    const featured = Array.from(this.listings.values())
      .filter((l) => l.featured && l.status === "published")
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);

    return featured;
  }

  /**
   * Link BIM model to marketplace listing
   */
  async linkModelToListing(modelId: string, listingId: string): Promise<void> {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error(`Listing ${listingId} not found`);
    }

    if (listing.type === "model" && listing.modelData) {
      listing.modelData.modelId = modelId;
      this.listings.set(listingId, listing);

      // Publish event
      await eventBus.publish("bim.marketplace.model.linked", {
        modelId,
        listingId,
      });
    }
  }

  // Helper methods
  private calculateFacet(
    results: BIMMarketplaceListing[],
    field: keyof BIMMarketplaceListing,
    transform?: (item: BIMMarketplaceListing) => string,
  ): { category: string; count: number }[] {
    const map = new Map<string, number>();
    results.forEach((item) => {
      const key = transform ? transform(item) : String(item[field]);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  }

  private calculatePriceRanges(
    results: BIMMarketplaceListing[],
  ): { range: string; count: number }[] {
    const ranges = [
      { label: "Free", min: 0, max: 0 },
      { label: "$0 - $50", min: 0, max: 50 },
      { label: "$50 - $200", min: 50, max: 200 },
      { label: "$200 - $500", min: 200, max: 500 },
      { label: "$500+", min: 500, max: Infinity },
    ];

    return ranges.map((range) => ({
      range: range.label,
      count: results.filter((r) => {
        const price = r.pricing.amount || 0;
        return price >= range.min && price <= range.max;
      }).length,
    }));
  }

  private calculateTagFacet(
    results: BIMMarketplaceListing[],
  ): { tag: string; count: number }[] {
    const map = new Map<string, number>();
    results.forEach((item) => {
      item.tags.forEach((tag) => {
        map.set(tag, (map.get(tag) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }
}

// Initialize with mock data (lazy load to avoid circular dependencies)
async function initializeMockData(service: BIMMarketplaceService) {
  if (service["listings"].size === 0 && service["providers"].size === 0) {
    try {
      const { mockBIMProviders, mockBIMMarketplaceListings } =
        await import("./bimMarketplaceMockData");

      // Initialize providers
      for (const provider of mockBIMProviders) {
        service["providers"].set(provider.id, provider);
      }

      // Initialize listings
      for (const listing of mockBIMMarketplaceListings) {
        service["listings"].set(listing.id, listing);
      }
    } catch (error) {
      console.warn("Failed to load BIM marketplace mock data:", error);
    }
  }
}

// Singleton instance
let bimMarketplaceServiceInstance: BIMMarketplaceService | null = null;

export function getBIMMarketplaceService(
  config?: BIMMarketplaceServiceConfig,
): BIMMarketplaceService {
  if (!bimMarketplaceServiceInstance) {
    bimMarketplaceServiceInstance = new BIMMarketplaceService(config);
    // Initialize mock data on first call
    initializeMockData(bimMarketplaceServiceInstance).catch(console.error);
  }
  return bimMarketplaceServiceInstance;
}
