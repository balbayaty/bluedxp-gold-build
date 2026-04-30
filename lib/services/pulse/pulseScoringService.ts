/**
 * Pulse Scoring Service
 * Compute PP/IC from events using rulesets, caps, normalization
 */

import { PrismaClient } from "@prisma/client";
import { pulseLedgerService } from "./pulseLedgerService";
import type {
  PulseEvent,
  PulsePillar,
  IPulseScoringService,
  PulseEventType,
} from "@/types/pulse";
import { eventBus } from "@/lib/services/event-store";

const prisma = new PrismaClient();

export class PulseScoringService implements IPulseScoringService {
  /**
   * Process event and award points/credits
   */
  async processEvent(
    event: Omit<PulseEvent, "id" | "createdAt">,
  ): Promise<PulseEvent> {
    // Get user's role cluster (from user profile or default)
    // Note: User model may not exist in schema - use fallback
    let roleCluster = "warehouse"; // Default
    try {
      const user = await (prisma as any).user
        ?.findUnique({
          where: { id: event.userId },
          select: { role: true, department: true },
        })
        .catch(() => null);
      if (user) {
        roleCluster = this.determineRoleCluster(
          user.role || "WAREHOUSE_OPERATOR",
          user.department,
        );
      }
    } catch (error) {
      // User model doesn't exist or query failed - use default
      roleCluster = "warehouse";
    }

    // Get active ruleset for role cluster
    const ruleset = await prisma.pulseRuleset.findFirst({
      where: {
        tenantId: event.tenantId,
        roleCluster,
        status: "ACTIVE",
      },
    });

    if (!ruleset) {
      // No ruleset = no points
      return pulseLedgerService.recordEvent({
        ...event,
        pointsAwardedPP: 0,
        creditsAwardedIC: 0,
      });
    }

    const weights = ruleset.weightsJson as Record<PulsePillar, number>;
    const caps = ruleset.capsJson as {
      daily: Record<PulsePillar, number>;
      weekly: Record<PulsePillar, number>;
      monthly: Record<PulsePillar, number>;
    };
    const antiGaming = ruleset.antiGamingJson as any;

    // Determine pillar from event type
    const pillar = this.mapEventToPillar(event.eventType);

    // Calculate base points (example logic - adjust based on event type)
    const basePoints = this.calculateBasePoints(
      event.eventType,
      event.metadataJson,
    );

    // Apply caps
    const cappedPoints = await this.applyCaps(
      event.userId,
      event.tenantId,
      pillar,
      basePoints,
    );

    // Calculate PP and IC
    const pp = Math.floor(cappedPoints * weights[pillar]);
    // IC mostly from Execute/Safe/Grow, not Move
    const ic =
      pillar === "Move" ? 0 : Math.floor(cappedPoints * weights[pillar] * 0.5);

    // Anti-gaming: spike detection for wellness
    if (pillar === "Move" && antiGaming?.spikeDetection) {
      const confidence = await this.checkSpikeDetection(
        event.userId,
        event.tenantId,
        event.metadataJson,
      );
      if (confidence < 100) {
        const adjustedPP = Math.floor(pp * (confidence / 100));
        const finalEvent = await pulseLedgerService.recordEvent({
          ...event,
          pointsAwardedPP: adjustedPP,
          creditsAwardedIC: ic,
          metadataJson: { ...event.metadataJson, confidenceScore: confidence },
        });

        // Publish event
        await eventBus.publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "pulse.event.recorded",
          aggregateId: finalEvent.id,
          aggregateType: "PULSE_EVENT",
          version: 1,
          timestamp: new Date().toISOString(),
          payload: finalEvent,
          metadata: {
            correlationId: `pulse-${finalEvent.id}`,
            userId: finalEvent.userId,
            tenantId: finalEvent.tenantId,
          },
        } as any);

        return finalEvent;
      }
    }

    const finalEvent = await pulseLedgerService.recordEvent({
      ...event,
      pointsAwardedPP: pp,
      creditsAwardedIC: ic,
    });

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "pulse.event.recorded",
      aggregateId: finalEvent.id,
      aggregateType: "PULSE_EVENT",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: finalEvent,
      metadata: {
        correlationId: `pulse-${finalEvent.id}`,
        userId: finalEvent.userId,
        tenantId: finalEvent.tenantId,
      },
    } as any);

    return finalEvent;
  }

  /**
   * Calculate pillar scores for a period
   */
  async calculatePillarScores(
    userId: string,
    tenantId: string,
    period: { start: Date; end: Date },
  ): Promise<Record<PulsePillar, number>> {
    const events = await prisma.pulseEvent.findMany({
      where: {
        tenantId,
        userId,
        occurredAt: {
          gte: period.start,
          lte: period.end,
        },
      },
    });

    const scores: Record<PulsePillar, number> = {
      Move: 0,
      Execute: 0,
      Safe: 0,
      Grow: 0,
    };

    for (const event of events) {
      const pillar = this.mapEventToPillar(event.eventType as PulseEventType);
      scores[pillar] += event.pointsAwardedPP;
    }

    return scores;
  }

  /**
   * Apply caps (daily/weekly/monthly)
   */
  async applyCaps(
    userId: string,
    tenantId: string,
    pillar: PulsePillar,
    points: number,
  ): Promise<number> {
    let roleCluster = "warehouse"; // Default
    try {
      const user = await (prisma as any).user
        ?.findUnique({
          where: { id: userId },
          select: { role: true, department: true },
        })
        .catch(() => null);
      if (user) {
        roleCluster = this.determineRoleCluster(
          user.role || "WAREHOUSE_OPERATOR",
          user.department,
        );
      }
    } catch (error) {
      // User model doesn't exist - use default
      roleCluster = "warehouse";
    }

    const ruleset = await prisma.pulseRuleset.findFirst({
      where: {
        tenantId,
        roleCluster,
        status: "ACTIVE",
      },
    });

    if (!ruleset) return points;

    const caps = ruleset.capsJson as {
      daily: Record<PulsePillar, number>;
      weekly: Record<PulsePillar, number>;
      monthly: Record<PulsePillar, number>;
    };

    // Check daily cap
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const eventTypes = this.getEventTypesForPillar(pillar);
    const eventTypeFilter =
      eventTypes.length === 1 ? eventTypes[0] : { in: eventTypes };

    const todayEvents = await prisma.pulseEvent.findMany({
      where: {
        tenantId,
        userId,
        occurredAt: {
          gte: today,
          lt: tomorrow,
        },
        eventType: eventTypeFilter,
      },
    });

    const todayPoints = todayEvents.reduce(
      (sum: number, e: any) => sum + e.pointsAwardedPP,
      0,
    );
    const dailyCap = caps.daily[pillar] || Infinity;
    const remainingDaily = Math.max(0, dailyCap - todayPoints);

    // Check weekly cap
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekEvents = await prisma.pulseEvent.findMany({
      where: {
        tenantId,
        userId,
        occurredAt: {
          gte: weekStart,
          lt: weekEnd,
        },
        eventType: eventTypeFilter,
      },
    });

    const weekPoints = weekEvents.reduce(
      (sum: number, e: any) => sum + e.pointsAwardedPP,
      0,
    );
    const weeklyCap = caps.weekly[pillar] || Infinity;
    const remainingWeekly = Math.max(0, weeklyCap - weekPoints);

    // Check monthly cap
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const monthEvents = await prisma.pulseEvent.findMany({
      where: {
        tenantId,
        userId,
        occurredAt: {
          gte: monthStart,
          lt: monthEnd,
        },
        eventType: eventTypeFilter,
      },
    });

    const monthPoints = monthEvents.reduce(
      (sum: number, e: any) => sum + e.pointsAwardedPP,
      0,
    );
    const monthlyCap = caps.monthly[pillar] || Infinity;
    const remainingMonthly = Math.max(0, monthlyCap - monthPoints);

    // Apply the most restrictive cap
    return Math.min(points, remainingDaily, remainingWeekly, remainingMonthly);
  }

  /**
   * Normalize scores by role
   */
  async normalizeByRole(
    userId: string,
    tenantId: string,
    scores: Record<PulsePillar, number>,
  ): Promise<Record<PulsePillar, number>> {
    // Role normalization logic (can be enhanced)
    // For now, return as-is
    return scores;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private mapEventToPillar(eventType: PulseEventType): PulsePillar {
    switch (eventType) {
      case "WELLNESS_LOGGED":
        return "Move";
      case "TASK_CLOSED":
      case "MISSION_COMPLETED":
        return "Execute";
      case "SAFETY_OBSERVATION":
      case "CAPA_CLOSED":
      case "NCR_CLOSED":
        return "Safe";
      case "TRAINING_COMPLETED":
        return "Grow";
      default:
        return "Execute";
    }
  }

  private getEventTypesForPillar(pillar: PulsePillar): string[] {
    switch (pillar) {
      case "Move":
        return ["WELLNESS_LOGGED"];
      case "Execute":
        return ["TASK_CLOSED", "MISSION_COMPLETED"];
      case "Safe":
        return ["SAFETY_OBSERVATION", "CAPA_CLOSED", "NCR_CLOSED"];
      case "Grow":
        return ["TRAINING_COMPLETED"];
      default:
        return [];
    }
  }

  private calculateBasePoints(
    eventType: PulseEventType,
    metadata?: Record<string, any>,
  ): number {
    // Base points calculation (adjust based on requirements)
    switch (eventType) {
      case "TASK_CLOSED":
        return 10;
      case "TRAINING_COMPLETED":
        return 15;
      case "SAFETY_OBSERVATION":
        return 20;
      case "CAPA_CLOSED":
        return 25;
      case "NCR_CLOSED":
        return 15;
      case "WELLNESS_LOGGED":
        // Based on active minutes or steps
        if (metadata?.activeMinutes) {
          return Math.floor(metadata.activeMinutes / 5); // 1 point per 5 minutes
        }
        if (metadata?.steps) {
          return Math.floor(metadata.steps / 1000); // 1 point per 1000 steps
        }
        return 5;
      case "MISSION_COMPLETED":
        return metadata?.points || 30;
      default:
        return 5;
    }
  }

  private determineRoleCluster(
    role: string,
    department?: string | null,
  ): string {
    // Map roles to clusters
    if (role.includes("OPERATOR") || role.includes("WAREHOUSE")) {
      return "warehouse";
    }
    if (
      role.includes("MANAGER") ||
      role.includes("ADMIN") ||
      role.includes("ACCOUNT")
    ) {
      return "office";
    }
    if (
      role.includes("DRIVER") ||
      department?.toLowerCase().includes("transport")
    ) {
      return "driver";
    }
    return "custom";
  }

  private async checkSpikeDetection(
    userId: string,
    tenantId: string,
    metadata?: Record<string, any>,
  ): Promise<number> {
    // Check for unusual spikes in wellness data
    if (!metadata?.steps && !metadata?.activeMinutes) return 100;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get yesterday's data
    const yesterdayData = await prisma.pulseDailyWellness.findUnique({
      where: {
        tenantId_userId_date: {
          tenantId,
          userId,
          date: yesterday,
        },
      },
    });

    if (!yesterdayData) return 100; // No baseline

    const currentSteps = metadata.steps || 0;
    const currentMinutes = metadata.activeMinutes || 0;
    const yesterdaySteps = yesterdayData.steps || 0;
    const yesterdayMinutes = yesterdayData.activeMinutes || 0;

    // Check for >200% increase (spike)
    if (yesterdaySteps > 0 && currentSteps > yesterdaySteps * 2) {
      return 50; // Reduce confidence
    }
    if (yesterdayMinutes > 0 && currentMinutes > yesterdayMinutes * 2) {
      return 50;
    }

    return 100;
  }
}

export const pulseScoringService = new PulseScoringService();
