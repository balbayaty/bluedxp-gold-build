/**
 * Location Fusion Service
 *
 * Fuses multiple location sources for accurate tracking:
 * - Daleel (official ELM GPS)
 * - WhatsApp TextLocate
 * - Telegram location
 * - Driver app GPS
 * - IoT sensors
 *
 * Detects anomalies and potential theft/spoofing.
 *
 * @module gcc-compliance/locationFusionService
 */

import type {
  LocationSource,
  LocationSourceType,
  FusedLocation,
} from '@/types/gcc-compliance';
import { eventBus, createEvent } from '@/lib/services/event-store';

// ============================================================================
// CONSTANTS
// ============================================================================

const EARTH_RADIUS_KM = 6371;

// Trust levels by source (0-1)
const SOURCE_TRUST_LEVELS: Record<LocationSourceType, number> = {
  DALEEL: 0.95,           // Official government source - highest trust
  WHATSAPP_TEXTLOCATE: 0.85,
  TELEGRAM: 0.80,
  DRIVER_APP: 0.75,
  IOT_SENSOR: 0.90,
  MANUAL: 0.50,
};

// Anomaly thresholds
const ANOMALY_THRESHOLDS = {
  MAX_DEVIATION_KM: 5,           // Max acceptable deviation between sources
  MAX_SPEED_KMH: 120,            // Max realistic truck speed
  MIN_LOCATION_INTERVAL_MS: 5000, // Minimum time between location updates
  STALE_DATA_THRESHOLD_MS: 15 * 60 * 1000, // 15 minutes
};

// ============================================================================
// LOCATION FUSION SERVICE
// ============================================================================

export class LocationFusionService {
  /**
   * Fuse multiple location sources into a single best estimate
   */
  async fuseLocations(
    shipmentId: string,
    sources: LocationSource[]
  ): Promise<FusedLocation> {
    if (sources.length === 0) {
      throw new Error('No location sources provided');
    }

    // Filter out stale data
    const freshSources = this.filterStaleSources(sources);

    if (freshSources.length === 0) {
      throw new Error('All location sources are stale');
    }

    // If only one source, use it directly
    if (freshSources.length === 1) {
      return this.createSingleSourceResult(freshSources[0]);
    }

    // Calculate weighted average location
    const fusedCoordinates = this.calculateWeightedAverage(freshSources);

    // Calculate deviations from fused location
    const sourcesWithDeviations = freshSources.map((source) => ({
      ...source,
      deviation: this.calculateHaversineDistance(source.coordinates, fusedCoordinates),
      weight: this.calculateWeight(source),
    }));

    // Detect anomalies
    const anomalyAnalysis = this.analyzeAnomalies(sourcesWithDeviations);

    // Get Daleel data if available
    const daleelSource = freshSources.find((s) => s.source === 'DALEEL');
    const daleeliData = daleelSource?.rawData
      ? {
          sequenceNumber: daleelSource.rawData.sequenceNumber,
          vehicleStatus: daleelSource.rawData.vehicleStatus,
          velocity: daleelSource.rawData.velocity,
          weight: daleelSource.rawData.weight,
        }
      : undefined;

    // Calculate overall confidence
    const confidence = this.calculateConfidence(sourcesWithDeviations, anomalyAnalysis);

    // Calculate accuracy (weighted average of source accuracies)
    const accuracy = this.calculateFusedAccuracy(sourcesWithDeviations);

    const result: FusedLocation = {
      coordinates: fusedCoordinates,
      accuracy,
      confidence,
      timestamp: new Date(),
      sources: sourcesWithDeviations,
      deviation: {
        maxDeviation: Math.max(...sourcesWithDeviations.map((s) => s.deviation)),
        averageDeviation:
          sourcesWithDeviations.reduce((sum, s) => sum + s.deviation, 0) /
          sourcesWithDeviations.length,
        anomalyDetected: anomalyAnalysis.isAnomaly,
        possibleCauses: anomalyAnalysis.reasons,
        riskLevel: anomalyAnalysis.riskLevel,
      },
      daleeliData,
    };

    // Emit event if anomaly detected (non-blocking)
    if (anomalyAnalysis.isAnomaly) {
      try {
        await eventBus.publish(
          createEvent('location.anomaly.detected', {
            shipmentId,
            fusedLocation: result,
            anomalyDetails: anomalyAnalysis,
          })
        );
      } catch (error) {
        console.warn('[LocationFusion] Event publish failed:', error);
      }
    }

    return result;
  }

