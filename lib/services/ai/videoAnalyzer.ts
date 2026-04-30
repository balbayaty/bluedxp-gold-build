/**
 * 🎥 AI VIDEO ANALYZER
 * Advanced AI-powered video analysis for safety compliance
 * Deep layer architecture with full functionality
 * Source: Adapted from chemcheck-analysis/lib/ai-video-analyzer.ts
 *
 * Features:
 * - Real-time safety violation detection
 * - PPE compliance monitoring
 * - Chemical safety analysis
 * - Behavioral safety analysis
 * - Environmental safety checks
 * - Regulatory compliance mapping
 */

import { eventBus } from "@/lib/services/event-store";
import { callAI } from "@/utils/aiClient";

// ============================================================================
// INTERFACES
// ============================================================================

export interface VideoFrame {
  timestamp: number;
  base64Data: string;
  width: number;
  height: number;
}

export interface SafetyViolation {
  id: string;
  timestamp: number;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  description: string;
  location: { x: number; y: number };
  regulations: string[];
  actions: string[];
  frameData?: string;
}

export interface AnalysisResult {
  videoId: string;
  duration: number;
  totalFramesAnalyzed: number;
  violations: SafetyViolation[];
  complianceScore: number;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  processingTime: number;
}

// Safety detection prompts for different scenarios
const SAFETY_PROMPTS = {
  ppe: `Analyze this image for Personal Protective Equipment (PPE) violations in an industrial/chemical setting. Look for:
- Missing or improperly worn safety helmets/hard hats
- Missing or inadequate eye protection (safety glasses, goggles)
- Missing or improper respiratory protection
- Missing or inadequate hand protection (gloves)
- Missing or improper foot protection (safety boots)
- Missing or inadequate body protection (coveralls, aprons)
- Workers in hazardous areas without proper PPE

Respond with a JSON object containing violations found, their severity (critical/high/medium/low), confidence (0-1), and specific description.`,

  chemical: `Analyze this image for chemical safety violations in an industrial setting. Look for:
- Chemical spills or leaks
- Improper chemical storage or handling
- Missing or damaged chemical labels/signage
- Incompatible chemicals stored together
- Missing or inadequate containment systems
- Vapor clouds or visible gas emissions
- Improper use of chemical equipment
- Missing or blocked emergency showers/eyewash stations

Respond with a JSON object containing violations found, their severity, confidence, and specific description.`,

  behavior: `Analyze this image for unsafe behavioral practices in an industrial setting. Look for:
- Workers in unauthorized or restricted areas
- Improper use of equipment or tools
- Workers performing tasks without proper safety procedures
- Multiple workers in hazardous areas without supervision
- Workers ignoring safety protocols
- Improper lifting or handling techniques
- Workers near moving equipment without awareness
- Smoking or open flames in prohibited areas

Respond with a JSON object containing violations found, their severity, confidence, and specific description.`,

  environmental: `Analyze this image for environmental and facility safety issues. Look for:
- Blocked or obstructed emergency exits
- Missing or damaged safety signage
- Inadequate lighting in work areas
- Slip, trip, or fall hazards
- Structural damage or defects
- Inadequate ventilation indicators
- Fire safety equipment issues
- Housekeeping and cleanliness problems

Respond with a JSON object containing violations found, their severity, confidence, and specific description.`,
};

// Regulation mapping for different violation types
const REGULATION_MAPPING: Record<string, string[]> = {
  "PPE Violation": [
    "OSHA 1926.95 (Head Protection)",
    "OSHA 1926.96 (Eye Protection)",
    "Saudi OSHA Article 12",
  ],
  "Chemical Spill": [
    "OSHA 1910.1200 (Hazard Communication)",
    "OSHA 1910.120 (HAZWOPER)",
    "Saudi OSHA Article 15",
  ],
  "Unsafe Behavior": [
    "OSHA 1926.501 (Fall Protection)",
    "OSHA 1910.147 (LOTO)",
    "ISO 45001",
  ],
  "Fire Hazard": [
    "OSHA 1910.38 (Emergency Action Plans)",
    "NFPA 30 (Flammable Liquids)",
    "IBC Chapter 9",
  ],
  "Emergency Exit": [
    "OSHA 1910.36 (Means of Egress)",
    "NFPA 101 (Life Safety Code)",
    "Saudi Building Code",
  ],
  Environmental: [
    "OSHA 1910.95 (Occupational Noise)",
    "OSHA 1910.94 (Ventilation)",
    "ISO 14001",
  ],
};

// ============================================================================
// AI VIDEO ANALYZER CLASS
// ============================================================================

export class AIVideoAnalyzer {
  private static instance: AIVideoAnalyzer;

  private constructor() {}

  static getInstance(): AIVideoAnalyzer {
    if (!AIVideoAnalyzer.instance) {
      AIVideoAnalyzer.instance = new AIVideoAnalyzer();
    }
    return AIVideoAnalyzer.instance;
  }

