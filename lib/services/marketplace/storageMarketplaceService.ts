/**
 * Storage Marketplace Service
 * Specialized service for storage/warehouse listings
 */

import { marketplaceService } from "./marketplaceService";
import type {
  StorageServiceListing,
  StorageServiceType,
  MarketplaceSearchFilters,
} from "@/types/marketplace";

export class StorageMarketplaceService {
  /**
   * Create storage listing
   */
  async createStorageListing(
    providerId: string,
    listing: Omit<
      StorageServiceListing,
      | "id"
      | "providerId"
      | "providerName"
      | "rating"
      | "totalBookings"
      | "availability"
      | "createdAt"
      | "updatedAt"
    >,
  ): Promise<StorageServiceListing> {
    return (await marketplaceService.createListing(
      providerId,
      "STORAGE",
      listing,
    )) as StorageServiceListing;
  }

  /**
   * Search storage listings
   */
  async searchStorageListings(
    filters: MarketplaceSearchFilters & {
      serviceType?: StorageServiceType;
      minCapacity?: number;
      features?: string[];
    },
  ): Promise<StorageServiceListing[]> {
    const results = await marketplaceService.searchListings({
      ...filters,
      category: "STORAGE",
    });

    return results
      .filter(
        (listing): listing is StorageServiceListing => "serviceType" in listing,
      )
      .filter((listing) => {
        if (
          filters.serviceType &&
          listing.serviceType !== filters.serviceType
        ) {
          return false;
        }
        if (
          filters.minCapacity &&
          listing.capacity.available < filters.minCapacity
        ) {
          return false;
        }
        if (filters.features && filters.features.length > 0) {
          const listingFeatures = listing.features || [];
          const hasAllFeatures = filters.features.every((f) =>
            listingFeatures.includes(f),
          );
          if (!hasAllFeatures) {
            return false;
          }
        }
        return true;
      });
  }

  /**
   * Get available storage capacity by location
   */
  async getAvailableCapacityByLocation(
    city: string,
    country: string,
  ): Promise<{
    total: number;
    available: number;
    listings: StorageServiceListing[];
  }> {
    const listings = await this.searchStorageListings({
      location: { city, country },
      availability: "AVAILABLE",
    });

    const total = listings.reduce((sum, l) => sum + l.capacity.total, 0);
    const available = listings.reduce(
      (sum, l) => sum + l.capacity.available,
      0,
    );

    return { total, available, listings };
  }
}

export const storageMarketplaceService = new StorageMarketplaceService();
