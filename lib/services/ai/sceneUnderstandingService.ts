/**
 * Scene Understanding Service
 * Advanced spatial relationship understanding, context-aware analysis,
 * scene classification, and activity recognition
 */

import enhancedVisionService, {
  EnhancedVisionAnalysis,
} from "./enhancedVisionService";
import { VisionAnalysisResult } from "./visionService";

// ============================================================================
// TYPES
// ============================================================================

export interface SpatialRelationship {
  object1: string;
  object2: string;
  relationship:
    | "above"
    | "below"
    | "left_of"
    | "right_of"
    | "near"
    | "far"
    | "touching"
    | "inside"
    | "outside"
    | "on"
    | "under";
  distance?: number; // pixels or relative
  confidence: number;
}

export interface SceneContext {
  sceneType: SceneType;
  environment: EnvironmentType;
  activity?: ActivityType;
  timeOfDay?: "day" | "night" | "unknown";
  lighting?: "bright" | "normal" | "dim" | "dark";
  weather?: "clear" | "cloudy" | "rainy" | "unknown";
  location?: LocationType;
  context: string;
  confidence: number;
}

export type SceneType =
  | "warehouse"
  | "manufacturing"
  | "office"
  | "outdoor"
  | "storage"
  | "loading_dock"
  | "production_line"
  | "laboratory"
  | "medical_facility"
  | "chemical_storage"
  | "general";

export type EnvironmentType = "indoor" | "outdoor" | "mixed" | "unknown";

export type ActivityType =
  | "loading"
  | "unloading"
  | "inspection"
  | "maintenance"
  | "production"
  | "storage"
  | "transportation"
  | "safety_check"
  | "quality_control"
  | "general_activity";

export type LocationType =
  | "warehouse_floor"
  | "loading_dock"
  | "storage_rack"
  | "production_area"
  | "office_area"
  | "outdoor_yard"
  | "unknown";

export interface SceneLayout {
  objects: Array<{
    id: string;
    type: string;
    position: { x: number; y: number; z?: number };
    size: { width: number; height: number; depth?: number };
    orientation?: number; // degrees
  }>;
  relationships: SpatialRelationship[];
  zones: Array<{
    id: string;
    type: string;
    bounds: { x: number; y: number; width: number; height: number };
    objects: string[];
  }>;
}

export interface SceneUnderstandingResult {
  id: string;
  timestamp: string;

  // Scene Classification
  sceneContext: SceneContext;

  // Spatial Understanding
  spatialRelationships: SpatialRelationship[];
  sceneLayout?: SceneLayout;

  // Activity Recognition
  activities: Array<{
    type: ActivityType;
    confidence: number;
    description: string;
    participants?: string[]; // Objects involved
  }>;

  // Context Analysis
  contextAnalysis: {
    primaryFocus: string;
    keyElements: string[];
    potentialIssues: string[];
    recommendations: string[];
  };

  // Metadata
  metadata: {
    provider: string;
    model: string;
    processingTime: number;
  };
}

// ============================================================================
// SCENE UNDERSTANDING SERVICE
// ============================================================================

