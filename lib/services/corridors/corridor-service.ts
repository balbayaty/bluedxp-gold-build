/**
 * Corridor Intelligence Service
 *
 * Main service for corridor intelligence
 * Touchpoint tracking, delay analysis, optimization
 *
 * @module corridors
 */

import { eventStore, eventBus, createEvent } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import {
  SAUDI_KUWAIT_CORRIDOR,
  analyzeSaudiKuwaitCorridor,
  getOptimizationRecommendations,
} from "./saudi-kuwait-corridor";
import {
  SAUDI_SYRIA_CORRIDOR,
  analyzeSaudiSyriaCorridor,
} from "./saudi-syria-corridor";
import type {
  Corridor,
  Touchpoint,
  DelayPattern,
  CorridorAnalysis,
  OptimizationRecommendation,
} from "./types";

// ============================================================================
// CORRIDOR SERVICE
// ============================================================================

export class CorridorIntelligenceService {
  /**
   * Get corridor by ID
   */
  getCorridor(corridorId: string): Corridor | null {
    if (corridorId === "saudi-kuwait") {
      return SAUDI_KUWAIT_CORRIDOR;
    }
    if (corridorId === "saudi-syria") {
      return SAUDI_SYRIA_CORRIDOR;
    }
    return null;
  }

  /**
   * Track touchpoint
   */
  async trackTouchpoint(
    shipmentId: string,
    touchpointId: string,
    event: "ENTRY" | "EXIT",
    timestamp: Date,
    tenantId: string,
  ): Promise<void> {
    // Record touchpoint event
    await eventBus.publish(
      createEvent(
        `CorridorTouchpoint${event}`,
        shipmentId,
        "Shipment",
        {
          shipmentId,
          touchpointId,
          event,
          timestamp: timestamp.toISOString(),
        },
        1,
        {
          tenantId,
          correlationId: `touchpoint-${Date.now()}`,
          userId: "corridor-service",
        },
      ),
    );

    // Calculate dwell time if exit
    if (event === "EXIT") {
      // Get entry event
      const events = await eventStore.getEvents(shipmentId);
      const entryEvent = events.find(
        (e) =>
          e.type === "CorridorTouchpointENTRY" &&
          e.payload?.touchpointId === touchpointId,
      );

      if (entryEvent) {
        const entryTime = new Date(entryEvent.timestamp);
        const dwellTime =
          (timestamp.getTime() - entryTime.getTime()) / (1000 * 60);

        // Check if exceeded max dwell time
        const corridor =
          this.getCorridor("saudi-kuwait") || this.getCorridor("saudi-syria");
        const touchpoint = corridor?.touchpoints.find(
          (tp) => tp.id === touchpointId,
        );

        if (touchpoint && dwellTime > touchpoint.maxDwellTime) {
          // Alert
          await eventBus.publish(
            createEvent(
              "CorridorDwellTimeExceeded",
              shipmentId,
              "Shipment",
              {
                shipmentId,
                touchpointId,
                dwellTime,
                maxDwellTime: touchpoint.maxDwellTime,
              },
              1,
              {
                tenantId,
                correlationId: `dwell-alert-${Date.now()}`,
                userId: "corridor-service",
              },
            ),
          );
        }
      }
    }
  }

  /**
   * Analyze corridor
   */
  async analyzeCorridor(
    corridorId: string,
    period: { from: Date; to: Date },
    tenantId: string,
  ): Promise<CorridorAnalysis> {
    if (corridorId === "saudi-kuwait") {
      return await analyzeSaudiKuwaitCorridor(period, tenantId);
    }
    if (corridorId === "saudi-syria") {
      return await analyzeSaudiSyriaCorridor(period, tenantId);
    }

    throw new Error(`Corridor ${corridorId} not found`);
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(
    corridorId: string,
    analysis: CorridorAnalysis,
  ): Promise<OptimizationRecommendation[]> {
    if (corridorId === "saudi-kuwait") {
      return await getOptimizationRecommendations(corridorId, analysis);
    }

    // Generate recommendations for other corridors
    const recommendations: OptimizationRecommendation[] = [];

    for (const opp of analysis.optimizationOpportunities) {
      recommendations.push({
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: opp.action.includes("Pre-clearance")
          ? "PRE_CLEARANCE"
          : opp.action.includes("Trusted")
            ? "TRUSTED_TRADER"
            : opp.action.includes("Route")
              ? "ROUTE_OPTIMIZATION"
              : "TIMING_OPTIMIZATION",
        description: opp.action,
        expectedSavings: opp.savings,
        cost: opp.cost,
        priority: opp.priority,
        implementation: [
          "Review current process",
          "Identify implementation requirements",
          "Calculate ROI",
          "Plan implementation timeline",
        ],
      });
    }

    return recommendations;
  }

  /**
   * Detect delay patterns
   */
  async detectDelayPatterns(
    corridorId: string,
    period: { from: Date; to: Date },
    tenantId: string,
  ): Promise<DelayPattern[]> {
    const analysis = await this.analyzeCorridor(corridorId, period, tenantId);
    return analysis.delayPatterns;
  }

  /**
   * Identify bottlenecks
   */
  async identifyBottlenecks(
    corridorId: string,
    period: { from: Date; to: Date },
    tenantId: string,
  ): Promise<CorridorAnalysis["bottlenecks"]> {
    const analysis = await this.analyzeCorridor(corridorId, period, tenantId);
    return analysis.bottlenecks;
  }
}

// Export singleton
export const corridorIntelligenceService = new CorridorIntelligenceService();
