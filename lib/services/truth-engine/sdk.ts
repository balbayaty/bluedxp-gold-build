/**
 * Truth Engine SDK
 * Lightweight helpers for modules to integrate with Truth Engine
 *
 * This SDK makes it easy for any module to:
 * - Record evidence
 * - Record truth events
 * - Link evidence to events
 * - Register KPIs
 *
 * @module lib/services/truth-engine/sdk
 */

import { truthEngineService } from "./truthEngineService";
import {
  TruthEvent,
  TruthEvidenceItem,
  TruthEventType,
  TruthKPI,
  EvidenceSourceSystem,
} from "@/types/truth-engine";

/**
 * Main SDK object - use this in your modules
 */
export const truthSDK = {
  /**
   * Record evidence (wrapper around truthEngineService)
   */
  recordEvidence: truthEngineService.recordEvidence,

  /**
   * Record truth event (wrapper)
   */
  recordTruthEvent: truthEngineService.recordTruthEvent,

  /**
   * Link evidence to event (convenience)
   */
  linkEvidenceToEvent: truthEngineService.linkEvidenceToEvent,

  /**
   * Helper: Record evidence + event in one call
   */
  async recordWithEvidence(
    event: Omit<TruthEvent, "id" | "createdAt">,
    evidence: Omit<
      TruthEvidenceItem,
      "id" | "createdAt" | "updatedAt" | "lineage" | "hash"
    >[],
  ): Promise<{ event: TruthEvent; evidence: TruthEvidenceItem[] }> {
    const recordedEvidence = await Promise.all(
      evidence.map((e) => truthEngineService.recordEvidence(e)),
    );

    const recordedEvent = await truthEngineService.recordTruthEvent({
      ...event,
      evidenceLinks: recordedEvidence.map((e) => e.id),
    });

    return { event: recordedEvent, evidence: recordedEvidence };
  },

  /**
   * Quick helper: Record a simple truth event with minimal evidence
   */
  async recordSimpleEvent(
    eventType: TruthEventType,
    tenantId: string,
    entityRefs: TruthEvent["entityRefs"],
    actor: TruthEvent["actor"],
    evidence: {
      type: string;
      title: string;
      sourceSystem: EvidenceSourceSystem;
      fileUrl?: string;
      content?: string;
    },
    confidenceScore: number = 1.0,
  ): Promise<TruthEvent> {
    // Record evidence
    const recordedEvidence = await truthEngineService.recordEvidence({
      type: evidence.type as any,
      category: "operational",
      title: evidence.title,
      sourceSystem: evidence.sourceSystem,
      fileUrl: evidence.fileUrl,
      content: evidence.content,
      validationState: "pending",
      status: "active",
      hashAlgorithm: "sha256",
      chainOfCustody: [],
      metadata: {
        source: evidence.sourceSystem,
        capturedAt: new Date().toISOString(),
        capturedMethod: "api",
        processed: false,
      },
      relatedEntities: Object.entries(entityRefs)
        .filter(([_, id]) => id)
        .map(([key, id]) => ({
          entityId: id!,
          entityType: key.replace("Id", ""),
          relationship: "source",
          addedAt: new Date().toISOString(),
        })),
      tags: ["truth-engine", "auto-captured"],
    });

    // Record event
    return await truthEngineService.recordTruthEvent({
      eventType,
      tenantId,
      happenedAt: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
      actor,
      entityRefs,
      evidenceLinks: [recordedEvidence.id],
      confidenceScore,
      derivedFrom: {
        sourceSystem: evidence.sourceSystem,
      },
      status: "active",
    });
  },

  /**
   * Register a KPI definition
   */
  registerKPI: truthEngineService.registerKPI,

  /**
   * Calculate a KPI
   */
  calculateKPI: truthEngineService.calculateKPI,

  /**
   * Get KPI evidence (for drill-down)
   */
  getKPIEvidence: truthEngineService.getKPIEvidence,
};

/**
 * Module integration helper
 * Use this in your module's service layer
 */
export class TruthEngineIntegration {
  private moduleName: string;
  private tenantId: string;

  constructor(moduleName: string, tenantId: string) {
    this.moduleName = moduleName;
    this.tenantId = tenantId;
  }

  /**
   * Record a module-specific event
   */
  async recordModuleEvent(
    eventType: TruthEventType,
    entityRefs: TruthEvent["entityRefs"],
    actor: TruthEvent["actor"],
    evidence: Omit<
      TruthEvidenceItem,
      "id" | "createdAt" | "updatedAt" | "lineage" | "hash"
    >[],
    metadata?: Record<string, any>,
  ): Promise<TruthEvent> {
    // Record evidence
    const recordedEvidence = await Promise.all(
      evidence.map((e) =>
        truthEngineService.recordEvidence({
          ...e,
          metadata: {
            ...e.metadata,
            module: this.moduleName,
          } as any, // EvidenceMetadata allows [key: string]: any
        }),
      ),
    );

    // Record event
    return await truthEngineService.recordTruthEvent({
      eventType,
      tenantId: this.tenantId,
      happenedAt: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
      actor,
      entityRefs,
      evidenceLinks: recordedEvidence.map((e) => e.id),
      confidenceScore: 1.0, // Default - can be overridden
      derivedFrom: {
        sourceSystem: "wms", // Will be set by module
      },
      metadata: {
        ...metadata,
        module: this.moduleName,
      },
      tags: [this.moduleName, "module-event"],
      status: "active",
    });
  }

  /**
   * Register module-specific KPIs
   */
  async registerModuleKPI(
    name: string,
    description: string,
    formula: string,
    requiredEventTypes: TruthEventType[],
    category: TruthKPI["category"],
  ): Promise<TruthKPI> {
    return await truthEngineService.registerKPI({
      name: `${this.moduleName}:${name}`,
      description,
      formula,
      requiredEventTypes,
      minimumEvidenceRequirements: requiredEventTypes.map((eventType) => ({
        eventType,
        minEvidenceCount: 1,
      })),
      category,
      module: this.moduleName,
      tags: [this.moduleName],
      validationStatus: "pending",
    });
  }
}

/**
 * Convenience function to create module integration
 */
export function createModuleIntegration(
  moduleName: string,
  tenantId: string,
): TruthEngineIntegration {
  return new TruthEngineIntegration(moduleName, tenantId);
}

export default truthSDK;
