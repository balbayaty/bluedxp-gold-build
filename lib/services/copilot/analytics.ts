/**
 * Copilot Analytics Service
 * Tracks usage, performance, and insights
 */

import { eventBus } from "../event-store";
import { createEvent } from "../event-store/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface CopilotAnalytics {
  tenantId: string;
  userId?: string;

  // Usage Metrics
  totalMessages: number;
  totalConversations: number;
  averageMessagesPerConversation: number;
  averageResponseTime: number;

  // Feature Usage
  ragUsageCount: number;
  memoryUsageCount: number;
  toolUsageCount: number;
  streamingUsageCount: number;

  // Quality Metrics
  averageConfidence: number;
  knowledgeRetrievalRate: number;
  memoryHitRate: number;

  // Time-based
  firstUsedAt?: Date | string;
  lastUsedAt?: Date | string;
  dailyUsage: Record<string, number>; // date -> count

  // Errors
  errorCount: number;
  errorRate: number;
}

// ============================================================================
// SERVICE
// ============================================================================

class CopilotAnalyticsService {
  private analytics: Map<string, CopilotAnalytics> = new Map();

  /**
   * Track a message
   */
  trackMessage(
    tenantId: string,
    userId: string,
    metrics: {
      usedRAG: boolean;
      usedMemory: boolean;
      usedTools: boolean;
      usedStreaming: boolean;
      confidence: number;
      responseTime: number;
      knowledgeRetrieved: number;
      memoriesRetrieved: number;
      error?: boolean;
    },
  ): void {
    const key = `${tenantId}:${userId || "anonymous"}`;
    let analytics = this.analytics.get(key);

    if (!analytics) {
      analytics = {
        tenantId,
        userId,
        totalMessages: 0,
        totalConversations: 0,
        averageMessagesPerConversation: 0,
        averageResponseTime: 0,
        ragUsageCount: 0,
        memoryUsageCount: 0,
        toolUsageCount: 0,
        streamingUsageCount: 0,
        averageConfidence: 0,
        knowledgeRetrievalRate: 0,
        memoryHitRate: 0,
        dailyUsage: {},
        errorCount: 0,
        errorRate: 0,
        firstUsedAt: new Date(),
      };
    }

    // Update metrics
    analytics.totalMessages++;
    analytics.lastUsedAt = new Date();

    if (metrics.usedRAG) analytics.ragUsageCount++;
    if (metrics.usedMemory) analytics.memoryUsageCount++;
    if (metrics.usedTools) analytics.toolUsageCount++;
    if (metrics.usedStreaming) analytics.streamingUsageCount++;
    if (metrics.error) analytics.errorCount++;

    // Update averages
    analytics.averageConfidence =
      (analytics.averageConfidence * (analytics.totalMessages - 1) +
        metrics.confidence) /
      analytics.totalMessages;

    analytics.averageResponseTime =
      (analytics.averageResponseTime * (analytics.totalMessages - 1) +
        metrics.responseTime) /
      analytics.totalMessages;

    // Update rates
    if (metrics.usedRAG) {
      analytics.knowledgeRetrievalRate =
        analytics.ragUsageCount / analytics.totalMessages;
    }
    if (metrics.usedMemory) {
      analytics.memoryHitRate =
        analytics.memoryUsageCount / analytics.totalMessages;
    }

    // Update error rate
    analytics.errorRate = analytics.errorCount / analytics.totalMessages;

    // Update daily usage
    const today = new Date().toISOString().split("T")[0];
    analytics.dailyUsage[today] = (analytics.dailyUsage[today] || 0) + 1;

    this.analytics.set(key, analytics);

    // Publish event
    eventBus
      .publish(
        createEvent(
          "copilot.analytics.updated",
          tenantId,
          "Tenant",
          {
            totalMessages: analytics.totalMessages,
            averageConfidence: analytics.averageConfidence,
            errorRate: analytics.errorRate,
          },
          1,
          { tenantId, userId },
        ),
      )
      .catch((err) =>
        console.warn("[Analytics] Failed to publish event:", err),
      );
  }

  /**
   * Get analytics for a tenant/user
   */
  getAnalytics(tenantId: string, userId?: string): CopilotAnalytics | null {
    const key = `${tenantId}:${userId || "anonymous"}`;
    return this.analytics.get(key) || null;
  }

  /**
   * Get all analytics for a tenant
   */
  getTenantAnalytics(tenantId: string): CopilotAnalytics[] {
    return Array.from(this.analytics.values()).filter(
      (a) => a.tenantId === tenantId,
    );
  }
}

export const copilotAnalytics = new CopilotAnalyticsService();
