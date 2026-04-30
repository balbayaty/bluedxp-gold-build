/**
 * Enhanced Daleel Location Service with Billing Integration
 *
 * Wraps the existing Daleel location service with billing tracking
 * from the GCC Compliance module.
 *
 * @module daleel/daleelEnhancedService
 */

import { DaleelLocationAdapter } from '@/lib/adapters/daleel/locationAdapter';
import { daleeliBillingService } from '@/lib/services/gcc-compliance';
import { locationFusionService } from '@/lib/services/gcc-compliance';
import { eventBus, createEvent } from '@/lib/services/event-store';
import type {
  DaleelAdapterConfig,
  VehiclePlate,
  VehicleLocationDTO,
  VehicleLocationDetailsDTO,
} from '@/types/daleel';
import type { LocationSource, FusedLocation } from '@/types/gcc-compliance';

// ============================================================================
// ENHANCED DALEEL SERVICE
// ============================================================================

export class DaleelEnhancedService {
  private locationAdapter: DaleelLocationAdapter;
  private config: DaleelAdapterConfig;
  private tenantId: string;
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private trackedVehicles: Map<string, { shipmentId?: string; bayanNumber?: string }> = new Map();
  private locationHistory: Map<string, FusedLocation[]> = new Map();

  constructor(config: DaleelAdapterConfig, tenantId: string) {
    this.config = config;
    this.tenantId = tenantId;
    this.locationAdapter = new DaleelLocationAdapter(config);
  }

  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    await this.locationAdapter.authenticate();
    await this.setupEventSubscriptions();
  }

  /**
   * Setup event subscriptions
   */
  private async setupEventSubscriptions(): Promise<void> {
    // Subscribe to shipment events to start tracking
    eventBus.subscribe('tms.shipment.created', async (event) => {
      try {
        const shipment = event.payload as any;
        if (shipment.vehiclePlateNumber && shipment.bayanNumber) {
          await this.startTracking(
            shipment.vehiclePlateNumber,
            shipment.id,
            shipment.bayanNumber
          );
        }
      } catch (error) {
        console.error('[Daleel Enhanced] Failed to start tracking:', error);
      }
    });

    // Subscribe to shipment completion
    eventBus.subscribe('tms.shipment.delivered', async (event) => {
      try {
        const shipment = event.payload as any;
        if (shipment.vehiclePlateNumber) {
          await this.stopTracking(shipment.vehiclePlateNumber);
        }
      } catch (error) {
        console.error('[Daleel Enhanced] Failed to stop tracking:', error);
      }
    });
  }

  // ============================================================================
  // LOCATION METHODS WITH BILLING
  // ============================================================================

  /**
   * Get current location by sequence number (with billing)
   */
  async getLocationBySequence(
    sequenceNumber: string,
    shipmentId?: string,
    bayanNumber?: string
  ): Promise<VehicleLocationDTO | null> {
    const startTime = Date.now();

    try {
      const response = await this.locationAdapter.getLocationBySequenceNumber(sequenceNumber);

      // Log API call for billing
      await daleeliBillingService.logApiCall({
        timestamp: new Date(),
        endpoint: 'LOCATION_BY_SEQUENCE',
        requestPayload: { sequenceNumber },
        success: response.success,
        responseCode: response.success ? '200' : '500',
        responseTime: Date.now() - startTime,
        dataPointsReturned: response.data ? 1 : 0,
        shipmentId,
        bayanNumber,
        tenantId: this.tenantId,
      });

      if (response.success && response.data) {
        // Emit location event
        await eventBus.publish(
          createEvent('daleel.location.received', {
            sequenceNumber,
            location: response.data,
            shipmentId,
            bayanNumber,
          })
        );

        return response.data;
      }

      return null;
    } catch (error) {
      // Log failed call
      await daleeliBillingService.logApiCall({
        timestamp: new Date(),
        endpoint: 'LOCATION_BY_SEQUENCE',
        requestPayload: { sequenceNumber },
        success: false,
        responseCode: 'ERROR',
        responseTime: Date.now() - startTime,
        dataPointsReturned: 0,
        shipmentId,
        bayanNumber,
        tenantId: this.tenantId,
      });

      throw error;
    }
  }

  /**
   * Get current location by plate (with billing)
   */
  async getLocationByPlate(
    plate: VehiclePlate,
    shipmentId?: string,
    bayanNumber?: string
  ): Promise<VehicleLocationDetailsDTO | null> {
    const startTime = Date.now();

    try {
      const response = await this.locationAdapter.getCurrentLocationDetails(plate);

      // Log API call for billing
      await daleeliBillingService.logApiCall({
        timestamp: new Date(),
        endpoint: 'LOCATION_BY_PLATE',
        requestPayload: {
          plateNumber: plate.plateNumber,
          plateType: plate.plateType,
        },
        success: response.success,
        responseCode: response.success ? '200' : '500',
        responseTime: Date.now() - startTime,
        dataPointsReturned: response.data ? 1 : 0,
        shipmentId,
        bayanNumber,
        tenantId: this.tenantId,
      });

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      await daleeliBillingService.logApiCall({
        timestamp: new Date(),
        endpoint: 'LOCATION_BY_PLATE',
        requestPayload: {
          plateNumber: plate.plateNumber,
          plateType: plate.plateType,
        },
        success: false,
        responseCode: 'ERROR',
        responseTime: Date.now() - startTime,
        dataPointsReturned: 0,
        shipmentId,
        bayanNumber,
        tenantId: this.tenantId,
      });

      throw error;
    }
  }

  /**
   * Get trip history (with billing)
   */
  async getTripHistory(
    sequenceNumber: string,
    fromDate: Date,
    toDate: Date,
    shipmentId?: string,
    bayanNumber?: string
  ): Promise<VehicleLocationDTO[]> {
    const startTime = Date.now();

    try {
      const response = await this.locationAdapter.getLocationHistory(
        sequenceNumber,
        fromDate,
        toDate
      );

      // Log API call
      await daleeliBillingService.logApiCall({
        timestamp: new Date(),
        endpoint: 'TRIP_HISTORY',
        requestPayload: { sequenceNumber, fromDate, toDate },
        success: response.success,
        responseCode: response.success ? '200' : '500',
        responseTime: Date.now() - startTime,
        dataPointsReturned: response.data?.length || 0,
        shipmentId,
        bayanNumber,
        tenantId: this.tenantId,
      });

      return response.data || [];
    } catch (error) {
      await daleeliBillingService.logApiCall({
        timestamp: new Date(),
        endpoint: 'TRIP_HISTORY',
        requestPayload: { sequenceNumber, fromDate, toDate },
        success: false,
        responseCode: 'ERROR',
        responseTime: Date.now() - startTime,
        dataPointsReturned: 0,
        shipmentId,
        bayanNumber,
        tenantId: this.tenantId,
      });

      throw error;
    }
  }

  // ============================================================================
  // TRACKING WITH FUSION
  // ============================================================================

  /**
   * Start tracking a vehicle with billing
   */
  async startTracking(
    plateNumber: string,
    shipmentId?: string,
    bayanNumber?: string
  ): Promise<void> {
    if (this.trackedVehicles.has(plateNumber)) {
      return;
    }

    this.trackedVehicles.set(plateNumber, { shipmentId, bayanNumber });
    this.locationHistory.set(plateNumber, []);

    // Start polling
    const interval = this.config.pollingInterval || 30000;
    const pollingId = setInterval(async () => {
      await this.pollLocation(plateNumber);
    }, interval);

    this.pollingIntervals.set(plateNumber, pollingId);

    // Emit tracking started event
    await eventBus.publish(
      createEvent('daleel.tracking.started', {
        plateNumber,
        shipmentId,
        bayanNumber,
        tenantId: this.tenantId,
      })
    );
  }

  /**
   * Stop tracking a vehicle
   */
  async stopTracking(plateNumber: string): Promise<void> {
    const pollingId = this.pollingIntervals.get(plateNumber);
    if (pollingId) {
      clearInterval(pollingId);
      this.pollingIntervals.delete(plateNumber);
    }

    const trackingInfo = this.trackedVehicles.get(plateNumber);
    this.trackedVehicles.delete(plateNumber);
    this.locationHistory.delete(plateNumber);

    await eventBus.publish(
      createEvent('daleel.tracking.stopped', {
        plateNumber,
        shipmentId: trackingInfo?.shipmentId,
        bayanNumber: trackingInfo?.bayanNumber,
      })
    );
  }

  /**
   * Poll location and fuse with other sources
   */
  private async pollLocation(plateNumber: string): Promise<void> {
    const trackingInfo = this.trackedVehicles.get(plateNumber);
    if (!trackingInfo) return;

    try {
      // Get Daleel location
      const daleelLocation = await this.getLocationByPlate(
        { plateNumber },
        trackingInfo.shipmentId,
        trackingInfo.bayanNumber
      );

      if (!daleelLocation) return;

      // Create location source for fusion
      const daleelSource: LocationSource = {
        source: 'DALEEL',
        coordinates: {
          lat: daleelLocation.latitude,
          lng: daleelLocation.longitude,
        },
        accuracy: 10, // Daleel is typically very accurate
        timestamp: new Date(daleelLocation.locationTime),
        trustLevel: 0.95,
        rawData: {
          sequenceNumber: daleelLocation.sequenceNumber,
          vehicleStatus: daleelLocation.vehicleStatus,
          velocity: daleelLocation.velocity,
          weight: daleelLocation.weight,
        },
      };

      // Get location history for this vehicle
      const history = this.locationHistory.get(plateNumber) || [];

      // Fuse location (even with single source, this adds metadata)
      const fusedLocation = await locationFusionService.fuseLocations(
        trackingInfo.shipmentId || plateNumber,
        [daleelSource]
      );

      // Check for anomalies against history
      if (history.length > 0) {
        const anomalyCheck = await locationFusionService.detectAnomaly(
          fusedLocation,
          history.slice(0, 10) // Last 10 locations
        );

        if (anomalyCheck.isAnomaly) {
          await eventBus.publish(
            createEvent('daleel.anomaly.detected', {
              plateNumber,
              shipmentId: trackingInfo.shipmentId,
              bayanNumber: trackingInfo.bayanNumber,
              anomaly: anomalyCheck,
              location: fusedLocation,
            })
          );
        }
      }

      // Store in history
      history.unshift(fusedLocation);
      if (history.length > 100) {
        history.pop(); // Keep last 100 locations
      }
      this.locationHistory.set(plateNumber, history);

      // Emit location update
      await eventBus.publish(
        createEvent('daleel.location.updated', {
          plateNumber,
          shipmentId: trackingInfo.shipmentId,
          bayanNumber: trackingInfo.bayanNumber,
          location: fusedLocation,
        })
      );
    } catch (error) {
      console.error(`[Daleel Enhanced] Poll failed for ${plateNumber}:`, error);
    }
  }

  /**
   * Get fused location for a shipment (combines Daleel + other sources)
   */
  async getFusedLocation(
    shipmentId: string,
    additionalSources: LocationSource[] = []
  ): Promise<FusedLocation | null> {
    // Find tracked vehicle for this shipment
    let plateNumber: string | null = null;
    for (const [plate, info] of this.trackedVehicles) {
      if (info.shipmentId === shipmentId) {
        plateNumber = plate;
        break;
      }
    }

    if (!plateNumber) {
      // No Daleel tracking, fuse only additional sources
      if (additionalSources.length > 0) {
        return locationFusionService.fuseLocations(shipmentId, additionalSources);
      }
      return null;
    }

    // Get latest Daleel location
    const trackingInfo = this.trackedVehicles.get(plateNumber);
    const daleelLocation = await this.getLocationByPlate(
      { plateNumber },
      shipmentId,
      trackingInfo?.bayanNumber
    );

    const sources: LocationSource[] = [...additionalSources];

    if (daleelLocation) {
      sources.push({
        source: 'DALEEL',
        coordinates: {
          lat: daleelLocation.latitude,
          lng: daleelLocation.longitude,
        },
        accuracy: 10,
        timestamp: new Date(daleelLocation.locationTime),
        trustLevel: 0.95,
        rawData: {
          sequenceNumber: daleelLocation.sequenceNumber,
          vehicleStatus: daleelLocation.vehicleStatus,
          velocity: daleelLocation.velocity,
          weight: daleelLocation.weight,
        },
      });
    }

    if (sources.length === 0) {
      return null;
    }

    return locationFusionService.fuseLocations(shipmentId, sources);
  }

  /**
   * Get billing summary for tenant
   */
  async getBillingSummary(year: number, month: number) {
    return daleeliBillingService.getMonthlyReconciliation(this.tenantId, year, month);
  }

  /**
   * Get current billing period usage
   */
  async getCurrentUsage() {
    return daleeliBillingService.getCurrentPeriodUsage(this.tenantId);
  }
}

// Factory function to create service instance
export function createDaleelEnhancedService(
  config: DaleelAdapterConfig,
  tenantId: string
): DaleelEnhancedService {
  return new DaleelEnhancedService(config, tenantId);
}
