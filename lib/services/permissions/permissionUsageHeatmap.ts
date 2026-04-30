/**
 * 🔥 PERMISSION USAGE HEATMAP
 *
 * Mind-blowing usage analytics:
 * - Time-based permission usage
 * - Heatmap visualization
 * - Peak usage detection
 * - Permission efficiency metrics
 * - Usage patterns
 * - Optimization suggestions
 */

import type { User, ModuleId, FeatureId, TabId } from "@/types/user";

// ============================================================================
// TYPES
// ============================================================================

export interface UsageDataPoint {
  timestamp: Date;
  userId: string;
  moduleId?: ModuleId;
  featureId?: FeatureId;
  tabId?: TabId;
  action: "ACCESS" | "CREATE" | "UPDATE" | "DELETE" | "EXPORT";
  success: boolean;
  duration?: number; // milliseconds
}

export interface HeatmapData {
  hour: number; // 0-23
  day: number; // 0-6 (Sunday-Saturday)
  count: number;
  averageDuration: number;
  successRate: number;
}

export interface UsagePattern {
  userId: string;
  userName: string;
  peakHours: number[];
  peakDays: number[];
  mostUsedModules: Array<{ moduleId: ModuleId; count: number }>;
  mostUsedFeatures: Array<{ featureId: FeatureId; count: number }>;
  averageSessionDuration: number;
  permissionUtilization: number; // 0-100
  efficiency: number; // 0-100
}

export interface UsageAnalytics {
  totalAccesses: number;
  uniqueUsers: number;
  timeRange: { start: Date; end: Date };
  heatmap: HeatmapData[];
  patterns: UsagePattern[];
  insights: string[];
  recommendations: string[];
}

// ============================================================================
// USAGE HEATMAP SERVICE
// ============================================================================

class PermissionUsageHeatmapService {
  private usageData: UsageDataPoint[] = [];
  private readonly MAX_DATA_POINTS = 100000;

  /**
   * Record usage
   */
  async recordUsage(data: UsageDataPoint): Promise<void> {
    this.usageData.push(data);

    // Maintain data size
    if (this.usageData.length > this.MAX_DATA_POINTS) {
      this.usageData = this.usageData.slice(-this.MAX_DATA_POINTS);
    }
  }

  /**
   * Get heatmap data
   */
  async getHeatmapData(timeRange?: {
    start: Date;
    end: Date;
  }): Promise<HeatmapData[]> {
    let filtered = this.usageData;

    if (timeRange) {
      filtered = filtered.filter(
        (d) => d.timestamp >= timeRange.start && d.timestamp <= timeRange.end,
      );
    }

    // Group by hour and day
    const heatmapMap = new Map<
      string,
      {
        count: number;
        totalDuration: number;
        successes: number;
      }
    >();

    filtered.forEach((data) => {
      const date = new Date(data.timestamp);
      const hour = date.getHours();
      const day = date.getDay();
      const key = `${day}-${hour}`;

      const existing = heatmapMap.get(key) || {
        count: 0,
        totalDuration: 0,
        successes: 0,
      };

      existing.count++;
      if (data.duration) existing.totalDuration += data.duration;
      if (data.success) existing.successes++;

      heatmapMap.set(key, existing);
    });

    // Convert to HeatmapData
    const heatmap: HeatmapData[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        const data = heatmapMap.get(key);

        if (data) {
          heatmap.push({
            hour,
            day,
            count: data.count,
            averageDuration: data.totalDuration / data.count,
            successRate: (data.successes / data.count) * 100,
          });
        } else {
          heatmap.push({
            hour,
            day,
            count: 0,
            averageDuration: 0,
            successRate: 100,
          });
        }
      }
    }

