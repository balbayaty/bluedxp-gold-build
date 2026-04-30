import { prisma } from "../database/prismaClient";
import type {
  StorageLocation,
  StorageLocationRequest,
  StorageLocationFilters,
  StorageRestrictions,
} from "@/types/warehouseLocation";
import type { Prisma } from "@prisma/client";

export const warehouseLocationService = {
  /**
   * List Storage Locations (Mapped from Facilities)
   */
  async listLocations(
    filters?: StorageLocationFilters,
  ): Promise<StorageLocation[]> {
    const where: Prisma.FacilityWhereInput = {};

    if (filters) {
      if (filters.searchQuery) {
        where.OR = [
          { name: { contains: filters.searchQuery, mode: "insensitive" } },
          { code: { contains: filters.searchQuery, mode: "insensitive" } },
          { city: { contains: filters.searchQuery, mode: "insensitive" } },
        ];
      }
      if (filters.countryCode) where.countryCode = filters.countryCode;

      // Note: Some filters might need more complex mapping if they are in metadata
    }

    const facilities = await prisma.facility.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return facilities.map(mapFacilityToStorageLocation);
  },

  /**
   * Create a new Storage Location (Facility)
   */
  async createLocation(data: StorageLocationRequest): Promise<StorageLocation> {
    // Store extra constraints in metadata
    const metadata = {
      storageRestrictions: data.storageRestrictions,
      regulatoryNotes: data.regulatoryNotes,
    };

    const facility = await prisma.facility.create({
      data: {
        name: data.name,
        type: data.type,
        code: data.code || `LOC-${Date.now()}`, // Fallback if no code provided
        tenantId: data.tenantId || "default-tenant", // Use provided tenant or default

        // Location Info
        address: data.location.address,
        city: data.location.city,
        country: data.location.country,
        countryCode: data.location.countryCode,
        coordinates: data.location.coordinates
          ? {
              lat: data.location.coordinates.latitude,
              lng: data.location.coordinates.longitude,
            }
          : Prisma.JsonNull,

        // Compliance
        regulatoryAuthority: data.regulatoryAuthority,
        fireSuppressionType: data.fireSuppressionType,
        complianceStatus: data.complianceStatus,
        lastInspection: data.lastInspection
          ? new Date(data.lastInspection)
          : null,

        metadata: metadata as Prisma.JsonObject,
      },
    });

    return mapFacilityToStorageLocation(facility);
  },

  /**
   * Update a Storage Location
   */
  async updateLocation(
    id: string,
    data: Partial<StorageLocationRequest>,
  ): Promise<StorageLocation> {
    // Fetch existing logic to merge metadata if needed
    const existing = await prisma.facility.findUnique({ where: { id } });
    if (!existing) throw new Error(`Location ${id} not found`);

    const existingMetadata = (existing.metadata as Record<string, any>) || {};

    const newMetadata = {
      ...existingMetadata,
      ...(data.storageRestrictions && {
        storageRestrictions: data.storageRestrictions,
      }),
      ...(data.regulatoryNotes && { regulatoryNotes: data.regulatoryNotes }),
    };

    const facility = await prisma.facility.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type }),
        ...(data.code && { code: data.code }),

        ...(data.location?.address && { address: data.location.address }),
        ...(data.location?.city && { city: data.location.city }),
        ...(data.location?.country && { country: data.location.country }),
        ...(data.location?.countryCode && {
          countryCode: data.location.countryCode,
        }),
        ...(data.location?.coordinates && {
          coordinates: {
            lat: data.location.coordinates.latitude,
            lng: data.location.coordinates.longitude,
          },
        }),

        ...(data.regulatoryAuthority && {
          regulatoryAuthority: data.regulatoryAuthority,
        }),
        ...(data.fireSuppressionType && {
          fireSuppressionType: data.fireSuppressionType,
        }),
        ...(data.complianceStatus && {
          complianceStatus: data.complianceStatus,
        }),
        ...(data.lastInspection && {
          lastInspection: new Date(data.lastInspection),
        }),

        metadata: newMetadata as Prisma.JsonObject,
      },
    });

    return mapFacilityToStorageLocation(facility);
  },
};

// Helper: Mapper
function mapFacilityToStorageLocation(facility: any): StorageLocation {
  const metadata = (facility.metadata as Record<string, any>) || {};
  const coords = (facility.coordinates as any) || {};

  return {
    id: facility.id,
    name: facility.name,
    type: facility.type as any,
    code: facility.code,
    active: facility.status === "ACTIVE",

    location: {
      address: facility.address || "",
      city: facility.city || "",
      cityCode: "", // Not stored in DB explicitly
      country: facility.country || "",
      countryCode: facility.countryCode || "",
      coordinates: {
        latitude: coords.lat || 0,
        longitude: coords.lng || 0,
      },
    },

    regulatoryAuthority: facility.regulatoryAuthority || "",
    fireSuppressionType: facility.fireSuppressionType as any,

    complianceStatus: (facility.complianceStatus ||
      "Pending Inspection") as any,
    lastInspection: facility.lastInspection
      ? facility.lastInspection.toISOString()
      : new Date().toISOString(),

    // Restore from Metadata
    storageRestrictions: metadata.storageRestrictions || {
      hazardClassesAllowed: [],
      hazardClassLimits: {},
      maximumQuantity: 0,
      temperatureControlled: false,
      specialRequirements: [],
    },
    regulatoryNotes: metadata.regulatoryNotes || "",

    // Defaults
    createdAt: facility.createdAt.toISOString(),
    updatedAt: facility.updatedAt.toISOString(),
  };
}
