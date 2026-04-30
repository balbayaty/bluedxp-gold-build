/**
 * Transportation Module Integration
 *
 * Integrates GCC Compliance services with the Transportation module.
 * Provides hooks for automatic validation, tracking, and compliance monitoring.
 *
 * @module gcc-compliance/integrations/transportationIntegration
 */

import { eventBus, createEvent } from '@/lib/services/event-store';
import { validationOrchestrator } from '../validationOrchestrator';
import { touchpointGenerator } from '../touchpointGenerator';
import { backloadValidator } from '../backloadValidator';
import { regulationDatabase } from '../regulationDatabase';
import { daleeliBillingService } from '../daleeliBillingService';
import { bayanQRService } from '../bayanQrEmbedder';
import { textLocateService } from '../textLocateService';
import { locationFusionService } from '../locationFusionService';
import { industryStandardsService } from '../standards/industryStandards';
import type {
  PreDispatchValidationRequest,
  PreDispatchValidationResult,
  DynamicTouchpointRequest,
  DynamicTouchpointResult,
  GCCCountry,
  EquipmentType,
  CargoType,
} from '@/types/gcc-compliance';

// ============================================================================
// TYPES
// ============================================================================

export interface TransportShipment {
  id: string;
  tenantId: string;
  status: 'DRAFT' | 'BOOKED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  
  // Origin/Destination
  origin: {
    facilityId: string;
    facilityType: string;
    city: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  destination: {
    facilityId: string;
    facilityType: string;
    city: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  
  // Carrier & Equipment
  carrier: {
    id: string;
    name: string;
    nationality: string;
    crNumber: string;
    waslRegistered: boolean;
  };
  equipment: {
    type: EquipmentType;
    plateNumber: string;
    plateType: string;
    sequenceNumber?: string;
  };
  driver: {
    id: string;
    name: string;
    phone: string;
    licenseNumber: string;
    licenseExpiry: Date;
  };
  
  // Cargo
  cargo: {
    type: CargoType;
    description: string;
    weight: number;
    dimensions: { length: number; width: number; height: number };
    value: number;
    hazmat?: { class: string; unNumber: string };
    temperatureRequired?: { min: number; max: number };
  };
  
  // Documents
  bayanNumber?: string;
  customsManifest?: string;
  permits: string[];
  
  // Timing
  plannedDeparture: Date;
  plannedArrival: Date;
  actualDeparture?: Date;
  actualArrival?: Date;
  
  // Compliance
  complianceStatus?: 'PENDING' | 'VALIDATED' | 'COMPLIANT' | 'NON_COMPLIANT';
  validationResult?: PreDispatchValidationResult;
  touchpoints?: DynamicTouchpointResult;
}

export interface IntegrationHooks {
  onShipmentCreated: (shipment: TransportShipment) => Promise<void>;
  onShipmentDispatched: (shipment: TransportShipment) => Promise<void>;
  onLocationUpdate: (shipmentId: string, location: any) => Promise<void>;
  onTouchpointReached: (shipmentId: string, touchpointId: string) => Promise<void>;
  onAnomalyDetected: (shipmentId: string, anomaly: any) => Promise<void>;
  onShipmentDelivered: (shipment: TransportShipment) => Promise<void>;
}

// ============================================================================
// INTEGRATION POINTS
// ============================================================================

/**
 * Map of integration points in the transportation module
 */
export const INTEGRATION_POINTS = {
  // Shipment lifecycle
  SHIPMENT_CREATE: {
    location: 'lib/services/transportation/shipmentService.ts',
    method: 'createShipment',
    hook: 'onShipmentCreated',
    description: 'Auto-validate compliance when shipment is created',
  },
  SHIPMENT_DISPATCH: {
    location: 'lib/services/transportation/shipmentService.ts',
    method: 'dispatchShipment',
    hook: 'onShipmentDispatched',
    description: 'Generate touchpoints and start tracking when dispatched',
  },
  SHIPMENT_DELIVER: {
    location: 'lib/services/transportation/shipmentService.ts',
    method: 'deliverShipment',
    hook: 'onShipmentDelivered',
    description: 'Stop tracking and generate compliance report',
  },
  
  // Tracking
  LOCATION_UPDATE: {
    location: 'lib/services/daleel/daleelLocationService.ts',
    method: 'handleLocationUpdate',
    hook: 'onLocationUpdate',
    description: 'Fuse location data and check geofences',
  },
  GEOFENCE_ENTER: {
    location: 'lib/services/geofence/geofenceService.ts',
    method: 'checkGeofence',
    hook: 'onTouchpointReached',
    description: 'Record touchpoint arrival and dwell time',
  },
  
  // Anomaly detection
  ROUTE_DEVIATION: {
    location: 'lib/services/transportation/routeComparisonService.ts',
    method: 'compareRoute',
    hook: 'onAnomalyDetected',
    description: 'Detect deviations from planned route',
  },
  
  // Carrier management
  CARRIER_VALIDATION: {
    location: 'lib/services/carriers/carrierService.ts',
    method: 'validateCarrier',
    hook: 'validateCarrierCompliance',
    description: 'Validate carrier eligibility including backload rules',
  },
  
  // Bayan/E-Waybill
  BAYAN_CREATE: {
    location: 'lib/services/bayan/bayanService.ts',
    method: 'createBayan',
    hook: 'onBayanCreated',
    description: 'Link Bayan to shipment and generate QR code',
  },
  EWAYBILL_GENERATE: {
    location: 'lib/services/etw/etwService.ts',
    method: 'generateEwaybill',
    hook: 'embedBayanQR',
    description: 'Embed Bayan data in E-Waybill QR code',
  },
  
  // Driver communication
  DRIVER_LOCATION_REQUEST: {
    location: 'lib/services/driver/driverCommunicationService.ts',
    method: 'requestLocation',
    hook: 'sendTextLocateRequest',
    description: 'Send WhatsApp/Telegram location request',
  },
};

// ============================================================================
// TRANSPORTATION INTEGRATION SERVICE
// ============================================================================

class TransportationIntegrationService {
  private activeShipments: Map<string, TransportShipment> = new Map();
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Initialize transportation integration
   */
  async initialize(): Promise<void> {
    console.log('[GCC Transport Integration] Initializing...');
    await this.setupEventSubscriptions();
    console.log('[GCC Transport Integration] Ready');
  }

  /**
   * Setup event subscriptions
   */
  private async setupEventSubscriptions(): Promise<void> {
    // Subscribe to shipment lifecycle events
    eventBus.subscribe('tms.shipment.created', this.handleShipmentCreated.bind(this));
    eventBus.subscribe('tms.shipment.dispatched', this.handleShipmentDispatched.bind(this));
    eventBus.subscribe('tms.shipment.delivered', this.handleShipmentDelivered.bind(this));
    eventBus.subscribe('tms.shipment.cancelled', this.handleShipmentCancelled.bind(this));

    // Subscribe to location events
    eventBus.subscribe('daleel.location.updated', this.handleLocationUpdate.bind(this));
    eventBus.subscribe('geofence.entered', this.handleGeofenceEntered.bind(this));

    // Subscribe to anomaly events
    eventBus.subscribe('daleel.anomaly.detected', this.handleAnomalyDetected.bind(this));

    // Subscribe to Bayan events
    eventBus.subscribe('bayan.created', this.handleBayanCreated.bind(this));
  }

  // ============================================================================
  // SHIPMENT LIFECYCLE HANDLERS
  // ============================================================================

  /**
   * Handle shipment created - auto-validate compliance
   */
  private async handleShipmentCreated(event: any): Promise<void> {
    try {
      const shipment = event.payload as TransportShipment;
      console.log(`[GCC Integration] Validating shipment: ${shipment.id}`);

      // Build validation request
      const validationRequest = this.buildValidationRequest(shipment);
      
      // Run pre-dispatch validation
      const result = await validationOrchestrator.validate(validationRequest);

      // Store shipment with validation result
      shipment.complianceStatus = result.canProceed ? 'VALIDATED' : 'NON_COMPLIANT';
      shipment.validationResult = result;
      this.activeShipments.set(shipment.id, shipment);

      // Publish validation result
      await eventBus.publish(
        createEvent('gcc.shipment.validated', {
          shipmentId: shipment.id,
          canProceed: result.canProceed,
          overallRisk: result.overallRisk,
          steps: result.steps,
          recommendations: result.recommendations,
        })
      );

      // If validation failed, notify
      if (!result.canProceed) {
        await eventBus.publish(
          createEvent('gcc.compliance.alert', {
            shipmentId: shipment.id,
            severity: 'HIGH',
            type: 'VALIDATION_FAILED',
            message: `Pre-dispatch validation failed: ${result.steps.filter(s => s.status === 'FAILED').map(s => s.stepName).join(', ')}`,
            recommendations: result.recommendations,
          })
        );
      }

      // Check industry standards compliance
      const standardsResult = await industryStandardsService.checkCompliance({
        shipmentId: shipment.id,
        cargoType: shipment.cargo.type,
        sector: this.mapCargoTypeToSector(shipment.cargo.type),
        documents: shipment.permits.map(p => ({ type: p, valid: true })),
        certifications: [],
        equipment: {
          type: shipment.equipment.type,
          hasTemperatureLogger: shipment.cargo.temperatureRequired !== undefined,
          hasGPS: true,
        },
      });

      await eventBus.publish(
        createEvent('gcc.standards.checked', {
          shipmentId: shipment.id,
          complianceScore: standardsResult.complianceScore,
          isCompliant: standardsResult.isCompliant,
          standards: standardsResult.standardsChecked,
        })
      );

    } catch (error) {
      console.error('[GCC Integration] Validation error:', error);
    }
  }

  /**
   * Handle shipment dispatched - generate touchpoints and start tracking
   */
  private async handleShipmentDispatched(event: any): Promise<void> {
    try {
      const shipment = event.payload as TransportShipment;
      console.log(`[GCC Integration] Dispatching shipment: ${shipment.id}`);

      // Generate touchpoints
      const touchpointRequest = this.buildTouchpointRequest(shipment);
      const touchpoints = await touchpointGenerator.generateTouchpoints(touchpointRequest);

      // Store touchpoints
      const storedShipment = this.activeShipments.get(shipment.id);
      if (storedShipment) {
        storedShipment.touchpoints = touchpoints;
        storedShipment.complianceStatus = 'COMPLIANT';
        this.activeShipments.set(shipment.id, storedShipment);
      }

      // Publish touchpoints
      await eventBus.publish(
        createEvent('gcc.touchpoints.generated', {
          shipmentId: shipment.id,
          touchpoints: touchpoints.touchpoints,
          estimatedDuration: touchpoints.estimatedDuration,
        })
      );

      // Generate Bayan QR if Bayan number exists
      if (shipment.bayanNumber) {
        const qrResult = await bayanQRService.generateBayanEtwQR({
          bayanNumber: shipment.bayanNumber,
          shipmentId: shipment.id,
          carrier: {
            name: shipment.carrier.name,
            crNumber: shipment.carrier.crNumber,
            nationality: shipment.carrier.nationality as GCCCountry,
          },
          vehicle: {
            plateNumber: shipment.equipment.plateNumber,
            plateType: shipment.equipment.plateType,
          },
          driver: {
            name: shipment.driver.name,
            licenseNumber: shipment.driver.licenseNumber,
          },
          origin: {
            city: shipment.origin.city,
            country: shipment.origin.country as GCCCountry,
          },
          destination: {
            city: shipment.destination.city,
            country: shipment.destination.country as GCCCountry,
          },
          cargo: {
            type: shipment.cargo.type,
            weight: shipment.cargo.weight,
            description: shipment.cargo.description,
          },
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        await eventBus.publish(
          createEvent('gcc.qr.generated', {
            shipmentId: shipment.id,
            bayanNumber: shipment.bayanNumber,
            qrCode: qrResult.qrCodeBase64,
            verificationUrl: qrResult.verificationUrl,
          })
        );
      }

      // Start monitoring
      await this.startComplianceMonitoring(shipment.id);

      // Send driver initial instructions via WhatsApp
      if (shipment.driver.phone) {
        await textLocateService.sendLocationRequest({
          shipmentId: shipment.id,
          driverPhone: shipment.driver.phone,
          driverName: shipment.driver.name,
          channel: 'WHATSAPP',
          urgency: 'NORMAL',
          customMessage: `Your trip ${shipment.id} has been dispatched. Please share your location to begin tracking.`,
        });
      }

    } catch (error) {
      console.error('[GCC Integration] Dispatch error:', error);
    }
  }

  /**
   * Handle shipment delivered - stop tracking and generate report
   */
  private async handleShipmentDelivered(event: any): Promise<void> {
    try {
      const shipment = event.payload as TransportShipment;
      console.log(`[GCC Integration] Completing shipment: ${shipment.id}`);

      // Stop monitoring
      await this.stopComplianceMonitoring(shipment.id);

      // Generate compliance summary
      const storedShipment = this.activeShipments.get(shipment.id);
      if (storedShipment) {
        await eventBus.publish(
          createEvent('gcc.shipment.completed', {
            shipmentId: shipment.id,
            complianceStatus: storedShipment.complianceStatus,
            validationResult: storedShipment.validationResult,
            touchpointsCompleted: storedShipment.touchpoints?.touchpoints.length || 0,
          })
        );

        // Clean up
        this.activeShipments.delete(shipment.id);
      }

    } catch (error) {
      console.error('[GCC Integration] Delivery error:', error);
    }
  }

  /**
   * Handle shipment cancelled
   */
  private async handleShipmentCancelled(event: any): Promise<void> {
    const shipmentId = event.payload?.id;
    if (shipmentId) {
      await this.stopComplianceMonitoring(shipmentId);
      this.activeShipments.delete(shipmentId);
    }
  }

  // ============================================================================
  // LOCATION & TRACKING HANDLERS
  // ============================================================================

  /**
   * Handle location update
   */
  private async handleLocationUpdate(event: any): Promise<void> {
    try {
      const { shipmentId, location, plateNumber } = event.payload;
      
      const shipment = this.activeShipments.get(shipmentId);
      if (!shipment) return;

      // Check truck ban at current location
      // (Would need reverse geocoding to get city name)
      
      // Check touchpoint proximity
      if (shipment.touchpoints) {
        for (const touchpoint of shipment.touchpoints.touchpoints) {
          const distance = this.calculateDistance(
            location.coordinates,
            touchpoint.coordinates
          );
          
          // Within 500m of touchpoint
          if (distance < 0.5 && touchpoint.status === 'PENDING') {
            await eventBus.publish(
              createEvent('gcc.touchpoint.approaching', {
                shipmentId,
                touchpointId: touchpoint.id,
                touchpointType: touchpoint.code,
                distance,
              })
            );
          }
        }
      }

    } catch (error) {
      console.error('[GCC Integration] Location update error:', error);
    }
  }

  /**
   * Handle geofence entered
   */
  private async handleGeofenceEntered(event: any): Promise<void> {
    const { shipmentId, geofenceId, geofenceType, entryTime } = event.payload;
    
    await eventBus.publish(
      createEvent('gcc.touchpoint.reached', {
        shipmentId,
        geofenceId,
        type: geofenceType,
        timestamp: entryTime,
      })
    );
  }

  /**
   * Handle anomaly detected
   */
  private async handleAnomalyDetected(event: any): Promise<void> {
    const { shipmentId, anomaly, location } = event.payload;

    await eventBus.publish(
      createEvent('gcc.compliance.alert', {
        shipmentId,
        severity: anomaly.severity || 'MEDIUM',
        type: 'ANOMALY_DETECTED',
        message: anomaly.message || 'Anomaly detected in tracking data',
        location,
        timestamp: new Date(),
      })
    );
  }

  /**
   * Handle Bayan created
   */
  private async handleBayanCreated(event: any): Promise<void> {
    const { shipmentId, bayanNumber } = event.payload;
    
    const shipment = this.activeShipments.get(shipmentId);
    if (shipment) {
      shipment.bayanNumber = bayanNumber;
      this.activeShipments.set(shipmentId, shipment);
    }
  }

  // ============================================================================
  // MONITORING
  // ============================================================================

  /**
   * Start compliance monitoring for a shipment
   */
  private async startComplianceMonitoring(shipmentId: string): Promise<void> {
    if (this.monitoringIntervals.has(shipmentId)) {
      return;
    }

    const intervalId = setInterval(async () => {
      await this.performComplianceCheck(shipmentId);
    }, 5 * 60 * 1000); // Every 5 minutes

    this.monitoringIntervals.set(shipmentId, intervalId);
  }

  /**
   * Stop compliance monitoring
   */
  private async stopComplianceMonitoring(shipmentId: string): Promise<void> {
    const intervalId = this.monitoringIntervals.get(shipmentId);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(shipmentId);
    }
  }

  /**
   * Perform periodic compliance check
   */
  private async performComplianceCheck(shipmentId: string): Promise<void> {
    const shipment = this.activeShipments.get(shipmentId);
    if (!shipment) return;

    // Check if entering truck ban zone
    // Check driver working hours
    // Check vehicle status
    // etc.
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  /**
   * Validate a shipment for dispatch
   */
  async validateForDispatch(shipment: TransportShipment): Promise<PreDispatchValidationResult> {
    const request = this.buildValidationRequest(shipment);
    return validationOrchestrator.validate(request);
  }

  /**
   * Check backload eligibility for foreign carrier
   */
  async checkBackloadEligibility(
    carrierId: string,
    carrierNationality: GCCCountry | 'OTHER',
    originalTrip: any,
    proposedBackload: any
  ) {
    return backloadValidator.validateBackload({
      carrierId,
      carrierNationality,
      plateNumber: '',
      plateType: '1',
      originalTrip,
      proposedBackload,
    });
  }

  /**
   * Request driver location via WhatsApp/Telegram
   */
  async requestDriverLocation(shipment: TransportShipment, urgency: 'LOW' | 'NORMAL' | 'HIGH' = 'NORMAL') {
    return textLocateService.sendLocationRequest({
      shipmentId: shipment.id,
      driverPhone: shipment.driver.phone,
      driverName: shipment.driver.name,
      channel: 'WHATSAPP',
      urgency,
    });
  }

  /**
   * Get fused location for shipment
   */
  async getFusedLocation(shipmentId: string, additionalSources: any[] = []) {
    return locationFusionService.fuseLocations(shipmentId, additionalSources);
  }

  /**
   * Get billing summary for tenant
   */
  async getDaleeliBillingSummary(tenantId: string, year: number, month: number) {
    return daleeliBillingService.getMonthlyReconciliation(tenantId, year, month);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private buildValidationRequest(shipment: TransportShipment): PreDispatchValidationRequest {
    return {
      shipmentId: shipment.id,
      tenantId: shipment.tenantId,
      carrier: {
        id: shipment.carrier.id,
        name: shipment.carrier.name,
        nationality: shipment.carrier.nationality as GCCCountry,
        crNumber: shipment.carrier.crNumber,
        waslRegistered: shipment.carrier.waslRegistered,
        insuranceValid: true,
        licensedRoutes: ['ALL'],
      },
      equipment: {
        type: shipment.equipment.type,
        plateNumber: shipment.equipment.plateNumber,
        plateType: shipment.equipment.plateType,
        sequenceNumber: shipment.equipment.sequenceNumber,
      },
      cargo: {
        type: shipment.cargo.type,
        weight: shipment.cargo.weight,
        dimensions: shipment.cargo.dimensions,
        value: shipment.cargo.value,
        hazmatClass: shipment.cargo.hazmat?.class,
        hazmatUnNumber: shipment.cargo.hazmat?.unNumber,
      },
      route: {
        origin: {
          facilityId: shipment.origin.facilityId,
          city: shipment.origin.city,
          country: shipment.origin.country as GCCCountry,
          coordinates: shipment.origin.coordinates,
          facilityType: shipment.origin.facilityType as any,
        },
        destination: {
          facilityId: shipment.destination.facilityId,
          city: shipment.destination.city,
          country: shipment.destination.country as GCCCountry,
          coordinates: shipment.destination.coordinates,
          facilityType: shipment.destination.facilityType as any,
        },
        plannedDeparture: shipment.plannedDeparture,
        plannedArrival: shipment.plannedArrival,
        intermediateFacilities: [],
      },
      documents: {
        bayanEtd: shipment.bayanNumber ? {
          number: shipment.bayanNumber,
          valid: true,
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
        } : undefined,
        permits: shipment.permits,
      },
    };
  }

  private buildTouchpointRequest(shipment: TransportShipment): DynamicTouchpointRequest {
    return {
      shipmentId: shipment.id,
      origin: {
        city: shipment.origin.city,
        country: shipment.origin.country as GCCCountry,
        facilityId: shipment.origin.facilityId,
        facilityType: shipment.origin.facilityType as any,
        coordinates: shipment.origin.coordinates,
      },
      destination: {
        city: shipment.destination.city,
        country: shipment.destination.country as GCCCountry,
        facilityId: shipment.destination.facilityId,
        facilityType: shipment.destination.facilityType as any,
        coordinates: shipment.destination.coordinates,
      },
      equipmentType: shipment.equipment.type,
      carrierNationality: shipment.carrier.nationality as GCCCountry,
      cargoType: shipment.cargo.type,
      requiresCrossDock: false,
      plannedDeparture: shipment.plannedDeparture,
    };
  }

  private mapCargoTypeToSector(cargoType: CargoType): any {
    const mapping: Record<CargoType, string> = {
      GENERAL: 'ALL',
      HAZMAT: 'HAZMAT',
      REEFER: 'FOOD_BEVERAGE',
      PHARMACEUTICAL: 'PHARMACEUTICALS',
      LIVESTOCK: 'ALL',
      OVERSIZED: 'CONSTRUCTION',
      BULK: 'ALL',
      CONTAINER: 'ALL',
    };
    return mapping[cargoType] || 'ALL';
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371;
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// Export singleton
export const transportationIntegration = new TransportationIntegrationService();
export default transportationIntegration;