class SceneUnderstandingService {
  /**
   * Understand scene from image
   */
  async understandScene(
    imageFile: File | string,
    context?: string,
  ): Promise<SceneUnderstandingResult> {
    const startTime = Date.now();
    const analysisId = `scene-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Use enhanced vision service
    const enhancedResult = await enhancedVisionService.analyzeWithRAG(
      imageFile,
      `Scene understanding analysis. Analyze spatial relationships, scene type, environment, activities, and context. Identify objects and their positions relative to each other. ${context || ""}`,
      {
        enableRAG: true,
        enableLearning: true,
        enableIndustryAnalysis: true,
        extractText: true,
        searchSimilarCases: true,
      },
    );

    // Classify scene
    const sceneContext = this.classifyScene(enhancedResult);

    // Analyze spatial relationships
    const spatialRelationships =
      this.analyzeSpatialRelationships(enhancedResult);

    // Build scene layout
    const sceneLayout = this.buildSceneLayout(
      enhancedResult,
      spatialRelationships,
    );

    // Recognize activities
    const activities = this.recognizeActivities(enhancedResult, sceneContext);

    // Context analysis
    const contextAnalysis = this.analyzeContext(
      enhancedResult,
      sceneContext,
      activities,
    );

    return {
      id: analysisId,
      timestamp: new Date().toISOString(),
      sceneContext,
      spatialRelationships,
      sceneLayout,
      activities,
      contextAnalysis,
      metadata: {
        provider: enhancedResult.metadata.provider,
        model: enhancedResult.metadata.model,
        processingTime: Date.now() - startTime,
      },
    };
  }

  /**
   * Classify scene
   */
  private classifyScene(analysis: EnhancedVisionAnalysis): SceneContext {
    const description = (analysis.analysis.description || "").toLowerCase();
    const detectedObjects = analysis.analysis.detectedObjects || [];
    const allText =
      `${description} ${detectedObjects.map((o) => o.object).join(" ")}`.toLowerCase();

    // Determine scene type
    let sceneType: SceneType = "general";
    if (
      allText.includes("warehouse") ||
      allText.includes("storage") ||
      allText.includes("rack")
    ) {
      sceneType = "warehouse";
    } else if (
      allText.includes("manufacturing") ||
      allText.includes("production") ||
      allText.includes("factory")
    ) {
      sceneType = "manufacturing";
    } else if (
      allText.includes("office") ||
      allText.includes("desk") ||
      allText.includes("computer")
    ) {
      sceneType = "office";
    } else if (
      allText.includes("outdoor") ||
      allText.includes("yard") ||
      allText.includes("outside")
    ) {
      sceneType = "outdoor";
    } else if (allText.includes("loading") || allText.includes("dock")) {
      sceneType = "loading_dock";
    } else if (allText.includes("production") || allText.includes("line")) {
      sceneType = "production_line";
    } else if (allText.includes("lab") || allText.includes("laboratory")) {
      sceneType = "laboratory";
    } else if (
      allText.includes("medical") ||
      allText.includes("hospital") ||
      allText.includes("clinic")
    ) {
      sceneType = "medical_facility";
    } else if (allText.includes("chemical") || allText.includes("hazard")) {
      sceneType = "chemical_storage";
    }

    // Determine environment
    let environment: EnvironmentType = "unknown";
    if (sceneType === "outdoor" || sceneType === "loading_dock") {
      environment = "outdoor";
    } else if (sceneType !== "general") {
      environment = "indoor";
    }

    // Determine activity
    let activity: ActivityType | undefined;
    if (allText.includes("loading") || allText.includes("unload")) {
      activity = "loading";
    } else if (allText.includes("inspect")) {
      activity = "inspection";
    } else if (allText.includes("maintenance") || allText.includes("repair")) {
      activity = "maintenance";
    } else if (
      allText.includes("production") ||
      allText.includes("manufacturing")
    ) {
      activity = "production";
    } else if (allText.includes("storage") || allText.includes("storing")) {
      activity = "storage";
    } else if (allText.includes("transport") || allText.includes("shipping")) {
      activity = "transportation";
    } else if (allText.includes("safety") || allText.includes("ppe")) {
      activity = "safety_check";
    } else if (allText.includes("quality") || allText.includes("qc")) {
      activity = "quality_control";
    }

    // Determine location
    let location: LocationType = "unknown";
    if (sceneType === "warehouse") {
      if (allText.includes("rack") || allText.includes("shelf"))
        location = "storage_rack";
      else location = "warehouse_floor";
    } else if (sceneType === "loading_dock") {
      location = "loading_dock";
    } else if (sceneType === "manufacturing") {
      location = "production_area";
    } else if (sceneType === "office") {
      location = "office_area";
    } else if (sceneType === "outdoor") {
      location = "outdoor_yard";
    }

    // Determine lighting
    let lighting: SceneContext["lighting"] = "normal";
    if (allText.includes("bright") || allText.includes("well lit"))
      lighting = "bright";
    else if (
      allText.includes("dim") ||
      allText.includes("dark") ||
      allText.includes("poor lighting")
    )
      lighting = "dim";
    else if (allText.includes("dark") || allText.includes("no light"))
      lighting = "dark";

    return {
      sceneType,
      environment,
      activity,
      location,
      lighting,
      context: analysis.analysis.description || "",
      confidence: 75, // Base confidence, would be enhanced with ML
    };
  }

  /**
   * Analyze spatial relationships
   */
  private analyzeSpatialRelationships(
    analysis: EnhancedVisionAnalysis,
  ): SpatialRelationship[] {
    const relationships: SpatialRelationship[] = [];
    const detectedObjects = analysis.analysis.detectedObjects || [];

    // Analyze relationships between objects with bounding boxes
    for (let i = 0; i < detectedObjects.length; i++) {
      for (let j = i + 1; j < detectedObjects.length; j++) {
        const obj1 = detectedObjects[i];
        const obj2 = detectedObjects[j];

        if (obj1.boundingBox && obj2.boundingBox) {
          const relationship = this.calculateSpatialRelationship(
            obj1.boundingBox,
            obj2.boundingBox,
          );
          if (relationship) {
            relationships.push({
              object1: obj1.object,
              object2: obj2.object,
              ...relationship,
            });
          }
        }
      }
    }

    return relationships;
  }

  /**
   * Calculate spatial relationship between two bounding boxes
   */
  private calculateSpatialRelationship(
    box1: { x: number; y: number; width: number; height: number },
    box2: { x: number; y: number; width: number; height: number },
  ): Omit<SpatialRelationship, "object1" | "object2"> | null {
    const center1 = { x: box1.x + box1.width / 2, y: box1.y + box1.height / 2 };
    const center2 = { x: box2.x + box2.width / 2, y: box2.y + box2.height / 2 };

    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Determine relationship
    let relationship: SpatialRelationship["relationship"];
    const threshold =
      Math.min(box1.width, box1.height, box2.width, box2.height) / 2;

    if (Math.abs(dy) > Math.abs(dx)) {
      // Vertical relationship
      if (dy < -threshold) relationship = "above";
      else if (dy > threshold) relationship = "below";
      else relationship = "near";
    } else {
      // Horizontal relationship
      if (dx < -threshold) relationship = "left_of";
      else if (dx > threshold) relationship = "right_of";
      else relationship = "near";
    }

    // Check for touching/overlapping
    const overlap = this.calculateOverlap(box1, box2);
    if (overlap > 0.1) {
      relationship = "touching";
    }

    // Check for inside/outside
    if (this.isInside(box1, box2)) {
      relationship = "inside";
    } else if (this.isInside(box2, box1)) {
      relationship = "outside";
    }

    return {
      relationship,
      distance,
      confidence: 70 + Math.random() * 20, // Would be calculated from actual analysis
    };
  }

  /**
   * Calculate overlap between two boxes
   */
  private calculateOverlap(
    box1: { x: number; y: number; width: number; height: number },
    box2: { x: number; y: number; width: number; height: number },
  ): number {
    const x1 = Math.max(box1.x, box2.x);
    const y1 = Math.max(box1.y, box2.y);
    const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
    const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

    if (x2 <= x1 || y2 <= y1) return 0;

    const overlapArea = (x2 - x1) * (y2 - y1);
    const box1Area = box1.width * box1.height;
    const box2Area = box2.width * box2.height;
    const unionArea = box1Area + box2Area - overlapArea;

    return unionArea > 0 ? overlapArea / unionArea : 0;
  }

  /**
   * Check if box1 is inside box2
   */
  private isInside(
    box1: { x: number; y: number; width: number; height: number },
    box2: { x: number; y: number; width: number; height: number },
  ): boolean {
    return (
      box1.x >= box2.x &&
      box1.y >= box2.y &&
      box1.x + box1.width <= box2.x + box2.width &&
      box1.y + box1.height <= box2.y + box2.height
    );
  }

  /**
   * Build scene layout
   */
  private buildSceneLayout(
    analysis: EnhancedVisionAnalysis,
    relationships: SpatialRelationship[],
  ): SceneLayout {
    const detectedObjects = analysis.analysis.detectedObjects || [];

    const objects = detectedObjects
      .filter((obj) => obj.boundingBox)
      .map((obj, index) => ({
        id: `obj-${index}`,
        type: obj.object,
        position: {
          x: obj.boundingBox!.x + obj.boundingBox!.width / 2,
          y: obj.boundingBox!.y + obj.boundingBox!.height / 2,
        },
        size: {
          width: obj.boundingBox!.width,
          height: obj.boundingBox!.height,
        },
      }));

    // Identify zones (clusters of objects)
    const zones = this.identifyZones(objects, relationships);

    return {
      objects,
      relationships,
      zones,
    };
  }

  /**
   * Identify zones in scene
   */
  private identifyZones(
    objects: SceneLayout["objects"],
    relationships: SpatialRelationship[],
  ): SceneLayout["zones"] {
    const zones: SceneLayout["zones"] = [];

    // Simple zone identification based on object clusters
    // In production, would use more sophisticated clustering
    const clusters: Array<{
      objects: string[];
      bounds: { x: number; y: number; width: number; height: number };
    }> = [];

    for (const obj of objects) {
      let added = false;
      for (const cluster of clusters) {
        // Check if object is near cluster
        const clusterCenter = {
          x: cluster.bounds.x + cluster.bounds.width / 2,
          y: cluster.bounds.y + cluster.bounds.height / 2,
        };
        const distance = Math.sqrt(
          Math.pow(obj.position.x - clusterCenter.x, 2) +
            Math.pow(obj.position.y - clusterCenter.y, 2),
        );

        if (distance < 200) {
          // Threshold
          cluster.objects.push(obj.id);
          // Expand cluster bounds
          cluster.bounds.x = Math.min(
            cluster.bounds.x,
            obj.position.x - obj.size.width / 2,
          );
          cluster.bounds.y = Math.min(
            cluster.bounds.y,
            obj.position.y - obj.size.height / 2,
          );
          cluster.bounds.width = Math.max(
            cluster.bounds.width,
            obj.position.x + obj.size.width / 2 - cluster.bounds.x,
          );
          cluster.bounds.height = Math.max(
            cluster.bounds.height,
            obj.position.y + obj.size.height / 2 - cluster.bounds.y,
          );
          added = true;
          break;
        }
      }

      if (!added) {
        clusters.push({
          objects: [obj.id],
          bounds: {
            x: obj.position.x - obj.size.width / 2,
            y: obj.position.y - obj.size.height / 2,
            width: obj.size.width,
            height: obj.size.height,
          },
        });
      }
    }

    // Convert clusters to zones
    for (let i = 0; i < clusters.length; i++) {
      zones.push({
        id: `zone-${i}`,
        type: "object_cluster",
        bounds: clusters[i].bounds,
        objects: clusters[i].objects,
      });
    }

    return zones;
  }

  /**
   * Recognize activities
   */
  private recognizeActivities(
    analysis: EnhancedVisionAnalysis,
    sceneContext: SceneContext,
  ): SceneUnderstandingResult["activities"] {
    const activities: SceneUnderstandingResult["activities"] = [];
    const description = (analysis.analysis.description || "").toLowerCase();
    const detectedObjects = analysis.analysis.detectedObjects || [];

    // Use scene context activity if available
    if (sceneContext.activity) {
      activities.push({
        type: sceneContext.activity,
        confidence: sceneContext.confidence,
        description: `Activity detected: ${sceneContext.activity}`,
        participants: detectedObjects.map((o) => o.object),
      });
    }

    // Detect additional activities from description
    const activityKeywords: Record<ActivityType, string[]> = {
      loading: ["loading", "load", "placing", "putting"],
      unloading: ["unloading", "unload", "removing", "taking"],
      inspection: ["inspect", "checking", "examining", "reviewing"],
      maintenance: ["maintenance", "repair", "fixing", "servicing"],
      production: ["production", "manufacturing", "making", "creating"],
      storage: ["storage", "storing", "keeping", "placing"],
      transportation: ["transport", "moving", "shipping", "delivering"],
      safety_check: ["safety", "ppe", "protective", "compliance"],
      quality_control: ["quality", "qc", "testing", "verifying"],
      general_activity: [],
    };

    for (const [activityType, keywords] of Object.entries(activityKeywords)) {
      if (keywords.some((keyword) => description.includes(keyword))) {
        if (!activities.some((a) => a.type === activityType)) {
          activities.push({
            type: activityType as ActivityType,
            confidence: 70,
            description: `Activity: ${activityType}`,
            participants: detectedObjects.map((o) => o.object),
          });
        }
      }
    }

    return activities;
  }

  /**
   * Analyze context
   */
  private analyzeContext(
    analysis: EnhancedVisionAnalysis,
    sceneContext: SceneContext,
    activities: SceneUnderstandingResult["activities"],
  ): SceneUnderstandingResult["contextAnalysis"] {
    const detectedObjects = analysis.analysis.detectedObjects || [];
    const safetyIssues = analysis.analysis.safetyIssues || [];
    const qualityIssues = analysis.analysis.qualityIssues || [];

    // Primary focus
    const primaryFocus =
      activities.length > 0 ? activities[0].type : sceneContext.sceneType;

    // Key elements
    const keyElements = [
      ...detectedObjects.slice(0, 5).map((o) => o.object),
      sceneContext.sceneType,
      sceneContext.environment,
    ].filter((v, i, a) => a.indexOf(v) === i);

    // Potential issues
    const potentialIssues = [
      ...safetyIssues.map((s) => s.issue),
      ...qualityIssues.map((q) => q.issue),
    ];

    // Recommendations
    const recommendations: string[] = [];
    if (safetyIssues.length > 0) {
      recommendations.push(`Address ${safetyIssues.length} safety concern(s)`);
    }
    if (qualityIssues.length > 0) {
      recommendations.push(`Review ${qualityIssues.length} quality issue(s)`);
    }
    if (sceneContext.lighting === "dim" || sceneContext.lighting === "dark") {
      recommendations.push("Improve lighting conditions for better visibility");
    }

    return {
      primaryFocus: String(primaryFocus),
      keyElements,
      potentialIssues,
      recommendations,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const sceneUnderstandingService = new SceneUnderstandingService();
export default sceneUnderstandingService;
