/**
 * Personalization Service - AI-Powered Workspace Personalization
 *
 * Tracks user behavior and provides intelligent recommendations
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-bus";
import type {
  PersonalizationInsight,
  UserBehaviorPattern,
  WorkspaceEventType,
  WorkspaceUsageStats,
} from "@/types/workspace";

export class PersonalizationService {
  /**
   * Track user behavior
   */
  async trackUserBehavior(
    userId: string,
    tenantId: string,
    eventType: WorkspaceEventType,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await prisma.workspaceAnalytics.create({
        data: {
          userId,
          tenantId,
          eventType,
          widgetId: metadata?.widgetId,
          layoutId: metadata?.layoutId,
          metadata: metadata || {},
        },
      });

      // Publish event for real-time processing
      await eventBus.publish({
        type: "WorkspaceBehaviorTracked",
        aggregateId: userId,
        aggregateType: "User",
        payload: {
          userId,
          eventType,
          metadata,
        },
        metadata: {
          tenantId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[PersonalizationService] Error tracking behavior:", error);
      // Don't throw - tracking failures shouldn't break the app
    }
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalizedRecommendations(
    userId: string,
  ): Promise<PersonalizationInsight[]> {
    try {
      const patterns = await this.learnUserPatterns(userId);
      const insights: PersonalizationInsight[] = [];

      // Analyze patterns and generate recommendations
      if (patterns.frequentWidgets.length > 0) {
        // Recommend adding frequently used widgets
        insights.push({
          id: `rec-${Date.now()}-1`,
          type: "RECOMMENDATION",
          title: "Frequently Used Widgets",
          description: `Consider adding these widgets to your workspace: ${patterns.frequentWidgets.slice(0, 3).join(", ")}`,
          priority: "MEDIUM",
          action: {
            type: "add_widgets",
            label: "Add Widgets",
            data: {
              widgetIds: patterns.frequentWidgets.slice(0, 3),
            },
          },
          createdAt: new Date(),
        });
      }

      // Peak usage hours recommendation
      if (patterns.peakUsageHours.length > 0) {
        const peakHour = patterns.peakUsageHours[0];
        insights.push({
          id: `rec-${Date.now()}-2`,
          type: "OPTIMIZATION",
          title: "Peak Usage Time",
          description: `You're most active at ${peakHour}:00. Consider scheduling important tasks during this time.`,
          priority: "LOW",
          createdAt: new Date(),
        });
      }

      // Session duration optimization
      if (patterns.averageSessionDuration < 5) {
        insights.push({
          id: `rec-${Date.now()}-3`,
          type: "TREND",
          title: "Quick Sessions",
          description:
            "Your sessions are short. Consider using quick-access widgets for faster information retrieval.",
          priority: "LOW",
          createdAt: new Date(),
        });
      }

      return insights;
    } catch (error) {
      console.error(
        "[PersonalizationService] Error getting recommendations:",
        error,
      );
      return [];
    }
  }

  /**
   * Learn user patterns
   */
  async learnUserPatterns(userId: string): Promise<UserBehaviorPattern> {
    try {
      // Get analytics from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const analytics = await prisma.workspaceAnalytics.findMany({
        where: {
          userId,
          timestamp: {
            gte: thirtyDaysAgo,
          },
        },
        orderBy: { timestamp: "desc" },
      });

      // Calculate frequent widgets
      const widgetViews = new Map<string, number>();
      analytics.forEach((a) => {
        if (a.widgetId) {
          widgetViews.set(a.widgetId, (widgetViews.get(a.widgetId) || 0) + 1);
        }
      });

      const frequentWidgets = Array.from(widgetViews.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([widgetId]) => widgetId);

      // Calculate peak usage hours
      const hourCounts = new Map<number, number>();
      analytics.forEach((a) => {
        const hour = new Date(a.timestamp).getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });

      const peakUsageHours = Array.from(hourCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour]) => hour);

      // Calculate average session duration (simplified)
      const sessions = this.groupIntoSessions(analytics);
      const averageSessionDuration =
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
          : 0;

      // Most active days
      const dayCounts = new Map<string, number>();
      analytics.forEach((a) => {
        const day = new Date(a.timestamp).toLocaleDateString("en-US", {
          weekday: "long",
        });
        dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
      });

      const mostActiveDays = Array.from(dayCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([day]) => day);

      // Preferred layouts (from layout_changed events)
      const layoutChanges = analytics.filter(
        (a) => a.eventType === "layout_changed",
      );
      const layoutCounts = new Map<string, number>();
      layoutChanges.forEach((a) => {
        if (a.layoutId) {
          layoutCounts.set(a.layoutId, (layoutCounts.get(a.layoutId) || 0) + 1);
        }
      });

      const preferredLayouts = Array.from(layoutCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([layoutId]) => layoutId);

      return {
        userId,
        frequentWidgets,
        peakUsageHours,
        preferredLayouts,
        averageSessionDuration,
        mostActiveDays,
      };
    } catch (error) {
      console.error("[PersonalizationService] Error learning patterns:", error);
      return {
        userId,
        frequentWidgets: [],
        peakUsageHours: [],
        preferredLayouts: [],
        averageSessionDuration: 0,
        mostActiveDays: [],
      };
    }
  }

  /**
   * Optimize layout based on usage data
   */
  async optimizeLayout(userId: string, usageData: any): Promise<any> {
    try {
      const patterns = await this.learnUserPatterns(userId);

      // Generate optimization suggestions
      const suggestions = {
        moveFrequentWidgetsToTop: patterns.frequentWidgets.slice(0, 5),
        removeUnusedWidgets: [], // Would need to track unused widgets
        suggestedLayout: patterns.preferredLayouts[0] || null,
      };

      return suggestions;
    } catch (error) {
      console.error("[PersonalizationService] Error optimizing layout:", error);
      return null;
    }
  }

  /**
   * Generate insights
   */
  async generateInsights(
    userId: string,
    timeRange: { start: Date; end: Date },
  ): Promise<PersonalizationInsight[]> {
    try {
      const analytics = await prisma.workspaceAnalytics.findMany({
        where: {
          userId,
          timestamp: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
      });

      const insights: PersonalizationInsight[] = [];

      // Widget usage insights
      const widgetUsage = new Map<string, number>();
      analytics.forEach((a) => {
        if (a.widgetId && a.eventType === "widget_viewed") {
          widgetUsage.set(a.widgetId, (widgetUsage.get(a.widgetId) || 0) + 1);
        }
      });

      if (widgetUsage.size > 0) {
        const topWidget = Array.from(widgetUsage.entries()).sort(
          (a, b) => b[1] - a[1],
        )[0];

        insights.push({
          id: `insight-${Date.now()}-1`,
          type: "TREND",
          title: "Most Viewed Widget",
          description: `You viewed this widget ${topWidget[1]} times in this period.`,
          priority: "LOW",
          metadata: {
            widgetId: topWidget[0],
            viewCount: topWidget[1],
          },
          createdAt: new Date(),
        });
      }

      return insights;
    } catch (error) {
      console.error(
        "[PersonalizationService] Error generating insights:",
        error,
      );
      return [];
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(
    userId: string,
    timeRange?: { start: Date; end: Date },
  ): Promise<WorkspaceUsageStats> {
    try {
      const where: any = { userId };

      if (timeRange) {
        where.timestamp = {
          gte: timeRange.start,
          lte: timeRange.end,
        };
      }

      const analytics = await prisma.workspaceAnalytics.findMany({
        where,
      });

      const widgetViews = new Map<string, { name: string; views: number }>();
      const layoutUsage = new Map<string, { name: string; usage: number }>();

      analytics.forEach((a) => {
        if (a.eventType === "widget_viewed" && a.widgetId) {
          const current = widgetViews.get(a.widgetId) || {
            name: a.widgetId,
            views: 0,
          };
          widgetViews.set(a.widgetId, { ...current, views: current.views + 1 });
        }

        if (a.eventType === "layout_changed" && a.layoutId) {
          const current = layoutUsage.get(a.layoutId) || {
            name: a.layoutId,
            usage: 0,
          };
          layoutUsage.set(a.layoutId, { ...current, usage: current.usage + 1 });
        }
      });

      const sessions = this.groupIntoSessions(analytics);
      const averageSessionTime =
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
          : 0;

      // Calculate peak hours
      const hourCounts = new Map<number, number>();
      analytics.forEach((a) => {
        const hour = new Date(a.timestamp).getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });

      const peakUsageHours = Array.from(hourCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour]) => hour);

      return {
        totalWidgetViews: analytics.filter(
          (a) => a.eventType === "widget_viewed",
        ).length,
        totalLayoutChanges: analytics.filter(
          (a) => a.eventType === "layout_changed",
        ).length,
        mostUsedWidgets: Array.from(widgetViews.values())
          .sort((a, b) => b.views - a.views)
          .slice(0, 10),
        mostUsedLayouts: Array.from(layoutUsage.values())
          .sort((a, b) => b.usage - a.usage)
          .slice(0, 10),
        averageSessionTime,
        peakUsageHours,
      };
    } catch (error) {
      console.error(
        "[PersonalizationService] Error getting usage stats:",
        error,
      );
      return {
        totalWidgetViews: 0,
        totalLayoutChanges: 0,
        mostUsedWidgets: [],
        mostUsedLayouts: [],
        averageSessionTime: 0,
        peakUsageHours: [],
      };
    }
  }

  /**
   * Group analytics into sessions (simplified - 30 min inactivity = new session)
   */
  private groupIntoSessions(
    analytics: any[],
  ): Array<{ start: Date; end: Date; duration: number }> {
    if (analytics.length === 0) return [];

    const sessions: Array<{ start: Date; end: Date; duration: number }> = [];
    let currentSession = {
      start: new Date(analytics[0].timestamp),
      end: new Date(analytics[0].timestamp),
    };

    for (let i = 1; i < analytics.length; i++) {
      const current = new Date(analytics[i].timestamp);
      const previous = new Date(analytics[i - 1].timestamp);
      const diffMinutes =
        (current.getTime() - previous.getTime()) / (1000 * 60);

      if (diffMinutes > 30) {
        // New session
        sessions.push({
          ...currentSession,
          duration:
            (currentSession.end.getTime() - currentSession.start.getTime()) /
            (1000 * 60),
        });
        currentSession = {
          start: current,
          end: current,
        };
      } else {
        currentSession.end = current;
      }
    }

    // Add last session
    sessions.push({
      ...currentSession,
      duration:
        (currentSession.end.getTime() - currentSession.start.getTime()) /
        (1000 * 60),
    });

    return sessions;
  }
}

export const personalizationService = new PersonalizationService();
