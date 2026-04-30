/**
 * Unified Vision Service
 * Integrates all vision capabilities into a single, easy-to-use service
 * Works across all modules with industry-specific intelligence
 */

import enhancedVisionService, {
  EnhancedVisionAnalysis,
  EnhancedVisionConfig,
} from "./enhancedVisionService";
import objectTrackingService, {
  ObjectTrackingConfig,
  TrackingResult,
} from "./objectTrackingService";
import anomalyDetectionService, {
  AnomalyDetectionConfig,
  AnomalyDetectionResult,
} from "./anomalyDetectionService";
import videoAnalysisService, {
  VideoAnalysisConfig,
  VideoAnalysisResult,
} from "./videoAnalysisService";
import streamingVisionService, {
  StreamConfig,
  StreamAnalysisResult,
} from "./streamingVisionService";
import sceneUnderstandingService, {
  SceneUnderstandingResult,
} from "./sceneUnderstandingService";
import manufacturingVisionService from "./industry/manufacturingVisionService";
import logisticsVisionService from "./industry/logisticsVisionService";
import healthcareVisionService from "./industry/healthcareVisionService";
import { VisionAnalysisResult } from "./visionService";

// ============================================================================
// TYPES
// ============================================================================

export interface UnifiedVisionAnalysis {
  // Core analysis
  vision: EnhancedVisionAnalysis;

  // Advanced features
  objectTracking?: TrackingResult;
  anomalyDetection?: AnomalyDetectionResult;

  // Video analysis (if video)
  videoAnalysis?: VideoAnalysisResult;

  // Module context
  moduleContext?: {
    module: string;
    context: string;
    relatedEntities?: string[];
  };

  // Integration data
  integration?: {
    wms?: WMSIntegration;
    qhse?: QHSEIntegration;
    isoIms?: ISOIMSIntegration;
    tms?: TMSIntegration;
  };

  // Summary
  summary: {
    overallScore: number; // 0-100
    riskLevel: "low" | "medium" | "high" | "critical";
    keyFindings: string[];
    recommendedActions: string[];
    requiresAttention: boolean;
  };
}

export interface WMSIntegration {
  inventoryImpact?: {
    itemsDetected: number;
    damageDetected: boolean;
    locationVerified: boolean;
  };
  qualityCheck?: {
    passed: boolean;
    issues: string[];
  };
  recommendations: string[];
}

export interface QHSEIntegration {
  safetyCompliance: {
    compliant: boolean;
    violations: string[];
    score: number;
  };
  incidentRisk: {
    level: "low" | "medium" | "high" | "critical";
    factors: string[];
  };
  recommendations: string[];
}

export interface ISOIMSIntegration {
  complianceStatus: {
    compliant: boolean;
    deviations: string[];
    score: number;
  };
  documentation: {
    complete: boolean;
    missing: string[];
  };
  recommendations: string[];
}

export interface TMSIntegration {
  shipmentVerification: {
    verified: boolean;
    issues: string[];
  };
  loadingCompliance: {
    compliant: boolean;
    violations: string[];
  };
  recommendations: string[];
}

export interface UnifiedVisionConfig {
  // Enhanced vision config
  enhanced?: EnhancedVisionConfig;

  // Object tracking config
  enableObjectTracking?: boolean;
  objectTracking?: ObjectTrackingConfig;

  // Anomaly detection config
  enableAnomalyDetection?: boolean;
  anomalyDetection?: AnomalyDetectionConfig;

  // Video analysis config
  enableVideoAnalysis?: boolean;
  videoAnalysis?: Partial<VideoAnalysisConfig>;

  // Streaming config
  enableStreaming?: boolean;
  streaming?: Partial<StreamConfig>;

  // Scene understanding
  enableSceneUnderstanding?: boolean;

  // Workflow automation
  enableWorkflowTriggers?: boolean;

  // Module integration
  module?: "wms" | "qhse" | "iso-ims" | "tms" | "general";
  moduleContext?: string;

