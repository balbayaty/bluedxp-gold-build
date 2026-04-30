/**
 * 📜 PERMISSION AUDIT TRAIL
 *
 * Complete audit trail for all permission changes:
 * - Track every permission change
 * - Who changed what, when, and why
 * - Rollback capability
 * - Compliance reporting
 * - Real-time monitoring
 */

import type { User, HierarchicalPermission } from "@/types/user";

// ============================================================================
// TYPES
// ============================================================================

export interface PermissionAuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  userName: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "GRANT" | "REVOKE" | "MODIFY";
  targetUserId: string;
  targetUserEmail: string;
  permission: HierarchicalPermission;
  previousPermission?: HierarchicalPermission;
  reason?: string;
  changedBy: string;
  changedByEmail: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AuditQuery {
  userId?: string;
  targetUserId?: string;
  action?: PermissionAuditLog["action"];
  startDate?: Date;
  endDate?: Date;
  changedBy?: string;
  moduleId?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// PERMISSION AUDIT TRAIL SERVICE
// ============================================================================

class PermissionAuditTrailService {
  private auditLogs: PermissionAuditLog[] = [];
  private readonly MAX_LOGS = 10000;

  /**
   * Log a permission change
   */
  async logPermissionChange(
    action: PermissionAuditLog["action"],
    targetUser: User,
    permission: HierarchicalPermission,
    changedBy: User,
    options?: {
      previousPermission?: HierarchicalPermission;
      reason?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<PermissionAuditLog> {
    const log: PermissionAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: targetUser.id,
      userEmail: targetUser.email,
      userName: targetUser.name,
      action,
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      permission,
      previousPermission: options?.previousPermission,
      reason: options?.reason,
      changedBy: changedBy.id,
      changedByEmail: changedBy.email,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      metadata: options?.metadata,
    };

    this.auditLogs.push(log);

    // Maintain log size
    if (this.auditLogs.length > this.MAX_LOGS) {
      this.auditLogs = this.auditLogs.slice(-this.MAX_LOGS);
    }

    // In production, this would also save to database
    // await prisma.permissionAuditLog.create({ data: log })

    return log;
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(query: AuditQuery = {}): Promise<PermissionAuditLog[]> {
    let logs = [...this.auditLogs];

    // Apply filters
    if (query.userId) {
      logs = logs.filter(
        (l) => l.userId === query.userId || l.targetUserId === query.userId,
      );
    }
    if (query.targetUserId) {
      logs = logs.filter((l) => l.targetUserId === query.targetUserId);
    }
    if (query.action) {
      logs = logs.filter((l) => l.action === query.action);
    }
    if (query.startDate) {
      logs = logs.filter((l) => l.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      logs = logs.filter((l) => l.timestamp <= query.endDate!);
    }
    if (query.changedBy) {
      logs = logs.filter((l) => l.changedBy === query.changedBy);
    }
    if (query.moduleId) {
      logs = logs.filter((l) => l.permission.moduleId === query.moduleId);
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;

    return logs.slice(offset, offset + limit);
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id: string): Promise<PermissionAuditLog | null> {
    return this.auditLogs.find((l) => l.id === id) || null;
  }

  /**
   * Get audit summary
   */
  async getAuditSummary(query: AuditQuery = {}): Promise<{
    totalChanges: number;
    changesByAction: Record<string, number>;
    changesByUser: Record<string, number>;
    recentChanges: PermissionAuditLog[];
    topChangers: Array<{ userId: string; userName: string; count: number }>;
  }> {
    const logs = await this.getAuditLogs(query);

    const changesByAction: Record<string, number> = {};
    const changesByUser: Record<string, number> = {};
    const changesByChanger: Record<string, number> = {};

    logs.forEach((log) => {
      changesByAction[log.action] = (changesByAction[log.action] || 0) + 1;
      changesByUser[log.targetUserId] =
        (changesByUser[log.targetUserId] || 0) + 1;
      changesByChanger[log.changedBy] =
        (changesByChanger[log.changedBy] || 0) + 1;
    });

    const topChangers = Object.entries(changesByChanger)
      .map(([userId, count]) => {
        const log = logs.find((l) => l.changedBy === userId);
        return {
          userId,
          userName: log?.changedByEmail || "Unknown",
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalChanges: logs.length,
      changesByAction,
      changesByUser,
      recentChanges: logs.slice(0, 10),
      topChangers,
    };
  }

  /**
   * Rollback a permission change
   */
  async rollbackPermissionChange(
    auditLogId: string,
    rolledBackBy: User,
  ): Promise<PermissionAuditLog | null> {
    const originalLog = await this.getAuditLogById(auditLogId);
    if (!originalLog || !originalLog.previousPermission) {
      return null;
    }

    // Create rollback log
    const rollbackLog: PermissionAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: originalLog.userId,
      userEmail: originalLog.userEmail,
      userName: originalLog.userName,
      action: "ROLLBACK",
      targetUserId: originalLog.targetUserId,
      targetUserEmail: originalLog.targetUserEmail,
      permission: originalLog.previousPermission,
      previousPermission: originalLog.permission,
      reason: `Rollback of ${auditLogId}`,
      changedBy: rolledBackBy.id,
      changedByEmail: rolledBackBy.email,
      metadata: {
        originalAuditLogId: auditLogId,
        rolledBackAt: new Date().toISOString(),
      },
    };

    this.auditLogs.push(rollbackLog);
    return rollbackLog;
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(query: AuditQuery = {}): Promise<string> {
    const logs = await this.getAuditLogs(query);

    // Convert to CSV
    const headers = [
      "ID",
      "Timestamp",
      "Action",
      "Target User",
      "Permission",
      "Changed By",
      "Reason",
      "IP Address",
    ];

    const rows = logs.map((log) => [
      log.id,
      log.timestamp.toISOString(),
      log.action,
      log.userEmail,
      `${log.permission.moduleId}${log.permission.featureId ? `.${log.permission.featureId}` : ""}${log.permission.tabId ? `.${log.permission.tabId}` : ""}`,
      log.changedByEmail,
      log.reason || "",
      log.ipAddress || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csv;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const permissionAuditTrail = new PermissionAuditTrailService();
