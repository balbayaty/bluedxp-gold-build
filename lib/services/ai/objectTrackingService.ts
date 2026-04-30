/**
 * Advanced Object Detection & Tracking Service
 * Tracks objects across video frames with trajectory analysis
 * Supports multi-object tracking and anomaly detection
 */

import { VisionAnalysisResult } from "./visionService";

// ============================================================================
// TYPES
// ============================================================================

export interface TrackedObject {
  id: string;
  type: string;
  name: string;
  confidence: number;

  // Position tracking
  positions: Array<{
    frameNumber: number;
    timestamp: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    confidence: number;
  }>;

  // Temporal data
  firstSeen: number;
  lastSeen: number;
  duration: number; // ms

  // Movement analysis
  velocity?: {
    x: number; // pixels per frame
    y: number;
    speed: number; // total speed
  };

  trajectory?: {
    path: Array<{ x: number; y: number }>;
    distance: number;
    direction: "left" | "right" | "up" | "down" | "stationary" | "complex";
  };

  // Behavior analysis
  behavior?: {
    isMoving: boolean;
    movementPattern: "linear" | "circular" | "erratic" | "stationary";
    speedCategory: "slow" | "normal" | "fast" | "very_fast";
    anomalyScore: number; // 0-100, higher = more anomalous
  };

  // Metadata
  metadata?: Record<string, any>;
}

export interface ObjectTrackingConfig {
  minConfidence: number; // Minimum confidence to track (0-100)
  maxObjects: number; // Maximum objects to track simultaneously
  trackingMethod: "iou" | "kalman" | "deep_sort"; // Tracking algorithm
  enableTrajectoryAnalysis: boolean;
  enableAnomalyDetection: boolean;
  anomalyThreshold: number; // 0-100
  frameSkip: number; // Analyze every N frames
}

export interface TrackingResult {
  frameNumber: number;
  timestamp: number;
  trackedObjects: TrackedObject[];
  newObjects: TrackedObject[];
  lostObjects: string[]; // IDs of objects no longer detected
  anomalies: Array<{
    objectId: string;
    type:
      | "unusual_movement"
      | "unexpected_speed"
      | "erratic_behavior"
      | "disappearance";
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    confidence: number;
  }>;
  summary: {
    totalObjects: number;
    movingObjects: number;
    stationaryObjects: number;
    anomalousObjects: number;
  };
}

// ============================================================================
// OBJECT TRACKING SERVICE
// ============================================================================

class ObjectTrackingService {
  private activeTracks: Map<string, TrackedObject> = new Map();
  private trackHistory: Map<string, TrackedObject[]> = new Map();
  private frameCounter: number = 0;
  private defaultConfig: ObjectTrackingConfig = {
    minConfidence: 60,
    maxObjects: 50,
    trackingMethod: "iou",
    enableTrajectoryAnalysis: true,
    enableAnomalyDetection: true,
    anomalyThreshold: 70,
    frameSkip: 1,
  };

  /**
   * Track objects across frames
   */
  async trackObjects(
    frameAnalysis: VisionAnalysisResult,
    frameNumber: number,
    timestamp: number,
    config?: Partial<ObjectTrackingConfig>,
  ): Promise<TrackingResult> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    this.frameCounter = frameNumber;

    // Extract detected objects from vision analysis
    const detectedObjects = frameAnalysis.analysis.detectedObjects || [];

    // Filter by confidence
    const validObjects = detectedObjects.filter(
      (obj) => obj.confidence >= mergedConfig.minConfidence,
    );

    // Match detected objects to existing tracks
    const matchedPairs = this.matchObjectsToTracks(validObjects, mergedConfig);

    // Update existing tracks
    const updatedTracks: TrackedObject[] = [];
    const newTracks: TrackedObject[] = [];
    const lostObjectIds: string[] = [];

    for (const [trackId, detectedObj] of matchedPairs.matched) {
      const existingTrack = this.activeTracks.get(trackId);
      if (existingTrack) {
        const updated = this.updateTrack(
          existingTrack,
          detectedObj,
          frameNumber,
          timestamp,
          mergedConfig,
        );
        this.activeTracks.set(trackId, updated);
        updatedTracks.push(updated);
      }
    }

