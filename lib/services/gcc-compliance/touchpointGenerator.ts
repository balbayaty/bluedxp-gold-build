/**
 * Dynamic Touchpoint Generator
 *
 * Generates touchpoints automatically based on:
 * - Origin/destination countries
 * - Equipment type
 * - Cargo type
 * - Carrier nationality
 * - Cross-border requirements
 *
 * @module gcc-compliance/touchpointGenerator
 */

import type {
  GCCCountry,
  EquipmentType,
  CargoType,
  TouchpointCode,
  DynamicTouchpointRequest,
  DynamicTouchpointResult,
  GeneratedTouchpoint,
} from '@/types/gcc-compliance';
import { regulationDatabase, GCC_BORDER_CROSSINGS } from './regulationDatabase';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TOUCHPOINT TEMPLATES
// ============================================================================

const TOUCHPOINT_TEMPLATES: Record<
  TouchpointCode,
  {
    name: string;
    nameAr: string;
    description: string;
    defaultDwellTime: number;
    requiredActions: string[];
    requiredDocuments: string[];
    geofenceConfig: GeneratedTouchpoint['geofenceConfig'];
  }
> = {
  POL: {
    name: 'Port of Loading',
    nameAr: 'نقطة التحميل',
    description: 'Cargo pickup and verification',
    defaultDwellTime: 60,
    requiredActions: ['Load Confirmation', 'Weight Check', 'Seal Number'],
    requiredDocuments: ['Bayan ETD', 'Cargo Manifest'],
    geofenceConfig: { radius: 500, entryTrigger: true, exitTrigger: true, dwellAlert: true, dwellThreshold: 120 },
  },
  BPC_EXIT: {
    name: 'Border Exit',
    nameAr: 'نقطة الخروج الحدودية',
    description: 'Exiting country - customs clearance',
    defaultDwellTime: 120,
    requiredActions: ['Customs Declaration', 'Document Check', 'Exit Stamp'],
    requiredDocuments: ['Bayan ETD', 'Customs Manifest', 'Exit Permit'],
    geofenceConfig: { radius: 1000, entryTrigger: true, exitTrigger: true, dwellAlert: true, dwellThreshold: 180 },
  },
  BPC_ENTRY: {
    name: 'Border Entry',
    nameAr: 'نقطة الدخول الحدودية',
    description: 'Entering destination country',
    defaultDwellTime: 180,
    requiredActions: ['Customs Inspection', 'ETD Verification', 'Entry Stamp'],
    requiredDocuments: ['Customs Manifest', 'Import Declaration'],
    geofenceConfig: { radius: 1000, entryTrigger: true, exitTrigger: true, dwellAlert: true, dwellThreshold: 240 },
  },
  INSP: {
    name: 'Inspection Point',
    nameAr: 'نقطة التفتيش',
    description: 'Cargo inspection if flagged',
    defaultDwellTime: 90,
    requiredActions: ['Physical Inspection', 'Documentation'],
    requiredDocuments: ['Inspection Report'],
    geofenceConfig: { radius: 500, entryTrigger: true, exitTrigger: true, dwellAlert: true, dwellThreshold: 120 },
  },
  XDK: {
    name: 'Cross-dock Facility',
    nameAr: 'مرفق العبور',
    description: 'Equipment swap and cargo transfer',
    defaultDwellTime: 180,
    requiredActions: ['Unload', 'Sort', 'Reload', 'New Seal'],
    requiredDocuments: ['Transfer Manifest', 'New Seal Number'],
    geofenceConfig: { radius: 500, entryTrigger: true, exitTrigger: true, dwellAlert: true, dwellThreshold: 240 },
  },
  HOLD: {
    name: 'Truck Ban Hold Area',
    nameAr: 'منطقة الانتظار',
    description: 'Waiting area for truck ban restrictions',
    defaultDwellTime: 240,
    requiredActions: ['Park', 'Wait for Entry Window'],
    requiredDocuments: [],
    geofenceConfig: { radius: 1000, entryTrigger: true, exitTrigger: true, dwellAlert: false, dwellThreshold: 480 },
  },
  POD: {
    name: 'Port of Discharge',
    nameAr: 'نقطة التفريغ',
    description: 'Final delivery point',
    defaultDwellTime: 60,
    requiredActions: ['Delivery Confirmation', 'POD Photo', 'Signature', 'Seal Check'],
    requiredDocuments: ['Proof of Delivery', 'Receipt'],
    geofenceConfig: { radius: 500, entryTrigger: true, exitTrigger: true, dwellAlert: true, dwellThreshold: 120 },
  },
  SFDA: {
    name: 'SFDA Checkpoint',
    nameAr: 'نقطة الهيئة العامة للغذاء والدواء',
    description: 'Food and Drug Authority inspection',
    defaultDwellTime: 60,
    requiredActions: ['SFDA Inspection', 'Temperature Check', 'Documentation'],
    requiredDocuments: ['SFDA Permit', 'Health Certificate'],
    geofenceConfig: { radius: 300, entryTrigger: true, exitTrigger: true, dwellAlert: true, dwellThreshold: 90 },
  },
  HAZ: {
    name: 'HAZMAT Checkpoint',
    nameAr: 'نقطة المواد الخطرة',
    description: 'Hazardous materials inspection',
    defaultDwellTime: 90,
    requiredActions: ['HAZMAT Inspection', 'Safety Check', 'Documentation'],
    requiredDocuments: ['HAZMAT Permit', 'ADR Certificate', 'MSDS'],
    geofenceConfig: { radius: 500, entryTrigger: true, exitTrigger: true, dwellAlert: true, dwellThreshold: 120 },
  },
  CUST: {
    name: 'Customs Clearance',
    nameAr: 'التخليص الجمركي',
    description: 'Customs processing',
    defaultDwellTime: 120,
    requiredActions: ['Customs Declaration', 'Duty Payment', 'Release'],
    requiredDocuments: ['Customs Declaration', 'Commercial Invoice'],
    geofenceConfig: { radius: 500, entryTrigger: true, exitTrigger: true, dwellAlert: true, dwellThreshold: 180 },
  },
  WEIGH: {
    name: 'Weighbridge',
    nameAr: 'الميزان',
    description: 'Weight verification',
    defaultDwellTime: 15,
    requiredActions: ['Weight Verification'],
    requiredDocuments: ['Weight Ticket'],
    geofenceConfig: { radius: 200, entryTrigger: true, exitTrigger: true, dwellAlert: false, dwellThreshold: 30 },
  },
  REST: {
    name: 'Rest Stop',
    nameAr: 'محطة استراحة',
    description: 'Driver rest break',
    defaultDwellTime: 30,
    requiredActions: ['Rest Break'],
    requiredDocuments: [],
    geofenceConfig: { radius: 500, entryTrigger: false, exitTrigger: false, dwellAlert: false, dwellThreshold: 60 },
  },
};

