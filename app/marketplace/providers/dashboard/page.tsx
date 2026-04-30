"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { TrendingUp, Package, DollarSign, Star, Plus } from "lucide-react";
import { marketplaceService } from "@/lib/services/marketplace";
import type {
  MarketplaceServiceListing,
  ServiceProvider,
} from "@/types/marketplace";

export default function ProviderDashboard() {
  const router = useRouter();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [listings, setListings] = useState<MarketplaceServiceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // In a real app, get provider ID from auth context
      const providerId = "provider-1"; // Mock

      const providerData = await marketplaceService.getProvider(providerId);
      setProvider(providerData);

      if (providerData) {
        const providerListings =
          await marketplaceService.getProviderListings(providerId);
        setListings(providerListings);
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalListings: listings.length,
    totalBookings: provider?.totalBookings || 0,
    totalRevenue: provider?.totalRevenue || 0,
    averageRating: provider?.rating || 0,
  };

  return (
    <PageTemplate
      title="Provider Dashboard"
      description="Manage your service listings and bookings"
      icon="ri-dashboard-3-line"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
            <Package className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">{stats.totalListings}</div>
            <div className="text-sm opacity-90 mt-1">Active Listings</div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <TrendingUp className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">{stats.totalBookings}</div>
            <div className="text-sm opacity-90 mt-1">Total Bookings</div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <DollarSign className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">
              {stats.totalRevenue.toLocaleString()} SAR
            </div>
            <div className="text-sm opacity-90 mt-1">Total Revenue</div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <Star className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-3xl font-bold">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="text-sm opacity-90 mt-1">Average Rating</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/marketplace/listings/new")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition flex items-center space-x-4"
          >
            <div className="bg-blue-100 p-3 rounded-lg">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-800">
                Create New Listing
              </div>
              <div className="text-sm text-slate-500">
                Add a new service to the marketplace
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push("/marketplace/providers/bookings")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition flex items-center space-x-4"
          >
            <div className="bg-green-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-800">
                Manage Bookings
              </div>
              <div className="text-sm text-slate-500">
                View and manage booking requests
              </div>
            </div>
          </button>
        </div>

        {/* Listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-800">My Listings</h2>
            <button
              onClick={() => router.push("/marketplace/listings/new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Listing</span>
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-lg p-6 animate-pulse"
                >
                  <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                No listings yet
              </h3>
              <p className="text-slate-500 mb-6">
                Create your first service listing to get started
              </p>
              <button
                onClick={() => router.push("/marketplace/listings/new")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create Listing
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
                  onClick={() =>
                    router.push(`/marketplace/listings/${listing.id}`)
                  }
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg mb-1">
                        {listing.providerName}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {(listing.serviceCategory || "Service").replace(
                          /_/g,
                          " ",
                        )}
                      </p>
                    </div>
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Rating</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {listing.rating.toFixed(1)} ⭐
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Bookings</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {listing.totalBookings}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Price</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {"pricing" in listing
                          ? `${(listing.pricing as any).basePrice.toLocaleString()} ${(listing.pricing as any).currency}`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Updated</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {new Date(listing.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}
