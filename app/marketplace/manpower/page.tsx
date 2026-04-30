"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import ServiceListingCard from "@/components/marketplace/ServiceListingCard";
import { marketplaceService } from "@/lib/services/marketplace";
import type { MarketplaceServiceListing } from "@/types/marketplace";

export default function ManpowerServicesPage() {
  const router = useRouter();
  const [listings, setListings] = useState<MarketplaceServiceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      const results = await marketplaceService.searchListings({
        category: "MANPOWER",
      });
      setListings(results);
    } catch (error) {
      console.error("Failed to load manpower listings:", error);
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
      title="Manpower Services"
      description="Find warehouse staff, drivers, and training services"
      icon="ri-team-line"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            {loading
              ? "Loading..."
              : `${listings.length} Manpower Services Available`}
          </h2>

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
                No manpower services found
              </h3>
              <p className="text-slate-500">
                Check back later for available services
              </p>
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
