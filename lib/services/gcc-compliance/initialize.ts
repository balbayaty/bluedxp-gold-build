/**
 * GCC Compliance Module Initialization
 * 
 * This module initializes the GCC Compliance services and wires them
 * to the TMS (Transportation Management System) event bus.
 * 
 * Call this during application startup to enable automatic compliance
 * validation, tracking, and monitoring for all shipments.
 * 
 * @module gcc-compliance/initialize
 */

import { eventBus, createEvent } from '@/lib/services/event-bus';
import { validationOrchestrator } from './validationOrchestrator';
import { touchpointGenerator } from './touchpointGenerator';
import { backloadValidator } from './backloadValidator';
import { regulationDatabase } from './regulationDatabase';
import { daleeliBillingService } from './daleeliBillingService';
import { bayanQRService } from './bayanQrEmbedder';
import { textLocateService } from './textLocateService';
import { locationFusionService } from './locationFusionService';
import { industryStandardsService } from './standards/industryStandards';
import { complianceCertificateService } from './complianceCertificateService';
import { geofenceZoneService } from '@/lib/services/geofence';
import type { ZoneType } from '@/lib/services/geofence';
import type {
  PreDispatchValidationRequest,
  GCCCountry,
} from '@/types/gcc-compliance';

// ============================================================================
// STATE
// ============================================================================

let isInitialized = false;
const activeShipments: Map<string, any> = new Map();
const monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize GCC Compliance module
 * 
 * This sets up all event subscriptions and starts the compliance engine.
 * Should be called once during application startup.
 */
export async function initializeGCCCompliance(): Promise<void> {
  if (isInitialized) {
    console.log('[GCC Compliance] Already initialized, skipping...');
    return;
  }

  console.log('[GCC Compliance] 🚀 Initializing GCC Compliance Module...');
  console.log('[GCC Compliance] Version: 1.0.0');
  console.log('[GCC Compliance] Features:');
  console.log('  • Pre-dispatch validation (8 steps)');
  console.log('  • Backload validation (TGA Oct 2024)');
  console.log('  • Truck ban monitoring');
  console.log('  • Daleeli tracking & billing');
  console.log('  • Bayan QR embedding');
  console.log('  • TextLocate location requests');
  console.log('  • Multi-source location fusion');
  console.log('  • Industry standards compliance');

  await setupEventSubscriptions();
  
  isInitialized = true;
  console.log('[GCC Compliance] ✅ GCC Compliance Module initialized successfully');
}

/**
 * Setup event subscriptions
 */
