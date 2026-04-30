/**
 * Video Analysis Service
 * AI-powered video analysis with frame extraction and real-time monitoring
 * Supports safety, quality, and compliance analysis from video streams
 */

import visionService, { VisionAnalysisResult } from "./visionService";
import enhancedVisionService from "./enhancedVisionService";

// ============================================================================
// TYPES
// ============================================================================

export type VideoAnalysisMode =
  | "general"
  | "safety"
  | "quality"
  | "ppe"
  | "storage"
  | "behavior";

export interface VideoSource {
  id: string;
  name: string;
  type: "file" | "stream" | "rtsp" | "hls" | "webcam";
  url: string;
  location?: string;
  description?: string;
  isActive: boolean;
}

export interface VideoAnalysisConfig {
  mode: VideoAnalysisMode;
  frameInterval: number; // Analyze every N frames
  fps: number; // Frames per second of the video
  enableObjectTracking: boolean;
  enableMotionDetection: boolean;
  enableAlerts: boolean;
  alertThreshold: number; // 0-100, trigger alert when issue severity >= this
  customPrompt?: string;
}

export interface FrameAnalysis {
  frameNumber: number;
  timestamp: number; // ms from start
  analysis: VisionAnalysisResult;
  motionScore?: number; // 0-100
  objectsTracked?: TrackedObject[];
}

export interface TrackedObject {
  id: string;
  type: string;
  name: string;
  confidence: number;
  positions: {
    frameNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  firstSeen: number;
  lastSeen: number;
  velocity?: { x: number; y: number };
}

export interface VideoAnalysisResult {
  id: string;
  sourceId: string;
  sourceName: string;

  // Analysis details
  mode: VideoAnalysisMode;
  startTime: Date | string;
  endTime?: Date | string;
  duration: number; // ms

  // Frame analysis
  totalFrames: number;
  analyzedFrames: number;
  frameAnalyses: FrameAnalysis[];

  // Aggregated results
  summary: VideoAnalysisSummary;

  // Issues and alerts
  issues: VideoIssue[];
  alerts: VideoAlert[];

  // Metadata
  metadata: {
    processingTime: number;
    provider: string;
    configUsed: VideoAnalysisConfig;
  };
}

export interface VideoAnalysisSummary {
  overallComplianceScore: number; // 0-100
  safetyScore: number; // 0-100
  qualityScore: number; // 0-100

  // Detections
  totalIssuesDetected: number;
  issuesBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };

  // Object statistics
  objectsDetected: { type: string; count: number; avgConfidence: number }[];

  // Time-based analysis
  riskTrend: { timestamp: number; riskScore: number }[];

  // Recommendations
  topRecommendations: string[];
}

export interface VideoIssue {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  firstDetectedFrame: number;
  lastDetectedFrame: number;
  affectedArea?: { x: number; y: number; width: number; height: number };
  confidence: number;
  recommendation?: string;
}

export interface VideoAlert {
  id: string;
  type: "safety" | "compliance" | "quality" | "security";
  severity: "warning" | "critical";
  message: string;
  timestamp: number;
  frameNumber: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date | string;
}

// ============================================================================
// VIDEO ANALYSIS SERVICE
// ============================================================================

class VideoAnalysisService {
  private activeAnalyses: Map<
    string,
    { status: "running" | "paused" | "completed"; result: VideoAnalysisResult }
  > = new Map();
  private alertCallbacks: Set<(alert: VideoAlert) => void> = new Set();