  // General
  enableAllFeatures?: boolean;
}

// ============================================================================
// UNIFIED VISION SERVICE
// ============================================================================

class UnifiedVisionService {
  /**
   * Analyze image/video with all capabilities
   */
  async analyze(
    mediaFile: File | string,
    context?: string,
    config?: UnifiedVisionConfig,
  ): Promise<UnifiedVisionAnalysis> {
    const mergedConfig: UnifiedVisionConfig = {
      enableAllFeatures: true,
      enableObjectTracking: true,
      enableAnomalyDetection: true,
      ...config,
    };

    // Determine if it's a video
    const isVideo =
      mediaFile instanceof File ? mediaFile.type.startsWith("video/") : false;

    // Step 1: Enhanced vision analysis
    const enhancedConfig: EnhancedVisionConfig = {
      enableRAG: true,
      enableLearning: true,
      enableIndustryAnalysis: true,
      extractText: true,
      searchSimilarCases: true,
      industryContext:
        mergedConfig.enhanced?.industryContext ||
        (mergedConfig.module === "wms"
          ? "logistics"
          : mergedConfig.module === "qhse"
            ? "healthcare"
            : mergedConfig.module === "iso-ims"
              ? "manufacturing"
              : "general"),
      ...mergedConfig.enhanced,
    };

    const visionResult = await enhancedVisionService.analyzeWithRAG(
      mediaFile,
      context || mergedConfig.moduleContext,
      enhancedConfig,
    );

    // Step 2: Object tracking (if enabled and video)
    let objectTracking: TrackingResult | undefined;
    if (
      mergedConfig.enableObjectTracking &&
      isVideo &&
      mediaFile instanceof File
    ) {
      // For video, we'd need to process frames
      // This is a placeholder - would integrate with video analysis
      // objectTracking = await this.trackObjectsInVideo(mediaFile, mergedConfig.objectTracking)
    }

    // Step 3: Anomaly detection
    let anomalyDetection: AnomalyDetectionResult | undefined;
    if (mergedConfig.enableAnomalyDetection) {
      anomalyDetection = await anomalyDetectionService.detectAnomalies(
        visionResult,
        objectTracking?.trackedObjects,
        mergedConfig.anomalyDetection,
      );
    }

    // Step 4: Video analysis (if video) - Integrated with enhanced vision
    let videoAnalysis: VideoAnalysisResult | undefined;
    if (
      isVideo &&
      mergedConfig.enableVideoAnalysis &&
      mediaFile instanceof File
    ) {
      try {
        // Use enhanced video analysis with proper integration
        const videoConfig: Partial<VideoAnalysisConfig> = {
          mode:
            mergedConfig.module === "qhse"
              ? "safety"
              : mergedConfig.module === "wms"
                ? "quality"
                : mergedConfig.module === "iso-ims"
                  ? "compliance"
                  : "general",
          enableObjectTracking: mergedConfig.enableObjectTracking,
          enableMotionDetection: true,
          enableAlerts: true,
          alertThreshold: 70,
          ...mergedConfig.videoAnalysis,
        };

        videoAnalysis = await videoAnalysisService.analyzeVideo(
          mediaFile,
          videoConfig,
        );

        // Enhance video analysis with anomaly detection if enabled
        if (
          mergedConfig.enableAnomalyDetection &&
          videoAnalysis.frameAnalyses.length > 0
        ) {
          // Analyze key frames for anomalies
          const keyFrames = videoAnalysis.frameAnalyses.filter(
            (_, i) => i % 10 === 0,
          ); // Every 10th frame
          for (const frame of keyFrames) {
            const frameAnomalies =
              await anomalyDetectionService.detectAnomalies(
                frame.analysis,
                undefined,
                mergedConfig.anomalyDetection,
              );
            // Add anomalies to video analysis if significant
            if (
              frameAnomalies.anomalies.length > 0 &&
              frameAnomalies.summary.riskScore > 70
            ) {
              videoAnalysis.issues.push(
                ...frameAnomalies.anomalies.map((a) => ({
                  id: a.id,
                  type: a.type,
                  severity: a.severity,
                  description: a.description,
                  firstDetectedFrame: frame.frameNumber,
                  lastDetectedFrame: frame.frameNumber,
                  confidence: a.confidence,
                  recommendation: a.recommendations[0],
                })),
              );
            }
          }
        }
      } catch (error) {
        console.warn("Video analysis failed (non-critical):", error);
      }
    }

    // Step 5: Industry-specific analysis (if module specified)
    if (mergedConfig.module && mergedConfig.module !== "general") {
      try {
        await this.performIndustrySpecificAnalysis(
          visionResult,
          mergedConfig.module,
          mediaFile,
          context,
        );
      } catch (error) {
        console.warn(
          "Industry-specific analysis failed (non-critical):",
          error,
        );
      }
    }

    // Step 6: Module-specific integration
    const integration = await this.performModuleIntegration(
      visionResult,
      anomalyDetection,
      mergedConfig.module,
    );

    // Step 7: Scene understanding (if enabled)
    let sceneUnderstanding: SceneUnderstandingResult | undefined;
    if (mergedConfig.enableSceneUnderstanding !== false) {
      try {
        sceneUnderstanding = await sceneUnderstandingService.understandScene(
          mediaFile,
          context || mergedConfig.moduleContext,
        );
      } catch (error) {
        console.warn("Scene understanding failed (non-critical):", error);
      }
    }

    // Step 8: Trigger workflows if enabled
    if (mergedConfig.enableWorkflowTriggers !== false) {
      try {
        const { visionWorkflowTriggerService } =
          await import("@/lib/services/workflows/visionWorkflowTriggers");
        const workflowResult =
          await visionWorkflowTriggerService.processVisionAnalysis({
            vision: visionResult,
            objectTracking,
            anomalyDetection,
            videoAnalysis,
            sceneUnderstanding,
            moduleContext: mergedConfig.module
              ? {
                  module: mergedConfig.module,
                  context: mergedConfig.moduleContext || context || "",
                }
              : undefined,
            integration,
            summary: {} as any, // Will be set below
          });
        // Store workflow results for summary
        if (workflowResult.triggered > 0) {
          console.log(
            `Triggered ${workflowResult.triggered} workflows from vision analysis`,
          );
        }
      } catch (error) {
        console.warn("Workflow trigger failed (non-critical):", error);
      }
    }

    // Step 9: Generate summary
    const summary = this.generateSummary(
      visionResult,
      anomalyDetection,
      integration,
      mergedConfig.module,
      sceneUnderstanding,
    );

    return {
      vision: visionResult,
      objectTracking,
      anomalyDetection,
      videoAnalysis,
      sceneUnderstanding,
      moduleContext: mergedConfig.module
        ? {
            module: mergedConfig.module,
            context: mergedConfig.moduleContext || context || "",
          }
        : undefined,
      integration,
      summary,
    };
  }

