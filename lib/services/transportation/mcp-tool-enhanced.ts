/**
 * Enhanced Transportation MCP Tools
 *
 * Enterprise-grade MCP tools with full metadata, caching, and analytics
 * This is an example of how to migrate tools to enhanced format
 *
 * @module transportation
 */

import { enhancedMCPServer } from "@/lib/mcp/enhanced-server";
import { registerEnhancedTransportationTool } from "@/lib/mcp/utils/enhancedToolRegistration";
import { comprehensiveShipmentService } from "./comprehensiveShipmentService";
import { routeComparisonService } from "./routeComparisonService";
import { transitTimePredictionService } from "./transitTimePredictionService";
import { transportationAnalyticsService } from "./analyticsService";
import { journeyAnalysisService } from "./journeyAnalysisService";
import { transportationDatabaseAdapter } from "./database/transportationDatabaseAdapter";
import {
  createMCPToolHandler,
  validateParams,
  sanitizeError,
} from "@/lib/mcp/utils/baseTool";
import type { Shipment, Location, TransportMode } from "@/types/tms";

/**
 * Register enhanced Transportation MCP tools
 * These are examples showing how to use enhanced metadata
 */
export function registerEnhancedMCPTools(): void {
  // Track Shipment - Enhanced with caching and rate limiting
  registerEnhancedTransportationTool({
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
              result.journeyError = sanitizeError(error);
            }
          }

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
              result.predictionError = sanitizeError(error);
            }
          }

          return result;
        } catch (error) {
          throw new Error(`Failed to track shipment: ${sanitizeError(error)}`);
        }
      },
      {
        timeout: 15000,
        retries: 1,
        requireTenant: true,
      },
    ),
    metadata: {
      version: "1.0.0",
      tags: ["tracking", "real-time", "shipment", "transportation"],
      permissions: ["shipment:read", "shipment:track"],
      rateLimit: {
        requests: 100,
        window: 60, // 100 requests per minute
      },
      cacheable: true,
      cacheTTL: 30, // Cache for 30 seconds
      timeout: 15000,
      retries: 1,
      batchable: true,
      streaming: false,
      status: "ACTIVE",
    },
  });

  // Optimize Route - Enhanced with analytics
  registerEnhancedTransportationTool({
    name: "optimize_route",
    description:
      "Compare multiple routes between origin and destination, considering cost, time, distance, and reliability. Returns recommended route with alternatives.",
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
          description: "Cargo information for route optimization",
        },
        preferences: {
          type: "object",
          description: "Route preferences",
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
        timeout: 20000,
        retries: 1,
        requireTenant: true,
      },
    ),
    metadata: {
      version: "1.0.0",
      tags: ["optimization", "routing", "cost", "transportation"],
      permissions: ["route:read", "route:optimize"],
      rateLimit: {
        requests: 50,
        window: 60,
      },
      cacheable: true,
      cacheTTL: 300, // Cache for 5 minutes (routes don't change often)
      timeout: 20000,
      retries: 1,
      batchable: false, // Route optimization is complex, not batchable
      streaming: false,
      status: "ACTIVE",
    },
  });

  // Get Carrier Performance - Enhanced with analytics
  registerEnhancedTransportationTool({
    name: "get_carrier_performance",
    description:
      "Get comprehensive carrier performance analytics including on-time delivery rate, cost efficiency, reliability score, and historical performance metrics.",
    inputSchema: {
      type: "object",
      properties: {
        carrierId: { type: "string" },
        tenantId: { type: "string" },
        timeRange: {
          type: "object",
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
    metadata: {
      version: "1.0.0",
      tags: ["analytics", "carrier", "performance", "transportation"],
      permissions: ["carrier:read", "analytics:read"],
      rateLimit: {
        requests: 200,
        window: 60,
      },
      cacheable: true,
      cacheTTL: 300, // Cache for 5 minutes
      timeout: 15000,
      retries: 1,
      batchable: true,
      streaming: false,
      status: "ACTIVE",
    },
  });
}
