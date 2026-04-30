/**
 * Historical Intelligence Service
 *
 * Uses historical ETW data to predict risk, congestion, and ETA
 */

import { prisma } from "@/lib/services/database/prismaClient";
import type {
  BaseIntelligenceService,
  IntelligenceData,
} from "./baseIntelligenceService";
import type { ETW, RiskSnapshot, MilestoneEstimate } from "@/types/etw";

export class HistoricalIntelligenceService implements BaseIntelligenceService {
  getName(): string {
    return "historical";
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async getIntelligence(etw: ETW): Promise<IntelligenceData> {
    // Get historical ETWs for similar routes
    const historicalETWs = await prisma.eTW.findMany({
      where: {
        tenantId: etw.tenantId,
        scope: etw.scope,
        mode: etw.mode,
        status: {
          in: ["DELIVERED", "COMPLETED"],
        },
        route: {
          path: ["origin", "address", "city"],
          equals: etw.route.origin.address?.city,
        },
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    });

    if (historicalETWs.length === 0) {
      return {
        confidence: 0.3,
        source: this.getName(),
        timestamp: new Date(),
      };
    }

    // Calculate average delays
    const delays: number[] = [];
    const portDelays: number[] = [];
    const borderDelays: number[] = [];
    const gateDelays: number[] = [];

    for (const historical of historicalETWs) {
      const events = await prisma.eTWEvent.findMany({
        where: { etwId: historical.id },
        orderBy: { timestamp: "asc" },
      });

      if (events.length >= 2) {
        const firstEvent = events[0];
        const lastEvent = events[events.length - 1];
        const totalHours =
          (new Date(lastEvent.timestamp).getTime() -
            new Date(firstEvent.timestamp).getTime()) /
          (1000 * 60 * 60);
        delays.push(totalHours);

        // Extract port/border/gate delays from events
        const portEvent = events.find((e) => e.type === "AT_PORT");
        const borderEvent = events.find((e) => e.type === "BORDER_CROSSING");
        const gateEvent = events.find((e) => e.type === "AT_FACILITY");

        if (portEvent && events.indexOf(portEvent) > 0) {
          const prevEvent = events[events.indexOf(portEvent) - 1];
          const delay =
            (new Date(portEvent.timestamp).getTime() -
              new Date(prevEvent.timestamp).getTime()) /
            (1000 * 60 * 60);
          portDelays.push(delay);
        }

        if (borderEvent && events.indexOf(borderEvent) > 0) {
          const prevEvent = events[events.indexOf(borderEvent) - 1];
          const delay =
            (new Date(borderEvent.timestamp).getTime() -
              new Date(prevEvent.timestamp).getTime()) /
            (1000 * 60 * 60);
          borderDelays.push(delay);
        }

        if (gateEvent && events.indexOf(gateEvent) > 0) {
          const prevEvent = events[events.indexOf(gateEvent) - 1];
          const delay =
            (new Date(gateEvent.timestamp).getTime() -
              new Date(prevEvent.timestamp).getTime()) /
            (1000 * 60 * 60);
          gateDelays.push(delay);
        }
      }
    }

    // Calculate averages
    const avgDelay =
      delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;
    const avgPortDelay =
      portDelays.length > 0
        ? portDelays.reduce((a, b) => a + b, 0) / portDelays.length
        : 0;
    const avgBorderDelay =
      borderDelays.length > 0
        ? borderDelays.reduce((a, b) => a + b, 0) / borderDelays.length
        : 0;
    const avgGateDelay =
      gateDelays.length > 0
        ? gateDelays.reduce((a, b) => a + b, 0) / gateDelays.length
        : 0;

    // Calculate confidence based on sample size
    const confidence = Math.min(0.9, 0.3 + (historicalETWs.length / 100) * 0.6);

    // Build risk snapshot
    const riskSnapshot: RiskSnapshot = {
      id: `risk-${Date.now()}`,
      timestamp: new Date(),
      delayRange: {
        min: avgDelay * 0.8,
        max: avgDelay * 1.2,
        expected: avgDelay,
        confidence,
      },
      commonCauses: this.getCommonCauses(historicalETWs),
    };

    // Build milestone estimate
    const milestones: MilestoneEstimate = {
      portHandling:
        portDelays.length > 0
          ? {
              avg: avgPortDelay,
              min: avgPortDelay * 0.7,
              max: avgPortDelay * 1.3,
              confidence: Math.min(0.9, 0.5 + (portDelays.length / 50) * 0.4),
            }
          : undefined,
      borderAvg:
        borderDelays.length > 0
          ? {
              avg: avgBorderDelay,
              min: avgBorderDelay * 0.7,
              max: avgBorderDelay * 1.3,
              confidence: Math.min(0.9, 0.5 + (borderDelays.length / 50) * 0.4),
            }
          : undefined,
      industrialGateAvg:
        gateDelays.length > 0
          ? {
              avg: avgGateDelay,
              min: avgGateDelay * 0.7,
              max: avgGateDelay * 1.3,
              confidence: Math.min(0.9, 0.5 + (gateDelays.length / 50) * 0.4),
            }
          : undefined,
      endToEndEstimate: {
        avg: avgDelay,
        min: avgDelay * 0.8,
        max: avgDelay * 1.2,
        confidence,
        estimatedCompletion: new Date(Date.now() + avgDelay * 60 * 60 * 1000),
      },
    };

    return {
      riskSnapshot,
      milestones,
      confidence,
      source: this.getName(),
      timestamp: new Date(),
    };
  }

  private getCommonCauses(historicalETWs: any[]): string[] {
    // Analyze common exception types from historical data
    const causes: string[] = [];

    // This would analyze exception patterns from historical ETWs
    // For now, return common causes
    if (historicalETWs.length > 10) {
      causes.push("Port congestion during peak hours");
      causes.push("Customs clearance delays");
      causes.push("Border crossing queue");
    }

    return causes;
  }
}
