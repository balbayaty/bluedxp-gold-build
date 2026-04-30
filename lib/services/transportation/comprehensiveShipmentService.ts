/**
 * Comprehensive Shipment Service
 *
 * Complete shipment management with all capabilities:
 * - Route comparison and optimization
 * - Pricing intelligence
 * - CO2 emissions calculation
 * - Transit time prediction
 * - AI insights
 * - Journey workflow integration
 * - Root cause analysis integration
 */

import type {
  Shipment,
  RouteComparison,
  PricingIntelligence,
  CO2EmissionsCalculation,
  TransitTimePrediction,
  TransportationAIInsights,
  Location,
  TransportMode,
  ShipmentType,
} from "@/types/tms";
import { routeComparisonService } from "./routeComparisonService";
import { pricingIntelligenceService } from "./pricingIntelligenceService";
import { co2EmissionsService } from "./co2EmissionsService";
import { transitTimePredictionService } from "./transitTimePredictionService";
import { transportationAIInsightsService } from "./aiInsightsService";
import { journeyAnalysisService } from "./journeyAnalysisService";
import type { JourneyAnalysis } from "./journeyAnalysisService";
import { initializeQuantumStateForShipment } from "@/lib/services/schrodingers-truck/transportation-integration";
import { eventBus, createEvent } from "@/lib/services/event-bus";

export interface ComprehensiveShipmentData {
  shipment: Shipment;
  routeComparison?: RouteComparison;
  pricingIntelligence?: PricingIntelligence;
  emissions?: CO2EmissionsCalculation;
  transitTimePrediction?: TransitTimePrediction;
  aiInsights?: TransportationAIInsights;
  journeyAnalysis?: JourneyAnalysis;
  journeyId?: string;
  lifecycleId?: string;
  rootCauseAnalysisId?: string;
  etwId?: string; // ETW (e-Waybill) ID if auto-created
}

export interface CreateShipmentRequest {
  // Basic shipment data
  origin: Location;
  destination: Location;
  type: ShipmentType;
  mode: TransportMode;
  cargo: {
    items: Shipment["items"];
    totalWeight: number;
    totalVolume: number;
    totalValue: number;
    currency: string;
  };

  // Optional enhancements
  options?: {
    generateRouteComparison?: boolean;
    generatePricingIntelligence?: boolean;
    calculateEmissions?: boolean;
    predictTransitTime?: boolean;
    generateAIInsights?: boolean;
    includeJourneyAnalysis?: boolean;
    linkToJourney?: boolean;
    linkToLifecycle?: boolean;
  };

  // Dates
  pickupDate?: Date | string;
  estimatedDelivery?: Date | string;

  // Carrier
  carrierId?: string;
  carrierName?: string;

  // Special requirements
  temperatureControl?: Shipment["temperatureControl"];
  hazmat?: Shipment["hazmat"];
  specialHandling?: Shipment["specialHandling"];

  // Metadata
  createdBy: string;
  tenantId?: string;
}

