"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import ServiceListingCard from "@/components/marketplace/ServiceListingCard";
import { storageMarketplaceService } from "@/lib/services/marketplace";
import type {
  StorageServiceListing,
  StorageServiceType,
} from "@/types/marketplace";

export default function StorageServicesPage() {
  const router = useRouter();
  const [listings, setListings] = useState<StorageServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    serviceType?: StorageServiceType;
    city?: string;
    minCapacity?: number;
  }>({});

  useEffect(() => {
    loadListings();
  }, [filters]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const results = await storageMarketplaceService.searchStorageListings({
        category: "STORAGE",
        ...filters,
      });
      setListings(results);
    } catch (error) {
      console.error("Failed to load storage listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (listingId: string) => {
    router.push(`/marketplace/bookings/new?serviceId=${listingId}`);
  };

  const handleView = (listingId: string) => {
    router.push(`/marketplace/listings/${listingId}`);
  };

  return (
    <PageTemplate
      title="Storage Services"
      description="Find warehouse storage solutions for your needs"
      icon="ri-building-4-line"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-slate-800 mb-4">
            Filter Storage Services
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Service Type
              </label>
              <select
                value={filters.serviceType || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    serviceType:
                      (e.target.value as StorageServiceType) || undefined,
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="GENERAL_STORAGE">General Storage</option>
                <option value="COLD_STORAGE">Cold Storage</option>
                <option value="HAZMAT_STORAGE">Hazmat Storage</option>
                <option value="BONDED_STORAGE">Bonded Storage</option>
                <option value="BULK_STORAGE">Bulk Storage</option>
                <option value="RACK_STORAGE">Rack Storage</option>
                <option value="OPEN_YARD">Open Yard</option>
                <option value="TEMPORARY_STORAGE">Temporary Storage</option>
                <option value="LONG_TERM_STORAGE">Long-term Storage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                City
              </label>
              <input
                type="text"
                placeholder="Riyadh, Jeddah..."
                value={filters.city || ""}
                onChange={(e) =>
                  setFilters({ ...filters, city: e.target.value || undefined })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Min Capacity (m³)
              </label>
              <input
                type="number"
                placeholder="100"
                value={filters.minCapacity || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    minCapacity: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">
              {loading
                ? "Loading..."
                : `${listings.length} Storage Services Available`}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
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
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                No storage services found
              </h3>
              <p className="text-slate-500">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
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
      </div>
    </PageTemplate>
  );
}