  /**
   * Extract frames from video using browser APIs
   */
  async extractVideoFrames(
    videoFile: File,
    maxFrames: number = 10,
    intervalSeconds: number = 2,
  ): Promise<VideoFrame[]> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(
          new Error("Video frame extraction requires browser environment"),
        );
        return;
      }

      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const frames: VideoFrame[] = [];

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      video.onloadedmetadata = () => {
        const duration = video.duration;
        const frameInterval = Math.max(intervalSeconds, duration / maxFrames);
        let currentTime = 0;
        let frameCount = 0;

        const captureFrame = () => {
          if (frameCount >= maxFrames || currentTime >= duration) {
            resolve(frames);
            return;
          }

          video.currentTime = currentTime;
        };

        video.onseeked = () => {
          if (frameCount >= maxFrames) return;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const base64Data = canvas.toDataURL("image/jpeg", 0.8);

          frames.push({
            timestamp: currentTime,
            base64Data,
            width: canvas.width,
            height: canvas.height,
          });

          frameCount++;
          currentTime += frameInterval;
          captureFrame();
        };

        video.onerror = () => reject(new Error("Video loading error"));
        captureFrame();
      };

      video.src = URL.createObjectURL(videoFile);
    });
  }

  /**
   * Analyze video for safety violations
   */
  async analyzeVideoForSafety(
    videoFile: File,
    options: {
      maxFrames?: number;
      intervalSeconds?: number;
      analysisTypes?: string[];
    } = {},
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const {
      maxFrames = 10,
      intervalSeconds = 2,
      analysisTypes = ["ppe", "chemical", "behavior", "environmental"],
    } = options;

    try {
      // Extract frames from video
      console.log("Extracting frames from video...");
      const frames = await this.extractVideoFrames(
        videoFile,
        maxFrames,
        intervalSeconds,
      );

      if (frames.length === 0) {
        throw new Error("No frames could be extracted from video");
      }

      console.log(
        `Extracted ${frames.length} frames, analyzing for safety violations...`,
      );

      // Analyze each frame for safety violations
      const allViolations: SafetyViolation[] = [];

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        console.log(
          `Analyzing frame ${i + 1}/${frames.length} at ${frame.timestamp.toFixed(1)}s...`,
        );

        try {
          const frameViolations = await this.analyzeFrameForSafetyViolations(
            frame,
            analysisTypes,
          );
          allViolations.push(...frameViolations);
        } catch (frameError) {
          console.error(`Error analyzing frame ${i + 1}:`, frameError);
          continue;
        }
      }

      // Calculate summary
      const summary = {
        critical: allViolations.filter((v) => v.severity === "critical").length,
        high: allViolations.filter((v) => v.severity === "high").length,
        medium: allViolations.filter((v) => v.severity === "medium").length,
        low: allViolations.filter((v) => v.severity === "low").length,
      };

      const complianceScore = this.calculateComplianceScore(allViolations);
      const processingTime = Date.now() - startTime;

      const result: AnalysisResult = {
        videoId: `video_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        duration:
          frames.length > 0
            ? Math.max(...frames.map((f) => f.timestamp)) + intervalSeconds
            : 0,
        totalFramesAnalyzed: frames.length,
        violations: allViolations,
        complianceScore,
        summary,
        processingTime,
      };

      // Publish analysis event
      await eventBus.publish({
        type: "ai.video.analysis.completed",
        data: {
          videoId: result.videoId,
          violationsCount: allViolations.length,
          complianceScore,
          processingTime,
        },
      });

      console.log(
        `Analysis complete: ${allViolations.length} violations found, ${complianceScore.toFixed(1)}% compliance score`,
      );
      return result;
    } catch (error) {
      console.error("Video analysis error:", error);
      await eventBus.publish({
        type: "ai.video.analysis.failed",
        data: { error: String(error) },
      });
      throw new Error(
        `Video analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Analyze a single frame using AI Vision API
   */
  private async analyzeFrameForSafetyViolations(
    frame: VideoFrame,
    analysisTypes: string[] = ["ppe", "chemical", "behavior", "environmental"],
  ): Promise<SafetyViolation[]> {
    const violations: SafetyViolation[] = [];

    try {
      for (const analysisType of analysisTypes) {
        const prompt =
          SAFETY_PROMPTS[analysisType as keyof typeof SAFETY_PROMPTS];

        if (!prompt) continue;

        // Use AI vision service to analyze frame
        const response = await callAI({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: frame.base64Data,
                  },
                },
              ],
            },
          ],
          model: "gpt-4-vision-preview",
          max_tokens: 1000,
          temperature: 0.1,
        });

        const content = response?.content || "";
        if (!content) continue;

        try {
          // Parse AI response for violations
          const aiAnalysis = JSON.parse(content);

          if (aiAnalysis.violations && Array.isArray(aiAnalysis.violations)) {
            for (const violation of aiAnalysis.violations) {
              const violationType = violation.type || "Unknown Violation";
              const regulations = REGULATION_MAPPING[violationType] || [
                "General Safety Requirement",
              ];

              violations.push({
                id: `violation_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                timestamp: frame.timestamp,
                type: violationType,
                severity: violation.severity || "medium",
                confidence: Math.min(
                  Math.max(violation.confidence || 0.7, 0),
                  1,
                ),
                description:
                  violation.description ||
                  `${violationType} detected at ${frame.timestamp.toFixed(1)}s`,
                location: violation.location || { x: 0.5, y: 0.5 },
                regulations,
                actions: this.generateRecommendedActions(violationType),
                frameData: frame.base64Data,
              });
            }
          }
        } catch (parseError) {
          // If JSON parsing fails, try to extract violations from text
          const textViolations = this.extractViolationsFromText(
            content,
            frame,
            analysisType,
          );
          violations.push(...textViolations);
        }
      }
    } catch (error) {
      console.error("Error analyzing frame:", error);
    }

    return violations;
  }

  /**
   * Extract violations from text response if JSON parsing fails
   */
  private extractViolationsFromText(
    text: string,
    frame: VideoFrame,
    analysisType: string,
  ): SafetyViolation[] {
    const violations: SafetyViolation[] = [];
    const lowercaseText = text.toLowerCase();

    const violationKeywords: Record<string, string[]> = {
      ppe: [
        "helmet",
        "hard hat",
        "safety glasses",
        "gloves",
        "boots",
        "ppe",
        "protection",
      ],
      chemical: ["spill", "leak", "chemical", "vapor", "gas", "storage"],
      behavior: ["unsafe", "violation", "improper", "unauthorized", "hazard"],
      environmental: [
        "exit",
        "signage",
        "lighting",
        "ventilation",
        "housekeeping",
      ],
    };

    const keywords = violationKeywords[analysisType] || [];
    const foundKeywords = keywords.filter((keyword) =>
      lowercaseText.includes(keyword),
    );

    if (foundKeywords.length > 0) {
      violations.push({
        id: `text_violation_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        timestamp: frame.timestamp,
        type: `${analysisType.toUpperCase()} Violation`,
        severity: "medium",
        confidence: 0.6,
        description: `Potential ${analysisType} safety issue detected: ${foundKeywords.join(", ")}`,
        location: { x: 0.5, y: 0.5 },
        regulations: REGULATION_MAPPING[
          `${analysisType.toUpperCase()} Violation`
        ] || ["General Safety"],
        actions: this.generateRecommendedActions(
          `${analysisType.toUpperCase()} Violation`,
        ),
        frameData: frame.base64Data,
      });
    }

    return violations;
  }

  /**
   * Generate recommended actions based on violation type
   */
  private generateRecommendedActions(violationType: string): string[] {
    const actionMap: Record<string, string[]> = {
      "PPE Violation": [
        "Provide proper PPE to affected workers",
        "Conduct PPE training session",
        "Implement PPE inspection program",
        "Issue safety reminder notice",
      ],
      "Chemical Spill": [
        "Initiate spill response procedure",
        "Evacuate affected area",
        "Contact environmental response team",
        "Document incident for regulatory reporting",
      ],
      "Unsafe Behavior": [
        "Stop work and conduct safety briefing",
        "Retrain workers on safe procedures",
        "Implement additional supervision",
        "Review and update safety procedures",
      ],
      "Fire Hazard": [
        "Remove ignition sources immediately",
        "Increase fire watch frequency",
        "Review hot work permits",
        "Conduct fire safety training",
      ],
      "Emergency Exit": [
        "Clear obstruction immediately",
        "Post additional exit signage",
        "Conduct emergency evacuation drill",
        "Review emergency response plan",
      ],
    };

    return (
      actionMap[violationType] || [
        "Conduct safety assessment",
        "Implement corrective measures",
        "Provide additional training",
        "Monitor compliance",
      ]
    );
  }

  /**
   * Calculate compliance score based on violations
   */
  private calculateComplianceScore(violations: SafetyViolation[]): number {
    if (violations.length === 0) return 100;

    const severityWeights: Record<string, number> = {
      critical: 25,
      high: 15,
      medium: 10,
      low: 5,
    };

    const totalPenalty = violations.reduce((penalty, violation) => {
      return (
        penalty + severityWeights[violation.severity] * violation.confidence
      );
    }, 0);

    return Math.max(0, Math.min(100, 100 - totalPenalty));
  }
}

// Export singleton instance
export const aiVideoAnalyzer = AIVideoAnalyzer.getInstance();

export default AIVideoAnalyzer;
