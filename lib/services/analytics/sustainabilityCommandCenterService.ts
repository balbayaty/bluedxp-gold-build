/**
 * Sustainability Command Center Service
 *
 * Sustainability metrics dashboard and analysis
 * Journey breakdown by phase, touchpoint optimization potential
 *
 * Migrated from: sustainability-dashboard/src/components/commandCenter/CommandCenter.tsx
 * Integrated with: Transportation Module, Sustainability Module, Analytics Module
 */

import { eventBus } from "@/lib/services/event-store";
import type {
  TouchpointAnalysis,
  JourneyByPhase,
  TouchpointOptimization,
  SustainabilityMetrics,
  JourneySummary,
} from "@/types/analytics";

export class SustainabilityCommandCenterService {
  /**
   * Get journey breakdown by phase
   */
  getJourneyByPhase(touchpoints: TouchpointAnalysis[]): JourneyByPhase[] {
    const phases: Record<string, number> = {
      Origin: 0,
      Transport: 0,
      Customs: 0,
      Destination: 0,
    };

    touchpoints.forEach((tp) => {
      phases[tp.phase] = (phases[tp.phase] || 0) + tp.percentOfJourney;
    });

    const colorMap: Record<string, string> = {
      Origin: "#4364D8",
      Transport: "#43A6DD",
      Customs: "#FFB11F",
      Destination: "#FF6B45",
    };

    return Object.entries(phases).map(([name, value]) => ({
      name: name as JourneyByPhase["name"],
      value,
      color: colorMap[name],
    }));
  }

  /**
   * Get touchpoint optimization potential
   */
  getTouchpointOptimization(
    touchpoints: TouchpointAnalysis[],
  ): TouchpointOptimization[] {
    return touchpoints
      .filter((tp) => tp.percentOfJourney > 2) // Only significant touchpoints
      .map((tp) => ({
        name: tp.name,
        hours: tp.hours,
        potentialSaving: tp.potentialSaving,
        phase: tp.phase,
      }))
      .sort((a, b) => b.potentialSaving - a.potentialSaving);
  }

  /**
   * Get sustainability metrics comparison
   */
  getSustainabilityComparison(metrics: SustainabilityMetrics[]): Array<{
    name: string;
    current: number;
    optimized: number;
    unit: string;
  }> {
    return metrics.map((metric) => ({
      name: metric.metric,
      current: metric.current,
      optimized: metric.optimized,
      unit: metric.unit,
    }));
  }

  /**
   * Calculate key metrics summary
   */
  getKeyMetrics(
    journeySummary: JourneySummary,
    sustainabilityMetrics: SustainabilityMetrics[],
  ): {
    totalJourneyTime: {
      value: string;
      changeValue: number;
      changeText: string;
    };
    co2Emissions: {
      value: string;
      unit: string;
      changeValue: number;
      changeText: string;
    };
    idleEmissions: {
      value: string;
      unit: string;
      changeValue: number;
      changeText: string;
    };
    costPerTrip: {
      value: string;
      unit: string;
      changeValue: number;
      changeText: string;
    };
  } {
    const formatHours = (hours: number): string => {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      if (days > 0) {
        return `${days}d ${remainingHours}h`;
      }
      return `${remainingHours}h`;
    };

    const co2Metric = sustainabilityMetrics.find((m) =>
      m.metric.toLowerCase().includes("co2"),
    );
    const idleMetric = sustainabilityMetrics.find((m) =>
      m.metric.toLowerCase().includes("idle"),
    );
    const costMetric = sustainabilityMetrics.find((m) =>
      m.metric.toLowerCase().includes("cost"),
    );

    return {
      totalJourneyTime: {
        value: formatHours(journeySummary.totalHours),
        changeValue: -journeySummary.potentialSavingPercentage,
        changeText: `-${journeySummary.potentialSavingPercentage.toFixed(1)}% potential`,
      },
      co2Emissions: {
        value: co2Metric?.current.toString() || "0",
        unit: co2Metric?.unit || "kg",
        changeValue: -(co2Metric?.potentialReduction || 0),
        changeText: `-${co2Metric?.potentialReduction || 0}% potential`,
      },
      idleEmissions: {
        value: idleMetric?.current.toString() || "0",
        unit: idleMetric?.unit || "kg",
        changeValue: -(idleMetric?.potentialReduction || 0),
        changeText: `-${idleMetric?.potentialReduction || 0}% potential`,
      },
      costPerTrip: {
        value: costMetric?.current.toString() || "0",
        unit: costMetric?.unit || "USD",
        changeValue: -(costMetric?.potentialReduction || 0),
        changeText: `-${costMetric?.potentialReduction || 0}% potential`,
      },
    };
  }

  /**
   * Publish command center metrics event
   */
  async publishMetricsEvent(
    journeySummary: JourneySummary,
    sustainabilityMetrics: SustainabilityMetrics[],
  ): Promise<void> {
    await eventBus.publish("analytics.sustainability.metrics", {
      journeySummary,
      sustainabilityMetrics,
      timestamp: new Date(),
    });
  }
}

export const sustainabilityCommandCenterService =
  new SustainabilityCommandCenterService();
