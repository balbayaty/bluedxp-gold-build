/**
 * Marketplace Validation Schemas
 * Comprehensive Zod schemas for all marketplace operations
 * Input validation and sanitization
 */

import { z } from "zod";

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const LocationSchema = z.object({
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  country: z.string().min(2).max(100),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  postalCode: z.string().max(20).optional(),
  state: z.string().max(100).optional(),
});

export const PricingSchema = z.object({
  model: z.enum([
    "PER_UNIT",
    "PER_MONTH",
    "PER_DAY",
    "PER_KM",
    "PER_TON",
    "PER_PALLET",
    "FIXED_ROUTE",
    "QUOTE_BASED",
    "CUSTOM",
    "FIXED",
  ]),
  basePrice: z.number().min(0),
  currency: z.enum(["SAR", "USD", "EUR", "AED", "KWD"]).default("SAR"),
  unit: z.string().max(50).optional(),
  minimumCharge: z.number().min(0).optional(),
  fuelSurcharge: z.number().min(0).max(100).optional(), // Percentage
  discounts: z
    .object({
      volume: z.number().min(0).max(100).optional(),
      longTerm: z.number().min(0).max(100).optional(),
    })
    .optional(),
});

// ============================================================================
// LISTING SCHEMAS
// ============================================================================

export const MarketplaceServiceCategorySchema = z.enum([
  "STORAGE",
  "CROSSDOCKING",
  "TRANSPORTATION",
  "FREIGHT",
  "CONSULTING",
  "MANPOWER",
  "TRANSLATION",
  "WAREHOUSE_NETWORK",
  "CUSTOMS_CLEARANCE",
  "VALUE_ADDED_SERVICES",
  "QUALITY_SERVICES",
  "FACILITY_SERVICES",
  "TECHNOLOGY_SERVICES",
  "FINANCIAL_SERVICES",
  "OTHER",
]);

export const CreateListingSchema = z.object({
  providerId: z.string().min(1).max(255),
  category: MarketplaceServiceCategorySchema,
  listing: z.object({
    title: z.string().min(1).max(500),
    description: z.string().max(5000).optional(),
    location: LocationSchema,
    pricing: PricingSchema,
    availability: z.enum(["AVAILABLE", "LIMITED", "FULL"]).default("AVAILABLE"),
    // Category-specific fields (flexible)
    categoryData: z.record(z.any()).optional(),
    // Integration fields
    wmsWarehouseId: z.string().max(255).optional(),
    tmsCarrierId: z.string().max(255).optional(),
    facilityId: z.string().max(255).optional(),
    // Metadata
    tags: z.array(z.string().max(100)).max(20).optional(),
    certifications: z.array(z.string().max(255)).max(50).optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const UpdateListingSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  location: LocationSchema.optional(),
  pricing: PricingSchema.optional(),
  availability: z.enum(["AVAILABLE", "LIMITED", "FULL"]).optional(),
  categoryData: z.record(z.any()).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
  certifications: z.array(z.string().max(255)).max(50).optional(),
  metadata: z.record(z.any()).optional(),
});

export const SearchListingsSchema = z.object({
  category: MarketplaceServiceCategorySchema.optional(),
  providerId: z.string().max(255).optional(),
  location: z
    .object({
      city: z.string().max(100).optional(),
      country: z.string().max(100).optional(),
      radius: z.number().min(0).max(10000).optional(), // km
    })
    .optional(),
  priceRange: z
    .object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
      currency: z.enum(["SAR", "USD", "EUR", "AED", "KWD"]).default("SAR"),
    })
    .optional(),
  rating: z
    .object({
      min: z.number().min(0).max(5),
    })
    .optional(),
  availability: z.enum(["AVAILABLE", "LIMITED", "FULL"]).optional(),
  tags: z.array(z.string().max(100)).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// ============================================================================
// PROVIDER SCHEMAS
// ============================================================================

export const CreateProviderSchema = z.object({
  name: z.string().min(1).max(500),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(100).optional(),
  website: z.string().url().max(500).optional(),
  businessType: z.string().max(100).optional(),
  registrationNumber: z.string().max(255).optional(),
  taxId: z.string().max(255).optional(),
  address: LocationSchema.optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
});

export const UpdateProviderSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(100).optional(),
  website: z.string().url().max(500).optional(),
  businessType: z.string().max(100).optional(),
  address: LocationSchema.optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
});

// ============================================================================
// BOOKING SCHEMAS
// ============================================================================

export const CreateBookingSchema = z.object({
  customerId: z.string().min(1).max(255),
  customerName: z.string().min(1).max(500),
  serviceId: z.string().min(1).max(255),
  bookingDetails: z.object({
    serviceDetails: z.record(z.any()).optional(),
    pricing: PricingSchema.optional(),
    schedule: z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime().optional(),
      flexible: z.boolean().default(false),
    }),
    location: LocationSchema.optional(),
    requirements: z.record(z.any()).optional(),
    notes: z.string().max(5000).optional(),
    quantity: z.number().min(1).optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const UpdateBookingSchema = z.object({
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "REJECTED",
    ])
    .optional(),
  pricing: PricingSchema.optional(),
  schedule: z
    .object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      flexible: z.boolean().optional(),
    })
    .optional(),
  location: LocationSchema.optional(),
  requirements: z.record(z.any()).optional(),
  notes: z.string().max(5000).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "PARTIAL", "REFUNDED"]).optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// REVIEW SCHEMAS
// ============================================================================

export const CreateReviewSchema = z.object({
  bookingId: z.string().min(1).max(255),
  listingId: z.string().min(1).max(255),
  rating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// SEARCH & FILTER SCHEMAS
// ============================================================================

export const MarketplaceSearchFiltersSchema = z.object({
  category: MarketplaceServiceCategorySchema.optional(),
  location: z
    .object({
      city: z.string().max(100).optional(),
      country: z.string().max(100).optional(),
      coordinates: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
      radius: z.number().min(0).max(10000).optional(),
    })
    .optional(),
  priceRange: z
    .object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
      currency: z.enum(["SAR", "USD", "EUR", "AED", "KWD"]).default("SAR"),
    })
    .optional(),
  rating: z
    .object({
      min: z.number().min(0).max(5),
    })
    .optional(),
  availability: z.enum(["AVAILABLE", "LIMITED", "FULL"]).optional(),
  tags: z.array(z.string().max(100)).optional(),
  providerId: z.string().max(255).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function sanitizeString(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/[<>]/g, "") // Remove angle brackets
    .trim();
}

export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): T {
  const validated = schema.parse(data);

  // Additional sanitization for strings
  if (typeof validated === "object" && validated !== null) {
    const sanitized = { ...validated };
    for (const key in sanitized) {
      if (typeof sanitized[key] === "string") {
        sanitized[key] = sanitizeString(sanitized[key]);
      }
    }
    return sanitized as T;
  }

  return validated;
}
