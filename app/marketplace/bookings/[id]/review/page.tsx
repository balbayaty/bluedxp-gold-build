"use client";

import { useParams, useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import ReviewForm from "@/components/marketplace/ReviewForm";
import { marketplaceService } from "@/lib/services/marketplace";
import { useState, useEffect } from "react";
import type { MarketplaceBooking } from "@/types/marketplace";

export default function BookingReviewPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<MarketplaceBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const bookingData = await marketplaceService.getBooking(bookingId);
      setBooking(bookingData);
    } catch (error) {
      console.error("Failed to load booking:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push(`/marketplace/bookings/${bookingId}`);
  };

  const handleCancel = () => {
    router.push(`/marketplace/bookings/${bookingId}`);
  };

  if (loading || !booking) {
    return (
      <PageTemplate
        title="Write Review"
        description="Share your experience"
        icon="ri-star-line"
      >
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-slate-500">Loading...</p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Write Review"
      description={`Review your booking: ${booking.bookingNumber}`}
      icon="ri-star-line"
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {booking.providerName}
            </h3>
            <p className="text-slate-500">
              {(booking.serviceCategory || "Service").replace(/_/g, " ")} •{" "}
              {booking.bookingNumber}
            </p>
          </div>

          <ReviewForm
            bookingId={booking.id}
            serviceId={booking.serviceId}
            providerId={booking.providerId}
            customerId={booking.customerId}
            customerName={booking.customerName}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </PageTemplate>
  );
}