export class ComprehensiveShipmentService {
  /**
   * Create comprehensive shipment with all intelligence
   */
  async createComprehensiveShipment(
    request: CreateShipmentRequest,
  ): Promise<ComprehensiveShipmentData> {
    const {
      origin,
      destination,
      type,
      mode,
      cargo,
      options,
      createdBy,
      tenantId,
    } = request;

    // Create base shipment
    const shipment: Shipment = {
      id: `SH-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      shipmentNumber: `SH-${Date.now()}`,
      type,
      mode,
      status: "DRAFT",
      origin,
      destination,
      items: cargo.items,
      totalWeight: cargo.totalWeight,
      totalVolume: cargo.totalVolume,
      totalValue: cargo.totalValue,
      currency: cargo.currency,
      documents: [],
      trackingEvents: [],
      exceptions: [],
      alerts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
      tenantId,
      pickupDate: request.pickupDate,
      estimatedDelivery: request.estimatedDelivery,
      carrierId: request.carrierId,
      carrierName: request.carrierName,
      temperatureControl: request.temperatureControl,
      hazmat: request.hazmat,
      specialHandling: request.specialHandling,
    };

    const comprehensiveData: ComprehensiveShipmentData = { shipment };

    // Generate route comparison if requested
    if (options?.generateRouteComparison) {
      comprehensiveData.routeComparison =
        await routeComparisonService.compareRoutes({
          origin,
          destination,
          cargo: {
            weight: cargo.totalWeight,
            volume: cargo.totalVolume,
            value: cargo.totalValue,
            type,
          },
          preferences: {
            prioritize: "BALANCED",
          },
        });

      // Update shipment with recommended route
      if (comprehensiveData.routeComparison.recommended) {
        shipment.route = comprehensiveData.routeComparison.recommended.route;
        shipment.carrierId =
          comprehensiveData.routeComparison.recommended.carrierId;
        shipment.carrierName =
          comprehensiveData.routeComparison.recommended.carrierName;
      }
    }

    // Generate pricing intelligence if requested
    if (options?.generatePricingIntelligence) {
      comprehensiveData.pricingIntelligence =
        await pricingIntelligenceService.getPricingIntelligence({
          origin,
          destination,
          mode,
          type,
          cargo: {
            weight: cargo.totalWeight,
            volume: cargo.totalVolume,
            value: cargo.totalValue,
          },
        });

      // Update shipment with pricing intelligence
      shipment.pricingIntelligence = {
        marketRate: comprehensiveData.pricingIntelligence.marketRate,
        marketRateIndex:
          comprehensiveData.pricingIntelligence.marketRateIndex?.indexValue,
        rateTrend: comprehensiveData.pricingIntelligence.rateTrend?.direction,
        rateChange: comprehensiveData.pricingIntelligence.rateTrend?.change,
        benchmarkRate: comprehensiveData.pricingIntelligence.benchmarkRate,
        savings:
          comprehensiveData.pricingIntelligence.comparison?.vsMarket
            ?.difference,
        savingsPercentage:
          comprehensiveData.pricingIntelligence.comparison?.vsMarket
            ?.percentage,
      };
    }

    // Calculate emissions if requested
    if (options?.calculateEmissions && shipment.route) {
      comprehensiveData.emissions =
        await co2EmissionsService.calculateEmissions({
          origin,
          destination,
          distance: shipment.route.distance || 0,
          mode,
          cargo: {
            weight: cargo.totalWeight,
            volume: cargo.totalVolume,
          },
        });

      // Update shipment with emissions
      shipment.emissions = {
        totalCO2e: comprehensiveData.emissions.totalCO2e,
        co2ePerKg: comprehensiveData.emissions.totalCO2e / cargo.totalWeight,
        co2ePerKm:
          comprehensiveData.emissions.totalCO2e /
          (shipment.route.distance || 1),
        calculationMethod: comprehensiveData.emissions.calculationMethod.method,
        emissionFactors: comprehensiveData.emissions.breakdown.map((b) => ({
          mode: b.mode as TransportMode,
          factor: b.emissionFactor,
          source: b.source,
        })),
      };
    }

    // Predict transit time if requested
    if (options?.predictTransitTime) {
      comprehensiveData.transitTimePrediction =
        await transitTimePredictionService.predictTransitTime({
          origin,
          destination,
          mode,
          waypoints: shipment.route?.waypoints,
          cargo: {
            weight: cargo.totalWeight,
            volume: cargo.totalVolume,
          },
          date: request.pickupDate,
        });

      // Update shipment with transit time
      shipment.transitTime = {
        estimated:
          comprehensiveData.transitTimePrediction.predictions.realistic,
        scheduled:
          comprehensiveData.transitTimePrediction.predictions.realistic,
        onTimePerformance: 0, // Will be calculated after delivery
      };

      // Update estimated delivery if not provided
      if (!shipment.estimatedDelivery && request.pickupDate) {
        const pickupDate = new Date(request.pickupDate);
        pickupDate.setHours(
          pickupDate.getHours() +
            comprehensiveData.transitTimePrediction.predictions.realistic,
        );
        shipment.estimatedDelivery = pickupDate.toISOString();
      }
    }

    // Generate journey analysis if requested
    if (options?.includeJourneyAnalysis) {
      comprehensiveData.journeyAnalysis =
        await journeyAnalysisService.analyzeJourney({
          shipment,
          includeRootCauseAnalysis: true,
          includeOptimization: true,
          includePredictions: true,
        });
    }

    // Generate AI insights if requested
    if (options?.generateAIInsights) {
      comprehensiveData.aiInsights =
        await transportationAIInsightsService.generateInsights({
          shipment,
          routeOptions: comprehensiveData.routeComparison?.options,
        });

      // Update shipment with AI insights
      shipment.aiInsights = {
        recommendations:
          comprehensiveData.aiInsights.summary.topRecommendations,
        riskFactors: comprehensiveData.aiInsights.insights
          .filter((i) => i.type === "RISK_MITIGATION")
          .flatMap((i) => i.evidence?.dataPoints || []),
        optimizationSuggestions: comprehensiveData.aiInsights.insights
          .filter(
            (i) =>
              i.type === "COST_OPTIMIZATION" || i.type === "ROUTE_OPTIMIZATION",
          )
          .map((i) => i.recommendations[0]?.description || i.title),
        predictedDelay: comprehensiveData.transitTimePrediction?.aiInsights
          ?.delayProbability
          ? comprehensiveData.transitTimePrediction.predictions.pessimistic -
            comprehensiveData.transitTimePrediction.predictions.realistic
          : undefined,
        predictedDelayProbability:
          comprehensiveData.transitTimePrediction?.aiInsights?.delayProbability,
        costOptimization: comprehensiveData.aiInsights.insights
          .filter((i) => i.type === "COST_OPTIMIZATION")
          .map((i) => ({
            potentialSavings: i.impact.potentialSavings || 0,
            recommendations: i.recommendations.map((r) => r.description),
          }))[0],
      };
    }

    // Link to journey workflow if requested
    if (options?.linkToJourney) {
      // In production, create journey in Journey Analysis module
      comprehensiveData.journeyId = `journey-${shipment.id}`;
      shipment.journeyId = comprehensiveData.journeyId;
    }

    // Link to lifecycle if requested
    if (options?.linkToLifecycle) {
      // In production, initialize lifecycle in Process Lifecycle module
      comprehensiveData.lifecycleId = `lifecycle-${shipment.id}`;
      shipment.lifecycleId = comprehensiveData.lifecycleId;
    }

    // Initialize Schrödinger's Truck Quantum State (automatic for all shipments)
    try {
      await initializeQuantumStateForShipment(shipment);
      // Quantum state automatically initialized and linked to shipment
    } catch (error) {
      // Don't fail shipment creation if quantum state fails
      console.warn("Failed to initialize quantum state for shipment:", error);
    }

    // Initialize Cargo Psychology Analysis (automatic for all shipments)
    try {
      const { initializePsychologyForShipment } =
        await import("@/lib/services/cargo-psychology/transportation-integration");
      await initializePsychologyForShipment(shipment);
      // Psychology state automatically analyzed and linked to shipment
    } catch (error) {
      // Don't fail shipment creation if psychology analysis fails
      console.warn(
        "Failed to initialize psychology analysis for shipment:",
        error,
      );
    }

    // Auto-create ETW (e-Waybill) if required (automatic for eligible shipments)
    try {
      const { etwIntegrationService } = await import("./etwIntegrationService");
      if (etwIntegrationService.isETWRequired(shipment)) {
        const etw =
          await etwIntegrationService.autoCreateETWFromShipment(shipment);
        if (etw) {
          comprehensiveData.etwId = etw.id;
          shipment.etwId = etw.id; // Add to shipment if type supports it
          console.log(
            `✅ Auto-created ETW ${etw.etwNumber} for shipment ${shipment.shipmentNumber}`,
          );
        }
      }
    } catch (error) {
      // Don't fail shipment creation if ETW creation fails
      console.warn("Failed to auto-create ETW for shipment:", error);
    }

    // =========================================================================
    // PUBLISH SHIPMENT CREATED EVENT (for GCC Compliance & other modules)
    // =========================================================================
    try {
      await eventBus.publish(
        createEvent(
          "tms.shipment.created",
          shipment.id,
          "Shipment",
          {
            shipmentId: shipment.id,
            shipmentNumber: shipment.shipmentNumber,
            shipment: shipment,
            origin: shipment.origin,
            destination: shipment.destination,
            mode: shipment.mode,
            type: shipment.type,
            carrierId: shipment.carrierId,
            vehiclePlateNumber: (shipment as any).vehiclePlateNumber,
            bayanNumber: (shipment as any).bayanNumber,
            tenantId: tenantId || "default",
          },
          1,
          { tenantId: tenantId || "default", userId: createdBy }
        )
      );
      console.log(
        `📢 Published tms.shipment.created event for ${shipment.shipmentNumber}`
      );
    } catch (error) {
      // Don't fail shipment creation if event publishing fails
      console.warn("Failed to publish shipment created event:", error);
    }

    return comprehensiveData;
  }

  /**
   * Update shipment with comprehensive data
   */
  async updateShipmentWithIntelligence(
    shipment: Shipment,
    options?: {
      refreshRouteComparison?: boolean;
      refreshPricingIntelligence?: boolean;
      recalculateEmissions?: boolean;
      repredictTransitTime?: boolean;
      regenerateAIInsights?: boolean;
    },
  ): Promise<ComprehensiveShipmentData> {
    const comprehensiveData: ComprehensiveShipmentData = { shipment };

    // Refresh route comparison
    if (options?.refreshRouteComparison) {
      comprehensiveData.routeComparison =
        await routeComparisonService.compareRoutes({
          origin: shipment.origin,
          destination: shipment.destination,
          cargo: {
            weight: shipment.totalWeight,
            volume: shipment.totalVolume,
            value: shipment.totalValue,
            type: shipment.type,
          },
        });
    }

    // Refresh pricing intelligence
    if (options?.refreshPricingIntelligence) {
      comprehensiveData.pricingIntelligence =
        await pricingIntelligenceService.getPricingIntelligence({
          origin: shipment.origin,
          destination: shipment.destination,
          mode: shipment.mode,
          type: shipment.type,
          cargo: {
            weight: shipment.totalWeight,
            volume: shipment.totalVolume,
            value: shipment.totalValue,
          },
        });
    }

    // Recalculate emissions
    if (options?.recalculateEmissions && shipment.route) {
      comprehensiveData.emissions =
        await co2EmissionsService.calculateEmissions({
          origin: shipment.origin,
          destination: shipment.destination,
          distance: shipment.route.distance || 0,
          mode: shipment.mode,
          cargo: {
            weight: shipment.totalWeight,
            volume: shipment.totalVolume,
          },
        });
    }

    // Repredict transit time
    if (options?.repredictTransitTime) {
      comprehensiveData.transitTimePrediction =
        await transitTimePredictionService.predictTransitTime({
          origin: shipment.origin,
          destination: shipment.destination,
          mode: shipment.mode,
          waypoints: shipment.route?.waypoints,
          cargo: {
            weight: shipment.totalWeight,
            volume: shipment.totalVolume,
          },
          date: shipment.pickupDate,
        });
    }

    // Regenerate AI insights
    if (options?.regenerateAIInsights) {
      comprehensiveData.aiInsights =
        await transportationAIInsightsService.generateInsights({
          shipment,
          routeOptions: comprehensiveData.routeComparison?.options,
        });
    }

    return comprehensiveData;
  }

  /**
   * Get comprehensive shipment data
   */
  async getComprehensiveShipment(
    shipmentId: string,
  ): Promise<ComprehensiveShipmentData | null> {
    // In production, fetch from database
    // For now, return null (would need to implement database layer)
    return null;
  }
}

export const comprehensiveShipmentService = new ComprehensiveShipmentService();
