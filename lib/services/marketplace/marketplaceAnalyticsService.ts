/**
 * Marketplace Advanced Analytics Service
 * Comprehensive analytics, insights, and reporting
 */

import type {
  MarketplaceServiceListing,
  MarketplaceBooking,
  MarketplaceReview,
} from "@/types/marketplace";
import { marketplaceService } from "./marketplaceService";

export interface AnalyticsPeriod {
  start: string;
  end: string;
}

export interface MarketplaceAnalytics {
  period: AnalyticsPeriod;
  overview: {
    totalListings: number;
    totalProviders: number;
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    growthRate: number; // %
  };
  bookings: {
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    trend: Array<{ date: string; count: number }>;
    conversionRate: number; // %
    averageBookingValue: number;
  };
  revenue: {
    total: number;
    byCategory: Record<string, number>;
    trend: Array<{ date: string; amount: number }>;
    averageTransactionValue: number;
    commission: number;
  };
  providers: {
    total: number;
    active: number;
    verified: number;
    topPerformers: Array<{
      providerId: string;
      providerName: string;
      bookings: number;
      revenue: number;
      rating: number;
    }>;
  };
  customers: {
    total: number;
    active: number;
    repeatRate: number; // %
    averageBookingsPerCustomer: number;
    topCustomers: Array<{
      customerId: string;
      customerName: string;
      bookings: number;
      totalSpent: number;
    }>;
  };
  categories: {
    performance: Array<{
      category: string;
      listings: number;
      bookings: number;
      revenue: number;
      averageRating: number;
    }>;
    growth: Record<string, number>; // % growth
  };
  insights: Array<{
    type: "OPPORTUNITY" | "RISK" | "TREND" | "RECOMMENDATION";
    title: string;
    description: string;
    impact: "LOW" | "MEDIUM" | "HIGH";
    actionable: boolean;
  }>;
}

export interface PredictiveInsight {
  type:
    | "DEMAND_FORECAST"
    | "PRICE_PREDICTION"
    | "CAPACITY_NEED"
    | "TREND_ANALYSIS";
  title: string;
  description: string;
  prediction: {
    value: number;
    unit: string;
    timeframe: string;
    confidence: number; // 0-100
  };
  factors: Array<{
    factor: string;
    impact: number; // -100 to 100
  }>;
  recommendations: string[];
}

export class MarketplaceAnalyticsService {
  /**
   * Get comprehensive analytics
   */
  async getAnalytics(period: AnalyticsPeriod): Promise<MarketplaceAnalytics> {
    const listings = await marketplaceService.searchListings({});
    const bookings = await marketplaceService.searchBookings({});
    const stats = await marketplaceService.getMarketplaceStats();

    // Filter by period
    const periodBookings = bookings.filter((b) => {
      const bookingDate = new Date(b.createdAt);
      return (
        bookingDate >= new Date(period.start) &&
        bookingDate <= new Date(period.end)
      );
    });

    // Calculate bookings by status
    const bookingsByStatus: Record<string, number> = {};
    periodBookings.forEach((b) => {
      bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1;
    });

    // Calculate bookings by category
    const bookingsByCategory: Record<string, number> = {};
    periodBookings.forEach((b) => {
      bookingsByCategory[b.serviceCategory] =
        (bookingsByCategory[b.serviceCategory] || 0) + 1;
    });

    // Calculate revenue
    const totalRevenue = periodBookings.reduce((sum, b) => {
      return sum + (b.pricing?.total || b.pricing?.basePrice || 0);
    }, 0);

    // Calculate revenue by category
    const revenueByCategory: Record<string, number> = {};
    periodBookings.forEach((b) => {
      const revenue = b.pricing?.total || b.pricing?.basePrice || 0;
      revenueByCategory[b.serviceCategory] =
        (revenueByCategory[b.serviceCategory] || 0) + revenue;
    });

    // Generate insights
    const insights = this.generateInsights(listings, periodBookings, stats);

    return {
      period,
      overview: {
        totalListings: listings.length,
        totalProviders: stats.totalProviders,
        totalBookings: periodBookings.length,
        totalRevenue,
        averageRating: stats.averageRating,
        growthRate: this.calculateGrowthRate(periodBookings),
      },
      bookings: {
        total: periodBookings.length,
        byStatus: bookingsByStatus,
        byCategory: bookingsByCategory,
        trend: this.calculateTrend(periodBookings, "bookings"),
        conversionRate: this.calculateConversionRate(listings, periodBookings),
        averageBookingValue:
          periodBookings.length > 0 ? totalRevenue / periodBookings.length : 0,
      },
      revenue: {
        total: totalRevenue,
        byCategory: revenueByCategory,
        trend: this.calculateTrend(periodBookings, "revenue"),
        averageTransactionValue:
          periodBookings.length > 0 ? totalRevenue / periodBookings.length : 0,
        commission: totalRevenue * 0.05, // 5% commission
      },
      providers: {
        total: stats.totalProviders,
        active: new Set(periodBookings.map((b) => b.providerId)).size,
        verified: 0, // Would fetch from verification service
        topPerformers: this.getTopPerformers(periodBookings),
      },
      customers: {
        total: new Set(periodBookings.map((b) => b.customerId)).size,
        active: new Set(periodBookings.map((b) => b.customerId)).size,
        repeatRate: this.calculateRepeatRate(periodBookings),
        averageBookingsPerCustomer:
          this.calculateAverageBookings(periodBookings),
        topCustomers: this.getTopCustomers(periodBookings),
      },
      categories: {
        performance: this.getCategoryPerformance(listings, periodBookings),
        growth: this.calculateCategoryGrowth(periodBookings),
      },
      insights,
    };
  }

