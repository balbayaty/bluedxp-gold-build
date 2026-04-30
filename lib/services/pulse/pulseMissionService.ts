/**
 * Pulse Mission Service
 * Generate daily missions, create weekly boss battles, validate requirements
 */

import { PrismaClient } from "@prisma/client";
import { pulseScoringService } from "./pulseScoringService";
import { notificationService } from "@/lib/services/notifications/notificationService";
import type {
  PulseMission,
  PulseMissionProgress,
  IPulseMissionService,
  MissionRequirement,
  MissionType,
} from "@/types/pulse";

const prisma = new PrismaClient();

export class PulseMissionService implements IPulseMissionService {
  /**
   * Generate daily missions per user
   */
  async generateDailyMissions(
    userId: string,
    tenantId: string,
    date: Date,
  ): Promise<PulseMission[]> {
    // Check if missions already generated for this date
    const existing = await prisma.pulseMission.findMany({
      where: {
        tenantId,
        missionType: "DAILY",
        startAt: { lte: date },
        endAt: { gte: date },
      },
    });

    if (existing.length > 0) {
      return existing.map(this.mapToPulseMission);
    }

    // Get user role cluster
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

    // Generate missions based on role cluster
    const missions = this.generateMissionsForRole(roleCluster, tenantId, date);

    // Create missions
    const created = await Promise.all(
      missions.map((m) =>
        prisma.pulseMission.create({
          data: {
            id: `mission-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            tenantId: m.tenantId,
            missionType: m.missionType,
            title: m.title,
            description: m.description,
            startAt:
              m.startAt instanceof Date ? m.startAt : new Date(m.startAt),
            endAt: m.endAt instanceof Date ? m.endAt : new Date(m.endAt),
            targetScope: m.targetScope,
            requirementsJson: m.requirementsJson as any,
            rewardJson: m.rewardJson as any,
            updatedAt: new Date(),
          },
        }),
      ),
    );

    // Send notification
    await notificationService.send({
      type: "mission_available",
      channel: "in-app",
      priority: "medium",
      title: "New Daily Missions Available",
      message: `You have ${created.length} new missions to complete today!`,
      userId,
    });

    return created.map(this.mapToPulseMission);
  }

  /**
   * Create weekly mission (boss battle)
   */
  async createWeeklyMission(
    mission: Omit<PulseMission, "id" | "createdAt" | "updatedAt">,
  ): Promise<PulseMission> {
    const created = await prisma.pulseMission.create({
      data: {
        id: `mission-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        tenantId: mission.tenantId,
        missionType: mission.missionType,
        title: mission.title,
        description: mission.description,
        startAt:
          mission.startAt instanceof Date
            ? mission.startAt
            : new Date(mission.startAt),
        endAt:
          mission.endAt instanceof Date
            ? mission.endAt
            : new Date(mission.endAt),
        targetScope: mission.targetScope,
        requirementsJson: mission.requirementsJson as any,
        rewardJson: mission.rewardJson as any,
        updatedAt: new Date(),
      },
    });

    return this.mapToPulseMission(created);
  }

  /**
   * Claim mission (complete and award points)
   */
  async claimMission(
    missionId: string,
    userId: string,
    tenantId: string,
  ): Promise<PulseMissionProgress> {
    // Validate requirements first
    const isValid = await this.validateMissionRequirements(
      missionId,
      userId,
      tenantId,
    );
    if (!isValid) {
      throw new Error("Mission requirements not met");
    }

    const mission = await prisma.pulseMission.findUnique({
      where: { id: missionId },
    });

    if (!mission) {
      throw new Error("Mission not found");
    }

    // Check if already completed
    const existing = await prisma.pulseMissionProgress.findFirst({
      where: {
        tenantId,
        missionId,
        userId: userId || undefined,
      },
    });

    if (existing && existing.status === "COMPLETED") {
      throw new Error("Mission already completed");
    }

    // Create or update progress
    const existingProgress = await prisma.pulseMissionProgress.findFirst({
      where: {
        tenantId,
        missionId,
        userId,
      },
    });

    const progress = existingProgress
      ? await prisma.pulseMissionProgress.update({
          where: { id: existingProgress.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            progressJson: { completed: true },
          },
        })
      : await prisma.pulseMissionProgress.create({
          data: {
            id: `progress-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            tenantId,
            missionId,
            userId,
            progressJson: { completed: true } as any,
            status: "COMPLETED",
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        });

    // Award points
    const reward = mission.rewardJson as {
      PP: number;
      IC: number;
      badge?: string;
    };
    await pulseScoringService.processEvent({
      tenantId,
      userId,
      occurredAt: new Date(),
      eventType: "MISSION_COMPLETED",
      sourceModule: "pulse",
      sourceRef: missionId,
      pointsAwardedPP: reward.PP,
      creditsAwardedIC: reward.IC,
      metadataJson: { missionId, missionType: mission.missionType },
    });

    // Send notification
    await notificationService.send({
      type: "mission_completed",
      channel: "in-app",
      priority: "medium",
      title: "Mission Completed!",
      message: `You earned ${reward.PP} PP and ${reward.IC} IC!`,
      userId,
    });

    return {
      id: progress.id,
      tenantId: progress.tenantId,
      missionId: progress.missionId,
      userId: progress.userId || undefined,
      teamId: progress.teamId || undefined,
      siteId: progress.siteId || undefined,
      shiftId: progress.shiftId || undefined,
      progressJson: progress.progressJson as Record<string, any>,
      status: progress.status as any,
      completedAt: progress.completedAt || undefined,
      createdAt: progress.createdAt,
      updatedAt: progress.updatedAt,
    };
  }

  /**
   * Validate mission requirements
   */
  async validateMissionRequirements(
    missionId: string,
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    const mission = await prisma.pulseMission.findUnique({
      where: { id: missionId },
    });

    if (!mission) return false;

    const requirements =
      mission.requirementsJson as unknown as MissionRequirement[];

    for (const req of requirements) {
      switch (req.type) {
        case "task":
          // Check task completion
          const taskCount = await this.checkTaskCompletion(
            userId,
            tenantId,
            req,
          );
          if (taskCount < (req.count || 1)) return false;
          break;

        case "training":
          // Check training completion
          const trainingCount = await this.checkTrainingCompletion(
            userId,
            tenantId,
            req,
          );
          if (trainingCount < (req.count || 1)) return false;
          break;

        case "safety":
          // Check safety observations
          const safetyCount = await this.checkSafetyObservations(
            userId,
            tenantId,
            req,
          );
          if (safetyCount < (req.count || 1)) return false;
          break;

        case "wellness":
          // Check wellness data
          const wellnessMet = await this.checkWellnessRequirement(
            userId,
            tenantId,
            req,
          );
          if (!wellnessMet) return false;
          break;

        case "manual":
          // Manual requirements need user confirmation (handled in UI)
          break;
      }
    }

    return true;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private generateMissionsForRole(
    roleCluster: string,
    tenantId: string,
    date: Date,
  ): Omit<PulseMission, "id" | "createdAt" | "updatedAt">[] {
    const startAt = new Date(date);
    startAt.setHours(0, 0, 0, 0);
    const endAt = new Date(date);
    endAt.setHours(23, 59, 59, 999);

    switch (roleCluster) {
      case "warehouse":
        return [
          {
            tenantId,
            missionType: "DAILY" as MissionType,
            title: "Warehouse Starter Pack",
            description: "Complete your daily warehouse tasks",
            startAt,
            endAt,
            targetScope: "individual",
            requirementsJson: [
              { type: "task", source: "tasks", count: 2, status: "COMPLETED" },
              { type: "safety", source: "ims", count: 1 },
              { type: "wellness", activeMinutes: 10 },
            ] as MissionRequirement[],
            rewardJson: { PP: 30, IC: 10 },
          },
        ];

      case "office":
        return [
          {
            tenantId,
            missionType: "DAILY" as MissionType,
            title: "Office Focus + Movement",
            description: "Balance work and wellness",
            startAt,
            endAt,
            targetScope: "individual",
            requirementsJson: [
              { type: "task", source: "tasks", count: 1, priority: "medium" },
              { type: "training", source: "training", count: 1 },
              { type: "wellness", activeMinutes: 15 },
            ] as MissionRequirement[],
            rewardJson: { PP: 25, IC: 12 },
          },
        ];

      case "driver":
        return [
          {
            tenantId,
            missionType: "DAILY" as MissionType,
            title: "Driver Compliance Day",
            description: "Stay compliant and safe",
            startAt,
            endAt,
            targetScope: "individual",
            requirementsJson: [
              {
                type: "manual",
                description: "Confirm rest compliance checklist",
              },
              { type: "task", source: "tasks", count: 1 },
              { type: "manual", description: "Safety check-in" },
            ] as MissionRequirement[],
            rewardJson: { PP: 25, IC: 15 },
          },
        ];

      default:
        return [];
    }
  }

  private async checkTaskCompletion(
    userId: string,
    tenantId: string,
    req: MissionRequirement,
  ): Promise<number> {
    // Query tasks (stub - integrate with actual task system)
    // For now, check Pulse events
    const events = await prisma.pulseEvent.findMany({
      where: {
        tenantId,
        userId,
        eventType: "TASK_CLOSED",
        occurredAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    return events.length;
  }

  private async checkTrainingCompletion(
    userId: string,
    tenantId: string,
    req: MissionRequirement,
  ): Promise<number> {
    const events = await prisma.pulseEvent.findMany({
      where: {
        tenantId,
        userId,
        eventType: "TRAINING_COMPLETED",
        occurredAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    return events.length;
  }

  private async checkSafetyObservations(
    userId: string,
    tenantId: string,
    req: MissionRequirement,
  ): Promise<number> {
    const events = await prisma.pulseEvent.findMany({
      where: {
        tenantId,
        userId,
        eventType: "SAFETY_OBSERVATION",
        occurredAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    return events.length;
  }

  private async checkWellnessRequirement(
    userId: string,
    tenantId: string,
    req: MissionRequirement,
  ): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const wellness = await prisma.pulseDailyWellness.findUnique({
      where: {
        tenantId_userId_date: {
          tenantId,
          userId,
          date: today,
        },
      },
    });

    if (!wellness) return false;

    if (
      req.activeMinutes &&
      (wellness.activeMinutes || 0) < req.activeMinutes
    ) {
      return false;
    }

    if (req.steps && (wellness.steps || 0) < req.steps) {
      return false;
    }

    return true;
  }

  private determineRoleCluster(
    role: string,
    department?: string | null,
  ): string {
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

  private mapToPulseMission(m: any): PulseMission {
    return {
      id: m.id,
      tenantId: m.tenantId,
      missionType: m.missionType as MissionType,
      title: m.title,
      description: m.description || undefined,
      startAt: m.startAt,
      endAt: m.endAt,
      targetScope: m.targetScope as any,
      requirementsJson: m.requirementsJson as MissionRequirement[],
      rewardJson: m.rewardJson as any,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }
}

export const pulseMissionService = new PulseMissionService();
