/**
 * Backload Compliance Validator
 *
 * Implements TGA October 2024 backload restriction:
 * Foreign trucks can ONLY pick up backloads on their direct return route
 * from the arrival city. They CANNOT travel across country to pick up cargo.
 *
 * @module gcc-compliance/backloadValidator
 */

import type {
  GCCCountry,
  BackloadValidationRequest,
  BackloadValidationResult,
} from '@/types/gcc-compliance';
import { regulationDatabase } from './regulationDatabase';

// ============================================================================
// CONSTANTS
// ============================================================================

const EARTH_RADIUS_KM = 6371;
const DEFAULT_MAX_DISTANCE_KM = 50; // TGA regulation: 50km from return route

// Country border exit points (approximate coordinates)
const COUNTRY_EXIT_POINTS: Record<GCCCountry, { lat: number; lng: number; name: string }[]> = {
  SA: [
    { lat: 28.4167, lng: 48.5000, name: 'Khafji (Kuwait)' },
    { lat: 24.2500, lng: 51.5833, name: 'Al Ghuwaifat (UAE)' },
    { lat: 24.7167, lng: 50.9667, name: 'Salwa (Qatar)' },
    { lat: 26.1833, lng: 50.3500, name: 'King Fahd Causeway (Bahrain)' },
    { lat: 22.0000, lng: 55.0000, name: 'Al Batha (Oman)' },
  ],
  KW: [{ lat: 28.4167, lng: 48.5000, name: 'Nuwaiseeb (Saudi)' }],
  AE: [
    { lat: 24.2500, lng: 51.5833, name: 'Al Silaa (Saudi)' },
    { lat: 24.8000, lng: 56.1167, name: 'Hatta (Oman)' },
  ],
  QA: [{ lat: 24.7167, lng: 50.9667, name: 'Abu Samra (Saudi)' }],
  BH: [{ lat: 26.1833, lng: 50.3500, name: 'King Fahd Causeway (Saudi)' }],
  OM: [
    { lat: 22.0000, lng: 55.0000, name: 'Al Batha (Saudi)' },
    { lat: 24.8000, lng: 56.1167, name: 'Hatta (UAE)' },
  ],
};

// ============================================================================
// BACKLOAD VALIDATOR SERVICE
// ============================================================================

