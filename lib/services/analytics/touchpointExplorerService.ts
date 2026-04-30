/**
 * Touchpoint Explorer Service
 *
 * Deep-dive touchpoint analysis
 * Efficiency metrics, shipment-by-shipment comparison, offloading breakdown
 *
 * Migrated from: sustainability-dashboard/src/components/touchpointExplorer/TouchpointExplorer.tsx
 * Integrated with: Transportation Module, Analytics Module
 */

import { eventBus } from "@/lib/services/event-store";
import type {
  TouchpointAnalysis,
  TouchpointEfficiency,
  ShipmentComparison,
  ShipmentData,
  OffloadingProcess,
} from "@/types/analytics";

export class TouchpointExplorerService {
  /**
   * Get efficiency metrics for a touchpoint
   */
  getTouchpointEfficiency(
    touchpoint: TouchpointAnalysis,
  ): TouchpointEfficiency {
    const efficiency = (touchpoint.bestObserved / touchpoint.hours) * 100;
    const improvementPotential =
      (touchpoint.potentialSaving / touchpoint.hours) * 100;

    return {
      currentDuration: touchpoint.hours,
      bestObserved: touchpoint.bestObserved,
      potentialSaving: touchpoint.potentialSaving,
      efficiency,
      improvementPotential,
    };
  }

  /**
   * Get shipment comparison for a touchpoint
   */
  getShipmentComparison(
    touchpointId: number,
    shipments: ShipmentData[],
  ): ShipmentComparison[] {
    // Map touchpoint ID to shipment touchpoint key
    const touchpointKeyMap: Record<number, keyof ShipmentData["touchpoints"]> =
      {
        1: "tp1",
        2: "tp2",
        3: "tp3",
        4: "tp4",
        5: "tp5",
        6: "tp6",
        7: "tp7",
        8: "tp8_9",
        9: "tp10",
        10: "tp11",
        11: "tp12",
      };

    const tpKey = touchpointKeyMap[touchpointId];
    if (!tpKey) return [];

    return shipments
      .map((shipment) => ({
        name: shipment.waybill,
        hours: shipment.touchpoints[tpKey],
        arrivalTime: shipment.arrivalTime,
      }))
      .sort((a, b) => a.hours - b.hours);
  }

  /**
   * Get offloading process breakdown
   */
  getOffloadingBreakdown(offloadingData: OffloadingProcess[]): {
    timeBreakdown: OffloadingProcess[];
    percentageBreakdown: Array<{
      name: string;
      value: number;
    }>;
  } {
    return {
      timeBreakdown: offloadingData,
      percentageBreakdown: offloadingData.map((item) => ({
        name: item.component,
        value: item.percentOfOffloading,
      })),
    };
  }

  /**
   * Publish touchpoint exploration event
   */
  async publishExplorationEvent(
    touchpointId: number,
    touchpointName: string,
  ): Promise<void> {
    await eventBus.publish("analytics.touchpoint.explored", {
      touchpointId,
      touchpointName,
      timestamp: new Date(),
    });
  }
}

export const touchpointExplorerService = new TouchpointExplorerService();