  /**
   * Perform industry-specific analysis
   */
  private async performIndustrySpecificAnalysis(
    visionResult: EnhancedVisionAnalysis,
    module: string,
    mediaFile: File | string,
    context?: string,
  ): Promise<void> {
    try {
      switch (module) {
        case "wms":
          // Use logistics vision for WMS
          const logisticsResult =
            await logisticsVisionService.analyzeLogisticsImage(
              mediaFile,
              context,
              { mode: "damage_assessment" },
            );
          // Merge into vision result's industry analysis
          if (!visionResult.industryAnalysis)
            visionResult.industryAnalysis = {};
          visionResult.industryAnalysis.logistics = {
            packageCondition: logisticsResult.packageCondition,
            damageDetails: logisticsResult.packageDamage?.map((d) => ({
              type: d.type,
              location: d.location,
              severity: d.severity,
            })),
            loadingCompliance:
              logisticsResult.loadingVerification?.verified || false,
            inventoryCount: logisticsResult.inventoryCount?.itemsDetected,
            verificationStatus:
              logisticsResult.packageCondition === "critical"
                ? "failed"
                : logisticsResult.packageCondition === "poor"
                  ? "needs_review"
                  : "verified",
          };
          break;

        case "qhse":
          // Use healthcare vision for QHSE
          const healthcareResult =
            await healthcareVisionService.analyzeHealthcareImage(
              mediaFile,
              context,
              { mode: "patient_safety" },
            );
          if (!visionResult.industryAnalysis)
            visionResult.industryAnalysis = {};
          visionResult.industryAnalysis.healthcare = {
            equipmentSterilization: healthcareResult.sterilizationCompliance
              ?.compliant
              ? "verified"
              : "needs_verification",
            safetyCompliance: healthcareResult.overallCompliance.compliant,
            documentationComplete:
              healthcareResult.documentation?.complete || false,
            patientSafetyScore:
              healthcareResult.patientSafety?.complianceScore || 0,
          };
          break;

        case "iso-ims":
          // Use manufacturing vision for ISO-IMS
          const manufacturingResult =
            await manufacturingVisionService.analyzeManufacturingImage(
              mediaFile,
              context,
              { mode: "quality_control" },
            );
          if (!visionResult.industryAnalysis)
            visionResult.industryAnalysis = {};
          visionResult.industryAnalysis.manufacturing = {
            defectsDetected: manufacturingResult.defects.map((d) => ({
              type: d.type,
              severity: d.severity,
              location: d.location,
              recommendation: d.recommendation,
            })),
            qualityScore: manufacturingResult.qualityControl.score,
            equipmentCondition:
              manufacturingResult.equipmentCondition?.condition === "critical"
                ? "critical"
                : manufacturingResult.equipmentCondition?.condition === "poor"
                  ? "poor"
                  : manufacturingResult.equipmentCondition?.condition === "fair"
                    ? "fair"
                    : "good",
          };
          break;
      }
    } catch (error) {
      console.error("Industry-specific analysis error:", error);
    }
  }

