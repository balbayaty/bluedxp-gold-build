/**
 * QR Gamification Service
 * Gamified QR Code Experience
 * Future-Ready (2024-2040)
 *
 * Features:
 * - Achievement system
 * - Leaderboards
 * - Rewards and badges
 * - Challenges and quests
 * - Social sharing
 * - Competition modes
 */

export interface QRAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category:
    | "scanning"
    | "creation"
    | "sharing"
    | "analytics"
    | "integration"
    | "mastery";
  rarity: "common" | "rare" | "epic" | "legendary";
  requirements: {
    scans?: number;
    qrCodesCreated?: number;
    modulesUsed?: number;
    locationsScanned?: number;
    consecutiveDays?: number;
  };
  reward: {
    points: number;
    badge?: string;
    title?: string;
    unlock?: string;
  };
}

export interface QRLeaderboard {
  id: string;
  name: string;
  type: "global" | "tenant" | "team" | "module" | "custom";
  period: "daily" | "weekly" | "monthly" | "all-time";
  entries: Array<{
    userId: string;
    userName: string;
    score: number;
    rank: number;
    metrics: {
      scans: number;
      qrCodesCreated: number;
      achievements: number;
      points: number;
    };
  }>;
  updatedAt: Date;
}

export interface QRChallenge {
  id: string;
  name: string;
  description: string;
  type: "scan" | "create" | "share" | "analyze" | "integrate" | "custom";
  difficulty: "easy" | "medium" | "hard" | "expert";
  startDate: Date;
  endDate: Date;
  requirements: Record<string, any>;
  rewards: {
    points: number;
    badge?: string;
    title?: string;
    unlock?: string;
  };
  participants: string[];
  completions: Array<{
    userId: string;
    completedAt: Date;
    score: number;
  }>;
}

import { eventBus } from "@/lib/services/event-store";
import { qrDatabaseAdapter } from "./database/qrDatabaseAdapter";

export class QRGamificationService {
  // Database adapter handles storage with automatic in-memory fallback
  private dbAdapter = qrDatabaseAdapter;

  /**
   * Create achievement
   */
  async createAchievement(
    achievement: Omit<QRAchievement, "id">,
  ): Promise<QRAchievement> {
    try {
      const model = await this.getModel();
      if (model) {
        const dbAchievement = await model.createAchievement(achievement);
        const fullAchievement: QRAchievement = {
          id: dbAchievement.id,
          name: dbAchievement.name,
          description: dbAchievement.description,
          icon: dbAchievement.icon,
          category: dbAchievement.category as any,
          rarity: dbAchievement.rarity as any,
          requirements:
            typeof dbAchievement.requirements === "string"
              ? JSON.parse(dbAchievement.requirements)
              : dbAchievement.requirements,
          reward:
            typeof dbAchievement.reward === "string"
              ? JSON.parse(dbAchievement.reward)
              : dbAchievement.reward,
        };
        this.achievements.set(dbAchievement.id, fullAchievement); // Cache
        return fullAchievement;
      }
    } catch (error) {
      console.error("Error creating achievement in database:", error);
    }

    // Fallback
    const id = `achievement-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const fullAchievement: QRAchievement = { id, ...achievement };
    this.achievements.set(id, fullAchievement);
    return fullAchievement;
  }

  /**
   * Check and award achievements
   */
  async checkAchievements(
    userId: string,
    action: {
      type: "scan" | "create" | "share" | "analyze";
      data?: any;
    },
  ): Promise<QRAchievement[]> {
    const userProgress = this.getUserProgress(userId);
    const awarded: QRAchievement[] = [];

    // Check each achievement
    for (const achievement of this.achievements.values()) {
      if (userProgress.achievements.includes(achievement.id)) {
        continue; // Already awarded
      }

      // Check if requirements met
      if (this.meetsRequirements(userProgress, achievement.requirements)) {
        // Award achievement
        userProgress.achievements.push(achievement.id);
        userProgress.points += achievement.reward.points;
        if (achievement.reward.badge) {
          userProgress.badges.push(achievement.reward.badge);
        }
        this.userProgress.set(userId, userProgress);
        awarded.push(achievement);

        // Publish event
        await eventBus.publish({
          id: `event-${Date.now()}`,
          type: "qr.achievement.unlocked",
          aggregateId: userId,
          aggregateType: "User",
          version: 1,
          timestamp: new Date(),
          data: { userId, achievementId: achievement.id },
          metadata: {},
        });
      }
    }

    return awarded;
  }

  /**
   * Create leaderboard
   */
  async createLeaderboard(
    leaderboard: Omit<QRLeaderboard, "id" | "entries" | "updatedAt">,
  ): Promise<QRLeaderboard> {
    const id = `leaderboard-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const fullLeaderboard: QRLeaderboard = {
      id,
      ...leaderboard,
      entries: [],
      updatedAt: new Date(),
    };
    this.leaderboards.set(id, fullLeaderboard);
    return fullLeaderboard;
  }

