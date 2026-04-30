/**
 * Schrödinger's Truck Quantum Logistics Service
 *
 * Models shipment uncertainty using quantum-inspired states
 * Integrates seamlessly with existing TMS, Event Store, Knowledge Base, and WhatsApp
 *
 * @module schrodingers-truck
 */

import type { Shipment } from "@/types/tms";

// ============================================================================
// QUANTUM STATE DEFINITIONS
// ============================================================================

/**
 * The three quantum states a shipment can be in
 * - COMMITTED: High probability of on-time delivery (>70%)
 * - CONTINGENT: Conditional on external factors (40-70%)
 * - PHANTOM: High risk of no-show or significant delay (<40%)
 */
export type QuantumState = "COMMITTED" | "CONTINGENT" | "PHANTOM";

/**
 * State definitions with thresholds, colors, and recommended actions
 */
export const STATE_DEFINITIONS = {
  COMMITTED: {
    description: "High probability of on-time delivery",
    probabilityThreshold: 0.7, // >70% on-time probability
    color: "#22c55e", // Green
    icon: "✓",
    actions: ["track", "notify_customer"],
    riskLevel: "LOW" as const,
  },
  CONTINGENT: {
    description: "Conditional on external factors",
    probabilityThreshold: 0.4, // 40-70% on-time probability
    color: "#f59e0b", // Amber
    icon: "⚠",
    actions: ["track", "alert_ops", "prepare_backup"],
    riskLevel: "MEDIUM" as const,
  },
  PHANTOM: {
    description: "High risk of no-show or significant delay",
    probabilityThreshold: 0.0, // <40% on-time probability
    color: "#ef4444", // Red
    icon: "✗",
    actions: ["escalate", "contact_driver", "activate_backup"],
    riskLevel: "HIGH" as const,
  },
} as const;

// ============================================================================
// CORE DATA MODELS
// ============================================================================

/**
 * Complete quantum state for a shipment
 * Tracks probabilities, factors, and collapse history
 */
export interface ShipmentQuantumState {
  id: string;
  shipmentId: string;
  tenantId: string;

  // Current state
  currentState: QuantumState;

  // Probability distribution (must sum to 1.0)
  probabilities: {
    onTime: number; // 0-1: Probability of on-time delivery
    delayed: number; // 0-1: Probability of delay (but will arrive)
    noShow: number; // 0-1: Probability of no-show
  };

  // Contributing factors (each 0-1, where 1 = best case, 0 = worst case)
  factors: {
    driverReliability: number; // Historical on-time rate for this driver
    routeComplexity: number; // Border crossings, traffic patterns, distance
    weatherRisk: number; // Current and forecasted weather impact
    trafficRisk: number; // Real-time traffic conditions
    customerRisk: number; // Customer's receiving reliability
    cargoSensitivity: number; // Time/temperature sensitivity of cargo
    vehicleCondition: number; // Vehicle maintenance status
    timeOfDay: number; // Rush hour, night driving factors
  };

  // Factor weights (learned over time, sum to 1.0)
  factorWeights: {
    driverReliability: number;
    routeComplexity: number;
    weatherRisk: number;
    trafficRisk: number;
    customerRisk: number;
    cargoSensitivity: number;
    vehicleCondition: number;
    timeOfDay: number;
  };

  // Waveform collapse history
  collapseHistory: CollapseEvent[];

  // Collapse metadata
  collapsed: boolean;
  collapsedState: QuantumState | null;
  collapsedAt: Date | null;
  collapseTrigger: CollapseTrigger | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Confidence metrics
  overallConfidence: number; // 0-1: How confident we are in probabilities
  lastObservation: Date; // When we last got real data
  observationCount: number; // How many observations we have

  // Integration metadata
  journeyId?: string; // Link to Journey Analysis
  lifecycleId?: string; // Link to Process Lifecycle
  rootCauseAnalysisId?: string; // Link to Root Cause Analysis

  // AI Insights (from Knowledge Base)
  aiInsights?: {
    recommendations?: string[];
    riskFactors?: string[];
    similarHistoricalCases?: string[];
    predictedOutcome?: string;
  };
}

/**
 * Event that triggers waveform collapse
 * Records state transition for learning
 */