  /**
   * Perform module-specific integration
   */
  private async performModuleIntegration(
    visionResult: EnhancedVisionAnalysis,
    anomalyDetection: AnomalyDetectionResult | undefined,
    module?: string,
  ): Promise<UnifiedVisionAnalysis["integration"]> {
    const integration: UnifiedVisionAnalysis["integration"] = {};

    if (!module) return integration;

    switch (module) {
      case "wms":
        integration.wms = this.integrateWMS(visionResult, anomalyDetection);
        break;
      case "qhse":
        integration.qhse = this.integrateQHSE(visionResult, anomalyDetection);
        break;
      case "iso-ims":
        integration.isoIms = this.integrateISOIMS(
          visionResult,
          anomalyDetection,
        );
        break;
      case "tms":
        integration.tms = this.integrateTMS(visionResult, anomalyDetection);
        break;
    }

    return integration;
  }

  /**
   * WMS Integration
   */
  private integrateWMS(
    visionResult: EnhancedVisionAnalysis,
    anomalyDetection?: AnomalyDetectionResult,
  ): WMSIntegration {
    const detectedObjects = visionResult.analysis.detectedObjects || [];
    const qualityIssues = visionResult.analysis.qualityIssues || [];
    const damageDetected = qualityIssues.some((q) => q.type === "damage");

    return {
      inventoryImpact: {
        itemsDetected: detectedObjects.length,
        damageDetected,
        locationVerified: visionResult.analysis.complianceIssues?.length === 0,
      },
      qualityCheck: {
        passed: qualityIssues.length === 0,
        issues: qualityIssues.map((q) => q.issue),
      },
      recommendations: [
        ...(damageDetected
          ? ["Document damage and update inventory records"]
          : []),
        ...(qualityIssues.length > 0
          ? ["Review quality control procedures"]
          : []),
        ...(anomalyDetection?.recommendations || []),
      ],
    };
  }

