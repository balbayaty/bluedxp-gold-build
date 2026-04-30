/**
 * BIM Marketplace Listing Detail Modal
 *
 * Comprehensive listing detail view with all information, reviews, and booking
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import type { BIMMarketplaceListing } from "@/types/bim-marketplace";
import { useNotifications } from "@/lib/utils/notifications";
import Modal from "@/components/Modal";

interface MarketplaceListingModalProps {
  listing: BIMMarketplaceListing;
  isOpen: boolean;
  onClose: () => void;
  onBook?: (listingId: string) => void;
  onFavorite?: (listingId: string) => void;
}

export default function MarketplaceListingModal({
  listing,
  isOpen,
  onClose,
  onBook,
  onFavorite,
}: MarketplaceListingModalProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "details" | "reviews" | "provider"
  >("overview");
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "mada" | "visa" | "mastercard" | "apple_pay" | "google_pay"
  >("mada");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const notifications = useNotifications();

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

  const handleBook = async () => {
    try {
      const response = await fetch("/api/bim/marketplace/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          userId: "user-1",
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
        onBook?.(listing.id);
        if (result.paymentIntent) {
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

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    onFavorite?.(listing.id);
    notifications.success(
      isFavorite ? "Removed from Favorites" : "Added to Favorites",
      "",
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={listing.title} size="xl">
      <div className="space-y-6">
        {/* Images Gallery */}
        {listing.images && listing.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {listing.images.slice(0, 4).map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${listing.title} - ${idx + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          {[
            { id: "overview", label: "Overview", icon: "ri-information-line" },
            { id: "details", label: "Details", icon: "ri-file-list-line" },
            { id: "reviews", label: "Reviews", icon: "ri-star-line" },
            { id: "provider", label: "Provider", icon: "ri-user-line" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <i className={`${tab.icon} mr-2`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-medium mb-2">Description</h4>
              <p className="text-gray-300 text-sm">{listing.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Category</label>
                <p className="text-white capitalize">{listing.category}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Type</label>
                <p className="text-white capitalize">{listing.type}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Rating</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <i className="ri-star-fill"></i>
                    <span className="text-white">
                      {listing.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-gray-500 text-sm">
                    ({listing.reviewCount} reviews)
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Price</label>
                <p className="text-white font-semibold text-lg">
                  {formatPrice(listing.pricing)}
                </p>
              </div>
            </div>

            {/* Tags */}
            {listing.tags.length > 0 && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-white/5 text-gray-300 rounded-lg text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "details" && (
          <div className="space-y-4">
            {/* Model-specific details */}
            {listing.type === "model" && listing.modelData && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-medium mb-4">Model Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-400">Format</label>
                    <p className="text-white uppercase">
                      {listing.modelData.fileFormat}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400">LOD</label>
                    <p className="text-white">{listing.modelData.lod}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">Elements</label>
                    <p className="text-white">
                      {listing.modelData.elements.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400">License</label>
                    <p className="text-white capitalize">
                      {listing.modelData.license}
                    </p>
                  </div>
                  {listing.modelData.area && (
                    <div>
                      <label className="text-gray-400">Area</label>
                      <p className="text-white">
                        {listing.modelData.area.toLocaleString()} m²
                      </p>
                    </div>
                  )}
                  {listing.modelData.floors && (
                    <div>
                      <label className="text-gray-400">Floors</label>
                      <p className="text-white">{listing.modelData.floors}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Service-specific details */}
            {listing.type === "service" && listing.serviceData && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-medium mb-4">Service Details</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-gray-400">Service Type</label>
                    <p className="text-white capitalize">
                      {listing.serviceData.serviceType}
                    </p>
                  </div>
                  {listing.serviceData.deliverables &&
                    listing.serviceData.deliverables.length > 0 && (
                      <div>
                        <label className="text-gray-400 mb-2 block">
                          Deliverables
                        </label>
                        <ul className="list-disc list-inside text-white space-y-1">
                          {listing.serviceData.deliverables.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  {listing.serviceData.duration && (
                    <div>
                      <label className="text-gray-400">Duration</label>
                      <p className="text-white">
                        {listing.serviceData.duration}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Compatible Software */}
            {listing.compatibleSoftware.length > 0 && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Compatible Software
                </label>
                <div className="flex flex-wrap gap-2">
                  {listing.compatibleSoftware.map((software) => (
                    <span
                      key={software}
                      className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm"
                    >
                      {software}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-4">
            {listing.reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <i className="ri-star-line text-4xl mb-2"></i>
                <p>No reviews yet</p>
              </div>
            ) : (
              listing.reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {review.userAvatar ? (
                        <img
                          src={review.userAvatar}
                          alt={review.userName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                          <i className="ri-user-line text-cyan-400"></i>
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">
                          {review.userName}
                        </p>
                        {review.verified && (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <i className="ri-verified-badge-fill"></i>
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`ri-star-${i < review.rating ? "fill" : "line"} text-yellow-400`}
                        ></i>
                      ))}
                    </div>
                  </div>
                  {review.title && (
                    <h5 className="text-white font-medium mb-1">
                      {review.title}
                    </h5>
                  )}
                  <p className="text-gray-300 text-sm mb-2">{review.comment}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      {format(new Date(review.createdAt), "MMM dd, yyyy")}
                    </span>
                    {review.helpful > 0 && (
                      <span className="flex items-center gap-1">
                        <i className="ri-thumb-up-line"></i>
                        {review.helpful} helpful
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "provider" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
              {listing.providerVerified && (
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <i className="ri-verified-badge-fill text-green-400 text-2xl"></i>
                </div>
              )}
              <div className="flex-1">
                <h4 className="text-white font-semibold text-lg">
                  {listing.providerName}
                </h4>
                {listing.providerRating && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <i className="ri-star-fill"></i>
                      <span className="text-white">
                        {listing.providerRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            onClick={handleBook}
            className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors"
          >
            <i className="ri-shopping-cart-line mr-2"></i>
            Book Now
          </button>
          <button
            onClick={handleFavorite}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isFavorite
                ? "bg-red-500/20 border border-red-500/50 text-red-400"
                : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
            }`}
          >
            <i className={`ri-heart-${isFavorite ? "fill" : "line"} mr-2`}></i>
            Favorite
          </button>
          <button className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors">
            <i className="ri-share-line mr-2"></i>
            Share
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && paymentIntent && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Complete Payment"
          size="md"
        >
          <PaymentFlow
            paymentIntent={paymentIntent}
            listing={listing}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            processing={processingPayment}
            onProcessPayment={async () => {
              setProcessingPayment(true);
              try {
                // In real app, process payment via payment service
                await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate payment
                notifications.success(
                  "Payment Successful",
                  "Your booking has been confirmed",
                );
                setShowPaymentModal(false);
                onBook?.(listing.id);
              } catch (error) {
                notifications.error(
                  "Payment Failed",
                  "Could not process payment",
                );
              } finally {
                setProcessingPayment(false);
              }
            }}
            onCancel={() => setShowPaymentModal(false)}
          />
        </Modal>
      )}
    </Modal>
  );
}

// Payment Flow Component
function PaymentFlow({
  paymentIntent,
  listing,
  paymentMethod,
  onPaymentMethodChange,
  processing,
  onProcessPayment,
  onCancel,
}: any) {
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
    return "Price on request";
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h4 className="text-white font-medium mb-3">Payment Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Item</span>
            <span className="text-white">{listing.title}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Amount</span>
            <span className="text-white font-semibold text-lg">
              {formatPrice(listing.pricing)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "mada", label: "Mada", icon: "ri-bank-card-line" },
            { id: "visa", label: "Visa", icon: "ri-visa-line" },
            {
              id: "mastercard",
              label: "Mastercard",
              icon: "ri-bank-card-2-line",
            },
            { id: "apple_pay", label: "Apple Pay", icon: "ri-apple-line" },
            { id: "google_pay", label: "Google Pay", icon: "ri-google-line" },
          ].map((method) => (
            <label
              key={method.id}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                paymentMethod === method.id
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={paymentMethod === method.id}
                onChange={(e) => onPaymentMethodChange(e.target.value as any)}
                className="text-cyan-500 focus:ring-cyan-500"
              />
              <i className={method.icon}></i>
              <span className="text-sm">{method.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Payment Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          onClick={onProcessPayment}
          disabled={processing}
          className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <i className="ri-loader-4-line animate-spin"></i>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <i className="ri-check-line"></i>
              <span>Pay {formatPrice(listing.pricing)}</span>
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={processing}
          className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        <i className="ri-shield-check-line mr-1"></i>
        Your payment is secure and encrypted
      </p>
    </div>
  );
}
