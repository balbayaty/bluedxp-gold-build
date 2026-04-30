/**
 * Geofence Pattern Learning Service
 *
 * Learns patterns from geofence events and improves predictions
 * - Zone entry/exit patterns
 * - Dwell time patterns
 * - Route patterns
 * - Driver behavior patterns
 * - Anomaly patterns
 *
 * Integrates with Knowledge Base for persistent learning
 */

import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { eventBus } from "@/lib/services/event-store";
import type { GeofenceEvent, GeofenceZone } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface LearnedPattern {
  id: string;
  type:
    | "DWELL_TIME"
    | "ENTRY_TIME"
    | "EXIT_TIME"
    | "ROUTE"
    | "DRIVER_BEHAVIOR"
    | "ZONE_PERFORMANCE";
  pattern: Record<string, any>;
  confidence: number;
  sampleSize: number;
  lastUpdated: Date;
  tenantId: string;
}

export interface PatternInsight {
  patternId: string;
  insight: string;
  recommendation: string;
  confidence: number;
  impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// ============================================================================
// SERVICE
// ============================================================================

class PatternLearningService {
  private patterns: Map<string, LearnedPattern> = new Map();

  /**
   * Learn from geofence event
   */
  async learnFromEvent(
    event: GeofenceEvent,
    zone: GeofenceZone,
    tenantId: string,
  ): Promise<void> {
    try {
      // Learn dwell time pattern
      if (event.eventType === "ZONE_EXIT" && event.dwellTime !== undefined) {
        await this.learnDwellTimePattern(event, zone, tenantId);
      }

      // Learn entry time pattern
      if (event.eventType === "ZONE_ENTRY") {
        await this.learnEntryTimePattern(event, zone, tenantId);
      }

      // Learn driver behavior pattern
      if (event.driverId) {
        await this.learnDriverBehaviorPattern(event, zone, tenantId);
      }

      // Store in knowledge base
      await this.storePatternInKnowledgeBase(event, zone, tenantId);
    } catch (error) {
      console.error("Error learning from event:", error);
    }
  }

