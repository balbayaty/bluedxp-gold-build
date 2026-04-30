/**
 * 📡 PERMISSION EVENT SERVICE
 * 
 * Integrates permission changes with the Event Bus for:
 * - Real-time permission updates across all connected clients
 * - Audit logging of all permission changes
 * - Notification to affected users
 * - Integration with external systems
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { eventBus, createEvent } from "@/lib/services/event-bus";
import type { HierarchicalPermission } from "@/types/permissions";
import type { UserRole } from "@/types/user";

// ============================================================================
// EVENT TYPES
// ============================================================================

export const PERMISSION_EVENTS = {
  // Permission changes
  PERMISSION_GRANTED: "permission.granted",
  PERMISSION_REVOKED: "permission.revoked",
  PERMISSION_UPDATED: "permission.updated",
  PERMISSIONS_BULK_UPDATE: "permissions.bulk_update",
  
  // Role changes
  ROLE_ASSIGNED: "role.assigned",
  ROLE_REMOVED: "role.removed",
  ROLE_TEMPLATE_APPLIED: "role.template_applied",
  
  // Restriction changes
  TIME_RESTRICTION_ADDED: "restriction.time.added",
  TIME_RESTRICTION_REMOVED: "restriction.time.removed",
  LOCATION_RESTRICTION_ADDED: "restriction.location.added",
  LOCATION_RESTRICTION_REMOVED: "restriction.location.removed",
  DEVICE_RESTRICTION_ADDED: "restriction.device.added",
  DEVICE_RESTRICTION_REMOVED: "restriction.device.removed",
  
  // Access events
  ACCESS_DENIED: "access.denied",
  ACCESS_GRANTED: "access.granted",
  PERMISSION_CHECK: "permission.check",
  
  // Security events
  SUSPICIOUS_ACCESS: "security.suspicious_access",
  PERMISSION_ESCALATION: "security.permission_escalation",
  ANOMALY_DETECTED: "security.anomaly_detected",
} as const;

// ============================================================================
// EVENT PAYLOADS
// ============================================================================

export interface PermissionGrantedEvent {
  userId: string;
  tenantId: string;
  permission: HierarchicalPermission;
  grantedBy: string;
  grantedAt: Date;
  reason?: string;
  expiresAt?: Date;
}

export interface PermissionRevokedEvent {
  userId: string;
  tenantId: string;
  permission: HierarchicalPermission;
  revokedBy: string;
  revokedAt: Date;
  reason?: string;
}

export interface PermissionsBulkUpdateEvent {
  userId: string;
  tenantId: string;
  previousPermissions: HierarchicalPermission[];
  newPermissions: HierarchicalPermission[];
  updatedBy: string;
  updatedAt: Date;
  reason?: string;
}

export interface RoleAssignedEvent {
  userId: string;
  tenantId: string;
  previousRole: UserRole | null;
  newRole: UserRole;
  assignedBy: string;
  assignedAt: Date;
  reason?: string;
}

export interface AccessDeniedEvent {
  userId: string;
  tenantId: string;
  attemptedAction: string;
  resource: string;
  resourceId?: string;
  deniedAt: Date;
  reason: string;
  clientInfo: {
    ipAddress?: string;
    userAgent?: string;
    deviceType?: string;
    location?: string;
  };
}

export interface SecurityAnomalyEvent {
  userId: string;
  tenantId: string;
  anomalyType: "unusual_time" | "unusual_location" | "permission_escalation" | "rapid_access" | "failed_attempts";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detectedAt: Date;
  details: Record<string, any>;
}

// ============================================================================
// PERMISSION EVENT SERVICE
// ============================================================================

class PermissionEventService {
  private serviceName = "PermissionEventService";

  // ============================================================================
  // PERMISSION EVENTS
  // ============================================================================

  /**
   * Emit event when a permission is granted
   */
  async emitPermissionGranted(event: PermissionGrantedEvent): Promise<void> {
    const eventPayload = createEvent(
      PERMISSION_EVENTS.PERMISSION_GRANTED,
      event,
      {
        source: this.serviceName,
        correlationId: `perm_${event.userId}_${Date.now()}`,
      }
    );

    await eventBus.publish(eventPayload);
    
    // Also log to audit
    await this.logToAudit({
      action: "PERMISSION_GRANTED",
      userId: event.userId,
      performedBy: event.grantedBy,
      tenantId: event.tenantId,
      details: {
        module: event.permission.module,
        feature: event.permission.feature,
        tab: event.permission.tab,
        action: event.permission.action,
        scope: event.permission.scope,
        expiresAt: event.expiresAt,
      },
      timestamp: event.grantedAt,
    });

    console.log(`[PermissionEventService] Permission granted: ${event.permission.module}.${event.permission.feature || "*"} for user ${event.userId}`);
  }

  /**
   * Emit event when a permission is revoked
   */
  async emitPermissionRevoked(event: PermissionRevokedEvent): Promise<void> {
    const eventPayload = createEvent(
      PERMISSION_EVENTS.PERMISSION_REVOKED,
      event,
      {
        source: this.serviceName,
        correlationId: `perm_${event.userId}_${Date.now()}`,
      }
    );

    await eventBus.publish(eventPayload);
    
    await this.logToAudit({
      action: "PERMISSION_REVOKED",
      userId: event.userId,
      performedBy: event.revokedBy,
      tenantId: event.tenantId,
      details: {
        module: event.permission.module,
        feature: event.permission.feature,
        tab: event.permission.tab,
        action: event.permission.action,
        reason: event.reason,
      },
      timestamp: event.revokedAt,
    });

    console.log(`[PermissionEventService] Permission revoked: ${event.permission.module}.${event.permission.feature || "*"} for user ${event.userId}`);
  }

  /**
   * Emit event when permissions are bulk updated
   */
  async emitPermissionsBulkUpdate(event: PermissionsBulkUpdateEvent): Promise<void> {
    const eventPayload = createEvent(
      PERMISSION_EVENTS.PERMISSIONS_BULK_UPDATE,
      event,
      {
        source: this.serviceName,
        correlationId: `perm_bulk_${event.userId}_${Date.now()}`,
      }
    );

    await eventBus.publish(eventPayload);

    // Calculate diff for audit
    const added = event.newPermissions.filter(
      np => !event.previousPermissions.some(
        pp => pp.module === np.module && pp.feature === np.feature && pp.tab === np.tab && pp.action === np.action
      )
    );
    
    const removed = event.previousPermissions.filter(
      pp => !event.newPermissions.some(
        np => np.module === pp.module && np.feature === pp.feature && np.tab === pp.tab && np.action === pp.action
      )
    );

    await this.logToAudit({
      action: "PERMISSIONS_BULK_UPDATE",
      userId: event.userId,
      performedBy: event.updatedBy,
      tenantId: event.tenantId,
      details: {
        previousCount: event.previousPermissions.length,
        newCount: event.newPermissions.length,
        added: added.length,
        removed: removed.length,
        reason: event.reason,
      },
      timestamp: event.updatedAt,
    });

    console.log(`[PermissionEventService] Bulk update: ${added.length} added, ${removed.length} removed for user ${event.userId}`);
  }

  // ============================================================================
  // ROLE EVENTS
  // ============================================================================

  /**
   * Emit event when a role is assigned
   */
  async emitRoleAssigned(event: RoleAssignedEvent): Promise<void> {
    const eventPayload = createEvent(
      PERMISSION_EVENTS.ROLE_ASSIGNED,
      event,
      {
        source: this.serviceName,
        correlationId: `role_${event.userId}_${Date.now()}`,
      }
    );

    await eventBus.publish(eventPayload);

    await this.logToAudit({
      action: "ROLE_ASSIGNED",
      userId: event.userId,
      performedBy: event.assignedBy,
      tenantId: event.tenantId,
      details: {
        previousRole: event.previousRole,
        newRole: event.newRole,
        reason: event.reason,
      },
      timestamp: event.assignedAt,
    });

    console.log(`[PermissionEventService] Role assigned: ${event.newRole} for user ${event.userId}`);
  }

  // ============================================================================
  // ACCESS EVENTS
  // ============================================================================

  /**
   * Emit event when access is denied
   */
  async emitAccessDenied(event: AccessDeniedEvent): Promise<void> {
    const eventPayload = createEvent(
      PERMISSION_EVENTS.ACCESS_DENIED,
      event,
      {
        source: this.serviceName,
        correlationId: `access_${event.userId}_${Date.now()}`,
      }
    );

    await eventBus.publish(eventPayload);

    await this.logToAudit({
      action: "ACCESS_DENIED",
      userId: event.userId,
      performedBy: event.userId,
      tenantId: event.tenantId,
      details: {
        attemptedAction: event.attemptedAction,
        resource: event.resource,
        resourceId: event.resourceId,
        reason: event.reason,
        clientInfo: event.clientInfo,
      },
      timestamp: event.deniedAt,
    });

    console.log(`[PermissionEventService] Access denied: ${event.attemptedAction} on ${event.resource} for user ${event.userId}`);
  }

  // ============================================================================
  // SECURITY EVENTS
  // ============================================================================

  /**
   * Emit event when a security anomaly is detected
   */
  async emitSecurityAnomaly(event: SecurityAnomalyEvent): Promise<void> {
    const eventPayload = createEvent(
      PERMISSION_EVENTS.ANOMALY_DETECTED,
      event,
      {
        source: this.serviceName,
        correlationId: `security_${event.userId}_${Date.now()}`,
        priority: event.severity === "critical" ? "high" : "normal",
      }
    );

    await eventBus.publish(eventPayload);

    await this.logToAudit({
      action: "SECURITY_ANOMALY",
      userId: event.userId,
      performedBy: "SYSTEM",
      tenantId: event.tenantId,
      details: {
        anomalyType: event.anomalyType,
        severity: event.severity,
        description: event.description,
        details: event.details,
      },
      timestamp: event.detectedAt,
    });

    console.log(`[PermissionEventService] Security anomaly: ${event.anomalyType} (${event.severity}) for user ${event.userId}`);
  }

  // ============================================================================
  // AUDIT LOGGING - PRODUCTION (Real Database)
  // ============================================================================

  private async logToAudit(entry: {
    action: string;
    userId: string;
    performedBy: string;
    tenantId: string;
    details: Record<string, any>;
    timestamp: Date;
  }): Promise<void> {
    try {
      // Import prisma dynamically to avoid circular dependencies
      const { prisma } = await import("@/lib/services/database/prismaClient");
      
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Save to database - PRODUCTION
      await prisma.audit_logs.create({
        data: {
          id: auditId,
          userId: entry.userId,
          tenantId: entry.tenantId,
          eventType: entry.action,
          eventCategory: "PERMISSION",
          action: entry.action,
          resource: "permission",
          resourceId: null,
          description: `Permission ${entry.action.toLowerCase().replace(/_/g, " ")}`,
          metadata: entry.details,
          ipAddress: null,
          userAgent: null,
          status: "SUCCESS",
        },
      });

      // Also save to permission audit log for detailed tracking
      await prisma.permission_audit_logs.create({
        data: {
          userId: entry.userId,
          tenantId: entry.tenantId,
          action: entry.action,
          performedBy: entry.performedBy,
          previousValue: entry.details.previousValue || null,
          newValue: entry.details.newValue || null,
          module: entry.details.module || null,
          feature: entry.details.feature || null,
          tab: entry.details.tab || null,
          permissionAction: entry.details.action || null,
          scope: entry.details.scope || null,
          reason: entry.details.reason || null,
        },
      });

      // Also emit as event for real-time subscribers
      const auditEvent = createEvent(
        "audit.log",
        {
          id: auditId,
          type: "PERMISSION",
          action: entry.action,
          userId: entry.userId,
          performedBy: entry.performedBy,
          tenantId: entry.tenantId,
          details: entry.details,
          timestamp: entry.timestamp.toISOString(),
        },
        { source: this.serviceName }
      );

      await eventBus.publish(auditEvent);

    } catch (error) {
      console.error("[PermissionEventService] Failed to log to audit:", error);
    }
  }

  // ============================================================================
  // SUBSCRIPTION HELPERS
  // ============================================================================

  /**
   * Subscribe to permission change events
   */
  onPermissionChange(callback: (event: PermissionGrantedEvent | PermissionRevokedEvent) => void): () => void {
    const unsubGrant = eventBus.subscribe(PERMISSION_EVENTS.PERMISSION_GRANTED, (event) => {
      callback(event.payload as PermissionGrantedEvent);
    });

    const unsubRevoke = eventBus.subscribe(PERMISSION_EVENTS.PERMISSION_REVOKED, (event) => {
      callback(event.payload as PermissionRevokedEvent);
    });

    return () => {
      unsubGrant();
      unsubRevoke();
    };
  }

  /**
   * Subscribe to security events
   */
  onSecurityEvent(callback: (event: SecurityAnomalyEvent | AccessDeniedEvent) => void): () => void {
    const unsubAnomaly = eventBus.subscribe(PERMISSION_EVENTS.ANOMALY_DETECTED, (event) => {
      callback(event.payload as SecurityAnomalyEvent);
    });

    const unsubDenied = eventBus.subscribe(PERMISSION_EVENTS.ACCESS_DENIED, (event) => {
      callback(event.payload as AccessDeniedEvent);
    });

    return () => {
      unsubAnomaly();
      unsubDenied();
    };
  }
}

// Export singleton instance
export const permissionEventService = new PermissionEventService();
export default permissionEventService;
