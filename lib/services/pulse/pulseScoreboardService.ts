/**
 * Pulse Scoreboard Service
 * Compute snapshots by period and scope, generate leaderboards
 */

import { PrismaClient } from "@prisma/client";
import { pulseScoringService } from "./pulseScoringService";
import type {
  PulseScoreSnapshot,
  LeaderboardEntry,
  IPulseScoreboardService,
  ScopeType,
  PulsePillar,
} from "@/types/pulse";

const prisma = new PrismaClient();

export class PulseScoreboardService implements IPulseScoreboardService {
  /**
   * Calculate score snapshot
   */
  async calculateSnapshot(
    scopeType: ScopeType,
    scopeId: string,
    tenantId: string,
    period: { start: Date; end: Date },
  ): Promise<PulseScoreSnapshot> {
    // Get all users in scope
    const userIds = await this.getUsersInScope(scopeType, scopeId, tenantId);

    if (userIds.length === 0) {
      throw new Error("No users found in scope");
    }

    // Calculate scores for each user
    const userScores: Array<{
      userId: string;
      scores: Record<PulsePillar, number>;
    }> = [];
    let totalParticipation = 0;

    for (const userId of userIds) {
      const scores = await pulseScoringService.calculatePillarScores(
        userId,
        tenantId,
        period,
      );
      const hasActivity = Object.values(scores).some((s) => s > 0);
      if (hasActivity) {
        totalParticipation++;
        userScores.push({ userId, scores });
      }
    }

    // Calculate aggregate pillar scores
    const aggregateScores: Record<PulsePillar, number> = {
      Move: 0,
      Execute: 0,
      Safe: 0,
      Grow: 0,
    };

    for (const { scores } of userScores) {
      aggregateScores.Move += scores.Move;
      aggregateScores.Execute += scores.Execute;
      aggregateScores.Safe += scores.Safe;
      aggregateScores.Grow += scores.Grow;
    }

    // Normalize by user count
    const userCount = userScores.length || 1;
    aggregateScores.Move = Math.round(aggregateScores.Move / userCount);
    aggregateScores.Execute = Math.round(aggregateScores.Execute / userCount);
    aggregateScores.Safe = Math.round(aggregateScores.Safe / userCount);
    aggregateScores.Grow = Math.round(aggregateScores.Grow / userCount);

    // Calculate composite score (weighted average)
    const compositeScore = this.calculateCompositeScore(aggregateScores);

    // Participation rate
    const participationRate =
      userIds.length > 0 ? (totalParticipation / userIds.length) * 100 : 0;

    // Check if snapshot exists
    const existing = await prisma.pulseScoreSnapshot.findFirst({
      where: {
        tenantId,
        scopeType,
        scopeId,
        periodStart: period.start,
        periodEnd: period.end,
      },
    });

    if (existing) {
      // Update existing
      const updated = await prisma.pulseScoreSnapshot.update({
        where: {
          tenantId_scopeType_scopeId_periodStart_periodEnd: {
            tenantId,
            scopeType,
            scopeId,
            periodStart: period.start,
            periodEnd: period.end,
          },
        },
        data: {
          participationRate,
          pillarScoresJson: aggregateScores,
          compositeScore,
        },
      });

      return this.mapToSnapshot(updated);
    }

    // Create new
    const created = await prisma.pulseScoreSnapshot.create({
      data: {
        tenantId,
        scopeType,
        scopeId,
        periodStart: period.start,
        periodEnd: period.end,
        participationRate,
        pillarScoresJson: aggregateScores,
        compositeScore,
      },
    });

    return this.mapToSnapshot(created);
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    scopeType: ScopeType,
    scopeId: string,
    tenantId: string,
    period: { start: Date; end: Date },
    limit: number = 50,
  ): Promise<LeaderboardEntry[]> {
    const userIds = await this.getUsersInScope(scopeType, scopeId, tenantId);

    const entries: LeaderboardEntry[] = [];

    for (const userId of userIds) {
      const scores = await pulseScoringService.calculatePillarScores(
        userId,
        tenantId,
        period,
      );
      const compositeScore = this.calculateCompositeScore(scores);

      // Get user name
      let userName = "Unknown";
      try {
        const user = await (prisma as any).user
          ?.findUnique({
            where: { id: userId },
            select: { name: true },
          })
          .catch(() => null);
        if (user?.name) {
          userName = user.name;
        }
      } catch (error) {
        // User model doesn't exist - use default
      }

      entries.push({
        userId,
        userName,
        compositeScore,
        pillarScores: scores,
        participationRate: Object.values(scores).some((s) => s > 0) ? 100 : 0,
        rank: 0, // Will be set after sorting
      });
    }

    // Sort by composite score
    entries.sort((a, b) => b.compositeScore - a.compositeScore);

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries.slice(0, limit);
  }