  /**
   * Detect anomalies in current location vs history
   */
  async detectAnomaly(
    current: FusedLocation,
    history: FusedLocation[]
  ): Promise<{
    isAnomaly: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reasons: string[];
    recommendations: string[];
  }> {
    const reasons: string[] = [];
    const recommendations: string[] = [];

    // Already detected in fusion
    if (current.deviation?.anomalyDetected) {
      reasons.push(...(current.deviation.possibleCauses || []));
    }

    // Check against history
    if (history.length > 0) {
      const lastLocation = history[0];
      const timeDiff =
        current.timestamp.getTime() - new Date(lastLocation.timestamp).getTime();
      const distance = this.calculateHaversineDistance(
        current.coordinates,
        lastLocation.coordinates
      );

      // Check speed (distance / time)
      const speedKmh = (distance / (timeDiff / (1000 * 60 * 60)));

      if (speedKmh > ANOMALY_THRESHOLDS.MAX_SPEED_KMH) {
        reasons.push(
          `Unrealistic speed: ${Math.round(speedKmh)} km/h (max: ${ANOMALY_THRESHOLDS.MAX_SPEED_KMH})`
        );
        recommendations.push('Verify driver and vehicle location manually');
      }

      // Check for sudden direction change
      if (history.length >= 2) {
        const directionChange = this.calculateDirectionChange(
          history[1].coordinates,
          history[0].coordinates,
          current.coordinates
        );

        if (directionChange > 150) {
          reasons.push('Sudden direction reversal detected');
          recommendations.push('Check for route deviation or theft');
        }
      }

      // Check for location jump
      if (distance > 50 && timeDiff < 30 * 60 * 1000) {
        // >50km in <30min
        reasons.push(`Large location jump: ${Math.round(distance)}km in ${Math.round(timeDiff / 60000)}min`);
        recommendations.push('Possible GPS spoofing or device swap');
      }
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (reasons.length >= 3) {
      riskLevel = 'CRITICAL';
      recommendations.push('URGENT: Contact driver immediately and verify cargo');
    } else if (reasons.length >= 2) {
      riskLevel = 'HIGH';
      recommendations.push('Request manual location verification from driver');
    } else if (reasons.length >= 1) {
      riskLevel = 'MEDIUM';
      recommendations.push('Monitor closely for next few updates');
    }

    return {
      isAnomaly: reasons.length > 0,
      riskLevel,
      reasons,
      recommendations,
    };
  }

  /**
   * Compare Daleel location with other sources
   */
  async compareDaleelWithOthers(
    daleelLocation: LocationSource,
    otherSources: LocationSource[]
  ): Promise<{
    consistent: boolean;
    deviations: Array<{
      source: LocationSourceType;
      distance: number;
      timeDiff: number;
    }>;
    recommendation: string;
  }> {
    const deviations = otherSources.map((source) => ({
      source: source.source,
      distance: this.calculateHaversineDistance(
        daleelLocation.coordinates,
        source.coordinates
      ),
      timeDiff: Math.abs(
        new Date(daleelLocation.timestamp).getTime() -
          new Date(source.timestamp).getTime()
      ),
    }));

    const maxDeviation = Math.max(...deviations.map((d) => d.distance));
    const consistent = maxDeviation <= ANOMALY_THRESHOLDS.MAX_DEVIATION_KM;

    let recommendation = 'All sources consistent';
    if (!consistent) {
      if (maxDeviation > 10) {
        recommendation =
          'CRITICAL: Large deviation between Daleel and other sources. Possible device tampering or theft.';
      } else {
        recommendation =
          'Minor deviation detected. May be due to GPS accuracy differences.';
      }
    }

    return {
      consistent,
      deviations,
      recommendation,
    };
  }

  /**
   * Get the most reliable location source
   */
  getMostReliableSource(sources: LocationSource[]): LocationSource | null {
    if (sources.length === 0) return null;

    const freshSources = this.filterStaleSources(sources);
    if (freshSources.length === 0) return null;

    // Prioritize Daleel if available and fresh
    const daleel = freshSources.find((s) => s.source === 'DALEEL');
    if (daleel) return daleel;

    // Otherwise, return highest trust level source
    return freshSources.reduce((best, current) =>
      SOURCE_TRUST_LEVELS[current.source] > SOURCE_TRUST_LEVELS[best.source]
        ? current
        : best
    );
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Filter out stale location sources
   */
  private filterStaleSources(sources: LocationSource[]): LocationSource[] {
    const now = Date.now();
    return sources.filter(
      (s) =>
        now - new Date(s.timestamp).getTime() < ANOMALY_THRESHOLDS.STALE_DATA_THRESHOLD_MS
    );
  }

  /**
   * Calculate weighted average of coordinates
   */
  private calculateWeightedAverage(
    sources: LocationSource[]
  ): { lat: number; lng: number } {
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;

    for (const source of sources) {
      const weight = this.calculateWeight(source);
      totalWeight += weight;
      weightedLat += source.coordinates.lat * weight;
      weightedLng += source.coordinates.lng * weight;
    }

    return {
      lat: weightedLat / totalWeight,
      lng: weightedLng / totalWeight,
    };
  }

  /**
   * Calculate weight for a source
   */
  private calculateWeight(source: LocationSource): number {
    const baseTrust = SOURCE_TRUST_LEVELS[source.source] || 0.5;

    // Adjust for accuracy if available
    let accuracyFactor = 1;
    if (source.accuracy) {
      // Higher accuracy (lower meters) = higher factor
      accuracyFactor = Math.max(0.5, 1 - source.accuracy / 1000);
    }

    // Adjust for freshness
    const age = Date.now() - new Date(source.timestamp).getTime();
    const freshnessFactor = Math.max(0.5, 1 - age / ANOMALY_THRESHOLDS.STALE_DATA_THRESHOLD_MS);

    return baseTrust * accuracyFactor * freshnessFactor;
  }

  /**
   * Analyze anomalies in source data
   */
  private analyzeAnomalies(
    sources: Array<LocationSource & { deviation: number; weight: number }>
  ): {
    isAnomaly: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reasons: string[];
  } {
    const reasons: string[] = [];

    // Check max deviation
    const maxDeviation = Math.max(...sources.map((s) => s.deviation));
    if (maxDeviation > ANOMALY_THRESHOLDS.MAX_DEVIATION_KM) {
      reasons.push(
        `Large deviation between sources: ${maxDeviation.toFixed(2)}km`
      );
    }

    // Check if Daleel differs significantly from others
    const daleel = sources.find((s) => s.source === 'DALEEL');
    if (daleel) {
      const othersAvgDeviation =
        sources
          .filter((s) => s.source !== 'DALEEL')
          .reduce((sum, s) => sum + s.deviation, 0) /
        (sources.length - 1);

      if (daleel.deviation > othersAvgDeviation * 2) {
        reasons.push('Daleel location deviates significantly from other sources');
      }
    }

    // Check for phone-GPS mismatch (common in theft scenarios)
    const phoneSource = sources.find(
      (s) => s.source === 'WHATSAPP_TEXTLOCATE' || s.source === 'TELEGRAM'
    );
    const vehicleSource = sources.find(
      (s) => s.source === 'DALEEL' || s.source === 'IOT_SENSOR'
    );

    if (phoneSource && vehicleSource) {
      const phonVehicleDeviation = this.calculateHaversineDistance(
        phoneSource.coordinates,
        vehicleSource.coordinates
      );

      if (phonVehicleDeviation > 1) {
        // > 1km difference
        reasons.push(
          `Driver phone location differs from vehicle: ${phonVehicleDeviation.toFixed(2)}km`
        );
      }
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (reasons.length >= 3) {
      riskLevel = 'CRITICAL';
    } else if (reasons.length >= 2) {
      riskLevel = 'HIGH';
    } else if (reasons.length >= 1) {
      riskLevel = 'MEDIUM';
    }

    return {
      isAnomaly: reasons.length > 0,
      riskLevel,
      reasons,
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    sources: Array<LocationSource & { deviation: number; weight: number }>,
    anomalyAnalysis: { isAnomaly: boolean; riskLevel: string }
  ): number {
    // Base confidence from weighted sources
    const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
    let confidence = Math.min(1, totalWeight / sources.length);

    // Reduce confidence based on deviations
    const avgDeviation =
      sources.reduce((sum, s) => sum + s.deviation, 0) / sources.length;
    confidence *= Math.max(0.5, 1 - avgDeviation / 10);

    // Reduce confidence if anomaly detected
    if (anomalyAnalysis.isAnomaly) {
      const reductionFactors = {
        LOW: 0.9,
        MEDIUM: 0.7,
        HIGH: 0.5,
        CRITICAL: 0.3,
      };
      confidence *= reductionFactors[anomalyAnalysis.riskLevel as keyof typeof reductionFactors] || 0.5;
    }

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Calculate fused accuracy
   */
  private calculateFusedAccuracy(
    sources: Array<LocationSource & { deviation: number; weight: number }>
  ): number {
    const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
    const weightedAccuracy = sources.reduce((sum, s) => {
      const accuracy = s.accuracy || 100; // Default 100m if not specified
      return sum + accuracy * s.weight;
    }, 0);

    return Math.round(weightedAccuracy / totalWeight);
  }

  /**
   * Calculate direction change angle
   */
  private calculateDirectionChange(
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number },
    p3: { lat: number; lng: number }
  ): number {
    const bearing1 = this.calculateBearing(p1, p2);
    const bearing2 = this.calculateBearing(p2, p3);

    let change = Math.abs(bearing2 - bearing1);
    if (change > 180) change = 360 - change;

    return change;
  }

  /**
   * Calculate bearing between two points
   */
  private calculateBearing(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): number {
    const lat1 = this.toRad(from.lat);
    const lat2 = this.toRad(to.lat);
    const dLng = this.toRad(to.lng - from.lng);

    const x = Math.sin(dLng) * Math.cos(lat2);
    const y =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    return (this.toDeg(Math.atan2(x, y)) + 360) % 360;
  }

  /**
   * Calculate Haversine distance
   */
  private calculateHaversineDistance(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): number {
    const lat1 = this.toRad(from.lat);
    const lat2 = this.toRad(to.lat);
    const dLat = this.toRad(to.lat - from.lat);
    const dLng = this.toRad(to.lng - from.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
  }

  /**
   * Create result from single source
   */
  private createSingleSourceResult(source: LocationSource): FusedLocation {
    return {
      coordinates: source.coordinates,
      accuracy: source.accuracy || 100,
      confidence: SOURCE_TRUST_LEVELS[source.source],
      timestamp: new Date(source.timestamp),
      sources: [
        {
          ...source,
          deviation: 0,
          weight: this.calculateWeight(source),
        },
      ],
      deviation: {
        maxDeviation: 0,
        averageDeviation: 0,
        anomalyDetected: false,
        possibleCauses: [],
        riskLevel: 'LOW',
      },
      daleeliData:
        source.source === 'DALEEL' && source.rawData
          ? {
              sequenceNumber: source.rawData.sequenceNumber,
              vehicleStatus: source.rawData.vehicleStatus,
              velocity: source.rawData.velocity,
              weight: source.rawData.weight,
            }
          : undefined,
    };
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private toDeg(rad: number): number {
    return rad * (180 / Math.PI);
  }
}

// Export singleton
export const locationFusionService = new LocationFusionService();
