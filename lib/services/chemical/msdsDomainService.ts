/**
 * MSDS Domain Service (tenant-scoped)
 *
 * Goal:
 * - Multi-tenant from day 1 (tenantId REQUIRED)
 * - Single source of truth for MSDS API routes
 * - Publish msds.* domain events so Truth Engine + other modules can react
 */

import type { MSDSDocument, ExtractedMSDSData } from "@/types/chemical";
import type { DomainEvent } from "@/types/cqrs";
import { msdsStorageService } from "./msdsStorage";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";
import { evidenceService } from "@/lib/services/evidence";
import {
  initializeMSDSLifecycle,
  transitionMSDSLifecycle,
} from "./msdsLifecycleIntegration";

export type MSDSActor = {
  userId: string;
  roles?: string[];
};

export type MSDSComplianceResult = {
  compliant: boolean;
  issues: string[];
  score: number;
  recommendations: string[];
};

class MSDSDomainService {
  private requireTenant(tenantId: string) {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error("tenantId is required");
    }
    if (process.env.NODE_ENV === "production" && tenantId === "default") {
      throw new Error("Invalid tenantId");
    }
  }

  private async publish(event: DomainEvent) {
    await eventBus.publish(event);
  }

  async storeExtractedMSDS(params: {
    tenantId: string;
    actor: MSDSActor;
    msds: MSDSDocument;
    extractedData: ExtractedMSDSData;
    source: "batch_upload" | "upload" | "api";
  }): Promise<string> {
    this.requireTenant(params.tenantId);

    const evd = await evidenceService.create({
      tenantId: params.tenantId,
      type: "document",
      category: "compliance",
      title: `MSDS uploaded: ${params.extractedData.productName || params.msds.id}`,
      description: "MSDS/SDS uploaded and processed for cross-module use",
      fileUrl: params.msds.fileUrl,
      validationState: "pending",
      relatedEntities: [
        {
          entityId: params.msds.id,
          entityType: "msds",
          relationship: "subject",
          addedAt: new Date().toISOString(),
          addedBy: params.actor.userId,
        },
      ],
      tags: ["msds", "chemical", "upload"],
      metadata: {
        source: "msds",
        capturedAt: new Date().toISOString(),
        capturedBy: params.actor.userId,
        capturedMethod:
          params.source === "batch_upload" ? "imported" : "upload",
        processed: true,
        extractedData: params.extractedData as unknown as Record<string, any>,
      },
      createdBy: params.actor.userId,
    });

    const id = await msdsStorageService.storeMSDS(
      params.msds,
      params.extractedData,
      {
        tenantId: params.tenantId,
        createdBy: params.actor.userId,
        moduleAccess: [
          "warehouse",
          "transportation",
          "compliance",
          "civil-defense",
          "ministry-interior",
        ],
      },
    );

    // Lifecycle: initialize + move into review stage (tenant-safe composite id)
    try {
      await initializeMSDSLifecycle({
        tenantId: params.tenantId,
        msdsId: id,
        initialData: {
          productName: params.extractedData.productName,
          casNumber: params.extractedData.casNumber,
          source: params.source,
        },
      });
      await transitionMSDSLifecycle({
        tenantId: params.tenantId,
        msdsId: id,
        toStageId: "MSDS_EXTRACTED",
        context: { userId: params.actor.userId },
      });
      await transitionMSDSLifecycle({
        tenantId: params.tenantId,
        msdsId: id,
        toStageId: "MSDS_IN_REVIEW",
        context: { userId: params.actor.userId },
      });
    } catch {
      // Non-blocking: lifecycle config might not be initialized in some environments
    }

    await this.publish(
      createEvent(
        "msds.uploaded",
        id,
        "MSDS",
        {
          msdsId: id,
          evidenceIds: [evd.id],
          source: params.source,
          extractedData: params.extractedData,
        },
        1,
        {
          tenantId: params.tenantId,
          userId: params.actor.userId,
          correlationId: `msds-upload-${Date.now()}`,
          source: "msds",
        },
      ),
    );

    return id;
  }

  async getForModule(params: {
    tenantId: string;
    moduleId: "warehouse" | "transportation" | "compliance";
    casNumber?: string | null;
    chemicalName?: string | null;
    transportMode?: "sea" | "rail" | "road" | "air" | null;
    complianceType?:
      | "civil-defense"
      | "ministry-interior"
      | "import"
      | "export"
      | null;
  }) {
    this.requireTenant(params.tenantId);

    if (params.moduleId === "warehouse") {
      if (params.casNumber)
        return msdsStorageService.getMSDSByCAS(
          params.casNumber,
          params.tenantId,
        );
      if (params.chemicalName)
        return msdsStorageService.getMSDSByName(
          params.chemicalName,
          params.tenantId,
        );
      return msdsStorageService.getMSDSForModule("warehouse", params.tenantId);
    }

    if (params.moduleId === "transportation") {
      if (!params.chemicalName && !params.casNumber) {
        throw new Error(
          "chemicalName or casNumber is required for transportation lookup",
        );
      }
      if (params.transportMode && params.chemicalName) {
        return msdsStorageService.getMSDSForTransportation(
          params.chemicalName,
          params.transportMode,
          params.tenantId,
        );
      }
      if (params.chemicalName)
        return msdsStorageService.getMSDSByName(
          params.chemicalName,
          params.tenantId,
        );
      if (params.casNumber)
        return msdsStorageService.getMSDSByCAS(
          params.casNumber,
          params.tenantId,
        );
      return null;
    }

    if (params.moduleId === "compliance") {
      if (!params.casNumber)
        throw new Error("casNumber is required for compliance lookup");
      if (params.complianceType) {
        return msdsStorageService.getMSDSForCompliance(
          params.casNumber,
          params.complianceType,
          params.tenantId,
        );
      }
      return msdsStorageService.getMSDSByCAS(params.casNumber, params.tenantId);
    }
  }

  async checkCompliance(params: {
    tenantId: string;
    msdsId: string;
  }): Promise<MSDSComplianceResult> {
    this.requireTenant(params.tenantId);
    const entry = await msdsStorageService.getMSDS(
      params.msdsId,
      params.tenantId,
    );
    if (!entry) throw new Error("MSDS not found");

    const issues: string[] = [];
    let score = 100;

    const data = entry.extractedData || {};
    const requiredFields: Array<keyof ExtractedMSDSData> = [
      "productName",
      "manufacturer",
      "hazardStatements",
      "precautionaryStatements",
    ];

    for (const f of requiredFields) {
      const val = data[f];
      const missing =
        val === undefined ||
        val === null ||
        (typeof val === "string" && val.trim().length === 0) ||
        (Array.isArray(val) && val.length === 0);

      if (missing) {
        issues.push(`Missing required field: ${String(f)}`);
        score -= 10;
      }
    }

    if (!data.ghsCompliant) {
      issues.push("GHS compliance not verified");
      score -= 20;
    }

    // Transport compliance sanity checks (optional but useful)
    if (
      data.hazardLevel === "High" &&
      (!data.unNumber || data.unNumber.toLowerCase().includes("not specified"))
    ) {
      issues.push("High hazard MSDS missing UN number");
      score -= 10;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      compliant: score >= 70,
      issues,
      score,
      recommendations: issues.length
        ? ["Complete missing fields and re-run compliance check"]
        : [],
    };
  }

  async bulkApprove(params: {
    tenantId: string;
    actor: MSDSActor;
    msdsIds: string[];
    comments?: string;
  }) {
    this.requireTenant(params.tenantId);

    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const id of params.msdsIds) {
      try {
        const entry = await msdsStorageService.getMSDS(id, params.tenantId);
        if (!entry) throw new Error("MSDS not found");
        entry.msds.status = "approved";
        entry.msds.workflowStatus = "approved";
        entry.metadata.updatedAt = new Date().toISOString();

        await msdsStorageService.storeMSDS(entry.msds, entry.extractedData, {
          tenantId: params.tenantId,
          createdBy: entry.metadata.createdBy,
          moduleAccess: entry.metadata.moduleAccess,
        });

        const evd = await evidenceService.create({
          tenantId: params.tenantId,
          type: "approval",
          category: "approval",
          title: `MSDS approved: ${id}`,
          description: params.comments,
          validationState: "validated",
          validatedBy: params.actor.userId,
          validatedAt: new Date().toISOString(),
          relatedEntities: [
            {
              entityId: id,
              entityType: "msds",
              relationship: "subject",
              addedAt: new Date().toISOString(),
              addedBy: params.actor.userId,
            },
          ],
          tags: ["msds", "approval"],
          metadata: {
            source: "msds",
            capturedAt: new Date().toISOString(),
            capturedBy: params.actor.userId,
            capturedMethod: "api",
            processed: true,
          },
          createdBy: params.actor.userId,
        });

        await this.publish(
          createEvent(
            "msds.approved",
            id,
            "MSDS",
            {
              msdsId: id,
              approvedBy: params.actor.userId,
              comments: params.comments,
              evidenceIds: [evd.id],
            },
            1,
            {
              tenantId: params.tenantId,
              userId: params.actor.userId,
              correlationId: `msds-approve-${Date.now()}`,
              source: "msds",
            },
          ),
        );

        try {
          await transitionMSDSLifecycle({
            tenantId: params.tenantId,
            msdsId: id,
            toStageId: "MSDS_APPROVED",
            context: { userId: params.actor.userId, reason: params.comments },
          });
        } catch {
          // Non-blocking
        }

        successful.push(id);
      } catch (e) {
        failed.push({
          id,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return { successful, failed };
  }

  async bulkReject(params: {
    tenantId: string;
    actor: MSDSActor;
    msdsIds: string[];
    reason: string;
  }) {
    this.requireTenant(params.tenantId);

    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const id of params.msdsIds) {
      try {
        const entry = await msdsStorageService.getMSDS(id, params.tenantId);
        if (!entry) throw new Error("MSDS not found");
        entry.msds.status = "rejected";
        entry.msds.workflowStatus = "rejected";
        entry.metadata.updatedAt = new Date().toISOString();

        await msdsStorageService.storeMSDS(entry.msds, entry.extractedData, {
          tenantId: params.tenantId,
          createdBy: entry.metadata.createdBy,
          moduleAccess: entry.metadata.moduleAccess,
        });

        const evd = await evidenceService.create({
          tenantId: params.tenantId,
          type: "approval",
          category: "approval",
          title: `MSDS rejected: ${id}`,
          description: params.reason,
          validationState: "rejected",
          validatedBy: params.actor.userId,
          validatedAt: new Date().toISOString(),
          relatedEntities: [
            {
              entityId: id,
              entityType: "msds",
              relationship: "subject",
              addedAt: new Date().toISOString(),
              addedBy: params.actor.userId,
            },
          ],
          tags: ["msds", "rejection"],
          metadata: {
            source: "msds",
            capturedAt: new Date().toISOString(),
            capturedBy: params.actor.userId,
            capturedMethod: "api",
            processed: true,
          },
          createdBy: params.actor.userId,
        });

        await this.publish(
          createEvent(
            "msds.rejected",
            id,
            "MSDS",
            {
              msdsId: id,
              rejectedBy: params.actor.userId,
              reason: params.reason,
              evidenceIds: [evd.id],
            },
            1,
            {
              tenantId: params.tenantId,
              userId: params.actor.userId,
              correlationId: `msds-reject-${Date.now()}`,
              source: "msds",
            },
          ),
        );

        try {
          await transitionMSDSLifecycle({
            tenantId: params.tenantId,
            msdsId: id,
            toStageId: "MSDS_REJECTED",
            context: { userId: params.actor.userId, reason: params.reason },
          });
        } catch {
          // Non-blocking
        }

        successful.push(id);
      } catch (e) {
        failed.push({
          id,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return { successful, failed };
  }

  async updateComplianceData(params: {
    tenantId: string;
    actor: MSDSActor;
    msdsId: string;
    complianceData: Record<string, any>;
  }) {
    this.requireTenant(params.tenantId);
    const ok = await msdsStorageService.updateComplianceData(
      params.msdsId,
      params.complianceData,
      params.tenantId,
    );
    if (!ok) throw new Error("MSDS not found");

    const evd = await evidenceService.create({
      tenantId: params.tenantId,
      type: "event",
      category: "compliance",
      title: `MSDS compliance updated: ${params.msdsId}`,
      description: "Compliance metadata updated",
      validationState: "pending",
      relatedEntities: [
        {
          entityId: params.msdsId,
          entityType: "msds",
          relationship: "subject",
          addedAt: new Date().toISOString(),
          addedBy: params.actor.userId,
        },
      ],
      tags: ["msds", "compliance"],
      metadata: {
        source: "msds",
        capturedAt: new Date().toISOString(),
        capturedBy: params.actor.userId,
        capturedMethod: "api",
        processed: true,
        extractedData: params.complianceData,
      },
      createdBy: params.actor.userId,
    });

    await this.publish(
      createEvent(
        "msds.compliance_updated",
        params.msdsId,
        "MSDS",
        {
          msdsId: params.msdsId,
          complianceData: params.complianceData,
          evidenceIds: [evd.id],
        },
        1,
        {
          tenantId: params.tenantId,
          userId: params.actor.userId,
          correlationId: `msds-compliance-${Date.now()}`,
          source: "msds",
        },
      ),
    );

    return true;
  }

  async updateTransportationData(params: {
    tenantId: string;
    actor: MSDSActor;
    msdsId: string;
    transportationData: Record<string, any>;
  }) {
    this.requireTenant(params.tenantId);
    const ok = await msdsStorageService.updateTransportationData(
      params.msdsId,
      params.transportationData,
      params.tenantId,
    );
    if (!ok) throw new Error("MSDS not found");

    const evd = await evidenceService.create({
      tenantId: params.tenantId,
      type: "event",
      category: "operational",
      title: `MSDS transportation updated: ${params.msdsId}`,
      description: "Transportation metadata updated",
      validationState: "pending",
      relatedEntities: [
        {
          entityId: params.msdsId,
          entityType: "msds",
          relationship: "subject",
          addedAt: new Date().toISOString(),
          addedBy: params.actor.userId,
        },
      ],
      tags: ["msds", "transportation"],
      metadata: {
        source: "msds",
        capturedAt: new Date().toISOString(),
        capturedBy: params.actor.userId,
        capturedMethod: "api",
        processed: true,
        extractedData: params.transportationData,
      },
      createdBy: params.actor.userId,
    });

    await this.publish(
      createEvent(
        "msds.transportation_updated",
        params.msdsId,
        "MSDS",
        {
          msdsId: params.msdsId,
          transportationData: params.transportationData,
          evidenceIds: [evd.id],
        },
        1,
        {
          tenantId: params.tenantId,
          userId: params.actor.userId,
          correlationId: `msds-transport-${Date.now()}`,
          source: "msds",
        },
      ),
    );

    return true;
  }

  async compare(params: {
    tenantId: string;
    msds1Id: string;
    msds2Id: string;
  }) {
    this.requireTenant(params.tenantId);
    const e1 = await msdsStorageService.getMSDS(
      params.msds1Id,
      params.tenantId,
    );
    const e2 = await msdsStorageService.getMSDS(
      params.msds2Id,
      params.tenantId,
    );
    if (!e1 || !e2) throw new Error("MSDS documents not found");

    const data1 = e1.extractedData || ({} as ExtractedMSDSData);
    const data2 = e2.extractedData || ({} as ExtractedMSDSData);

    const fieldComparisons: Array<{
      field: string;
      value1: unknown;
      value2: unknown;
      changed: boolean;
    }> = [];
    const differences: string[] = [];
    const similarities: string[] = [];

    const allFields = new Set([
      ...Object.keys(data1 as any),
      ...Object.keys(data2 as any),
    ]);
    for (const field of allFields) {
      const val1 = (data1 as any)[field];
      const val2 = (data2 as any)[field];
      const changed = JSON.stringify(val1) !== JSON.stringify(val2);
      fieldComparisons.push({ field, value1: val1, value2: val2, changed });

      if (changed)
        differences.push(`${field}: "${String(val1)}" → "${String(val2)}"`);
      else if (
        val1 !== undefined &&
        val1 !== null &&
        String(val1).trim() !== ""
      )
        similarities.push(`${field}: "${String(val1)}"`);
    }

    return {
      differences,
      similarities,
      recommendations: differences.length
        ? [
            "Review changed fields",
            "Re-run compliance checks after changes",
            "Notify impacted teams (QHSE/Transportation/Compliance)",
          ]
        : ["No differences detected"],
      fieldComparisons,
    };
  }
}

export const msdsDomainService = new MSDSDomainService();