  /**
   * Analyze a video file
   */
  async analyzeVideo(
    video: File | Blob,
    config: Partial<VideoAnalysisConfig> = {},
  ): Promise<VideoAnalysisResult> {
    const fullConfig = this.getDefaultConfig(config);
    const analysisId = `video-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const result: VideoAnalysisResult = {
      id: analysisId,
      sourceId: "file-upload",
      sourceName: video instanceof File ? video.name : "Uploaded Video",
      mode: fullConfig.mode,
      startTime: new Date().toISOString(),
      duration: 0,
      totalFrames: 0,
      analyzedFrames: 0,
      frameAnalyses: [],
      summary: this.createEmptySummary(),
      issues: [],
      alerts: [],
      metadata: {
        processingTime: 0,
        provider: "mock",
        configUsed: fullConfig,
      },
    };

    this.activeAnalyses.set(analysisId, { status: "running", result });

    try {
      // Extract frames from video
      const frames = await this.extractFrames(video, fullConfig);
      result.totalFrames = frames.length;

      // Analyze each frame
      const startTime = Date.now();

      for (let i = 0; i < frames.length; i += fullConfig.frameInterval) {
        const frame = frames[i];
        const frameAnalysis = await this.analyzeFrame(
          frame.data,
          frame.timestamp,
          i,
          fullConfig,
        );
        result.frameAnalyses.push(frameAnalysis);
        result.analyzedFrames++;

        // Extract issues
        this.extractIssuesFromFrame(frameAnalysis, result);

        // Check for alerts
        if (fullConfig.enableAlerts) {
          this.checkForAlerts(frameAnalysis, result, fullConfig);
        }

        // Update status
        this.activeAnalyses.set(analysisId, { status: "running", result });
      }

      result.endTime = new Date().toISOString();
      result.duration = Date.now() - new Date(result.startTime).getTime();
      result.metadata.processingTime = Date.now() - startTime;

      // Generate summary
      result.summary = this.generateSummary(result);

      this.activeAnalyses.set(analysisId, { status: "completed", result });
      return result;
    } catch (error) {
      console.error("Video analysis error:", error);
      result.endTime = new Date().toISOString();
      this.activeAnalyses.set(analysisId, { status: "completed", result });
      throw error;
    }
  }

  /**
   * Start continuous monitoring of a video stream
   */
  async startStreamAnalysis(
    source: VideoSource,
    config: Partial<VideoAnalysisConfig> = {},
    onFrame?: (analysis: FrameAnalysis) => void,
  ): Promise<string> {
    const fullConfig = this.getDefaultConfig(config);
    const analysisId = `stream-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const result: VideoAnalysisResult = {
      id: analysisId,
      sourceId: source.id,
      sourceName: source.name,
      mode: fullConfig.mode,
      startTime: new Date().toISOString(),
      duration: 0,
      totalFrames: 0,
      analyzedFrames: 0,
      frameAnalyses: [],
      summary: this.createEmptySummary(),
      issues: [],
      alerts: [],
      metadata: {
        processingTime: 0,
        provider: "mock",
        configUsed: fullConfig,
      },
    };

    this.activeAnalyses.set(analysisId, { status: "running", result });

    // Start background analysis (would connect to actual stream in production)
    this.runStreamAnalysis(analysisId, source, fullConfig, onFrame);

    return analysisId;
  }

  /**
   * Stop a running stream analysis
   */
  stopStreamAnalysis(analysisId: string): VideoAnalysisResult | null {
    const analysis = this.activeAnalyses.get(analysisId);
    if (analysis && analysis.status === "running") {
      analysis.status = "completed";
      analysis.result.endTime = new Date().toISOString();
      analysis.result.duration =
        Date.now() - new Date(analysis.result.startTime).getTime();
      analysis.result.summary = this.generateSummary(analysis.result);
      return analysis.result;
    }
    return null;
  }

  /**
   * Get status of an analysis
   */
  getAnalysisStatus(
    analysisId: string,
  ): { status: string; result: VideoAnalysisResult } | null {
    return this.activeAnalyses.get(analysisId) || null;
  }

