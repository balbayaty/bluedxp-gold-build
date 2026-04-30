/**
 * HR Integration Service
 * Comprehensive integration with all BlueDXP modules
 * Event handlers, cross-module communication, data synchronization
 */

import { eventBus } from "@/lib/services/event-bus";
import { employeeService } from "../employee/employeeService";
import { attendanceService } from "../attendance/attendanceService";
import { overtimeService } from "../overtime/overtimeService";
import { performanceService } from "../performance/performanceService";
import { competencyMatrixService } from "../competency/competencyMatrixService";
import { kpiIntegrationService } from "./kpiIntegrationService";
import { slaIntegrationService } from "./slaIntegrationService";
import { notificationService } from "@/lib/services/notifications/notificationService";
import { employeeUserIntegrationService } from "./employeeUserIntegrationService";
import { qhseIntegrationService } from "./qhseIntegrationService";

// ============================================================================
// EVENT HANDLERS
// ============================================================================

class HRIntegrationService {
  /**
   * Initialize event handlers
   */
  initializeEventHandlers(): void {
    // Listen to WMS events
    eventBus.subscribe("wms.*", async (event) => {
      await this.handleWmsEvent(event);
    });

    // Listen to TMS events
    eventBus.subscribe("tms.*", async (event) => {
      await this.handleTmsEvent(event);
    });

    // Listen to process lifecycle events
    eventBus.subscribe("process.*", async (event) => {
      await this.handleProcessEvent(event);
    });

    // Listen to KPI/SLA events
    eventBus.subscribe("kpi.*", async (event) => {
      await this.handleKpiEvent(event);
    });

    eventBus.subscribe("sla.*", async (event) => {
      await this.handleSlaEvent(event);
    });

    // Listen to QHSE events
    eventBus.subscribe("qhse.*", async (event) => {
      await this.handleQHSEEvent(event);
    });

    // Listen to NCR events
    eventBus.subscribe("ncr.*", async (event) => {
      await this.handleNCREvent(event);
    });

    // Listen to CAPA events
    eventBus.subscribe("capa.*", async (event) => {
      await this.handleCAPAEvent(event);
    });
  }

  /**
   * Handle WMS events
   */
  private async handleWmsEvent(event: any): Promise<void> {
    // Example: When ASN is completed, check if employee worked overtime
    if (event.type === "wms.asn.completed") {
      const payload = event.payload;
      if (payload.employeeId) {
        // Check attendance and calculate overtime
        // Auto-create overtime request if applicable
      }
    }

    // Example: When picking task is assigned, link to employee performance
    if (event.type === "wms.picking.task.assigned") {
      const payload = event.payload;
      if (payload.assignedTo) {
        // Link task to employee for performance tracking
      }
    }
  }

  /**
   * Handle TMS events
   */
  private async handleTmsEvent(event: any): Promise<void> {
    // Example: When shipment is delivered, track driver performance
    if (event.type === "tms.shipment.delivered") {
      const payload = event.payload;
      if (payload.driverId) {
        // Update driver performance metrics
        // Check SLA compliance
      }
    }
  }

  /**
   * Handle process lifecycle events
   */
  private async handleProcessEvent(event: any): Promise<void> {
    // Example: When process stage completes, update employee KPI performance
    if (event.type === "process.stage.completed") {
      const payload = event.payload;
      if (payload.assignedTo) {
        // Update employee KPI performance
        // Check SLA compliance
      }
    }
  }

  /**
   * Handle KPI events
   */
  private async handleKpiEvent(event: any): Promise<void> {
    // Example: When KPI is calculated, update employee performance
    if (event.type === "kpi.calculated") {
      const payload = event.payload;
      // Update employee KPI dashboard
      // Check if competency requirements are met
    }
  }

  /**
   * Handle SLA events
   */
  private async handleSlaEvent(event: any): Promise<void> {
    // Example: When SLA is breached, notify employee and manager
    if (event.type === "sla.breached") {
      const payload = event.payload;
      if (payload.responsiblePartyId) {
        // Send notification
        // Update employee SLA performance
        // Check competency gaps
      }
    }
  }

