/**
 * BIM Marketplace Tab Component
 *
 * Full marketplace UI with listings, search, filters, and booking
 * Integrated with payment service and real-time updates
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import type {
  BIMMarketplaceListing,
  BIMMarketplaceSearchFilters,
} from "@/types/bim-marketplace";
import { useNotifications } from "@/lib/utils/notifications";
import Modal from "@/components/Modal";

interface MarketplaceTabProps {
  onListingSelect?: (listing: BIMMarketplaceListing) => void;
  onBookListing?: (listingId: string) => void;
}

export default function MarketplaceTab({
  onListingSelect,
  onBookListing,
}: MarketplaceTabProps) {
  const [listings, setListings] = useState<BIMMarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "relevance" | "price" | "rating" | "newest"
  >("relevance");
  const [selectedListing, setSelectedListing] =
    useState<BIMMarketplaceListing | null>(null);
  const [showListingModal, setShowListingModal] = useState(false);
  const notifications = useNotifications();

  useEffect(() => {
    loadListings();
  }, [selectedCategory, selectedType, sortBy, searchQuery]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("query", searchQuery);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedType !== "all") params.set("type", selectedType);
      params.set("sortBy", sortBy);

      const response = await fetch(
        `/api/bim/marketplace/listings?${params.toString()}`,
      );
      const result = await response.json();

      if (result.success) {
        setListings(result.data || []);
      } else {
        notifications.error(
          "Failed to load listings",
          result.error || "Unknown error",
        );
      }
    } catch (error) {
      console.error("Error loading listings:", error);
      notifications.error("Error", "Failed to load marketplace listings");
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          listing.title.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query) ||
          listing.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [listings, searchQuery]);

  const categories = [
    { id: "all", label: "All Categories", icon: "ri-apps-line" },
    { id: "architectural", label: "Architectural", icon: "ri-building-line" },
    { id: "structural", label: "Structural", icon: "ri-stack-line" },
    { id: "mep", label: "MEP", icon: "ri-tools-line" },
    { id: "sustainability", label: "Sustainability", icon: "ri-leaf-line" },
    { id: "digital-twin", label: "Digital Twin", icon: "ri-cpu-line" },
  ];

  const types = [
    { id: "all", label: "All Types", icon: "ri-apps-2-line" },
    { id: "model", label: "Models", icon: "ri-cube-3d-line" },
    { id: "service", label: "Services", icon: "ri-service-line" },
    { id: "professional", label: "Professionals", icon: "ri-user-star-line" },
    { id: "tool", label: "Tools", icon: "ri-tools-fill" },
    { id: "template", label: "Templates", icon: "ri-file-copy-line" },
  ];

  const formatPrice = (pricing: BIMMarketplaceListing["pricing"]) => {
    if (pricing.model === "free") return "Free";
    if (pricing.model === "one-time" && pricing.amount) {
      return `${pricing.currency || "USD"} ${pricing.amount.toFixed(2)}`;
    }
    if (pricing.model === "subscription" && pricing.amount) {
      return `${pricing.currency || "USD"} ${pricing.amount.toFixed(2)}/${pricing.subscriptionPeriod || "month"}`;
    }
    if (pricing.model === "usage-based" && pricing.usagePrice) {
      return `${pricing.currency || "USD"} ${pricing.usagePrice.toFixed(2)}/${pricing.usageUnit || "unit"}`;
    }
    if (pricing.customQuote) return "Custom Quote";
    return "Price on request";
  };

  const handleListingClick = (listing: BIMMarketplaceListing) => {
    setSelectedListing(listing);
    setShowListingModal(true);
    onListingSelect?.(listing);
  };

  const handleBookListing = async (listing: BIMMarketplaceListing) => {
    try {
      const response = await fetch("/api/bim/marketplace/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          userId: "user-1", // In real app, get from auth
          userName: "Current User",
          booking: {
            status: "pending",
            startDate: new Date(),
            metadata: {},
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        notifications.success(
          "Booking Created",
          "Your booking request has been submitted",
        );
        onBookListing?.(listing.id);
        if (result.paymentIntent) {
          // Redirect to payment if required
          notifications.info(
            "Payment Required",
            "Please complete payment to confirm booking",
          );
        }
      } else {
        notifications.error(
          "Booking Failed",
          result.error || "Could not create booking",
        );
      }
    } catch (error) {
      notifications.error("Error", "Failed to create booking");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        <p className="text-gray-400 text-sm">Loading marketplace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models, services, professionals..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-cyan-500 text-white"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                <i className={`${cat.icon} mr-2`}></i>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
          >
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
          >
            <option value="relevance">Relevance</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <i className="ri-inbox-line text-4xl text-gray-500 mb-4"></i>
          <p className="text-gray-400">No listings found</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all cursor-pointer group"
              onClick={() => handleListingClick(listing)}
            >
              {/* Image/Preview */}
              <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900">
                {listing.images && listing.images.length > 0 ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="ri-cube-3d-line text-6xl text-gray-600"></i>
                  </div>
                )}
                {listing.featured && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500/90 text-yellow-900 rounded text-xs font-bold">
                    <i className="ri-star-fill mr-1"></i>
                    Featured
                  </div>
                )}
                {listing.verified && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-green-500/90 text-white rounded text-xs font-medium">
                    <i className="ri-verified-badge-fill mr-1"></i>
                    Verified
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-semibold text-lg group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {listing.title}
                  </h3>
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-medium capitalize">
                    {listing.type}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {listing.description}
                </p>

                <div className="flex items-center gap-4 mb-3 text-sm">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <i className="ri-star-fill"></i>
                    <span className="text-white">
                      {listing.averageRating.toFixed(1)}
                    </span>
                    <span className="text-gray-500">
                      ({listing.reviewCount})
                    </span>
                  </div>
                  {listing.providerVerified && (
                    <div className="flex items-center gap-1 text-green-400">
                      <i className="ri-verified-badge-fill"></i>
                      <span className="text-gray-300">
                        {listing.providerName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="text-lg font-bold text-cyan-400">
                    {formatPrice(listing.pricing)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookListing(listing);
                    }}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    <i className="ri-shopping-cart-line mr-2"></i>
                    Book
                  </button>
                </div>

                {/* Tags */}
                {listing.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {listing.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-white/5 text-gray-400 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Listing Detail Modal */}
      {showListingModal && selectedListing && (
        <Modal
          isOpen={showListingModal}
          onClose={() => setShowListingModal(false)}
          title={selectedListing.title}
          size="xl"
        >
          <div className="space-y-6">
            {/* Images */}
            {selectedListing.images && selectedListing.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {selectedListing.images.slice(0, 4).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${selectedListing.title} - ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-white font-medium mb-2">Description</h4>
              <p className="text-gray-300 text-sm">
                {selectedListing.description}
              </p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Category</label>
                <p className="text-white capitalize">
                  {selectedListing.category}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Provider</label>
                <p className="text-white">{selectedListing.providerName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Rating</label>
                <p className="text-white">
                  {selectedListing.averageRating.toFixed(1)} (
                  {selectedListing.reviewCount} reviews)
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Price</label>
                <p className="text-white font-semibold">
                  {formatPrice(selectedListing.pricing)}
                </p>
              </div>
            </div>

            {/* Model-specific data */}
            {selectedListing.type === "model" && selectedListing.modelData && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Model Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-400">Format</label>
                    <p className="text-white uppercase">
                      {selectedListing.modelData.fileFormat}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400">LOD</label>
                    <p className="text-white">
                      {selectedListing.modelData.lod}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400">Elements</label>
                    <p className="text-white">
                      {selectedListing.modelData.elements.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400">License</label>
                    <p className="text-white capitalize">
                      {selectedListing.modelData.license}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => handleBookListing(selectedListing)}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors"
              >
                <i className="ri-shopping-cart-line mr-2"></i>
                Book Now
              </button>
              <button className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors">
                <i className="ri-heart-line mr-2"></i>
                Favorite
              </button>
              <button className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors">
                <i className="ri-share-line mr-2"></i>
                Share
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
