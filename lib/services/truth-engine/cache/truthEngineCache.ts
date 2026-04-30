/**
 * Truth Engine Cache Service
 * Caching layer for Truth Engine operations
 */

import { cacheService } from "@/lib/services/cache/cacheService";
import {
  TruthEvent,
  TruthTimeline,
  TruthKPI,
  BoardBrief,
} from "@/types/truth-engine";

export class TruthEngineCache {
  private cachePrefix = "truth-engine:";
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Cache Truth Timeline
   */
  async cacheTimeline(
    entityType: string,
    entityId: string,
    timeline: TruthTimeline,
    ttl?: number,
  ): Promise<void> {
    const key = `${this.cachePrefix}timeline:${entityType}:${entityId}`;
    await cacheService.set(key, timeline, ttl || this.defaultTTL, [
      "truth-engine",
      "timeline",
    ]);
  }

  /**
   * Get cached Truth Timeline
   */
  async getCachedTimeline(
    entityType: string,
    entityId: string,
  ): Promise<TruthTimeline | null> {
    const key = `${this.cachePrefix}timeline:${entityType}:${entityId}`;
    return await cacheService.get<TruthTimeline>(key);
  }

  /**
   * Cache Truth Event
   */
  async cacheEvent(event: TruthEvent, ttl?: number): Promise<void> {
    const key = `${this.cachePrefix}event:${event.id}`;
    await cacheService.set(key, event, ttl || this.defaultTTL, [
      "truth-engine",
      "event",
    ]);
  }

  /**
   * Get cached Truth Event
   */
  async getCachedEvent(eventId: string): Promise<TruthEvent | null> {
    const key = `${this.cachePrefix}event:${eventId}`;
    return await cacheService.get<TruthEvent>(key);
  }

  /**
   * Cache Truth KPI
   */
  async cacheKPI(kpi: TruthKPI, ttl?: number): Promise<void> {
    const key = `${this.cachePrefix}kpi:${kpi.id}`;
    await cacheService.set(key, kpi, ttl || this.defaultTTL, [
      "truth-engine",
      "kpi",
    ]);
  }

  /**
   * Get cached Truth KPI
   */
  async getCachedKPI(kpiId: string): Promise<TruthKPI | null> {
    const key = `${this.cachePrefix}kpi:${kpiId}`;
    return await cacheService.get<TruthKPI>(key);
  }

  /**
   * Cache Board Brief
   */
  async cacheBoardBrief(
    tenantId: string,
    brief: BoardBrief,
    ttl?: number,
  ): Promise<void> {
    const key = `${this.cachePrefix}board-brief:${tenantId}:${brief.period.start}:${brief.period.end}`;
    await cacheService.set(key, brief, ttl || 15 * 60 * 1000, [
      "truth-engine",
      "board-brief",
    ]); // 15 min for board briefs
  }

  /**
   * Get cached Board Brief
   */
  async getCachedBoardBrief(
    tenantId: string,
    periodStart: string,
    periodEnd: string,
  ): Promise<BoardBrief | null> {
    const key = `${this.cachePrefix}board-brief:${tenantId}:${periodStart}:${periodEnd}`;
    return await cacheService.get<BoardBrief>(key);
  }

  /**
   * Invalidate cache for entity
   */
  async invalidateEntityCache(
    entityType: string,
    entityId: string,
  ): Promise<void> {
    const key = `${this.cachePrefix}timeline:${entityType}:${entityId}`;
    await cacheService.delete(key);
  }

  /**
   * Invalidate cache for event
   */
  async invalidateEventCache(eventId: string): Promise<void> {
    const key = `${this.cachePrefix}event:${eventId}`;
    await cacheService.delete(key);
  }

  /**
   * Clear all Truth Engine cache
   */
  async clearAll(): Promise<void> {
    // Would need cache service to support tag-based deletion
    // For now, this is a placeholder
  }
}

export const truthEngineCache = new TruthEngineCache();
