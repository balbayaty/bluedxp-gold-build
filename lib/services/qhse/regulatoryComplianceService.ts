/**
 * QHSE Regulatory Compliance Service
 * Regulatory audit scheduling, tracking, and compliance management
 * Integrated with BlueDXP platform ecosystem
 */

import { eventBus } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { qhseIncidentService } from "./incidentService";
import type {
  RegulatoryAudit,
  QHSERegulatoryComplianceService,
  RegulatoryAuditFilters,
  ComplianceScoreFilters,
  SafetyMetricFilters,
  OSHALog,
} from "@/types/qhse";

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

class RegulatoryComplianceStore {
  private audits: Map<string, RegulatoryAudit> = new Map();
  private oshaLogs: Map<string, OSHALog> = new Map();

  getAudit(id: string): RegulatoryAudit | undefined {
    return this.audits.get(id);
  }

  setAudit(audit: RegulatoryAudit): void {
    this.audits.set(audit.id, audit);
  }

  getAllAudits(): RegulatoryAudit[] {
    return Array.from(this.audits.values());
  }

  getOSHALog(id: string): OSHALog | undefined {
    return this.oshaLogs.get(id);
  }

  setOSHALog(log: OSHALog): void {
    this.oshaLogs.set(log.id, log);
  }

  getAllOSHALogs(): OSHALog[] {
    return Array.from(this.oshaLogs.values());
  }
}

const store = new RegulatoryComplianceStore();

// ============================================================================
// REGULATORY COMPLIANCE SERVICE IMPLEMENTATION
// ============================================================================

class QHSERegulatoryComplianceServiceImpl implements QHSERegulatoryComplianceService {
  async scheduleAudit(
    data: Omit<RegulatoryAudit, "id" | "createdAt" | "updatedAt">,
  ): Promise<RegulatoryAudit> {
    try {
      const audit: RegulatoryAudit = {
        ...data,
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!audit.auditNumber) {
        audit.auditNumber = `AUD-${new Date().getFullYear()}-${String(store.getAllAudits().length + 1).padStart(5, "0")}`;
      }

      store.setAudit(audit);

      await knowledgeBaseService.store({
        entity: "qhse-regulatory-audit",
        id: audit.id,
        content: `Regulatory Audit: ${audit.auditNumber}\n\nType: ${audit.auditType}\nStandard: ${audit.regulatoryStandard}\nAuthority: ${audit.authority}\n\nScheduled: ${audit.scheduledDate}`,
        metadata: {
          auditType: audit.auditType,
          regulatoryStandard: audit.regulatoryStandard,
          status: audit.status,
          tenantId: audit.tenantId,
        },
      });

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.regulatory.audit.scheduled",
        aggregateId: audit.id,
        aggregateType: "QHSE_REGULATORY_AUDIT",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: audit,
      });