    // Create new tracks for unmatched objects
    for (const detectedObj of matchedPairs.unmatched) {
      if (this.activeTracks.size < mergedConfig.maxObjects) {
        const newTrack = this.createNewTrack(
          detectedObj,
          frameNumber,
          timestamp,
        );
        this.activeTracks.set(newTrack.id, newTrack);
        newTracks.push(newTrack);
      }
    }

    // Mark lost objects (not detected in this frame)
    for (const [trackId, track] of this.activeTracks.entries()) {
      if (!matchedPairs.matched.has(trackId)) {
        // Object not detected - check if it's truly lost
        const framesSinceLastSeen = frameNumber - track.lastSeen;
        if (framesSinceLastSeen > 10) {
          // Lost after 10 frames
          this.activeTracks.delete(trackId);
          lostObjectIds.push(trackId);

          // Store in history
          if (!this.trackHistory.has(trackId)) {
            this.trackHistory.set(trackId, []);
          }
          this.trackHistory.get(trackId)!.push(track);
        }
      }
    }

    // Analyze trajectories and anomalies
    const allTracks = Array.from(this.activeTracks.values());

    if (mergedConfig.enableTrajectoryAnalysis) {
      for (const track of allTracks) {
        this.analyzeTrajectory(track);
      }
    }

    // Detect anomalies
    const anomalies: TrackingResult["anomalies"] = [];
    if (mergedConfig.enableAnomalyDetection) {
      for (const track of allTracks) {
        const trackAnomalies = this.detectAnomalies(track, mergedConfig);
        anomalies.push(...trackAnomalies);
      }
    }

    // Generate summary
    const summary = this.generateSummary(allTracks, anomalies);

