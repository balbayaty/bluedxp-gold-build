/**
 * QHSE Inspection Management Service
 * Comprehensive inspection scheduling, conducting, and tracking
 * Integrated with BlueDXP platform ecosystem
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-store";
import { evidenceService } from "@/lib/services/evidence";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type {
  Inspection,
  InspectionChecklistItem,
  InspectionFinding,
  QHSEInspectionService,
  InspectionFilters,
} from "@/types/qhse";

// ============================================================================
// TYPE CONVERSION HELPERS
// ============================================================================

function prismaToInspection(prismaInspection: any): Inspection {
  return {
    id: prismaInspection.id,
    tenantId: prismaInspection.tenantId,
    customerId: prismaInspection.customerId || undefined,
    warehouseId: prismaInspection.warehouseId || undefined,
    facilityId: prismaInspection.facilityId || undefined,
    inspectionNumber: prismaInspection.inspectionNumber,
    type: prismaInspection.type as any,
    status: prismaInspection.status as any,
    title: prismaInspection.title,
    description: prismaInspection.description || undefined,
    scheduledDate: prismaInspection.scheduledDate.toISOString(),
    scheduledBy: prismaInspection.scheduledBy,
    conductedDate: prismaInspection.conductedDate?.toISOString() || undefined,
    conductedBy: prismaInspection.conductedBy || undefined,
    duration: prismaInspection.duration || undefined,
    location: prismaInspection.location,
    locationDetails: prismaInspection.locationDetails || undefined,
    checklistId: prismaInspection.checklistId || undefined,
    checklistItems: (prismaInspection.checklistItems as any) || [],
    findings: (prismaInspection.findings as any) || [],
    totalFindings: prismaInspection.totalFindings,
    criticalFindings: prismaInspection.criticalFindings,
    majorFindings: prismaInspection.majorFindings,
    minorFindings: prismaInspection.minorFindings,
    observations: prismaInspection.observations,
    complianceScore: prismaInspection.complianceScore || undefined,
    regulatoryStandard:
      (prismaInspection.regulatoryStandard as any) || undefined,
    correctiveActionsRequired: prismaInspection.correctiveActionsRequired || [],
    followUpDate: prismaInspection.followUpDate?.toISOString() || undefined,
    followUpRequired: prismaInspection.followUpRequired,
    documents: prismaInspection.documents || [],
    photos: prismaInspection.photos || [],
    approvedBy: prismaInspection.approvedBy || undefined,
    approvedAt: prismaInspection.approvedAt?.toISOString() || undefined,
    tags: prismaInspection.tags || [],
    notes: prismaInspection.notes || undefined,
    createdAt: prismaInspection.createdAt.toISOString(),
    updatedAt: prismaInspection.updatedAt.toISOString(),
    createdBy: prismaInspection.createdBy,
    updatedBy: prismaInspection.updatedBy,
  };
}

// ============================================================================
// INSPECTION SERVICE IMPLEMENTATION
// ============================================================================

class QHSEInspectionServiceImpl implements QHSEInspectionService {
  /**
   * Generate unique inspection number
   */
  private async generateInspectionNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.qHSEInspection.count({
      where: {
        tenantId,
        inspectionNumber: { startsWith: `INS-${year}-` },
      },
    });
    return `INS-${year}-${String(count + 1).padStart(5, "0")}`;
  }

  async createInspection(
    data: Omit<Inspection, "id" | "createdAt" | "updatedAt">,
  ): Promise<Inspection> {
    try {
      const inspectionNumber =
        data.inspectionNumber ||
        (await this.generateInspectionNumber(data.tenantId));

      const prismaInspection = await prisma.qHSEInspection.create({
        data: {
          tenantId: data.tenantId,
          customerId: data.customerId,
          warehouseId: data.warehouseId,
          facilityId: data.facilityId,
          inspectionNumber,
          type: data.type,
          status: data.status || "SCHEDULED",
          title: data.title,
          description: data.description,
          scheduledDate: new Date(data.scheduledDate),
          scheduledBy: data.scheduledBy,
          conductedDate: data.conductedDate
            ? new Date(data.conductedDate)
            : undefined,
          conductedBy: data.conductedBy,
          duration: data.duration,
          location: data.location,
          locationDetails: data.locationDetails,
          checklistId: data.checklistId,
          checklistItems: data.checklistItems
            ? JSON.parse(JSON.stringify(data.checklistItems))
            : null,
          findings: data.findings
            ? JSON.parse(JSON.stringify(data.findings))
            : null,
          totalFindings: data.totalFindings || 0,
          criticalFindings: data.criticalFindings || 0,
          majorFindings: data.majorFindings || 0,
          minorFindings: data.minorFindings || 0,
          observations: data.observations || 0,
          complianceScore: data.complianceScore,
          regulatoryStandard: data.regulatoryStandard,
          correctiveActionsRequired: data.correctiveActionsRequired || [],
          followUpDate: data.followUpDate
            ? new Date(data.followUpDate)
            : undefined,
          followUpRequired: data.followUpRequired || false,
          documents: data.documents || [],
          photos: data.photos || [],
          approvedBy: data.approvedBy,
          approvedAt: data.approvedAt ? new Date(data.approvedAt) : undefined,
          tags: data.tags || [],
          notes: data.notes,
          createdBy: data.createdBy,
          updatedBy: data.updatedBy || data.createdBy,
        },
      });

      const inspection = prismaToInspection(prismaInspection);

      // Update Knowledge Base (non-blocking)
      try {
        await knowledgeBaseService.store({
          entity: "qhse-inspection",
          id: inspection.id,
          content: `Inspection: ${inspection.title}\n\nType: ${inspection.type}\nStatus: ${inspection.status}\n\nScheduled: ${inspection.scheduledDate}\nLocation: ${inspection.location}`,
          metadata: {
            type: inspection.type,
            status: inspection.status,
            tenantId: inspection.tenantId,
          },
        });
      } catch (kbError) {
        console.warn(
          "Failed to update knowledge base for inspection:",
          kbError,
        );
      }

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.inspection.created",
        aggregateId: inspection.id,
        aggregateType: "QHSE_INSPECTION",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: inspection,
      });

      return inspection;
    } catch (error) {
      console.error("Error creating inspection:", error);
      throw new Error(
        `Failed to create inspection: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getInspection(id: string): Promise<Inspection | null> {
    try {
      const prismaInspection = await prisma.qHSEInspection.findUnique({
        where: { id },
      });

      if (!prismaInspection) return null;

      return prismaToInspection(prismaInspection);
    } catch (error) {
      console.error("Error fetching inspection:", error);
      throw new Error(
        `Failed to fetch inspection: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getInspections(filters?: InspectionFilters): Promise<Inspection[]> {
    try {
      const where: any = {};

      if (filters) {
        if (filters.tenantId) where.tenantId = filters.tenantId;
        if (filters.customerId) where.customerId = filters.customerId;
        if (filters.warehouseId) where.warehouseId = filters.warehouseId;
        if (filters.facilityId) where.facilityId = filters.facilityId;
        if (filters.type) where.type = filters.type;
        if (filters.status) where.status = filters.status;
        if (filters.dateFrom || filters.dateTo) {
          where.scheduledDate = {};
          if (filters.dateFrom)
            where.scheduledDate.gte = new Date(filters.dateFrom);
          if (filters.dateTo)
            where.scheduledDate.lte = new Date(filters.dateTo);
        }
        if (filters.conductedBy) where.conductedBy = filters.conductedBy;
      }

      const prismaInspections = await prisma.qHSEInspection.findMany({
        where,
        orderBy: { scheduledDate: "desc" },
      });

      return prismaInspections.map(prismaToInspection);
    } catch (error) {
      console.error("Error fetching inspections:", error);
      throw new Error(
        `Failed to fetch inspections: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async updateInspection(
    id: string,
    data: Partial<Inspection>,
  ): Promise<Inspection> {
    try {
      const updateData: any = {};

      if (data.type !== undefined) updateData.type = data.type;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.scheduledDate !== undefined)
        updateData.scheduledDate = new Date(data.scheduledDate);
      if (data.conductedDate !== undefined)
        updateData.conductedDate = data.conductedDate
          ? new Date(data.conductedDate)
          : null;
      if (data.conductedBy !== undefined)
        updateData.conductedBy = data.conductedBy;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.locationDetails !== undefined)
        updateData.locationDetails = data.locationDetails;
      if (data.checklistItems !== undefined)
        updateData.checklistItems = JSON.parse(
          JSON.stringify(data.checklistItems),
        );
      if (data.findings !== undefined)
        updateData.findings = JSON.parse(JSON.stringify(data.findings));
      if (data.totalFindings !== undefined)
        updateData.totalFindings = data.totalFindings;
      if (data.criticalFindings !== undefined)
        updateData.criticalFindings = data.criticalFindings;
      if (data.majorFindings !== undefined)
        updateData.majorFindings = data.majorFindings;
      if (data.minorFindings !== undefined)
        updateData.minorFindings = data.minorFindings;
      if (data.observations !== undefined)
        updateData.observations = data.observations;
      if (data.complianceScore !== undefined)
        updateData.complianceScore = data.complianceScore;
      if (data.regulatoryStandard !== undefined)
        updateData.regulatoryStandard = data.regulatoryStandard;
      if (data.correctiveActionsRequired !== undefined)
        updateData.correctiveActionsRequired = data.correctiveActionsRequired;
      if (data.followUpDate !== undefined)
        updateData.followUpDate = data.followUpDate
          ? new Date(data.followUpDate)
          : null;
      if (data.followUpRequired !== undefined)
        updateData.followUpRequired = data.followUpRequired;
      if (data.documents !== undefined) updateData.documents = data.documents;
      if (data.photos !== undefined) updateData.photos = data.photos;
      if (data.approvedBy !== undefined)
        updateData.approvedBy = data.approvedBy;
      if (data.approvedAt !== undefined)
        updateData.approvedAt = data.approvedAt
          ? new Date(data.approvedAt)
          : null;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy;

      const prismaInspection = await prisma.qHSEInspection.update({
        where: { id },
        data: updateData,
      });

      const updated = prismaToInspection(prismaInspection);

      // Update Knowledge Base (non-blocking)
      try {
        const searchResults = await knowledgeBaseService.search({
          query: `inspection ${updated.id}`,
          filters: { type: "fact" },
          limit: 5,
        });

        const existingEntry = searchResults.results.find(
          (r) =>
            r.entry.metadata?.inspectionId === updated.id ||
            r.entry.id === `qhse-inspection-${updated.id}`,
        );

        if (existingEntry) {
          await knowledgeBaseService.update(existingEntry.entry.id, {
            content: `Inspection: ${updated.title}\n\nType: ${updated.type}\nStatus: ${updated.status}\n\nScheduled: ${updated.scheduledDate}\nLocation: ${updated.location}`,
            searchableText: `Inspection: ${updated.title}\n\nType: ${updated.type}\nStatus: ${updated.status}\n\nScheduled: ${updated.scheduledDate}\nLocation: ${updated.location}`,
            metadata: {
              ...existingEntry.entry.metadata,
              type: updated.type,
              status: updated.status,
              tenantId: updated.tenantId,
            },
          });
        } else {
          await knowledgeBaseService.store({
            entity: "qhse-inspection",
            id: updated.id,
            content: `Inspection: ${updated.title}\n\nType: ${updated.type}\nStatus: ${updated.status}\n\nScheduled: ${updated.scheduledDate}\nLocation: ${updated.location}`,
            metadata: {
              type: updated.type,
              status: updated.status,
              tenantId: updated.tenantId,
            },
          });
        }
      } catch (kbError) {
        console.warn(
          "Failed to update knowledge base for inspection:",
          kbError,
        );
      }

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.inspection.updated",
        aggregateId: updated.id,
        aggregateType: "QHSE_INSPECTION",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: updated,
      });

      return updated;
    } catch (error) {
      console.error("Error updating inspection:", error);
      throw new Error(
        `Failed to update inspection: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async deleteInspection(id: string): Promise<void> {
    try {
      await prisma.qHSEInspection.delete({
        where: { id },
      });

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.inspection.deleted",
        aggregateId: id,
        aggregateType: "QHSE_INSPECTION",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: { id },
      });
    } catch (error) {
      console.error("Error deleting inspection:", error);
      throw new Error(
        `Failed to delete inspection: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async conductInspection(
    inspectionId: string,
    checklistItems: InspectionChecklistItem[],
  ): Promise<Inspection> {
    try {
      // Ensure all checklist items have IDs
      const itemsWithIds = checklistItems.map((item) => ({
        ...item,
        id:
          item.id ||
          `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        inspectionId,
      }));

      const prismaInspection = await prisma.qHSEInspection.update({
        where: { id: inspectionId },
        data: {
          checklistItems: JSON.parse(JSON.stringify(itemsWithIds)),
          status: "COMPLETED",
          conductedDate: new Date(),
        },
      });

      const updated = prismaToInspection(prismaInspection);

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.inspection.conducted",
        aggregateId: inspectionId,
        aggregateType: "QHSE_INSPECTION",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: updated,
      });

      return updated;
    } catch (error) {
      console.error("Error conducting inspection:", error);
      throw new Error(
        `Failed to conduct inspection: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async addFinding(
    inspectionId: string,
    finding: Omit<InspectionFinding, "id" | "createdAt" | "updatedAt">,
  ): Promise<InspectionFinding> {
    try {
      const inspection = await prisma.qHSEInspection.findUnique({
        where: { id: inspectionId },
      });

      if (!inspection) throw new Error(`Inspection not found: ${inspectionId}`);

      const existingFindings = (inspection.findings as any) || [];
      const findingNumber =
        finding.findingNumber ||
        `F-${String(existingFindings.length + 1).padStart(3, "0")}`;

      const newFinding: InspectionFinding = {
        ...finding,
        id: `find-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        findingNumber,
        inspectionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedFindings = [...existingFindings, newFinding];
      const criticalCount = updatedFindings.filter(
        (f: any) => f.severity === "CRITICAL",
      ).length;
      const majorCount = updatedFindings.filter(
        (f: any) => f.severity === "MAJOR",
      ).length;
      const minorCount = updatedFindings.filter(
        (f: any) => f.severity === "MINOR",
      ).length;
      const observationCount = updatedFindings.filter(
        (f: any) => f.severity === "OBSERVATION",
      ).length;

      await prisma.qHSEInspection.update({
        where: { id: inspectionId },
        data: {
          findings: JSON.parse(JSON.stringify(updatedFindings)),
          totalFindings: updatedFindings.length,
          criticalFindings: criticalCount,
          majorFindings: majorCount,
          minorFindings: minorCount,
          observations: observationCount,
        },
      });

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.inspection.finding.added",
        aggregateId: newFinding.id,
        aggregateType: "QHSE_INSPECTION_FINDING",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: newFinding,
      });

      return newFinding;
    } catch (error) {
      console.error("Error adding finding:", error);
      throw new Error(
        `Failed to add finding: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async updateFinding(
    findingId: string,
    data: Partial<InspectionFinding>,
  ): Promise<InspectionFinding> {
    try {
      // Note: This requires searching through inspections to find the finding
      // In production, consider storing findings in a separate table or requiring inspectionId
      const inspections = await prisma.qHSEInspection.findMany({
        where: {
          findings: { not: null },
        },
      });

      let foundInspection: any = null;
      let foundFinding: any = null;
      let findingIndex = -1;

      for (const inspection of inspections) {
        const findings = (inspection.findings as any) || [];
        const index = findings.findIndex((f: any) => f.id === findingId);
        if (index !== -1) {
          foundInspection = inspection;
          foundFinding = findings[index];
          findingIndex = index;
          break;
        }
      }

      if (!foundInspection || !foundFinding) {
        throw new Error(`Finding not found: ${findingId}`);
      }

      const updated: InspectionFinding = {
        ...foundFinding,
        ...data,
        id: foundFinding.id,
        updatedAt: new Date().toISOString(),
      };

      const findings = (foundInspection.findings as any) || [];
      findings[findingIndex] = updated;

      await prisma.qHSEInspection.update({
        where: { id: foundInspection.id },
        data: {
          findings: JSON.parse(JSON.stringify(findings)),
        },
      });

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.inspection.finding.updated",
        aggregateId: findingId,
        aggregateType: "QHSE_INSPECTION_FINDING",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: updated,
      });

      return updated;
    } catch (error) {
      console.error("Error updating finding:", error);
      throw new Error(
        `Failed to update finding: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async calculateComplianceScore(inspectionId: string): Promise<number> {
    try {
      const inspection = await prisma.qHSEInspection.findUnique({
        where: { id: inspectionId },
      });

      if (!inspection) throw new Error(`Inspection not found: ${inspectionId}`);

      const checklistItems = (inspection.checklistItems as any) || [];
      if (checklistItems.length === 0) return 100;

      const passed = checklistItems.filter(
        (item: any) => item.status === "PASS",
      ).length;
      const total = checklistItems.filter(
        (item: any) => item.status !== "N/A",
      ).length;

      if (total === 0) return 100;

      const score = Math.round((passed / total) * 100);

      // Update inspection
      await this.updateInspection(inspectionId, { complianceScore: score });

      return score;
    } catch (error) {
      console.error("Error calculating compliance score:", error);
      throw new Error(
        `Failed to calculate compliance score: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export const qhseInspectionService = new QHSEInspectionServiceImpl();
export default qhseInspectionService;
