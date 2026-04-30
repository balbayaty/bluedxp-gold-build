/**
 * QHSE Training Management Service
 * Training program management, assignment, and compliance tracking
 * Integrated with BlueDXP platform ecosystem
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type {
  TrainingProgram,
  TrainingRecord,
  QHSETrainingService,
  TrainingProgramFilters,
  TrainingRecordFilters,
  TrainingComplianceReport,
} from "@/types/qhse";

// ============================================================================
// TYPE CONVERSION HELPERS
// ============================================================================

function prismaToTrainingProgram(prismaProgram: any): TrainingProgram {
  return {
    id: prismaProgram.id,
    tenantId: prismaProgram.tenantId,
    customerId: prismaProgram.customerId || undefined,
    programNumber: prismaProgram.programNumber,
    name: prismaProgram.name,
    description: prismaProgram.description || undefined,
    category: prismaProgram.category,
    type: prismaProgram.type as any,
    requiredForRoles: prismaProgram.requiredForRoles || [],
    requiredForDepartments: prismaProgram.requiredForDepartments || [],
    frequency: (prismaProgram.frequency as any) || undefined,
    validityPeriod: prismaProgram.validityPeriod || undefined,
    prerequisites: prismaProgram.prerequisites || [],
    content: prismaProgram.content || undefined,
    materials: prismaProgram.materials || [],
    duration: prismaProgram.duration || undefined,
    deliveryMethod: prismaProgram.deliveryMethod as any,
    regulatoryStandard: (prismaProgram.regulatoryStandard as any) || undefined,
    certificationRequired: prismaProgram.certificationRequired,
    certificationBody: prismaProgram.certificationBody || undefined,
    isActive: prismaProgram.isActive,
    isMandatory: prismaProgram.isMandatory,
    createdAt: prismaProgram.createdAt.toISOString(),
    updatedAt: prismaProgram.updatedAt.toISOString(),
    createdBy: prismaProgram.createdBy,
    updatedBy: prismaProgram.updatedBy,
  };
}

function prismaToTrainingRecord(
  prismaRecord: any,
  program?: TrainingProgram,
): TrainingRecord {
  return {
    id: prismaRecord.id,
    tenantId: prismaRecord.tenantId,
    customerId: prismaRecord.customerId || undefined,
    warehouseId: prismaRecord.warehouseId || undefined,
    trainingProgramId: prismaRecord.trainingProgramId,
    employeeId: prismaRecord.employeeId,
    employeeName: prismaRecord.employeeName || undefined,
    status: prismaRecord.status as any,
    progress: prismaRecord.progress,
    assignedDate: prismaRecord.assignedDate.toISOString(),
    startedDate: prismaRecord.startedDate?.toISOString() || undefined,
    completedDate: prismaRecord.completedDate?.toISOString() || undefined,
    expiryDate: prismaRecord.expiryDate?.toISOString() || undefined,
    dueDate: prismaRecord.dueDate?.toISOString() || undefined,
    completionPercentage: prismaRecord.completionPercentage || undefined,
    score: prismaRecord.score || undefined,
    passed: prismaRecord.passed,
    attempts: prismaRecord.attempts,
    certificationId: prismaRecord.certificationId || undefined,
    certificationNumber: prismaRecord.certificationNumber || undefined,
    certificationStatus: (prismaRecord.certificationStatus as any) || undefined,
    certificationIssuedDate:
      prismaRecord.certificationIssuedDate?.toISOString() || undefined,
    certificationExpiryDate:
      prismaRecord.certificationExpiryDate?.toISOString() || undefined,
    certificationBody: prismaRecord.certificationBody || undefined,
    instructorId: prismaRecord.instructorId || undefined,
    instructorName: prismaRecord.instructorName || undefined,
    certificate: prismaRecord.certificate || undefined,
    documents: prismaRecord.documents || [],
    notes: prismaRecord.notes || undefined,
    createdAt: prismaRecord.createdAt.toISOString(),
    updatedAt: prismaRecord.updatedAt.toISOString(),
    createdBy: prismaRecord.createdBy,
    updatedBy: prismaRecord.updatedBy,
    trainingProgram: program,
  };
}

// ============================================================================
// TRAINING SERVICE IMPLEMENTATION
// ============================================================================

class QHSETrainingServiceImpl implements QHSETrainingService {
  /**
   * Generate unique training program number
   */
  private async generateProgramNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.qHSETrainingProgram.count({
      where: {
        tenantId,
        programNumber: { startsWith: `TRG-${year}-` },
      },
    });
    return `TRG-${year}-${String(count + 1).padStart(5, "0")}`;
  }

  async createTrainingProgram(
    data: Omit<TrainingProgram, "id" | "createdAt" | "updatedAt">,
  ): Promise<TrainingProgram> {
    try {
      const programNumber =
        data.programNumber || (await this.generateProgramNumber(data.tenantId));

      const prismaProgram = await prisma.qHSETrainingProgram.create({
        data: {
          tenantId: data.tenantId,
          customerId: data.customerId,
          programNumber,
          name: data.name,
          description: data.description,
          category: data.category,
          type: data.type,
          requiredForRoles: data.requiredForRoles || [],
          requiredForDepartments: data.requiredForDepartments || [],
          frequency: data.frequency,
          validityPeriod: data.validityPeriod,
          prerequisites: data.prerequisites || [],
          content: data.content,
          materials: data.materials || [],
          duration: data.duration,
          deliveryMethod: data.deliveryMethod,
          regulatoryStandard: data.regulatoryStandard,
          certificationRequired: data.certificationRequired || false,
          certificationBody: data.certificationBody,
          isActive: data.isActive !== undefined ? data.isActive : true,
          isMandatory: data.isMandatory || false,
          createdBy: data.createdBy,
          updatedBy: data.updatedBy || data.createdBy,
        },
      });

      const program = prismaToTrainingProgram(prismaProgram);

      // Update Knowledge Base (non-blocking)
      try {
        await knowledgeBaseService.store({
          entity: "qhse-training-program",
          id: program.id,
          content: `Training Program: ${program.name}\n\nType: ${program.type}\nCategory: ${program.category}\n\nDescription: ${program.description}`,
          metadata: {
            type: program.type,
            category: program.category,
            tenantId: program.tenantId,
          },
        });
      } catch (kbError) {
        console.warn(
          "Failed to update knowledge base for training program:",
          kbError,
        );
      }

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.training.program.created",
        aggregateId: program.id,
        aggregateType: "QHSE_TRAINING_PROGRAM",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: program,
      });

      return program;
    } catch (error) {
      console.error("Error creating training program:", error);
      throw new Error(
        `Failed to create training program: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getTrainingProgram(id: string): Promise<TrainingProgram | null> {
    try {
      const prismaProgram = await prisma.qHSETrainingProgram.findUnique({
        where: { id },
      });

      if (!prismaProgram) return null;

      return prismaToTrainingProgram(prismaProgram);
    } catch (error) {
      console.error("Error fetching training program:", error);
      throw new Error(
        `Failed to fetch training program: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getTrainingPrograms(
    filters?: TrainingProgramFilters,
  ): Promise<TrainingProgram[]> {
    try {
      const where: any = {};

      if (filters) {
        if (filters.tenantId) where.tenantId = filters.tenantId;
        if (filters.customerId) where.customerId = filters.customerId;
        if (filters.category) where.category = filters.category;
        if (filters.type) where.type = filters.type;
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        if (filters.isMandatory !== undefined)
          where.isMandatory = filters.isMandatory;
      }

      const prismaPrograms = await prisma.qHSETrainingProgram.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      return prismaPrograms.map(prismaToTrainingProgram);
    } catch (error) {
      console.error("Error fetching training programs:", error);
      throw new Error(
        `Failed to fetch training programs: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async updateTrainingProgram(
    id: string,
    data: Partial<TrainingProgram>,
  ): Promise<TrainingProgram> {
    try {
      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.requiredForRoles !== undefined)
        updateData.requiredForRoles = data.requiredForRoles;
      if (data.requiredForDepartments !== undefined)
        updateData.requiredForDepartments = data.requiredForDepartments;
      if (data.frequency !== undefined) updateData.frequency = data.frequency;
      if (data.validityPeriod !== undefined)
        updateData.validityPeriod = data.validityPeriod;
      if (data.prerequisites !== undefined)
        updateData.prerequisites = data.prerequisites;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.materials !== undefined) updateData.materials = data.materials;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.deliveryMethod !== undefined)
        updateData.deliveryMethod = data.deliveryMethod;
      if (data.regulatoryStandard !== undefined)
        updateData.regulatoryStandard = data.regulatoryStandard;
      if (data.certificationRequired !== undefined)
        updateData.certificationRequired = data.certificationRequired;
      if (data.certificationBody !== undefined)
        updateData.certificationBody = data.certificationBody;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.isMandatory !== undefined)
        updateData.isMandatory = data.isMandatory;
      if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy;

      const prismaProgram = await prisma.qHSETrainingProgram.update({
        where: { id },
        data: updateData,
      });

      const updated = prismaToTrainingProgram(prismaProgram);

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.training.program.updated",
        aggregateId: updated.id,
        aggregateType: "QHSE_TRAINING_PROGRAM",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: updated,
      });

      return updated;
    } catch (error) {
      console.error("Error updating training program:", error);
      throw new Error(
        `Failed to update training program: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async deleteTrainingProgram(id: string): Promise<void> {
    try {
      await prisma.qHSETrainingProgram.delete({
        where: { id },
      });

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.training.program.deleted",
        aggregateId: id,
        aggregateType: "QHSE_TRAINING_PROGRAM",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: { id },
      });
    } catch (error) {
      console.error("Error deleting training program:", error);
      throw new Error(
        `Failed to delete training program: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async assignTraining(
    employeeId: string,
    trainingProgramId: string,
    dueDate?: Date,
    createdBy: string = "system",
  ): Promise<TrainingRecord> {
    try {
      const program = await prisma.qHSETrainingProgram.findUnique({
        where: { id: trainingProgramId },
      });

      if (!program)
        throw new Error(`Training program not found: ${trainingProgramId}`);

      const calculatedDueDate =
        dueDate ||
        (program.validityPeriod
          ? new Date(Date.now() + program.validityPeriod * 24 * 60 * 60 * 1000)
          : undefined);

      const prismaRecord = await prisma.qHSETrainingRecord.create({
        data: {
          tenantId: program.tenantId,
          customerId: program.customerId,
          trainingProgramId,
          employeeId,
          status: "NOT_STARTED",
          progress: 0,
          assignedDate: new Date(),
          dueDate: calculatedDueDate,
          passed: false,
          attempts: 0,
          createdBy,
          updatedBy: createdBy,
        },
      });

      const record = prismaToTrainingRecord(
        prismaRecord,
        prismaToTrainingProgram(program),
      );

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.training.assigned",
        aggregateId: record.id,
        aggregateType: "QHSE_TRAINING_RECORD",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: record,
      });

      return record;
    } catch (error) {
      console.error("Error assigning training:", error);
      throw new Error(
        `Failed to assign training: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getTrainingRecord(id: string): Promise<TrainingRecord | null> {
    try {
      const prismaRecord = await prisma.qHSETrainingRecord.findUnique({
        where: { id },
      });

      if (!prismaRecord) return null;

      const program = await prisma.qHSETrainingProgram.findUnique({
        where: { id: prismaRecord.trainingProgramId },
      });

      return prismaToTrainingRecord(
        prismaRecord,
        program ? prismaToTrainingProgram(program) : undefined,
      );
    } catch (error) {
      console.error("Error fetching training record:", error);
      throw new Error(
        `Failed to fetch training record: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getTrainingRecords(
    filters?: TrainingRecordFilters,
  ): Promise<TrainingRecord[]> {
    try {
      const where: any = {};

      if (filters) {
        if (filters.tenantId) where.tenantId = filters.tenantId;
        if (filters.customerId) where.customerId = filters.customerId;
        if (filters.warehouseId) where.warehouseId = filters.warehouseId;
        if (filters.employeeId) where.employeeId = filters.employeeId;
        if (filters.trainingProgramId)
          where.trainingProgramId = filters.trainingProgramId;
        if (filters.status) where.status = filters.status;
        if (filters.certificationStatus)
          where.certificationStatus = filters.certificationStatus;
        if (filters.expiryDateFrom || filters.expiryDateTo) {
          where.expiryDate = {};
          if (filters.expiryDateFrom)
            where.expiryDate.gte = new Date(filters.expiryDateFrom);
          if (filters.expiryDateTo)
            where.expiryDate.lte = new Date(filters.expiryDateTo);
        }
      }

      const prismaRecords = await prisma.qHSETrainingRecord.findMany({
        where,
        orderBy: { assignedDate: "desc" },
      });

      // Load programs in batch
      const programIds = [
        ...new Set(prismaRecords.map((r) => r.trainingProgramId)),
      ];
      const programs = await prisma.qHSETrainingProgram.findMany({
        where: { id: { in: programIds } },
      });

      const programMap = new Map(
        programs.map((p) => [p.id, prismaToTrainingProgram(p)]),
      );

      return prismaRecords.map((record) =>
        prismaToTrainingRecord(
          record,
          programMap.get(record.trainingProgramId),
        ),
      );
    } catch (error) {
      console.error("Error fetching training records:", error);
      throw new Error(
        `Failed to fetch training records: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async updateTrainingProgress(
    recordId: string,
    progress: number,
  ): Promise<TrainingRecord> {
    try {
      const clampedProgress = Math.min(100, Math.max(0, progress));
      const status =
        clampedProgress === 0
          ? "NOT_STARTED"
          : clampedProgress === 100
            ? "COMPLETED"
            : "IN_PROGRESS";

      const existing = await prisma.qHSETrainingRecord.findUnique({
        where: { id: recordId },
      });

      if (!existing) throw new Error(`Training record not found: ${recordId}`);

      const updateData: any = {
        progress: clampedProgress,
        status,
      };

      if (clampedProgress > 0 && !existing.startedDate) {
        updateData.startedDate = new Date();
      }

      const prismaRecord = await prisma.qHSETrainingRecord.update({
        where: { id: recordId },
        data: updateData,
      });

      const program = await prisma.qHSETrainingProgram.findUnique({
        where: { id: prismaRecord.trainingProgramId },
      });

      const updated = prismaToTrainingRecord(
        prismaRecord,
        program ? prismaToTrainingProgram(program) : undefined,
      );

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.training.progress.updated",
        aggregateId: recordId,
        aggregateType: "QHSE_TRAINING_RECORD",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: updated,
      });

      return updated;
    } catch (error) {
      console.error("Error updating training progress:", error);
      throw new Error(
        `Failed to update training progress: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async completeTraining(
    recordId: string,
    score?: number,
  ): Promise<TrainingRecord> {
    try {
      const existing = await prisma.qHSETrainingRecord.findUnique({
        where: { id: recordId },
      });

      if (!existing) throw new Error(`Training record not found: ${recordId}`);

      const program = await prisma.qHSETrainingProgram.findUnique({
        where: { id: existing.trainingProgramId },
      });

      const passed = score !== undefined ? score >= 70 : true; // Default passing score: 70%

      const updateData: any = {
        status: "COMPLETED",
        progress: 100,
        completedDate: new Date(),
        score,
        passed,
        attempts: (existing.attempts || 0) + 1,
      };

      // Set expiry date if program has validity period
      if (program?.validityPeriod) {
        updateData.expiryDate = new Date(
          Date.now() + program.validityPeriod * 24 * 60 * 60 * 1000,
        );
        updateData.certificationStatus = "VALID";
      }

      // Generate certification if required
      if (program?.certificationRequired && passed) {
        updateData.certificationId = `cert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        updateData.certificationNumber = `CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, "0")}`;
        updateData.certificationStatus = "VALID";
        updateData.certificationIssuedDate = new Date();
        if (program.validityPeriod) {
          updateData.certificationExpiryDate = new Date(
            Date.now() + program.validityPeriod * 24 * 60 * 60 * 1000,
          );
        }
        updateData.certificationBody = program.certificationBody;
      }

      const prismaRecord = await prisma.qHSETrainingRecord.update({
        where: { id: recordId },
        data: updateData,
      });

      const updated = prismaToTrainingRecord(
        prismaRecord,
        program ? prismaToTrainingProgram(program) : undefined,
      );

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.training.completed",
        aggregateId: recordId,
        aggregateType: "QHSE_TRAINING_RECORD",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: updated,
      });

      return updated;
    } catch (error) {
      console.error("Error completing training:", error);
      throw new Error(
        `Failed to complete training: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getTrainingCompliance(
    employeeId?: string,
    roleId?: string,
  ): Promise<TrainingComplianceReport> {
    try {
      const recordWhere: any = {};
      if (employeeId) {
        recordWhere.employeeId = employeeId;
      }

      const [records, programs] = await Promise.all([
        prisma.qHSETrainingRecord.findMany({
          where: recordWhere,
        }),
        prisma.qHSETrainingProgram.findMany({
          where: { isMandatory: true, isActive: true },
        }),
      ]);

      const mandatoryPrograms = programs.map(prismaToTrainingProgram);
      const completedPrograms = records.filter(
        (r) => r.status === "COMPLETED" && r.passed,
      );
      const inProgressPrograms = records.filter(
        (r) => r.status === "IN_PROGRESS",
      );
      const expiredPrograms = records.filter(
        (r) =>
          r.certificationStatus === "EXPIRED" ||
          (r.expiryDate && new Date(r.expiryDate) < new Date()),
      );

      const complianceRate =
        mandatoryPrograms.length > 0
          ? Math.round(
              (completedPrograms.length / mandatoryPrograms.length) * 100,
            )
          : 100;

      // Load program names
      const programMap = new Map(programs.map((p) => [p.id, p.name]));

      return {
        employeeId,
        roleId,
        totalPrograms: mandatoryPrograms.length,
        completedPrograms: completedPrograms.length,
        inProgressPrograms: inProgressPrograms.length,
        expiredPrograms: expiredPrograms.length,
        complianceRate,
        programs: records.map((r) => ({
          programId: r.trainingProgramId,
          programName: programMap.get(r.trainingProgramId) || "Unknown",
          status: r.status as any,
          completionDate: r.completedDate?.toISOString(),
          expiryDate: r.expiryDate?.toISOString(),
          certificationStatus: r.certificationStatus as any,
        })),
      };
    } catch (error) {
      console.error("Error getting training compliance:", error);
      throw new Error(
        `Failed to get training compliance: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getExpiringCertifications(
    days: number = 30,
  ): Promise<TrainingRecord[]> {
    try {
      const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      const now = new Date();

      const prismaRecords = await prisma.qHSETrainingRecord.findMany({
        where: {
          expiryDate: {
            gte: now,
            lte: cutoffDate,
          },
          certificationStatus: { not: "EXPIRED" },
        },
      });

      // Load programs
      const programIds = [
        ...new Set(prismaRecords.map((r) => r.trainingProgramId)),
      ];
      const programs = await prisma.qHSETrainingProgram.findMany({
        where: { id: { in: programIds } },
      });

      const programMap = new Map(
        programs.map((p) => [p.id, prismaToTrainingProgram(p)]),
      );

      return prismaRecords.map((record) =>
        prismaToTrainingRecord(
          record,
          programMap.get(record.trainingProgramId),
        ),
      );
    } catch (error) {
      console.error("Error getting expiring certifications:", error);
      throw new Error(
        `Failed to get expiring certifications: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export const qhseTrainingService = new QHSETrainingServiceImpl();
export default qhseTrainingService;