  /**
   * QHSE Integration
   */
  private integrateQHSE(
    visionResult: EnhancedVisionAnalysis,
    anomalyDetection?: AnomalyDetectionResult,
  ): QHSEIntegration {
    const safetyIssues = visionResult.analysis.safetyIssues || [];
    const complianceIssues = visionResult.analysis.complianceIssues || [];
    const criticalAnomalies =
      anomalyDetection?.anomalies.filter((a) => a.severity === "critical") ||
      [];

    const safetyScore = Math.max(
      0,
      100 - safetyIssues.length * 15 - complianceIssues.length * 10,
    );

    return {
      safetyCompliance: {
        compliant: safetyIssues.length === 0 && complianceIssues.length === 0,
        violations: [
          ...safetyIssues.map((s) => s.issue),
          ...complianceIssues.map((c) => c.violation),
        ],
        score: safetyScore,
      },
      incidentRisk: {
        level:
          criticalAnomalies.length > 0
            ? "critical"
            : safetyIssues.some((s) => s.severity === "critical")
              ? "high"
              : safetyIssues.length > 0
                ? "medium"
                : "low",
        factors: [
          ...safetyIssues.map((s) => s.issue),
          ...criticalAnomalies.map((a) => a.description),
        ],
      },
      recommendations: [
        ...(safetyIssues.length > 0
          ? ["Address safety violations immediately"]
          : []),
        ...(complianceIssues.length > 0
          ? ["Review compliance requirements"]
          : []),
        ...(anomalyDetection?.recommendations || []),
      ],
    };
  }

  /**
   * ISO-IMS Integration
   */
  private integrateISOIMS(
    visionResult: EnhancedVisionAnalysis,
    anomalyDetection?: AnomalyDetectionResult,
  ): ISOIMSIntegration {
    const complianceIssues = visionResult.analysis.complianceIssues || [];
    const qualityIssues = visionResult.analysis.qualityIssues || [];
    const complianceScore = Math.max(
      0,
      100 - complianceIssues.length * 15 - qualityIssues.length * 10,
    );

    return {
      complianceStatus: {
        compliant: complianceIssues.length === 0,
        deviations: complianceIssues.map((c) => c.violation),
        score: complianceScore,
      },
      documentation: {
        complete: visionResult.extractedText
          ? visionResult.extractedText.text.length > 50
          : false,
        missing: complianceIssues.map((c) => c.standard),
      },
      recommendations: [
        ...(complianceIssues.length > 0
          ? ["Address compliance deviations"]
          : []),
        ...(qualityIssues.length > 0
          ? ["Review quality management procedures"]
          : []),
        ...(anomalyDetection?.recommendations || []),
      ],
    };
  }

  /**
   * TMS Integration
   */
  private integrateTMS(
    visionResult: EnhancedVisionAnalysis,
    anomalyDetection?: AnomalyDetectionResult,
  ): TMSIntegration {
    const qualityIssues = visionResult.analysis.qualityIssues || [];
    const complianceIssues = visionResult.analysis.complianceIssues || [];
    const damageDetected = qualityIssues.some((q) => q.type === "damage");

    return {
      shipmentVerification: {
        verified: !damageDetected && complianceIssues.length === 0,
        issues: [
          ...(damageDetected ? ["Package damage detected"] : []),
          ...complianceIssues.map((c) => c.violation),
        ],
      },
      loadingCompliance: {
        compliant:
          complianceIssues.filter((c) =>
            c.standard.toLowerCase().includes("loading"),
          ).length === 0,
        violations: complianceIssues
          .filter((c) => c.standard.toLowerCase().includes("loading"))
          .map((c) => c.violation),
      },
      recommendations: [
        ...(damageDetected
          ? ["Document damage and update shipment status"]
          : []),
        ...(complianceIssues.length > 0 ? ["Review loading procedures"] : []),
        ...(anomalyDetection?.recommendations || []),
      ],
    };
  }

