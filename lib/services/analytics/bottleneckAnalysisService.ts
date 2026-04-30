/**
 * Bottleneck Analysis Service
 *
 * Identifies and analyzes bottlenecks in journey/process flows
 * Vulnerability scoring, arrival timing impact, resilience analysis
 *
 * Migrated from: sustainability-dashboard/src/components/bottleneckAnalysis/BottleneckAnalysis.tsx
 * Integrated with: Transportation Module, Analytics Module
 */

import { eventBus } from "@/lib/services/event-store";
import type {
  TouchpointAnalysis,
  BottleneckAnalysis,
  VulnerabilityScore,
  ShipmentOffloading,
  OperatingHours,
} from "@/types/analytics";

export class BottleneckAnalysisService {
  /**
   * Analyze bottlenecks from touchpoint data
   */
  async analyzeBottlenecks(
    touchpoints: TouchpointAnalysis[],
    shipments?: Array<{
      waybill: string;
      arrivalTime: string;
      totalOffloading: number;
      outsideHoursWaiting: number;
      actualOffloading: number;
    }>,
    operatingHours?: OperatingHours[],
  ): Promise<BottleneckAnalysis> {
    // Identify primary bottlenecks (top 3)
    const primaryBottlenecks = touchpoints
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 3)
      .map((tp) => ({
        ...tp,
        impactPercentage: tp.percentOfJourney,
      }));

    // Calculate vulnerability scores
    const vulnerabilityScores = this.calculateVulnerabilityScores(
      touchpoints,
      operatingHours,
    );

    // Analyze arrival timing impact
    const arrivalTimingImpact = shipments
      ? this.analyzeArrivalTimingImpact(shipments)
      : [];

    // Publish analysis event
    await eventBus.publish("analytics.bottleneck.analyzed", {
      bottlenecks: primaryBottlenecks.length,
      vulnerabilityScores: vulnerabilityScores.length,
      timestamp: new Date(),
    });

    return {
      primaryBottlenecks,
      vulnerabilityScores,
      arrivalTimingImpact,
      operatingHoursConstraints: operatingHours || [],
    };
  }

  /**
   * Calculate vulnerability scores for touchpoints
   */
  private calculateVulnerabilityScores(
    touchpoints: TouchpointAnalysis[],
    operatingHours?: OperatingHours[],
  ): VulnerabilityScore[] {
    return touchpoints.map((tp) => {
      // Higher score means more vulnerable
      const vulnerabilityFactors = {
        timeImpact: (tp.percentOfJourney / 100) * 10, // 0-10 points based on % of journey
        variability: Math.min(
          10,
          ((tp.hours - tp.bestObserved) / tp.hours) * 20,
        ), // 0-10 points based on variability
        operatingHoursConstraint: this.hasOperatingHoursConstraint(
          tp.name,
          operatingHours,
        )
          ? 5
          : 0,
        singlePointOfFailure: this.isSinglePointOfFailure(tp.name) ? 10 : 0,
      };

      const totalVulnerability = Object.values(vulnerabilityFactors).reduce(
        (sum, score) => sum + score,
        0,
      );

      return {
        name: tp.name,
        vulnerabilityScore: Math.min(10, totalVulnerability / 3), // Scale to 0-10
        timeImpact: tp.percentOfJourney,
        phase: tp.phase,
      };
    });
  }

  /**
   * Check if touchpoint has operating hours constraint
   */
  private hasOperatingHoursConstraint(
    touchpointName: string,
    operatingHours?: OperatingHours[],
  ): boolean {
    if (!operatingHours) return false;

    const name = touchpointName.toLowerCase();
    return operatingHours.some((oh) => {
      const facility = oh.facility.toLowerCase();
      return (
        (name.includes("kuwait") && facility.includes("kuwait")) ||
        (name.includes("offloading") && facility.includes("offloading")) ||
        (name.includes("saudi") && facility.includes("saudi")) ||
        (name.includes("documentation") && facility.includes("documentation"))
      );
    });
  }

  /**
   * Check if touchpoint is a single point of failure
   */
  private isSinglePointOfFailure(touchpointName: string): boolean {
    const name = touchpointName.toLowerCase();
    // Kuwait customs is identified as SPOF
    return name.includes("kuwait custom");
  }

  /**
   * Analyze arrival timing impact on efficiency
   */
  private analyzeArrivalTimingImpact(
    shipments: Array<{
      waybill: string;
      arrivalTime: string;
      totalOffloading: number;
      outsideHoursWaiting: number;
      actualOffloading: number;
    }>,
  ): BottleneckAnalysis["arrivalTimingImpact"] {
    // Group by arrival window
    const groupedByWindow = shipments.reduce(
      (acc, shipment) => {
        const window = this.getArrivalWindow(shipment.arrivalTime);
        if (!acc[window]) {
          acc[window] = {
            count: 0,
            totalWaiting: 0,
            totalOffloading: 0,
          };
        }

        acc[window].count++;
        acc[window].totalWaiting += shipment.outsideHoursWaiting;
        acc[window].totalOffloading += shipment.totalOffloading;

        return acc;
      },
      {} as Record<
        string,
        { count: number; totalWaiting: number; totalOffloading: number }
      >,
    );

    // Calculate averages
    return Object.entries(groupedByWindow).map(([window, data]) => ({
      window,
      count: data.count,
      avgWaiting: data.totalWaiting / data.count,
      avgTotal: data.totalOffloading / data.count,
      waitingPercentage: (data.totalWaiting / data.totalOffloading) * 100,
      efficiency: 100 - (data.totalWaiting / data.totalOffloading) * 100,
    }));
  }

  /**
   * Get arrival window from time string
   */
  private getArrivalWindow(arrivalTime: string): string {
    const hour = parseInt(arrivalTime.split(":")[0]);
    const isPM = arrivalTime.includes("PM") || arrivalTime.includes("pm");

    const hour24 =
      isPM && hour !== 12 ? hour + 12 : hour === 12 && !isPM ? 0 : hour;

    if (hour24 >= 5 && hour24 < 8) return "Early Morning";
    if (hour24 >= 8 && hour24 < 12) return "Morning";
    if (hour24 >= 12 && hour24 < 17) return "Afternoon";
    return "Night";
  }

  /**
   * Get operating hours constraint for a bottleneck
   */
  getOperatingHoursConstraint(
    bottleneckName: string,
    operatingHours?: OperatingHours[],
  ): OperatingHours | null {
    if (!operatingHours) return null;

    const name = bottleneckName.toLowerCase();

    if (name.includes("kuwait custom")) {
      return (
        operatingHours.find((oh) =>
          oh.facility.toLowerCase().includes("kuwait customs"),
        ) || null
      );
    }

    if (name.includes("offloading")) {
      return (
        operatingHours.find((oh) =>
          oh.facility.toLowerCase().includes("offloading"),
        ) || null
      );
    }

    if (name.includes("saudi custom")) {
      return (
        operatingHours.find((oh) =>
          oh.facility.toLowerCase().includes("saudi customs"),
        ) || null
      );
    }

    if (name.includes("documentation")) {
      return (
        operatingHours.find((oh) =>
          oh.facility.toLowerCase().includes("documentation"),
        ) || null
      );
    }

    return null;
  }
}

export const bottleneckAnalysisService = new BottleneckAnalysisService();
