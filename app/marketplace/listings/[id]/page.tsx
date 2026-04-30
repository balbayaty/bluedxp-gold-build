"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import {
  Star,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Building2,
  Phone,
  Mail,
} from "lucide-react";
import { marketplaceService } from "@/lib/services/marketplace";
import FavoriteButton from "@/components/marketplace/FavoriteButton";
import RealTimeIndicator from "@/components/marketplace/RealTimeIndicator";
import VerificationBadge from "@/components/marketplace/VerificationBadge";
import SustainabilityBadge from "@/components/marketplace/SustainabilityBadge";
import type {
  MarketplaceServiceListing,
  MarketplaceReview,
} from "@/types/marketplace";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [listing, setListing] = useState<MarketplaceServiceListing | null>(
    null,
  );
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (listingId) {
      loadListing();
      loadReviews();
    }
  }, [listingId]);

  const loadListing = async () => {
    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}`);
      const result = await response.json();
      if (result.success) {
        setListing(result.data);
      }
    } catch (error) {
      console.error("Failed to load listing:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const serviceReviews =
        await marketplaceService.getServiceReviews(listingId);
      setReviews(serviceReviews);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    }
  };

  const handleBook = () => {
    router.push(`/marketplace/bookings/new?serviceId=${listingId}`);
  };

  if (loading) {
    return (
      <PageTemplate
        title="Service Details"
        description="View service listing details"
        icon="ri-file-list-line"
      >
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-slate-500">Loading service details...</p>
        </div>
      </PageTemplate>
    );
  }

  if (!listing) {
    return (
      <PageTemplate
        title="Service Not Found"
        description="The service you're looking for doesn't exist"
        icon="ri-error-warning-line"
      >
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Service not found
          </h3>
          <p className="text-slate-500 mb-6">
            The service listing you're looking for doesn't exist
          </p>
          <button
            onClick={() => router.push("/marketplace/search")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Browse Services
          </button>
        </div>
      </PageTemplate>
    );
  }

  const getPrice = () => {
    if ("pricing" in listing) {
      const pricing = listing.pricing as any;
      return {
        amount: pricing.basePrice || 0,
        currency: pricing.currency || "SAR",
        model: pricing.model || "FIXED",
      };
    }
    return { amount: 0, currency: "SAR", model: "FIXED" };
  };

  const getLocation = () => {
    if ("location" in listing) {
      const location = listing.location as any;
      return {
        address: location.address || "",
        city: location.city || "",
        country: location.country || "",
        coordinates: location.coordinates,
      };
    }
    return { address: "", city: "", country: "", coordinates: undefined };
  };

  const price = getPrice();
  const location = getLocation();

  return (
    <PageTemplate
      title="Service Details"
      description={listing.providerName}
      icon="ri-file-list-line"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Overview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {listing.title || listing.providerName}
                  </h2>
                  <FavoriteButton
                    userId="default-user"
                    listingId={listing.id}
                    size="md"
                  />
                </div>
                <p className="text-slate-500 mb-2">
                  {(
                    (listing as any).serviceCategory || "Logistics Service"
                  ).replace(/_/g, " ")}
                </p>
                <div className="flex items-center space-x-2 mb-2">
                  <VerificationBadge
                    verified={true}
                    level="STANDARD"
                    rating={listing.rating}
                  />
                </div>
                <RealTimeIndicator
                  listingId={listing.id}
                  showViewerCount={true}
                />
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

            {/* Rating */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="ml-2 text-xl font-bold text-slate-800">
                  {listing.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-slate-500">
                ({listing.totalBookings} bookings)
              </span>
            </div>

            {/* Location */}
            {location.city && (
              <div className="flex items-center space-x-2 mb-4 text-slate-600">
                <MapPin className="w-5 h-5" />
                <span>
                  {location.city}, {location.country}
                </span>
              </div>
            )}

            {/* Service Details */}
            {"serviceType" in listing && (
              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-1">Service Type</p>
                <p className="font-semibold text-slate-800">
                  {(listing as any).serviceType?.replace(/_/g, " ") ||
                    "Standard"}
                </p>
              </div>
            )}

            {/* Features */}
            {"features" in listing && (listing as any).features && (
              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-2">Features</p>
                <div className="flex flex-wrap gap-2">
                  {(listing as any).features.map(
                    (feature: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                      >
                        {feature}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Capabilities */}
            {"capabilities" in listing && (
              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-2">Capabilities</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries((listing as any).capabilities || {}).map(
                    ([key, value]) =>
                      value && (
                        <div key={key} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-slate-700">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </div>
                      ),
                  )}
                </div>
              </div>
            )}

            {/* Certifications */}
            {"certifications" in listing &&
              (listing as any).certifications &&
              (listing as any).certifications.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {(listing as any).certifications.map(
                      (cert: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full"
                        >
                          {cert}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Reviews ({reviews.length})
            </h3>
            {reviews.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-slate-200 pb-4 last:border-0"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {review.customerName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="ml-1 font-semibold">
                          {review.rating}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-700">{review.review}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Pricing
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Base Price</p>
                <p className="text-2xl font-bold text-slate-800">
                  {price.amount.toLocaleString()} {price.currency}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {price.model?.replace(/_/g, " ") || "FIXED"}
                </p>
              </div>
            </div>

            <button
              onClick={handleBook}
              disabled={listing.availability === "FULL"}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {listing.availability === "FULL" ? "Not Available" : "Book Now"}
            </button>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3">
                Provider Contact
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Building2 className="w-4 h-4" />
                  <span>{listing.providerName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
