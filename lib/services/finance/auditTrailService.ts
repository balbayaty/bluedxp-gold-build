/**
 * Advanced Audit Trail Service
 * Detailed audit logs, change tracking, compliance audit trail
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";
import type { AuditLog } from "@/types/finance";

export class AuditTrailService {
  private auditLogs: Map<string, AuditLog> = new Map();

  /**
   * Log audit event
   */
  async logAuditEvent(
    tenantId: string,
    log: Omit<AuditLog, "id" | "timestamp">,
  ): Promise<AuditLog> {
    const logId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const auditLog: AuditLog = {
      ...log,
      id: logId,
      timestamp: new Date().toISOString(),
    };

    this.auditLogs.set(logId, auditLog);

    await eventBus.publish({
      type: "finance.audit.logged",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        logId,
        entityType: log.entityType,
        action: log.action,
      },
    } as DomainEvent);

    return auditLog;
  }

  /**
   * Get audit trail for entity
   */
  async getAuditTrail(
    tenantId: string,
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(
        (log) =>
          log.tenantId === tenantId &&
          log.entityType === entityType &&
          log.entityId === entityId,
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }

  /**
   * Get audit trail by user
   */
  async getAuditTrailByUser(
    tenantId: string,
    userId: string,
    startDate?: Date | string,
    endDate?: Date | string,
  ): Promise<AuditLog[]> {
    let logs = Array.from(this.auditLogs.values()).filter(
      (log) => log.tenantId === tenantId && log.userId === userId,
    );

    if (startDate) {
      logs = logs.filter(
        (log) => new Date(log.timestamp) >= new Date(startDate),
      );
    }
    if (endDate) {
      logs = logs.filter((log) => new Date(log.timestamp) <= new Date(endDate));
    }

    return logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  /**
   * Get audit trail by action
   */
  async getAuditTrailByAction(
    tenantId: string,
    action: AuditLog["action"],
    startDate?: Date | string,
    endDate?: Date | string,
  ): Promise<AuditLog[]> {
    let logs = Array.from(this.auditLogs.values()).filter(
      (log) => log.tenantId === tenantId && log.action === action,
    );

    if (startDate) {
      logs = logs.filter(
        (log) => new Date(log.timestamp) >= new Date(startDate),
      );
    }
    if (endDate) {
      logs = logs.filter((log) => new Date(log.timestamp) <= new Date(endDate));
    }

    return logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  /**
   * Generate compliance audit report
   */
  async generateComplianceAuditReport(
    tenantId: string,
    startDate: Date | string,
    endDate: Date | string,
  ): Promise<{
    totalEvents: number;
    eventsByAction: Record<string, number>;
    eventsByUser: Record<string, number>;
    eventsByEntity: Record<string, number>;
    criticalEvents: AuditLog[];
  }> {
    const logs = Array.from(this.auditLogs.values()).filter((log) => {
      const logDate = new Date(log.timestamp);
      return (
        log.tenantId === tenantId &&
        logDate >= new Date(startDate) &&
        logDate <= new Date(endDate)
      );
    });

    const eventsByAction: Record<string, number> = {};
    const eventsByUser: Record<string, number> = {};
    const eventsByEntity: Record<string, number> = {};

    logs.forEach((log) => {
      eventsByAction[log.action] = (eventsByAction[log.action] || 0) + 1;
      eventsByUser[log.userName] = (eventsByUser[log.userName] || 0) + 1;
      eventsByEntity[log.entityType] =
        (eventsByEntity[log.entityType] || 0) + 1;
    });

    const criticalEvents = logs.filter((log) =>
      ["DELETE", "REVERSE", "APPROVE"].includes(log.action),
    );

    return {
      totalEvents: logs.length,
      eventsByAction,
      eventsByUser,
      eventsByEntity,
      criticalEvents,
    };
  }
}

// Singleton instance
export const auditTrailService = new AuditTrailService();
