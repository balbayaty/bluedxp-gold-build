/**
 * Emotional Intelligence Monitoring & Logging
 *
 * Comprehensive monitoring and logging for emotional intelligence service
 *
 * @module emotional-intelligence
 */

interface MonitoringEvent {
  type:
    | "sentiment_analysis"
    | "prediction"
    | "relationship_health"
    | "insight"
    | "intervention";
  tenantId: string;
  entityId?: string;
  entityType?: string;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

class EmotionalIntelligenceMonitoring {
  private events: MonitoringEvent[] = [];
  private readonly MAX_EVENTS = 1000;

  /**
   * Log an event
   */
  logEvent(event: Omit<MonitoringEvent, "timestamp">): void {
    const fullEvent: MonitoringEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.events.push(fullEvent);

    // Keep only last N events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("[EI Monitoring]", fullEvent);
    }
  }

  /**
   * Get statistics
   */
  getStatistics(
    tenantId?: string,
    timeRange?: { start: Date; end: Date },
  ): {
    totalEvents: number;
    successRate: number;
    averageDuration: number;
    eventsByType: Record<string, number>;
    errors: number;
  } {
    let filtered = this.events;

    if (tenantId) {
      filtered = filtered.filter((e) => e.tenantId === tenantId);
    }

    if (timeRange) {
      filtered = filtered.filter(
        (e) => e.timestamp >= timeRange.start && e.timestamp <= timeRange.end,
      );
    }

    const totalEvents = filtered.length;
    const successful = filtered.filter((e) => e.success).length;
    const errors = filtered.filter((e) => !e.success).length;
    const totalDuration = filtered.reduce((sum, e) => sum + e.duration, 0);

    const eventsByType: Record<string, number> = {};
    filtered.forEach((e) => {
      eventsByType[e.type] = (eventsByType[e.type] || 0) + 1;
    });

    return {
      totalEvents,
      successRate: totalEvents > 0 ? successful / totalEvents : 0,
      averageDuration: totalEvents > 0 ? totalDuration / totalEvents : 0,
      eventsByType,
      errors,
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): MonitoringEvent[] {
    return this.events
      .filter((e) => !e.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const emotionalIntelligenceMonitoring =
  new EmotionalIntelligenceMonitoring();
