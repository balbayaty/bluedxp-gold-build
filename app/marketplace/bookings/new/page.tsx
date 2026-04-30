"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { Calendar, DollarSign, MapPin, FileText } from "lucide-react";
import { marketplaceService } from "@/lib/services/marketplace";
import type { MarketplaceServiceListing } from "@/types/marketplace";

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [listing, setListing] = useState<MarketplaceServiceListing | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    requirements: "",
    notes: "",
  });

  useEffect(() => {
    if (serviceId) {
      loadListing();
    }
  }, [serviceId]);

  const loadListing = async () => {
    if (!serviceId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/marketplace/listings/${serviceId}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing || !serviceId) return;

    try {
      // In a real app, get customer ID from auth context
      const customerId = "customer-1";
      const customerName = "Customer Name"; // Mock

      const response = await fetch("/api/marketplace/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          customerName,
          serviceId,
          bookingDetails: {
            schedule: {
              startDate: formData.startDate,
              endDate: formData.endDate || undefined,
            },
            requirements: formData.requirements
              ? [formData.requirements]
              : undefined,
            notes: formData.notes,
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        router.push(`/marketplace/bookings/${result.data.id}`);
      } else {
        alert(result.error || "Failed to create booking. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create booking:", error);
      alert("Failed to create booking. Please try again.");
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="New Booking"
        description="Create a new service booking"
        icon="ri-add-circle-line"
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
        title="New Booking"
        description="Create a new service booking"
        icon="ri-add-circle-line"
      >
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Service not found
          </h3>
          <p className="text-slate-500 mb-6">
            The service you're looking for doesn't exist
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
      };
    }
    return { amount: 0, currency: "SAR" };
  };

  const price = getPrice();

  return (
    <PageTemplate
      title="New Booking"
      description="Book a service"
      icon="ri-add-circle-line"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-lg p-6 space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Booking Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    min={formData.startDate}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Special Requirements
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) =>
                      setFormData({ ...formData, requirements: e.target.value })
                    }
                    rows={4}
                    placeholder="Any special requirements or instructions..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Additional notes..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Confirm Booking
              </button>
            </div>
          </form>
        </div>

        {/* Service Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Service Summary
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Provider</p>
                <p className="font-semibold text-slate-800">
                  {listing.providerName}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Service Category</p>
                <p className="font-semibold text-slate-800">
                  {(listing as any).serviceCategory?.replace(/_/g, " ") ||
                    "Logistics Service"}
                </p>
              </div>

              {"location" in listing && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Location</p>
                  <p className="font-semibold text-slate-800 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {(listing as any).location.city},{" "}
                    {(listing as any).location.country}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500">Base Price</p>
                  <p className="font-semibold text-slate-800">
                    {price.amount.toLocaleString()} {price.currency}
                  </p>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500">Fees</p>
                  <p className="font-semibold text-slate-800">
                    0 {price.currency}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <p className="font-semibold text-slate-800">Total</p>
                  <p className="text-xl font-bold text-blue-600">
                    {price.amount.toLocaleString()} {price.currency}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
