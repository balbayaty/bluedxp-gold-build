/**
 * Comprehensive AI Vision Service
 * Processes images, thumbnails, and provides automatic root cause analysis
 * Supports GPT-4 Vision, Claude Vision, and fallback analysis
 */

import OpenAI from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import { aiRootCauseAnalysis } from "@/utils/aiOrchestration";
import { visionResilienceService } from "./vision/visionResilienceService";

export interface VisionAnalysisResult {
  id: string;
  timestamp: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  analysis: {
    description: string;
    detectedObjects: Array<{
      object: string;
      confidence: number;
      boundingBox?: { x: number; y: number; width: number; height: number };
    }>;
    safetyIssues: Array<{
      issue: string;
      severity: "low" | "medium" | "high" | "critical";
      confidence: number;
      location?: string;
    }>;
    qualityIssues: Array<{
      issue: string;
      type: "damage" | "defect" | "contamination" | "mislabeling" | "other";
      confidence: number;
      severity: "minor" | "major" | "critical";
    }>;
    complianceIssues: Array<{
      standard: string;
      violation: string;
      confidence: number;
      recommendation: string;
    }>;
    rootCauseAnalysis?: {
      rootCauses: Array<{
        cause: string;
        confidence: number;
        explanation: string;
      }>;
      recommendations: string[];
    };
  };
  metadata: {
    provider: string;
    model: string;
    processingTime: number;
    imageSize?: { width: number; height: number };
    fileSize?: number;
  };
  error?: string;
}

export interface VisionServiceConfig {
  provider?: "openai" | "anthropic" | "auto";
  enableRootCauseAnalysis?: boolean;
  enableThumbnailGeneration?: boolean;
  maxImageSize?: number; // in MB
}

class AIVisionService {
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private defaultConfig: VisionServiceConfig = {
    provider: "auto",
    enableRootCauseAnalysis: true,
    enableThumbnailGeneration: true,
    maxImageSize: 20, // 20MB
  };

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // Initialize OpenAI
    try {
      const openaiKey =
        process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (openaiKey) {
        this.openaiClient = new OpenAI({ apiKey: openaiKey });
      }
    } catch (error) {
      console.error("Error initializing OpenAI:", error);
    }

