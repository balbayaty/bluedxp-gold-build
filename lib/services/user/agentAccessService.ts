/**
 * 🚀 AGENT ACCESS SERVICE
 *
 * AI agent access control and usage tracking
 *
 * Features:
 * - Agent permissions (which AI agents user can access)
 * - Agent action restrictions (allowed/blocked actions)
 * - Agent rate limiting (max actions per hour/day)
 * - Agent budget limits (cost and token limits)
 * - Agent approval workflows (require approval for sensitive actions)
 * - Agent usage tracking (costs, tokens, actions)
 * - Agent learning permissions (can agent learn from user data)
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { eventBus } from "@/lib/services/event-bus";
import { usageTrackingService } from "./usageTrackingService";

// Lazy load Prisma to avoid client-side import errors
let prisma: any = null;
let Decimal: any = null;

async function getPrisma() {
  if (typeof window !== "undefined") {
    // Client-side: return mock prisma
    return {
      user: {
        findUnique: async () => null,
        update: async () => {},
      },
      agentUsage: {
        create: async () => {},
        findMany: async () => [],
        count: async () => 0,
      },
    };
  }

  if (!prisma) {
    try {
      const { prisma: prismaClient } =
        await import("@/lib/services/database/prismaClient");
      prisma = prismaClient;
      // Use dynamic import with error handling to prevent client-side bundling
      let DecimalClass: any = null;
      try {
        if (typeof window === "undefined") {
          // Only import on server
          const decimalModule = await import("@prisma/client/runtime/library");
          DecimalClass = decimalModule.Decimal;
        }
      } catch (error) {
        // Fallback if import fails
        console.debug("Prisma Decimal not available, using fallback");
      }
      Decimal = DecimalClass;
    } catch (error) {
      // Fallback mock prisma for development
      prisma = {
        user: {
          findUnique: async () => null,
          update: async () => {},
        },
        agentUsage: {
          create: async () => {},
          findMany: async () => [],
          count: async () => 0,
        },
      };
      Decimal = class {
        constructor(value: any) {
          this.value = value;
        }
        toNumber() {
          return Number(this.value);
        }
      };
    }
  }
  return prisma;
}

function getDecimal(value: any) {
  if (!Decimal) {
    return { toNumber: () => Number(value), value };
  }
  return new Decimal(value);
}

// ============================================================================
// TYPES
// ============================================================================

export interface AgentPermissions {
  agentId: string;
  allowed: boolean;
  allowedActions?: string[];
  blockedActions?: string[];
  requireApproval?: string[]; // Actions that require approval
  canLearn?: boolean; // Can agent learn from user data
  metadata?: Record<string, any>;
}

export interface AgentLimits {
  maxActionsPerHour?: number;
  maxActionsPerDay?: number;
  maxTokensPerDay?: number;
  maxCostPerDay?: number;
  budgetLimit?: number;
}

export interface AgentUsageData {
  action: string;
  tokensUsed?: number;
  cost?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// AGENT ACCESS SERVICE
// ============================================================================

class AgentAccessService {
  /**
   * Grant agent access to user
   */
  async grantAgentAccess(
    userId: string,
    agentId: string,
    permissions: AgentPermissions,
  ): Promise<void> {
    try {
      const db = await getPrisma();
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          tenantId: true,
          agentPermissions: true,
        },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Get existing permissions
      const existing = (user.agentPermissions || {}) as Record<
        string,
        AgentPermissions
      >;

      // Update permissions
      existing[agentId] = permissions;

      // Update user
      await prisma.user.update({
        where: { id: userId },
        data: {
          agentPermissions: existing as any,
        },
      });

      // Publish event
      await eventBus.publish({
        type: "AgentAccessGranted",
        aggregateId: userId,
        aggregateType: "User",
        payload: {
          userId,
          agentId,
          permissions,
        },
        metadata: {
          tenantId: user.tenantId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[AgentAccessService] Error granting agent access:", error);
      throw error;
    }
  }

  /**
   * Revoke agent access from user
   */
  async revokeAgentAccess(userId: string, agentId: string): Promise<void> {
    try {
      const db = await getPrisma();
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          tenantId: true,
          agentPermissions: true,
        },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Get existing permissions
      const existing = (user.agentPermissions || {}) as Record<
        string,
        AgentPermissions
      >;

      // Remove agent
      delete existing[agentId];

      // Update user
      await db.user.update({
        where: { id: userId },
        data: {
          agentPermissions: existing as any,
        },
      });

      // Publish event
      await eventBus.publish({
        type: "AgentAccessRevoked",
        aggregateId: userId,
        aggregateType: "User",
        payload: {
          userId,
          agentId,
        },
        metadata: {
          tenantId: user.tenantId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[AgentAccessService] Error revoking agent access:", error);
      throw error;
    }
  }

  /**
   * Get agent permissions for user
   */
  async getAgentPermissions(
    userId: string,
    agentId: string,
  ): Promise<AgentPermissions | null> {
    try {
      const db = await getPrisma();
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          agentPermissions: true,
        },
      });

      if (!user) {
        return null;
      }

      const permissions = (user.agentPermissions || {}) as Record<
        string,
        AgentPermissions
      >;
      return permissions[agentId] || null;
    } catch (error) {
      console.error(
        "[AgentAccessService] Error getting agent permissions:",
        error,
      );
      return null;
    }
  }

  /**
   * Set agent limits
   */
  async setAgentLimits(
    userId: string,
    agentId: string,
    limits: AgentLimits,
  ): Promise<void> {
    try {
      const permissions = await this.getAgentPermissions(userId, agentId);
      if (!permissions) {
        throw new Error(`Agent ${agentId} access not found for user ${userId}`);
      }

      // Update permissions with limits
      await this.grantAgentAccess(userId, agentId, {
        ...permissions,
        metadata: {
          ...permissions.metadata,
          limits,
        },
      });
    } catch (error) {
      console.error("[AgentAccessService] Error setting agent limits:", error);
      throw error;
    }
  }

  /**
   * Track agent usage
   */
  async trackAgentUsage(
    userId: string,
    agentId: string,
    action: string,
    metadata?: any,
  ): Promise<void> {
    try {
      const db = await getPrisma();
      // Create agent usage record
      await db.agentUsage.create({
        data: {
          userId,
          agentId,
          action,
          tokensUsed: metadata?.tokensUsed || null,
          cost: metadata?.cost ? getDecimal(metadata.cost) : null,
          metadata: metadata || {},
        },
      });

      // Track in usage metrics
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { tenantId: true },
      });

      if (user) {
        await usageTrackingService.trackUsage(userId, {
          tenantId: user.tenantId,
          metricType: "agent_action",
          metricValue: 1,
          unit: "count",
          cost: metadata?.cost,
          metadata: {
            agentId,
            action,
            tokensUsed: metadata?.tokensUsed,
            ...metadata,
          },
        });
      }

      // Publish event
      await eventBus.publish({
        type: "AgentActionTracked",
        aggregateId: userId,
        aggregateType: "User",
        payload: {
          userId,
          agentId,
          action,
          metadata,
        },
        metadata: {
          tenantId: user?.tenantId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[AgentAccessService] Error tracking agent usage:", error);
      // Don't throw - tracking should not break the application
    }
  }

  /**
   * Check agent quota
   */
  async checkAgentQuota(userId: string, agentId: string): Promise<boolean> {
    try {
      const permissions = await this.getAgentPermissions(userId, agentId);
      if (!permissions || !permissions.allowed) {
        return false;
      }

      const limits = permissions.metadata?.limits as AgentLimits | undefined;
      if (!limits) {
        return true; // No limits set
      }

      const db = await getPrisma();
      // Check hourly limit
      if (limits.maxActionsPerHour) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentUsage = await db.agentUsage.count({
          where: {
            userId,
            agentId,
            timestamp: {
              gte: oneHourAgo,
            },
          },
        });

        if (recentUsage >= limits.maxActionsPerHour) {
          return false;
        }
      }

      // Check daily limit
      if (limits.maxActionsPerDay) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayUsage = await db.agentUsage.count({
          where: {
            userId,
            agentId,
            timestamp: {
              gte: startOfDay,
            },
          },
        });

        if (todayUsage >= limits.maxActionsPerDay) {
          return false;
        }
      }

      // Check token limit
      if (limits.maxTokensPerDay) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayUsage = await db.agentUsage.findMany({
          where: {
            userId,
            agentId,
            timestamp: {
              gte: startOfDay,
            },
          },
        });

        const totalTokens = todayUsage.reduce(
          (sum, u) => sum + (u.tokensUsed || 0),
          0,
        );
        if (totalTokens >= limits.maxTokensPerDay) {
          return false;
        }
      }

      // Check cost limit
      if (limits.maxCostPerDay) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayUsage = await db.agentUsage.findMany({
          where: {
            userId,
            agentId,
            timestamp: {
              gte: startOfDay,
            },
          },
        });

        const totalCost = todayUsage.reduce(
          (sum, u) => sum + Number(u.cost || 0),
          0,
        );
        if (totalCost >= limits.maxCostPerDay) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("[AgentAccessService] Error checking agent quota:", error);
      return false;
    }
  }

  /**
   * Check if action requires approval
   */
  async requireApproval(
    userId: string,
    agentId: string,
    action: string,
  ): Promise<boolean> {
    try {
      const permissions = await this.getAgentPermissions(userId, agentId);
      if (!permissions) {
        return true; // Require approval if no permissions set
      }

      if (!permissions.allowed) {
        return true; // Require approval if agent not allowed
      }

      // Check if action requires approval
      if (
        permissions.requireApproval &&
        permissions.requireApproval.includes(action)
      ) {
        return true;
      }

      // Check if action is blocked
      if (
        permissions.blockedActions &&
        permissions.blockedActions.includes(action)
      ) {
        return true; // Blocked actions require approval (or are denied)
      }

      return false;
    } catch (error) {
      console.error(
        "[AgentAccessService] Error checking approval requirement:",
        error,
      );
      return true; // Require approval on error
    }
  }

  /**
   * Get agent usage statistics
   */
  async getAgentUsageStats(
    userId: string,
    agentId: string,
    timeRange: { start: Date | string; end: Date | string },
  ): Promise<{
    totalActions: number;
    totalTokens: number;
    totalCost: number;
    actionsByType: Record<string, number>;
    timeRange: { start: Date | string; end: Date | string };
  }> {
    try {
      const db = await getPrisma();
      const usage = await db.agentUsage.findMany({
        where: {
          userId,
          agentId,
          timestamp: {
            gte: new Date(timeRange.start),
            lte: new Date(timeRange.end),
          },
        },
      });

      const totalActions = usage.length;
      const totalTokens = usage.reduce(
        (sum, u) => sum + (u.tokensUsed || 0),
        0,
      );
      const totalCost = usage.reduce((sum, u) => sum + Number(u.cost || 0), 0);

      const actionsByType: Record<string, number> = {};
      for (const u of usage) {
        actionsByType[u.action] = (actionsByType[u.action] || 0) + 1;
      }

      return {
        totalActions,
        totalTokens,
        totalCost,
        actionsByType,
        timeRange,
      };
    } catch (error) {
      console.error(
        "[AgentAccessService] Error getting agent usage stats:",
        error,
      );
      throw error;
    }
  }
}

// Export singleton instance
export const agentAccessService = new AgentAccessService();
