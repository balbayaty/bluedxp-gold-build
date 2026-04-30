/**
 * Marketplace Favorites Service
 * Manages user favorites, bookmarks, and saved items
 */

import type {
  MarketplaceServiceListing,
  ServiceProvider,
} from "@/types/marketplace";

export interface FavoriteListing {
  id: string;
  userId: string;
  listingId: string;
  listing?: MarketplaceServiceListing;
  addedAt: string;
  notes?: string;
  tags?: string[];
}

export interface FavoriteProvider {
  id: string;
  userId: string;
  providerId: string;
  provider?: ServiceProvider;
  addedAt: string;
  notes?: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: string;
  filters: any;
  createdAt: string;
  lastUsed?: string;
  useCount: number;
}

// In-memory storage (replace with database)
const favoriteListings: Map<string, FavoriteListing> = new Map();
const favoriteProviders: Map<string, FavoriteProvider> = new Map();
const savedSearches: Map<string, SavedSearch> = new Map();

export class FavoritesService {
  /**
   * Add listing to favorites
   */
  async addFavoriteListing(
    userId: string,
    listingId: string,
    notes?: string,
    tags?: string[],
  ): Promise<FavoriteListing> {
    const id = `fav-listing-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const favorite: FavoriteListing = {
      id,
      userId,
      listingId,
      addedAt: new Date().toISOString(),
      notes,
      tags,
    };
    favoriteListings.set(id, favorite);
    return favorite;
  }

  /**
   * Remove listing from favorites
   */
  async removeFavoriteListing(
    userId: string,
    listingId: string,
  ): Promise<boolean> {
    const favorite = Array.from(favoriteListings.values()).find(
      (f) => f.userId === userId && f.listingId === listingId,
    );
    if (favorite) {
      favoriteListings.delete(favorite.id);
      return true;
    }
    return false;
  }

  /**
   * Get user's favorite listings
   */
  async getFavoriteListings(userId: string): Promise<FavoriteListing[]> {
    return Array.from(favoriteListings.values()).filter(
      (f) => f.userId === userId,
    );
  }

  /**
   * Check if listing is favorited
   */
  async isListingFavorited(
    userId: string,
    listingId: string,
  ): Promise<boolean> {
    return Array.from(favoriteListings.values()).some(
      (f) => f.userId === userId && f.listingId === listingId,
    );
  }

  /**
   * Add provider to favorites
   */
  async addFavoriteProvider(
    userId: string,
    providerId: string,
    notes?: string,
  ): Promise<FavoriteProvider> {
    const id = `fav-provider-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const favorite: FavoriteProvider = {
      id,
      userId,
      providerId,
      addedAt: new Date().toISOString(),
      notes,
    };
    favoriteProviders.set(id, favorite);
    return favorite;
  }

  /**
   * Remove provider from favorites
   */
  async removeFavoriteProvider(
    userId: string,
    providerId: string,
  ): Promise<boolean> {
    const favorite = Array.from(favoriteProviders.values()).find(
      (f) => f.userId === userId && f.providerId === providerId,
    );
    if (favorite) {
      favoriteProviders.delete(favorite.id);
      return true;
    }
    return false;
  }

  /**
   * Get user's favorite providers
   */
  async getFavoriteProviders(userId: string): Promise<FavoriteProvider[]> {
    return Array.from(favoriteProviders.values()).filter(
      (f) => f.userId === userId,
    );
  }

  /**
   * Save search
   */
  async saveSearch(
    userId: string,
    name: string,
    query: string,
    filters: any,
  ): Promise<SavedSearch> {
    const id = `saved-search-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const saved: SavedSearch = {
      id,
      userId,
      name,
      query,
      filters,
      createdAt: new Date().toISOString(),
      useCount: 0,
    };
    savedSearches.set(id, saved);
    return saved;
  }

  /**
   * Get saved searches
   */
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    return Array.from(savedSearches.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => {
        const aTime = a.lastUsed
          ? new Date(a.lastUsed).getTime()
          : new Date(a.createdAt).getTime();
        const bTime = b.lastUsed
          ? new Date(b.lastUsed).getTime()
          : new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
  }

  /**
   * Use saved search (increment use count)
   */
  async useSavedSearch(searchId: string): Promise<SavedSearch | null> {
    const saved = savedSearches.get(searchId);
    if (saved) {
      saved.useCount++;
      saved.lastUsed = new Date().toISOString();
      savedSearches.set(searchId, saved);
      return saved;
    }
    return null;
  }

  /**
   * Delete saved search
   */
  async deleteSavedSearch(searchId: string): Promise<boolean> {
    return savedSearches.delete(searchId);
  }

  /**
   * Get recently viewed listings (from localStorage or database)
   */
  async getRecentlyViewed(
    userId: string,
    limit: number = 10,
  ): Promise<string[]> {
    // In production, fetch from database
    // For now, return empty array
    return [];
  }

  /**
   * Add to recently viewed
   */
  async addToRecentlyViewed(userId: string, listingId: string): Promise<void> {
    // In production, save to database
    // For now, could use localStorage on client side
  }
}

// Singleton instance
export const favoritesService = new FavoritesService();
