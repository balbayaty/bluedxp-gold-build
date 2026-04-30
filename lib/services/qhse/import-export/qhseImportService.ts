/**
 * QHSE Import Service
 * Import incidents, inspections, training from Excel/CSV
 * Integrated with bulk operations
 */

import { bulkOperationService } from "../bulk/bulkOperationService";
import { qhseIncidentService } from "../incidentService";
import { qhseInspectionService } from "../inspectionService";
import { qhseTrainingService } from "../trainingService";
import type { Incident, Inspection, TrainingRecord } from "@/types/qhse";

// ============================================================================
// IMPORT TYPES
// ============================================================================

export interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  operationId?: string;
}

export interface ImportMapping {
  sourceField: string;
  targetField: string;
  transform?: (value: any) => any;
}

// ============================================================================
// IMPORT SERVICE
// ============================================================================

class QHSEImportService {
  /**
   * Import incidents from data array
   */
  async importIncidents(
    data: any[],
    mapping: ImportMapping[],
    tenantId: string,
    createdBy: string,
  ): Promise<ImportResult> {
    const incidents: Array<Omit<Incident, "id" | "createdAt" | "updatedAt">> =
      [];
    const errors: Array<{ row: number; error: string; data?: any }> = [];

    // Map data
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        const incident: any = {
          tenantId,
          createdBy,
        };

        // Apply mapping
        for (const map of mapping) {
          const value = row[map.sourceField];
          if (value !== undefined && value !== null && value !== "") {
            incident[map.targetField] = map.transform
              ? map.transform(value)
              : value;
          }
        }

        // Validate required fields
        if (!incident.title || !incident.type || !incident.severity) {
          throw new Error("Missing required fields: title, type, or severity");
        }

        // Set defaults
        incident.status = incident.status || "REPORTED";
        incident.occurredAt = incident.occurredAt || new Date().toISOString();
        incident.reportedAt = incident.reportedAt || new Date().toISOString();

        incidents.push(incident as any);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Unknown error",
          data: data[i],
        });
      }
    }

    // Bulk create
    if (incidents.length > 0) {
      const result = await bulkOperationService.bulkCreateIncidents(
        incidents,
        createdBy,
      );
      return {
        success: result.failed === 0,
        total: data.length,
        imported: result.successful,
        failed: result.failed + errors.length,
        errors: [
          ...errors,
          ...result.errors.map((e) => ({ row: e.index + 1, error: e.error })),
        ],
        operationId: result.operationId,
      };
    }

    return {
      success: false,
      total: data.length,
      imported: 0,
      failed: data.length,
      errors,
    };
  }

  /**
   * Import inspections from data array
   */
  async importInspections(
    data: any[],
    mapping: ImportMapping[],
    tenantId: string,
    createdBy: string,
  ): Promise<ImportResult> {
    const inspections: Array<
      Omit<Inspection, "id" | "createdAt" | "updatedAt">
    > = [];
    const errors: Array<{ row: number; error: string; data?: any }> = [];

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        const inspection: any = {
          tenantId,
          createdBy,
        };

        // Apply mapping
        for (const map of mapping) {
          const value = row[map.sourceField];
          if (value !== undefined && value !== null && value !== "") {
            inspection[map.targetField] = map.transform
              ? map.transform(value)
              : value;
          }
        }

        // Validate required fields
        if (
          !inspection.title ||
          !inspection.type ||
          !inspection.scheduledDate
        ) {
          throw new Error(
            "Missing required fields: title, type, or scheduledDate",
          );
        }

        // Set defaults
        inspection.status = inspection.status || "SCHEDULED";
        inspection.followUpRequired = inspection.followUpRequired || false;

        inspections.push(inspection as any);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Unknown error",
          data: data[i],
        });
      }
    }

    if (inspections.length > 0) {
      const result = await bulkOperationService.bulkScheduleInspections(
        inspections,
        createdBy,
      );
      return {
        success: result.failed === 0,
        total: data.length,
        imported: result.successful,
        failed: result.failed + errors.length,
        errors: [
          ...errors,
          ...result.errors.map((e) => ({ row: e.index + 1, error: e.error })),
        ],
        operationId: result.operationId,
      };
    }

    return {
      success: false,
      total: data.length,
      imported: 0,
      failed: data.length,
      errors,
    };
  }

  /**
   * Import training assignments from data array
   */
  async importTrainingAssignments(
    data: any[],
    mapping: ImportMapping[],
    createdBy: string,
  ): Promise<ImportResult> {
    const assignments: Array<{
      employeeId: string;
      trainingProgramId: string;
      dueDate?: Date;
    }> = [];
    const errors: Array<{ row: number; error: string; data?: any }> = [];

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        const assignment: any = {};

        // Apply mapping
        for (const map of mapping) {
          const value = row[map.sourceField];
          if (value !== undefined && value !== null && value !== "") {
            assignment[map.targetField] = map.transform
              ? map.transform(value)
              : value;
          }
        }

        // Validate required fields
        if (!assignment.employeeId || !assignment.trainingProgramId) {
          throw new Error(
            "Missing required fields: employeeId or trainingProgramId",
          );
        }

        // Parse due date
        if (assignment.dueDate && typeof assignment.dueDate === "string") {
          assignment.dueDate = new Date(assignment.dueDate);
        }

        assignments.push(assignment);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Unknown error",
          data: data[i],
        });
      }
    }

    if (assignments.length > 0) {
      const result = await bulkOperationService.bulkAssignTraining(
        assignments,
        createdBy,
      );
      return {
        success: result.failed === 0,
        total: data.length,
        imported: result.successful,
        failed: result.failed + errors.length,
        errors: [
          ...errors,
          ...result.errors.map((e) => ({ row: e.index + 1, error: e.error })),
        ],
        operationId: result.operationId,
      };
    }

    return {
      success: false,
      total: data.length,
      imported: 0,
      failed: data.length,
      errors,
    };
  }

  /**
   * Get default mapping for incidents
   */
  getDefaultIncidentMapping(): ImportMapping[] {
    return [
      { sourceField: "Title", targetField: "title" },
      { sourceField: "Description", targetField: "description" },
      {
        sourceField: "Type",
        targetField: "type",
        transform: (v) => v.toUpperCase().replace(" ", "_"),
      },
      {
        sourceField: "Severity",
        targetField: "severity",
        transform: (v) => v.toUpperCase(),
      },
      { sourceField: "Location", targetField: "location" },
      {
        sourceField: "Occurred Date",
        targetField: "occurredAt",
        transform: (v) => new Date(v).toISOString(),
      },
      { sourceField: "Reported By", targetField: "reportedBy" },
    ];
  }

  /**
   * Get default mapping for inspections
   */
  getDefaultInspectionMapping(): ImportMapping[] {
    return [
      { sourceField: "Title", targetField: "title" },
      {
        sourceField: "Type",
        targetField: "type",
        transform: (v) => v.toUpperCase().replace(" ", "_"),
      },
      {
        sourceField: "Scheduled Date",
        targetField: "scheduledDate",
        transform: (v) => new Date(v).toISOString(),
      },
      { sourceField: "Location", targetField: "location" },
      { sourceField: "Scheduled By", targetField: "scheduledBy" },
    ];
  }
}

export const qhseImportService = new QHSEImportService();