    return heatmap;
  }

  /**
   * Get usage patterns
   */
  async getUsagePatterns(
    userId?: string,
    timeRange?: { start: Date; end: Date },
  ): Promise<UsagePattern[]> {
    let filtered = this.usageData;

    if (userId) {
      filtered = filtered.filter((d) => d.userId === userId);
    }

    if (timeRange) {
      filtered = filtered.filter(
        (d) => d.timestamp >= timeRange.start && d.timestamp <= timeRange.end,
      );
    }

    // Group by user
    const userMap = new Map<string, UsageDataPoint[]>();

    filtered.forEach((data) => {
      const existing = userMap.get(data.userId) || [];
      existing.push(data);
      userMap.set(data.userId, existing);
    });

    // Analyze patterns for each user
    const patterns: UsagePattern[] = [];

    userMap.forEach((dataPoints, userId) => {
      // Calculate peak hours
      const hourCounts = new Map<number, number>();
      dataPoints.forEach((d) => {
        const hour = new Date(d.timestamp).getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });
      const peakHours = Array.from(hourCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour]) => hour);

      // Calculate peak days
      const dayCounts = new Map<number, number>();
      dataPoints.forEach((d) => {
        const day = new Date(d.timestamp).getDay();
        dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
      });
      const peakDays = Array.from(dayCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([day]) => day);

      // Most used modules
      const moduleCounts = new Map<ModuleId, number>();
      dataPoints.forEach((d) => {
        if (d.moduleId) {
          moduleCounts.set(d.moduleId, (moduleCounts.get(d.moduleId) || 0) + 1);
        }
      });
      const mostUsedModules = Array.from(moduleCounts.entries())
        .map(([moduleId, count]) => ({ moduleId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Most used features
      const featureCounts = new Map<FeatureId, number>();
      dataPoints.forEach((d) => {
        if (d.featureId) {
          featureCounts.set(
            d.featureId,
            (featureCounts.get(d.featureId) || 0) + 1,
          );
        }
      });
      const mostUsedFeatures = Array.from(featureCounts.entries())
        .map(([featureId, count]) => ({ featureId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Average session duration
      const durations = dataPoints
        .filter((d) => d.duration)
        .map((d) => d.duration!);
      const averageSessionDuration =
        durations.length > 0
          ? durations.reduce((sum, d) => sum + d, 0) / durations.length
          : 0;

      // Permission utilization (simplified - would need user's total permissions)
      const permissionUtilization = Math.min(
        100,
        (dataPoints.length / 100) * 100,
      );

      // Efficiency (based on success rate and duration)
      const successRate =
        dataPoints.filter((d) => d.success).length / dataPoints.length;
      const efficiency =
        successRate * 100 - (averageSessionDuration > 5000 ? 20 : 0);

      patterns.push({
        userId,
        userName: `User ${userId}`, // Would fetch from user service
        peakHours,
        peakDays,
        mostUsedModules,
        mostUsedFeatures,
        averageSessionDuration,
        permissionUtilization,
        efficiency: Math.max(0, Math.min(100, efficiency)),
      });
    });

    return patterns;
  }

  /**
   * Get comprehensive analytics
   */
  async getAnalytics(timeRange?: {
    start: Date;
    end: Date;
  }): Promise<UsageAnalytics> {
    const filtered = timeRange
      ? this.usageData.filter(
          (d) => d.timestamp >= timeRange.start && d.timestamp <= timeRange.end,
        )
      : this.usageData;

    const uniqueUsers = new Set(filtered.map((d) => d.userId));

    const heatmap = await this.getHeatmapData(timeRange);
    const patterns = await this.getUsagePatterns(undefined, timeRange);

    // Generate insights
    const insights = this.generateInsights(heatmap, patterns);

    // Generate recommendations
    const recommendations = this.generateRecommendations(patterns);

    return {
      totalAccesses: filtered.length,
      uniqueUsers: uniqueUsers.size,
      timeRange: timeRange || {
        start: filtered[0]?.timestamp || new Date(),
        end: filtered[filtered.length - 1]?.timestamp || new Date(),
      },
      heatmap,
      patterns,
      insights,
      recommendations,
    };
  }

  /**
   * Generate insights
   */
  private generateInsights(
    heatmap: HeatmapData[],
    patterns: UsagePattern[],
  ): string[] {
    const insights: string[] = [];

    // Find peak usage time
    const peakData = heatmap.reduce(
      (max, d) => (d.count > max.count ? d : max),
      heatmap[0],
    );
    if (peakData && peakData.count > 0) {
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      insights.push(
        `Peak usage: ${dayNames[peakData.day]} at ${peakData.hour}:00 (${peakData.count} accesses)`,
      );
    }

    // Find underutilized permissions
    const lowUtilization = patterns.filter((p) => p.permissionUtilization < 30);
    if (lowUtilization.length > 0) {
      insights.push(
        `${lowUtilization.length} user(s) have low permission utilization (<30%)`,
      );
    }

    // Find efficiency issues
    const lowEfficiency = patterns.filter((p) => p.efficiency < 50);
    if (lowEfficiency.length > 0) {
      insights.push(
        `${lowEfficiency.length} user(s) have low efficiency scores (<50%)`,
      );
    }

    return insights;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(patterns: UsagePattern[]): string[] {
    const recommendations: string[] = [];

    // Low utilization
    const lowUtilization = patterns.filter((p) => p.permissionUtilization < 30);
    if (lowUtilization.length > 0) {
      recommendations.push(
        `Consider reviewing permissions for ${lowUtilization.length} user(s) with low utilization`,
      );
    }

    // High utilization
    const highUtilization = patterns.filter(
      (p) => p.permissionUtilization > 90,
    );
    if (highUtilization.length > 0) {
      recommendations.push(
        `${highUtilization.length} user(s) are using most of their permissions - consider expanding access`,
      );
    }

    return recommendations;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const permissionUsageHeatmap = new PermissionUsageHeatmapService();
