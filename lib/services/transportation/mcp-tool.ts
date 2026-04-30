/**
 * Transportation Service MCP Tools
 *
 * Enterprise-grade MCP tools for Transportation Management System (TMS)
 * Provides AI agents with access to shipment tracking, route optimization,
 * carrier management, and transportation analytics
 *
 * Features:
 * - Comprehensive shipment tracking
 * - Route optimization and comparison
 * - Carrier performance analytics
 * - Customs status checking
 * - Shipping cost calculation
 * - Real-time location tracking
 * - Journey analysis
 * - Transit time prediction
 *
 * @module transportation
 */

import type { MCPServer } from "@/lib/mcp/server";
import { comprehensiveShipmentService } from "./comprehensiveShipmentService";
import { routeComparisonService } from "./routeComparisonService";
import { transitTimePredictionService } from "./transitTimePredictionService";
import { transportationAnalyticsService } from "./analyticsService";
import { journeyAnalysisService } from "./journeyAnalysisService";
import { transportationDatabaseAdapterInstance as transportationDatabaseAdapter } from "./database/transportationDatabaseAdapter";
import {
  createMCPToolHandler,
  validateParams,
  sanitizeError,
} from "@/lib/mcp/utils/baseTool";
import type { Shipment, Location, TransportMode } from "@/types/tms";

/**
 * Register all Transportation MCP tools
 */
