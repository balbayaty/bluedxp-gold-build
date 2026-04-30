/**
 * QHSE Integration Service
 * Integrates HR employees with QHSE module (incidents, inspections, training, NCR, CAPA)
 */

import { employeeService } from "../employee/employeeService";
import { eventBus } from "@/lib/services/event-bus";

// ============================================================================
// TYPES
// ============================================================================

export interface EmployeeQHSEData {
  employeeId: string;
  incidents: Array<{
    id: string;
    type: string;
    role: "REPORTER" | "AFFECTED" | "WITNESS" | "INVESTIGATOR";
    date: Date | string;
    status: string;
  }>;
  inspections: Array<{
    id: string;
    type: string;
    role: "INSPECTOR" | "AUDITEE";
    date: Date | string;
    status: string;
  }>;
  training: Array<{
    id: string;
    programName: string;
    type: "HR" | "QHSE";
    completedDate?: Date | string;
    dueDate?: Date | string;
    status: string;
  }>;
  ncr: Array<{
    id: string;
    role: "ASSIGNED_TO" | "REPORTED_BY";
    date: Date | string;
    status: string;
  }>;
  capa: Array<{
    id: string;
    role: "ASSIGNED_TO" | "OWNER";
    date: Date | string;
    status: string;
  }>;
}

export interface UnifiedTraining {
  employeeId: string;
  training: Array<{
    id: string;
    programName: string;
    type: "HR" | "QHSE";
    source: "HR" | "QHSE";
    completedDate?: Date | string;
    dueDate?: Date | string;
    status: string;
    certification?: {
      name: string;
      expiryDate?: Date | string;
    };
  }>;
}

// ============================================================================
// SERVICE
// ============================================================================

class QHSEIntegrationService {
  // In-memory storage for employee-QHSE links (fallback)
  private employeeIncidentLinks: Map<
    string,
    Array<{ employeeId: string; incidentId: string; role: string }>
  > = new Map();
  private employeeNCRLinks: Map<
    string,
    Array<{ employeeId: string; ncrId: string; role: string }>
  > = new Map();
  private employeeCAPALinks: Map<
    string,
    Array<{ employeeId: string; capaId: string; role: string }>
  > = new Map();

  /**
   * Get QHSE data for employee
   */
  async getEmployeeQHSEData(employeeId: string): Promise<EmployeeQHSEData> {
    try {
      // In a real implementation, fetch from database/API
      // For now, return structured data with fallback
      const incidents = this.employeeIncidentLinks.get(employeeId) || [];
      const ncr = this.employeeNCRLinks.get(employeeId) || [];
      const capa = this.employeeCAPALinks.get(employeeId) || [];

      // Fetch from QHSE API (mock for now)
      const qhseResponse = await fetch(
        `/api/qhse/employee/${employeeId}`,
      ).catch(() => null);
      let qhseData: any = { incidents: [], inspections: [], training: [] };

      if (qhseResponse?.ok) {
        const data = await qhseResponse.json();
        qhseData = data.data || qhseData;
      }

      return {
        employeeId,
        incidents: [
          ...incidents.map((link) => ({
            id: link.incidentId,
            type: "INCIDENT",
            role: link.role as any,
            date: new Date().toISOString(),
            status: "ACTIVE",
          })),
          ...(qhseData.incidents || []),
        ],
        inspections: qhseData.inspections || [],
        training: qhseData.training || [],
        ncr: ncr.map((link) => ({
          id: link.ncrId,
          role: link.role as any,
          date: new Date().toISOString(),
          status: "ACTIVE",
        })),
        capa: capa.map((link) => ({
          id: link.capaId,
          role: link.role as any,
          date: new Date().toISOString(),
          status: "ACTIVE",
        })),
      };
    } catch (error) {
      console.error("Error fetching employee QHSE data:", error);
      // Return empty structure on error
      return {
        employeeId,
        incidents: [],
        inspections: [],
        training: [],
        ncr: [],
        capa: [],
      };
    }
  }