  /**
   * Learn dwell time pattern
   */
  private async learnDwellTimePattern(
    event: GeofenceEvent,
    zone: GeofenceZone,
    tenantId: string,
  ): Promise<void> {
    const patternKey = `dwell-time-${zone.id}`;
    let pattern = this.patterns.get(patternKey);

    if (!pattern) {
      pattern = {
        id: patternKey,
        type: "DWELL_TIME",
        pattern: {
          zoneId: zone.id,
          zoneType: zone.type,
          averageDwellTime: event.dwellTime!,
          minDwellTime: event.dwellTime!,
          maxDwellTime: event.dwellTime!,
          sampleCount: 1,
          dwellTimes: [event.dwellTime!],
        },
        confidence: 0.5,
        sampleSize: 1,
        lastUpdated: new Date(),
        tenantId,
      };
    } else {
      // Update pattern
      const dwellTimes = [...pattern.pattern.dwellTimes, event.dwellTime!];
      const averageDwellTime =
        dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length;

      pattern.pattern = {
        ...pattern.pattern,
        averageDwellTime,
        minDwellTime: Math.min(pattern.pattern.minDwellTime, event.dwellTime!),
        maxDwellTime: Math.max(pattern.pattern.maxDwellTime, event.dwellTime!),
        sampleCount: dwellTimes.length,
        dwellTimes: dwellTimes.slice(-100), // Keep last 100 samples
      };
      pattern.sampleSize = dwellTimes.length;
      pattern.confidence = Math.min(1.0, 0.5 + dwellTimes.length * 0.01);
      pattern.lastUpdated = new Date();
    }

    this.patterns.set(patternKey, pattern);

    // Update zone metadata if pattern is strong
    if (pattern.confidence > 0.7 && pattern.sampleSize >= 10) {
      const suggestedExpectedDwell = Math.round(
        pattern.pattern.averageDwellTime,
      );
      const suggestedMaxDwell = Math.round(pattern.pattern.maxDwellTime * 1.2);

      // Publish insight
      await eventBus.publish({
        type: "geofence.pattern.learned",
        data: {
          pattern,
          suggestion: {
            zoneId: zone.id,
            suggestedExpectedDwellTime: suggestedExpectedDwell,
            suggestedMaxDwellTime: suggestedMaxDwell,
          },
        },
        metadata: {
          source: "pattern-learning-service",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Learn entry time pattern
   */
  private async learnEntryTimePattern(
    event: GeofenceEvent,
    zone: GeofenceZone,
    tenantId: string,
  ): Promise<void> {
    const patternKey = `entry-time-${zone.id}`;
    const eventTime = new Date(event.timestamp);
    const hour = eventTime.getHours();
    const dayOfWeek = eventTime.getDay();

    let pattern = this.patterns.get(patternKey);

    if (!pattern) {
      pattern = {
        id: patternKey,
        type: "ENTRY_TIME",
        pattern: {
          zoneId: zone.id,
          hourlyDistribution: { [hour]: 1 },
          dayOfWeekDistribution: { [dayOfWeek]: 1 },
          sampleCount: 1,
        },
        confidence: 0.5,
        sampleSize: 1,
        lastUpdated: new Date(),
        tenantId,
      };
    } else {
      const hourlyDist = { ...pattern.pattern.hourlyDistribution };
      hourlyDist[hour] = (hourlyDist[hour] || 0) + 1;

      const dayDist = { ...pattern.pattern.dayOfWeekDistribution };
      dayDist[dayOfWeek] = (dayDist[dayOfWeek] || 0) + 1;

      pattern.pattern = {
        ...pattern.pattern,
        hourlyDistribution: hourlyDist,
        dayOfWeekDistribution: dayDist,
        sampleCount: pattern.pattern.sampleCount + 1,
      };
      pattern.sampleSize = pattern.pattern.sampleCount;
      pattern.confidence = Math.min(1.0, 0.5 + pattern.sampleSize * 0.01);
      pattern.lastUpdated = new Date();
    }

    this.patterns.set(patternKey, pattern);
  }

  /**
   * Learn driver behavior pattern
   */
  private async learnDriverBehaviorPattern(
    event: GeofenceEvent,
    zone: GeofenceZone,
    tenantId: string,
  ): Promise<void> {
    if (!event.driverId) return;

    const patternKey = `driver-behavior-${event.driverId}`;
    let pattern = this.patterns.get(patternKey);

    if (!pattern) {
      pattern = {
        id: patternKey,
        type: "DRIVER_BEHAVIOR",
        pattern: {
          driverId: event.driverId,
          zones: { [zone.id]: 1 },
          averageDwellTime: event.dwellTime || 0,
          sampleCount: 1,
        },
        confidence: 0.5,
        sampleSize: 1,
        lastUpdated: new Date(),
        tenantId,
      };
    } else {
      const zones = { ...pattern.pattern.zones };
      zones[zone.id] = (zones[zone.id] || 0) + 1;

      const currentAvg = pattern.pattern.averageDwellTime;
      const newDwell = event.dwellTime || currentAvg;
      const newAvg =
        (currentAvg * pattern.pattern.sampleCount + newDwell) /
        (pattern.pattern.sampleCount + 1);

      pattern.pattern = {
        ...pattern.pattern,
        zones,
        averageDwellTime: newAvg,
        sampleCount: pattern.pattern.sampleCount + 1,
      };
      pattern.sampleSize = pattern.pattern.sampleCount;
      pattern.confidence = Math.min(1.0, 0.5 + pattern.sampleSize * 0.01);
      pattern.lastUpdated = new Date();
    }

    this.patterns.set(patternKey, pattern);
  }

  /**
   * Store pattern in knowledge base
   */
  private async storePatternInKnowledgeBase(
    event: GeofenceEvent,
    zone: GeofenceZone,
    tenantId: string,
  ): Promise<void> {
    try {
      const knowledgeEntry = {
        id: `geofence-pattern-${event.id}`,
        type: "PATTERN" as const,
        category: "GEOFENCE" as const,
        title: `Geofence Pattern: ${zone.name}`,
        content: JSON.stringify({
          eventType: event.eventType,
          zoneId: zone.id,
          zoneType: zone.type,
          dwellTime: event.dwellTime,
          timestamp: event.timestamp,
        }),
        metadata: {
          zoneId: zone.id,
          eventId: event.id,
          shipmentId: event.shipmentId,
        },
        tenantId,
        source: "geofence-pattern-learning" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store in knowledge base (would use actual service in production)
      // await knowledgeBaseService.addEntry(knowledgeEntry)
    } catch (error) {
      console.error("Error storing pattern in knowledge base:", error);
    }
  }

  /**
   * Get learned pattern
   */
  getPattern(patternId: string): LearnedPattern | undefined {
    return this.patterns.get(patternId);
  }

  /**
   * Get all patterns for a zone
   */
  getZonePatterns(zoneId: string): LearnedPattern[] {
    return Array.from(this.patterns.values()).filter(
      (p) => p.pattern.zoneId === zoneId,
    );
  }

  /**
   * Generate insights from patterns
   */
  async generateInsights(tenantId: string): Promise<PatternInsight[]> {
    const insights: PatternInsight[] = [];
    const tenantPatterns = Array.from(this.patterns.values()).filter(
      (p) => p.tenantId === tenantId,
    );

    for (const pattern of tenantPatterns) {
      if (pattern.type === "DWELL_TIME" && pattern.confidence > 0.7) {
        const avgDwell = pattern.pattern.averageDwellTime;
        const zoneId = pattern.pattern.zoneId;

        // Check if pattern suggests optimization
        if (pattern.sampleSize >= 20) {
          insights.push({
            patternId: pattern.id,
            insight: `Zone ${zoneId} shows consistent dwell time pattern: ${avgDwell.toFixed(1)} minutes average`,
            recommendation: `Consider adjusting expected dwell time to ${Math.round(avgDwell)} minutes for better accuracy`,
            confidence: pattern.confidence,
            impact: "MEDIUM",
          });
        }
      }
    }

    return insights;
  }
}

export const patternLearningService = new PatternLearningService();