  /**
   * Get predictive insights
   */
  async getPredictiveInsights(category?: string): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // Demand forecast
    insights.push({
      type: "DEMAND_FORECAST",
      title: "30-Day Demand Forecast",
      description: "Expected booking demand for the next 30 days",
      prediction: {
        value: 150,
        unit: "bookings",
        timeframe: "30 days",
        confidence: 75,
      },
      factors: [
        { factor: "Historical trends", impact: 60 },
        { factor: "Seasonal patterns", impact: 20 },
        { factor: "Market growth", impact: 15 },
        { factor: "Competition", impact: -5 },
      ],
      recommendations: [
        "Increase capacity during peak periods",
        "Optimize pricing for expected demand",
        "Prepare marketing campaigns",
      ],
    });

    // Price prediction
    insights.push({
      type: "PRICE_PREDICTION",
      title: "Price Trend Prediction",
      description: "Expected price movements in your category",
      prediction: {
        value: 5,
        unit: "% increase",
        timeframe: "90 days",
        confidence: 70,
      },
      factors: [
        { factor: "Market demand", impact: 40 },
        { factor: "Supply constraints", impact: 30 },
        { factor: "Economic factors", impact: 20 },
        { factor: "Competition", impact: -10 },
      ],
      recommendations: [
        "Consider gradual price increases",
        "Monitor competitor pricing",
        "Adjust pricing strategy based on demand",
      ],
    });

