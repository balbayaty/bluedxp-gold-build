"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import ServiceListingCard from "@/components/marketplace/ServiceListingCard";
import { Heart, Building2, Search } from "lucide-react";
import { favoritesService } from "@/lib/services/marketplace/favoritesService";
import { marketplaceService } from "@/lib/services/marketplace";
import type { MarketplaceServiceListing } from "@/types/marketplace";

export default function FavoritesPage() {
  const userId = "default-user"; // In production, get from auth
  const [favoriteListings, setFavoriteListings] = useState<
    MarketplaceServiceListing[]
  >([]);
  const [favoriteProviders, setFavoriteProviders] = useState<any[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    "listings" | "providers" | "searches"
  >("listings");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const [listings, providers] = await Promise.all([
        favoritesService.getFavoriteListings(userId),
        favoritesService.getFavoriteProviders(userId),
      ]);

      // Saved searches are managed by advancedSearchService
      const { advancedSearchService } =
        await import("@/lib/services/search/advancedSearchService");
      const searches = advancedSearchService.getSavedSearches("marketplace");

      // Load full listing data
      const listingData = await Promise.all(
        listings.map(async (fav) => {
          const listing = await marketplaceService.getListing(fav.listingId);
          return listing;
        }),
      );

      setFavoriteListings(
        listingData.filter(Boolean) as MarketplaceServiceListing[],
      );
      setFavoriteProviders(providers);
      setSavedSearches(searches);
    } catch (error) {
      console.error("Failed to load favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (listingId: string) => {
    window.location.href = `/marketplace/bookings/new?serviceId=${listingId}`;
  };

  const handleView = (listingId: string) => {
    window.location.href = `/marketplace/listings/${listingId}`;
  };

  return (
    <PageTemplate
      title="My Favorites"
      description="Your saved listings, providers, and searches"
      icon="ri-heart-line"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-1 flex space-x-1">
          <button
            onClick={() => setActiveTab("listings")}
            className={`flex-1 px-4 py-2 rounded-lg transition ${
              activeTab === "listings"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Listings ({favoriteListings.length})
          </button>
          <button
            onClick={() => setActiveTab("providers")}
            className={`flex-1 px-4 py-2 rounded-lg transition ${
              activeTab === "providers"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Providers ({favoriteProviders.length})
          </button>
          <button
            onClick={() => setActiveTab("searches")}
            className={`flex-1 px-4 py-2 rounded-lg transition ${
              activeTab === "searches"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Saved Searches ({savedSearches.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-lg p-6 animate-pulse"
              >
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeTab === "listings" && (
              <div>
                {favoriteListings.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      No favorite listings
                    </h3>
                    <p className="text-slate-500 mb-6">
                      Start favoriting listings to see them here
                    </p>
                    <a
                      href="/marketplace/search"
                      className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Browse Services
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteListings.map((listing) => (
                      <ServiceListingCard
                        key={listing.id}
                        listing={listing}
                        onBook={handleBook}
                        onView={handleView}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "providers" && (
              <div>
                {favoriteProviders.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      No favorite providers
                    </h3>
                    <p className="text-slate-500 mb-6">
                      Start favoriting providers to see them here
                    </p>
                    <a
                      href="/marketplace/providers"
                      className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Browse Providers
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {favoriteProviders.map((fav) => (
                      <div
                        key={fav.id}
                        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-800 text-lg">
                              {fav.providerId}
                            </h3>
                            {fav.notes && (
                              <p className="text-sm text-slate-500 mt-1">
                                {fav.notes}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 mt-2">
                              Added {new Date(fav.addedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <a
                            href={`/marketplace/providers/${fav.providerId}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            View Provider
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "searches" && (
              <div>
                {savedSearches.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      No saved searches
                    </h3>
                    <p className="text-slate-500 mb-6">
                      Save your searches to quickly access them later
                    </p>
                    <a
                      href="/marketplace/search"
                      className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Start Searching
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedSearches.map((search) => (
                      <div
                        key={search.id}
                        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 text-lg mb-1">
                              {search.name}
                            </h3>
                            <p className="text-sm text-slate-600 mb-2">
                              Query: {search.query}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-slate-500">
                              <span>Used {search.useCount} times</span>
                              <span>
                                Created{" "}
                                {new Date(
                                  search.createdAt,
                                ).toLocaleDateString()}
                              </span>
                              {search.lastUsed && (
                                <span>
                                  Last used{" "}
                                  {new Date(
                                    search.lastUsed,
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <a
                            href={`/marketplace/search?q=${encodeURIComponent(search.query)}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ml-4"
                          >
                            Use Search
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageTemplate>
  );
}
