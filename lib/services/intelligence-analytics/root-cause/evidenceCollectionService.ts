/**
 * Evidence Collection Service
 *
 * Collects evidence from all modules for root cause analysis
 */

import { eventStore } from "@/lib/services/event-store";
import { evidenceService } from "@/lib/services/evidence";
import type { Evidence } from "@/types/intelligence-analytics";

export class EvidenceCollectionService {
  private static instance: EvidenceCollectionService;

  private constructor() {}

  static getInstance(): EvidenceCollectionService {
    if (!EvidenceCollectionService.instance) {
      EvidenceCollectionService.instance = new EvidenceCollectionService();
    }
    return EvidenceCollectionService.instance;
  }

  /**
   * Collect evidence from all sources
   */
  async collectEvidence(params: {
    tenantId: string;
    entityId: string;
    entityType: string;
    moduleId?: string;
    timeRange?: { start: Date | string; end: Date | string };
  }): Promise<Evidence[]> {
    const { tenantId, entityId, entityType, moduleId, timeRange } = params;
    const evidence: Evidence[] = [];

    // 1. Get events from Event Store
    const events = await this.getEventsFromStore(tenantId, entityId, timeRange);
    for (const event of events) {
      if (!moduleId || this.extractModule(event.type) === moduleId) {
        evidence.push({
          id: `ev-event-${event.id}`,
          type: "event",
          source: {
            module: this.extractModule(event.type),
            entityType: event.aggregateType,
            entityId: event.aggregateId,
          },
          data: event.payload,
          relevance: 0.7,
          quality: 0.8,
          timestamp: event.timestamp,
        });
      }
    }

    // 2. Get evidence from Evidence Ledger
    try {
      const evidenceRecords = await evidenceService.getEvidence({
        entityId,
        tenantId,
      });
      for (const ev of evidenceRecords) {
        evidence.push({
          id: ev.id,
          type: ev.type as any,
          source: {
            module: moduleId || "unknown",
            entityType,
            entityId,
          },
          data: ev.data,
          relevance: 0.8,
          quality: 0.9,
          timestamp: ev.timestamp,
          lineage: ev.lineage?.map((l) => ({
            source: l.source,
            timestamp: l.timestamp,
            transformation: l.transformation,
          })),
          integrity: ev.integrity
            ? {
                hash: ev.integrity.hash,
                verified: ev.integrity.verified,
              }
            : undefined,
        });
      }
    } catch (error) {
      console.debug("Error getting evidence from ledger:", error);
    }

    // 3. Get related evidence (from related entities)
    const relatedEvidence = await this.getRelatedEvidence(
      tenantId,
      entityId,
      entityType,
      moduleId,
    );
    evidence.push(...relatedEvidence);

    // Sort by relevance and quality
    return evidence.sort((a, b) => {
      const scoreA = a.relevance * 0.7 + a.quality * 0.3;
      const scoreB = b.relevance * 0.7 + b.quality * 0.3;
      return scoreB - scoreA;
    });
  }

  /**
   * Get events from Event Store
   */
  private async getEventsFromStore(
    tenantId: string,
    entityId: string,
    timeRange?: { start: Date | string; end: Date | string },
  ): Promise<any[]> {
    try {
      if (timeRange) {
        return await eventStore.getEventsByTimeRange(
          new Date(timeRange.start).getTime(),
          new Date(timeRange.end).getTime(),
        );
      } else {
        return await eventStore.getEvents(entityId);
      }
    } catch (error) {
      console.error("Error getting events from store:", error);
      return [];
    }
  }

  /**
   * Get related evidence from related entities
   */
  private async getRelatedEvidence(
    tenantId: string,
    entityId: string,
    entityType: string,
    moduleId?: string,
  ): Promise<Evidence[]> {
    const relatedEvidence: Evidence[] = [];

    // This would query related entities based on relationships
    // For now, return empty - can be enhanced with entity graph
    return relatedEvidence;
  }

  /**
   * Extract module from event type
   */
  private extractModule(eventType: string): string {
    const parts = eventType.split(".");
    return parts[0] || "unknown";
  }

  /**
   * Score evidence quality
   */
  scoreEvidenceQuality(evidence: Evidence): number {
    let score = 0.5; // Base score

    // Higher score for certain types
    if (evidence.type === "metric" || evidence.type === "test") {
      score += 0.2;
    }

    // Higher score for verified integrity
    if (evidence.integrity?.verified) {
      score += 0.2;
    }

    // Higher score for recent evidence
    const age = Date.now() - new Date(evidence.timestamp).getTime();
    const daysOld = age / (24 * 60 * 60 * 1000);
    if (daysOld < 7) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }
}

// Export singleton instance
export const evidenceCollectionService =
  EvidenceCollectionService.getInstance();