export class BackloadComplianceValidator {
  /**
   * Validate if a backload pickup is legal under TGA October 2024 rules
   */
  async validateBackload(request: BackloadValidationRequest): Promise<BackloadValidationResult> {
    const startTime = Date.now();

    // 1. Check if carrier is Saudi (exempt from backload restrictions)
    if (request.carrierNationality === 'SA') {
      return this.createCompliantResult(request, 'Saudi carriers are exempt from backload restrictions');
    }

    // 2. Get the backload regulation
    const regulation = regulationDatabase.getBackloadRestriction('SA');
    const maxDistance = regulation?.backloadRestriction?.allowedPickupRadius || DEFAULT_MAX_DISTANCE_KM;

    // 3. Calculate distance from arrival city to pickup location
    const distanceFromArrival = this.calculateHaversineDistance(
      request.originalTrip.arrivalLocation,
      request.proposedBackload.pickupLocation
    );

    // 4. Determine the return route (arrival city → carrier's home country border)
    const returnRoute = this.calculateReturnRoute(
      request.originalTrip.arrivalLocation,
      request.carrierNationality as GCCCountry
    );

    // 5. Calculate distance from pickup to the return route
    const distanceFromReturnRoute = this.calculateDistanceFromPolyline(
      request.proposedBackload.pickupLocation,
      returnRoute.points
    );

    // 6. Check if pickup is on the return route
    const isOnReturnRoute = distanceFromReturnRoute <= maxDistance;

    // 7. Calculate deviation angle
    const deviationAngle = this.calculateDeviationAngle(
      request.originalTrip.arrivalLocation,
      request.proposedBackload.pickupLocation,
      returnRoute.exitPoint
    );

    // 8. Determine compliance
    const violations: string[] = [];
    const warnings: string[] = [];

    if (!isOnReturnRoute) {
      violations.push(
        `Pickup location is ${Math.round(distanceFromReturnRoute)}km from return route (max allowed: ${maxDistance}km)`
      );
    }

    if (deviationAngle > 90) {
      violations.push(
        `Pickup direction deviates ${Math.round(deviationAngle)}° from return route (opposite direction)`
      );
    }

    // Check if pickup city matches arrival city (always allowed)
    if (
      request.proposedBackload.pickupCity.toLowerCase() ===
      request.originalTrip.arrivalCity.toLowerCase()
    ) {
      return this.createCompliantResult(
        request,
        'Pickup is in the same city as arrival - always allowed'
      );
    }

    // Warnings for borderline cases
    if (distanceFromReturnRoute > maxDistance * 0.8 && distanceFromReturnRoute <= maxDistance) {
      warnings.push(
        `Pickup is ${Math.round(distanceFromReturnRoute)}km from route - close to ${maxDistance}km limit`
      );
    }

    const isLegal = violations.length === 0;
    const complianceStatus = isLegal
      ? 'COMPLIANT'
      : warnings.length > 0
        ? 'REQUIRES_REVIEW'
        : 'NON_COMPLIANT';

    return {
      isLegal,
      distanceFromArrival: Math.round(distanceFromArrival * 10) / 10,
      distanceFromReturnRoute: Math.round(distanceFromReturnRoute * 10) / 10,
      maxAllowedDistance: maxDistance,
      isOnReturnRoute,
      returnRoutePoints: returnRoute.points.map((p, i) => ({
        lat: p.lat,
        lng: p.lng,
        city: i === 0 ? request.originalTrip.arrivalCity : returnRoute.exitPoint.name,
      })),
      complianceStatus,
      violations,
      warnings,
      calculationDetails: {
        haversineDistance: distanceFromArrival,
        routeDistance: distanceFromReturnRoute,
        directReturnRoute: returnRoute,
        pickupDeviationAngle: deviationAngle,
      },
      regulationReference: {
        authority: 'Transport General Authority (TGA)',
        circularNumber: regulation?.referenceNumber || 'TGA-CIRC-2024-10',
        effectiveDate: regulation?.effectiveDate || new Date('2024-10-01'),
        description:
          'Foreign trucks can ONLY pick up backloads on their direct return route from the arrival city.',
      },
    };
  }

  /**
   * Quick check if backload is potentially valid (for UI validation)
   */
  quickCheck(
    arrivalLocation: { lat: number; lng: number },
    pickupLocation: { lat: number; lng: number },
    carrierNationality: GCCCountry | 'OTHER'
  ): { likely: boolean; reason: string } {
    if (carrierNationality === 'SA') {
      return { likely: true, reason: 'Saudi carriers exempt' };
    }

    const distance = this.calculateHaversineDistance(arrivalLocation, pickupLocation);

    if (distance <= 50) {
      return { likely: true, reason: 'Within 50km of arrival' };
    }

    if (distance > 200) {
      return { likely: false, reason: 'Too far from arrival city' };
    }

    return { likely: false, reason: 'Requires full validation' };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Calculate Haversine distance between two points
   */
  private calculateHaversineDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const lat1 = this.toRadians(point1.lat);
    const lat2 = this.toRadians(point2.lat);
    const deltaLat = this.toRadians(point2.lat - point1.lat);
    const deltaLng = this.toRadians(point2.lng - point1.lng);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
  }

  /**
   * Calculate return route from arrival to carrier's home country
   */
  private calculateReturnRoute(
    arrivalLocation: { lat: number; lng: number },
    carrierNationality: GCCCountry
  ): {
    points: Array<{ lat: number; lng: number }>;
    exitPoint: { lat: number; lng: number; name: string };
    totalDistance: number;
  } {
    // Get exit points for carrier's home country
    const exitPoints = COUNTRY_EXIT_POINTS[carrierNationality] || [];

    if (exitPoints.length === 0) {
      // Fallback: return direct line
      return {
        points: [arrivalLocation],
        exitPoint: { ...arrivalLocation, name: 'Unknown' },
        totalDistance: 0,
      };
    }

    // Find nearest exit point
    let nearestExit = exitPoints[0];
    let minDistance = this.calculateHaversineDistance(arrivalLocation, nearestExit);

    for (const exit of exitPoints) {
      const distance = this.calculateHaversineDistance(arrivalLocation, exit);
      if (distance < minDistance) {
        minDistance = distance;
        nearestExit = exit;
      }
    }

    // Create route points (simple direct route)
    // In production, this would use a routing API like Google Maps or OSRM
    const points = this.interpolateRoute(arrivalLocation, nearestExit, 10);

    return {
      points,
      exitPoint: nearestExit,
      totalDistance: minDistance,
    };
  }

