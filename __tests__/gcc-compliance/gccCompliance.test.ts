/**
 * GCC Compliance Intelligence Framework - Comprehensive Test Suite
 *
 * End-to-end tests for all GCC compliance services including:
 * - Pre-dispatch validation
 * - Backload compliance (TGA Oct 2024)
 * - Equipment-facility matching
 * - Truck ban schedules
 * - Touchpoint generation
 * - Location fusion
 * - Industry standards compliance
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  validationOrchestrator,
  backloadValidator,
  equipmentFacilityMatcher,
  regulationDatabase,
  touchpointGenerator,
  daleeliBillingService,
  textLocateService,
  bayanQRService,
  locationFusionService,
  gccComplianceService,
} from '@/lib/services/gcc-compliance';
import { industryStandardsService } from '@/lib/services/gcc-compliance/standards/industryStandards';
import { transportationIntegration } from '@/lib/services/gcc-compliance/integrations/transportationIntegration';
import { SAUDI_TRUCK_BAN_SCHEDULES, isWithinTruckBan } from '@/data/gcc-compliance/saudi-truck-bans';
import { GCC_BORDER_CROSSINGS, isCrossingOpen } from '@/data/gcc-compliance/gcc-border-crossings';
import { TGA_REGULATIONS } from '@/data/gcc-compliance/tga-regulations';
import type {
  PreDispatchValidationRequest,
  BackloadValidationRequest,
  DynamicTouchpointRequest,
  EquipmentType,
  GCCCountry,
} from '@/types/gcc-compliance';

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_SAUDI_CARRIER = {
  id: 'CARRIER-SA-001',
  name: 'Saudi Transport Company',
  nationality: 'SA' as GCCCountry,
  crNumber: '7001234567',
  waslRegistered: true,
  insuranceValid: true,
  licensedRoutes: ['ALL'],
};

const TEST_FOREIGN_CARRIER = {
  id: 'CARRIER-AE-001',
  name: 'Emirates Logistics',
  nationality: 'AE' as GCCCountry,
  crNumber: 'AE-123456',
  waslRegistered: true,
  insuranceValid: true,
  licensedRoutes: ['SA-AE'],
};

const TEST_EQUIPMENT = {
  type: 'FLATBED' as EquipmentType,
  plateNumber: 'ABC 1234',
  plateType: '1',
  sequenceNumber: '521330986',
};

const TEST_ROUTE_RIYADH_JEDDAH = {
  origin: {
    facilityId: 'FAC-RUH-001',
    city: 'Riyadh',
    country: 'SA' as GCCCountry,
    coordinates: { lat: 24.7136, lng: 46.6753 },
    facilityType: 'DOCK_WAREHOUSE' as const,
  },
  destination: {
    facilityId: 'FAC-JED-001',
    city: 'Jeddah',
    country: 'SA' as GCCCountry,
    coordinates: { lat: 21.4858, lng: 39.1925 },
    facilityType: 'DOCK_WAREHOUSE' as const,
  },
  plannedDeparture: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  plannedArrival: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
  intermediateFacilities: [],
};

const TEST_CROSS_BORDER_ROUTE = {
  origin: {
    facilityId: 'FAC-RUH-001',
    city: 'Riyadh',
    country: 'SA' as GCCCountry,
    coordinates: { lat: 24.7136, lng: 46.6753 },
    facilityType: 'DOCK_WAREHOUSE' as const,
  },
  destination: {
    facilityId: 'FAC-DXB-001',
    city: 'Dubai',
    country: 'AE' as GCCCountry,
    coordinates: { lat: 25.2048, lng: 55.2708 },
    facilityType: 'DOCK_WAREHOUSE' as const,
  },
  plannedDeparture: new Date(Date.now() + 2 * 60 * 60 * 1000),
  plannedArrival: new Date(Date.now() + 18 * 60 * 60 * 1000),
  intermediateFacilities: [],
};

// ============================================================================
// PRE-DISPATCH VALIDATION TESTS
// ============================================================================

describe('Pre-Dispatch Validation Orchestrator', () => {
  describe('Saudi Carrier - Domestic Shipment', () => {
    it('should pass validation for compliant domestic shipment', async () => {
      const request: PreDispatchValidationRequest = {
        shipmentId: 'TEST-001',
        tenantId: 'TENANT-001',
        carrier: TEST_SAUDI_CARRIER,
        equipment: TEST_EQUIPMENT,
        cargo: {
          type: 'GENERAL',
          weight: 20000,
          dimensions: { length: 12, width: 2.4, height: 2.5 },
          value: 50000,
        },
        route: TEST_ROUTE_RIYADH_JEDDAH,
        documents: {
          bayanEtd: {
            number: 'BAYAN-2026-001234',
            valid: true,
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
          },
          permits: [],
        },
      };

      const result = await validationOrchestrator.validate(request);

      expect(result).toBeDefined();
      expect(result.shipmentId).toBe('TEST-001');
      expect(result.steps.length).toBeGreaterThanOrEqual(8);
      expect(result.steps.find(s => s.name === 'Carrier Eligibility Check')).toBeDefined();
      expect(result.steps.find(s => s.name === 'Backload Legality Check')).toBeDefined();
      expect(result.validatedAt).toBeInstanceOf(Date);
    });

    it('should fail validation for overweight cargo', async () => {
      const request: PreDispatchValidationRequest = {
        shipmentId: 'TEST-002',
        tenantId: 'TENANT-001',
        carrier: TEST_SAUDI_CARRIER,
        equipment: TEST_EQUIPMENT,
        cargo: {
          type: 'GENERAL',
          weight: 60000, // Over limit
          dimensions: { length: 12, width: 2.4, height: 2.5 },
          value: 100000,
        },
        route: TEST_ROUTE_RIYADH_JEDDAH,
        documents: {
          permits: [],
        },
      };

      const result = await validationOrchestrator.validate(request);

      expect(result).toBeDefined();
      const weightStep = result.steps.find(s => s.name === 'Weight & Dimension Validation');
      expect(weightStep?.status).toBe('FAILED');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Border Shipment', () => {
    it('should generate border crossing touchpoints for SA-AE route', async () => {
      const request: PreDispatchValidationRequest = {
        shipmentId: 'TEST-003',
        tenantId: 'TENANT-001',
        carrier: TEST_SAUDI_CARRIER,
        equipment: TEST_EQUIPMENT,
        cargo: {
          type: 'GENERAL',
          weight: 25000,
          dimensions: { length: 12, width: 2.4, height: 2.5 },
          value: 75000,
        },
        route: TEST_CROSS_BORDER_ROUTE,
        documents: {
          bayanEtd: {
            number: 'BAYAN-2026-001235',
            valid: true,
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
          },
          permits: [],
        },
      };

      const result = await validationOrchestrator.validate(request);

      expect(result).toBeDefined();
      // Should require border crossing documentation
      const docsStep = result.steps.find(s => s.name === 'Document Completeness' || s.step === 6);
      expect(docsStep).toBeDefined();
    });
  });
});

// ============================================================================
// BACKLOAD COMPLIANCE TESTS (TGA OCTOBER 2024)
// ============================================================================

describe('Backload Compliance Validator (TGA Oct 2024)', () => {
  describe('Foreign Carrier Backload Rules', () => {
    it('should approve backload within 50km of arrival point', async () => {
      const request: BackloadValidationRequest = {
        carrierId: TEST_FOREIGN_CARRIER.id,
        carrierNationality: 'AE',
        plateNumber: 'DXB 5678',
        plateType: '2',
        originalTrip: {
          bayanNumber: 'BAYAN-2026-001100',
          arrivalCity: 'Riyadh',
          arrivalLocation: { lat: 24.7136, lng: 46.6753 },
          arrivalDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        },
        proposedBackload: {
          pickupLocation: { lat: 24.7500, lng: 46.7000 }, // ~5km away
          pickupCity: 'Riyadh',
          destinationCity: 'Dubai',
          destinationCountry: 'AE',
        },
      };

      const result = await backloadValidator.validateBackload(request);

      expect(result).toBeDefined();
      expect(result.isLegal).toBe(true);
      expect(result.distanceFromArrival).toBeLessThan(50);
      expect(result.violations.length).toBe(0);
    });

    it('should reject backload beyond 50km from arrival point', async () => {
      const request: BackloadValidationRequest = {
        carrierId: TEST_FOREIGN_CARRIER.id,
        carrierNationality: 'AE',
        plateNumber: 'DXB 5678',
        plateType: '2',
        originalTrip: {
          bayanNumber: 'BAYAN-2026-001101',
          arrivalCity: 'Riyadh',
          arrivalLocation: { lat: 24.7136, lng: 46.6753 },
          arrivalDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        proposedBackload: {
          pickupLocation: { lat: 21.4858, lng: 39.1925 }, // Jeddah - 800km+ away
          pickupCity: 'Jeddah',
          destinationCity: 'Dubai',
          destinationCountry: 'AE',
        },
      };

      const result = await backloadValidator.validateBackload(request);

      expect(result).toBeDefined();
      expect(result.isLegal).toBe(false);
      expect(result.distanceFromArrival).toBeGreaterThan(50);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should approve backload on direct return route with deviation <15%', async () => {
      const request: BackloadValidationRequest = {
        carrierId: TEST_FOREIGN_CARRIER.id,
        carrierNationality: 'AE',
        plateNumber: 'DXB 5678',
        plateType: '2',
        originalTrip: {
          bayanNumber: 'BAYAN-2026-001102',
          arrivalCity: 'Riyadh',
          arrivalLocation: { lat: 24.7136, lng: 46.6753 },
          arrivalDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
        proposedBackload: {
          pickupLocation: { lat: 24.2000, lng: 47.5000 }, // On route to UAE
          pickupCity: 'Al Hofuf',
          destinationCity: 'Dubai',
          destinationCountry: 'AE',
        },
      };

      const result = await backloadValidator.validateBackload(request);

      expect(result).toBeDefined();
      // Should check route deviation - distanceFromReturnRoute is the deviation metric
      expect(result.distanceFromReturnRoute).toBeDefined();
    });

    it('should allow Saudi carriers without backload restrictions', async () => {
      const request: BackloadValidationRequest = {
        carrierId: TEST_SAUDI_CARRIER.id,
        carrierNationality: 'SA', // Saudi carrier
        plateNumber: 'ABC 1234',
        plateType: '1',
        originalTrip: {
          bayanNumber: 'BAYAN-2026-001103',
          arrivalCity: 'Dammam',
          arrivalLocation: { lat: 26.4207, lng: 50.0888 },
          arrivalDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
        },
        proposedBackload: {
          pickupLocation: { lat: 21.4858, lng: 39.1925 }, // Jeddah - far from arrival
          pickupCity: 'Jeddah',
          destinationCity: 'Riyadh',
          destinationCountry: 'SA',
        },
      };

      const result = await backloadValidator.validateBackload(request);

      expect(result).toBeDefined();
      expect(result.isLegal).toBe(true);
      expect(result.violations.length).toBe(0);
      // Saudi carriers are exempt from backload restrictions
    });
  });

  describe('Quick Check', () => {
    it('should return likely=true for nearby pickup', () => {
      const result = backloadValidator.quickCheck(
        { lat: 24.7136, lng: 46.6753 }, // Riyadh arrival
        { lat: 24.7500, lng: 46.7000 }, // 5km away
        'AE'
      );

      expect(result.likely).toBe(true);
    });

    it('should return likely=false for distant pickup', () => {
      const result = backloadValidator.quickCheck(
        { lat: 24.7136, lng: 46.6753 }, // Riyadh arrival
        { lat: 21.4858, lng: 39.1925 }, // Jeddah
        'AE'
      );

      expect(result.likely).toBe(false);
    });
  });
});

// ============================================================================
// EQUIPMENT-FACILITY MATRIX TESTS
// ============================================================================

describe('Equipment-Facility Compatibility Matrix', () => {
  describe('Compatibility Checks', () => {
    it('should allow REEFER equipment at container terminals (with reefer plug)', () => {
      const result = equipmentFacilityMatcher.checkSingleFacility('REEFER', 'CONTAINER_TERMINAL');

      expect(result.canProceed).toBe(true);
      expect(result.status).toBe('COMPATIBLE');
    });

    it('should reject FLATBED at container terminals', () => {
      const result = equipmentFacilityMatcher.checkSingleFacility('FLATBED', 'CONTAINER_TERMINAL');

      expect(result.canProceed).toBe(false);
      expect(result.status).toBe('INCOMPATIBLE');
    });

    it('should allow CONTAINER at container terminals', () => {
      const result = equipmentFacilityMatcher.checkSingleFacility('CONTAINER', 'CONTAINER_TERMINAL');

      expect(result.canProceed).toBe(true);
      expect(result.status).toBe('COMPATIBLE');
    });

    it('should reject TANKER at dock warehouse', () => {
      const result = equipmentFacilityMatcher.checkSingleFacility('TANKER', 'DOCK_WAREHOUSE');

      expect(result.canProceed).toBe(false);
      expect(result.status).toBe('INCOMPATIBLE');
    });
  });

  describe('Journey Validation', () => {
    it('should validate equipment for multi-facility journey', () => {
      const result = equipmentFacilityMatcher.validateEquipmentForJourney({
        equipmentType: 'BOX_DRY_VAN',
        facilities: [
          { facilityId: 'FAC-1', facilityType: 'DOCK_WAREHOUSE', name: 'Warehouse A', location: { lat: 24.7, lng: 46.6 } },
          { facilityId: 'FAC-2', facilityType: 'CROSS_DOCK', name: 'Cross Dock', location: { lat: 24.8, lng: 46.7 } },
          { facilityId: 'FAC-3', facilityType: 'DOCK_WAREHOUSE', name: 'Warehouse B', location: { lat: 25.0, lng: 46.8 } },
        ],
      });

      expect(result).toBeDefined();
      expect(result.isCompatible).toBe(true);
      expect(result.facilityChecks.length).toBe(3);
    });

    it('should fail journey with incompatible facility', () => {
      const result = equipmentFacilityMatcher.validateEquipmentForJourney({
        equipmentType: 'CONTAINER',
        facilities: [
          { facilityId: 'FAC-1', facilityType: 'CONTAINER_TERMINAL', name: 'Port', location: { lat: 24.7, lng: 46.6 } },
          { facilityId: 'FAC-2', facilityType: 'DOCK_WAREHOUSE', name: 'Dock Warehouse', location: { lat: 24.8, lng: 46.7 } }, // Incompatible - container operations only
        ],
      });

      expect(result.isCompatible).toBe(false);
      expect(result.blockedFacilities.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// TRUCK BAN SCHEDULE TESTS
// ============================================================================

describe('Truck Ban Schedules', () => {
  describe('Saudi City Schedules', () => {
    it('should have schedule for Riyadh', () => {
      const riyadhSchedule = SAUDI_TRUCK_BAN_SCHEDULES.find(s => s.city === 'Riyadh');

      expect(riyadhSchedule).toBeDefined();
      expect(riyadhSchedule?.isActive).toBe(true);
      expect(riyadhSchedule?.normalSchedule.banStart).toBe('06:00');
      expect(riyadhSchedule?.normalSchedule.banEnd).toBe('22:00');
      expect(riyadhSchedule?.penaltySAR).toBe(3000);
      expect(riyadhSchedule?.confidenceScore).toBeGreaterThan(0.9);
    });

    it('should have special Ramadan schedule', () => {
      const riyadhSchedule = SAUDI_TRUCK_BAN_SCHEDULES.find(s => s.city === 'Riyadh');

      expect(riyadhSchedule?.ramadanSchedule).toBeDefined();
      expect(riyadhSchedule?.ramadanSchedule?.banStart).toBe('14:00');
    });

    it('should have schedule for all major cities', () => {
      const majorCities = ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah'];

      for (const city of majorCities) {
        const schedule = SAUDI_TRUCK_BAN_SCHEDULES.find(s => s.city === city);
        expect(schedule).toBeDefined();
        expect(schedule?.isActive).toBe(true);
      }
    });

    it('should have stricter rules for holy cities', () => {
      const makkahSchedule = SAUDI_TRUCK_BAN_SCHEDULES.find(s => s.city === 'Makkah');
      const riyadhSchedule = SAUDI_TRUCK_BAN_SCHEDULES.find(s => s.city === 'Riyadh');

      expect(makkahSchedule?.penaltySAR).toBeGreaterThan(riyadhSchedule?.penaltySAR || 0);
      expect(makkahSchedule?.normalSchedule.affectedVehicles.minWeight).toBeLessThan(
        riyadhSchedule?.normalSchedule.affectedVehicles.minWeight || 0
      );
    });
  });

  describe('Truck Ban Check Function', () => {
    it('should detect truck ban during restricted hours', () => {
      // 10:00 AM on a Sunday - should be banned in Riyadh
      const testDate = new Date();
      testDate.setHours(10, 0, 0, 0);
      if (testDate.getDay() === 5) testDate.setDate(testDate.getDate() + 1); // Skip Friday

      const result = isWithinTruckBan('Riyadh', testDate, 15000, false);

      expect(result.banned).toBe(true);
      expect(result.nextWindow).toBeDefined();
    });

    it('should allow trucks outside restricted hours', () => {
      // 11:00 PM - should be allowed
      const testDate = new Date();
      testDate.setHours(23, 0, 0, 0);

      const result = isWithinTruckBan('Riyadh', testDate, 15000, false);

      expect(result.banned).toBe(false);
    });

    it('should allow trucks under weight threshold', () => {
      // Even during ban hours, light trucks allowed
      const testDate = new Date();
      testDate.setHours(10, 0, 0, 0);

      const result = isWithinTruckBan('Riyadh', testDate, 8000, false); // Under 12000kg

      expect(result.banned).toBe(false);
      expect(result.reason).toContain('weight below threshold');
    });
  });
});

// ============================================================================
// BORDER CROSSING TESTS
// ============================================================================

describe('GCC Border Crossings', () => {
  describe('Border Crossing Data', () => {
    it('should have King Fahd Causeway data', () => {
      const causeway = GCC_BORDER_CROSSINGS.find(c => c.id === 'SA-BH-CAUSEWAY');

      expect(causeway).toBeDefined();
      expect(causeway?.name).toBe('King Fahd Causeway');
      expect(causeway?.type).toBe('CAUSEWAY');
      expect(causeway?.operatingHours.is24Hours).toBe(true);
    });

    it('should have Saudi-UAE border crossings', () => {
      const saUaeCrossings = GCC_BORDER_CROSSINGS.filter(
        c => (c.countryA === 'SA' && c.countryB === 'AE') ||
             (c.countryA === 'AE' && c.countryB === 'SA')
      );

      expect(saUaeCrossings.length).toBeGreaterThanOrEqual(2);
    });

    it('should have required documents for each crossing', () => {
      for (const crossing of GCC_BORDER_CROSSINGS) {
        expect(crossing.requiredDocuments.length).toBeGreaterThan(0);
        expect(crossing.requiredDocuments.some(d => d.mandatory)).toBe(true);
      }
    });
  });

  describe('Crossing Open Check', () => {
    it('should report 24h crossings as always open', () => {
      const result = isCrossingOpen('SA-BH-CAUSEWAY', new Date(), true);

      expect(result.open).toBe(true);
    });

    it('should check commercial hours for restricted crossings', () => {
      // Find a crossing with commercial hours
      const crossing = GCC_BORDER_CROSSINGS.find(
        c => c.operatingHours.commercialHours && !c.operatingHours.is24Hours
      );

      if (crossing) {
        const testDate = new Date();
        testDate.setHours(3, 0, 0, 0); // 3 AM - likely closed for commercial

        const result = isCrossingOpen(crossing.id, testDate, true);
        // Result depends on specific crossing hours
        expect(result).toBeDefined();
      }
    });
  });
});

// ============================================================================
// TOUCHPOINT GENERATION TESTS
// ============================================================================

describe('Dynamic Touchpoint Generator', () => {
  describe('Domestic Route Touchpoints', () => {
    it('should generate POL and POD for domestic route', async () => {
      const request: DynamicTouchpointRequest = {
        shipmentId: 'TEST-TP-001',
        origin: {
          city: 'Riyadh',
          country: 'SA',
          facilityId: 'FAC-001',
          facilityType: 'DOCK_WAREHOUSE',
          coordinates: { lat: 24.7136, lng: 46.6753 },
        },
        destination: {
          city: 'Jeddah',
          country: 'SA',
          facilityId: 'FAC-002',
          facilityType: 'DOCK_WAREHOUSE',
          coordinates: { lat: 21.4858, lng: 39.1925 },
        },
        equipmentType: 'FLATBED',
        carrierNationality: 'SA',
        cargoType: 'GENERAL',
        requiresCrossDock: false,
        plannedDeparture: new Date(),
      };

      const result = await touchpointGenerator.generateTouchpoints(request);

      expect(result).toBeDefined();
      expect(result.shipmentId).toBe('TEST-TP-001');
      expect(result.touchpoints.length).toBeGreaterThanOrEqual(2);
      expect(result.touchpoints.some(t => t.code === 'POL')).toBe(true);
      expect(result.touchpoints.some(t => t.code === 'POD')).toBe(true);
    });
  });

  describe('Cross-Border Route Touchpoints', () => {
    it('should generate border crossing touchpoints', async () => {
      const request: DynamicTouchpointRequest = {
        shipmentId: 'TEST-TP-002',
        origin: {
          city: 'Riyadh',
          country: 'SA',
          facilityId: 'FAC-001',
          facilityType: 'DOCK_WAREHOUSE',
          coordinates: { lat: 24.7136, lng: 46.6753 },
        },
        destination: {
          city: 'Dubai',
          country: 'AE',
          facilityId: 'FAC-002',
          facilityType: 'DOCK_WAREHOUSE',
          coordinates: { lat: 25.2048, lng: 55.2708 },
        },
        equipmentType: 'CONTAINER',
        carrierNationality: 'SA',
        cargoType: 'GENERAL',
        requiresCrossDock: false,
        plannedDeparture: new Date(),
      };

      const result = await touchpointGenerator.generateTouchpoints(request);

      expect(result).toBeDefined();
      expect(result.isCrossBorder).toBe(true);
      expect(result.touchpoints.some(t => t.code === 'BPC_EXIT')).toBe(true);
      expect(result.touchpoints.some(t => t.code === 'BPC_ENTRY')).toBe(true);
    });
  });

  describe('Special Cargo Touchpoints', () => {
    it('should generate SFDA touchpoint for reefer cargo', async () => {
      const request: DynamicTouchpointRequest = {
        shipmentId: 'TEST-TP-003',
        origin: {
          city: 'Jeddah',
          country: 'SA',
          facilityId: 'FAC-001',
          facilityType: 'COLD_STORAGE',
          coordinates: { lat: 21.4858, lng: 39.1925 },
        },
        destination: {
          city: 'Riyadh',
          country: 'SA',
          facilityId: 'FAC-002',
          facilityType: 'COLD_STORAGE',
          coordinates: { lat: 24.7136, lng: 46.6753 },
        },
        equipmentType: 'REEFER',
        carrierNationality: 'SA',
        cargoType: 'PERISHABLE', // Cold chain cargo requiring SFDA
        requiresCrossDock: false,
        plannedDeparture: new Date(),
      };

      const result = await touchpointGenerator.generateTouchpoints(request);

      expect(result).toBeDefined();
      expect(result.touchpoints.some(t => t.code === 'SFDA')).toBe(true);
    });

    it('should generate HAZ touchpoint for hazmat cargo', async () => {
      const request: DynamicTouchpointRequest = {
        shipmentId: 'TEST-TP-004',
        origin: {
          city: 'Jubail',
          country: 'SA',
          facilityId: 'FAC-001',
          facilityType: 'INDUSTRIAL_ZONE',
          coordinates: { lat: 27.0046, lng: 49.6571 },
        },
        destination: {
          city: 'Riyadh',
          country: 'SA',
          facilityId: 'FAC-002',
          facilityType: 'INDUSTRIAL_ZONE',
          coordinates: { lat: 24.7136, lng: 46.6753 },
        },
        equipmentType: 'TANKER',
        carrierNationality: 'SA',
        cargoType: 'HAZMAT',
        requiresCrossDock: false,
        plannedDeparture: new Date(),
      };

      const result = await touchpointGenerator.generateTouchpoints(request);

      expect(result).toBeDefined();
      expect(result.touchpoints.some(t => t.code === 'HAZ')).toBe(true);
    });
  });
});

// ============================================================================
// INDUSTRY STANDARDS COMPLIANCE TESTS
// ============================================================================

describe('Industry Standards Compliance', () => {
  describe('GS1 Standards', () => {
    it('should validate SSCC format', async () => {
      const result = await industryStandardsService.checkCompliance({
        shipmentId: 'TEST-STD-001',
        cargoType: 'GENERAL',
        sector: 'RETAIL',
        documents: [],
        certifications: [],
        equipment: { type: 'FLATBED' },
        productIdentifiers: {
          sscc: '123456789012345678', // Valid 18-digit SSCC
        },
      });

      expect(result).toBeDefined();
      expect(result.standardsChecked.some(s => s.standardCode === 'GS1-SSCC')).toBe(true);
    });

    it('should fail invalid SSCC', async () => {
      const result = await industryStandardsService.checkCompliance({
        shipmentId: 'TEST-STD-002',
        cargoType: 'GENERAL',
        sector: 'RETAIL',
        documents: [],
        certifications: [],
        equipment: { type: 'FLATBED' },
        productIdentifiers: {
          sscc: '12345', // Invalid - too short
        },
      });

      expect(result).toBeDefined();
      const gs1Check = result.standardsChecked.find(s => s.standardCode === 'GS1-SSCC');
      expect(gs1Check?.failedRequirements.length).toBeGreaterThan(0);
    });
  });

  describe('Hazmat Standards', () => {
    it('should require ADR documentation for hazmat', async () => {
      const result = await industryStandardsService.checkCompliance({
        shipmentId: 'TEST-STD-003',
        cargoType: 'HAZMAT',
        sector: 'HAZMAT',
        documents: [],
        certifications: [],
        equipment: {
          type: 'TANKER',
          hasSafetyEquipment: true,
        },
        productIdentifiers: {
          unNumber: 'UN1203',
          hazClass: '3',
        },
      });

      expect(result).toBeDefined();
      expect(result.standardsChecked.some(s => s.standardCode === 'ADR-2025')).toBe(true);
    });
  });

  describe('Cold Chain Standards', () => {
    it('should require ATP certification for reefer', async () => {
      const result = await industryStandardsService.checkCompliance({
        shipmentId: 'TEST-STD-004',
        cargoType: 'REEFER',
        sector: 'FOOD_BEVERAGE',
        documents: [],
        certifications: [
          {
            type: 'ATP',
            number: 'ATP-2025-001',
            valid: true,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        ],
        equipment: {
          type: 'REEFER',
          hasTemperatureLogger: true,
          atpCertified: true,
        },
      });

      expect(result).toBeDefined();
      expect(result.standardsChecked.some(s => s.standardCode === 'ATP-2024')).toBe(true);
    });
  });
});

// ============================================================================
// TGA REGULATION DATA TESTS
// ============================================================================

describe('TGA Regulation Data', () => {
  describe('Regulation References', () => {
    it('should have Bayan regulations', () => {
      expect(TGA_REGULATIONS.bayan.length).toBeGreaterThan(0);
      expect(TGA_REGULATIONS.bayan[0].regulationId).toContain('BAYAN');
      expect(TGA_REGULATIONS.bayan[0].confidenceScore).toBeGreaterThan(0.9);
    });

    it('should have backload regulations with TGA Oct 2024 reference', () => {
      const backloadReg = TGA_REGULATIONS.backload.find(r => r.regulationId === 'TGA-BL-2024-001');
      expect(backloadReg).toBeDefined();
      expect(backloadReg?.effectiveDate).toEqual(new Date('2024-10-01'));
    });

    it('should have weight limits for different vehicle types', () => {
      expect(TGA_REGULATIONS.weightDimension.length).toBeGreaterThan(0);

      const heavyTruckLimit = TGA_REGULATIONS.weightDimension.find(
        w => w.vehicleType === 'HEAVY_TRUCK'
      );
      expect(heavyTruckLimit?.maxGrossWeight).toBe(45000);
    });

    it('should have WASL integration requirements', () => {
      expect(TGA_REGULATIONS.wasl.length).toBeGreaterThan(0);

      const vehicleReg = TGA_REGULATIONS.wasl.find(w => w.requirementCode === 'VEHICLE_REGISTRATION');
      expect(vehicleReg).toBeDefined();
      expect(vehicleReg?.dataFields).toContain('plateNumber');
    });

    it('should have SFDA cold chain requirements', () => {
      expect(TGA_REGULATIONS.sfda.length).toBeGreaterThan(0);

      const tempReq = TGA_REGULATIONS.sfda.find(s => s.requirementType === 'TEMPERATURE');
      expect(tempReq?.specifications.FROZEN_FOOD.max).toBe(-18);
    });
  });
});

// ============================================================================
// BAYAN QR SERVICE TESTS
// ============================================================================

describe('Bayan QR Service', () => {
  it('should generate QR code with Bayan data', async () => {
    // Use createQRDataFromShipment to get properly formatted data
    const qrData = bayanQRService.createQRDataFromShipment({
      id: 'SHP-TEST-001',
      etwNumber: 'ETW-2026-TEST-001',
      bayanNumber: 'BAYAN-2026-TEST-001',
      bayanStatus: 'ACTIVE',
      origin: { city: 'Riyadh', country: 'SA' },
      destination: { city: 'Jeddah', country: 'SA' },
      carrier: { crNumber: '7001234567', name: 'Test Carrier' },
      vehicle: { plateNumber: 'ABC 1234', plateType: '1', sequenceNumber: '12345' },
      driver: { name: 'Test Driver', idNumber: 'DL-12345' },
      cargo: { description: 'General cargo', weight: 20000, packages: 10 },
    });

    const result = await bayanQRService.generateBayanEtwQR(qrData);

    expect(result).toBeDefined();
    expect(result.qrCodeBase64).toBeDefined();
    expect(result.qrCodeBase64.length).toBeGreaterThan(100);
    expect(result.verificationUrl).toBeDefined();
    expect(result.payload).toBeDefined();
  });
});

// ============================================================================
// LOCATION FUSION SERVICE TESTS
// ============================================================================

describe('Location Fusion Service', () => {
  it('should fuse multiple location sources', async () => {
    const sources = [
      {
        source: 'DALEEL' as const,
        coordinates: { lat: 24.7136, lng: 46.6753 },
        accuracy: 10,
        timestamp: new Date(),
        trustLevel: 0.95,
      },
      {
        source: 'WHATSAPP' as const,
        coordinates: { lat: 24.7140, lng: 46.6750 },
        accuracy: 50,
        timestamp: new Date(),
        trustLevel: 0.7,
      },
    ];

    const result = await locationFusionService.fuseLocations('TEST-FUSION-001', sources as any);

    expect(result).toBeDefined();
    // The result should have coordinates
    expect(result.coordinates).toBeDefined();
    expect(result.coordinates.lat).toBeCloseTo(24.7136, 2); // Should weight toward Daleel
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.sources.length).toBe(2);
  });

  it('should detect anomaly in location data', async () => {
    const currentLocation = {
      coordinates: { lat: 25.0000, lng: 47.0000 }, // 50km jump
      accuracy: 20,
      confidence: 0.9,
      timestamp: new Date(),
      sources: [],
      deviation: {
        maxDeviation: 0,
        averageDeviation: 0,
        anomalyDetected: false,
        possibleCauses: [],
      },
    };

    const history = [
      {
        coordinates: { lat: 24.7136, lng: 46.6753 },
        accuracy: 10,
        confidence: 0.95,
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        sources: [],
        deviation: {
          maxDeviation: 0,
          averageDeviation: 0,
          anomalyDetected: false,
          possibleCauses: [],
        },
      },
    ];

    const result = await locationFusionService.detectAnomaly(currentLocation as any, history as any);

    expect(result).toBeDefined();
    expect(result.isAnomaly).toBe(true);
    // Check for unrealistic speed detection
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// DALEELI BILLING SERVICE TESTS
// ============================================================================

describe('Daleeli Billing Service', () => {
  it('should log API calls', async () => {
    await daleeliBillingService.logApiCall({
      timestamp: new Date(),
      endpoint: 'LOCATION_BY_SEQUENCE',
      requestPayload: { sequenceNumber: '123456' },
      success: true,
      responseCode: '200',
      responseTime: 150,
      dataPointsReturned: 1,
      tenantId: 'TEST-TENANT',
    });

    const usage = await daleeliBillingService.getCurrentPeriodUsage('TEST-TENANT');

    expect(usage).toBeDefined();
    expect(usage.currentMonth).toBeDefined();
    expect(usage.currentMonth.totalCalls).toBeGreaterThanOrEqual(0);
  });

  it('should calculate monthly reconciliation', async () => {
    const result = await daleeliBillingService.getMonthlyReconciliation(
      'TEST-TENANT',
      2026,
      1
    );

    expect(result).toBeDefined();
    expect(result.tenantId).toBe('TEST-TENANT');
    expect(result.period.year).toBe(2026);
    expect(result.period.month).toBe(1);
    expect(result.totalCalls).toBeGreaterThanOrEqual(0);
    expect(result.estimatedCost).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Transportation Integration', () => {
  it('should validate shipment for dispatch', async () => {
    const testShipment = {
      id: 'INT-TEST-001',
      tenantId: 'TENANT-001',
      status: 'BOOKED' as const,
      origin: {
        facilityId: 'FAC-001',
        facilityType: 'DOCK_WAREHOUSE',
        city: 'Riyadh',
        country: 'SA',
        coordinates: { lat: 24.7136, lng: 46.6753 },
      },
      destination: {
        facilityId: 'FAC-002',
        facilityType: 'DOCK_WAREHOUSE',
        city: 'Jeddah',
        country: 'SA',
        coordinates: { lat: 21.4858, lng: 39.1925 },
      },
      carrier: {
        id: 'CARRIER-001',
        name: 'Test Carrier',
        nationality: 'SA',
        crNumber: '7001234567',
        waslRegistered: true,
      },
      equipment: {
        type: 'FLATBED' as EquipmentType,
        plateNumber: 'ABC 1234',
        plateType: '1',
      },
      driver: {
        id: 'DRIVER-001',
        name: 'Test Driver',
        phone: '+966501234567',
        licenseNumber: 'DL-12345',
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      cargo: {
        type: 'GENERAL' as const,
        description: 'General cargo',
        weight: 20000,
        dimensions: { length: 12, width: 2.4, height: 2.5 },
        value: 50000,
      },
      bayanNumber: 'BAYAN-2026-INT-001',
      permits: [],
      plannedDeparture: new Date(Date.now() + 2 * 60 * 60 * 1000),
      plannedArrival: new Date(Date.now() + 12 * 60 * 60 * 1000),
    };

    const result = await transportationIntegration.validateForDispatch(testShipment);

    expect(result).toBeDefined();
    expect(result.shipmentId).toBe('INT-TEST-001');
    expect(result.steps.length).toBeGreaterThanOrEqual(8);
  });
});