  /**
   * Sync employee data with user management
   */
  async syncEmployeeWithUser(
    employeeId: string,
    userId: string,
  ): Promise<void> {
    // In real implementation, link employee to user account
    // Update employee record with userId
    await employeeService.updateEmployee({
      id: employeeId,
      updates: { userId },
    });

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "hr.employee.synced_with_user",
      aggregateId: employeeId,
      aggregateType: "employee",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { employeeId, userId },
    });
  }

  /**
   * Link employee to operational task
   */
  async linkEmployeeToTask(
    employeeId: string,
    taskId: string,
    taskType: "ASN" | "PICKING" | "PUTAWAY" | "SHIPMENT" | "CUSTOM",
    module: "WMS" | "TMS" | "CUSTOM",
  ): Promise<void> {
    // Publish event for cross-module integration
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "hr.employee.linked_to_task",
      aggregateId: employeeId,
      aggregateType: "employee",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        employeeId,
        taskId,
        taskType,
        module,
      },
    });
  }

  /**
   * Handle QHSE events
   */
  private async handleQHSEEvent(event: any): Promise<void> {
    // When QHSE incident is created and involves employee, link it
    if (event.type === "qhse.incident.created") {
      const { reportedById, affectedPersons, witnesses, investigators } =
        event.payload;

      if (reportedById) {
        await qhseIntegrationService.linkEmployeeToIncident(
          reportedById,
          event.payload.incidentId,
          "REPORTER",
        );
      }

      if (affectedPersons) {
        for (const person of affectedPersons) {
          if (person.employeeId) {
            await qhseIntegrationService.linkEmployeeToIncident(
              person.employeeId,
              event.payload.incidentId,
              "AFFECTED",
            );
          }
        }
      }

      if (witnesses) {
        for (const witness of witnesses) {
          if (witness.employeeId) {
            await qhseIntegrationService.linkEmployeeToIncident(
              witness.employeeId,
              event.payload.incidentId,
              "WITNESS",
            );
          }
        }
      }

      if (investigators) {
        for (const investigator of investigators) {
          if (investigator.employeeId) {
            await qhseIntegrationService.linkEmployeeToIncident(
              investigator.employeeId,
              event.payload.incidentId,
              "INVESTIGATOR",
            );
          }
        }
      }
    }

    // When QHSE inspection is assigned, link employee
    if (event.type === "qhse.inspection.assigned") {
      const { assignedToId, inspectors, auditees } = event.payload;

      if (assignedToId) {
        // Link as inspector
      }

      if (inspectors) {
        for (const inspector of inspectors) {
          if (inspector.employeeId) {
            // Link as inspector
          }
        }
      }

      if (auditees) {
        for (const auditee of auditees) {
          if (auditee.employeeId) {
            // Link as auditee
          }
        }
      }
    }
  }

  /**
   * Handle NCR events
   */
  private async handleNCREvent(event: any): Promise<void> {
    // When NCR is assigned to employee, link it
    if (event.type === "ncr.assigned" || event.type === "ncr.opened") {
      const { assignedTo, reportedBy, employeeId } = event.payload;

      if (assignedTo || employeeId) {
        const empId = employeeId || assignedTo;
        await qhseIntegrationService.linkEmployeeToNCR(
          empId,
          event.payload.ncrId,
          "ASSIGNED_TO",
        );
      }

      if (reportedBy) {
        // Find employee by email and link
        const employees = await employeeService.getEmployees(
          event.payload.tenantId || "",
        );
        const employee = employees.find((e) => e?.email === reportedBy);
        if (employee) {
          await qhseIntegrationService.linkEmployeeToNCR(
            employee.id,
            event.payload.ncrId,
            "REPORTED_BY",
          );
        }
      }
    }
  }

  /**
   * Handle CAPA events
   */
  private async handleCAPAEvent(event: any): Promise<void> {
    // When CAPA is assigned to employee, link it
    if (event.type === "capa.assigned" || event.type === "capa.opened") {
      const { assignedTo, owner, employeeId } = event.payload;

      if (assignedTo || employeeId) {
        const empId = employeeId || assignedTo;
        await qhseIntegrationService.linkEmployeeToCAPA(
          empId,
          event.payload.capaId,
          "ASSIGNED_TO",
        );
      }

      if (owner) {
        // Find employee by email and link
        const employees = await employeeService.getEmployees(
          event.payload.tenantId || "",
        );
        const employee = employees.find((e) => e?.email === owner);
        if (employee) {
          await qhseIntegrationService.linkEmployeeToCAPA(
            employee.id,
            event.payload.capaId,
            "OWNER",
          );
        }
      }
    }
  }
}

export const hrIntegrationService = new HRIntegrationService();

// Initialize event handlers on module load
if (typeof window === "undefined") {
  hrIntegrationService.initializeEventHandlers();
}