  /**
   * Update leaderboard
   */
  async updateLeaderboard(leaderboardId: string): Promise<QRLeaderboard> {
    const leaderboard = this.leaderboards.get(leaderboardId);
    if (!leaderboard) {
      throw new Error(`Leaderboard ${leaderboardId} not found`);
    }

    // Calculate scores for all users (in production, query database)
    const entries = await this.calculateLeaderboardEntries(leaderboard);

    leaderboard.entries = entries;
    leaderboard.updatedAt = new Date();
    this.leaderboards.set(leaderboardId, leaderboard);

    return leaderboard;
  }

  /**
   * Create challenge
   */
  async createChallenge(
    challenge: Omit<QRChallenge, "id" | "participants" | "completions">,
  ): Promise<QRChallenge> {
    const id = `challenge-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const fullChallenge: QRChallenge = {
      id,
      ...challenge,
      participants: [],
      completions: [],
    };
    this.challenges.set(id, fullChallenge);
    return fullChallenge;
  }

  /**
   * Join challenge
   */
  async joinChallenge(challengeId: string, userId: string): Promise<void> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      throw new Error(`Challenge ${challengeId} not found`);
    }

    if (!challenge.participants.includes(userId)) {
      challenge.participants.push(userId);
      this.challenges.set(challengeId, challenge);
    }
  }

  /**
   * Complete challenge
   */
  async completeChallenge(
    challengeId: string,
    userId: string,
    score: number,
  ): Promise<void> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      throw new Error(`Challenge ${challengeId} not found`);
    }

    // Check if requirements met
    if (this.meetsChallengeRequirements(userId, challenge)) {
      challenge.completions.push({
        userId,
        completedAt: new Date(),
        score,
      });

      // Award rewards
      const userProgress = this.getUserProgress(userId);
      userProgress.points += challenge.rewards.points;
      if (challenge.rewards.badge) {
        userProgress.badges.push(challenge.rewards.badge);
      }
      this.userProgress.set(userId, userProgress);

      this.challenges.set(challengeId, challenge);
    }
  }

  // Helper methods
  private async getUserProgress(userId: string) {
    try {
      const model = await this.getModel();
      if (model) {
        const dbProgress = await model.getUserProgress(userId);
        if (dbProgress) {
          const progress = {
            points: dbProgress.points,
            level: dbProgress.level,
            achievements:
              typeof dbProgress.achievements === "string"
                ? JSON.parse(dbProgress.achievements)
                : dbProgress.achievements,
            badges:
              typeof dbProgress.badges === "string"
                ? JSON.parse(dbProgress.badges)
                : dbProgress.badges,
            stats:
              typeof dbProgress.stats === "string"
                ? JSON.parse(dbProgress.stats)
                : dbProgress.stats,
          };
          this.userProgress.set(userId, progress); // Cache
          return progress;
        }
      }
    } catch (error) {
      console.error("Error loading user progress:", error);
    }

    // Fallback
    if (!this.userProgress.has(userId)) {
      this.userProgress.set(userId, {
        points: 0,
        level: 1,
        achievements: [],
        badges: [],
        stats: {
          scans: 0,
          qrCodesCreated: 0,
          modulesUsed: 0,
          locationsScanned: 0,
          consecutiveDays: 0,
        },
      });
    }
    return this.userProgress.get(userId)!;
  }

  private meetsRequirements(
    progress: any,
    requirements: QRAchievement["requirements"],
  ): boolean {
    if (requirements.scans && progress.stats.scans < requirements.scans)
      return false;
    if (
      requirements.qrCodesCreated &&
      progress.stats.qrCodesCreated < requirements.qrCodesCreated
    )
      return false;
    if (
      requirements.modulesUsed &&
      progress.stats.modulesUsed < requirements.modulesUsed
    )
      return false;
    if (
      requirements.locationsScanned &&
      progress.stats.locationsScanned < requirements.locationsScanned
    )
      return false;
    if (
      requirements.consecutiveDays &&
      progress.stats.consecutiveDays < requirements.consecutiveDays
    )
      return false;
    return true;
  }

  private async calculateLeaderboardEntries(leaderboard: QRLeaderboard) {
    // In production, query database for user scores
    return [];
  }

  private meetsChallengeRequirements(
    userId: string,
    challenge: QRChallenge,
  ): boolean {
    // Check if user meets challenge requirements
    return true; // Simplified
  }
}

export const qrGamificationService = new QRGamificationService();
