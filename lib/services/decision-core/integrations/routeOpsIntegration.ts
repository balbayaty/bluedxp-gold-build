/**
 * Route Operations Decision Integration
 * Example integration for route hold/reroute/dispatch decisions
 */

import { DecisionPrimitives } from "../primitives";
import type { DecisionContext } from "../types";

/**
 * Decide route hold
 * Hold shipment at border due to operating hours or other constraints
 */
export async function decideRouteHold(
  shipmentId: string,
  tenantId: string,
  userId: string,
  holdData: {
    reason: string;
    holdUntil: Date | string;
    borderHours?: { open: number; close: number };
    estimatedArrivalHour?: number;
    evidenceIds?: string[];
  },
): Promise<void> {
  const context: DecisionContext = {
    module: "route-ops",
    entityType: "shipment",
    entityId: shipmentId,
    tenantId,
    userId,
    data: holdData,
  };

  await DecisionPrimitives.HOLD_UNTIL(
    context,
    holdData.holdUntil,
    holdData.reason,
    {
      evidenceIds: holdData.evidenceIds,
    },
  );
}

/**
 * Decide route reroute
 * Reroute shipment to alternative route
 */
export async function decideRouteReroute(
  shipmentId: string,
  tenantId: string,
  userId: string,
  rerouteData: {
    newRoute: string;
    reason: string;
    estimatedArrival?: Date | string;
    evidenceIds?: string[];
  },
): Promise<void> {
  const context: DecisionContext = {
    module: "route-ops",
    entityType: "shipment",
    entityId: shipmentId,
    tenantId,
    userId,
    data: rerouteData,
  };

  await DecisionPrimitives.REROUTE(context, rerouteData, {
    evidenceIds: rerouteData.evidenceIds,
  });
}

/**
 * Reschedule border crossing
 */
export async function rescheduleBorderCrossing(
  shipmentId: string,
  tenantId: string,
  userId: string,
  rescheduleData: {
    newDate: Date | string;
    reason: string;
    originalDate?: Date | string;
    evidenceIds?: string[];
  },
): Promise<void> {
  const context: DecisionContext = {
    module: "route-ops",
    entityType: "shipment",
    entityId: shipmentId,
    tenantId,
    userId,
    data: rescheduleData,
  };

  await DecisionPrimitives.RESCHEDULE(context, rescheduleData, {
    evidenceIds: rescheduleData.evidenceIds,
  });
}