  /**
   * Subscribe to alerts
   */
  onAlert(callback: (alert: VideoAlert) => void): () => void {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(
    analysisId: string,
    alertId: string,
    acknowledgedBy: string,
  ): boolean {
    const analysis = this.activeAnalyses.get(analysisId);
    if (analysis) {
      const alert = analysis.result.alerts.find((a) => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        alert.acknowledgedBy = acknowledgedBy;
        alert.acknowledgedAt = new Date().toISOString();
        return true;
      }
    }
    return false;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private getDefaultConfig(
    partial: Partial<VideoAnalysisConfig>,
  ): VideoAnalysisConfig {
    return {
      mode: "general",
      frameInterval: 30, // Every 30 frames (1 second at 30fps)
      fps: 30,
      enableObjectTracking: true,
      enableMotionDetection: true,
      enableAlerts: true,
      alertThreshold: 70,
      ...partial,
    };
  }

  private async extractFrames(
    video: File | Blob,
    config: VideoAnalysisConfig,
  ): Promise<{ data: Buffer; timestamp: number }[]> {
    const frames: { data: Buffer; timestamp: number }[] = [];

    try {
      // Method 1: Try to use HTML5 Video API for frame extraction (browser)
      if (typeof window !== "undefined" && video instanceof Blob) {
        const extracted = await this.extractFramesFromVideoElement(
          video,
          config,
        );
        if (extracted.length > 0) {
          return extracted;
        }
      }

      // Method 2: Use canvas-based extraction (works in browser)
      if (typeof document !== "undefined" && video instanceof Blob) {
        const extracted = await this.extractFramesFromCanvas(video, config);
        if (extracted.length > 0) {
          return extracted;
        }
      }

      // Method 3: Server-side - extract key frames using video metadata
      // For server-side, we'll sample frames at intervals
      const extracted = await this.extractFramesBySampling(video, config);
      return extracted;
    } catch (error) {
      console.error("Frame extraction error:", error);
      // Fallback: Return sample frames based on video duration estimate
      return this.extractFramesBySampling(video, config);
    }
  }

  /**
   * Extract frames using HTML5 Video element (browser only)
   */
  private async extractFramesFromVideoElement(
    video: Blob,
    config: VideoAnalysisConfig,
  ): Promise<{ data: Buffer; timestamp: number }[]> {
    return new Promise((resolve) => {
      const videoElement = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const frames: { data: Buffer; timestamp: number }[] = [];

      if (!ctx) {
        resolve([]);
        return;
      }

      videoElement.preload = "metadata";
      videoElement.src = URL.createObjectURL(video);

      videoElement.onloadedmetadata = () => {
        const duration = videoElement.duration * 1000; // Convert to ms
        const frameInterval = Math.floor(
          (1000 / config.fps) * config.frameInterval,
        );
        const totalFrames = Math.floor(duration / frameInterval);

        let frameIndex = 0;

        const captureFrame = () => {
          if (frameIndex >= totalFrames) {
            URL.revokeObjectURL(videoElement.src);
            resolve(frames);
            return;
          }

          const timestamp = frameIndex * frameInterval;
          videoElement.currentTime = timestamp / 1000;

          videoElement.onseeked = () => {
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            ctx.drawImage(videoElement, 0, 0);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  blob.arrayBuffer().then((arrayBuffer) => {
                    frames.push({
                      data: Buffer.from(arrayBuffer),
                      timestamp,
                    });
                    frameIndex++;
                    captureFrame();
                  });
                } else {
                  frameIndex++;
                  captureFrame();
                }
              },
              "image/jpeg",
              0.8,
            );
          };
        };

        captureFrame();
      };

      videoElement.onerror = () => {
        URL.revokeObjectURL(videoElement.src);
        resolve([]);
      };
    });
  }

  /**
   * Extract frames using Canvas API (browser only)
   */
  private async extractFramesFromCanvas(
    video: Blob,
    config: VideoAnalysisConfig,
  ): Promise<{ data: Buffer; timestamp: number }[]> {
    // Similar to video element but with different approach
    // This is a fallback if video element doesn't work
    return this.extractFramesFromVideoElement(video, config);
  }

  /**
   * Extract frames by sampling at intervals (server-side fallback)
   */
  private async extractFramesBySampling(
    video: File | Blob,
    config: VideoAnalysisConfig,
  ): Promise<{ data: Buffer; timestamp: number }[]> {
    const frames: { data: Buffer; timestamp: number }[] = [];

    // Estimate video duration (default to 10 seconds if unknown)
    // In production, would use ffmpeg or similar to get actual duration
    const estimatedDuration = 10000; // 10 seconds default
    const frameInterval = Math.floor(
      (1000 / config.fps) * config.frameInterval,
    );
    const frameCount = Math.floor(estimatedDuration / frameInterval);

    // For server-side, we'll create placeholder frames
    // In production, would use ffmpeg to extract actual frames
    // This allows the service to work while real video processing is set up
    for (let i = 0; i < frameCount; i += config.frameInterval) {
      const timestamp = i * frameInterval;

      // Create a placeholder frame
      // In production, this would be actual extracted frame data
      const frameData = Buffer.from(
        JSON.stringify({
          frameNumber: i,
          timestamp,
          source: "video",
          note: "Frame extraction requires ffmpeg or browser video API",
        }),
      );

      frames.push({ data: frameData, timestamp });
    }

    return frames;
  }

  private async analyzeFrame(
    frameData: Buffer,
    timestamp: number,
    frameNumber: number,
    config: VideoAnalysisConfig,
  ): Promise<FrameAnalysis> {
    try {
      // Check if frameData is actual image data or placeholder
      const isPlaceholder = frameData.toString().startsWith("{");

      if (isPlaceholder) {
        // Placeholder frame - return basic analysis
        return {
          frameNumber,
          timestamp,
          analysis: {
            id: `frame-${frameNumber}`,
            timestamp: new Date().toISOString(),
            analysis: {
              description: "Frame extraction requires video processing setup",
              detectedObjects: [],
              safetyIssues: [],
              qualityIssues: [],
              complianceIssues: [],
            },
            metadata: {
              provider: "placeholder",
              model: "N/A",
              processingTime: 0,
            },
          },
          motionScore: undefined,
        };
      }

      // Real frame data - use enhanced vision service for better analysis
      // Convert buffer to File for vision service
      const frameFile = new File([frameData], `frame-${frameNumber}.jpg`, {
        type: "image/jpeg",
      });

      // Use enhanced vision service for better context and RAG integration
      const enhancedResult = await enhancedVisionService.analyzeWithRAG(
        frameFile,
        this.getContextForMode(config.mode),
        {
          enableRAG: true,
          enableLearning: false, // Don't learn from every frame to avoid overload
          enableIndustryAnalysis: config.mode !== "general",
          extractText: false, // Skip OCR for video frames (performance)
          searchSimilarCases: false, // Skip for performance
        },
      );

      // Use the vision result from enhanced analysis
      const visionResult = enhancedResult;

      // Calculate motion score if enabled
      let motionScore: number | undefined;
      if (config.enableMotionDetection && this.previousFrameAnalysis) {
        motionScore = this.calculateMotionScore(
          this.previousFrameAnalysis.analysis,
          visionResult,
        );
      }

      // Store for next frame comparison
      this.previousFrameAnalysis = {
        frameNumber,
        timestamp,
        analysis: visionResult,
      };

      return {
        frameNumber,
        timestamp,
        analysis: visionResult,
        motionScore,
      };
    } catch (error) {
      console.error(`Error analyzing frame ${frameNumber}:`, error);
      // Return error frame
      return {
        frameNumber,
        timestamp,
        analysis: {
          id: `frame-error-${frameNumber}`,
          timestamp: new Date().toISOString(),
          analysis: {
            description: `Frame analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            detectedObjects: [],
            safetyIssues: [],
            qualityIssues: [],
            complianceIssues: [],
          },
          metadata: {
            provider: "error",
            model: "N/A",
            processingTime: 0,
          },
          error: error instanceof Error ? error.message : "Unknown error",
        },
        motionScore: undefined,
      };
    }
  }

  private previousFrameAnalysis: {
    frameNumber: number;
    timestamp: number;
    analysis: VisionAnalysisResult;
  } | null = null;

  /**
   * Calculate motion score by comparing with previous frame
   */
  private calculateMotionScore(
    previousAnalysis: VisionAnalysisResult,
    currentAnalysis: VisionAnalysisResult,
  ): number {
    // Simple motion detection based on object position changes
    // In production, would use more sophisticated computer vision techniques

    const prevObjects = previousAnalysis.analysis.detectedObjects || [];
    const currObjects = currentAnalysis.analysis.detectedObjects || [];

    // Count new objects or changed positions
    const newObjects = currObjects.filter(
      (curr) => !prevObjects.some((prev) => prev.object === curr.object),
    ).length;

    const motionScore = Math.min(
      100,
      (newObjects / Math.max(1, currObjects.length)) * 100,
    );

    return motionScore;
  }

  private getContextForMode(mode: VideoAnalysisMode): string {
    switch (mode) {
      case "safety":
        return "Safety analysis: Identify safety hazards, unsafe behaviors, and potential risks";
      case "quality":
        return "Quality control: Detect defects, damage, and quality issues";
      case "ppe":
        return "PPE compliance: Check for proper protective equipment usage";
      case "storage":
        return "Storage safety: Verify proper storage, segregation, and organization";
      case "behavior":
        return "Behavior analysis: Monitor worker activities and identify unsafe behaviors";
      default:
        return "General analysis: Identify all relevant issues and concerns";
    }
  }

  private extractIssuesFromFrame(
    frame: FrameAnalysis,
    result: VideoAnalysisResult,
  ): void {
    const analysis = frame.analysis.analysis;

    // Extract safety issues
    for (const issue of analysis.safetyIssues || []) {
      const existingIssue = result.issues.find(
        (i) => i.type === issue.issue && i.severity === issue.severity,
      );
      if (existingIssue) {
        existingIssue.lastDetectedFrame = frame.frameNumber;
      } else {
        result.issues.push({
          id: `issue-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: issue.issue,
          severity:
            issue.severity === "critical"
              ? "critical"
              : issue.severity === "high"
                ? "high"
                : issue.severity === "medium"
                  ? "medium"
                  : "low",
          description: issue.issue,
          firstDetectedFrame: frame.frameNumber,
          lastDetectedFrame: frame.frameNumber,
          confidence: issue.confidence,
          recommendation: `Address ${issue.issue.toLowerCase()} immediately`,
        });
      }
    }

    // Extract quality issues
    for (const issue of analysis.qualityIssues || []) {
      result.issues.push({
        id: `issue-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: issue.issue,
        severity: issue.severity,
        description: issue.issue,
        firstDetectedFrame: frame.frameNumber,
        lastDetectedFrame: frame.frameNumber,
        confidence: issue.confidence,
      });
    }

    // Extract compliance issues
    for (const issue of analysis.complianceIssues || []) {
      result.issues.push({
        id: `issue-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: `${issue.standard}: ${issue.violation}`,
        severity: "high",
        description: issue.violation,
        firstDetectedFrame: frame.frameNumber,
        lastDetectedFrame: frame.frameNumber,
        confidence: issue.confidence,
        recommendation: issue.recommendation,
      });
    }
  }

  private checkForAlerts(
    frame: FrameAnalysis,
    result: VideoAnalysisResult,
    config: VideoAnalysisConfig,
  ): void {
    const analysis = frame.analysis.analysis;

    // Check safety issues for alerts
    for (const issue of analysis.safetyIssues || []) {
      if (issue.severity === "critical" || issue.severity === "high") {
        const alert: VideoAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "safety",
          severity: issue.severity === "critical" ? "critical" : "warning",
          message: `Safety issue detected: ${issue.issue}`,
          timestamp: frame.timestamp,
          frameNumber: frame.frameNumber,
          acknowledged: false,
        };
        result.alerts.push(alert);
        this.notifyAlert(alert);
      }
    }

    // Check compliance issues for alerts
    for (const issue of analysis.complianceIssues || []) {
      if (issue.confidence >= config.alertThreshold) {
        const alert: VideoAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "compliance",
          severity: "warning",
          message: `Compliance violation: ${issue.violation}`,
          timestamp: frame.timestamp,
          frameNumber: frame.frameNumber,
          acknowledged: false,
        };
        result.alerts.push(alert);
        this.notifyAlert(alert);
      }
    }
  }

  private notifyAlert(alert: VideoAlert): void {
    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (error) {
        console.error("Alert callback error:", error);
      }
    }
  }

  private generateSummary(result: VideoAnalysisResult): VideoAnalysisSummary {
    const issuesBySeverity = {
      critical: result.issues.filter((i) => i.severity === "critical").length,
      high: result.issues.filter((i) => i.severity === "high").length,
      medium: result.issues.filter((i) => i.severity === "medium").length,
      low: result.issues.filter((i) => i.severity === "low").length,
    };

    // Calculate scores based on issues
    const totalIssues = result.issues.length;
    const weightedIssues =
      issuesBySeverity.critical * 4 +
      issuesBySeverity.high * 3 +
      issuesBySeverity.medium * 2 +
      issuesBySeverity.low;

    const safetyScore = Math.max(0, 100 - weightedIssues * 5);
    const qualityScore = Math.max(0, 100 - totalIssues * 3);
    const complianceScore = Math.max(
      0,
      100 - (issuesBySeverity.critical * 20 + issuesBySeverity.high * 10),
    );

    // Aggregate objects detected
    const objectCounts: Record<
      string,
      { count: number; totalConfidence: number }
    > = {};
    for (const frame of result.frameAnalyses) {
      for (const obj of frame.analysis.analysis.detectedObjects || []) {
        if (!objectCounts[obj.object]) {
          objectCounts[obj.object] = { count: 0, totalConfidence: 0 };
        }
        objectCounts[obj.object].count++;
        objectCounts[obj.object].totalConfidence += obj.confidence;
      }
    }

    const objectsDetected = Object.entries(objectCounts).map(
      ([type, data]) => ({
        type,
        count: data.count,
        avgConfidence: data.totalConfidence / data.count,
      }),
    );

    // Generate risk trend
    const riskTrend = result.frameAnalyses.map((frame) => ({
      timestamp: frame.timestamp,
      riskScore:
        (frame.analysis.analysis.safetyIssues?.length || 0) * 20 +
        (frame.analysis.analysis.qualityIssues?.length || 0) * 10 +
        (frame.analysis.analysis.complianceIssues?.length || 0) * 15,
    }));

    // Generate recommendations
    const recommendations: string[] = [];
    if (issuesBySeverity.critical > 0) {
      recommendations.push("Address critical safety issues immediately");
    }
    if (issuesBySeverity.high > 2) {
      recommendations.push(
        "Review and remediate high-priority issues within 24 hours",
      );
    }
    if (safetyScore < 70) {
      recommendations.push("Conduct safety training for personnel");
    }
    if (complianceScore < 80) {
      recommendations.push("Review compliance procedures and update as needed");
    }
    if (recommendations.length === 0) {
      recommendations.push("Continue maintaining current standards");
    }

    return {
      overallComplianceScore: complianceScore,
      safetyScore,
      qualityScore,
      totalIssuesDetected: totalIssues,
      issuesBySeverity,
      objectsDetected,
      riskTrend,
      topRecommendations: recommendations,
    };
  }

  private createEmptySummary(): VideoAnalysisSummary {
    return {
      overallComplianceScore: 100,
      safetyScore: 100,
      qualityScore: 100,
      totalIssuesDetected: 0,
      issuesBySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      objectsDetected: [],
      riskTrend: [],
      topRecommendations: [],
    };
  }

  private async runStreamAnalysis(
    analysisId: string,
    source: VideoSource,
    config: VideoAnalysisConfig,
    onFrame?: (analysis: FrameAnalysis) => void,
  ): Promise<void> {
    let frameNumber = 0;
    const interval = Math.floor((1000 / config.fps) * config.frameInterval);

    const analyze = async () => {
      const analysis = this.activeAnalyses.get(analysisId);
      if (!analysis || analysis.status !== "running") {
        return;
      }

      // Mock frame capture
      const mockData = Buffer.from(`stream-frame-${frameNumber}`);
      const timestamp = frameNumber * Math.floor(1000 / config.fps);

      const frameAnalysis = await this.analyzeFrame(
        mockData,
        timestamp,
        frameNumber,
        config,
      );

      analysis.result.frameAnalyses.push(frameAnalysis);
      analysis.result.analyzedFrames++;
      analysis.result.totalFrames++;

      this.extractIssuesFromFrame(frameAnalysis, analysis.result);

      if (config.enableAlerts) {
        this.checkForAlerts(frameAnalysis, analysis.result, config);
      }

      if (onFrame) {
        onFrame(frameAnalysis);
      }

      frameNumber++;

      // Continue analysis
      if (analysis.status === "running") {
        setTimeout(analyze, interval);
      }
    };

    // Start analysis loop
    setTimeout(analyze, interval);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const videoAnalysisService = new VideoAnalysisService();
export default videoAnalysisService;
