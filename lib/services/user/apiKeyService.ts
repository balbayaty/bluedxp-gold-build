/**
 * 🚀 API KEY SERVICE
 *
 * Comprehensive API key management with advanced security features
 *
 * Features:
 * - Cryptographically secure key generation
 * - API key rotation (automatic and manual)
 * - Per-key permissions and scoping
 * - Rate limiting per key
 * - IP whitelisting
 * - CORS configuration
 * - Usage tracking per key/endpoint
 * - Token expiration and refresh
 * - Token revocation (immediate and scheduled)
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-bus";
import { usageTrackingService } from "./usageTrackingService";
import crypto from "crypto";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateAPIKeyInput {
  userId: string;
  name: string;
  description?: string;
  permissions?: any[];
  scopedPermissions?: any[]; // 5-level hierarchical permissions
  allowedIPs?: string[];
  allowedOrigins?: string[];
  corsOrigins?: string[];
  rateLimit?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  };
  quotas?: Record<string, number>;
  expiresAt?: Date | string;
  rotationSchedule?: RotationSchedule;
  createdBy?: string;
}

export interface UpdateAPIKeyInput {
  name?: string;
  description?: string;
  permissions?: any[];
  scopedPermissions?: any[];
  allowedIPs?: string[];
  allowedOrigins?: string[];
  corsOrigins?: string[];
  rateLimit?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  };
  quotas?: Record<string, number>;
  expiresAt?: Date | string;
  rotationSchedule?: RotationSchedule;
  status?: "ACTIVE" | "REVOKED" | "EXPIRED" | "ROTATED";
}

export interface RotationSchedule {
  enabled: boolean;
  interval: "daily" | "weekly" | "monthly" | "custom";
  customDays?: number;
  time?: string; // HH:mm format
}

export interface UsageStats {
  totalRequests: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  lastUsedAt?: Date | string;
  endpoints: Record<string, number>; // endpoint -> count
  timeRange: {
    start: Date | string;
    end: Date | string;
  };
}

// ============================================================================
// API KEY SERVICE
// ============================================================================

class APIKeyService {
  /**
   * Create new API key
   */
  async createAPIKey(
    userId: string,
    input: CreateAPIKeyInput,
  ): Promise<{ key: string; apiKey: any }> {
    try {
      // Get user to verify tenant
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tenantId: true },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Generate cryptographically secure key
      const keyPrefix = "bluedxp_";
      const randomBytes = crypto.randomBytes(32);
      const keySuffix = randomBytes.toString("base64url").slice(0, 32);
      const fullKey = `${keyPrefix}${keySuffix}`;

      // Hash the key for storage
      const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");
      const keyLast4 = keySuffix.slice(-4);

      // Create API key record
      const apiKey = await prisma.apiKey.create({
        data: {
          userId,
          tenantId: user.tenantId,
          name: input.name,
          description: input.description,
          keyPrefix,
          keyHash,
          keyLast4,
          permissions: input.permissions || [],
          scopedPermissions: input.scopedPermissions || null,
          allowedIPs: input.allowedIPs || [],
          allowedOrigins: input.allowedOrigins || [],
          corsOrigins: input.corsOrigins || [],
          rateLimit: input.rateLimit || null,
          quotas: input.quotas || null,
          status: "ACTIVE",
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          rotationSchedule: input.rotationSchedule || null,
          nextRotationAt: this.calculateNextRotation(input.rotationSchedule),
          usageCount: 0,
          createdBy: input.createdBy || userId,
        },
      });

      // Publish event
      await eventBus.publish({
        type: "APIKeyCreated",
        aggregateId: apiKey.id,
        aggregateType: "APIKey",
        payload: {
          keyId: apiKey.id,
          userId,
          name: apiKey.name,
        },
        metadata: {
          tenantId: user.tenantId,
          userId: input.createdBy,
          timestamp: new Date().toISOString(),
        },
      });

      // Return key only once (never stored in plain text)
      return {
        key: fullKey, // Only returned on creation
        apiKey: this.sanitizeAPIKey(apiKey),
      };
    } catch (error) {
      console.error("[APIKeyService] Error creating API key:", error);
      throw error;
    }
  }

  /**
   * Get API key by ID (without exposing the key itself)
   */
  async getAPIKey(keyId: string): Promise<any | null> {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: keyId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!apiKey) return null;

      return this.sanitizeAPIKey(apiKey);
    } catch (error) {
      console.error("[APIKeyService] Error getting API key:", error);
      throw error;
    }
  }

  /**
   * List API keys for user
   */
  async listAPIKeys(userId: string): Promise<any[]> {
    try {
      const apiKeys = await prisma.apiKey.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      return apiKeys.map((k) => this.sanitizeAPIKey(k));
    } catch (error) {
      console.error("[APIKeyService] Error listing API keys:", error);
      return [];
    }
  }

  /**
   * Update API key
   */
  async updateAPIKey(keyId: string, input: UpdateAPIKeyInput): Promise<any> {
    try {
      const apiKey = await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.permissions && { permissions: input.permissions }),
          ...(input.scopedPermissions && {
            scopedPermissions: input.scopedPermissions,
          }),
          ...(input.allowedIPs && { allowedIPs: input.allowedIPs }),
          ...(input.allowedOrigins && { allowedOrigins: input.allowedOrigins }),
          ...(input.corsOrigins && { corsOrigins: input.corsOrigins }),
          ...(input.rateLimit && { rateLimit: input.rateLimit }),
          ...(input.quotas && { quotas: input.quotas }),
          ...(input.expiresAt && { expiresAt: new Date(input.expiresAt) }),
          ...(input.rotationSchedule && {
            rotationSchedule: input.rotationSchedule,
            nextRotationAt: this.calculateNextRotation(input.rotationSchedule),
          }),
          ...(input.status && { status: input.status }),
        },
      });

      // Publish event
      await eventBus.publish({
        type: "APIKeyUpdated",
        aggregateId: keyId,
        aggregateType: "APIKey",
        payload: {
          keyId,
          changes: input,
        },
        metadata: {
          tenantId: apiKey.tenantId,
          timestamp: new Date().toISOString(),
        },
      });

      return this.sanitizeAPIKey(apiKey);
    } catch (error) {
      console.error("[APIKeyService] Error updating API key:", error);
      throw error;
    }
  }

  /**
   * Delete API key
   */
  async deleteAPIKey(keyId: string): Promise<void> {
    try {
      await prisma.apiKey.delete({
        where: { id: keyId },
      });

      // Publish event
      await eventBus.publish({
        type: "APIKeyDeleted",
        aggregateId: keyId,
        aggregateType: "APIKey",
        payload: { keyId },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[APIKeyService] Error deleting API key:", error);
      throw error;
    }
  }

  /**
   * Rotate API key (create new, revoke old)
   */
  async rotateAPIKey(keyId: string): Promise<{ key: string; apiKey: any }> {
    try {
      const oldKey = await prisma.apiKey.findUnique({
        where: { id: keyId },
      });

      if (!oldKey) {
        throw new Error(`API key ${keyId} not found`);
      }

      // Create new key
      const { key, apiKey: newKey } = await this.createAPIKey(oldKey.userId, {
        name: `${oldKey.name} (Rotated)`,
        description: `Rotated from ${oldKey.name}`,
        permissions: oldKey.permissions as any[],
        scopedPermissions: oldKey.scopedPermissions as any,
        allowedIPs: oldKey.allowedIPs,
        allowedOrigins: oldKey.allowedOrigins,
        corsOrigins: oldKey.corsOrigins,
        rateLimit: oldKey.rateLimit as any,
        quotas: oldKey.quotas as any,
        expiresAt: oldKey.expiresAt,
        rotationSchedule: oldKey.rotationSchedule as any,
        createdBy: oldKey.createdBy,
      });

      // Update old key
      await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          status: "ROTATED",
          revokedAt: new Date(),
        },
      });

      // Link new key to old
      await prisma.apiKey.update({
        where: { id: newKey.id },
        data: {
          // Store reference to old key in metadata if needed
        },
      });

      // Publish event
      await eventBus.publish({
        type: "APIKeyRotated",
        aggregateId: keyId,
        aggregateType: "APIKey",
        payload: {
          oldKeyId: keyId,
          newKeyId: newKey.id,
        },
        metadata: {
          tenantId: oldKey.tenantId,
          timestamp: new Date().toISOString(),
        },
      });

      return { key, apiKey: newKey };
    } catch (error) {
      console.error("[APIKeyService] Error rotating API key:", error);
      throw error;
    }
  }

  /**
   * Verify API key
   */
  async verifyAPIKey(key: string): Promise<any | null> {
    try {
      // Hash the provided key
      const keyHash = crypto.createHash("sha256").update(key).digest("hex");

      // Find matching key
      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: {
          user: {
            select: {
              id: true,
              tenantId: true,
              status: true,
            },
          },
        },
      });

      if (!apiKey) {
        return null;
      }

      // Check if active
      if (apiKey.status !== "ACTIVE") {
        return null;
      }

      // Check if expired
      if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
        // Auto-expire
        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { status: "EXPIRED" },
        });
        return null;
      }

      // Check if user is active
      if (apiKey.user.status !== "ACTIVE") {
        return null;
      }

      return this.sanitizeAPIKey(apiKey);
    } catch (error) {
      console.error("[APIKeyService] Error verifying API key:", error);
      return null;
    }
  }

  /**
   * Track API key usage
   */
  async trackUsage(
    keyId: string,
    endpoint: string,
    metadata?: any,
  ): Promise<void> {
    try {
      // Update usage count
      await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
          lastUsedEndpoint: endpoint,
        },
      });

      // Track in usage metrics
      const apiKey = await this.getAPIKey(keyId);
      if (apiKey) {
        await usageTrackingService.trackUsage(apiKey.userId, {
          metricType: "api_call",
          metricValue: 1,
          unit: "count",
          metadata: {
            keyId,
            endpoint,
            ...metadata,
          },
        });
      }
    } catch (error) {
      console.error("[APIKeyService] Error tracking usage:", error);
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(
    keyId: string,
    timeRange: { start: Date | string; end: Date | string },
  ): Promise<UsageStats> {
    try {
      const apiKey = await this.getAPIKey(keyId);
      if (!apiKey) {
        throw new Error(`API key ${keyId} not found`);
      }

      // Get usage metrics for this key
      const metrics = await prisma.usageMetric.findMany({
        where: {
          userId: apiKey.userId,
          metricType: "api_call",
          timestamp: {
            gte: new Date(timeRange.start),
            lte: new Date(timeRange.end),
          },
          metadata: {
            path: ["keyId"],
            equals: keyId,
          },
        },
      });

      // Calculate stats
      const totalRequests = metrics.length;
      const durationMs =
        new Date(timeRange.end).getTime() - new Date(timeRange.start).getTime();
      const durationMinutes = durationMs / (1000 * 60);
      const durationHours = durationMs / (1000 * 60 * 60);
      const durationDays = durationMs / (1000 * 60 * 60 * 24);

      // Count by endpoint
      const endpoints: Record<string, number> = {};
      for (const metric of metrics) {
        const endpoint = (metric.metadata as any)?.endpoint || "unknown";
        endpoints[endpoint] = (endpoints[endpoint] || 0) + 1;
      }

      return {
        totalRequests,
        requestsPerMinute:
          durationMinutes > 0 ? totalRequests / durationMinutes : 0,
        requestsPerHour: durationHours > 0 ? totalRequests / durationHours : 0,
        requestsPerDay: durationDays > 0 ? totalRequests / durationDays : 0,
        lastUsedAt: apiKey.lastUsedAt,
        endpoints,
        timeRange,
      };
    } catch (error) {
      console.error("[APIKeyService] Error getting usage stats:", error);
      throw error;
    }
  }

  /**
   * Revoke API key
   */
  async revokeAPIKey(keyId: string, reason?: string): Promise<void> {
    try {
      await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          status: "REVOKED",
          revokedAt: new Date(),
          revokedReason: reason,
        },
      });

      // Publish event
      const apiKey = await this.getAPIKey(keyId);
      if (apiKey) {
        await eventBus.publish({
          type: "APIKeyRevoked",
          aggregateId: keyId,
          aggregateType: "APIKey",
          payload: {
            keyId,
            reason,
          },
          metadata: {
            tenantId: apiKey.tenantId,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("[APIKeyService] Error revoking API key:", error);
      throw error;
    }
  }

  /**
   * Schedule automatic rotation
   */
  async scheduleRotation(
    keyId: string,
    schedule: RotationSchedule,
  ): Promise<void> {
    try {
      await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          rotationSchedule: schedule as any,
          nextRotationAt: this.calculateNextRotation(schedule),
        },
      });
    } catch (error) {
      console.error("[APIKeyService] Error scheduling rotation:", error);
      throw error;
    }
  }

  /**
   * Check and perform automatic rotations
   */
  async performScheduledRotations(): Promise<void> {
    try {
      const keysToRotate = await prisma.apiKey.findMany({
        where: {
          status: "ACTIVE",
          rotationSchedule: {
            not: null,
          },
          nextRotationAt: {
            lte: new Date(),
          },
        },
      });

      for (const key of keysToRotate) {
        await this.rotateAPIKey(key.id);
      }
    } catch (error) {
      console.error(
        "[APIKeyService] Error performing scheduled rotations:",
        error,
      );
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private sanitizeAPIKey(apiKey: any): any {
    // Remove sensitive data
    const { keyHash, ...sanitized } = apiKey;
    return sanitized;
  }

  private calculateNextRotation(
    schedule?: RotationSchedule | null,
  ): Date | null {
    if (!schedule || !schedule.enabled) {
      return null;
    }

    const now = new Date();
    let nextRotation = new Date(now);

    switch (schedule.interval) {
      case "daily":
        nextRotation.setDate(now.getDate() + 1);
        break;

      case "weekly":
        nextRotation.setDate(now.getDate() + 7);
        break;

      case "monthly":
        nextRotation.setMonth(now.getMonth() + 1);
        break;

      case "custom":
        if (schedule.customDays) {
          nextRotation.setDate(now.getDate() + schedule.customDays);
        }
        break;
    }

    // Set time if specified
    if (schedule.time) {
      const [hours, minutes] = schedule.time.split(":").map(Number);
      nextRotation.setHours(hours, minutes, 0, 0);
    }

    return nextRotation;
  }
}

// Export singleton instance
export const apiKeyService = new APIKeyService();
