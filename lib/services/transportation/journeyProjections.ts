/**
 * Journey Projections (Read Models)
 *
 * Purpose:
 * Make Journey Analysis "platform-wide" by materializing a read model that any module can query
 * without directly depending on the in-memory JourneyAnalysisService instance.
 *
 * Today this is in-memory (projectionStore). In production this should persist (DB/Redis/OpenSearch).
 */

import type { Projection, DomainEvent, ProjectionStore } from "@/types/cqrs";
import { projectionManager } from "@/lib/services/event-store";

type JourneySummary = {
  id: string; // journeyId
  shipmentId: string;
  status: string;
  touchpointsCount?: number;
  updatedAt: string;
  tenantId?: string;
  userId?: string;
};

const journeySummaryProjection: Projection = {
  name: "journeySummaryProjection",
  handles: [
    "transportation.journey.analyzed",
    "transportation.journey.touchpoint.updated",
  ],
  apply: async (event: DomainEvent, store: ProjectionStore) => {
    if (event.type === "transportation.journey.analyzed") {
      const payload = event.payload as any;
      const summary: JourneySummary = {
        id: payload.journeyId,
        shipmentId: payload.shipmentId,
        status: payload.status,
        touchpointsCount: payload.touchpointsCount,
        updatedAt: event.timestamp,
        tenantId: event.metadata?.tenantId,
        userId: event.metadata?.userId,
      };
      await store.upsert("journey_summaries", summary.id, summary);
      // Also keep a secondary index for shipment → journey
      await store.upsert("journey_by_shipment", summary.shipmentId, {
        journeyId: summary.id,
        tenantId: summary.tenantId,
      });
      return;
    }

    if (event.type === "transportation.journey.touchpoint.updated") {
      const payload = event.payload as any;
      const existing = await store.get<JourneySummary>(
        "journey_summaries",
        payload.journeyId,
      );
      const next: JourneySummary = {
        id: payload.journeyId,
        shipmentId: payload.shipmentId || existing?.shipmentId,
        status:
          payload.journeyStatus ||
          payload.status ||
          existing?.status ||
          "UNKNOWN",
        touchpointsCount: existing?.touchpointsCount,
        updatedAt: event.timestamp,
        tenantId: event.metadata?.tenantId || existing?.tenantId,
        userId: event.metadata?.userId || existing?.userId,
      };
      await store.upsert("journey_summaries", next.id, next);
      if (next.shipmentId) {
        await store.upsert("journey_by_shipment", next.shipmentId, {
          journeyId: next.id,
          tenantId: next.tenantId,
        });
      }
    }
  },
  rebuild: async (_events: DomainEvent[]) => {
    // If we need rebuild support later, we'll implement it by replaying into a fresh store.
    return;
  },
};

let registered = false;

export function initializeJourneyProjections(): void {
  if (registered) return;
  registered = true;
  projectionManager.register(journeySummaryProjection);
}
