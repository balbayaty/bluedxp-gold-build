/**
 * Geofence Analytics Service
 *
 * Enterprise-grade analytics for geofence system
 * - Zone performance metrics
 * - Event analytics
 * - Trend analysis
 * - Driver performance
 * - Cost analysis
 * - Compliance metrics
 */

import type { GeofenceZone, GeofenceEvent } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface ZonePerformanceMetrics {
  zoneId: string;
  zoneName: string;
  zoneType: GeofenceZone["type"];
  totalEntries: number;
  totalExits: number;
  averageDwellTime: number;
  medianDwellTime: number;
  maxDwellTime: number;
  minDwellTime: number;
  dwellTimeViolations: number;
  dwellTimeWarnings: number;
  onTimeRate: number; // Percentage of entries/exits within expected time
  efficiencyScore: number; // 0-100
  costImpact: number; // Estimated cost impact
  trends: {
    entries: TrendData[];
    exits: TrendData[];
    dwellTime: TrendData[];
  };
}

export interface TrendData {
  period: string; // '2025-01-15', 'Week 3', etc.
  value: number;
  change?: number; // Percentage change from previous period
}

export interface EventAnalytics {
  totalEvents: number;
  eventsByType: Record<GeofenceEvent["eventType"], number>;
  eventsByZone: Record<string, number>;
  eventsByTime: {
    hourly: Record<number, number>;
    daily: Record<string, number>;
    weekly: Record<string, number>;
  };
  anomalies: number;
  alerts: number;
}

export interface DriverPerformance {
  driverId: string;
  driverName: string;
  totalShipments: number;
  averageDwellTime: number;
  onTimeRate: number;
  violations: number;
  score: number; // 0-100
  trends: {
    dwellTime: TrendData[];
    onTimeRate: TrendData[];
  };
}

export interface GeofenceAnalytics {
  tenantId: string;
  period: {
    start: Date;
    end: Date;
  };
  zoneMetrics: ZonePerformanceMetrics[];
  eventAnalytics: EventAnalytics;
  driverPerformance: DriverPerformance[];
  summary: {
    totalZones: number;
    activeZones: number;
    totalEvents: number;
    averageDwellTime: number;
    efficiencyScore: number;
    costSavings: number;
    complianceScore: number;
  };
  insights: Array<{
    type: "OPPORTUNITY" | "RISK" | "TREND" | "ANOMALY";
    title: string;
    description: string;
    impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    value?: number;
  }>;
}

// ============================================================================
// SERVICE
// ============================================================================

class GeofenceAnalyticsService {
  /**
   * Generate comprehensive analytics
   */
  async generateAnalytics(
    tenantId: string,
    zones: GeofenceZone[],
    events: GeofenceEvent[],
    period: { start: Date; end: Date },
  ): Promise<GeofenceAnalytics> {
    // Filter events by period
    const periodEvents = events.filter(
      (e) =>
        new Date(e.timestamp) >= period.start &&
        new Date(e.timestamp) <= period.end,
    );

    // Calculate zone metrics
    const zoneMetrics = zones.map((zone) =>
      this.calculateZoneMetrics(zone, periodEvents),
    );

    // Calculate event analytics
    const eventAnalytics = this.calculateEventAnalytics(periodEvents);

    // Calculate driver performance (simplified - would need driver data)
    const driverPerformance: DriverPerformance[] = [];

    // Calculate summary
    const summary = {
      totalZones: zones.length,
      activeZones: zones.filter((z) => z.enabled).length,
      totalEvents: periodEvents.length,
      averageDwellTime: this.calculateAverageDwellTime(periodEvents),
      efficiencyScore: this.calculateEfficiencyScore(zoneMetrics),
      costSavings: this.calculateCostSavings(zoneMetrics),
      complianceScore: this.calculateComplianceScore(zoneMetrics, periodEvents),
    };

    // Generate insights
    const insights = this.generateInsights(zoneMetrics, eventAnalytics);

    return {
      tenantId,
      period,
      zoneMetrics,
      eventAnalytics,
      driverPerformance,
      summary,
      insights,
    };
  }

