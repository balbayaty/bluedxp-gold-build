/**
 * Corridor Intelligence Types
 *
 * Types for corridor intelligence system
 * Saudi-Kuwait, Saudi-Syria corridors
 *
 * @module corridors
 */

// ============================================================================
// CORRIDOR TYPES
// ============================================================================

/**
 * Corridor type
 */
export type CorridorType = "SAUDI_KUWAIT" | "SAUDI_SYRIA" | "CUSTOM";

/**
 * Touchpoint type
 */
export type TouchpointType =
  | "WAREHOUSE"
  | "BORDER_CROSSING"
  | "CUSTOMS"
  | "CHECKPOINT"
  | "REST_AREA"
  | "FUEL_STATION"
  | "CUSTOMER_SITE";

/**
 * Touchpoint
 */
export interface Touchpoint {
  id: string;
  name: string;
  type: TouchpointType;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  expectedDwellTime: number; // minutes
  maxDwellTime: number; // minutes
  operatingHours?: {
    from: string;
    to: string;
    days: string[];
  };
  metadata?: Record<string, any>;
}

/**
 * Corridor
 */
export interface Corridor {
  id: string;
  name: string;
  type: CorridorType;
  origin: {
    location: { lat: number; lng: number; address?: string };
    country: string;
  };
  destination: {
    location: { lat: number; lng: number; address?: string };
    country: string;
  };
  touchpoints: Touchpoint[];
  distance: number; // km
  estimatedTransitTime: number; // hours
  routes: Array<{
    path: string;
    distance: number;
    transitTime: number;
    touchpoints: string[];
  }>;
}

/**
 * Delay pattern
 */
export interface DelayPattern {
  touchpointId: string;
  averageDelay: number; // minutes
  peakDelay: number; // minutes
  peakTimes: string[];
  causes: string[];
  frequency: number; // 0-1
}

/**
 * Corridor analysis
 */
export interface CorridorAnalysis {
  corridorId: string;
  period: { from: Date; to: Date };
  totalShipments: number;
  averageTransitTime: number;
  onTimePercentage: number;
  delayPatterns: DelayPattern[];
  bottlenecks: Array<{
    touchpointId: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    impact: number;
    recommendations: string[];
  }>;
  optimizationOpportunities: Array<{
    action: string;
    savings: string;
    cost: number | string;
    priority: "LOW" | "MEDIUM" | "HIGH";
  }>;
}

/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
  id: string;
  type:
    | "PRE_CLEARANCE"
    | "TRUSTED_TRADER"
    | "ROUTE_OPTIMIZATION"
    | "TIMING_OPTIMIZATION";
  description: string;
  expectedSavings: string;
  cost: number | string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  implementation: string[];
}
