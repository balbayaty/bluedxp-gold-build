/**
 * GCC Compliance Event Integration
 *
 * Integrates GCC Compliance services with the Event Bus for automatic
 * tracking, validation, and cross-module communication.
 *
 * @module gcc-compliance/eventIntegration
 */

import { eventBus, createEvent } from '@/lib/services/event-store';
import { validationOrchestrator } from './validationOrchestrator';
import { touchpointGenerator } from './touchpointGenerator';
import { backloadValidator } from './backloadValidator';
import { regulationDatabase } from './regulationDatabase';
import type {
  PreDispatchValidationRequest,
  DynamicTouchpointRequest,
  GCCCountry,
  EquipmentType,
  CargoType,
} from '@/types/gcc-compliance';

// ============================================================================
// EVENT TYPES
// ============================================================================

export const GCC_COMPLIANCE_EVENTS = {
  // Validation events
  VALIDATION_REQUESTED: 'gcc.validation.requested',
  VALIDATION_COMPLETED: 'gcc.validation.completed',
  VALIDATION_FAILED: 'gcc.validation.failed',

  // Touchpoint events
  TOUCHPOINTS_GENERATED: 'gcc.touchpoints.generated',
  TOUCHPOINT_REACHED: 'gcc.touchpoint.reached',
  TOUCHPOINT_MISSED: 'gcc.touchpoint.missed',

  // Truck ban events
  TRUCK_BAN_WARNING: 'gcc.truck-ban.warning',
  TRUCK_BAN_VIOLATION: 'gcc.truck-ban.violation',
  TRUCK_BAN_CLEARED: 'gcc.truck-ban.cleared',

  // Backload events
  BACKLOAD_VALIDATED: 'gcc.backload.validated',
  BACKLOAD_REJECTED: 'gcc.backload.rejected',

  // Location events
  LOCATION_ANOMALY: 'gcc.location.anomaly',
  LOCATION_DEVIATION: 'gcc.location.deviation',

  // Compliance status
  COMPLIANCE_STATUS_CHANGED: 'gcc.compliance.status-changed',
} as const;

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Initialize event subscriptions for GCC compliance
 */