    // Initialize Anthropic
    try {
      const anthropicKey =
        process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
        process.env.ANTHROPIC_API_KEY;
      if (anthropicKey) {
        this.anthropicClient = new Anthropic({ apiKey: anthropicKey });
      }
    } catch (error) {
      console.error("Error initializing Anthropic:", error);
    }
  }

  /**
   * Check if vision service is available
   */
  isAvailable(): boolean {
    return !!(this.openaiClient || this.anthropicClient);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    const providers: string[] = [];
    if (this.openaiClient) providers.push("openai");
    if (this.anthropicClient) providers.push("anthropic");
    return providers;
  }

  /**
   * Convert image file to base64
   */
  private async imageToBase64(file: File): Promise<string> {
    // Server-safe path (Next.js route handlers run in Node.js where FileReader/DOM are unavailable)
    if (
      typeof window === "undefined" ||
      typeof (globalThis as any).FileReader === "undefined"
    ) {
      const buf = Buffer.from(await file.arrayBuffer());
      return buf.toString("base64");
    }

    // Browser path
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix if present
        const base64 = base64String.includes(",")
          ? base64String.split(",")[1]
          : base64String;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate thumbnail from image
   */
  private async generateThumbnail(
    file: File,
    maxWidth: number = 300,
    maxHeight: number = 300,
  ): Promise<string> {
    // Server-safe: we don't have DOM Canvas without additional native deps.
    // Returning the full image here would be expensive; so we skip thumbnail generation on the server.
    if (typeof window === "undefined" || typeof document === "undefined") {
      throw new Error(
        "Thumbnail generation is not available in server runtime",
      );
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and convert to base64
        ctx.drawImage(img, 0, 0, width, height);
        const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
        resolve(thumbnail);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Analyze image using OpenAI GPT-4 Vision
   */
  private async analyzeWithOpenAI(
    imageBase64: string,
    context?: string,
  ): Promise<Partial<VisionAnalysisResult["analysis"]>> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client not available");
    }

    const startTime = Date.now();

    const systemPrompt = `You are an expert AI vision system for warehouse operations, safety compliance, and quality control. Analyze images and provide detailed insights about:
1. Detected objects and their locations
2. Safety issues (PPE compliance, hazards, unsafe conditions)
3. Quality issues (damage, defects, contamination, mislabeling)
4. Compliance issues (ISO standards, regulations, best practices)

Provide structured analysis with confidence scores (0-100) for each detection.`;

    const userPrompt = context
      ? `Context: ${context}\n\nAnalyze this warehouse/industrial image and identify any issues, objects, or compliance concerns.`
      : `Analyze this warehouse/industrial image and identify any issues, objects, or compliance concerns.`;

    try {
      const response = await this.openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || "";
      const processingTime = Date.now() - startTime;

      return this.parseVisionResponse(content, processingTime);
    } catch (error) {
      console.error("OpenAI Vision API error:", error);
      throw error;
    }
  }

  /**
   * Analyze image using Anthropic Claude Vision
   */
  private async analyzeWithAnthropic(
    imageBase64: string,
    context?: string,
  ): Promise<Partial<VisionAnalysisResult["analysis"]>> {
    if (!this.anthropicClient) {
      throw new Error("Anthropic client not available");
    }

    const startTime = Date.now();

    const systemPrompt = `You are an expert AI vision system for warehouse operations, safety compliance, and quality control. Analyze images and provide detailed insights about:
1. Detected objects and their locations
2. Safety issues (PPE compliance, hazards, unsafe conditions)
3. Quality issues (damage, defects, contamination, mislabeling)
4. Compliance issues (ISO standards, regulations, best practices)

Provide structured analysis with confidence scores (0-100) for each detection.`;

    const userPrompt = context
      ? `Context: ${context}\n\nAnalyze this warehouse/industrial image and identify any issues, objects, or compliance concerns.`
      : `Analyze this warehouse/industrial image and identify any issues, objects, or compliance concerns.`;

    try {
      const response = await this.anthropicClient.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: userPrompt,
              },
            ],
          },
        ],
      });

      const content =
        response.content.find((c) => c.type === "text")?.text || "";
      const processingTime = Date.now() - startTime;

      return this.parseVisionResponse(content, processingTime);
    } catch (error) {
      console.error("Anthropic Vision API error:", error);
      throw error;
    }
  }

  /**
   * Parse vision API response into structured format
   */
  private parseVisionResponse(
    content: string,
    processingTime: number,
  ): Partial<VisionAnalysisResult["analysis"]> {
    // Try to extract structured data from response
    const analysis: Partial<VisionAnalysisResult["analysis"]> = {
      description: content.substring(0, 500),
      detectedObjects: [],
      safetyIssues: [],
      qualityIssues: [],
      complianceIssues: [],
    };

    // Extract detected objects
    const objectMatches = content.matchAll(
      /object[:\s]+([^,\.]+)[,\s]+confidence[:\s]+(\d+)/gi,
    );
    for (const match of objectMatches) {
      analysis.detectedObjects?.push({
        object: match[1].trim(),
        confidence: parseInt(match[2]) || 50,
      });
    }

    // Extract safety issues
    const safetyMatches = content.matchAll(
      /safety[:\s]+([^,\.]+)[,\s]+severity[:\s]+(low|medium|high|critical)[,\s]+confidence[:\s]+(\d+)/gi,
    );
    for (const match of safetyMatches) {
      analysis.safetyIssues?.push({
        issue: match[1].trim(),
        severity: match[2].toLowerCase() as
          | "low"
          | "medium"
          | "high"
          | "critical",
        confidence: parseInt(match[3]) || 50,
      });
    }

    // Extract quality issues
    const qualityMatches = content.matchAll(
      /quality[:\s]+([^,\.]+)[,\s]+type[:\s]+(damage|defect|contamination|mislabeling|other)[,\s]+severity[:\s]+(minor|major|critical)[,\s]+confidence[:\s]+(\d+)/gi,
    );
    for (const match of qualityMatches) {
      analysis.qualityIssues?.push({
        issue: match[1].trim(),
        type: match[2].toLowerCase() as
          | "damage"
          | "defect"
          | "contamination"
          | "mislabeling"
          | "other",
        severity: match[3].toLowerCase() as "minor" | "major" | "critical",
        confidence: parseInt(match[4]) || 50,
      });
    }

    // Extract compliance issues
    const complianceMatches = content.matchAll(
      /compliance[:\s]+([^,\.]+)[,\s]+standard[:\s]+([^,\.]+)[,\s]+violation[:\s]+([^,\.]+)[,\s]+confidence[:\s]+(\d+)/gi,
    );
    for (const match of complianceMatches) {
      analysis.complianceIssues?.push({
        standard: match[2].trim(),
        violation: match[3].trim(),
        confidence: parseInt(match[4]) || 50,
        recommendation: "Review and address compliance issue",
      });
    }

    // If no structured data found, create from general description
    if (analysis.detectedObjects?.length === 0 && content.length > 0) {
      // Try to infer from description
      const lowerContent = content.toLowerCase();

      // Safety keywords
      if (
        lowerContent.includes("ppe") ||
        lowerContent.includes("safety") ||
        lowerContent.includes("hazard")
      ) {
        analysis.safetyIssues?.push({
          issue: "Safety concern detected",
          severity:
            lowerContent.includes("critical") || lowerContent.includes("urgent")
              ? "high"
              : "medium",
          confidence: 70,
        });
      }

      // Quality keywords
      if (
        lowerContent.includes("damage") ||
        lowerContent.includes("defect") ||
        lowerContent.includes("broken")
      ) {
        analysis.qualityIssues?.push({
          issue: "Quality issue detected",
          type: lowerContent.includes("damage") ? "damage" : "defect",
          severity:
            lowerContent.includes("severe") || lowerContent.includes("major")
              ? "major"
              : "minor",
          confidence: 75,
        });
      }

      // Compliance keywords
      if (
        lowerContent.includes("iso") ||
        lowerContent.includes("compliance") ||
        lowerContent.includes("standard")
      ) {
        analysis.complianceIssues?.push({
          standard: "ISO Standard",
          violation: "Potential compliance issue detected",
          confidence: 65,
          recommendation: "Review compliance requirements",
        });
      }
    }

    return analysis;
  }

  /**
   * Main analysis function
   */
  async analyzeImage(
    imageFile: File | string,
    context?: string,
    config?: VisionServiceConfig,
  ): Promise<VisionAnalysisResult> {
    const startTime = Date.now();
    const mergedConfig = { ...this.defaultConfig, ...config };
    const resultId = `vision-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    try {
      // Validate image size
      if (imageFile instanceof File) {
        const fileSizeMB = imageFile.size / (1024 * 1024);
        if (fileSizeMB > (mergedConfig.maxImageSize || 20)) {
          throw new Error(
            `Image size (${fileSizeMB.toFixed(2)}MB) exceeds maximum (${mergedConfig.maxImageSize}MB)`,
          );
        }
      }

      // Convert to base64
      let imageBase64: string;
      let thumbnailBase64: string | undefined;
      let imageUrl: string | undefined;
      let thumbnailUrl: string | undefined;

      if (imageFile instanceof File) {
        imageBase64 = await this.imageToBase64(imageFile);

        // Generate thumbnail if enabled
        if (mergedConfig.enableThumbnailGeneration) {
          try {
            thumbnailBase64 = await this.generateThumbnail(imageFile);
            thumbnailUrl = thumbnailBase64;
          } catch (error) {
            console.warn("Thumbnail generation failed:", error);
          }
        }

        // Create object URL for display (browser only)
        if (
          typeof window !== "undefined" &&
          typeof URL !== "undefined" &&
          typeof URL.createObjectURL === "function"
        ) {
          imageUrl = URL.createObjectURL(imageFile);
        }
      } else {
        // Assume it's a URL or base64 string
        if (imageFile.startsWith("data:")) {
          imageBase64 = imageFile.split(",")[1] || imageFile;
        } else if (imageFile.startsWith("http")) {
          // Fetch and convert URL to base64
          const response = await fetch(imageFile);
          const blob = await response.blob();
          const file = new File([blob], "image.jpg", { type: blob.type });
          imageBase64 = await this.imageToBase64(file);
          imageUrl = imageFile;
        } else {
          imageBase64 = imageFile;
        }
      }

      // Determine provider
      let provider: "openai" | "anthropic" = "openai";
      if (mergedConfig.provider === "anthropic" && this.anthropicClient) {
        provider = "anthropic";
      } else if (mergedConfig.provider === "auto") {
        provider = this.anthropicClient
          ? "anthropic"
          : this.openaiClient
            ? "openai"
            : "openai";
      }

      // Analyze image with resilience (circuit breaker, retry, fallback)
      let analysis: Partial<VisionAnalysisResult["analysis"]>;
      let model: string;

      const cacheKey = `vision:${imageBase64.substring(0, 50)}:${context || "default"}`;

      try {
        if (provider === "anthropic" && this.anthropicClient) {
          analysis = await visionResilienceService.executeWithProviderFallback(
            () => this.analyzeWithOpenAI(imageBase64, context), // Fallback to OpenAI
            () => this.analyzeWithAnthropic(imageBase64, context), // Primary: Anthropic
            cacheKey,
          );
          model = "claude-3-5-sonnet-20241022";
        } else if (this.openaiClient) {
          analysis = await visionResilienceService.executeWithProviderFallback(
            () => this.analyzeWithOpenAI(imageBase64, context), // Primary: OpenAI
            () =>
              this.anthropicClient
                ? this.analyzeWithAnthropic(imageBase64, context)
                : Promise.reject(new Error("No provider")), // Fallback to Anthropic
            cacheKey,
          );
          model = "gpt-4o";
        } else {
          throw new Error("No vision API provider available");
        }
      } catch (error) {
        // Handle error with resilience service
        const errorInfo = visionResilienceService.handleVisionError(
          error,
          "vision analysis",
        );
        console.error("Vision analysis error:", errorInfo);

        // Return error result instead of throwing
        return {
          id: resultId,
          timestamp: new Date().toISOString(),
          analysis: {
            description: `Analysis failed: ${errorInfo.error}`,
            detectedObjects: [],
            safetyIssues: [],
            qualityIssues: [],
            complianceIssues: [],
          },
          metadata: {
            provider: "error",
            model: "N/A",
            processingTime: Date.now() - startTime,
          },
          error: errorInfo.error,
        };
      }

      // Perform root cause analysis if enabled and issues found
      // This is optional - failure doesn't affect the main analysis
      if (mergedConfig.enableRootCauseAnalysis) {
        const allIssues: string[] = [
          ...(analysis.safetyIssues?.map((i) => `Safety: ${i.issue}`) || []),
          ...(analysis.qualityIssues?.map((i) => `Quality: ${i.issue}`) || []),
          ...(analysis.complianceIssues?.map(
            (i) => `Compliance: ${i.violation}`,
          ) || []),
        ];

        if (allIssues.length > 0) {
          try {
            const rootCauseResult = await aiRootCauseAnalysis(
              `Image analysis detected ${allIssues.length} issue(s)`,
              allIssues,
              {
                imageContext: context,
                detectedObjects: analysis.detectedObjects,
                analysisDescription: analysis.description,
              },
            );

            analysis.rootCauseAnalysis = rootCauseResult;
          } catch (error) {
            console.warn("Root cause analysis failed (non-critical):", error);
            // Don't fail the entire analysis if root cause analysis fails
          }
        }
      }

      const processingTime = Date.now() - startTime;

      // Generate appropriate description based on analysis results
      let description = analysis.description || "Image analysis completed";

      // If no description was provided by AI, create one based on results
      if (!analysis.description || analysis.description === "Analysis failed") {
        const totalIssues =
          (analysis.safetyIssues?.length || 0) +
          (analysis.qualityIssues?.length || 0) +
          (analysis.complianceIssues?.length || 0);

        if (totalIssues === 0) {
          description = "Analysis completed successfully. No issues detected.";
        } else {
          description = `Analysis completed. ${totalIssues} issue(s) detected.`;
        }
      }

      // Analysis succeeded! Return success with actual provider name
      return {
        id: resultId,
        timestamp: new Date().toISOString(),
        imageUrl,
        thumbnailUrl,
        analysis: {
          description,
          detectedObjects: analysis.detectedObjects || [],
          safetyIssues: analysis.safetyIssues || [],
          qualityIssues: analysis.qualityIssues || [],
          complianceIssues: analysis.complianceIssues || [],
          rootCauseAnalysis: analysis.rootCauseAnalysis,
        },
        metadata: {
          provider: provider === "openai" ? "OpenAI" : "Anthropic",
          model,
          processingTime,
          fileSize: imageFile instanceof File ? imageFile.size : undefined,
        },
      };
    } catch (error) {
      console.error("Vision analysis error:", error);

      // Only mark as failed if it's a critical error (API failure, no provider, etc.)
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const isCriticalError =
        errorMessage.includes("No vision API provider") ||
        errorMessage.includes("API") ||
        errorMessage.includes("network") ||
        errorMessage.includes("fetch");

      return {
        id: resultId,
        timestamp: new Date().toISOString(),
        analysis: {
          description: isCriticalError
            ? "Analysis failed: " + errorMessage
            : "Analysis completed with warnings",
          detectedObjects: [],
          safetyIssues: [],
          qualityIssues: [],
          complianceIssues: [],
        },
        metadata: {
          provider: isCriticalError ? "Error" : "Warning",
          model: "N/A",
          processingTime: Date.now() - startTime,
        },
        error: errorMessage,
      };
    }
  }

  /**
   * Batch analyze multiple images
   */
  async analyzeBatch(
    imageFiles: File[],
    context?: string,
    config?: VisionServiceConfig,
  ): Promise<VisionAnalysisResult[]> {
    const results: VisionAnalysisResult[] = [];

    for (const file of imageFiles) {
      try {
        const result = await this.analyzeImage(file, context, config);
        results.push(result);
      } catch (error) {
        console.error(`Error analyzing image ${file.name}:`, error);
        results.push({
          id: `vision-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          analysis: {
            description: "Analysis failed",
            detectedObjects: [],
            safetyIssues: [],
            qualityIssues: [],
            complianceIssues: [],
          },
          metadata: {
            provider: "Error",
            model: "N/A",
            processingTime: 0,
          },
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }
}

// Export singleton instance
export const visionService = new AIVisionService();
export default visionService;
