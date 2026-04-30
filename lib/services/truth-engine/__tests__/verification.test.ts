/**
 * Verification Services Tests
 */

import { imageVerificationService } from "../verification/imageVerificationService";
import { videoVerificationService } from "../verification/videoVerificationService";
import { audioVerificationService } from "../verification/audioVerificationService";
import { multimodalVerificationService } from "../verification/multimodalVerificationService";
import { TruthEvidenceItem } from "@/types/truth-engine";

describe("Verification Services", () => {
  const mockImageEvidence: TruthEvidenceItem = {
    id: "evidence-1",
    type: "image",
    category: "operational",
    title: "Test Image",
    sourceSystem: "wms",
    fileUrl: "https://example.com/image.jpg",
    validationState: "pending",
    metadata: {
      source: "wms",
      capturedAt: new Date().toISOString(),
      capturedMethod: "api",
      processed: false,
    },
    relatedEntities: [],
    tags: [],
    hash: "test-hash",
    hashAlgorithm: "sha256",
    lineage: {
      source: "wms",
      capturedAt: new Date().toISOString(),
      capturedBy: "system",
    },
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockVideoEvidence: TruthEvidenceItem = {
    ...mockImageEvidence,
    id: "evidence-2",
    type: "video",
    title: "Test Video",
    fileUrl: "https://example.com/video.mp4",
  };

  const mockAudioEvidence: TruthEvidenceItem = {
    ...mockImageEvidence,
    id: "evidence-3",
    type: "audio",
    title: "Test Audio",
    fileUrl: "https://example.com/audio.wav",
  };

  describe("Image Verification Service", () => {
    it("should verify image evidence", async () => {
      const result =
        await imageVerificationService.verifyImage(mockImageEvidence);
      expect(result).toBeDefined();
      expect(result.verified).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it("should detect tampering when metadata indicates risk", async () => {
      const evidenceWithRisk = {
        ...mockImageEvidence,
        metadata: {
          ...mockImageEvidence.metadata,
          tamperingRisk: true,
        } as any,
      };
      const result =
        await imageVerificationService.verifyImage(evidenceWithRisk);
      expect(result.tamperingDetected).toBe(true);
    });
  });

  describe("Video Verification Service", () => {
    it("should verify video evidence", async () => {
      const result =
        await videoVerificationService.verifyVideo(mockVideoEvidence);
      expect(result).toBeDefined();
      expect(result.verified).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it("should include frame analysis", async () => {
      const result =
        await videoVerificationService.verifyVideo(mockVideoEvidence);
      expect(result.frameAnalysis).toBeDefined();
      expect(result.frameAnalysis?.totalFrames).toBeGreaterThan(0);
    });
  });

  describe("Audio Verification Service", () => {
    it("should verify audio evidence", async () => {
      const result =
        await audioVerificationService.verifyAudio(mockAudioEvidence);
      expect(result).toBeDefined();
      expect(result.verified).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it("should include voice authentication", async () => {
      const result =
        await audioVerificationService.verifyAudio(mockAudioEvidence);
      expect(result.voiceAuthentication).toBeDefined();
    });
  });

  describe("Multimodal Verification Service", () => {
    it("should verify image evidence", async () => {
      const result =
        await multimodalVerificationService.verifyEvidence(mockImageEvidence);
      expect(result).toBeDefined();
      expect(result.evidenceId).toBe(mockImageEvidence.id);
      expect(result.evidenceType).toBe("image");
      expect(result.imageResult).toBeDefined();
    });

    it("should verify video evidence", async () => {
      const result =
        await multimodalVerificationService.verifyEvidence(mockVideoEvidence);
      expect(result).toBeDefined();
      expect(result.videoResult).toBeDefined();
    });

    it("should verify audio evidence", async () => {
      const result =
        await multimodalVerificationService.verifyEvidence(mockAudioEvidence);
      expect(result).toBeDefined();
      expect(result.audioResult).toBeDefined();
    });

    it("should batch verify multiple evidence items", async () => {
      const results = await multimodalVerificationService.verifyBatch([
        mockImageEvidence,
        mockVideoEvidence,
        mockAudioEvidence,
      ]);
      expect(results).toHaveLength(3);
      expect(results[0].evidenceType).toBe("image");
      expect(results[1].evidenceType).toBe("video");
      expect(results[2].evidenceType).toBe("audio");
    });
  });
});