export interface CollapseEvent {
  id: string;
  timestamp: Date;
  trigger: CollapseTrigger;
  previousState: QuantumState;
  previousProbabilities: { onTime: number; delayed: number; noShow: number };
  newState: QuantumState;
  newProbabilities: { onTime: number; delayed: number; noShow: number };
  triggerData: Record<string, any>; // Data that caused collapse
  confidence: number;
  learningSignal?: number; // -1 to +1: How much we learned from this
}

/**
 * Triggers that can cause waveform collapse
 */
export type CollapseTrigger =
  | "WHATSAPP_PING" // Driver responded to WhatsApp message
  | "GEOFENCE_ENTRY" // Entered expected zone
  | "GEOFENCE_EXIT" // Left expected zone
  | "GPS_UPDATE" // Regular GPS position update
  | "MANUAL_UPDATE" // Operations manually updated status
  | "TIMEOUT" // No response within expected time
  | "WEATHER_ALERT" // Significant weather change
  | "TRAFFIC_ALERT" // Significant traffic change
  | "CUSTOMER_CONFIRM" // Customer confirmed/denied readiness
  | "VEHICLE_DIAGNOSTIC" // Vehicle sent diagnostic data
  | "JOURNEY_TOUCHPOINT" // Journey Analysis touchpoint event
  | "ROOT_CAUSE_UPDATE" // Root Cause Analysis update
  | "EXCEPTION_DETECTED"; // Exception detected in shipment

// ============================================================================
// FACTOR CALCULATION INPUTS
// ============================================================================

/**
 * Driver information for reliability calculation
 */
export interface DriverInfo {
  id: string;
  name?: string;
  phone?: string;
  license?: string;
  vehicleId?: string;
  historicalStats?: {
    totalDeliveries: number;
    onTimeDeliveries: number;
    recentOnTimeRate?: number; // Last 30 days
    averageDelay?: number; // hours
    reliabilityScore?: number; // 0-1
  };
}

/**
 * Route information for complexity calculation
 */
export interface RouteInfo {
  id?: string;
  distanceKm: number;
  estimatedDurationHours: number;
  waypoints?: Array<{ lat: number; lng: number; name?: string }>;
  borderCrossings?: number;
  checkpoints?: number;
  tollBooths?: number;
  historicalStats?: {
    onTimeRate: number;
    averageDelay: number;
    delayVariance: number;
  };
}

/**
 * Weather forecast data
 */
export interface WeatherForecast {
  location: { lat: number; lng: number };
  date: Date;
  condition:
    | "clear"
    | "cloudy"
    | "rain"
    | "heavy_rain"
    | "sandstorm"
    | "fog"
    | "wind"
    | "extreme_heat";
  temperature: number;
  windSpeed?: number;
  visibility?: number;
  severity?: "low" | "medium" | "high" | "critical";
}

/**
 * Traffic condition data
 */
export interface TrafficCondition {
  location: { lat: number; lng: number };
  timestamp: Date;
  congestionLevel: "none" | "light" | "moderate" | "heavy" | "severe";
  delayMinutes?: number;
  incident?: boolean;
  incidentType?: "accident" | "construction" | "weather" | "event" | "other";
}

/**
 * Customer reliability data
 */
export interface CustomerInfo {
  id: string;
  name?: string;
  historicalStats?: {
    totalReceipts: number;
    onTimeReceipts: number;
    averageDelay?: number;
    reliabilityScore?: number;
  };
}

/**
 * Cargo sensitivity information
 */
export interface CargoInfo {
  type?: string;
  temperatureSensitive?: boolean;
  timeSensitive?: boolean;
  fragile?: boolean;
  hazardous?: boolean;
  perishable?: boolean;
  value?: number;
  specialHandling?: string[];
}

/**
 * Vehicle condition data
 */
export interface VehicleInfo {
  id: string;
  type?: string;
  maintenanceStatus?: "excellent" | "good" | "fair" | "poor";
  lastMaintenance?: Date;
  mileage?: number;
  diagnosticData?: {
    engineHealth?: number;
    tireCondition?: number;
    brakeCondition?: number;
    overallScore?: number;
  };
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

/**
 * Main service interface for Schrödinger's Truck
 */
export interface SchrodingersTruckService {
  /**
   * Initialize quantum state for a new shipment
   */
  initializeQuantumState(
    shipment: Shipment,
    driver?: DriverInfo,
    route?: RouteInfo,
    cargo?: CargoInfo,
  ): Promise<ShipmentQuantumState>;

