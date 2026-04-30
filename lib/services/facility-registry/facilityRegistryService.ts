/**
 * Unified Facility Registry Service
 *
 * Platform-level service for managing unified facilities
 * Auto-syncs to Geofence, Touchpoints, WMS, Route Analysis
 *
 * COMPREHENSIVE: Supports multiple government divisions with independent hours
 * FLEXIBLE: Easy to add new divisions
 * SCALABLE: Handles any number of divisions per facility
 * INTERCONNECTED: Auto-syncs to all modules
 *
 * @module facility-registry
 */

import { eventBus, createEvent } from "@/lib/services/event-store";
import { geofenceZoneService } from "@/lib/services/geofence";
import { touchpointService } from "@/lib/services/customs/touchpointService";
import { prisma } from "@/lib/prisma";
import type {
  UnifiedFacility,
  FacilityCreateInput,
  FacilityUpdateInput,
  FacilityQuery,
  UnifiedFacilityType,
  GovernmentDivision,
  GovernmentDivisionInput,
  EnvironmentalAgency,
  EnvironmentalAgencyInput,
} from "@/types/unified-facility";
import type { ZoneType } from "@/lib/services/geofence/types";
import type { TouchpointType, BorderType } from "@/types/touchpoint";

export class FacilityRegistryService {
  private initialized = false;