  /**
   * Calculate zone performance metrics
   */
  private calculateZoneMetrics(
    zone: GeofenceZone,
    events: GeofenceEvent[],
  ): ZonePerformanceMetrics {
    const zoneEvents = events.filter((e) => e.zoneId === zone.id);
    const entries = zoneEvents.filter((e) => e.eventType === "ZONE_ENTRY");
    const exits = zoneEvents.filter((e) => e.eventType === "ZONE_EXIT");

    const dwellTimes = exits
      .filter((e) => e.dwellTime !== undefined)
      .map((e) => e.dwellTime!);

    const averageDwellTime =
      dwellTimes.length > 0
        ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length
        : 0;

    const sortedDwellTimes = [...dwellTimes].sort((a, b) => a - b);
    const medianDwellTime =
      sortedDwellTimes.length > 0
        ? sortedDwellTimes[Math.floor(sortedDwellTimes.length / 2)]
        : 0;

    const expectedDwell = zone.metadata.expectedDwellTime || 30;
    const maxDwell = zone.metadata.maxDwellTime || 90;

    const dwellTimeViolations = dwellTimes.filter((dt) => dt > maxDwell).length;
    const dwellTimeWarnings = dwellTimes.filter(
      (dt) => dt > expectedDwell * 1.2 && dt <= maxDwell,
    ).length;

    const onTimeRate =
      exits.length > 0
        ? ((exits.length - dwellTimeViolations) / exits.length) * 100
        : 100;

    const efficiencyScore = Math.max(
      0,
      Math.min(
        100,
        100 -
          (dwellTimeViolations / exits.length) * 100 -
          (averageDwellTime / maxDwell) * 20,
      ),
    );

    // Calculate trends (simplified - would group by time periods)
    const trends = {
      entries: this.calculateTrend(entries, "timestamp"),
      exits: this.calculateTrend(exits, "timestamp"),
      dwellTime: this.calculateTrend(
        dwellTimes.map((dt, idx) => ({
          value: dt,
          timestamp: exits[idx]?.timestamp || new Date(),
        })),
        "timestamp",
      ),
    };

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      zoneType: zone.type,
      totalEntries: entries.length,
      totalExits: exits.length,
      averageDwellTime: Math.round(averageDwellTime * 10) / 10,
      medianDwellTime: Math.round(medianDwellTime * 10) / 10,
      maxDwellTime: dwellTimes.length > 0 ? Math.max(...dwellTimes) : 0,
      minDwellTime: dwellTimes.length > 0 ? Math.min(...dwellTimes) : 0,
      dwellTimeViolations,
      dwellTimeWarnings,
      onTimeRate: Math.round(onTimeRate * 10) / 10,
      efficiencyScore: Math.round(efficiencyScore * 10) / 10,
      costImpact: this.calculateZoneCostImpact(
        zone,
        averageDwellTime,
        expectedDwell,
      ),
      trends,
    };
  }

  /**
   * Calculate event analytics
   */
  private calculateEventAnalytics(events: GeofenceEvent[]): EventAnalytics {
    const eventsByType: Record<GeofenceEvent["eventType"], number> = {
      ZONE_ENTRY: 0,
      ZONE_EXIT: 0,
      DWELL_TIME_WARNING: 0,
      DWELL_TIME_EXCEEDED: 0,
      ROUTE_DEVIATION: 0,
      SPEED_VIOLATION: 0,
      UNEXPECTED_STOP: 0,
    };

    const eventsByZone: Record<string, number> = {};
    const hourly: Record<number, number> = {};
    const daily: Record<string, number> = {};
    const weekly: Record<string, number> = {};

    let anomalies = 0;
    let alerts = 0;

    for (const event of events) {
      // Count by type
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;

      // Count by zone
      eventsByZone[event.zoneId] = (eventsByZone[event.zoneId] || 0) + 1;

      // Count by time
      const eventDate = new Date(event.timestamp);
      const hour = eventDate.getHours();
      const day = eventDate.toISOString().split("T")[0];
      const week = this.getWeekKey(eventDate);

      hourly[hour] = (hourly[hour] || 0) + 1;
      daily[day] = (daily[day] || 0) + 1;
      weekly[week] = (weekly[week] || 0) + 1;

      // Count anomalies and alerts
      if (
        event.eventType === "ROUTE_DEVIATION" ||
        event.eventType === "SPEED_VIOLATION"
      ) {
        anomalies++;
      }
      if (
        event.eventType === "DWELL_TIME_WARNING" ||
        event.eventType === "DWELL_TIME_EXCEEDED"
      ) {
        alerts++;
      }
    }

    return {
      totalEvents: events.length,
      eventsByType,
      eventsByZone,
      eventsByTime: {
        hourly,
        daily,
        weekly,
      },
      anomalies,
      alerts,
    };
  }

  /**
   * Calculate average dwell time
   */
  private calculateAverageDwellTime(events: GeofenceEvent[]): number {
    const dwellTimes = events
      .filter((e) => e.eventType === "ZONE_EXIT" && e.dwellTime !== undefined)
      .map((e) => e.dwellTime!);

    if (dwellTimes.length === 0) return 0;
    return (
      Math.round(
        (dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length) * 10,
      ) / 10
    );
  }

  /**
   * Calculate efficiency score
   */
  private calculateEfficiencyScore(
    zoneMetrics: ZonePerformanceMetrics[],
  ): number {
    if (zoneMetrics.length === 0) return 100;
    const avgScore =
      zoneMetrics.reduce((sum, zm) => sum + zm.efficiencyScore, 0) /
      zoneMetrics.length;
    return Math.round(avgScore * 10) / 10;
  }

  /**
   * Calculate cost savings
   */
  private calculateCostSavings(zoneMetrics: ZonePerformanceMetrics[]): number {
    // Simplified calculation - would use actual cost data
    return zoneMetrics.reduce((sum, zm) => sum + zm.costImpact, 0);
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(
    zoneMetrics: ZonePerformanceMetrics[],
    events: GeofenceEvent[],
  ): number {
    const totalViolations = zoneMetrics.reduce(
      (sum, zm) => sum + zm.dwellTimeViolations,
      0,
    );
    const totalEvents = events.length;
    if (totalEvents === 0) return 100;
    const complianceRate =
      ((totalEvents - totalViolations) / totalEvents) * 100;
    return Math.round(complianceRate * 10) / 10;
  }

  /**
   * Calculate zone cost impact
   */
  private calculateZoneCostImpact(
    zone: GeofenceZone,
    averageDwell: number,
    expectedDwell: number,
  ): number {
    // Simplified - would use actual cost per minute
    const costPerMinute = 10; // Example: $10 per minute of delay
    const excessDwell = Math.max(0, averageDwell - expectedDwell);
    return excessDwell * costPerMinute;
  }

  /**
   * Calculate trend data
   */
  private calculateTrend<T extends { timestamp: Date | string }>(
    data: T[],
    timestampKey: keyof T,
  ): TrendData[] {
    // Group by day (simplified)
    const grouped: Record<string, number> = {};
    for (const item of data) {
      const date = new Date(item[timestampKey] as Date | string);
      const day = date.toISOString().split("T")[0];
      grouped[day] = (grouped[day] || 0) + 1;
    }

    const trends: TrendData[] = [];
    const sortedDays = Object.keys(grouped).sort();

    for (let i = 0; i < sortedDays.length; i++) {
      const day = sortedDays[i];
      const value = grouped[day];
      const change =
        i > 0
          ? ((value - grouped[sortedDays[i - 1]]) /
              grouped[sortedDays[i - 1]]) *
            100
          : undefined;

      trends.push({
        period: day,
        value,
        change: change !== undefined ? Math.round(change * 10) / 10 : undefined,
      });
    }

    return trends;
  }

  /**
   * Generate insights
   */
  private generateInsights(
    zoneMetrics: ZonePerformanceMetrics[],
    eventAnalytics: EventAnalytics,
  ): Array<{
    type: "OPPORTUNITY" | "RISK" | "TREND" | "ANOMALY";
    title: string;
    description: string;
    impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    value?: number;
  }> {
    const insights: Array<{
      type: "OPPORTUNITY" | "RISK" | "TREND" | "ANOMALY";
      title: string;
      description: string;
      impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      value?: number;
    }> = [];

    // Find zones with high violation rates
    const highViolationZones = zoneMetrics.filter(
      (zm) => zm.dwellTimeViolations > zm.totalExits * 0.1,
    );
    if (highViolationZones.length > 0) {
      insights.push({
        type: "RISK",
        title: "High Dwell Time Violations Detected",
        description: `${highViolationZones.length} zone(s) have violation rates above 10%. Review and optimize zone configurations.`,
        impact: "HIGH",
        value: highViolationZones.reduce((sum, zm) => sum + zm.costImpact, 0),
      });
    }

    // Find optimization opportunities
    const optimizationZones = zoneMetrics.filter(
      (zm) => zm.efficiencyScore < 70,
    );
    if (optimizationZones.length > 0) {
      insights.push({
        type: "OPPORTUNITY",
        title: "Zone Optimization Opportunities",
        description: `${optimizationZones.length} zone(s) have efficiency scores below 70%. Consider adjusting dwell time expectations or zone boundaries.`,
        impact: "MEDIUM",
        value: optimizationZones.reduce((sum, zm) => sum + zm.costImpact, 0),
      });
    }

    // Check for anomalies
    if (eventAnalytics.anomalies > 0) {
      insights.push({
        type: "ANOMALY",
        title: "Anomalies Detected",
        description: `${eventAnalytics.anomalies} anomaly(ies) detected in the period. Review for route deviations and speed violations.`,
        impact: "MEDIUM",
      });
    }

    return insights;
  }

  /**
   * Get week key for grouping
   */
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, "0")}`;
  }

  /**
   * Get week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}

export const geofenceAnalyticsService = new GeofenceAnalyticsService();
