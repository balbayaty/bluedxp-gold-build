"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import ServiceListingCard from "@/components/marketplace/ServiceListingCard";
import { marketplaceService } from "@/lib/services/marketplace";
import type { MarketplaceServiceListing } from "@/types/marketplace";
import { PremiumLoader, SkeletonCard } from "@/components/loading";

export default function TransportationServicesPage() {
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
        category: "TRANSPORTATION",
      });
      setListings(results);
    } catch (error) {
      console.error("Failed to load transportation listings:", error);
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
      title="Transportation Services"
      description="Find FTL, LTL, Express, and Last Mile delivery services"
      icon="ri-truck-line"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            {loading
              ? "Loading services..."
              : `${listings.length} Transportation Services Available`}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                No transportation services found
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