// ============================================================================
// TOUCHPOINT GENERATOR SERVICE
// ============================================================================

export class DynamicTouchpointGenerator {
  /**
   * Generate touchpoints for a shipment
   */
  async generateTouchpoints(request: DynamicTouchpointRequest): Promise<DynamicTouchpointResult> {
    const touchpoints: GeneratedTouchpoint[] = [];
    const warnings: string[] = [];
    let sequence = 1;

    // Check if cross-border
    const isCrossBorder = request.origin.country !== request.destination.country;

    // 1. POL - Always first
    touchpoints.push(
      this.createTouchpoint('POL', {
        sequence: sequence++,
        location: {
          city: request.origin.city,
          country: request.origin.country,
          coordinates: request.origin.coordinates,
        },
        estimatedArrival: request.plannedDeparture,
        cargoType: request.cargoType,
      })
    );

    // 2. Add SFDA checkpoint for perishables
    if (request.cargoType === 'PERISHABLE' && request.origin.country === 'SA') {
      touchpoints.push(
        this.createTouchpoint('SFDA', {
          sequence: sequence++,
          location: {
            city: request.origin.city,
            country: request.origin.country,
            coordinates: request.origin.coordinates,
          },
          estimatedArrival: new Date(request.plannedDeparture.getTime() + 60 * 60 * 1000),
          cargoType: request.cargoType,
        })
      );
    }

    // 3. Add HAZMAT checkpoint for hazardous cargo
    if (request.cargoType === 'HAZMAT') {
      touchpoints.push(
        this.createTouchpoint('HAZ', {
          sequence: sequence++,
          location: {
            city: request.origin.city,
            country: request.origin.country,
            coordinates: request.origin.coordinates,
          },
          estimatedArrival: new Date(request.plannedDeparture.getTime() + 90 * 60 * 1000),
          cargoType: request.cargoType,
        })
      );
    }

    // 4. Cross-border touchpoints
    if (isCrossBorder) {
      const border = this.findBorderCrossing(request.origin.country, request.destination.country);

      if (border) {
        // Border exit
        const exitTime = this.estimateArrivalTime(
          request.origin.coordinates,
          border.coordinates,
          request.plannedDeparture
        );

        touchpoints.push(
          this.createTouchpoint('BPC_EXIT', {
            sequence: sequence++,
            location: {
              city: border.name.split('/')[0].trim(),
              country: request.origin.country,
              coordinates: border.coordinates,
              geofenceId: border.geofenceId,
            },
            estimatedArrival: exitTime,
            cargoType: request.cargoType,
          })
        );

        // Border entry
        const entryTime = new Date(exitTime.getTime() + 30 * 60 * 1000);
        touchpoints.push(
          this.createTouchpoint('BPC_ENTRY', {
            sequence: sequence++,
            location: {
              city: border.name.split('/')[1]?.trim() || border.name,
              country: request.destination.country,
              coordinates: border.coordinates,
              geofenceId: border.geofenceId,
            },
            estimatedArrival: entryTime,
            cargoType: request.cargoType,
            additionalActions:
              request.destination.country === 'KW'
                ? ['AED 360 Deposit']
                : undefined,
          })
        );

        // Inspection point (conditional)
        const inspTime = new Date(entryTime.getTime() + 60 * 60 * 1000);
        touchpoints.push(
          this.createTouchpoint('INSP', {
            sequence: sequence++,
            location: {
              city: border.name.split('/')[1]?.trim() || border.name,
              country: request.destination.country,
              coordinates: border.coordinates,
            },
            estimatedArrival: inspTime,
            cargoType: request.cargoType,
          })
        );
      } else {
        warnings.push('Border crossing information not available');
      }
    }

    // 5. Cross-dock if required
    if (request.requiresCrossDock) {
      const xdkTime = this.estimateMidpointTime(request.plannedDeparture, touchpoints);
      touchpoints.push(
        this.createTouchpoint('XDK', {
          sequence: sequence++,
          location: {
            city: 'Cross-dock Facility',
            country: request.destination.country,
            coordinates: this.getMidpoint(request.origin.coordinates, request.destination.coordinates),
          },
          estimatedArrival: xdkTime,
          cargoType: request.cargoType,
        })
      );
    }

    // 6. Check truck ban and add hold area if needed
    const destBan = regulationDatabase.checkTruckBan({
      city: request.destination.city,
      country: request.destination.country,
      plannedArrival: this.getLastTouchpointTime(touchpoints),
      vehicleType: request.equipmentType,
    });

    if (destBan.currentlyBanned && destBan.waitTimeHours && destBan.waitTimeHours > 0) {
      touchpoints.push(
        this.createTouchpoint('HOLD', {
          sequence: sequence++,
          location: {
            city: `${request.destination.city} Hold Area`,
            country: request.destination.country,
            coordinates: this.getHoldAreaCoordinates(request.destination.coordinates),
            geofenceId: destBan.holdAreaGeofenceId,
          },
          estimatedArrival: this.getLastTouchpointTime(touchpoints),
          cargoType: request.cargoType,
        })
      );

      warnings.push(
        `Truck ban active at destination. Wait time: ${destBan.waitTimeHours} hours`
      );
    }

    // 7. POD - Always last
    touchpoints.push(
      this.createTouchpoint('POD', {
        sequence: sequence++,
        location: {
          city: request.destination.city,
          country: request.destination.country,
          coordinates: request.destination.coordinates,
        },
        estimatedArrival: destBan.nextAllowedEntry || this.getLastTouchpointTime(touchpoints),
        cargoType: request.cargoType,
      })
    );

    // 8. Add backload warning for foreign carriers
    let backloadWarning: string | undefined;
    if (
      request.carrierNationality !== 'SA' &&
      request.carrierNationality !== 'OTHER' &&
      request.destination.country === 'SA'
    ) {
      backloadWarning = `As a ${request.carrierNationality} carrier delivering to ${request.destination.city}, backloads can ONLY be picked up from ${request.destination.city} or cities on your direct return route (within 50km).`;
    }

    // Calculate total transit time
    const totalTransitTime = this.calculateTotalTransitTime(touchpoints);

    return {
      shipmentId: request.shipmentId,
      touchpoints,
      totalTouchpoints: touchpoints.length,
      isCrossBorder,
      estimatedTransitTime: totalTransitTime,
      warnings,
      backloadWarning,
    };
  }

