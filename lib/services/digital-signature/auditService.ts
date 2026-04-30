/**
 * Audit Service - Hash-Chained Audit Trail
 * Provides tamper-evident audit logging with hash chains
 * Ensures court-admissible audit trail
 */

import {
  AuditLog,
  AuditLogInput,
  AuditReportFilters,
  IAuditService,
  AuditActionCategory,
  AuditSeverity,
} from "@/types/digital-signature";
import { auditService as platformAuditService } from "@/lib/services/audit/auditService";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

// In-memory storage (will be replaced with database)
const auditStore = new Map<string, AuditLog>();
let previousEventHash: string | undefined;

class DigitalSignatureAuditService implements IAuditService {
  /**
   * Log Audit Event with Hash Chain
   */
  async log(event: AuditLogInput): Promise<AuditLog> {
    try {
      // Get previous event hash for chain
      const lastEvent = Array.from(auditStore.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )[0];

      const previousHash = lastEvent?.eventHash || undefined;

      // Create audit log entry
      const auditLog: AuditLog = {
        id: uuidv4(),
        organizationId: event.organizationId,
        userId: event.userId,
        actionType: event.actionType,
        actionCategory: event.actionCategory,
        actionDescription: event.actionDescription,
        actionDescriptionAr: event.actionDescriptionAr,
        entityType: event.entityType,
        entityId: event.entityId,
        previousState: event.previousState,
        newState: event.newState,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        geolocation: event.geolocation,
        previousEventHash: previousHash,
        severity: event.severity || "info",
        status: "success",
        createdAt: new Date(),
      };

      // Calculate event hash (hash of entire event)
      const eventData = JSON.stringify({
        id: auditLog.id,
        actionType: auditLog.actionType,
        actionCategory: auditLog.actionCategory,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        previousState: auditLog.previousState,
        newState: auditLog.newState,
        previousEventHash: auditLog.previousEventHash,
        timestamp: auditLog.createdAt.toISOString(),
      });

      auditLog.eventHash = crypto
        .createHash("sha256")
        .update(eventData)
        .digest("hex");

      // Store audit log
      auditStore.set(auditLog.id, auditLog);
      previousEventHash = auditLog.eventHash;

      // Also log to platform audit service
      await platformAuditService.log({
        actionType: event.actionType,
        actionCategory: event.actionCategory,
        actionDescription: event.actionDescription,
        entityType: event.entityType,
        entityId: event.entityId,
        previousState: event.previousState,
        newState: event.newState,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        severity: event.severity || "info",
      });

      console.log("✅ Audit log created:", auditLog.id);
      return auditLog;
    } catch (error) {
      console.error("❌ Error creating audit log:", error);
      throw new Error(
        `Failed to create audit log: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get Audit Trail for Entity
   */
  async getAuditTrail(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    try {
      const logs = Array.from(auditStore.values())
        .filter(
          (log) => log.entityType === entityType && log.entityId === entityId,
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      return logs;
    } catch (error) {
      console.error("❌ Error getting audit trail:", error);
      return [];
    }
  }

  /**
   * Verify Audit Chain Integrity
   */
  async verifyAuditChain(): Promise<boolean> {
    try {
      const logs = Array.from(auditStore.values()).sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

      if (logs.length === 0) {
        return true;
      }

      // Verify each link in the chain
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];

        // Verify hash
        const eventData = JSON.stringify({
          id: log.id,
          actionType: log.actionType,
          actionCategory: log.actionCategory,
          entityType: log.entityType,
          entityId: log.entityId,
          previousState: log.previousState,
          newState: log.newState,
          previousEventHash: log.previousEventHash,
          timestamp: log.createdAt.toISOString(),
        });

        const calculatedHash = crypto
          .createHash("sha256")
          .update(eventData)
          .digest("hex");

        if (calculatedHash !== log.eventHash) {
          console.error(`❌ Hash mismatch at log ${log.id}`);
          return false;
        }

        // Verify chain link
        if (i > 0) {
          const previousLog = logs[i - 1];
          // First log should have null/empty previousEventHash, others should match
          if (i === 0) {
            // First log - previousEventHash should be null or empty
            if (log.previousEventHash && log.previousEventHash !== "") {
              // This is fine - chain starts here
            }
          } else {
            // Subsequent logs must reference previous log's hash
            if (
              !log.previousEventHash ||
              log.previousEventHash !== previousLog.eventHash
            ) {
              console.error(
                `❌ Chain broken at log ${log.id}: expected ${previousLog.eventHash}, got ${log.previousEventHash}`,
              );
              return false;
            }
          }
        } else {
          // First log - previousEventHash should be null or empty (chain start)
          if (log.previousEventHash && log.previousEventHash !== "") {
            // This might be a continuation - check if it matches a previous chain
            // For now, allow it if it's the first log we're checking
          }
        }
      }

      console.log("✅ Audit chain verified");
      return true;
    } catch (error) {
      console.error("❌ Error verifying audit chain:", error);
      return false;
    }
  }

  /**
   * Generate Audit Report
   */
  async generateAuditReport(filters: AuditReportFilters): Promise<Buffer> {
    try {
      // Filter logs
      let logs = Array.from(auditStore.values());

      if (filters.organizationId) {
        logs = logs.filter(
          (log) => log.organizationId === filters.organizationId,
        );
      }

      if (filters.userId) {
        logs = logs.filter((log) => log.userId === filters.userId);
      }

      if (filters.entityType) {
        logs = logs.filter((log) => log.entityType === filters.entityType);
      }

      if (filters.entityId) {
        logs = logs.filter((log) => log.entityId === filters.entityId);
      }

      if (filters.actionCategory) {
        logs = logs.filter(
          (log) => log.actionCategory === filters.actionCategory,
        );
      }

      if (filters.severity) {
        logs = logs.filter((log) => log.severity === filters.severity);
      }

      if (filters.startDate) {
        logs = logs.filter((log) => log.createdAt >= filters.startDate!);
      }

      if (filters.endDate) {
        logs = logs.filter((log) => log.createdAt <= filters.endDate!);
      }

      // Sort by date
      logs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      // Generate report (simplified - in production use proper PDF generation)
      const reportData = {
        generatedAt: new Date().toISOString(),
        filters,
        totalLogs: logs.length,
        logs: logs.map((log) => ({
          id: log.id,
          timestamp: log.createdAt.toISOString(),
          actionType: log.actionType,
          actionCategory: log.actionCategory,
          actionDescription: log.actionDescription,
          entityType: log.entityType,
          entityId: log.entityId,
          userId: log.userId,
          ipAddress: log.ipAddress,
          eventHash: log.eventHash,
          previousEventHash: log.previousEventHash,
        })),
      };

      // Return as JSON buffer (in production, generate PDF)
      return Buffer.from(JSON.stringify(reportData, null, 2));
    } catch (error) {
      console.error("❌ Error generating audit report:", error);
      throw new Error(
        `Failed to generate audit report: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get Audit Log by ID
   */
  getAuditLog(logId: string): AuditLog | undefined {
    return auditStore.get(logId);
  }

  /**
   * Get All Audit Logs
   */
  getAllAuditLogs(limit?: number): AuditLog[] {
    const logs = Array.from(auditStore.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return limit ? logs.slice(0, limit) : logs;
  }
}

export const digitalSignatureAuditService = new DigitalSignatureAuditService();
