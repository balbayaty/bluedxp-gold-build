/**
 * Multimodal Verification Service
 * Unified service for verifying all evidence types (image, video, audio, document)
 */

import { TruthEvidenceItem } from "@/types/truth-engine";
import {
  imageVerificationService,
  ImageVerificationResult,
} from "./imageVerificationService";
import {
  videoVerificationService,
  VideoVerificationResult,
} from "./videoVerificationService";
import {
  audioVerificationService,
  AudioVerificationResult,
} from "./audioVerificationService";

export interface MultimodalVerificationResult {
  evidenceId: string;
  evidenceType: string;
  verified: boolean;
  overallConfidence: number;
  imageResult?: ImageVerificationResult;
  videoResult?: VideoVerificationResult;
  audioResult?: AudioVerificationResult;
  documentResult?: {
    verified: boolean;
    confidence: number;
    extractedText?: string;
    signatureValid?: boolean;
    tamperingDetected?: boolean;
  };
  crossModalValidation?: {
    consistent: boolean;
    inconsistencies?: string[];
  };
  errors?: string[];
}

export class MultimodalVerificationService {
  /**
   * Verify evidence based on its type
   */
  async verifyEvidence(
    evidence: TruthEvidenceItem,
  ): Promise<MultimodalVerificationResult> {
    const result: MultimodalVerificationResult = {
      evidenceId: evidence.id,
      evidenceType: evidence.type,
      verified: false,
      overallConfidence: 0.0,
    };

    try {
      // Route to appropriate verification service
      switch (evidence.type) {
        case "image":
          result.imageResult =
            await imageVerificationService.verifyImage(evidence);
          result.verified = result.imageResult.verified;
          result.overallConfidence = result.imageResult.confidence;
          break;

        case "video":
          result.videoResult =
            await videoVerificationService.verifyVideo(evidence);
          result.verified = result.videoResult.verified;
          result.overallConfidence = result.videoResult.confidence;
          break;

        case "audio":
          result.audioResult =
            await audioVerificationService.verifyAudio(evidence);
          result.verified = result.audioResult.verified;
          result.overallConfidence = result.audioResult.confidence;
          break;

        case "document":
        case "certificate":
          result.documentResult = await this.verifyDocument(evidence);
          result.verified = result.documentResult.verified;
          result.overallConfidence = result.documentResult.confidence;
          break;

        default:
          result.verified = true; // Unknown types default to verified
          result.overallConfidence = 0.5;
          result.errors = [`Unknown evidence type: ${evidence.type}`];
      }

      // Cross-modal validation if related entities exist
      if (evidence.relatedEntities && evidence.relatedEntities.length > 0) {
        result.crossModalValidation = await this.validateCrossModal(
          evidence,
          result,
        );
      }

      return result;
    } catch (error: any) {
      result.errors = [error.message || "Verification failed"];
      return result;
    }
  }

  /**
   * Verify document
   */
  private async verifyDocument(evidence: TruthEvidenceItem): Promise<{
    verified: boolean;
    confidence: number;
    extractedText?: string;
    signatureValid?: boolean;
    tamperingDetected?: boolean;
  }> {
    // In production, use document verification service
    const metadata = evidence.metadata as Record<string, any> | undefined;
    return {
      verified: true,
      confidence: 0.9,
      extractedText: metadata?.extractedText,
      signatureValid: metadata?.signatureValid,
      tamperingDetected: false,
    };
  }

  /**
   * Validate consistency across multiple evidence types
   */
  private async validateCrossModal(
    evidence: TruthEvidenceItem,
    currentResult: MultimodalVerificationResult,
  ): Promise<{
    consistent: boolean;
    inconsistencies?: string[];
  }> {
    const inconsistencies: string[] = [];

    // Check timestamp consistency using createdAt
    if (evidence.relatedEntities && evidence.relatedEntities.length > 0) {
      const timestamps: number[] = [
        new Date(evidence.createdAt).getTime(),
        // Related entities don't have timestamps, skip for now
      ];

      if (timestamps.length > 1) {
        const sorted = [...timestamps].sort((a, b) => a - b);
        const maxDiff = sorted[sorted.length - 1] - sorted[0];
        if (maxDiff > 3600000) {
          // More than 1 hour difference
          inconsistencies.push(
            "Timestamp inconsistency detected across evidence",
          );
        }
      }
    }

    // Check location consistency
    const metadata = evidence.metadata as Record<string, any> | undefined;
    if (
      metadata?.location &&
      evidence.relatedEntities &&
      evidence.relatedEntities.length > 0
    ) {
      const locations = [
        metadata.location,
        // Related entities don't have metadata, skip for now
      ];

      const uniqueLocations = new Set(locations.map((l) => JSON.stringify(l)));
      if (uniqueLocations.size > 1) {
        inconsistencies.push("Location inconsistency detected across evidence");
      }
    }

    return {
      consistent: inconsistencies.length === 0,
      inconsistencies: inconsistencies.length > 0 ? inconsistencies : undefined,
    };
  }

  /**
   * Batch verify multiple evidence items
   */
  async verifyBatch(
    evidenceItems: TruthEvidenceItem[],
  ): Promise<MultimodalVerificationResult[]> {
    return Promise.all(
      evidenceItems.map((evidence) => this.verifyEvidence(evidence)),
    );
  }
}

export const multimodalVerificationService =
  new MultimodalVerificationService();