  /**
   * Create a single touchpoint
   */
  private createTouchpoint(
    code: TouchpointCode,
    params: {
      sequence: number;
      location: {
        city: string;
        country: GCCCountry;
        coordinates: { lat: number; lng: number };
        geofenceId?: string;
      };
      estimatedArrival: Date;
      cargoType: CargoType;
      additionalActions?: string[];
    }
  ): GeneratedTouchpoint {
    const template = TOUCHPOINT_TEMPLATES[code];

    return {
      code,
      name: template.name,
      description: template.description,
      location: params.location,
      sequence: params.sequence,
      estimatedArrival: params.estimatedArrival,
      estimatedDeparture: new Date(
        params.estimatedArrival.getTime() + template.defaultDwellTime * 60 * 1000
      ),
      dwellTime: template.defaultDwellTime,
      requiredActions: params.additionalActions
        ? [...template.requiredActions, ...params.additionalActions]
        : template.requiredActions,
      requiredDocuments: this.getRequiredDocuments(template.requiredDocuments, params.cargoType),
      geofenceConfig: template.geofenceConfig,
      alerts: this.generateAlerts(code, params.cargoType),
    };
  }

  /**
   * Find border crossing between two countries
   */
  private findBorderCrossing(
    country1: GCCCountry,
    country2: GCCCountry
  ): (typeof GCC_BORDER_CROSSINGS)[0] | null {
    return (
      GCC_BORDER_CROSSINGS.find(
        (b) =>
          (b.country1 === country1 && b.country2 === country2) ||
          (b.country1 === country2 && b.country2 === country1)
      ) || null
    );
  }

