/**
 * Audit Logger
 * Convenience functions for common audit logging scenarios
 */

import { auditService, AuditAction, EntityType } from './auditService'

export interface AuditContext {
  userId: string
  userName?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  requestId?: string
  tenantId?: string
  location?: string
}

export class AuditLogger {
  /**
   * Log chemical creation
   */
  static async logChemicalCreate(chemicalId: string, chemicalName: string, context: AuditContext): Promise<void> {
    await auditService.log({
      entityType: 'chemical',
      entityId: chemicalId,
      action: 'create',
      userId: context.userId,
      userName: context.userName,
      metadata: {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        requestId: context.requestId,
        tenantId: context.tenantId,
        location: context.location,
      },
      compliance: {
        requiresAudit: true,
        complianceType: 'chemical_management',
        regulatoryRequirement: 'OSHA_HazCom',
      },
    })
  }

  /**
   * Log chemical update
   */
  static async logChemicalUpdate(
    chemicalId: string,
    changes: Array<{ field: string; oldValue: any; newValue: any }>,
    context: AuditContext
  ): Promise<void> {
    await auditService.log({
      entityType: 'chemical',
      entityId: chemicalId,
      action: 'update',
      userId: context.userId,
      userName: context.userName,
      changes,
      metadata: {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        requestId: context.requestId,
        tenantId: context.tenantId,
        location: context.location,
      },
      compliance: {
        requiresAudit: true,
        complianceType: 'chemical_management',
        regulatoryRequirement: 'OSHA_HazCom',
      },
    })
  }

  /**
   * Log MSDS approval
   */
  static async logMSDSApproval(msdsId: string, context: AuditContext): Promise<void> {
    await auditService.log({
      entityType: 'msds',
      entityId: msdsId,
      action: 'approve',
      userId: context.userId,
      userName: context.userName,
      metadata: {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        requestId: context.requestId,
        tenantId: context.tenantId,
        location: context.location,
      },
      compliance: {
        requiresAudit: true,
        complianceType: 'msds_approval',
        regulatoryRequirement: 'GHS_Compliance',
      },
    })
  }

  /**
   * Log MSDS rejection
   */
  static async logMSDSRejection(msdsId: string, reason: string, context: AuditContext): Promise<void> {
    await auditService.log({
      entityType: 'msds',
      entityId: msdsId,
      action: 'reject',
      userId: context.userId,
      userName: context.userName,
      changes: [{
        field: 'rejection_reason',
        oldValue: null,
        newValue: reason,
      }],
      metadata: {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        requestId: context.requestId,
        tenantId: context.tenantId,
        location: context.location,
      },
      compliance: {
        requiresAudit: true,
        complianceType: 'msds_approval',
        regulatoryRequirement: 'GHS_Compliance',
      },
    })
  }

  /**
   * Log container transfer
   */
  static async logContainerTransfer(
    containerId: string,
    fromLocation: string,
    toLocation: string,
    context: AuditContext
  ): Promise<void> {
    await auditService.log({
      entityType: 'container',
      entityId: containerId,
      action: 'update',
      userId: context.userId,
      userName: context.userName,
      changes: [{
        field: 'location',
        oldValue: fromLocation,
        newValue: toLocation,
      }],
      metadata: {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        requestId: context.requestId,
        tenantId: context.tenantId,
        location: context.location,
      },
      compliance: {
        requiresAudit: true,
        complianceType: 'inventory_management',
        regulatoryRequirement: 'Container_Tracking',
      },
    })
  }

  /**
   * Log data export
   */
  static async logDataExport(
    entityType: EntityType,
    format: string,
    recordCount: number,
    context: AuditContext
  ): Promise<void> {
    await auditService.log({
      entityType,
      entityId: 'export',
      action: 'export',
      userId: context.userId,
      userName: context.userName,
      changes: [{
        field: 'export_details',
        oldValue: null,
        newValue: { format, recordCount },
      }],
      metadata: {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        requestId: context.requestId,
        tenantId: context.tenantId,
        location: context.location,
      },
      compliance: {
        requiresAudit: true,
        complianceType: 'data_export',
        regulatoryRequirement: 'Data_Privacy',
      },
    })
  }

  /**
   * Log user login
   */
  static async logUserLogin(userId: string, userName: string, context: AuditContext): Promise<void> {
    await auditService.log({
      entityType: 'user',
      entityId: userId,
      action: 'login',
      userId,
      userName,
      metadata: {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        requestId: context.requestId,
        tenantId: context.tenantId,
        location: context.location,
      },
      compliance: {
        requiresAudit: true,
        complianceType: 'security',
        regulatoryRequirement: 'Access_Control',
      },
    })
  }

  /**
   * Log access denied
   */
  static async logAccessDenied(
    entityType: EntityType,
    entityId: string,
    reason: string,
    context: AuditContext
  ): Promise<void> {
    await auditService.log({
      entityType,
      entityId,
      action: 'access_denied',
      userId: context.userId,
      userName: context.userName,
      changes: [{
        field: 'denial_reason',
        oldValue: null,
        newValue: reason,
      }],
      metadata: {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        requestId: context.requestId,
        tenantId: context.tenantId,
        location: context.location,
      },
      compliance: {
        requiresAudit: true,
        complianceType: 'security',
        regulatoryRequirement: 'Access_Control',
      },
    })
  }

  /**
   * Log compliance check
   */
  static async logComplianceCheck(
    entityType: EntityType,
    entityId: string,
    complianceType: string,
    result: 'pass' | 'fail' | 'warning',
    context: AuditContext
  ): Promise<void> {
    await auditService.log({
      entityType,
      entityId,
      action: 'view',
      userId: context.userId,
      userName: context.userName,
      changes: [{
        field: 'compliance_check',
        oldValue: null,
        newValue: { complianceType, result },
      }],
      metadata: {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        requestId: context.requestId,
        tenantId: context.tenantId,
        location: context.location,
      },
      compliance: {
        requiresAudit: true,
        complianceType,
        regulatoryRequirement: 'Compliance_Monitoring',
      },
    })
  }
}

/**
 * Backwards-compatible singleton export expected by `lib/services/audit/index.ts`.
 */
export const auditLogger = new AuditLogger()