  /**
   * Get scoreboard (snapshot)
   */
  async getScoreboard(
    scopeType: ScopeType,
    scopeId: string,
    tenantId: string,
    period: { start: Date; end: Date },
  ): Promise<PulseScoreSnapshot> {
    const snapshot = await prisma.pulseScoreSnapshot.findFirst({
      where: {
        tenantId,
        scopeType,
        scopeId,
        periodStart: period.start,
        periodEnd: period.end,
      },
    });

    if (snapshot) {
      return this.mapToSnapshot(snapshot);
    }

    // Calculate if not exists
    return this.calculateSnapshot(scopeType, scopeId, tenantId, period);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async getUsersInScope(
    scopeType: ScopeType,
    scopeId: string,
    tenantId: string,
  ): Promise<string[]> {
    switch (scopeType) {
      case "TEAM":
        // Get users in team (stub - integrate with actual team system)
        try {
          const teamUsers =
            (await (prisma as any).user?.findMany({
              where: {
                tenantId,
                // teamId: scopeId, // Add when team system is integrated
              },
              select: { id: true },
            })) || [];
          return teamUsers.map((u: any) => u.id);
        } catch (error) {
          return [];
        }

      case "SITE":
        // Get users assigned to site/warehouse
        try {
          const siteUsers =
            (await (prisma as any).user?.findMany({
              where: {
                tenantId,
                // assignedWarehouses: { has: scopeId }, // Add when warehouse assignment is integrated
              },
              select: { id: true },
            })) || [];
          return siteUsers.map((u: any) => u.id);
        } catch (error) {
          return [];
        }

      case "SHIFT":
        // Get users in shift (stub)
        return [];

      case "COMPANY":
        // All users in tenant
        try {
          const allUsers =
            (await (prisma as any).user?.findMany({
              where: { tenantId },
              select: { id: true },
            })) || [];
          return allUsers.map((u: any) => u.id);
        } catch (error) {
          return [];
        }

      default:
        return [];
    }
  }

  private calculateCompositeScore(scores: Record<PulsePillar, number>): number {
    // Default weights (can be overridden by ruleset)
    const weights = {
      Move: 0.25,
      Execute: 0.4,
      Safe: 0.25,
      Grow: 0.1,
    };

    const weightedSum =
      scores.Move * weights.Move +
      scores.Execute * weights.Execute +
      scores.Safe * weights.Safe +
      scores.Grow * weights.Grow;

    return Math.round(weightedSum);
  }

  private mapToSnapshot(s: any): PulseScoreSnapshot {
    return {
      id: s.id,
      tenantId: s.tenantId,
      scopeType: s.scopeType as ScopeType,
      scopeId: s.scopeId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      participationRate: Number(s.participationRate),
      pillarScoresJson: s.pillarScoresJson as Record<PulsePillar, number>,
      compositeScore: Number(s.compositeScore),
      createdAt: s.createdAt,
    };
  }
}

export const pulseScoreboardService = new PulseScoreboardService();