    return insights;
  }

  /**
   * Generate insights
   */
  private generateInsights(
    listings: MarketplaceServiceListing[],
    bookings: MarketplaceBooking[],
    stats: any,
  ): MarketplaceAnalytics["insights"] {
    const insights: MarketplaceAnalytics["insights"] = [];

    // Opportunity: Low conversion rate
    const conversionRate = this.calculateConversionRate(listings, bookings);
    if (conversionRate < 5) {
      insights.push({
        type: "OPPORTUNITY",
        title: "Low Conversion Rate",
        description: `Current conversion rate is ${conversionRate.toFixed(1)}%. Focus on improving listing quality and pricing.`,
        impact: "HIGH",
        actionable: true,
      });
    }

    // Trend: Growing category
    const categoryGrowth = this.calculateCategoryGrowth(bookings);
    const fastestGrowing = Object.entries(categoryGrowth).sort(
      ([, a], [, b]) => b - a,
    )[0];
    if (fastestGrowing && fastestGrowing[1] > 20) {
      insights.push({
        type: "TREND",
        title: "Fast-Growing Category",
        description: `${fastestGrowing[0]} category is growing at ${fastestGrowing[1].toFixed(1)}%. Consider expanding in this area.`,
        impact: "MEDIUM",
        actionable: true,
      });
    }

    // Recommendation: Improve ratings
    if (stats.averageRating < 4.0) {
      insights.push({
        type: "RECOMMENDATION",
        title: "Improve Service Quality",
        description: `Average rating is ${stats.averageRating.toFixed(1)}. Focus on improving service quality to increase bookings.`,
        impact: "HIGH",
        actionable: true,
      });
    }

    return insights;
  }

  /**
   * Calculate growth rate
   */
  private calculateGrowthRate(bookings: MarketplaceBooking[]): number {
    if (bookings.length < 2) return 0;

    const sorted = bookings.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

    const firstHalfAvg = firstHalf.length;
    const secondHalfAvg = secondHalf.length;

    if (firstHalfAvg === 0) return 0;
    return ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  }

  /**
   * Calculate trend
   */
  private calculateTrend(
    bookings: MarketplaceBooking[],
    type: "bookings" | "revenue",
  ): Array<{ date: string; count: number }> {
    const trend: Record<string, number> = {};

    bookings.forEach((booking) => {
      const date = new Date(booking.createdAt).toISOString().split("T")[0];
      if (type === "bookings") {
        trend[date] = (trend[date] || 0) + 1;
      } else {
        trend[date] =
          (trend[date] || 0) +
          (booking.pricing?.total || booking.pricing?.basePrice || 0);
      }
    });

    return Object.entries(trend)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate conversion rate
   */
  private calculateConversionRate(
    listings: MarketplaceServiceListing[],
    bookings: MarketplaceBooking[],
  ): number {
    if (listings.length === 0) return 0;
    return (bookings.length / listings.length) * 100;
  }

  /**
   * Calculate repeat rate
   */
  private calculateRepeatRate(bookings: MarketplaceBooking[]): number {
    const customerBookings: Record<string, number> = {};
    bookings.forEach((b) => {
      customerBookings[b.customerId] =
        (customerBookings[b.customerId] || 0) + 1;
    });

    const repeatCustomers = Object.values(customerBookings).filter(
      (count) => count > 1,
    ).length;
    const totalCustomers = Object.keys(customerBookings).length;

    return totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
  }

  /**
   * Calculate average bookings per customer
   */
  private calculateAverageBookings(bookings: MarketplaceBooking[]): number {
    const customerBookings: Record<string, number> = {};
    bookings.forEach((b) => {
      customerBookings[b.customerId] =
        (customerBookings[b.customerId] || 0) + 1;
    });

    const total = Object.values(customerBookings).reduce(
      (sum, count) => sum + count,
      0,
    );
    const customers = Object.keys(customerBookings).length;

    return customers > 0 ? total / customers : 0;
  }

  /**
   * Get top performers
   */
  private getTopPerformers(bookings: MarketplaceBooking[]): Array<{
    providerId: string;
    providerName: string;
    bookings: number;
    revenue: number;
    rating: number;
  }> {
    const providerStats: Record<
      string,
      { bookings: number; revenue: number; providerName: string }
    > = {};

    bookings.forEach((b) => {
      if (!providerStats[b.providerId]) {
        providerStats[b.providerId] = {
          bookings: 0,
          revenue: 0,
          providerName: b.providerName,
        };
      }
      providerStats[b.providerId].bookings++;
      providerStats[b.providerId].revenue +=
        b.pricing?.total || b.pricing?.basePrice || 0;
    });

    return Object.entries(providerStats)
      .map(([providerId, stats]) => ({
        providerId,
        providerName: stats.providerName,
        bookings: stats.bookings,
        revenue: stats.revenue,
        rating: 4.5, // Would fetch from provider service
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  /**
   * Get top customers
   */
  private getTopCustomers(bookings: MarketplaceBooking[]): Array<{
    customerId: string;
    customerName: string;
    bookings: number;
    totalSpent: number;
  }> {
    const customerStats: Record<
      string,
      { bookings: number; totalSpent: number; customerName: string }
    > = {};

    bookings.forEach((b) => {
      if (!customerStats[b.customerId]) {
        customerStats[b.customerId] = {
          bookings: 0,
          totalSpent: 0,
          customerName: b.customerName,
        };
      }
      customerStats[b.customerId].bookings++;
      customerStats[b.customerId].totalSpent +=
        b.pricing?.total || b.pricing?.basePrice || 0;
    });

    return Object.entries(customerStats)
      .map(([customerId, stats]) => ({
        customerId,
        customerName: stats.customerName,
        bookings: stats.bookings,
        totalSpent: stats.totalSpent,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  }

  /**
   * Get category performance
   */
  private getCategoryPerformance(
    listings: MarketplaceServiceListing[],
    bookings: MarketplaceBooking[],
  ): Array<{
    category: string;
    listings: number;
    bookings: number;
    revenue: number;
    averageRating: number;
  }> {
    const categoryStats: Record<
      string,
      {
        listings: number;
        bookings: number;
        revenue: number;
        ratings: number[];
      }
    > = {};

    listings.forEach((l) => {
      if (!categoryStats[l.category]) {
        categoryStats[l.category] = {
          listings: 0,
          bookings: 0,
          revenue: 0,
          ratings: [],
        };
      }
      categoryStats[l.category].listings++;
      categoryStats[l.category].ratings.push(l.rating);
    });

    bookings.forEach((b) => {
      if (categoryStats[b.serviceCategory]) {
        categoryStats[b.serviceCategory].bookings++;
        categoryStats[b.serviceCategory].revenue +=
          b.pricing?.total || b.pricing?.basePrice || 0;
      }
    });

    return Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      listings: stats.listings,
      bookings: stats.bookings,
      revenue: stats.revenue,
      averageRating:
        stats.ratings.length > 0
          ? stats.ratings.reduce((sum, r) => sum + r, 0) / stats.ratings.length
          : 0,
    }));
  }

  /**
   * Calculate category growth
   */
  private calculateCategoryGrowth(
    bookings: MarketplaceBooking[],
  ): Record<string, number> {
    if (bookings.length < 2) return {};

    const sorted = bookings.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

    const categoryCountsFirst: Record<string, number> = {};
    const categoryCountsSecond: Record<string, number> = {};

    firstHalf.forEach((b) => {
      categoryCountsFirst[b.serviceCategory] =
        (categoryCountsFirst[b.serviceCategory] || 0) + 1;
    });

    secondHalf.forEach((b) => {
      categoryCountsSecond[b.serviceCategory] =
        (categoryCountsSecond[b.serviceCategory] || 0) + 1;
    });

    const growth: Record<string, number> = {};
    Object.keys(categoryCountsSecond).forEach((category) => {
      const first = categoryCountsFirst[category] || 0;
      const second = categoryCountsSecond[category] || 0;
      if (first > 0) {
        growth[category] = ((second - first) / first) * 100;
      } else if (second > 0) {
        growth[category] = 100; // New category
      }
    });

    return growth;
  }
}

// Singleton instance
export const marketplaceAnalyticsService = new MarketplaceAnalyticsService();