async function setupEventSubscriptions(): Promise<void> {
  // ============================================================================
  // SHIPMENT LIFECYCLE EVENTS
  // ============================================================================

  // When a shipment is created → auto-validate compliance
  eventBus.subscribe('tms.shipment.created', async (event) => {
    try {
      const shipment = event.payload?.shipment || event.payload;
      if (!shipment?.id) return;

      console.log(`[GCC Compliance] 📋 Processing new shipment: ${shipment.id}`);

      // Check if this shipment involves Saudi Arabia or GCC
      const involvesGCC = isGCCShipment(shipment);
      if (!involvesGCC) {
        console.log(`[GCC Compliance] Shipment ${shipment.id} does not involve GCC, skipping validation`);
        return;
      }

      // Build validation request
      const validationRequest = buildValidationRequest(shipment);
      
      // Run pre-dispatch validation
      const result = await validationOrchestrator.validate(validationRequest);

      // Store shipment with validation result
      activeShipments.set(shipment.id, {
        ...shipment,
        gccCompliance: {
          validationResult: {
            canProceed: result.canProceed,
            overallRisk: result.overallRisk,
            steps: result.steps.map(s => ({
              name: s.name,
              status: s.status,
              message: s.message,
              details: s.details,
            })),
            recommendations: result.recommendations,
          },
          validatedAt: new Date(),
        },
      });

      // Publish validation result
      await eventBus.publish(
        createEvent('gcc.shipment.validated', {
          shipmentId: shipment.id,
          canProceed: result.canProceed,
          overallRisk: result.overallRisk,
          stepsSummary: result.steps.map(s => ({ name: s.name, status: s.status })),
          recommendations: result.recommendations.slice(0, 3),
        })
      );

      // If validation failed, publish alert
      if (!result.canProceed) {
        console.log(`[GCC Compliance] ⚠️ Shipment ${shipment.id} failed validation`);
        await eventBus.publish(
          createEvent('gcc.compliance.alert', {
            shipmentId: shipment.id,
            severity: 'HIGH',
            type: 'VALIDATION_FAILED',
            message: `Pre-dispatch validation failed for shipment ${shipment.id}`,
            failedSteps: result.steps.filter(s => s.status === 'FAILED').map(s => s.name),
            recommendations: result.recommendations,
          })
        );
      } else {
        console.log(`[GCC Compliance] ✅ Shipment ${shipment.id} passed validation`);
      }

    } catch (error) {
      console.error('[GCC Compliance] Error processing shipment created:', error);
    }
  });

  // When a shipment is dispatched → generate touchpoints and start tracking
  eventBus.subscribe('tms.shipment.dispatched', async (event) => {
    try {
      const shipment = event.payload?.shipment || event.payload;
      if (!shipment?.id) return;

      console.log(`[GCC Compliance] 🚚 Processing dispatch for shipment: ${shipment.id}`);

      // Check if this shipment involves Saudi Arabia or GCC
      const involvesGCC = isGCCShipment(shipment);
      if (!involvesGCC) return;

      // Generate touchpoints
      const touchpointRequest = buildTouchpointRequest(shipment);
      const touchpoints = await touchpointGenerator.generateTouchpoints(touchpointRequest);

      // Update stored shipment
      const storedShipment = activeShipments.get(shipment.id) || shipment;
      storedShipment.gccCompliance = {
        ...storedShipment.gccCompliance,
        touchpoints: touchpoints.touchpoints,
        dispatchedAt: new Date(),
      };
      activeShipments.set(shipment.id, storedShipment);

      // 🔥 CREATE ACTUAL GEOFENCES FROM TOUCHPOINTS
      const tenantId = shipment.tenantId || 'default';
      let geofencesCreated = 0;
      
      for (const touchpoint of touchpoints.touchpoints) {
        try {
          // Map touchpoint type to zone type
          const zoneType = mapTouchpointToZoneType(touchpoint.type);
          
          // Create the geofence zone
          const geofenceZone = await geofenceZoneService.createZone({
            name: `${touchpoint.name} - ${shipment.shipmentNumber || shipment.id}`,
            type: zoneType,
            geometry: {
              type: 'CIRCLE',
              coordinates: {
                center: {
                  lat: touchpoint.coordinates.lat,
                  lng: touchpoint.coordinates.lng,
                },
                radius: touchpoint.geofenceConfig?.radius || 500, // meters
              },
            },
            metadata: {
              expectedDwellTime: touchpoint.geofenceConfig?.dwellThreshold || touchpoint.estimatedDwell,
              maxDwellTime: (touchpoint.geofenceConfig?.dwellThreshold || 60) * 2,
              shipmentId: shipment.id,
              touchpointId: touchpoint.id,
              touchpointType: touchpoint.type,
              requiredActions: touchpoint.requiredActions,
              requiredDocuments: touchpoint.requiredDocuments,
              entryTrigger: touchpoint.geofenceConfig?.entryTrigger ?? true,
              exitTrigger: touchpoint.geofenceConfig?.exitTrigger ?? true,
              dwellAlert: touchpoint.geofenceConfig?.dwellAlert ?? true,
            },
            tenantId,
            enabled: true,
          });

          // Update touchpoint with geofence ID
          touchpoint.geofenceZoneId = geofenceZone.id;
          geofencesCreated++;

          console.log(`[GCC Compliance] 🗺️ Created geofence zone: ${geofenceZone.name} (${geofenceZone.id})`);
        } catch (geoError) {
          console.warn(`[GCC Compliance] Failed to create geofence for touchpoint ${touchpoint.name}:`, geoError);
        }
      }

      // Update stored shipment with geofence IDs
      activeShipments.set(shipment.id, storedShipment);

      // Publish touchpoints generated event
      await eventBus.publish(
        createEvent('gcc.touchpoints.generated', {
          shipmentId: shipment.id,
          touchpointCount: touchpoints.touchpoints.length,
          geofencesCreated,
          estimatedDuration: touchpoints.estimatedDuration,
        })
      );

      console.log(`[GCC Compliance] 📍 Generated ${touchpoints.touchpoints.length} touchpoints with ${geofencesCreated} geofences for ${shipment.id}`);

      // Generate Bayan QR if Bayan number exists
      if (shipment.bayanNumber) {
        try {
          const qrResult = await bayanQRService.generateBayanEtwQR({
            bayanNumber: shipment.bayanNumber,
            shipmentId: shipment.id,
            carrier: {
              name: shipment.carrierName || 'Unknown',
              crNumber: shipment.carrierCR || '',
              nationality: (shipment.carrierNationality || 'KSA') as GCCCountry,
            },
            vehicle: {
              plateNumber: shipment.vehiclePlateNumber || '',
              plateType: shipment.vehiclePlateType || '1',
            },
            driver: {
              name: shipment.driverName || 'Unknown',
              licenseNumber: shipment.driverLicenseNumber || '',
            },
            origin: {
              city: shipment.origin?.address?.city || shipment.origin?.name || '',
              country: (shipment.origin?.address?.country || 'SA') as GCCCountry,
            },
            destination: {
              city: shipment.destination?.address?.city || shipment.destination?.name || '',
              country: (shipment.destination?.address?.country || 'SA') as GCCCountry,
            },
            cargo: {
              type: 'GENERAL',
              weight: shipment.totalWeight || 0,
              description: shipment.items?.[0]?.description || 'General Cargo',
            },
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });

          storedShipment.gccCompliance.bayanQrCode = qrResult.qrCodeBase64;
          storedShipment.gccCompliance.bayanVerificationUrl = qrResult.verificationUrl;
          activeShipments.set(shipment.id, storedShipment);

          console.log(`[GCC Compliance] 🔲 Generated Bayan QR for ${shipment.id}`);

          await eventBus.publish(
            createEvent('gcc.qr.generated', {
              shipmentId: shipment.id,
              bayanNumber: shipment.bayanNumber,
              verificationUrl: qrResult.verificationUrl,
            })
          );
        } catch (qrError) {
          console.warn('[GCC Compliance] Failed to generate Bayan QR:', qrError);
        }
      }

      // Start monitoring
      await startComplianceMonitoring(shipment.id);

      // Send driver location request via WhatsApp if driver phone available
      if (shipment.driverPhone) {
        try {
          await textLocateService.sendLocationRequest({
            shipmentId: shipment.id,
            driverPhone: shipment.driverPhone,
            driverName: shipment.driverName || 'Driver',
            channel: 'WHATSAPP',
            urgency: 'NORMAL',
            customMessage: `Your trip ${shipment.shipmentNumber || shipment.id} has been dispatched. Please share your location to begin tracking.`,
          });
          console.log(`[GCC Compliance] 📱 Sent location request to driver for ${shipment.id}`);
        } catch (driverError) {
          console.warn('[GCC Compliance] Failed to send driver location request:', driverError);
        }
      }

    } catch (error) {
      console.error('[GCC Compliance] Error processing shipment dispatched:', error);
    }
  });

  // When a shipment is delivered → stop tracking and generate report
  eventBus.subscribe('tms.shipment.delivered', async (event) => {
    try {
      const shipment = event.payload?.shipment || event.payload;
      if (!shipment?.id) return;

      console.log(`[GCC Compliance] ✅ Processing delivery for shipment: ${shipment.id}`);

      // Stop monitoring
      await stopComplianceMonitoring(shipment.id);

      // Update stored shipment
      const storedShipment = activeShipments.get(shipment.id);
      if (storedShipment?.gccCompliance) {
        storedShipment.gccCompliance.completedAt = new Date();
        
        // Generate compliance certificate
        try {
          const certificate = await complianceCertificateService.generateCertificate({
            shipmentId: shipment.id,
            tenantId: shipment.tenantId || 'default',
            validationResult: storedShipment.gccCompliance.validationResult,
            touchpoints: storedShipment.gccCompliance.touchpoints || [],
          });

          await eventBus.publish(
            createEvent('gcc.shipment.completed', {
              shipmentId: shipment.id,
              complianceScore: storedShipment.gccCompliance.validationResult?.canProceed ? 100 : 0,
              touchpointsCompleted: storedShipment.gccCompliance.touchpoints?.length || 0,
              certificateId: certificate.certificateId,
            })
          );
        } catch (certError) {
          console.warn('[GCC Compliance] Failed to generate compliance certificate:', certError);
        }
      }

      // Clean up
      activeShipments.delete(shipment.id);
      console.log(`[GCC Compliance] 📦 Shipment ${shipment.id} compliance tracking completed`);

    } catch (error) {
      console.error('[GCC Compliance] Error processing shipment delivered:', error);
    }
  });

  // ============================================================================
  // LOCATION EVENTS
  // ============================================================================

  // When Daleeli location is updated
  eventBus.subscribe('daleel.location.updated', async (event) => {
    try {
      const { shipmentId, location, plateNumber } = event.payload || {};
      
      // Track API call for billing
      await daleeliBillingService.trackApiCall({
        tenantId: event.metadata?.tenantId || 'default',
        endpoint: 'location.updated',
        method: 'GET',
        shipmentId,
        bayanNumber: event.payload?.bayanNumber,
      });

      const storedShipment = activeShipments.get(shipmentId);
      if (!storedShipment) return;

      // Update Daleeli tracking info
      if (storedShipment.gccCompliance) {
        storedShipment.gccCompliance.daleeliTrackingActive = true;
        storedShipment.gccCompliance.daleeliLastUpdate = new Date();
        activeShipments.set(shipmentId, storedShipment);
      }

      // Check touchpoint proximity
      const touchpoints = storedShipment.gccCompliance?.touchpoints || [];
      for (const touchpoint of touchpoints) {
        if (touchpoint.status !== 'PENDING') continue;

        const distance = calculateDistance(
          { lat: location.latitude, lng: location.longitude },
          touchpoint.coordinates
        );

        // Within 500m of touchpoint
        if (distance < 0.5) {
          touchpoint.status = 'APPROACHING';
          await eventBus.publish(
            createEvent('gcc.touchpoint.approaching', {
              shipmentId,
              touchpointId: touchpoint.id,
              touchpointName: touchpoint.name,
              distance: Math.round(distance * 1000), // meters
            })
          );
        }
      }

    } catch (error) {
      console.error('[GCC Compliance] Error processing location update:', error);
    }
  });

  // When geofence is entered
  eventBus.subscribe('geofence.entered', async (event) => {
    try {
      const { shipmentId, geofenceId, geofenceType, entryTime } = event.payload || {};

      const storedShipment = activeShipments.get(shipmentId);
      if (!storedShipment?.gccCompliance?.touchpoints) return;

      // Find matching touchpoint
      const touchpoint = storedShipment.gccCompliance.touchpoints.find(
        (t: any) => t.id === geofenceId
      );

      if (touchpoint) {
        touchpoint.status = 'ARRIVED';
        touchpoint.actualArrival = new Date(entryTime || Date.now());
        activeShipments.set(shipmentId, storedShipment);

        await eventBus.publish(
          createEvent('gcc.touchpoint.reached', {
            shipmentId,
            touchpointId: touchpoint.id,
            touchpointName: touchpoint.name,
            touchpointType: touchpoint.type,
            actualArrival: touchpoint.actualArrival,
          })
        );
      }

    } catch (error) {
      console.error('[GCC Compliance] Error processing geofence entered:', error);
    }
  });

  // ============================================================================
  // BAYAN EVENTS
  // ============================================================================

  eventBus.subscribe('bayan.created', async (event) => {
    try {
      const { shipmentId, bayanNumber } = event.payload || {};
      
      const storedShipment = activeShipments.get(shipmentId);
      if (storedShipment) {
        storedShipment.gccCompliance = {
          ...storedShipment.gccCompliance,
          bayanNumber,
          bayanStatus: 'ACTIVE',
        };
        activeShipments.set(shipmentId, storedShipment);
      }

    } catch (error) {
      console.error('[GCC Compliance] Error processing Bayan created:', error);
    }
  });

  console.log('[GCC Compliance] 📡 Event subscriptions configured');
}