      return audit;
    } catch (error) {
      console.error("Error scheduling audit:", error);
      throw new Error(
        `Failed to schedule audit: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getAudit(id: string): Promise<RegulatoryAudit | null> {
    return store.getAudit(id) || null;
  }

  async getAudits(
    filters?: RegulatoryAuditFilters,
  ): Promise<RegulatoryAudit[]> {
    let audits = store.getAllAudits();

    if (filters) {
      if (filters.tenantId)
        audits = audits.filter((a) => a.tenantId === filters.tenantId);
      if (filters.customerId)
        audits = audits.filter((a) => a.customerId === filters.customerId);
      if (filters.warehouseId)
        audits = audits.filter((a) => a.warehouseId === filters.warehouseId);
      if (filters.facilityId)
        audits = audits.filter((a) => a.facilityId === filters.facilityId);
      if (filters.auditType)
        audits = audits.filter((a) => a.auditType === filters.auditType);
      if (filters.regulatoryStandard)
        audits = audits.filter(
          (a) => a.regulatoryStandard === filters.regulatoryStandard,
        );
      if (filters.status)
        audits = audits.filter((a) => a.status === filters.status);
      if (filters.dateFrom) {
        const dateFrom = new Date(filters.dateFrom);
        audits = audits.filter((a) => new Date(a.scheduledDate) >= dateFrom);
      }
      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo);
        audits = audits.filter((a) => new Date(a.scheduledDate) <= dateTo);
      }
    }

    return audits.sort(
      (a, b) =>
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime(),
    );
  }

  async updateAudit(
    id: string,
    data: Partial<RegulatoryAudit>,
  ): Promise<RegulatoryAudit> {
    const existing = store.getAudit(id);
    if (!existing) throw new Error(`Regulatory audit not found: ${id}`);

    const updated: RegulatoryAudit = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    store.setAudit(updated);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "qhse.regulatory.audit.updated",
      aggregateId: updated.id,
      aggregateType: "QHSE_REGULATORY_AUDIT",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: updated,
    });

    return updated;
  }

  async deleteAudit(id: string): Promise<void> {
    const audit = store.getAudit(id);
    if (!audit) throw new Error(`Regulatory audit not found: ${id}`);

    store.audits.delete(id);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "qhse.regulatory.audit.deleted",
      aggregateId: id,
      aggregateType: "QHSE_REGULATORY_AUDIT",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { id },
    });
  }

  async conductAudit(
    auditId: string,
    findings: RegulatoryAudit["auditFindings"],
  ): Promise<RegulatoryAudit> {
    const audit = store.getAudit(auditId);
    if (!audit) throw new Error(`Regulatory audit not found: ${auditId}`);

    const updated: RegulatoryAudit = {
      ...audit,
      auditFindings: findings,
      findings: findings?.length || 0,
      nonConformities:
        findings?.filter((f) => f.severity !== "OBSERVATION").length || 0,
      observations:
        findings?.filter((f) => f.severity === "OBSERVATION").length || 0,
      status: "COMPLETED",
      conductedDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Calculate score (simplified - in production, use more sophisticated calculation)
    if (findings && findings.length > 0) {
      const critical = findings.filter((f) => f.severity === "CRITICAL").length;
      const major = findings.filter((f) => f.severity === "MAJOR").length;
      const minor = findings.filter((f) => f.severity === "MINOR").length;
      const observations = findings.filter(
        (f) => f.severity === "OBSERVATION",
      ).length;

      // Score calculation: 100 - (critical*20 + major*10 + minor*5 + observations*1)
      updated.score = Math.max(
        0,
        100 - (critical * 20 + major * 10 + minor * 5 + observations * 1),
      );

      // Determine grade
      if (updated.score >= 90) updated.grade = "A";
      else if (updated.score >= 80) updated.grade = "B";
      else if (updated.score >= 70) updated.grade = "C";
      else if (updated.score >= 60) updated.grade = "D";
      else updated.grade = "F";

      updated.passed = updated.score >= 70;
    } else {
      updated.score = 100;
      updated.grade = "A";
      updated.passed = true;
    }

    store.setAudit(updated);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "qhse.regulatory.audit.completed",
      aggregateId: auditId,
      aggregateType: "QHSE_REGULATORY_AUDIT",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: updated,
    });

    return updated;
  }

  async getUpcomingAudits(days: number = 30): Promise<RegulatoryAudit[]> {
    const audits = store.getAllAudits();
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return audits
      .filter((a) => {
        if (a.status !== "SCHEDULED") return false;
        const scheduled = new Date(a.scheduledDate);
        return scheduled <= cutoffDate && scheduled > new Date();
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledDate).getTime() -
          new Date(b.scheduledDate).getTime(),
      );
  }

  async getComplianceScore(filters?: ComplianceScoreFilters): Promise<number> {
    // Simplified compliance score calculation
    // In production, this would consider multiple factors:
    // - Audit results
    // - Incident rates
    // - Training compliance
    // - Inspection findings
    // - Regulatory violations

    const audits = await this.getAudits({
      tenantId: filters?.tenantId,
      customerId: filters?.customerId,
      warehouseId: filters?.warehouseId,
      facilityId: filters?.facilityId,
      dateFrom: filters?.dateFrom,
      dateTo: filters?.dateTo,
    });

    if (audits.length === 0) return 100;

    const completedAudits = audits.filter(
      (a) => a.status === "COMPLETED" && a.score !== undefined,
    );
    if (completedAudits.length === 0) return 100;

    const averageScore =
      completedAudits.reduce((sum, a) => sum + (a.score || 0), 0) /
      completedAudits.length;
    return Math.round(averageScore);
  }

  async generateOSHALog(filters: SafetyMetricFilters): Promise<OSHALog> {
    const incidents = await qhseIncidentService.getIncidents({
      tenantId: filters.tenantId,
      customerId: filters.customerId,
      warehouseId: filters.warehouseId,
      facilityId: filters.facilityId,
      dateFrom: filters.periodStart,
      dateTo: filters.periodEnd,
    });

    const recordableIncidents = incidents.filter((i) => i.oshaRecordable);

    const year = filters.periodEnd
      ? new Date(filters.periodEnd).getFullYear()
      : new Date().getFullYear();

    const log: OSHALog = {
      id: `osha-${year}-${Date.now()}`,
      period: `${year}`,
      year,
      recordableIncidents: recordableIncidents.map((incident) => ({
        id: incident.id,
        incidentId: incident.id,
        employeeName: incident.peopleInvolved?.[0]?.personName || "Unknown",
        dateOfInjury: incident.occurredAt,
        description: incident.description,
        classification: incident.oshaClassification || "Other",
        daysAway: 0, // Would be calculated from incident data
        jobTransfer: false,
        restrictedWork: false,
      })),
      totalRecordableCases: recordableIncidents.length,
      totalDaysAway: 0, // Would be calculated
      totalJobTransfer: 0,
      totalRestrictedWork: 0,
      totalHoursWorked: 200000, // Would be fetched from employee records
      trir: await qhseIncidentService.calculateTRIR(filters),
      submitted: false,
    };

    store.setOSHALog(log);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "qhse.osha.log.generated",
      aggregateId: log.id,
      aggregateType: "QHSE_OSHA_LOG",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: log,
    });

    return log;
  }

  async submitOSHALog(logId: string): Promise<void> {
    const log = store.getOSHALog(logId);
    if (!log) throw new Error(`OSHA log not found: ${logId}`);

    const updated: OSHALog = {
      ...log,
      submitted: true,
      submittedAt: new Date().toISOString(),
      submittedBy: "", // Will be set by caller
    };

    store.setOSHALog(updated);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "qhse.osha.log.submitted",
      aggregateId: logId,
      aggregateType: "QHSE_OSHA_LOG",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: updated,
    });
  }
}

export const qhseRegulatoryComplianceService =
  new QHSERegulatoryComplianceServiceImpl();
export default qhseRegulatoryComplianceService;