    return {
      frameNumber,
      timestamp,
      trackedObjects: allTracks,
      newObjects: newTracks,
      lostObjects: lostObjectIds,
      anomalies,
      summary,
    };
  }

  /**
   * Match detected objects to existing tracks
   */
  private matchObjectsToTracks(
    detectedObjects: Array<{
      object: string;
      confidence: number;
      boundingBox?: any;
    }>,
    config: ObjectTrackingConfig,
  ): {
    matched: Map<
      string,
      { object: string; confidence: number; boundingBox?: any }
    >;
    unmatched: Array<{ object: string; confidence: number; boundingBox?: any }>;
  } {
    const matched = new Map<
      string,
      { object: string; confidence: number; boundingBox?: any }
    >();
    const unmatched: Array<{
      object: string;
      confidence: number;
      boundingBox?: any;
    }> = [];
    const usedTrackIds = new Set<string>();

    // Simple IOU-based matching (can be enhanced with Kalman filter or Deep SORT)
    for (const detectedObj of detectedObjects) {
      let bestMatch: { trackId: string; score: number } | null = null;

      for (const [trackId, track] of this.activeTracks.entries()) {
        if (usedTrackIds.has(trackId)) continue;

        // Check if object type matches
        if (track.type.toLowerCase() !== detectedObj.object.toLowerCase()) {
          continue;
        }

        // Calculate IOU if bounding boxes available
        let score = 0.5; // Base score for type match

        if (detectedObj.boundingBox && track.positions.length > 0) {
          const lastPosition = track.positions[track.positions.length - 1];
          if (lastPosition.boundingBox) {
            const iou = this.calculateIOU(
              detectedObj.boundingBox,
              lastPosition.boundingBox,
            );
            score = iou * 0.7 + 0.3; // Weight IOU 70%, type match 30%
          }
        }

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { trackId, score };
        }
      }

      if (bestMatch && bestMatch.score > 0.3) {
        matched.set(bestMatch.trackId, detectedObj);
        usedTrackIds.add(bestMatch.trackId);
      } else {
        unmatched.push(detectedObj);
      }
    }

    return { matched, unmatched };
  }

  /**
   * Calculate Intersection over Union (IOU)
   */
  private calculateIOU(box1: any, box2: any): number {
    if (!box1 || !box2) return 0;

    const x1 = Math.max(box1.x, box2.x);
    const y1 = Math.max(box1.y, box2.y);
    const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
    const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

    if (x2 <= x1 || y2 <= y1) return 0;

    const intersection = (x2 - x1) * (y2 - y1);
    const area1 = box1.width * box1.height;
    const area2 = box2.width * box2.height;
    const union = area1 + area2 - intersection;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Create new track for detected object
   */
  private createNewTrack(
    detectedObj: { object: string; confidence: number; boundingBox?: any },
    frameNumber: number,
    timestamp: number,
  ): TrackedObject {
    const trackId = `track-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    return {
      id: trackId,
      type: detectedObj.object,
      name: detectedObj.object,
      confidence: detectedObj.confidence,
      positions: [
        {
          frameNumber,
          timestamp,
          boundingBox: detectedObj.boundingBox || {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          },
          confidence: detectedObj.confidence,
        },
      ],
      firstSeen: timestamp,
      lastSeen: timestamp,
      duration: 0,
    };
  }

  /**
   * Update existing track with new detection
   */
  private updateTrack(
    track: TrackedObject,
    detectedObj: { object: string; confidence: number; boundingBox?: any },
    frameNumber: number,
    timestamp: number,
    config: ObjectTrackingConfig,
  ): TrackedObject {
    // Add new position
    track.positions.push({
      frameNumber,
      timestamp,
      boundingBox: detectedObj.boundingBox ||
        track.positions[track.positions.length - 1]?.boundingBox || {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        },
      confidence: detectedObj.confidence,
    });

    // Update metadata
    track.lastSeen = timestamp;
    track.duration = timestamp - track.firstSeen;
    track.confidence = (track.confidence + detectedObj.confidence) / 2; // Running average

    // Calculate velocity if we have enough positions
    if (track.positions.length >= 2) {
      const lastPos = track.positions[track.positions.length - 1];
      const prevPos = track.positions[track.positions.length - 2];

      if (lastPos.boundingBox && prevPos.boundingBox) {
        const dt = (lastPos.timestamp - prevPos.timestamp) / 1000; // seconds
        if (dt > 0) {
          const dx =
            lastPos.boundingBox.x +
            lastPos.boundingBox.width / 2 -
            (prevPos.boundingBox.x + prevPos.boundingBox.width / 2);
          const dy =
            lastPos.boundingBox.y +
            lastPos.boundingBox.height / 2 -
            (prevPos.boundingBox.y + prevPos.boundingBox.height / 2);

          track.velocity = {
            x: dx / dt,
            y: dy / dt,
            speed: Math.sqrt(dx * dx + dy * dy) / dt,
          };
        }
      }
    }

    return track;
  }

  /**
   * Analyze trajectory of tracked object
   */
  private analyzeTrajectory(track: TrackedObject): void {
    if (track.positions.length < 2) return;

    // Extract path
    const path = track.positions
      .filter((p) => p.boundingBox)
      .map((p) => ({
        x: p.boundingBox!.x + p.boundingBox!.width / 2,
        y: p.boundingBox!.y + p.boundingBox!.height / 2,
      }));

    track.trajectory = {
      path,
      distance: this.calculatePathDistance(path),
      direction: this.determineDirection(path),
    };

    // Analyze behavior
    if (track.velocity) {
      track.behavior = {
        isMoving: track.velocity.speed > 5, // pixels per second threshold
        movementPattern: this.analyzeMovementPattern(path),
        speedCategory: this.categorizeSpeed(track.velocity.speed),
        anomalyScore: 0, // Will be calculated in anomaly detection
      };
    }
  }

  /**
   * Calculate total distance traveled
   */
  private calculatePathDistance(path: Array<{ x: number; y: number }>): number {
    let distance = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      distance += Math.sqrt(dx * dx + dy * dy);
    }
    return distance;
  }

  /**
   * Determine primary direction of movement
   */
  private determineDirection(
    path: Array<{ x: number; y: number }>,
  ): TrackedObject["trajectory"]["direction"] {
    if (path.length < 2) return "stationary";

    const first = path[0];
    const last = path[path.length - 1];
    const dx = last.x - first.x;
    const dy = last.y - first.y;

    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return "stationary";
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "right" : "left";
    } else {
      return dy > 0 ? "down" : "up";
    }
  }

  /**
   * Analyze movement pattern
   */
  private analyzeMovementPattern(
    path: Array<{ x: number; y: number }>,
  ): TrackedObject["behavior"]["movementPattern"] {
    if (path.length < 3) return "linear";

    // Calculate variance in direction changes
    const directionChanges: number[] = [];
    for (let i = 2; i < path.length; i++) {
      const v1 = {
        x: path[i - 1].x - path[i - 2].x,
        y: path[i - 1].y - path[i - 2].y,
      };
      const v2 = { x: path[i].x - path[i - 1].x, y: path[i].y - path[i - 1].y };

      const angle1 = Math.atan2(v1.y, v1.x);
      const angle2 = Math.atan2(v2.y, v2.x);
      const change = Math.abs(angle2 - angle1);
      directionChanges.push(change);
    }

    const avgChange =
      directionChanges.reduce((a, b) => a + b, 0) / directionChanges.length;

    if (avgChange < 0.1) return "linear";
    if (avgChange < 0.5) return "circular";
    return "erratic";
  }

  /**
   * Categorize speed
   */
  private categorizeSpeed(
    speed: number,
  ): TrackedObject["behavior"]["speedCategory"] {
    if (speed < 10) return "slow";
    if (speed < 50) return "normal";
    if (speed < 100) return "fast";
    return "very_fast";
  }

  /**
   * Detect anomalies in object behavior
   */
  private detectAnomalies(
    track: TrackedObject,
    config: ObjectTrackingConfig,
  ): TrackingResult["anomalies"] {
    const anomalies: TrackingResult["anomalies"] = [];

    if (!track.behavior || !track.velocity) return anomalies;

    // Unusual movement pattern
    if (track.behavior.movementPattern === "erratic") {
      anomalies.push({
        objectId: track.id,
        type: "erratic_behavior",
        description: `Object ${track.name} shows erratic movement pattern`,
        severity: "medium",
        confidence: 75,
      });
      track.behavior.anomalyScore += 20;
    }

    // Unexpected speed
    if (
      track.behavior.speedCategory === "very_fast" &&
      track.type !== "vehicle"
    ) {
      anomalies.push({
        objectId: track.id,
        type: "unexpected_speed",
        description: `Object ${track.name} moving at unexpected high speed`,
        severity: "high",
        confidence: 80,
      });
      track.behavior.anomalyScore += 30;
    }

    // Sudden direction change
    if (track.trajectory && track.trajectory.direction === "complex") {
      anomalies.push({
        objectId: track.id,
        type: "unusual_movement",
        description: `Object ${track.name} shows unusual movement direction`,
        severity: "low",
        confidence: 60,
      });
      track.behavior.anomalyScore += 15;
    }

    // Check if anomaly score exceeds threshold
    if (track.behavior.anomalyScore >= config.anomalyThreshold) {
      // Already added to anomalies array above
    }

    return anomalies;
  }

  /**
   * Generate tracking summary
   */
  private generateSummary(
    tracks: TrackedObject[],
    anomalies: TrackingResult["anomalies"],
  ): TrackingResult["summary"] {
    const movingObjects = tracks.filter((t) => t.behavior?.isMoving).length;
    const stationaryObjects = tracks.length - movingObjects;
    const anomalousObjects = new Set(anomalies.map((a) => a.objectId)).size;

    return {
      totalObjects: tracks.length,
      movingObjects,
      stationaryObjects,
      anomalousObjects,
    };
  }

  /**
   * Get tracking history for an object
   */
  getTrackingHistory(trackId: string): TrackedObject[] {
    return this.trackHistory.get(trackId) || [];
  }

  /**
   * Get all active tracks
   */
  getActiveTracks(): TrackedObject[] {
    return Array.from(this.activeTracks.values());
  }

  /**
   * Clear all tracks
   */
  clearTracks(): void {
    this.activeTracks.clear();
    this.trackHistory.clear();
    this.frameCounter = 0;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const objectTrackingService = new ObjectTrackingService();
export default objectTrackingService;