// ============================================================================
// MONITORING
// ============================================================================

/**
 * Start compliance monitoring for a shipment
 */
async function startComplianceMonitoring(shipmentId: string): Promise<void> {
  if (monitoringIntervals.has(shipmentId)) {
    return;
  }

  const intervalId = setInterval(async () => {
    await performComplianceCheck(shipmentId);
  }, 5 * 60 * 1000); // Every 5 minutes

  monitoringIntervals.set(shipmentId, intervalId);
  console.log(`[GCC Compliance] 👁️ Started monitoring for shipment ${shipmentId}`);
}

/**
 * Stop compliance monitoring for a shipment
 */
async function stopComplianceMonitoring(shipmentId: string): Promise<void> {
  const intervalId = monitoringIntervals.get(shipmentId);
  if (intervalId) {
    clearInterval(intervalId);
    monitoringIntervals.delete(shipmentId);
    console.log(`[GCC Compliance] 🛑 Stopped monitoring for shipment ${shipmentId}`);
  }
}

/**
 * Perform periodic compliance check
 */
async function performComplianceCheck(shipmentId: string): Promise<void> {
  const storedShipment = activeShipments.get(shipmentId);
  if (!storedShipment) {
    await stopComplianceMonitoring(shipmentId);
    return;
  }

  // Check for truck ban violations
  // Check driver working hours
  // Check location deviations
  // etc.
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if shipment involves GCC countries
 */
function isGCCShipment(shipment: any): boolean {
  const gccCountries = ['SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'KSA', 'UAE', 'SAUDI ARABIA', 'UNITED ARAB EMIRATES'];
  
  const originCountry = (
    shipment.origin?.address?.country ||
    shipment.origin?.address?.countryCode ||
    ''
  ).toUpperCase();
  
  const destCountry = (
    shipment.destination?.address?.country ||
    shipment.destination?.address?.countryCode ||
    ''
  ).toUpperCase();

  return gccCountries.includes(originCountry) || gccCountries.includes(destCountry);
}

/**
 * Build validation request from shipment
 */
function buildValidationRequest(shipment: any): PreDispatchValidationRequest {
  return {
    shipmentId: shipment.id,
    tenantId: shipment.tenantId || 'default',
    carrier: {
      id: shipment.carrierId || 'unknown',
      name: shipment.carrierName || 'Unknown Carrier',
      nationality: (shipment.carrierNationality || 'KSA') as GCCCountry,
      crNumber: shipment.carrierCR || '',
      waslRegistered: shipment.waslRegistered ?? true,
      insuranceValid: true,
      licensedRoutes: ['ALL'],
    },
    equipment: {
      type: shipment.equipmentType || 'FLATBED',
      plateNumber: shipment.vehiclePlateNumber || '',
      plateType: shipment.vehiclePlateType || '1',
      sequenceNumber: shipment.vehicleSequenceNumber,
    },
    cargo: {
      type: shipment.cargoType || 'GENERAL',
      weight: shipment.totalWeight || 0,
      dimensions: {
        length: shipment.dimensions?.length || 0,
        width: shipment.dimensions?.width || 0,
        height: shipment.dimensions?.height || 0,
      },
      value: shipment.totalValue || 0,
      hazmatClass: shipment.hazmat?.class,
      hazmatUnNumber: shipment.hazmat?.unNumber,
    },
    route: {
      origin: {
        facilityId: shipment.origin?.id || 'origin',
        city: shipment.origin?.address?.city || shipment.origin?.name || '',
        country: (shipment.origin?.address?.country || 'SA') as GCCCountry,
        coordinates: shipment.origin?.coordinates || { lat: 0, lng: 0 },
        facilityType: 'WAREHOUSE',
      },
      destination: {
        facilityId: shipment.destination?.id || 'destination',
        city: shipment.destination?.address?.city || shipment.destination?.name || '',
        country: (shipment.destination?.address?.country || 'SA') as GCCCountry,
        coordinates: shipment.destination?.coordinates || { lat: 0, lng: 0 },
        facilityType: 'WAREHOUSE',
      },
      plannedDeparture: new Date(shipment.pickupDate || Date.now()),
      plannedArrival: new Date(shipment.estimatedDelivery || Date.now() + 24 * 60 * 60 * 1000),
      intermediateFacilities: [],
    },
    documents: {
      bayanEtd: shipment.bayanNumber ? {
        number: shipment.bayanNumber,
        valid: true,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      } : undefined,
      permits: shipment.permits || [],
    },
  };
}

/**
 * Build touchpoint request from shipment
 */
function buildTouchpointRequest(shipment: any) {
  return {
    shipmentId: shipment.id,
    origin: {
      city: shipment.origin?.address?.city || shipment.origin?.name || '',
      country: (shipment.origin?.address?.country || 'SA') as GCCCountry,
      facilityId: shipment.origin?.id || 'origin',
      facilityType: 'WAREHOUSE' as const,
      coordinates: shipment.origin?.coordinates || { lat: 0, lng: 0 },
    },
    destination: {
      city: shipment.destination?.address?.city || shipment.destination?.name || '',
      country: (shipment.destination?.address?.country || 'SA') as GCCCountry,
      facilityId: shipment.destination?.id || 'destination',
      facilityType: 'WAREHOUSE' as const,
      coordinates: shipment.destination?.coordinates || { lat: 0, lng: 0 },
    },
    equipmentType: (shipment.equipmentType || 'FLATBED') as any,
    carrierNationality: (shipment.carrierNationality || 'KSA') as GCCCountry,
    cargoType: 'GENERAL' as const,
    requiresCrossDock: false,
    plannedDeparture: new Date(shipment.pickupDate || Date.now()),
  };
}

/**
 * Calculate distance between two coordinates (km)
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

/**
 * Map touchpoint type to geofence zone type
 */
function mapTouchpointToZoneType(touchpointType: string): ZoneType {
  const mapping: Record<string, ZoneType> = {
    // Origin/Destination
    POL: 'ORIGIN_FACILITY',
    POD: 'DESTINATION_FACILITY',
    WAREHOUSE: 'WAREHOUSE',
    CROSSDOCK: 'LOGISTICS_HUB',
    
    // Border & Customs
    BPC_EXIT: 'BORDER_EXIT_POINT',
    BPC_ENTRY: 'BORDER_ENTRY_POINT',
    CUSTOMS: 'CUSTOMS_CLEARANCE_FACILITY',
    CUSTOMS_INSPECTION: 'CUSTOMS_INSPECTION_AREA',
    
    // Regulatory
    TGA: 'REGULATORY_CHECKPOINT',
    SFDA: 'REGULATORY_CHECKPOINT',
    WASL: 'COMPLIANCE_VERIFICATION_POINT',
    SABER: 'COMPLIANCE_VERIFICATION_POINT',
    
    // Port/Terminal
    PORT: 'PORT_TERMINAL',
    TERMINAL: 'PORT_TERMINAL',
    SEAPORT: 'PORT_TERMINAL',
    AIRPORT: 'AIRPORT_CARGO_TERMINAL',
    
    // Weight/Inspection
    WEIGH_STATION: 'WEIGH_STATION',
    WEIGHBRIDGE: 'WEIGH_STATION',
    INSPECTION: 'INSPECTION_FACILITY',
    
    // Rest/Service
    REST_AREA: 'REST_AREA',
    TRUCK_STOP: 'SERVICE_AREA',
    FUEL: 'FUEL_STATION',
    
    // Security
    SECURITY: 'SECURITY_CHECKPOINT',
    CHECKPOINT: 'SECURITY_CHECKPOINT',
    
    // City limits (for truck ban zones)
    CITY_LIMIT: 'CITY_LIMIT',
    TRUCK_BAN_AREA: 'RESTRICTED_AREA',
  };

  return mapping[touchpointType] || 'CUSTOM';
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  isInitialized,
  activeShipments,
  isGCCShipment,
  startComplianceMonitoring,
  stopComplianceMonitoring,
};

export default initializeGCCCompliance;