  /**
   * Get unified training (HR + QHSE, no duplication)
   */
  async getUnifiedTraining(employeeId: string): Promise<UnifiedTraining> {
    try {
      // Fetch HR training
      const hrTraining = await fetch(
        `/api/hr/training?employeeId=${employeeId}`,
      ).catch(() => null);
      let hrTrainingData: any[] = [];

      if (hrTraining?.ok) {
        const data = await hrTraining.json();
        hrTrainingData = data.data || [];
      }

      // Fetch QHSE training
      const qhseTraining = await fetch(
        `/api/qhse/training?employeeId=${employeeId}`,
      ).catch(() => null);
      let qhseTrainingData: any[] = [];

      if (qhseTraining?.ok) {
        const data = await qhseTraining.json();
        qhseTrainingData = data.data || [];
      }

      // Merge and deduplicate by program name
      const trainingMap = new Map<string, any>();

      hrTrainingData.forEach((t) => {
        const key = t.programName || t.name || t.id;
        if (!trainingMap.has(key)) {
          trainingMap.set(key, {
            ...t,
            type: "HR" as const,
            source: "HR" as const,
          });
        }
      });

      qhseTrainingData.forEach((t) => {
        const key = t.programName || t.name || t.id;
        if (!trainingMap.has(key)) {
          trainingMap.set(key, {
            ...t,
            type: "QHSE" as const,
            source: "QHSE" as const,
          });
        }
      });

      return {
        employeeId,
        training: Array.from(trainingMap.values()),
      };
    } catch (error) {
      console.error("Error fetching unified training:", error);
      return {
        employeeId,
        training: [],
      };
    }
  }

  /**
   * Link employee to QHSE incident
   */
  async linkEmployeeToIncident(
    employeeId: string,
    incidentId: string,
    role: "REPORTER" | "AFFECTED" | "WITNESS" | "INVESTIGATOR",
  ): Promise<void> {
    try {
      const links = this.employeeIncidentLinks.get(employeeId) || [];
      if (!links.find((l) => l.incidentId === incidentId && l.role === role)) {
        links.push({ employeeId, incidentId, role });
        this.employeeIncidentLinks.set(employeeId, links);
      }

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "hr.qhse.employee_linked_to_incident",
        aggregateId: employeeId,
        aggregateType: "employee",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: { employeeId, incidentId, role },
      });
    } catch (error) {
      console.error("Error linking employee to incident:", error);
    }
  }

  /**
   * Link employee to NCR
   */
  async linkEmployeeToNCR(
    employeeId: string,
    ncrId: string,
    role: "ASSIGNED_TO" | "REPORTED_BY",
  ): Promise<void> {
    try {
      const links = this.employeeNCRLinks.get(employeeId) || [];
      if (!links.find((l) => l.ncrId === ncrId && l.role === role)) {
        links.push({ employeeId, ncrId, role });
        this.employeeNCRLinks.set(employeeId, links);
      }

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "hr.qhse.employee_linked_to_ncr",
        aggregateId: employeeId,
        aggregateType: "employee",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: { employeeId, ncrId, role },
      });
    } catch (error) {
      console.error("Error linking employee to NCR:", error);
    }
  }

  /**
   * Link employee to CAPA
   */
  async linkEmployeeToCAPA(
    employeeId: string,
    capaId: string,
    role: "ASSIGNED_TO" | "OWNER",
  ): Promise<void> {
    try {
      const links = this.employeeCAPALinks.get(employeeId) || [];
      if (!links.find((l) => l.capaId === capaId && l.role === role)) {
        links.push({ employeeId, capaId, role });
        this.employeeCAPALinks.set(employeeId, links);
      }

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "hr.qhse.employee_linked_to_capa",
        aggregateId: employeeId,
        aggregateType: "employee",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: { employeeId, capaId, role },
      });
    } catch (error) {
      console.error("Error linking employee to CAPA:", error);
    }
  }
}

export const qhseIntegrationService = new QHSEIntegrationService();
