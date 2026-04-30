/**
 * Geofence System Types
 *
 * Types for geofence system
 * Zone management, entry/exit detection
 *
 * @module geofence
 */

// ============================================================================
// GEOFENCE TYPES
// ============================================================================

/**
 * Zone type - Professional industry terminology
 * Based on Saudi-Kuwait journey analysis and international logistics standards
 */
export type ZoneType =
  // Origin & Destination
  | "ORIGIN_FACILITY" // Shipper plant, warehouse, manufacturing facility
  | "DESTINATION_FACILITY" // Customer warehouse, delivery location
  | "WAREHOUSE" // Distribution center, storage facility
  | "CUSTOMER_SITE" // End customer delivery location

  // Border & Customs (Professional Terminology)
  | "BORDER_ENTRY_POINT" // Entry point into country (e.g., Saudi Customs Entry)
  | "BORDER_EXIT_POINT" // Exit point from country (e.g., Saudi Customs Exit)
  | "CUSTOMS_CLEARANCE_FACILITY" // Customs clearance processing area
  | "CUSTOMS_INSPECTION_AREA" // Physical inspection zone
  | "NO_MANS_LAND" // Neutral zone between borders
  | "BORDER_CROSSING_COMPLEX" // Complete border crossing facility

  // Regulatory & Compliance
  | "REGULATORY_CHECKPOINT" // Government agency checkpoint (TGA, SFDA, etc.)
  | "INSPECTION_FACILITY" // Physical inspection facility
  | "DOCUMENTATION_CENTER" // Documentation processing center
  | "COMPLIANCE_VERIFICATION_POINT" // Compliance verification checkpoint

  // Transportation Infrastructure
  | "PORT_TERMINAL" // Sea port terminal
  | "AIRPORT_CARGO_TERMINAL" // Airport cargo facility
  | "RAILWAY_TERMINAL" // Railway freight terminal
  | "DRY_PORT" // Inland port
  | "LOGISTICS_HUB" // Multi-modal logistics hub

  // Route Infrastructure
  | "HIGHWAY_TOLL_PLAZA" // Toll collection point
  | "WEIGH_STATION" // Vehicle weighing station
  | "REST_AREA" // Driver rest area
  | "FUEL_STATION" // Fueling station
  | "SERVICE_AREA" // Service/rest area with facilities

  // Security & Restricted
  | "SECURITY_CHECKPOINT" // Security screening point
  | "RESTRICTED_AREA" // Restricted/secure area
  | "QUARANTINE_ZONE" // Quarantine inspection area
  | "HAZMAT_HANDLING_AREA" // Dangerous goods handling zone

  // Administrative
  | "CITY_LIMIT" // City boundary marker
  | "PROVINCE_BOUNDARY" // Province/state boundary
  | "COUNTRY_BOUNDARY" // Country boundary marker
  | "FREE_ZONE" // Free trade zone

  // Custom
  | "CUSTOM"; // Custom zone type

/**
 * Geofence zone
 */
export interface GeofenceZone {
  id: string;
  name: string;
  type: ZoneType;
  geometry: {
    type: "POLYGON" | "CIRCLE";
    coordinates:
      | number[][]
      | { center: { lat: number; lng: number }; radius: number };
  };
  metadata: {
    expectedDwellTime?: number; // minutes
    maxDwellTime?: number; // minutes
    operatingHours?: {
      from: string;
      to: string;
      days: string[];
    };
    contacts?: Array<{ name: string; phone: string; role: string }>;
  };
  tenantId: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Geofence event
 */
export interface GeofenceEvent {
  id: string;
  zoneId: string;
  shipmentId?: string;
  vehicleId?: string;
  eventType:
    | "ZONE_ENTRY"
    | "ZONE_EXIT"
    | "DWELL_TIME_WARNING"
    | "DWELL_TIME_EXCEEDED"
    | "ROUTE_DEVIATION"
    | "SPEED_VIOLATION"
    | "UNEXPECTED_STOP";
  location: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
  dwellTime?: number; // minutes
  metadata?: Record<string, unknown>;
}

/**
 * Dwell time tracking
 */
export interface DwellTimeTracking {
  zoneId: string;
  shipmentId: string;
  entryTime: Date;
  exitTime?: Date;
  dwellTime?: number; // minutes
  status: "ACTIVE" | "COMPLETED" | "EXCEEDED";
}