  /**
   * Initialize service and event subscriptions
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.subscribeToEvents();
    this.initialized = true;
    console.log("✅ Unified Facility Registry Service initialized");
  }

  /**
   * Create unified facility with auto-sync to modules
   */
  async createFacility(input: FacilityCreateInput): Promise<UnifiedFacility> {
    // Validate
    await this.validateFacilityInput(input);

    // Generate ID
    const id = `facility-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date();

    // Process government divisions - each gets own operating hours
    const governmentDivisions: GovernmentDivision[] = (
      input.governmentDivisions || []
    ).map((div, idx) => ({
      id: `gov-div-${id}-${idx}`,
      code: div.code,
      name: div.name,
      nameLocal: div.nameLocal,
      type: div.type,
      environmentalAgencyType: div.environmentalAgencyType,
      authority: {
        name: div.authority.name,
        code: div.authority.code,
        country: div.authority.country,
        jurisdiction: div.authority.jurisdiction || "NATIONAL",
        website: div.authority.website,
      },
      location: {
        facilityId: id, // Will be set after creation
        coordinates: div.location?.coordinates,
        building: div.location?.building,
        floor: div.location?.floor,
        office: div.location?.office,
        checkpoint: div.location?.checkpoint,
        lane: div.location?.lane,
      },
      // CRITICAL: Each division has its own operating hours!
      operatingHours: div.operatingHours,
      processingTimes: div.processingTimes || {
        average: 1,
        min: 0.5,
        max: 2,
      },
      services: (div.services || []).map((s, sIdx) => ({
        id: `service-${id}-${idx}-${sIdx}`,
        ...s,
      })),
      requiredDocuments: div.requiredDocuments || [],
      requiredCertifications: div.requiredCertifications || [],
      preferredPrograms: div.preferredPrograms || [],
      capacity: div.capacity,
      contact: div.contact || {},
      status: div.status || "OPERATIONAL",
      is24Hours: div.is24Hours || false,
      integrationIds: div.integrationIds || {},
      apiEndpoint: div.apiEndpoint,
      tags: div.tags || [],
      notes: div.notes,
      lastUpdated: now,
      createdAt: now,
    }));

    // Process environmental agencies separately
    const environmentalAgencies: EnvironmentalAgency[] = (
      input.environmentalAgencies || []
    ).map((agency, idx) => ({
      id: `env-agency-${id}-${idx}`,
      code: agency.code,
      name: agency.name,
      type: agency.type,
      authority: {
        name: agency.authority.name,
        code: agency.authority.code,
        country: agency.authority.country,
      },
      location: {
        facilityId: id,
        coordinates: agency.location?.coordinates,
        building: agency.location?.building,
        office: agency.location?.office,
      },
      // CRITICAL: Environmental agencies have their own hours!
      operatingHours: agency.operatingHours,
      services: (agency.services || []).map((s, sIdx) => ({
        id: `env-service-${id}-${idx}-${sIdx}`,
        ...s,
      })),
      requiredDocuments: agency.requiredDocuments || [],
      environmentalStandards: agency.environmentalStandards || [],
      contact: agency.contact || {},
      status: agency.status || "OPERATIONAL",
      lastUpdated: now,
    }));

    // Build facility
    const facility: UnifiedFacility = {
      id,
      code: input.code,
      name: input.name,
      nameLocal: input.nameLocal,
      type: input.type,
      status: input.status || "ACTIVE",
      tenantId: input.tenantId,

      location: input.location,
      operatingHours: input.operatingHours,
      constraints: input.constraints || [],
      capabilities: input.capabilities || [],
      supportedTransportModes: input.supportedTransportModes || [],
      regulatoryAuthorities: input.regulatoryAuthorities || [],
      governmentDivisions, // Array of divisions with independent hours
      environmentalAgencies, // Separate from divisions
      licenses: input.licenses || [],
      certifications: input.certifications || [],
      capacity: input.capacity || {},
      processingTimes: input.processingTimes || {
        average: 1,
        export: 1,
        import: 1,
        transit: 1,
        min: 0.5,
        max: 2,
      },
      contact: input.contact || {},

      moduleExtensions: {
        geofence: {
          autoCreateZone: input.autoCreateGeofence ?? true,
          zoneType:
            input.geofenceExtension?.zoneType ||
            this.mapFacilityTypeToZoneType(input.type),
          expectedDwellTime: input.geofenceExtension?.expectedDwellTime,
          maxDwellTime: input.geofenceExtension?.maxDwellTime,
          slaRules: input.geofenceExtension?.slaRules,
        },
        touchpoint: {
          touchpointType:
            input.touchpointExtension?.touchpointType ||
            this.mapFacilityTypeToTouchpointType(input.type),
          borderType: input.touchpointExtension?.borderType,
          connectedBorderId: input.touchpointExtension?.connectedBorderId,
        },
      },

      performance: {},
      tags: input.tags || [],
      notes: input.notes,
      metadata: input.metadata,

      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy,
    };

    // Save to database
    await this.saveFacilityToDatabase(facility);

    // Auto-create geofence zone if enabled
    if (
      facility.moduleExtensions.geofence?.autoCreateZone &&
      facility.location.coordinates
    ) {
      await this.createGeofenceZoneFromFacility(facility);
    }

    // Auto-create touchpoint if enabled
    if (input.autoCreateTouchpoint && facility.location.coordinates) {
      await this.createTouchpointFromFacility(facility);
    }

    // Publish event
    await eventBus.publish(
      createEvent("facility.created", {
        facilityId: facility.id,
        facilityCode: facility.code,
        facilityType: facility.type,
        tenantId: facility.tenantId,
        governmentDivisionsCount: facility.governmentDivisions.length,
        environmentalAgenciesCount: facility.environmentalAgencies.length,
      }),
    );

    return facility;
  }

  /**
   * Get facility by ID with all divisions
   */
  async getFacility(
    id: string,
    tenantId: string,
    includeExtensions?: ("geofence" | "touchpoint" | "wms" | "all")[],
  ): Promise<UnifiedFacility | null> {
    const facility = await prisma.unifiedFacility.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        GovernmentDivision: true,
        EnvironmentalAgency: true,
      },
    });

    if (!facility) return null;

    return this.mapDatabaseToFacility(facility);
  }

  /**
   * Find facilities by query
   */
  async findFacilities(query: FacilityQuery): Promise<UnifiedFacility[]> {
    const where: any = {
      tenantId: query.tenantId,
    };

    if (query.ids && query.ids.length > 0) {
      where.id = { in: query.ids };
    }

    if (query.codes && query.codes.length > 0) {
      where.code = { in: query.codes };
    }

    if (query.types && query.types.length > 0) {
      where.type = { in: query.types };
    }

    if (query.status && query.status.length > 0) {
      where.status = { in: query.status };
    }

    if (query.country) {
      where.location = {
        path: ["address", "country"],
        equals: query.country,
      };
    }

    if (query.hasGovernmentDivision) {
      where.GovernmentDivision = {
        some: {
          type: query.hasGovernmentDivision,
        },
      };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { code: { contains: query.search, mode: "insensitive" } },
        { alternateNames: { array_contains: [query.search] } },
      ];
    }

    const facilities = await prisma.unifiedFacility.findMany({
      where,
      include: {
        GovernmentDivision: true,
        EnvironmentalAgency: true,
      },
      orderBy: { name: "asc" },
    });

    // Filter by location if provided
    let results = facilities.map((f) => this.mapDatabaseToFacility(f));

    if (query.nearLocation) {
      results = results.filter((f) => {
        const distance = this.calculateDistance(
          query.nearLocation!.coordinates,
          f.location.coordinates,
        );
        return distance <= query.nearLocation!.radius;
      });
    }

    return results;
  }

  /**
   * Update facility with auto-sync to modules
   */
  async updateFacility(
    id: string,
    tenantId: string,
    input: FacilityUpdateInput,
  ): Promise<UnifiedFacility> {
    const existing = await this.getFacility(id, tenantId);
    if (!existing) {
      throw new Error(`Facility ${id} not found`);
    }

    // Merge updates
    const updated: UnifiedFacility = {
      ...existing,
      ...input,
      id: existing.id,
      code: existing.code,
      tenantId: existing.tenantId,
      governmentDivisions: input.governmentDivisions
        ? await Promise.all(
            input.governmentDivisions.map(async (divInput, idx) => {
              const divId = `gov-div-${id}-${idx}`;
              return {
                id: divId,
                code: divInput.code,
                name: divInput.name,
                nameLocal: divInput.nameLocal,
                type: divInput.type,
                environmentalAgencyType: divInput.environmentalAgencyType,
                authority: {
                  name: divInput.authority.name,
                  code: divInput.authority.code,
                  country: divInput.authority.country,
                  jurisdiction: divInput.authority.jurisdiction || "NATIONAL",
                  website: divInput.authority.website,
                },
                location: {
                  facilityId: id,
                  coordinates: divInput.location?.coordinates,
                  building: divInput.location?.building,
                  floor: divInput.location?.floor,
                  office: divInput.location?.office,
                  checkpoint: divInput.location?.checkpoint,
                  lane: divInput.location?.lane,
                },
                operatingHours: divInput.operatingHours,
                processingTimes: divInput.processingTimes ||
                  existing.governmentDivisions.find(
                    (d) => d.code === divInput.code,
                  )?.processingTimes || {
                    average: 1,
                    min: 0.5,
                    max: 2,
                  },
                services: (divInput.services || []).map((s, sIdx) => ({
                  id: `service-${id}-${idx}-${sIdx}`,
                  ...s,
                })),
                requiredDocuments: divInput.requiredDocuments || [],
                requiredCertifications: divInput.requiredCertifications || [],
                preferredPrograms: divInput.preferredPrograms || [],
                capacity: divInput.capacity,
                contact: divInput.contact || {},
                status: divInput.status || "OPERATIONAL",
                is24Hours: divInput.is24Hours || false,
                integrationIds: divInput.integrationIds || {},
                apiEndpoint: divInput.apiEndpoint,
                tags: divInput.tags || [],
                notes: divInput.notes,
                lastUpdated: new Date(),
                createdAt:
                  existing.governmentDivisions.find(
                    (d) => d.code === divInput.code,
                  )?.createdAt || new Date(),
              };
            }),
          )
        : existing.governmentDivisions,
      environmentalAgencies: input.environmentalAgencies
        ? await Promise.all(
            input.environmentalAgencies.map(async (agencyInput, idx) => {
              const agencyId = `env-agency-${id}-${idx}`;
              return {
                id: agencyId,
                code: agencyInput.code,
                name: agencyInput.name,
                type: agencyInput.type,
                authority: {
                  name: agencyInput.authority.name,
                  code: agencyInput.authority.code,
                  country: agencyInput.authority.country,
                },
                location: {
                  facilityId: id,
                  coordinates: agencyInput.location?.coordinates,
                  building: agencyInput.location?.building,
                  office: agencyInput.location?.office,
                },
                operatingHours: agencyInput.operatingHours,
                services: (agencyInput.services || []).map((s, sIdx) => ({
                  id: `env-service-${id}-${idx}-${sIdx}`,
                  ...s,
                })),
                requiredDocuments: agencyInput.requiredDocuments || [],
                environmentalStandards:
                  agencyInput.environmentalStandards || [],
                contact: agencyInput.contact || {},
                status: agencyInput.status || "OPERATIONAL",
                lastUpdated: new Date(),
              };
            }),
          )
        : existing.environmentalAgencies,
      updatedAt: new Date(),
      updatedBy: input.updatedBy,
    };

    // Save to database
    await this.saveFacilityToDatabase(updated);

    // Sync to geofence if location changed
    if (input.location && existing.moduleExtensions.geofence?.zoneId) {
      await this.syncFacilityToGeofence(updated);
    }

    // Sync to touchpoint if location changed
    if (input.location && existing.moduleExtensions.touchpoint?.touchpointId) {
      await this.syncFacilityToTouchpoint(updated);
    }

    // Publish event
    await eventBus.publish(
      createEvent("facility.updated", {
        facilityId: updated.id,
        facilityCode: updated.code,
        changes: Object.keys(input),
        tenantId: updated.tenantId,
      }),
    );

    return updated;
  }

  /**
   * Auto-create geofence zone from facility
   */
  async createGeofenceZoneFromFacility(
    facility: UnifiedFacility,
  ): Promise<string> {
    if (!facility.location.coordinates) {
      throw new Error("Facility must have coordinates to create geofence zone");
    }

    const zoneType =
      facility.moduleExtensions.geofence?.zoneType ||
      this.mapFacilityTypeToZoneType(facility.type);

    const zone = await geofenceZoneService.createZone({
      name: facility.name,
      type: zoneType,
      geometry: {
        type: facility.location.geofenceGeometry?.type || "CIRCLE",
        coordinates: facility.location.geofenceGeometry?.coordinates || {
          center: facility.location.coordinates,
          radius: facility.location.geofenceRadius || 1000,
        },
      },
      metadata: {
        expectedDwellTime:
          facility.moduleExtensions.geofence?.expectedDwellTime,
        maxDwellTime: facility.moduleExtensions.geofence?.maxDwellTime,
        operatingHours: this.mapOperatingHoursToMetadata(
          facility.operatingHours,
        ),
        contacts: this.mapContactToMetadata(facility.contact),
        facilityId: facility.id,
        facilityCode: facility.code,
        governmentDivisions: facility.governmentDivisions.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          operatingHours: d.operatingHours, // Include division hours!
        })),
      },
      tenantId: facility.tenantId,
      enabled: facility.status === "ACTIVE",
    });

    // Update facility with geofence zone ID
    await prisma.unifiedFacility.update({
      where: { id: facility.id },
      data: {
        geofenceZoneId: zone.id,
        moduleExtensions: {
          ...facility.moduleExtensions,
          geofence: {
            ...facility.moduleExtensions.geofence,
            zoneId: zone.id,
          },
        } as any,
      },
    });

    return zone.id;
  }

  /**
   * Auto-create touchpoint from facility
   */
  async createTouchpointFromFacility(
    facility: UnifiedFacility,
  ): Promise<string> {
    if (!facility.location.coordinates) {
      throw new Error("Facility must have coordinates to create touchpoint");
    }

    const touchpointType =
      facility.moduleExtensions.touchpoint?.touchpointType ||
      this.mapFacilityTypeToTouchpointType(facility.type);

    // Create touchpoint using touchpoint service
    const touchpoint = await touchpointService.createTouchpoint({
      code: facility.code,
      name: facility.name,
      nameLocal: facility.nameLocal,
      type: touchpointType,
      country: facility.location.address.country,
      address: {
        street: facility.location.address.street,
        city: facility.location.address.city,
        state: facility.location.address.state,
        postalCode: facility.location.address.postalCode,
        country: facility.location.address.country,
        region: facility.location.address.region,
      },
      coordinates: facility.location.coordinates,
      timezone: facility.location.timezone,
      borderType: facility.moduleExtensions.touchpoint?.borderType,
      connectedBorderId:
        facility.moduleExtensions.touchpoint?.connectedBorderId,
      capabilities: facility.capabilities.map((c) => ({
        id: c.id,
        type: c.type,
        name: c.name,
        description: c.description,
        available: c.available,
        capacity: c.capacity,
        unit: c.unit,
        currentUsage: c.currentUsage,
      })),
      supportedTransportModes: facility.supportedTransportModes,
      operatingHours: facility.operatingHours,
      averageProcessingTime: {
        export: facility.processingTimes.export,
        import: facility.processingTimes.import,
        transit: facility.processingTimes.transit,
        average: facility.processingTimes.average,
        min: facility.processingTimes.min,
        max: facility.processingTimes.max,
      },
      capacity: {
        dailyVehicles: facility.capacity.dailyVehicles,
        dailyShipments: facility.capacity.dailyShipments,
        dailyContainers: facility.capacity.dailyContainers,
        storageCapacity: facility.capacity.storage?.total,
      },
      currentUtilization: facility.capacity.currentUtilization || 0,
      status: facility.status === "ACTIVE" ? "OPERATIONAL" : "CLOSED",
      reliabilityScore: facility.performance.reliabilityScore || 80,
      congestionLevel: "LOW",
      averageWaitTime: facility.performance.averageWaitTime || 0,
      integrationIds: {
        facilityId: facility.id,
        facilityCode: facility.code,
      },
      tags: facility.tags,
      tenantId: facility.tenantId,
    });

    // Update facility with touchpoint ID
    await prisma.unifiedFacility.update({
      where: { id: facility.id },
      data: {
        moduleExtensions: {
          ...facility.moduleExtensions,
          touchpoint: {
            ...facility.moduleExtensions.touchpoint,
            touchpointId: touchpoint.id,
          },
        } as any,
      },
    });

    return touchpoint.id;
  }

  /**
   * Sync facility updates to geofence zone
   */
  private async syncFacilityToGeofence(
    facility: UnifiedFacility,
  ): Promise<void> {
    const zoneId = facility.moduleExtensions.geofence?.zoneId;
    if (!zoneId) return;

    await geofenceZoneService.updateZone(zoneId, facility.tenantId, {
      name: facility.name,
      geometry: {
        type: facility.location.geofenceGeometry?.type || "CIRCLE",
        coordinates: facility.location.geofenceGeometry?.coordinates || {
          center: facility.location.coordinates,
          radius: facility.location.geofenceRadius || 1000,
        },
      },
      metadata: {
        expectedDwellTime:
          facility.moduleExtensions.geofence?.expectedDwellTime,
        maxDwellTime: facility.moduleExtensions.geofence?.maxDwellTime,
        operatingHours: this.mapOperatingHoursToMetadata(
          facility.operatingHours,
        ),
        contacts: this.mapContactToMetadata(facility.contact),
        facilityId: facility.id,
        facilityCode: facility.code,
        governmentDivisions: facility.governmentDivisions.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          operatingHours: d.operatingHours,
        })),
      },
      enabled: facility.status === "ACTIVE",
    });
  }

  /**
   * Sync facility updates to touchpoint
   */
  private async syncFacilityToTouchpoint(
    facility: UnifiedFacility,
  ): Promise<void> {
    const touchpointId = facility.moduleExtensions.touchpoint?.touchpointId;
    if (!touchpointId) return;

    // Update touchpoint through touchpoint service
    // (Implementation depends on touchpoint service API)
  }

  /**
   * Map facility type to geofence zone type
   */
  private mapFacilityTypeToZoneType(type: UnifiedFacilityType): ZoneType {
    const mapping: Record<UnifiedFacilityType, ZoneType> = {
      WAREHOUSE: "WAREHOUSE",
      DISTRIBUTION_CENTER: "WAREHOUSE",
      COLD_STORAGE: "WAREHOUSE",
      BONDED_WAREHOUSE: "WAREHOUSE",
      STORAGE_YARD: "WAREHOUSE",
      BORDER_CROSSING: "BORDER_CROSSING_COMPLEX",
      CUSTOMS_OFFICE: "CUSTOMS_CLEARANCE_FACILITY",
      CUSTOMS_CLEARANCE_FACILITY: "CUSTOMS_CLEARANCE_FACILITY",
      INSPECTION_FACILITY: "INSPECTION_FACILITY",
      SEA_PORT: "PORT_TERMINAL",
      AIRPORT_CARGO: "AIRPORT_CARGO_TERMINAL",
      DRY_PORT: "DRY_PORT",
      RAILWAY_TERMINAL: "RAILWAY_TERMINAL",
      LOGISTICS_HUB: "LOGISTICS_HUB",
      MANUFACTURING_PLANT: "ORIGIN_FACILITY",
      PRODUCTION_FACILITY: "ORIGIN_FACILITY",
      REGULATORY_OFFICE: "REGULATORY_CHECKPOINT",
      GOVERNMENT_OFFICE: "REGULATORY_CHECKPOINT",
      CHECKPOINT: "REGULATORY_CHECKPOINT",
      CUSTOMER_SITE: "CUSTOMER_SITE",
      ORIGIN_FACILITY: "ORIGIN_FACILITY",
      DESTINATION_FACILITY: "DESTINATION_FACILITY",
      OTHER: "CUSTOM",
    };
    return mapping[type] || "CUSTOM";
  }

  /**
   * Map facility type to touchpoint type
   */
  private mapFacilityTypeToTouchpointType(
    type: UnifiedFacilityType,
  ): TouchpointType {
    const mapping: Record<UnifiedFacilityType, TouchpointType> = {
      WAREHOUSE: "FACILITY",
      DISTRIBUTION_CENTER: "FACILITY",
      COLD_STORAGE: "FACILITY",
      BONDED_WAREHOUSE: "BONDED_WAREHOUSE",
      STORAGE_YARD: "FACILITY",
      BORDER_CROSSING: "BORDER",
      CUSTOMS_OFFICE: "CUSTOMS_OFFICE",
      CUSTOMS_CLEARANCE_FACILITY: "CUSTOMS_OFFICE",
      INSPECTION_FACILITY: "INSPECTION_FACILITY",
      SEA_PORT: "PORT",
      AIRPORT_CARGO: "AIRPORT",
      DRY_PORT: "PORT",
      RAILWAY_TERMINAL: "FACILITY",
      LOGISTICS_HUB: "FACILITY",
      MANUFACTURING_PLANT: "FACILITY",
      PRODUCTION_FACILITY: "FACILITY",
      REGULATORY_OFFICE: "REGULATORY_OFFICE",
      GOVERNMENT_OFFICE: "REGULATORY_OFFICE",
      CHECKPOINT: "REGULATORY_OFFICE",
      CUSTOMER_SITE: "FACILITY",
      ORIGIN_FACILITY: "FACILITY",
      DESTINATION_FACILITY: "FACILITY",
      OTHER: "FACILITY",
    };
    return mapping[type] || "FACILITY";
  }

  /**
   * Helper methods
   */
  private async validateFacilityInput(
    input: FacilityCreateInput,
  ): Promise<void> {
    if (!input.code || !input.name || !input.tenantId) {
      throw new Error("Code, name, and tenantId are required");
    }

    // Check for duplicate code
    const existing = await prisma.unifiedFacility.findFirst({
      where: {
        code: input.code,
        tenantId: input.tenantId,
      },
    });

    if (existing) {
      throw new Error(`Facility with code ${input.code} already exists`);
    }
  }

  private async saveFacilityToDatabase(
    facility: UnifiedFacility,
  ): Promise<void> {
    // Save facility
    await prisma.unifiedFacility.upsert({
      where: {
        id: facility.id,
      },
      create: {
        id: facility.id,
        code: facility.code,
        name: facility.name,
        nameLocal: facility.nameLocal,
        alternateNames: facility.alternateNames || [],
        type: facility.type,
        status: facility.status,
        tenantId: facility.tenantId,
        location: facility.location as any,
        operatingHours: facility.operatingHours as any,
        constraints: facility.constraints as any,
        capabilities: facility.capabilities as any,
        supportedTransportModes: facility.supportedTransportModes as any,
        regulatoryAuthorities: facility.regulatoryAuthorities as any,
        licenses: facility.licenses as any,
        certifications: facility.certifications as any,
        capacity: facility.capacity as any,
        processingTimes: facility.processingTimes as any,
        contact: facility.contact as any,
        moduleExtensions: facility.moduleExtensions as any,
        performance: facility.performance as any,
        tags: facility.tags,
        notes: facility.notes,
        metadata: facility.metadata as any,
        createdAt: facility.createdAt,
        updatedAt: facility.updatedAt,
        createdBy: facility.createdBy,
        updatedBy: facility.updatedBy,
      },
      update: {
        name: facility.name,
        nameLocal: facility.nameLocal,
        alternateNames: facility.alternateNames || [],
        type: facility.type,
        status: facility.status,
        location: facility.location as any,
        operatingHours: facility.operatingHours as any,
        constraints: facility.constraints as any,
        capabilities: facility.capabilities as any,
        supportedTransportModes: facility.supportedTransportModes as any,
        regulatoryAuthorities: facility.regulatoryAuthorities as any,
        licenses: facility.licenses as any,
        certifications: facility.certifications as any,
        capacity: facility.capacity as any,
        processingTimes: facility.processingTimes as any,
        contact: facility.contact as any,
        moduleExtensions: facility.moduleExtensions as any,
        performance: facility.performance as any,
        tags: facility.tags,
        notes: facility.notes,
        metadata: facility.metadata as any,
        updatedAt: facility.updatedAt,
        updatedBy: facility.updatedBy,
      },
    });

    // Save government divisions
    for (const division of facility.governmentDivisions) {
      await prisma.governmentDivision.upsert({
        where: {
          id: division.id,
        },
        create: {
          id: division.id,
          code: division.code,
          name: division.name,
          nameLocal: division.nameLocal,
          type: division.type,
          environmentalAgencyType: division.environmentalAgencyType,
          facilityId: facility.id,
          tenantId: facility.tenantId,
          authorityName: division.authority.name,
          authorityCode: division.authority.code,
          authorityCountry: division.authority.country,
          authorityJurisdiction: division.authority.jurisdiction,
          authorityWebsite: division.authority.website,
          location: division.location as any,
          coordinates: division.location.coordinates as any,
          building: division.location.building,
          floor: division.location.floor,
          office: division.location.office,
          checkpoint: division.location.checkpoint,
          lane: division.location.lane,
          operatingHours: division.operatingHours as any,
          processingTimes: division.processingTimes as any,
          services: division.services as any,
          requiredDocuments: division.requiredDocuments as any,
          requiredCertifications: division.requiredCertifications as any,
          preferredPrograms: division.preferredPrograms,
          capacity: division.capacity as any,
          contact: division.contact as any,
          status: division.status,
          is24Hours: division.is24Hours || false,
          realTimeData: division.realTimeData as any,
          integrationIds: division.integrationIds as any,
          apiEndpoint: division.apiEndpoint,
          tags: division.tags,
          notes: division.notes,
          lastUpdated: division.lastUpdated,
          createdAt: division.createdAt,
        },
        update: {
          name: division.name,
          nameLocal: division.nameLocal,
          type: division.type,
          authorityName: division.authority.name,
          authorityCode: division.authority.code,
          operatingHours: division.operatingHours as any,
          processingTimes: division.processingTimes as any,
          services: division.services as any,
          status: division.status,
          is24Hours: division.is24Hours || false,
          realTimeData: division.realTimeData as any,
          tags: division.tags,
          notes: division.notes,
          lastUpdated: division.lastUpdated,
        },
      });
    }

    // Save environmental agencies
    for (const agency of facility.environmentalAgencies) {
      await prisma.environmentalAgency.upsert({
        where: {
          id: agency.id,
        },
        create: {
          id: agency.id,
          code: agency.code,
          name: agency.name,
          type: agency.type,
          facilityId: facility.id,
          tenantId: facility.tenantId,
          authorityName: agency.authority.name,
          authorityCode: agency.authority.code,
          authorityCountry: agency.authority.country,
          location: agency.location as any,
          coordinates: agency.location.coordinates as any,
          building: agency.location.building,
          office: agency.location.office,
          operatingHours: agency.operatingHours as any,
          services: agency.services as any,
          requiredDocuments: agency.requiredDocuments as any,
          environmentalStandards: agency.environmentalStandards || [],
          contact: agency.contact as any,
          status: agency.status,
          lastUpdated: agency.lastUpdated,
          createdAt: agency.lastUpdated,
        },
        update: {
          name: agency.name,
          operatingHours: agency.operatingHours as any,
          services: agency.services as any,
          status: agency.status,
          lastUpdated: agency.lastUpdated,
        },
      });
    }
  }

  private mapDatabaseToFacility(db: any): UnifiedFacility {
    return {
      id: db.id,
      code: db.code,
      name: db.name,
      nameLocal: db.nameLocal,
      alternateNames: db.alternateNames || [],
      type: db.type,
      status: db.status,
      tenantId: db.tenantId,
      location: db.location,
      operatingHours: db.operatingHours,
      constraints: db.constraints || [],
      capabilities: db.capabilities || [],
      supportedTransportModes: db.supportedTransportModes || [],
      regulatoryAuthorities: db.regulatoryAuthorities || [],
      governmentDivisions: (db.GovernmentDivision || []).map((d: any) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        nameLocal: d.nameLocal,
        type: d.type,
        environmentalAgencyType: d.environmentalAgencyType,
        authority: {
          name: d.authorityName,
          code: d.authorityCode,
          country: d.authorityCountry,
          jurisdiction: d.authorityJurisdiction || "NATIONAL",
          website: d.authorityWebsite,
        },
        location: {
          facilityId: d.facilityId,
          coordinates: d.coordinates,
          building: d.building,
          floor: d.floor,
          office: d.office,
          checkpoint: d.checkpoint,
          lane: d.lane,
        },
        operatingHours: d.operatingHours,
        processingTimes: d.processingTimes,
        services: d.services || [],
        requiredDocuments: d.requiredDocuments || [],
        requiredCertifications: d.requiredCertifications || [],
        preferredPrograms: d.preferredPrograms || [],
        capacity: d.capacity,
        contact: d.contact || {},
        status: d.status,
        is24Hours: d.is24Hours || false,
        realTimeData: d.realTimeData,
        integrationIds: d.integrationIds || {},
        apiEndpoint: d.apiEndpoint,
        tags: d.tags || [],
        notes: d.notes,
        lastUpdated: d.lastUpdated,
        createdAt: d.createdAt,
      })),
      environmentalAgencies: (db.EnvironmentalAgency || []).map((a: any) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        type: a.type,
        authority: {
          name: a.authorityName,
          code: a.authorityCode,
          country: a.authorityCountry,
        },
        location: {
          facilityId: a.facilityId,
          coordinates: a.coordinates,
          building: a.building,
          office: a.office,
        },
        operatingHours: a.operatingHours,
        services: a.services || [],
        requiredDocuments: a.requiredDocuments || [],
        environmentalStandards: a.environmentalStandards || [],
        contact: a.contact || {},
        status: a.status,
        lastUpdated: a.lastUpdated,
      })),
      licenses: db.licenses || [],
      certifications: db.certifications || [],
      capacity: db.capacity || {},
      processingTimes: db.processingTimes,
      contact: db.contact || {},
      moduleExtensions: db.moduleExtensions || {},
      performance: db.performance || {},
      tags: db.tags || [],
      notes: db.notes,
      metadata: db.metadata,
      createdAt: db.createdAt,
      updatedAt: db.updatedAt,
      createdBy: db.createdBy,
      updatedBy: db.updatedBy,
    };
  }

  private mapOperatingHoursToMetadata(operatingHours: any): any {
    return {
      from: "06:00",
      to: "22:00",
      days: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    };
  }

  private mapContactToMetadata(contact: any): any[] {
    const contacts: any[] = [];
    if (contact.primary) {
      contacts.push({
        name: contact.primary.name,
        phone: contact.primary.phone,
        role: contact.primary.role,
      });
    }
    return contacts;
  }

  private calculateDistance(
    coord1: GeoCoordinates,
    coord2: GeoCoordinates,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.latitude - coord1.latitude);
    const dLon = this.toRad(coord2.longitude - coord1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.latitude)) *
        Math.cos(this.toRad(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private subscribeToEvents(): void {
    // Subscribe to module events for reverse sync if needed
    eventBus.subscribe("geofence.zone.updated", async (event: any) => {
      // Handle reverse sync if needed
    });
  }
}

// Singleton instance
export const facilityRegistryService = new FacilityRegistryService();

// Auto-initialize
if (typeof window === "undefined") {
  facilityRegistryService.initialize().catch(console.error);
}
