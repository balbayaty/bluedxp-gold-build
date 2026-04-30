/**
 * Dashboard Analytics Service
 * Track dashboard usage and performance
 */

export interface DashboardAnalytics {
  dashboardId: string;
  views: number;
  uniqueUsers: number;
  averageViewTime: number;
  mostViewedWidgets: Array<{ widgetId: string; views: number }>;
  userEngagement: number;
  lastViewed: Date;
}

export class DashboardAnalyticsService {
  private analytics: Map<string, DashboardAnalytics> = new Map();

  /**
   * Track dashboard view
   */
  async trackView(dashboardId: string, userId: string): Promise<void> {
    const existing = this.analytics.get(dashboardId) || {
      dashboardId,
      views: 0,
      uniqueUsers: 0,
      averageViewTime: 0,
      mostViewedWidgets: [],
      userEngagement: 0,
      lastViewed: new Date(),
    };

    existing.views++;
    existing.lastViewed = new Date();
    this.analytics.set(dashboardId, existing);
  }

  /**
   * Track widget interaction
   */
  async trackWidgetInteraction(
    dashboardId: string,
    widgetId: string,
  ): Promise<void> {
    const analytics = this.analytics.get(dashboardId);
    if (!analytics) return;

    const widget = analytics.mostViewedWidgets.find(
      (w) => w.widgetId === widgetId,
    );
    if (widget) {
      widget.views++;
    } else {
      analytics.mostViewedWidgets.push({ widgetId, views: 1 });
    }

    this.analytics.set(dashboardId, analytics);
  }

  /**
   * Get dashboard analytics
   */
  async getAnalytics(dashboardId: string): Promise<DashboardAnalytics | null> {
    return this.analytics.get(dashboardId) || null;
  }

  /**
   * Get all analytics
   */
  async getAllAnalytics(): Promise<DashboardAnalytics[]> {
    return Array.from(this.analytics.values());
  }

  /**
   * Calculate user engagement
   */
  calculateEngagement(analytics: DashboardAnalytics): number {
    // Simple engagement score based on views and time
    return Math.min(100, analytics.views * 10 + analytics.averageViewTime / 60);
  }
}

export const dashboardAnalyticsService = new DashboardAnalyticsService();