  /**
   * Generate unified summary
   */
  private generateSummary(
    visionResult: EnhancedVisionAnalysis,
    anomalyDetection: AnomalyDetectionResult | undefined,
    integration: UnifiedVisionAnalysis["integration"],
    module?: string,
    sceneUnderstanding?: SceneUnderstandingResult,
  ): UnifiedVisionAnalysis["summary"] {
    const keyFindings: string[] = [];
    const recommendedActions: string[] = [];

    // Extract key findings
    if (
      visionResult.analysis.safetyIssues &&
      visionResult.analysis.safetyIssues.length > 0
    ) {
      keyFindings.push(
        `${visionResult.analysis.safetyIssues.length} safety issue(s) detected`,
      );
    }
    if (
      visionResult.analysis.qualityIssues &&
      visionResult.analysis.qualityIssues.length > 0
    ) {
      keyFindings.push(
        `${visionResult.analysis.qualityIssues.length} quality issue(s) detected`,
      );
    }
    if (anomalyDetection && anomalyDetection.anomalies.length > 0) {
      keyFindings.push(
        `${anomalyDetection.anomalies.length} anomaly(ies) detected`,
      );
    }

    // Module-specific findings
    if (module === "wms" && integration?.wms) {
      if (integration.wms.inventoryImpact?.damageDetected) {
        keyFindings.push("Package damage detected");
      }
    }
    if (module === "qhse" && integration?.qhse) {
      if (!integration.qhse.safetyCompliance.compliant) {
        keyFindings.push("Safety compliance issues detected");
      }
    }

    // Scene understanding findings
    if (sceneUnderstanding) {
      keyFindings.push(`Scene: ${sceneUnderstanding.sceneContext.sceneType}`);
      if (sceneUnderstanding.sceneContext.activity) {
        keyFindings.push(
          `Activity: ${sceneUnderstanding.sceneContext.activity}`,
        );
      }
      if (sceneUnderstanding.activities.length > 0) {
        keyFindings.push(
          `${sceneUnderstanding.activities.length} activity(ies) detected`,
        );
      }
    }

    // Extract recommendations
    if (visionResult.contextualInsights?.recommendations) {
      recommendedActions.push(
        ...visionResult.contextualInsights.recommendations,
      );
    }
    if (anomalyDetection?.recommendations) {
      recommendedActions.push(...anomalyDetection.recommendations);
    }
    if (module === "wms" && integration?.wms) {
      recommendedActions.push(...integration.wms.recommendations);
    }
    if (module === "qhse" && integration?.qhse) {
      recommendedActions.push(...integration.qhse.recommendations);
    }

    // Calculate overall score
    let overallScore = 100;
    if (visionResult.analysis.safetyIssues) {
      overallScore -= visionResult.analysis.safetyIssues.length * 10;
    }
    if (visionResult.analysis.qualityIssues) {
      overallScore -= visionResult.analysis.qualityIssues.length * 8;
    }
    if (anomalyDetection) {
      overallScore -= anomalyDetection.summary.riskScore * 0.3;
    }
    overallScore = Math.max(0, Math.min(100, overallScore));

    // Determine risk level
    const riskLevel: UnifiedVisionAnalysis["summary"]["riskLevel"] =
      overallScore >= 80
        ? "low"
        : overallScore >= 60
          ? "medium"
          : overallScore >= 40
            ? "high"
            : "critical";

    const requiresAttention =
      overallScore < 70 ||
      anomalyDetection?.summary.requiresImmediateAction ||
      false ||
      visionResult.analysis.safetyIssues?.some(
        (s) => s.severity === "critical",
      ) ||
      false;

    return {
      overallScore,
      riskLevel,
      keyFindings,
      recommendedActions: [...new Set(recommendedActions)], // Remove duplicates
      requiresAttention,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const unifiedVisionService = new UnifiedVisionService();
export default unifiedVisionService;