  /**
   * Get current quantum state for a shipment
   */
  getQuantumState(shipmentId: string): Promise<ShipmentQuantumState | null>;

  /**
   * Update quantum state based on observation
   */
  updateQuantumState(
    shipmentId: string,
    trigger: CollapseTrigger,
    triggerData?: Record<string, any>,
  ): Promise<ShipmentQuantumState>;

  /**
   * Get collapse history for a shipment
   */
  getCollapseHistory(
    shipmentId: string,
    limit?: number,
  ): Promise<CollapseEvent[]>;

  /**
   * Get quantum state history (time series)
   */
  getStateHistory(
    shipmentId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<ShipmentQuantumState[]>;

  /**
   * Subscribe to quantum state updates
   */
  subscribeToUpdates(
    shipmentId: string,
    callback: (state: ShipmentQuantumState) => void,
  ): () => void;

  /**
   * Get factor weights (learned over time)
   */
  getFactorWeights(tenantId: string): Promise<Record<string, number>>;

  /**
   * Update factor weights based on learning
   */
  updateFactorWeights(
    tenantId: string,
    weights: Partial<Record<string, number>>,
  ): Promise<void>;

  /**
   * Get AI insights for quantum state
   */
  getAIInsights(
    shipmentId: string,
  ): Promise<ShipmentQuantumState["aiInsights"]>;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

/**
 * WhatsApp message for integration
 */
export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: Date;
  type?: "text" | "location" | "image" | "voice";
  metadata?: Record<string, any>;
}

/**
 * Geofence event for integration
 */
export interface GeofenceEvent {
  id: string;
  shipmentId: string;
  zoneId: string;
  zoneName: string;
  eventType: "entry" | "exit" | "dwell";
  location: { lat: number; lng: number };
  timestamp: Date;
  dwellTime?: number; // seconds
}

/**
 * GPS update for integration
 */
export interface GPSUpdate {
  shipmentId: string;
  location: { lat: number; lng: number; accuracy?: number };
  timestamp: Date;
  speed?: number;
  heading?: number;
  onTrack?: boolean;
  estimatedArrival?: Date;
}

/**
 * Weather alert for integration
 */
export interface WeatherAlert {
  id: string;
  location: { lat: number; lng: number };
  condition: WeatherForecast["condition"];
  severity: WeatherForecast["severity"];
  timestamp: Date;
  forecast?: WeatherForecast[];
}

/**
 * Traffic alert for integration
 */
export interface TrafficAlert {
  id: string;
  location: { lat: number; lng: number };
  congestionLevel: TrafficCondition["congestionLevel"];
  delayMinutes: number;
  timestamp: Date;
  incident?: TrafficCondition["incidentType"];
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Default factor weights (used when no learning data available)
 */
export const DEFAULT_FACTOR_WEIGHTS: ShipmentQuantumState["factorWeights"] = {
  driverReliability: 0.25, // Most important
  routeComplexity: 0.2,
  weatherRisk: 0.15,
  trafficRisk: 0.15,
  customerRisk: 0.1,
  cargoSensitivity: 0.05,
  vehicleCondition: 0.05,
  timeOfDay: 0.05,
};

/**
 * Validation helper
 */
export function validateProbabilities(
  probabilities: ShipmentQuantumState["probabilities"],
): boolean {
  const sum =
    probabilities.onTime + probabilities.delayed + probabilities.noShow;
  return Math.abs(sum - 1.0) < 0.001; // Allow small floating point errors
}

/**
 * Normalize probabilities to sum to 1.0
 */
export function normalizeProbabilities(
  probabilities: ShipmentQuantumState["probabilities"],
): ShipmentQuantumState["probabilities"] {
  const sum =
    probabilities.onTime + probabilities.delayed + probabilities.noShow;
  if (sum === 0) {
    return { onTime: 0.33, delayed: 0.33, noShow: 0.34 };
  }
  return {
    onTime: probabilities.onTime / sum,
    delayed: probabilities.delayed / sum,
    noShow: probabilities.noShow / sum,
  };
}
