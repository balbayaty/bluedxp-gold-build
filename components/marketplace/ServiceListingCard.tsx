"use client";

import { motion } from "framer-motion";
import {
  Star,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import RealTimeIndicator from "./RealTimeIndicator";
import VerificationBadge from "./VerificationBadge";
import SustainabilityBadge from "./SustainabilityBadge";
import type { MarketplaceServiceListing } from "@/types/marketplace";

interface ServiceListingCardProps {
  listing: MarketplaceServiceListing;
  onBook?: (listingId: string) => void;
  onView?: (listingId: string) => void;
}

export default function ServiceListingCard({
  listing,
  onBook,
  onView,
}: ServiceListingCardProps) {
  const getAvailabilityColor = () => {
    switch (listing.availability) {
      case "AVAILABLE":
        return "bg-green-100 text-green-700";
      case "LIMITED":
        return "bg-yellow-100 text-yellow-700";
      case "FULL":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getAvailabilityIcon = () => {
    switch (listing.availability) {
      case "AVAILABLE":
        return <CheckCircle className="w-4 h-4" />;
      case "LIMITED":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

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
      return `${location.city || ""}, ${location.country || ""}`;
    }
    return "Location not specified";
  };

  const price = getPrice();
  const location = getLocation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, shadow: "lg" }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
      onClick={() => onView?.(listing.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-slate-800 text-lg mb-1">
              {listing.title || listing.providerName}
            </h3>
            <FavoriteButton
              userId="default-user"
              listingId={listing.id}
              size="sm"
              className="ml-2"
            />
          </div>
          {"serviceType" in listing && (
            <p className="text-sm text-slate-500">
              {(listing as any).serviceType?.replace(/_/g, " ")}
            </p>
          )}
          <div className="flex items-center space-x-2 mt-2">
            <VerificationBadge
              verified={true}
              level="STANDARD"
              rating={listing.rating}
            />
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${getAvailabilityColor()}`}
        >
          {getAvailabilityIcon()}
          <span>{listing.availability}</span>
        </span>
      </div>

      {/* Real-time indicator */}
      <div className="mb-3">
        <RealTimeIndicator listingId={listing.id} showViewerCount={true} />
      </div>

      {/* Rating */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="flex items-center">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="ml-1 font-semibold text-slate-800">
            {listing.rating.toFixed(1)}
          </span>
        </div>
        <span className="text-sm text-slate-500">
          ({listing.totalBookings} bookings)
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center space-x-2 mb-4 text-slate-600">
        <MapPin className="w-4 h-4" />
        <span className="text-sm">{location}</span>
      </div>

      {/* Features */}
      {"features" in listing && (listing as any).features && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {(listing as any).features
              .slice(0, 3)
              .map((feature: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                >
                  {feature}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-slate-800">
              {price.amount.toLocaleString()}
            </span>
            <span className="text-sm text-slate-500">{price.currency}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {price.model.replace(/_/g, " ")}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.(listing.id);
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition text-sm font-semibold"
          >
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBook?.(listing.id);
            }}
            disabled={listing.availability === "FULL"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Book Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