export async function initializeGCCComplianceEvents(): Promise<void> {
  console.log('[GCC Compliance] Initializing event subscriptions...');

  // Subscribe to shipment creation for auto-validation
  eventBus.subscribe('tms.shipment.created', async (event) => {
    try {
      const shipment = event.payload as any;
      console.log(`[GCC Compliance] Auto-validating shipment: ${shipment.id}`);

      // Build validation request from shipment data
      const validationRequest = buildValidationRequestFromShipment(shipment);
      if (validationRequest) {
        const result = await validationOrchestrator.validate(validationRequest);

        // Publish validation result
        await eventBus.publish(
          createEvent(GCC_COMPLIANCE_EVENTS.VALIDATION_COMPLETED, {
            shipmentId: shipment.id,
            result,
          })
        );

        // If validation failed, publish alert
        if (!result.canProceed) {
          await eventBus.publish(
            createEvent(GCC_COMPLIANCE_EVENTS.VALIDATION_FAILED, {
              shipmentId: shipment.id,
              failedSteps: result.steps.filter((s) => s.status === 'FAILED'),
              recommendations: result.recommendations,
            })
          );
        }
      }
    } catch (error) {
      console.error('[GCC Compliance] Validation error:', error);
    }
  });

  // Subscribe to shipment dispatch for touchpoint generation
  eventBus.subscribe('tms.shipment.dispatched', async (event) => {
    try {
      const shipment = event.payload as any;
      console.log(`[GCC Compliance] Generating touchpoints for: ${shipment.id}`);

      const touchpointRequest = buildTouchpointRequestFromShipment(shipment);
      if (touchpointRequest) {
        const result = await touchpointGenerator.generateTouchpoints(touchpointRequest);

        await eventBus.publish(
          createEvent(GCC_COMPLIANCE_EVENTS.TOUCHPOINTS_GENERATED, {
            shipmentId: shipment.id,
            touchpoints: result.touchpoints,
            estimatedDuration: result.estimatedDuration,
          })
        );
      }
    } catch (error) {
      console.error('[GCC Compliance] Touchpoint generation error:', error);
    }
  });

  // Subscribe to location updates for truck ban monitoring
  eventBus.subscribe('daleel.location.updated', async (event) => {
    try {
      const { shipmentId, location, plateNumber } = event.payload as any;

      // Check if entering truck ban zone
      // This would need reverse geocoding to get the city
      // For now, we emit a placeholder event
      console.log(`[GCC Compliance] Location update for ${shipmentId || plateNumber}`);
    } catch (error) {
      console.error('[GCC Compliance] Location monitoring error:', error);
    }
  });

  // Subscribe to anomaly detection
  eventBus.subscribe('daleel.anomaly.detected', async (event) => {
    try {
      const { shipmentId, anomaly, location } = event.payload as any;

      await eventBus.publish(
        createEvent(GCC_COMPLIANCE_EVENTS.LOCATION_ANOMALY, {
          shipmentId,
          anomalyType: anomaly.type,
          severity: anomaly.severity,
          location,
          timestamp: new Date(),
        })
      );
    } catch (error) {
      console.error('[GCC Compliance] Anomaly handling error:', error);
    }
  });

  // Subscribe to backload requests
  eventBus.subscribe('tms.backload.requested', async (event) => {
    try {
      const backloadRequest = event.payload as any;

      const result = await backloadValidator.validateBackload({
        carrierId: backloadRequest.carrierId,
        carrierNationality: backloadRequest.carrierNationality,
        plateNumber: backloadRequest.plateNumber,
        plateType: backloadRequest.plateType,
        originalTrip: backloadRequest.originalTrip,
        proposedBackload: backloadRequest.proposedBackload,
      });

      if (result.isCompliant) {
        await eventBus.publish(
          createEvent(GCC_COMPLIANCE_EVENTS.BACKLOAD_VALIDATED, {
            backloadId: backloadRequest.id,
            result,
          })
        );
      } else {
        await eventBus.publish(
          createEvent(GCC_COMPLIANCE_EVENTS.BACKLOAD_REJECTED, {
            backloadId: backloadRequest.id,
            violations: result.violations,
            recommendations: result.recommendations,
          })
        );
      }
    } catch (error) {
      console.error('[GCC Compliance] Backload validation error:', error);
    }
  });

  console.log('[GCC Compliance] Event subscriptions initialized');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build validation request from shipment data
 */
function buildValidationRequestFromShipment(
  shipment: any
): PreDispatchValidationRequest | null {
  try {
    return {
      shipmentId: shipment.id,
      tenantId: shipment.tenantId || 'default',
      carrier: {
        id: shipment.carrierId || '',
        name: shipment.carrierName || '',
        nationality: (shipment.carrierNationality as GCCCountry) || 'SA',
        crNumber: shipment.carrierCrNumber || '',
        waslRegistered: shipment.waslRegistered ?? true,
        insuranceValid: true,
        licensedRoutes: ['ALL'],
      },
      equipment: {
        type: (shipment.equipmentType as EquipmentType) || 'FLATBED',
        plateNumber: shipment.vehiclePlateNumber || '',
        plateType: shipment.vehiclePlateType || '1',
        sequenceNumber: shipment.vehicleSequenceNumber,
      },
      cargo: {
        type: (shipment.cargoType as CargoType) || 'GENERAL',
        weight: shipment.weight || 0,
        dimensions: shipment.dimensions || { length: 0, width: 0, height: 0 },
        value: shipment.value || 0,
        sfdaRequired: shipment.sfdaRequired,
        hazmatClass: shipment.hazmatClass,
      },
      route: {
        origin: {
          facilityId: shipment.originFacilityId || '',
          city: shipment.originCity || '',
          country: (shipment.originCountry as GCCCountry) || 'SA',
          coordinates: shipment.originCoordinates || { lat: 0, lng: 0 },
          facilityType: shipment.originFacilityType || 'DOCK_WAREHOUSE',
        },
        destination: {
          facilityId: shipment.destinationFacilityId || '',
          city: shipment.destinationCity || '',
          country: (shipment.destinationCountry as GCCCountry) || 'SA',
          coordinates: shipment.destinationCoordinates || { lat: 0, lng: 0 },
          facilityType: shipment.destinationFacilityType || 'DOCK_WAREHOUSE',
        },
        plannedDeparture: new Date(shipment.plannedDeparture || Date.now()),
        plannedArrival: new Date(
          shipment.plannedArrival || Date.now() + 24 * 60 * 60 * 1000
        ),
        intermediateFacilities: shipment.intermediateFacilities || [],
      },
      documents: {
        bayanEtd: shipment.bayanNumber
          ? {
              number: shipment.bayanNumber,
              valid: true,
              expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              status: 'ACTIVE',
            }
          : undefined,
        permits: shipment.permits || [],
      },
    };
  } catch (error) {
    console.error('[GCC Compliance] Failed to build validation request:', error);
    return null;
  }
}

/**
 * Build touchpoint request from shipment data
 */
function buildTouchpointRequestFromShipment(
  shipment: any
): DynamicTouchpointRequest | null {
  try {
    return {
      shipmentId: shipment.id,
      origin: {
        city: shipment.originCity || '',
        country: (shipment.originCountry as GCCCountry) || 'SA',
        facilityId: shipment.originFacilityId || '',
        facilityType: shipment.originFacilityType || 'DOCK_WAREHOUSE',
        coordinates: shipment.originCoordinates || { lat: 0, lng: 0 },
      },
      destination: {
        city: shipment.destinationCity || '',
        country: (shipment.destinationCountry as GCCCountry) || 'SA',
        facilityId: shipment.destinationFacilityId || '',
        facilityType: shipment.destinationFacilityType || 'DOCK_WAREHOUSE',
        coordinates: shipment.destinationCoordinates || { lat: 0, lng: 0 },
      },
      equipmentType: (shipment.equipmentType as EquipmentType) || 'FLATBED',
      carrierNationality: (shipment.carrierNationality as GCCCountry) || 'SA',
      cargoType: (shipment.cargoType as CargoType) || 'GENERAL',
      requiresCrossDock: shipment.requiresCrossDock || false,
      plannedDeparture: new Date(shipment.plannedDeparture || Date.now()),
    };
  } catch (error) {
    console.error('[GCC Compliance] Failed to build touchpoint request:', error);
    return null;
  }
}

// ============================================================================
// MONITORING FUNCTIONS
// ============================================================================

/**
 * Start truck ban monitoring for a city
 */
export async function startTruckBanMonitoring(
  shipmentId: string,
  city: string,
  country: GCCCountry,
  vehicleType: EquipmentType,
  hasEAppointment: boolean = false
): Promise<void> {
  const checkInterval = 5 * 60 * 1000; // Check every 5 minutes

  const monitorId = setInterval(async () => {
    const result = regulationDatabase.checkTruckBan({
      city,
      country,
      plannedArrival: new Date(),
      vehicleType,
      hasEAppointment,
    });

    if (result.isRestricted && !result.canEnterWithAppointment) {
      await eventBus.publish(
        createEvent(GCC_COMPLIANCE_EVENTS.TRUCK_BAN_WARNING, {
          shipmentId,
          city,
          restriction: result,
          timestamp: new Date(),
        })
      );
    }
  }, checkInterval);

  // Store monitor ID for cleanup (in production, use a proper registry)
  console.log(`[GCC Compliance] Started truck ban monitoring for ${shipmentId}`);
}

/**
 * Check compliance status for a shipment
 */
export async function checkComplianceStatus(
  shipmentId: string,
  currentLocation: { lat: number; lng: number },
  plannedRoute: { lat: number; lng: number }[]
): Promise<{
  isCompliant: boolean;
  deviationKm: number;
  alerts: string[];
}> {
  // Calculate deviation from planned route
  // This is a simplified version - in production, use proper route matching
  const alerts: string[] = [];
  let minDistance = Infinity;

  for (const point of plannedRoute) {
    const distance = calculateDistance(currentLocation, point);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  const deviationKm = minDistance;
  const isCompliant = deviationKm < 10; // 10km threshold

  if (!isCompliant) {
    alerts.push(`Route deviation detected: ${deviationKm.toFixed(1)}km from planned route`);
  }

  return {
    isCompliant,
    deviationKm,
    alerts,
  };
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
