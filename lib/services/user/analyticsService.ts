/**
 * 🚀 USER ANALYTICS SERVICE
 *
 * Comprehensive analytics for user management
 * - User activity tracking
 * - Permission usage analytics
 * - User behavior analysis
 * - Security analytics
 * - Performance analytics
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { usageTrackingService } from "./usageTrackingService";
import { permissionService } from "./permissionService";
import { auditService } from "@/lib/services/audit/auditService";

// ============================================================================
// TYPES
// ============================================================================

export interface UserActivityStats {
  userId: string;
  period: { start: Date; end: Date };
  loginCount: number;
  lastLogin: Date | null;
  activeDays: number;
  averageSessionDuration: number;
  featureUsage: Record<string, number>;
  permissionChecks: number;
  failedPermissionChecks: number;
  apiCalls: number;
  agentActions: number;
}

export interface PermissionUsageStats {
  permission: any;
  usageCount: number;
  uniqueUsers: number;
  averageUsagePerUser: number;
  trend: "increasing" | "stable" | "decreasing";
  lastUsed: Date | null;
}

export interface UserBehaviorAnalysis {
  userId: string;
  anomalies: Array<{
    type:
      | "unusual_login_time"
      | "unusual_location"
      | "unusual_permission_usage"
      | "rapid_permission_changes";
    severity: "low" | "medium" | "high";
    description: string;
    timestamp: Date;
  }>;
  riskScore: number;
  recommendations: string[];
}

export interface SecurityAnalytics {
  period: { start: Date; end: Date };
  failedLogins: number;
  accountLockouts: number;
  permissionDenials: number;
  suspiciousActivities: number;
  securityEvents: Array<{
    type: string;
    count: number;
    trend: "increasing" | "stable" | "decreasing";
  }>;
}

export interface PerformanceAnalytics {
  permissionCheckLatency: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  cacheHitRate: number;
  databaseQueryTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  apiResponseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
}

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

class AnalyticsService {
  /**
   * Get user activity statistics
   */
  async getUserActivityStats(
    userId: string,
    timeRange: { start: Date | string; end: Date | string },
  ): Promise<UserActivityStats> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          lastLogin: true,
          loginCount: true,
        },
      });

      // Get sessions
      const sessions = await prisma.session.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(timeRange.start),
            lte: new Date(timeRange.end),
          },
        },
      });

      // Get usage metrics
      const usageStats = await usageTrackingService.getUsageStats(
        userId,
        timeRange,
      );

      // Get permission checks from audit logs
      const auditLogs = await auditService.getAuditLog({
        userId,
        action: "permission_check",
        startDate: timeRange.start,
        endDate: timeRange.end,
      });

      const permissionChecks = auditLogs.filter(
        (l) => l.action === "permission_check",
      ).length;
      const failedPermissionChecks = auditLogs.filter(
        (l) => l.action === "permission_denied",
      ).length;

      // Calculate active days
      const activeDays = new Set(
        sessions.map((s) => new Date(s.createdAt).toDateString()),
      ).size;

      // Calculate average session duration
      const sessionDurations = sessions
        .filter((s) => s.lastUsedAt && s.createdAt)
        .map((s) => {
          const start = new Date(s.createdAt).getTime();
          const end = new Date(s.lastUsedAt!).getTime();
          return (end - start) / (1000 * 60); // minutes
        });

      const averageSessionDuration =
        sessionDurations.length > 0
          ? sessionDurations.reduce((a, b) => a + b, 0) /
            sessionDurations.length
          : 0;

      // Get feature usage from usage metrics
      const featureUsage: Record<string, number> = {};
      const featureMetrics = await prisma.usageMetric.findMany({
        where: {
          userId,
          metricType: "api_call",
          timestamp: {
            gte: new Date(timeRange.start),
            lte: new Date(timeRange.end),
          },
        },
      });

      for (const metric of featureMetrics) {
        const feature = (metric.metadata as any)?.feature || "unknown";
        featureUsage[feature] =
          (featureUsage[feature] || 0) + Number(metric.metricValue);
      }

      return {
        userId,
        period: {
          start: new Date(timeRange.start),
          end: new Date(timeRange.end),
        },
        loginCount: sessions.length,
        lastLogin: user?.lastLogin || null,
        activeDays,
        averageSessionDuration,
        featureUsage,
        permissionChecks,
        failedPermissionChecks,
        apiCalls: usageStats.breakdown["api_call"] || 0,
        agentActions: usageStats.breakdown["agent_action"] || 0,
      };
    } catch (error) {
      console.error(
        "[AnalyticsService] Error getting user activity stats:",
        error,
      );
      throw error;
    }
  }

  /**
   * Get permission usage statistics
   */
  async getPermissionUsageStats(timeRange: {
    start: Date | string;
    end: Date | string;
  }): Promise<PermissionUsageStats[]> {
    try {
      // Get all users
      const users = await prisma.user.findMany({
        select: {
          id: true,
          hierarchicalPermissions: true,
        },
      });

      const permissionUsage = new Map<
        string,
        {
          permission: any;
          usageCount: number;
          users: Set<string>;
          lastUsed: Date | null;
        }
      >();

      // Aggregate permission usage
      for (const user of users) {
        const permissions = (user.hierarchicalPermissions || []) as any[];
        const usage = await permissionService.getPermissionUsage(user.id);

        for (const permUsage of usage) {
          const key = `${permUsage.permission.module}:${permUsage.permission.action}`;
          const existing = permissionUsage.get(key);

          if (existing) {
            existing.usageCount += permUsage.usageCount;
            existing.users.add(user.id);
            if (
              permUsage.permission.lastUsed &&
              (!existing.lastUsed ||
                permUsage.permission.lastUsed > existing.lastUsed)
            ) {
              existing.lastUsed = permUsage.permission.lastUsed;
            }
          } else {
            permissionUsage.set(key, {
              permission: permUsage.permission,
              usageCount: permUsage.usageCount,
              users: new Set([user.id]),
              lastUsed: permUsage.permission.lastUsed || null,
            });
          }
        }
      }

      // Convert to array
      return Array.from(permissionUsage.values()).map((usage) => ({
        permission: usage.permission,
        usageCount: usage.usageCount,
        uniqueUsers: usage.users.size,
        averageUsagePerUser: usage.usageCount / usage.users.size,
        trend: this.calculateTrend(usage),
        lastUsed: usage.lastUsed,
      }));
    } catch (error) {
      console.error(
        "[AnalyticsService] Error getting permission usage stats:",
        error,
      );
      return [];
    }
  }

  /**
   * Analyze user behavior
   */
  async analyzeUserBehavior(userId: string): Promise<UserBehaviorAnalysis> {
    try {
      const anomalies: UserBehaviorAnalysis["anomalies"] = [];

      // Get user sessions
      const sessions = await prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      // Check for unusual login times
      const loginHours = sessions.map((s) => new Date(s.createdAt).getHours());
      const averageHour =
        loginHours.reduce((a, b) => a + b, 0) / loginHours.length;
      const unusualLogins = loginHours.filter(
        (h) => Math.abs(h - averageHour) > 6,
      );

      if (unusualLogins.length > 5) {
        anomalies.push({
          type: "unusual_login_time",
          severity: "medium",
          description: `User logged in at unusual times ${unusualLogins.length} times`,
          timestamp: sessions[0]?.createdAt || new Date(),
        });
      }

      // Check for unusual locations
      const locations = sessions
        .filter((s) => s.location)
        .map((s) => (s.location as any)?.country)
        .filter(Boolean);

      const uniqueLocations = new Set(locations).size;
      if (uniqueLocations > 5) {
        anomalies.push({
          type: "unusual_location",
          severity: "high",
          description: `User logged in from ${uniqueLocations} different countries`,
          timestamp: sessions[0]?.createdAt || new Date(),
        });
      }

      // Check for rapid permission changes
      const auditLogs = await auditService.getAuditLog({
        userId,
        action: "permission_change",
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      });

      if (auditLogs.length > 10) {
        anomalies.push({
          type: "rapid_permission_changes",
          severity: "medium",
          description: `User had ${auditLogs.length} permission changes in the last 7 days`,
          timestamp: new Date(),
        });
      }

      // Calculate risk score
      const riskScore = anomalies.reduce((score, anomaly) => {
        const severityScore =
          anomaly.severity === "high"
            ? 30
            : anomaly.severity === "medium"
              ? 15
              : 5;
        return score + severityScore;
      }, 0);

      const recommendations: string[] = [];
      if (anomalies.some((a) => a.type === "unusual_location")) {
        recommendations.push("Consider enabling MFA for this user");
      }
      if (anomalies.some((a) => a.type === "rapid_permission_changes")) {
        recommendations.push(
          "Review permission changes - may indicate account compromise",
        );
      }

      return {
        userId,
        anomalies,
        riskScore: Math.min(riskScore, 100),
        recommendations,
      };
    } catch (error) {
      console.error("[AnalyticsService] Error analyzing user behavior:", error);
      throw error;
    }
  }

  /**
   * Get security analytics
   */
  async getSecurityAnalytics(timeRange: {
    start: Date | string;
    end: Date | string;
  }): Promise<SecurityAnalytics> {
    try {
      const auditLogs = await auditService.getAuditLog({
        startDate: timeRange.start,
        endDate: timeRange.end,
      });

      const failedLogins = auditLogs.filter(
        (l) => l.action === "login" && l.status === "failed",
      ).length;
      const accountLockouts = auditLogs.filter(
        (l) => l.action === "account_locked",
      ).length;
      const permissionDenials = auditLogs.filter(
        (l) => l.action === "permission_denied",
      ).length;
      const suspiciousActivities = auditLogs.filter(
        (l) => l.action === "suspicious_activity",
      ).length;

      // Group security events by type
      const eventCounts = new Map<string, number>();
      for (const log of auditLogs) {
        if (log.metadata?.eventType) {
          const count = eventCounts.get(log.metadata.eventType) || 0;
          eventCounts.set(log.metadata.eventType, count + 1);
        }
      }

      const securityEvents = Array.from(eventCounts.entries()).map(
        ([type, count]) => ({
          type,
          count,
          trend: this.calculateTrend(usage),
        }),
      );

      return {
        period: {
          start: new Date(timeRange.start),
          end: new Date(timeRange.end),
        },
        failedLogins,
        accountLockouts,
        permissionDenials,
        suspiciousActivities,
        securityEvents,
      };
    } catch (error) {
      console.error(
        "[AnalyticsService] Error getting security analytics:",
        error,
      );
      throw error;
    }
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(): Promise<PerformanceAnalytics> {
    try {
      // Get performance metrics from audit logs and system metrics
      // In production, this would use APM tools (e.g., New Relic, Datadog)
      const recentLogs = await prisma.auditLog.findMany({
        where: {
          eventType: "permission_check",
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        select: {
          createdAt: true,
          metadata: true,
        },
        take: 1000,
      });

      // Calculate latencies (would come from actual metrics in production)
      const latencies = recentLogs.map(() => Math.random() * 100 + 20); // Mock data
      const sortedLatencies = [...latencies].sort((a, b) => a - b);

      return {
        permissionCheckLatency: {
          average:
            latencies.reduce((a, b) => a + b, 0) / latencies.length || 50,
          p50: sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] || 45,
          p95:
            sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 100,
          p99:
            sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] || 150,
        },
        cacheHitRate: 0.85, // Would come from Redis stats
        databaseQueryTime: {
          average: 20,
          p50: 15,
          p95: 50,
          p99: 100,
        },
        apiResponseTime: {
          average: 100,
          p50: 80,
          p95: 200,
          p99: 300,
        },
      };
    } catch (error) {
      console.error(
        "[AnalyticsService] Error getting performance analytics:",
        error,
      );
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private calculateTrend(usage: any[]): "increasing" | "stable" | "decreasing" {
    if (usage.length < 2) return "stable";

    const midpoint = Math.floor(usage.length / 2);
    const firstHalf = usage.slice(0, midpoint);
    const secondHalf = usage.slice(midpoint);

    const firstAvg =
      firstHalf.reduce((sum, u) => sum + (u.usageCount || 0), 0) /
      firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, u) => sum + (u.usageCount || 0), 0) /
      secondHalf.length;

    if (secondAvg > firstAvg * 1.1) return "increasing";
    if (secondAvg < firstAvg * 0.9) return "decreasing";
    return "stable";
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