  /**
   * Estimate arrival time based on distance
   */
  private estimateArrivalTime(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    departureTime: Date
  ): Date {
    const distance = this.calculateDistance(from, to);
    const avgSpeed = 80; // km/h
    const travelHours = distance / avgSpeed;
    return new Date(departureTime.getTime() + travelHours * 60 * 60 * 1000);
  }

  /**
   * Calculate distance between two points (Haversine)
   */
  private calculateDistance(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): number {
    const R = 6371;
    const dLat = this.toRad(to.lat - from.lat);
    const dLng = this.toRad(to.lng - from.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.lat)) *
        Math.cos(this.toRad(to.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Get midpoint between two coordinates
   */
  private getMidpoint(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): { lat: number; lng: number } {
    return {
      lat: (from.lat + to.lat) / 2,
      lng: (from.lng + to.lng) / 2,
    };
  }

  /**
   * Estimate midpoint time
   */
  private estimateMidpointTime(departureTime: Date, touchpoints: GeneratedTouchpoint[]): Date {
    const lastTime = this.getLastTouchpointTime(touchpoints);
    return new Date((departureTime.getTime() + lastTime.getTime()) / 2);
  }

  /**
   * Get last touchpoint time
   */
  private getLastTouchpointTime(touchpoints: GeneratedTouchpoint[]): Date {
    if (touchpoints.length === 0) return new Date();
    return touchpoints[touchpoints.length - 1].estimatedDeparture;
  }

  /**
   * Get hold area coordinates (offset from destination)
   */
  private getHoldAreaCoordinates(dest: { lat: number; lng: number }): { lat: number; lng: number } {
    return {
      lat: dest.lat + 0.05, // ~5km offset
      lng: dest.lng + 0.05,
    };
  }

  /**
   * Get required documents based on cargo type
   */
  private getRequiredDocuments(baseDocs: string[], cargoType: CargoType): string[] {
    const docs = [...baseDocs];

    if (cargoType === 'PERISHABLE') {
      docs.push('SFDA Permit', 'Health Certificate', 'Temperature Log');
    }

    if (cargoType === 'HAZMAT') {
      docs.push('HAZMAT Permit', 'ADR Certificate', 'MSDS', 'Emergency Response Plan');
    }

    if (cargoType === 'OVERSIZED') {
      docs.push('Oversized Permit', 'Route Survey', 'Escort Requirements');
    }

    return [...new Set(docs)];
  }

  /**
   * Generate alerts for touchpoint
   */
  private generateAlerts(
    code: TouchpointCode,
    cargoType: CargoType
  ): GeneratedTouchpoint['alerts'] {
    const alerts: GeneratedTouchpoint['alerts'] = [];

    if (code === 'BPC_EXIT' || code === 'BPC_ENTRY') {
      alerts.push({
        type: 'INFO',
        message: 'Ensure all documents are ready before arrival',
      });
    }

    if (cargoType === 'PERISHABLE') {
      alerts.push({
        type: 'WARNING',
        message: 'Temperature-sensitive cargo - minimize dwell time',
      });
    }

    if (cargoType === 'HAZMAT') {
      alerts.push({
        type: 'CRITICAL',
        message: 'HAZMAT cargo - follow safety protocols',
      });
    }

    return alerts;
  }

  /**
   * Calculate total transit time
   */
  private calculateTotalTransitTime(touchpoints: GeneratedTouchpoint[]): number {
    if (touchpoints.length < 2) return 0;

    const first = touchpoints[0].estimatedArrival;
    const last = touchpoints[touchpoints.length - 1].estimatedDeparture;

    return (last.getTime() - first.getTime()) / (1000 * 60 * 60); // hours
  }
}

// Export singleton
export const touchpointGenerator = new DynamicTouchpointGenerator();
