"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { marketplaceService } from "@/lib/services/marketplace";

interface ReviewFormProps {
  bookingId: string;
  serviceId: string;
  providerId: string;
  customerId: string;
  customerName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  bookingId,
  serviceId,
  providerId,
  customerId,
  customerName,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [categories, setCategories] = useState({
    quality: 0,
    timeliness: 0,
    communication: 0,
    value: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/marketplace/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          serviceId,
          providerId,
          customerId,
          customerName,
          rating,
          review,
          categories: {
            quality: categories.quality || rating,
            timeliness: categories.timeliness || rating,
            communication: categories.communication || rating,
            value: categories.value || rating,
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        onSuccess?.();
      } else {
        alert(result.error || "Failed to submit review. Please try again.");
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Overall Rating *
        </label>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`w-8 h-8 transition ${
                  star <= (hoveredRating || rating)
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-slate-300"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-slate-500">
              {rating} {rating === 1 ? "star" : "stars"}
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Category Ratings
        </label>
        <div className="space-y-3">
          {Object.entries(categories).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-700 capitalize">{key}</span>
                <span className="text-sm text-slate-500">
                  {value || rating || 0} / 5
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setCategories({ ...categories, [key]: star })
                    }
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-5 h-5 transition ${
                        star <= (value || rating || 0)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Review *
        </label>
        <textarea
          required
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={6}
          placeholder="Share your experience with this service..."
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center justify-end space-x-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </form>
  );
}
