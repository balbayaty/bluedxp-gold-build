/**
 * Pulse Rewards Service
 * Rewards catalog, redemption flows, approvals, budget caps
 */

import { PrismaClient } from "@prisma/client";
import { pulseLedgerService } from "./pulseLedgerService";
import { notificationService } from "@/lib/services/notifications/notificationService";
import type {
  PulseRewardsCatalog,
  PulseRedemption,
  IPulseRewardsService,
  RedemptionStatus,
} from "@/types/pulse";

const prisma = new PrismaClient();

export class PulseRewardsService implements IPulseRewardsService {
  /**
   * Get rewards catalog
   */
  async getCatalog(
    tenantId: string,
    filters?: { active?: boolean; category?: string },
  ): Promise<PulseRewardsCatalog[]> {
    const where: any = { tenantId };

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    const rewards = await prisma.pulseRewardsCatalog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return rewards.map(this.mapToReward);
  }

  /**
   * Redeem reward
   */
  async redeemReward(
    userId: string,
    tenantId: string,
    rewardId: string,
  ): Promise<PulseRedemption> {
    // Get reward
    const reward = await prisma.pulseRewardsCatalog.findUnique({
      where: { id: rewardId },
    });

    if (!reward || !reward.active) {
      throw new Error("Reward not found or inactive");
    }

    // Check balance
    const balance = await pulseLedgerService.getBalance(userId, tenantId);
    if (balance.balancePP < reward.costPP) {
      throw new Error("Insufficient Pulse Points");
    }

    // Check monthly limit
    if (reward.monthlyLimitPerUser) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthRedemptions = await prisma.pulseRedemption.count({
        where: {
          tenantId,
          userId,
          rewardId,
          requestedAt: { gte: monthStart },
          status: { in: ["APPROVED", "FULFILLED"] },
        },
      });

      if (monthRedemptions >= reward.monthlyLimitPerUser) {
        throw new Error("Monthly redemption limit reached");
      }
    }

    // Check inventory
    if (reward.inventoryCount !== null && reward.inventoryCount <= 0) {
      throw new Error("Reward out of stock");
    }

    // Create redemption
    const redemption = await prisma.pulseRedemption.create({
      data: {
        tenantId,
        userId,
        rewardId,
        status: reward.approvalRequired ? "REQUESTED" : "APPROVED",
        costPP: reward.costPP,
      },
    });

    // If no approval required, auto-approve and deduct points
    if (!reward.approvalRequired) {
      await this.approveRedemption(redemption.id, "system", tenantId, true);
    } else {
      // Send notification to approvers
      await notificationService.send({
        type: "redemption_pending",
        channel: "in-app",
        priority: "high",
        title: "Reward Redemption Pending Approval",
        message: `User ${userId} requested ${reward.name} (${reward.costPP} PP)`,
        userId: "admin", // Send to admins/managers
      });
    }

    return this.mapToRedemption(redemption);
  }

  /**
   * Approve/reject redemption
   */
  async approveRedemption(
    redemptionId: string,
    approverUserId: string,
    tenantId: string,
    approved: boolean,
    notes?: string,
  ): Promise<PulseRedemption> {
    const redemption = await prisma.pulseRedemption.findUnique({
      where: { id: redemptionId },
      include: { reward: true },
    });

    if (!redemption) {
      throw new Error("Redemption not found");
    }

    if (redemption.status !== "REQUESTED") {
      throw new Error("Redemption already processed");
    }

    const updated = await prisma.pulseRedemption.update({
      where: { id: redemptionId },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        decisionAt: new Date(),
        approverUserId,
        notes,
      },
    });

    if (approved) {
      // Deduct points
      await pulseLedgerService.updateBalance(
        redemption.userId,
        tenantId,
        -redemption.costPP,
        0,
      );

      // Record event
      await pulseLedgerService.recordEvent({
        tenantId,
        userId: redemption.userId,
        occurredAt: new Date(),
        eventType: "REWARD_REDEEMED",
        sourceModule: "pulse",
        sourceRef: redemptionId,
        pointsAwardedPP: -redemption.costPP,
        creditsAwardedIC: 0,
        metadataJson: {
          rewardId: redemption.rewardId,
          rewardName: redemption.reward.name,
        },
      });

      // Update inventory if applicable
      if (redemption.reward.inventoryCount !== null) {
        await prisma.pulseRewardsCatalog.update({
          where: { id: redemption.rewardId },
          data: {
            inventoryCount: { decrement: 1 },
          },
        });
      }

      // Send notification
      await notificationService.send({
        type: "redemption_approved",
        channel: "in-app",
        priority: "medium",
        title: "Reward Approved!",
        message: `Your redemption for ${redemption.reward.name} has been approved.`,
        userId: redemption.userId,
      });
    } else {
      // Send rejection notification
      await notificationService.send({
        type: "redemption_rejected",
        channel: "in-app",
        priority: "medium",
        title: "Redemption Rejected",
        message: `Your redemption for ${redemption.reward.name} was rejected. ${notes || ""}`,
        userId: redemption.userId,
      });
    }

    return this.mapToRedemption(updated);
  }

  /**
   * Get user redemptions
   */
  async getRedemptions(
    userId: string,
    tenantId: string,
    filters?: { status?: RedemptionStatus },
  ): Promise<PulseRedemption[]> {
    const where: any = {
      tenantId,
      userId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    const redemptions = await prisma.pulseRedemption.findMany({
      where,
      include: { reward: true },
      orderBy: { requestedAt: "desc" },
    });

    return redemptions.map(this.mapToRedemption);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private mapToReward(r: any): PulseRewardsCatalog {
    return {
      id: r.id,
      tenantId: r.tenantId,
      name: r.name,
      description: r.description || undefined,
      category: r.category,
      costPP: r.costPP,
      monthlyLimitPerUser: r.monthlyLimitPerUser || undefined,
      approvalRequired: r.approvalRequired,
      inventoryCount: r.inventoryCount || undefined,
      active: r.active,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  private mapToRedemption(r: any): PulseRedemption {
    return {
      id: r.id,
      tenantId: r.tenantId,
      userId: r.userId,
      rewardId: r.rewardId,
      status: r.status as RedemptionStatus,
      requestedAt: r.requestedAt,
      decisionAt: r.decisionAt || undefined,
      fulfilledAt: r.fulfilledAt || undefined,
      approverUserId: r.approverUserId || undefined,
      notes: r.notes || undefined,
      costPP: r.costPP,
    };
  }
}

export const pulseRewardsService = new PulseRewardsService();
