/**
 * Marketplace Export Service
 * Export marketplace data to various formats
 */

import { exportService } from "@/lib/services/export/exportService";
import type {
  ExportConfig,
  ExportResult,
  ExportFormat,
} from "@/lib/services/export/exportService";
import { marketplaceService } from "./marketplaceService";
import type {
  MarketplaceServiceListing,
  MarketplaceBooking,
  MarketplaceReview,
} from "@/types/marketplace";

/**
 * Export listings
 */
export async function exportListings(
  listings: MarketplaceServiceListing[],
  format: ExportFormat = "xlsx",
  options?: {
    includeReviews?: boolean;
    includeProviderInfo?: boolean;
  },
): Promise<ExportResult> {
  const data = listings.map((listing) => ({
    "Listing ID": listing.id,
    Title: listing.title,
    Category: listing.category,
    Provider: listing.providerName,
    Location: `${listing.location?.city || ""}, ${listing.location?.country || ""}`,
    Price: listing.pricing?.basePrice || 0,
    Currency: listing.pricing?.currency || "SAR",
    Rating: listing.rating,
    "Total Reviews": listing.totalReviews || 0,
    Status: listing.status,
    Availability: listing.availability,
    "Created At": listing.createdAt,
    ...(options?.includeProviderInfo && {
      "Provider Email": listing.providerEmail,
      "Provider Phone": listing.providerPhone,
    }),
  }));

  return exportService.export({
    format,
    filename: `marketplace-listings-${new Date().toISOString().split("T")[0]}`,
    title: "Marketplace Listings",
    description: `Exported ${listings.length} marketplace listings`,
    data,
    includeHeaders: true,
    includeTimestamp: true,
  });
}

/**
 * Export bookings
 */
export async function exportBookings(
  bookings: MarketplaceBooking[],
  format: ExportFormat = "xlsx",
): Promise<ExportResult> {
  const data = bookings.map((booking) => ({
    "Booking ID": booking.id,
    "Listing Title": booking.listingTitle,
    Customer: booking.customerName,
    "Customer Email": booking.customerEmail,
    Status: booking.status,
    "Start Date": booking.startDate,
    "End Date": booking.endDate,
    Quantity: booking.quantity || 1,
    "Total Price": booking.totalPrice || 0,
    Currency: booking.currency || "SAR",
    "Created At": booking.createdAt,
    "Updated At": booking.updatedAt,
  }));

  return exportService.export({
    format,
    filename: `marketplace-bookings-${new Date().toISOString().split("T")[0]}`,
    title: "Marketplace Bookings",
    description: `Exported ${bookings.length} marketplace bookings`,
    data,
    includeHeaders: true,
    includeTimestamp: true,
  });
}

/**
 * Export reviews
 */
export async function exportReviews(
  reviews: MarketplaceReview[],
  format: ExportFormat = "csv",
): Promise<ExportResult> {
  const data = reviews.map((review) => ({
    "Review ID": review.id,
    "Listing ID": review.listingId,
    "Listing Title": review.listingTitle,
    Provider: review.providerName,
    Customer: review.customerName,
    Rating: review.rating,
    "Review Text": review.reviewText,
    "Created At": review.createdAt,
    "Helpful Count": review.helpfulCount || 0,
  }));

  return exportService.export({
    format,
    filename: `marketplace-reviews-${new Date().toISOString().split("T")[0]}`,
    title: "Marketplace Reviews",
    description: `Exported ${reviews.length} marketplace reviews`,
    data,
    includeHeaders: true,
    includeTimestamp: true,
  });
}

/**
 * Export marketplace statistics report (PDF)
 */
export async function exportMarketplaceStats(
  period: { start: string; end: string },
  format: ExportFormat = "pdf",
): Promise<ExportResult> {
  const stats = await marketplaceService.getMarketplaceStats();

  const data = {
    Period: `${period.start} to ${period.end}`,
    "Total Listings": stats.totalListings,
    "Total Providers": stats.totalProviders,
    "Total Bookings": stats.totalBookings,
    "Average Rating": stats.averageRating,
    Categories: Object.entries(stats.categories).map(([cat, count]) => ({
      Category: cat,
      Count: count,
    })),
  };

  return exportService.export({
    format,
    filename: `marketplace-stats-${new Date().toISOString().split("T")[0]}`,
    title: "Marketplace Statistics Report",
    description: `Marketplace statistics for period ${period.start} to ${period.end}`,
    data,
    includeHeaders: true,
    includeTimestamp: true,
  });
}

/**
 * Export provider performance report
 */
export async function exportProviderPerformance(
  providerId: string,
  format: ExportFormat = "pdf",
): Promise<ExportResult> {
  const provider = await marketplaceService.getProvider(providerId);
  if (!provider) {
    throw new Error("Provider not found");
  }

  const listings = await marketplaceService.searchListings({ providerId });
  const bookings = await marketplaceService.searchBookings({ providerId });

  const data = {
    Provider: provider.name,
    Email: provider.email,
    "Total Listings": listings.length,
    "Total Bookings": bookings.length,
    "Average Rating": provider.rating || 0,
    "Total Reviews": provider.totalReviews || 0,
    Listings: listings.map((l) => ({
      Title: l.title,
      Category: l.category,
      Price: l.pricing?.basePrice || 0,
      Rating: l.rating,
      Bookings: bookings.filter((b) => b.listingId === l.id).length,
    })),
  };

  return exportService.export({
    format,
    filename: `provider-performance-${providerId}-${new Date().toISOString().split("T")[0]}`,
    title: `Provider Performance Report - ${provider.name}`,
    description: `Performance report for ${provider.name}`,
    data,
    includeHeaders: true,
    includeTimestamp: true,
  });
}

/**
 * Marketplace Export Service Export
 */
export const marketplaceExportService = {
  exportListings,
  exportBookings,
  exportReviews,
  exportMarketplaceStats,
  exportProviderPerformance,
};
