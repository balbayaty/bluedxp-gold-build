"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Check,
  X,
} from "lucide-react";
import { marketplaceService } from "@/lib/services/marketplace";
import type { MarketplaceBooking, BookingStatus } from "@/types/marketplace";

export default function ProviderBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<MarketplaceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingStatus | "ALL">("ALL");

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      // In a real app, get provider ID from auth context
      const providerId = "provider-1"; // Mock
      const providerBookings =
        await marketplaceService.getProviderBookings(providerId);
      setBookings(providerBookings);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    bookingId: string,
    newStatus: BookingStatus,
  ) => {
    try {
      const response = await fetch(`/api/marketplace/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      if (result.success) {
        loadBookings(); // Reload to show updated status
      } else {
        alert(
          result.error || "Failed to update booking status. Please try again.",
        );
      }
    } catch (error) {
      console.error("Failed to update booking status:", error);
      alert("Failed to update booking status. Please try again.");
    }
  };

  const getStatusColor = (status: BookingStatus) => {
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

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "CONFIRMED":
        return <CheckCircle className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <AlertCircle className="w-4 h-4" />;
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredBookings =
    filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <PageTemplate
      title="Manage Bookings"
      description="View and manage booking requests"
      icon="ri-calendar-check-line"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("PENDING")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "PENDING"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Pending ({bookings.filter((b) => b.status === "PENDING").length})
            </button>
            <button
              onClick={() => setFilter("CONFIRMED")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "CONFIRMED"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setFilter("IN_PROGRESS")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "IN_PROGRESS"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter("COMPLETED")}
              className={`px-4 py-2 rounded-lg transition ${
                filter === "COMPLETED"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Bookings List */}
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
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No bookings found
            </h3>
            <p className="text-slate-500">
              You don't have any bookings in this status
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">
                      {booking.bookingNumber}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {booking.customerName} •{" "}
                      {(booking.serviceCategory || "Service").replace(
                        /_/g,
                        " ",
                      )}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${getStatusColor(booking.status)}`}
                  >
                    {getStatusIcon(booking.status)}
                    <span>
                      {(booking.status || "PENDING").replace(/_/g, " ")}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Schedule</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {new Date(
                        booking.schedule.startDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Total Price</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {booking.pricing.total.toLocaleString()}{" "}
                      {booking.pricing.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Created</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() =>
                      router.push(`/marketplace/bookings/${booking.id}`)
                    }
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>

                  {booking.status === "PENDING" && (
                    <>
                      <button
                        onClick={() =>
                          handleStatusUpdate(booking.id, "CONFIRMED")
                        }
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm</span>
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to reject this booking?",
                            )
                          ) {
                            handleStatusUpdate(booking.id, "CANCELLED");
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {booking.status === "CONFIRMED" && (
                    <button
                      onClick={() =>
                        handleStatusUpdate(booking.id, "IN_PROGRESS")
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Start Service
                    </button>
                  )}

                  {booking.status === "IN_PROGRESS" && (
                    <button
                      onClick={() =>
                        handleStatusUpdate(booking.id, "COMPLETED")
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