export function registerMCPTools(server: MCPServer): void {
  // ========================================================================
  // SHIPMENT TRACKING & MANAGEMENT
  // ========================================================================

  /**
   * Track shipment - Get real-time shipment status and location
   */
  server.registerTool({
    name: "track_shipment",
    description:
      "Get real-time tracking information for a shipment including current location, status, estimated delivery, and tracking events. Supports multi-modal transportation tracking.",
    inputSchema: {
      type: "object",
      properties: {
        shipmentId: {
          type: "string",
          description: "Shipment ID or shipment number to track",
        },
        tenantId: {
          type: "string",
          description: "Tenant ID for multi-tenant isolation",
        },
        includeJourney: {
          type: "boolean",
          description:
            "Include journey analysis with touchpoints (default: false)",
          default: false,
        },
        includePredictions: {
          type: "boolean",
          description: "Include transit time predictions (default: false)",
          default: false,
        },
      },
      required: ["shipmentId", "tenantId"],
    },
    handler: createMCPToolHandler(
      "track_shipment",
      async (params, context) => {
        validateParams(params, ["shipmentId", "tenantId"]);

        try {
          // Get shipment from database
          const shipment = await transportationDatabaseAdapter.getShipment(
            params.shipmentId,
            context.tenantId,
          );

          if (!shipment) {
            throw new Error(`Shipment ${params.shipmentId} not found`);
          }

          const result: any = {
            shipment: {
              id: shipment.id,
              shipmentNumber: shipment.shipmentNumber,
              status: shipment.status,
              origin: shipment.origin,
              destination: shipment.destination,
              currentLocation: shipment.currentLocation,
              estimatedDelivery: shipment.estimatedDelivery,
              actualDelivery: shipment.actualDelivery,
              trackingEvents: shipment.trackingEvents || [],
              exceptions: shipment.exceptions || [],
              alerts: shipment.alerts || [],
            },
          };

          // Include journey analysis if requested
          if (params.includeJourney) {
            try {
              const journey = await journeyAnalysisService.analyzeJourney({
                shipment,
                includeRootCauseAnalysis: false,
              });
              result.journey = {
                id: journey.id,
                touchpoints: journey.touchpoints,
                transportLegs: journey.transportLegs,
                totalDistance: journey.totalDistance,
                estimatedTotalDuration: journey.estimatedTotalDuration,
                bottlenecks: journey.bottlenecks,
              };
            } catch (error) {
              // Journey analysis is optional, don't fail if it errors
              result.journeyError = sanitizeError(error);
            }
          }

          // Include transit time predictions if requested
          if (params.includePredictions) {
            try {
              const prediction =
                await transitTimePredictionService.predictTransitTime({
                  origin: shipment.origin,
                  destination: shipment.destination,
                  mode: shipment.mode,
                  cargo: {
                    weight: shipment.totalWeight,
                    volume: shipment.totalVolume,
                    value: shipment.totalValue,
                    type: shipment.type,
                  },
                });
              result.transitTimePrediction = prediction;
            } catch (error) {
              // Predictions are optional
              result.predictionError = sanitizeError(error);
            }
          }

          return result;
        } catch (error) {
          throw new Error(`Failed to track shipment: ${sanitizeError(error)}`);
        }
      },
      {
        timeout: 15000, // 15 seconds for tracking
        retries: 1,
        requireTenant: true,
      },
    ),
  });

  /**
   * Create shipment - Create a new shipment with optional intelligence
   */
  server.registerTool({
    name: "create_shipment",
    description:
      "Create a new shipment with optional route comparison, pricing intelligence, emissions calculation, and transit time prediction. Returns comprehensive shipment data.",
    inputSchema: {
      type: "object",
      properties: {
        origin: {
          type: "object",
          description: "Origin location (latitude, longitude, address)",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" },
            address: { type: "string" },
            city: { type: "string" },
            country: { type: "string" },
          },
        },
        destination: {
          type: "object",
          description: "Destination location (latitude, longitude, address)",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" },
            address: { type: "string" },
            city: { type: "string" },
            country: { type: "string" },
          },
        },
        mode: {
          type: "string",
          enum: ["ROAD", "RAIL", "SEA", "AIR", "MULTI_MODAL"],
          description: "Transport mode",
        },
        cargo: {
          type: "object",
          description: "Cargo information",
          properties: {
            items: { type: "array" },
            totalWeight: { type: "number" },
            totalVolume: { type: "number" },
            totalValue: { type: "number" },
            currency: { type: "string", default: "SAR" },
          },
        },
        options: {
          type: "object",
          description: "Optional intelligence features",
          properties: {
            generateRouteComparison: { type: "boolean", default: true },
            generatePricingIntelligence: { type: "boolean", default: false },
            calculateEmissions: { type: "boolean", default: false },
            predictTransitTime: { type: "boolean", default: true },
            generateAIInsights: { type: "boolean", default: false },
            includeJourneyAnalysis: { type: "boolean", default: true },
          },
        },
        tenantId: { type: "string" },
        userId: { type: "string" },
      },
      required: [
        "origin",
        "destination",
        "mode",
        "cargo",
        "tenantId",
        "userId",
      ],
    },
    handler: createMCPToolHandler(
      "create_shipment",
      async (params, context) => {
        validateParams(params, [
          "origin",
          "destination",
          "mode",
          "cargo",
          "tenantId",
          "userId",
        ]);

        try {
          const result =
            await comprehensiveShipmentService.createComprehensiveShipment({
              origin: params.origin as Location,
              destination: params.destination as Location,
              type: "STANDARD",
              mode: params.mode as TransportMode,
              cargo: {
                items: params.cargo.items || [],
                totalWeight: params.cargo.totalWeight,
                totalVolume: params.cargo.totalVolume,
                totalValue: params.cargo.totalValue,
                currency: params.cargo.currency || "SAR",
              },
              options: params.options || {
                generateRouteComparison: true,
                predictTransitTime: true,
                includeJourneyAnalysis: true,
              },
              createdBy: context.userId || "system",
              tenantId: context.tenantId,
            });

          return {
            shipment: result.shipment,
            routeComparison: result.routeComparison,
            pricingIntelligence: result.pricingIntelligence,
            emissions: result.emissions,
            transitTimePrediction: result.transitTimePrediction,
            aiInsights: result.aiInsights,
            journeyId: result.journeyId,
          };
        } catch (error) {
          throw new Error(`Failed to create shipment: ${sanitizeError(error)}`);
        }
      },
      {
        timeout: 30000, // 30 seconds for comprehensive creation
        retries: 1,
        requireTenant: true,
      },
    ),
  });

  // ========================================================================
  // ROUTE OPTIMIZATION
  // ========================================================================

  /**
   * Optimize route - Compare and optimize routes between origin and destination
   */
  server.registerTool({
    name: "optimize_route",
    description:
      "Compare multiple routes between origin and destination, considering cost, time, distance, and reliability. Returns recommended route with alternatives.",
    inputSchema: {
      type: "object",
      properties: {
        origin: {
          type: "object",
          description: "Origin location",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" },
            address: { type: "string" },
          },
        },
        destination: {
          type: "object",
          description: "Destination location",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" },
            address: { type: "string" },
          },
        },
        cargo: {
          type: "object",
          description: "Cargo information for route optimization",
          properties: {
            weight: { type: "number" },
            volume: { type: "number" },
            value: { type: "number" },
            type: { type: "string" },
          },
        },
        preferences: {
          type: "object",
          description: "Route preferences",
          properties: {
            prioritize: {
              type: "string",
              enum: ["COST", "TIME", "DISTANCE", "RELIABILITY", "BALANCED"],
              default: "BALANCED",
            },
            avoidTolls: { type: "boolean", default: false },
            avoidHighways: { type: "boolean", default: false },
          },
        },
        tenantId: { type: "string" },
      },
      required: ["origin", "destination", "cargo", "tenantId"],
    },
    handler: createMCPToolHandler(
      "optimize_route",
      async (params, context) => {
        validateParams(params, ["origin", "destination", "cargo", "tenantId"]);

        try {
          const comparison = await routeComparisonService.compareRoutes({
            origin: params.origin as Location,
            destination: params.destination as Location,
            cargo: {
              weight: params.cargo.weight,
              volume: params.cargo.volume,
              value: params.cargo.value,
              type: params.cargo.type || "STANDARD",
            },
            preferences: params.preferences || {
              prioritize: "BALANCED",
            },
          });

          return {
            recommended: comparison.recommended,
            alternatives: comparison.alternatives,
            comparison: comparison.comparison,
            insights: comparison.insights,
          };
        } catch (error) {
          throw new Error(`Failed to optimize route: ${sanitizeError(error)}`);
        }
      },
      {
        timeout: 20000, // 20 seconds for route optimization
        retries: 1,
        requireTenant: true,
      },
    ),
  });

  // ========================================================================
  // CARRIER MANAGEMENT
  // ========================================================================

  /**
   * Get carrier performance - Analyze carrier performance metrics
   */
  server.registerTool({
    name: "get_carrier_performance",
    description:
      "Get comprehensive carrier performance analytics including on-time delivery rate, cost efficiency, reliability score, and historical performance metrics.",
    inputSchema: {
      type: "object",
      properties: {
        carrierId: {
          type: "string",
          description: "Carrier ID to analyze",
        },
        tenantId: { type: "string" },
        timeRange: {
          type: "object",
          description: "Time range for performance analysis",
          properties: {
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
          },
        },
      },
      required: ["carrierId", "tenantId"],
    },
    handler: createMCPToolHandler(
      "get_carrier_performance",
      async (params, context) => {
        validateParams(params, ["carrierId", "tenantId"]);

        try {
          const analytics =
            await transportationAnalyticsService.getCarrierAnalytics({
              carrierId: params.carrierId,
              tenantId: context.tenantId,
              timeRange: params.timeRange,
            });

          return {
            carrierId: params.carrierId,
            performance: {
              onTimeDeliveryRate: analytics.onTimeDeliveryRate,
              averageTransitTime: analytics.averageTransitTime,
              costEfficiency: analytics.costEfficiency,
              reliabilityScore: analytics.reliabilityScore,
              totalShipments: analytics.totalShipments,
              successfulShipments: analytics.successfulShipments,
            },
            metrics: analytics.metrics,
            trends: analytics.trends,
          };
        } catch (error) {
          throw new Error(
            `Failed to get carrier performance: ${sanitizeError(error)}`,
          );
        }
      },
      {
        timeout: 15000,
        retries: 1,
        requireTenant: true,
      },
    ),
  });

  // ========================================================================
  // COST CALCULATION
  // ========================================================================

  /**
   * Calculate shipping cost - Estimate shipping costs for a route
   */
  server.registerTool({
    name: "calculate_shipping_cost",
    description:
      "Calculate estimated shipping costs for a route including base freight, fuel surcharges, accessorials, and total cost breakdown.",
    inputSchema: {
      type: "object",
      properties: {
        origin: {
          type: "object",
          description: "Origin location",
        },
        destination: {
          type: "object",
          description: "Destination location",
        },
        cargo: {
          type: "object",
          description: "Cargo information",
          properties: {
            weight: { type: "number" },
            volume: { type: "number" },
            value: { type: "number" },
            type: { type: "string" },
          },
        },
        mode: {
          type: "string",
          enum: ["ROAD", "RAIL", "SEA", "AIR", "MULTI_MODAL"],
        },
        carrierId: {
          type: "string",
          description: "Optional carrier ID for specific carrier pricing",
        },
        tenantId: { type: "string" },
      },
      required: ["origin", "destination", "cargo", "mode", "tenantId"],
    },
    handler: createMCPToolHandler(
      "calculate_shipping_cost",
      async (params, context) => {
        validateParams(params, [
          "origin",
          "destination",
          "cargo",
          "mode",
          "tenantId",
        ]);

        try {
          // Use pricing intelligence service if available
          const { pricingIntelligenceService } =
            await import("./pricingIntelligenceService");

          const pricing =
            await pricingIntelligenceService.getPricingIntelligence({
              origin: params.origin as Location,
              destination: params.destination as Location,
              cargo: {
                weight: params.cargo.weight,
                volume: params.cargo.volume,
                value: params.cargo.value,
                type: params.cargo.type || "STANDARD",
              },
              mode: params.mode as TransportMode,
              carrierId: params.carrierId,
            });

          return {
            estimatedCost: pricing.estimatedCost,
            currency: pricing.currency || "SAR",
            costBreakdown: pricing.costBreakdown,
            carrierRecommendations: pricing.carrierRecommendations,
            marketIntelligence: pricing.marketIntelligence,
          };
        } catch (error) {
          throw new Error(
            `Failed to calculate shipping cost: ${sanitizeError(error)}`,
          );
        }
      },
      {
        timeout: 15000,
        retries: 1,
        requireTenant: true,
      },
    ),
  });

  // ========================================================================
  // CUSTOMS STATUS
  // ========================================================================

  /**
   * Check customs status - Get customs clearance status for a shipment
   */
  server.registerTool({
    name: "check_customs_status",
    description:
      "Check customs clearance status for a shipment including declaration status, document requirements, and clearance timeline.",
    inputSchema: {
      type: "object",
      properties: {
        shipmentId: {
          type: "string",
          description: "Shipment ID",
        },
        tenantId: { type: "string" },
      },
      required: ["shipmentId", "tenantId"],
    },
    handler: createMCPToolHandler(
      "check_customs_status",
      async (params, context) => {
        validateParams(params, ["shipmentId", "tenantId"]);

        try {
          // Get shipment
          const shipment = await transportationDatabaseAdapter.getShipment(
            params.shipmentId,
            context.tenantId,
          );

          if (!shipment) {
            throw new Error(`Shipment ${params.shipmentId} not found`);
          }

          // Check if customs service is available
          try {
            const { customsOrchestrator } =
              await import("@/lib/services/customs");
            const customsStatus =
              await customsOrchestrator.getShipmentCustomsStatus(
                params.shipmentId,
                context.tenantId,
              );

            return {
              shipmentId: params.shipmentId,
              customsStatus: customsStatus.status,
              declarationId: customsStatus.declarationId,
              clearanceDate: customsStatus.clearanceDate,
              documents: customsStatus.documents,
              requirements: customsStatus.requirements,
              timeline: customsStatus.timeline,
            };
          } catch (error) {
            // Customs service not available, return basic status
            return {
              shipmentId: params.shipmentId,
              customsStatus: "UNKNOWN",
              message: "Customs service not available",
            };
          }
        } catch (error) {
          throw new Error(
            `Failed to check customs status: ${sanitizeError(error)}`,
          );
        }
      },
      {
        timeout: 15000,
        retries: 1,
        requireTenant: true,
      },
    ),
  });

  // ========================================================================
  // TRANSIT TIME PREDICTION
  // ========================================================================

  /**
   * Predict transit time - Predict transit time for a route
   */
  server.registerTool({
    name: "predict_transit_time",
    description:
      "Predict transit time for a shipment route using AI/ML models considering historical data, traffic patterns, and route characteristics.",
    inputSchema: {
      type: "object",
      properties: {
        origin: {
          type: "object",
          description: "Origin location",
        },
        destination: {
          type: "object",
          description: "Destination location",
        },
        mode: {
          type: "string",
          enum: ["ROAD", "RAIL", "SEA", "AIR", "MULTI_MODAL"],
        },
        cargo: {
          type: "object",
          description: "Cargo information",
          properties: {
            weight: { type: "number" },
            volume: { type: "number" },
            value: { type: "number" },
            type: { type: "string" },
          },
        },
        tenantId: { type: "string" },
      },
      required: ["origin", "destination", "mode", "cargo", "tenantId"],
    },
    handler: createMCPToolHandler(
      "predict_transit_time",
      async (params, context) => {
        validateParams(params, [
          "origin",
          "destination",
          "mode",
          "cargo",
          "tenantId",
        ]);

        try {
          const prediction =
            await transitTimePredictionService.predictTransitTime({
              origin: params.origin as Location,
              destination: params.destination as Location,
              mode: params.mode as TransportMode,
              cargo: {
                weight: params.cargo.weight,
                volume: params.cargo.volume,
                value: params.cargo.value,
                type: params.cargo.type || "STANDARD",
              },
            });

          return {
            estimatedTransitTime: prediction.estimatedTransitTime,
            estimatedTransitTimeHours: prediction.estimatedTransitTimeHours,
            confidence: prediction.confidence,
            factors: prediction.factors,
            historicalAverage: prediction.historicalAverage,
            predictions: prediction.predictions,
          };
        } catch (error) {
          throw new Error(
            `Failed to predict transit time: ${sanitizeError(error)}`,
          );
        }
      },
      {
        timeout: 15000,
        retries: 1,
        requireTenant: true,
      },
    ),
  });
}
