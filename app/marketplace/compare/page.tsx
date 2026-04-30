"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import ServiceListingCard from "@/components/marketplace/ServiceListingCard";
import { Scale, X } from "lucide-react";
import { marketplaceService } from "@/lib/services/marketplace";
import type { MarketplaceServiceListing } from "@/types/marketplace";

export default function ComparePage() {
  const searchParams = useSearchParams();
  const listingIds = searchParams.get("ids")?.split(",") || [];
  const [listings, setListings] = useState<MarketplaceServiceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, [listingIds]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const loadedListings = await Promise.all(
        listingIds.map((id) => marketplaceService.getListing(id)),
      );
      setListings(
        loadedListings.filter(Boolean) as MarketplaceServiceListing[],
      );
    } catch (error) {
      console.error("Failed to load listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeListing = (id: string) => {
    const newIds = listingIds.filter((i) => i !== id);
    window.location.href = `/marketplace/compare?ids=${newIds.join(",")}`;
  };

  const getPrice = (listing: MarketplaceServiceListing) => {
    if ("pricing" in listing) {
      return (listing.pricing as any).basePrice || 0;
    }
    return 0;
  };

  if (loading) {
    return (
      <PageTemplate
        title="Compare Services"
        description="Compare multiple services side-by-side"
        icon="ri-scales-3-line"
      >
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-slate-500">Loading comparisons...</p>
        </div>
      </PageTemplate>
    );
  }

  if (listings.length === 0) {
    return (
      <PageTemplate
        title="Compare Services"
        description="Compare multiple services side-by-side"
        icon="ri-scales-3-line"
      >
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Scale className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            No services to compare
          </h3>
          <p className="text-slate-500 mb-6">
            Select services to compare from the marketplace
          </p>
          <a
            href="/marketplace/search"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Browse Services
          </a>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Compare Services"
      description="Compare multiple services side-by-side"
      icon="ri-scales-3-line"
    >
      <div className="space-y-6">
        {/* Comparison Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">
                    Feature
                  </th>
                  {listings.map((listing) => (
                    <th
                      key={listing.id}
                      className="text-center py-4 px-6 font-semibold text-slate-700 relative"
                    >
                      <button
                        onClick={() => removeListing(listing.id)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="font-bold text-slate-800">
                        {listing.title || listing.providerName}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {listing.providerName}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-6 font-semibold text-slate-700">
                    Price
                  </td>
                  {listings.map((listing) => (
                    <td key={listing.id} className="py-4 px-6 text-center">
                      <div className="text-xl font-bold text-slate-800">
                        {getPrice(listing).toLocaleString()} SAR
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <td className="py-4 px-6 font-semibold text-slate-700">
                    Rating
                  </td>
                  {listings.map((listing) => (
                    <td key={listing.id} className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-lg font-bold text-slate-800">
                          {listing.rating.toFixed(1)}
                        </span>
                        <span className="text-yellow-500">⭐</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {listing.totalReviews || 0} reviews
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-6 font-semibold text-slate-700">
                    Availability
                  </td>
                  {listings.map((listing) => (
                    <td key={listing.id} className="py-4 px-6 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          listing.availability === "AVAILABLE"
                            ? "bg-green-100 text-green-700"
                            : listing.availability === "LIMITED"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {listing.availability}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <td className="py-4 px-6 font-semibold text-slate-700">
                    Bookings
                  </td>
                  {listings.map((listing) => (
                    <td
                      key={listing.id}
                      className="py-4 px-6 text-center text-slate-600"
                    >
                      {listing.totalBookings || 0}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-slate-700">
                    Actions
                  </td>
                  {listings.map((listing) => (
                    <td key={listing.id} className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <a
                          href={`/marketplace/listings/${listing.id}`}
                          className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition text-sm"
                        >
                          View
                        </a>
                        <a
                          href={`/marketplace/bookings/new?serviceId=${listing.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          Book
                        </a>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Individual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ServiceListingCard
              key={listing.id}
              listing={listing}
              onBook={(id) =>
                (window.location.href = `/marketplace/bookings/new?serviceId=${id}`)
              }
              onView={(id) =>
                (window.location.href = `/marketplace/listings/${id}`)
              }
            />
          ))}
        </div>
      </div>
    </PageTemplate>
  );
}
