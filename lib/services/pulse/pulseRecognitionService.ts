/**
 * Pulse Recognition Service
 * Peer-to-peer recognition with caps and abuse controls
 */

import { PrismaClient } from "@prisma/client";
import { pulseLedgerService } from "./pulseLedgerService";
import { notificationService } from "@/lib/services/notifications/notificationService";
import type { PulseRecognition, IPulseRecognitionService } from "@/types/pulse";

const prisma = new PrismaClient();

// Caps configuration
const DAILY_RECOGNITION_CAP = 100; // PP per day
const WEEKLY_RECOGNITION_CAP = 500; // PP per week
const MAX_POINTS_PER_RECOGNITION = 20;

export class PulseRecognitionService implements IPulseRecognitionService {
  /**
   * Give recognition
   */
  async giveRecognition(
    fromUserId: string,
    toUserId: string,
    tenantId: string,
    pointsPP: number,
    reason: string,
    tags?: string[],
  ): Promise<PulseRecognition> {
    // Check caps
    const dailyCap = await this.checkDailyCap(fromUserId, tenantId);
    if (dailyCap.remaining < pointsPP) {
      throw new Error(
        `Daily recognition cap exceeded. Remaining: ${dailyCap.remaining} PP`,
      );
    }

    const weeklyCap = await this.checkWeeklyCap(fromUserId, tenantId);
    if (weeklyCap.remaining < pointsPP) {
      throw new Error(
        `Weekly recognition cap exceeded. Remaining: ${weeklyCap.remaining} PP`,
      );
    }

    // Check abuse
    const isAbuse = await this.detectAbuse(fromUserId, toUserId, tenantId);
    if (isAbuse) {
      throw new Error("Recognition pattern detected as potential abuse");
    }

    // Validate points
    if (pointsPP > MAX_POINTS_PER_RECOGNITION) {
      throw new Error(
        `Maximum ${MAX_POINTS_PER_RECOGNITION} PP per recognition`,
      );
    }

    if (pointsPP <= 0) {
      throw new Error("Points must be positive");
    }

    // Create recognition
    const recognition = await prisma.pulseRecognition.create({
      data: {
        tenantId,
        fromUserId,
        toUserId,
        pointsPP,
        reason,
        tagsJson: tags || [],
      },
    });

    // Award points to recipient
    await pulseLedgerService.recordEvent({
      tenantId,
      userId: toUserId,
      occurredAt: new Date(),
      eventType: "RECOGNITION_GIVEN",
      sourceModule: "pulse",
      sourceRef: recognition.id,
      pointsAwardedPP: pointsPP,
      creditsAwardedIC: 0,
      metadataJson: {
        fromUserId,
        reason,
        tags: tags || [],
      },
    });

    // Send notification
    await notificationService.send({
      type: "recognition_received",
      channel: "in-app",
      priority: "medium",
      title: "Recognition Received!",
      message: `You received ${pointsPP} PP: ${reason}`,
      userId: toUserId,
    });

    return {
      id: recognition.id,
      tenantId: recognition.tenantId,
      fromUserId: recognition.fromUserId,
      toUserId: recognition.toUserId,
      pointsPP: recognition.pointsPP,
      reason: recognition.reason,
      tagsJson: (recognition.tagsJson as string[]) || [],
      createdAt: recognition.createdAt,
    };
  }

  /**
   * Check daily cap
   */
  async checkDailyCap(
    userId: string,
    tenantId: string,
  ): Promise<{ remaining: number; limit: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRecognitions = await prisma.pulseRecognition.findMany({
      where: {
        tenantId,
        fromUserId: userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const used = todayRecognitions.reduce(
      (sum: number, r: any) => sum + r.pointsPP,
      0,
    );
    const remaining = Math.max(0, DAILY_RECOGNITION_CAP - used);

    return { remaining, limit: DAILY_RECOGNITION_CAP };
  }

  /**
   * Check weekly cap
   */
  async checkWeeklyCap(
    userId: string,
    tenantId: string,
  ): Promise<{ remaining: number; limit: number }> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekRecognitions = await prisma.pulseRecognition.findMany({
      where: {
        tenantId,
        fromUserId: userId,
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
    });

    const used = weekRecognitions.reduce(
      (sum: number, r: any) => sum + r.pointsPP,
      0,
    );
    const remaining = Math.max(0, WEEKLY_RECOGNITION_CAP - used);

    return { remaining, limit: WEEKLY_RECOGNITION_CAP };
  }

  /**
   * Detect abuse patterns
   */
  async detectAbuse(
    fromUserId: string,
    toUserId: string,
    tenantId: string,
  ): Promise<boolean> {
    // Check for circular recognition (A->B->A in short time)
    const recentFromB = await prisma.pulseRecognition.findFirst({
      where: {
        tenantId,
        fromUserId: toUserId,
        toUserId: fromUserId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (recentFromB) {
      return true; // Circular pattern detected
    }

    // Check for too many recognitions to same user in short time
    const recentToSameUser = await prisma.pulseRecognition.count({
      where: {
        tenantId,
        fromUserId,
        toUserId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    if (recentToSameUser >= 3) {
      return true; // Too frequent
    }

    return false;
  }
}

export const pulseRecognitionService = new PulseRecognitionService();
