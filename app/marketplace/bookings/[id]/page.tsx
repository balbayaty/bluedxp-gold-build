"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  Star,
} from "lucide-react";
import ChatWindow from "@/components/marketplace/messaging/ChatWindow";
import { marketplaceService } from "@/lib/services/marketplace";
import type { MarketplaceBooking } from "@/types/marketplace";

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<MarketplaceBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentUserId] = useState("user-1"); // TODO: Get from auth context

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const response = await fetch(`/api/marketplace/bookings/${bookingId}`);
      const result = await response.json();
      if (result.success) {
        setBooking(result.data);
      }
    } catch (error) {
      console.error("Failed to load booking:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: MarketplaceBooking["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-700";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-700";
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      case "DISPUTED":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: MarketplaceBooking["status"]) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-5 h-5" />;
      case "CONFIRMED":
        return <CheckCircle className="w-5 h-5" />;
      case "IN_PROGRESS":
        return <AlertCircle className="w-5 h-5" />;
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5" />;
      case "CANCELLED":
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Booking Details"
        description="View booking information"
        icon="ri-file-list-line"
      >
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-slate-500">Loading booking details...</p>
        </div>
      </PageTemplate>
    );
  }

  if (!booking) {
    return (
      <PageTemplate
        title="Booking Not Found"
        description="The booking you're looking for doesn't exist"
        icon="ri-error-warning-line"
      >
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Booking not found
          </h3>
          <p className="text-slate-500 mb-6">
            The booking you're looking for doesn't exist
          </p>
          <button
            onClick={() => router.push("/marketplace/bookings")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View All Bookings
          </button>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Booking Details"
      description={booking.bookingNumber}
      icon="ri-file-list-line"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Overview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  {booking.bookingNumber}
                </h2>
                <p className="text-slate-500">
                  {booking.providerName} •{" "}
                  {(booking.serviceCategory || "Service").replace(/_/g, " ")}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 ${getStatusColor(booking.status)}`}
              >
                {getStatusIcon(booking.status)}
                <span>{(booking.status || "PENDING").replace(/_/g, " ")}</span>
              </span>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-500">Start Date</p>
                  <p className="font-semibold text-slate-800">
                    {new Date(booking.schedule.startDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {booking.schedule.endDate && (
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-500">End Date</p>
                    <p className="font-semibold text-slate-800">
                      {new Date(booking.schedule.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Location */}
            {booking.location && (
              <div className="flex items-center space-x-3 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-500">Location</p>
                  <p className="font-semibold text-slate-800">
                    {booking.location.address}
                  </p>
                </div>
              </div>
            )}

            {/* Requirements */}
            {booking.requirements && booking.requirements.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Special Requirements
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {booking.requirements.map((req, idx) => (
                    <li key={idx} className="text-slate-700">
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes */}
            {booking.notes && (
              <div>
                <p className="text-sm text-slate-500 mb-2">Notes</p>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">
                  {booking.notes}
                </p>
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Service Details
            </h3>
            <div className="space-y-3">
              {Object.entries(booking.serviceDetails).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-slate-500">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Review Section */}
          {booking.status === "COMPLETED" && !booking.rating && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Rate Your Experience
              </h3>
              <p className="text-slate-500 mb-4">
                Share your experience with this service
              </p>
              <button
                onClick={() =>
                  router.push(`/marketplace/bookings/${bookingId}/review`)
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Write Review
              </button>
            </div>
          )}

          {booking.rating && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Your Review
              </h3>
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-xl font-bold">{booking.rating}</span>
              </div>
              {booking.review && (
                <p className="text-slate-700">{booking.review}</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Pricing
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Base Price</span>
                <span className="font-semibold text-slate-800">
                  {booking.pricing.basePrice.toLocaleString()}{" "}
                  {booking.pricing.currency}
                </span>
              </div>
              {booking.pricing.fees && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Fees</span>
                  <span className="font-semibold text-slate-800">
                    {booking.pricing.fees.toLocaleString()}{" "}
                    {booking.pricing.currency}
                  </span>
                </div>
              )}
              {booking.pricing.taxes && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Taxes</span>
                  <span className="font-semibold text-slate-800">
                    {booking.pricing.taxes.toLocaleString()}{" "}
                    {booking.pricing.currency}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-200 flex justify-between">
                <span className="font-semibold text-slate-800">Total</span>
                <span className="text-xl font-bold text-blue-600">
                  {booking.pricing.total.toLocaleString()}{" "}
                  {booking.pricing.currency}
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Booking Created</p>
              <p className="text-sm font-semibold text-slate-800">
                {new Date(booking.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && conversationId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh]">
            <ChatWindow
              conversationId={conversationId}
              currentUserId={currentUserId}
              onClose={() => {
                setShowChat(false);
                setConversationId(null);
              }}
            />
          </div>
        </div>
      )}
    </PageTemplate>
  );
}
