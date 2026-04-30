/**
 * Warehouse Image Verification Integration
 * Evidence verification for warehouse operations
 * NO DUPLICATION - Uses existing imageVerificationService
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { imageVerificationService } from "@/lib/services/truth-engine/verification/imageVerificationService";
import type { ImageVerificationResult } from "@/lib/services/truth-engine/verification/imageVerificationService";
import type { TruthEvidenceItem } from "@/types/truth-engine";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// WAREHOUSE IMAGE VERIFICATION TYPES
// ============================================================================

export interface WarehouseImageEvidence {
  id: string;
  warehouseId: string;
  operationType:
    | "RECEIVING"
    | "PUTAWAY"
    | "PICKING"
    | "SHIPPING"
    | "DAMAGE"
    | "INSPECTION"
    | "SAFETY";
  imageUrl: string;
  description?: string;
  verificationResult?: ImageVerificationResult;
  verified: boolean;
  verifiedAt?: Date;
  confidence: number;
}

export interface WarehouseImageVerificationRequest {
  warehouseId: string;
  operationType: WarehouseImageEvidence["operationType"];
  imageUrl: string;
  description?: string;
  evidenceId?: string;
}

// ============================================================================
// WAREHOUSE IMAGE VERIFICATION INTEGRATION
// ============================================================================

class WarehouseImageVerificationIntegration {
  /**
   * Verify warehouse operation image
   */
  async verifyWarehouseImage(
    request: WarehouseImageVerificationRequest,
  ): Promise<WarehouseImageEvidence> {
    // Create evidence structure compatible with TruthEvidenceItem
    // In production, would fetch from evidenceService if evidenceId provided
    const evidenceId = request.evidenceId || `evidence-${Date.now()}`;

    const evidence: TruthEvidenceItem = {
      id: evidenceId,
      type: "image",
      category: "operational",
      title: `Warehouse ${request.operationType} Image`,
      sourceSystem: "wms",
      content: request.imageUrl,
      fileUrl: request.imageUrl,
      metadata: {
        source: "warehouse_operations",
        capturedAt: new Date().toISOString(),
        capturedMethod: "upload",
        processed: false,
        warehouseId: request.warehouseId,
        operationType: request.operationType,
        description: request.description,
      },
      validationState: "pending",
      hash: "", // Would be generated in production
      hashAlgorithm: "sha256",
      lineage: {
        derivedFrom: [],
        version: 1,
        changelog: [],
        custodyChain: [],
      },
      relatedEntities: [],
      tags: ["warehouse", request.operationType.toLowerCase()],
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chainOfCustody: [],
    };

    // Verify image
    const verificationResult =
      await imageVerificationService.verifyImage(evidence);

    const warehouseEvidence: WarehouseImageEvidence = {
      id: evidence.id,
      warehouseId: request.warehouseId,
      operationType: request.operationType,
      imageUrl: request.imageUrl,
      description: request.description,
      verificationResult,
      verified: verificationResult.verified,
      verifiedAt: new Date(),
      confidence: verificationResult.confidence,
    };

    // Publish event
    await eventBus.publish({
      id: `warehouse-image-verification-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.image.verified",
      aggregateId: request.warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        warehouseId: request.warehouseId,
        evidenceId: warehouseEvidence.id,
        operationType: request.operationType,
        verified: verificationResult.verified,
        confidence: verificationResult.confidence,
        tamperingDetected: verificationResult.tamperingDetected,
      },
    });

    return warehouseEvidence;
  }

  /**
   * Verify damage photo
   */
  async verifyDamagePhoto(
    warehouseId: string,
    imageUrl: string,
    description?: string,
  ): Promise<WarehouseImageEvidence> {
    return await this.verifyWarehouseImage({
      warehouseId,
      operationType: "DAMAGE",
      imageUrl,
      description,
    });
  }

  /**
   * Verify inspection photo
   */
  async verifyInspectionPhoto(
    warehouseId: string,
    imageUrl: string,
    description?: string,
  ): Promise<WarehouseImageEvidence> {
    return await this.verifyWarehouseImage({
      warehouseId,
      operationType: "INSPECTION",
      imageUrl,
      description,
    });
  }

  /**
   * Verify receiving photo
   */
  async verifyReceivingPhoto(
    warehouseId: string,
    imageUrl: string,
    description?: string,
  ): Promise<WarehouseImageEvidence> {
    return await this.verifyWarehouseImage({
      warehouseId,
      operationType: "RECEIVING",
      imageUrl,
      description,
    });
  }

  /**
   * Batch verify multiple images
   */
  async batchVerifyImages(
    requests: WarehouseImageVerificationRequest[],
  ): Promise<WarehouseImageEvidence[]> {
    const results = await Promise.all(
      requests.map((req) => this.verifyWarehouseImage(req)),
    );
    return results;
  }

  /**
   * Get verification statistics for warehouse
   */
  async getVerificationStatistics(warehouseId: string): Promise<{
    totalVerified: number;
    verifiedCount: number;
    tamperingDetectedCount: number;
    averageConfidence: number;
    byOperationType: Record<string, number>;
  }> {
    // In production, would query Truth Engine for warehouse evidence
    // For now, return mock data
    return {
      totalVerified: 150,
      verifiedCount: 145,
      tamperingDetectedCount: 2,
      averageConfidence: 0.92,
      byOperationType: {
        RECEIVING: 50,
        DAMAGE: 30,
        INSPECTION: 40,
        SAFETY: 20,
        SHIPPING: 10,
      },
    };
  }
}

export const warehouseImageVerificationIntegration =
  new WarehouseImageVerificationIntegration();
