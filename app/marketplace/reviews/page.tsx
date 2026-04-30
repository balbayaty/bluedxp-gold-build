"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import { Star, User, Calendar, ThumbsUp } from "lucide-react";
import { marketplaceService } from "@/lib/services/marketplace";
import type { MarketplaceReview } from "@/types/marketplace";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | number>("ALL");

  useEffect(() => {
    // In a real app, load all reviews or filter by service
    setLoading(false);
  }, []);

  const filteredReviews =
    filter === "ALL" ? reviews : reviews.filter((r) => r.rating === filter);

  return (
    <PageTemplate
      title="Reviews"
      description="Browse service reviews and ratings"
      icon="ri-star-line"
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
              All Reviews
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setFilter(rating)}
                className={`px-4 py-2 rounded-lg transition flex items-center space-x-1 ${
                  filter === rating
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Star className="w-4 h-4 fill-current" />
                <span>{rating}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
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
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No reviews found
            </h3>
            <p className="text-slate-500">
              Reviews will appear here once customers start rating services
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {review.customerName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-bold text-slate-800">
                      {review.rating}
                    </span>
                  </div>
                </div>

                <p className="text-slate-700 mb-4">{review.review}</p>

                {/* Category Ratings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Quality</p>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= review.categories.quality
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Timeliness</p>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= review.categories.timeliness
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Communication</p>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= review.categories.communication
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Value</p>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= review.categories.value
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {review.verified && (
                  <div className="mt-4 flex items-center space-x-2 text-xs text-green-600">
                    <span className="px-2 py-1 bg-green-50 rounded-full">
                      ✓ Verified Booking
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