  /**
   * Interpolate points along a route
   */
  private interpolateRoute(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    numPoints: number
  ): Array<{ lat: number; lng: number }> {
    const points: Array<{ lat: number; lng: number }> = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      points.push({
        lat: start.lat + (end.lat - start.lat) * t,
        lng: start.lng + (end.lng - start.lng) * t,
      });
    }

    return points;
  }

  /**
   * Calculate minimum distance from a point to a polyline
   */
  private calculateDistanceFromPolyline(
    point: { lat: number; lng: number },
    polyline: Array<{ lat: number; lng: number }>
  ): number {
    if (polyline.length === 0) return Infinity;
    if (polyline.length === 1) return this.calculateHaversineDistance(point, polyline[0]);

    let minDistance = Infinity;

    for (let i = 0; i < polyline.length - 1; i++) {
      const segmentStart = polyline[i];
      const segmentEnd = polyline[i + 1];

      const distance = this.pointToSegmentDistance(point, segmentStart, segmentEnd);
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

  /**
   * Calculate distance from point to line segment
   */
  private pointToSegmentDistance(
    point: { lat: number; lng: number },
    segmentStart: { lat: number; lng: number },
    segmentEnd: { lat: number; lng: number }
  ): number {
    const A = point.lat - segmentStart.lat;
    const B = point.lng - segmentStart.lng;
    const C = segmentEnd.lat - segmentStart.lat;
    const D = segmentEnd.lng - segmentStart.lng;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    let param = -1;
    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let closestPoint: { lat: number; lng: number };

    if (param < 0) {
      closestPoint = segmentStart;
    } else if (param > 1) {
      closestPoint = segmentEnd;
    } else {
      closestPoint = {
        lat: segmentStart.lat + param * C,
        lng: segmentStart.lng + param * D,
      };
    }

    return this.calculateHaversineDistance(point, closestPoint);
  }

  /**
   * Calculate deviation angle from return route
   */
  private calculateDeviationAngle(
    arrival: { lat: number; lng: number },
    pickup: { lat: number; lng: number },
    exit: { lat: number; lng: number }
  ): number {
    // Vector from arrival to exit (return route direction)
    const returnVector = {
      x: exit.lng - arrival.lng,
      y: exit.lat - arrival.lat,
    };

    // Vector from arrival to pickup
    const pickupVector = {
      x: pickup.lng - arrival.lng,
      y: pickup.lat - arrival.lat,
    };

    // Calculate angle between vectors
    const dotProduct = returnVector.x * pickupVector.x + returnVector.y * pickupVector.y;
    const returnMag = Math.sqrt(returnVector.x ** 2 + returnVector.y ** 2);
    const pickupMag = Math.sqrt(pickupVector.x ** 2 + pickupVector.y ** 2);

    if (returnMag === 0 || pickupMag === 0) return 0;

    const cosAngle = dotProduct / (returnMag * pickupMag);
    const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

    return this.toDegrees(angle);
  }

  /**
   * Create a compliant result
   */
  private createCompliantResult(
    request: BackloadValidationRequest,
    reason: string
  ): BackloadValidationResult {
    return {
      isLegal: true,
      distanceFromArrival: 0,
      distanceFromReturnRoute: 0,
      maxAllowedDistance: DEFAULT_MAX_DISTANCE_KM,
      isOnReturnRoute: true,
      returnRoutePoints: [],
      complianceStatus: 'COMPLIANT',
      violations: [],
      warnings: [],
      calculationDetails: {
        haversineDistance: 0,
        routeDistance: 0,
        directReturnRoute: null,
        pickupDeviationAngle: 0,
      },
      regulationReference: {
        authority: 'Transport General Authority (TGA)',
        circularNumber: 'TGA-CIRC-2024-10',
        effectiveDate: new Date('2024-10-01'),
        description: reason,
      },
    };
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}

// Export singleton
export const backloadValidator = new BackloadComplianceValidator();
