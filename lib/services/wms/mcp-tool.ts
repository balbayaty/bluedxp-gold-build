/**
 * WMS Service MCP Tools
 *
 * Enterprise-grade MCP tools for Warehouse Management System (WMS)
 * Provides AI agents with access to inventory management, warehouse operations,
 * optimization, and analytics
 *
 * Features:
 * - Real-time inventory tracking
 * - Putaway and picking optimization
 * - Storage capacity planning
 * - Warehouse operations tracking
 * - Inventory analytics
 * - Location management
 *
 * @module wms
 */

import type { MCPServer } from "@/lib/mcp/server";
import { inventoryService } from "./inventoryService";
import { warehouseOptimizationService } from "./warehouseOptimizationService";
import { warehouseLocationService as locationService } from "./locationService";
import { warehouseAreaService as areaService } from "./areaService";
import {
  createMCPToolHandler,
  validateParams,
  sanitizeError,
} from "@/lib/mcp/utils/baseTool";

/**
 * Register all WMS MCP tools
 */
export function registerMCPTools(server: MCPServer): void {
  // ========================================================================
  // INVENTORY MANAGEMENT
  // ========================================================================

  /**
   * Get inventory status - Get real-time inventory status for SKUs
   */
  server.registerTool({
    name: "get_inventory_status",
    description:
      "Get real-time inventory status including available quantity, reserved quantity, on-hand quantity, and location details for one or more SKUs.",
    inputSchema: {
      type: "object",
      properties: {
        skuIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of SKU IDs to query (single SKU or multiple)",
        },
        warehouseId: {
          type: "string",
          description: "Warehouse ID (optional, defaults to tenant default)",
        },
        includeLocations: {
          type: "boolean",
          description: "Include location details for each SKU (default: true)",
          default: true,
        },
        includeReservations: {
          type: "boolean",
          description: "Include reservation details (default: false)",
          default: false,
        },
        tenantId: { type: "string" },
      },
      required: ["skuIds", "tenantId"],
    },
    handler: createMCPToolHandler(
      "get_inventory_status",
      async (params, context) => {
        validateParams(params, ["skuIds", "tenantId"]);

        try {
          const results = await Promise.all(
            params.skuIds.map(async (skuId) => {
              const stock = await inventoryService.getStock(skuId, {
                warehouseId: params.warehouseId,
                tenantId: context.tenantId,
              });

              const result: any = {
                skuId,
                availableQuantity: stock.availableQuantity,
                reservedQuantity: stock.reservedQuantity,
                onHandQuantity: stock.onHandQuantity,
                allocatedQuantity: stock.allocatedQuantity,
                status: stock.status,
              };

              if (params.includeLocations && stock.locations) {
                result.locations = stock.locations.map((loc) => ({
                  locationId: loc.locationId,
                  quantity: loc.quantity,
                  zone: loc.zone,
                  area: loc.area,
                }));
              }

              if (params.includeReservations && stock.reservations) {
                result.reservations = stock.reservations;
              }

              return result;
            }),
          );

          return {
            inventory: results,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          throw new Error(
            `Failed to get inventory status: ${sanitizeError(error)}`,
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

  /**
   * Optimize putaway - Get optimal putaway locations for incoming goods
   */
  server.registerTool({
    name: "optimize_putaway",
    description:
      "Get optimal putaway locations for incoming goods considering storage capacity, proximity to picking areas, product velocity, and storage requirements (temperature, hazmat, etc.).",
    inputSchema: {
      type: "object",
      properties: {
        skuId: {
          type: "string",
          description: "SKU ID to put away",
        },
        quantity: {
          type: "number",
          description: "Quantity to put away",
        },
        warehouseId: {
          type: "string",
          description: "Warehouse ID",
        },
        constraints: {
          type: "object",
          description: "Putaway constraints",
          properties: {
            temperatureZone: { type: "string" },
            hazmat: { type: "boolean" },
            requiresFIFO: { type: "boolean" },
            requiresFEFO: { type: "boolean" },
            maxHeight: { type: "number" },
            maxWeight: { type: "number" },
          },
        },
        tenantId: { type: "string" },
      },
      required: ["skuId", "quantity", "warehouseId", "tenantId"],
    },
    handler: createMCPToolHandler(
      "optimize_putaway",
      async (params, context) => {
        validateParams(params, [
          "skuId",
          "quantity",
          "warehouseId",
          "tenantId",
        ]);

        try {
          const optimization =
            await warehouseOptimizationService.optimizePutaway({
              skuId: params.skuId,
              quantity: params.quantity,
              warehouseId: params.warehouseId,
              tenantId: context.tenantId,
              constraints: params.constraints || {},
            });

          return {
            recommendedLocations: optimization.recommendedLocations.map(
              (loc) => ({
                locationId: loc.locationId,
                zone: loc.zone,
                area: loc.area,
                quantity: loc.quantity,
                reason: loc.reason,
                score: loc.score,
              }),
            ),
            alternativeLocations: optimization.alternativeLocations,
            optimizationMetrics: {
              spaceUtilization: optimization.spaceUtilization,
              travelDistance: optimization.travelDistance,
              efficiency: optimization.efficiency,
            },
          };
        } catch (error) {
          throw new Error(
            `Failed to optimize putaway: ${sanitizeError(error)}`,
          );
        }
      },
      {
        timeout: 20000,
        retries: 1,
        requireTenant: true,
      },
    ),
  });

  /**
   * Generate picking list - Generate optimized picking list for orders
   */
  server.registerTool({
    name: "generate_picking_list",
    description:
      "Generate optimized picking list for orders considering pick path optimization, batch picking, zone picking, and wave planning.",
    inputSchema: {
      type: "object",
      properties: {
        orderIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of order IDs to pick",
        },
        warehouseId: {
          type: "string",
          description: "Warehouse ID",
        },
        strategy: {
          type: "string",
          enum: ["FIFO", "FEFO", "LIFO", "RANDOM", "OPTIMIZED"],
          description: "Picking strategy (default: OPTIMIZED)",
          default: "OPTIMIZED",
        },
        batchPicking: {
          type: "boolean",
          description: "Enable batch picking (default: true)",
          default: true,
        },
        optimizeRoute: {
          type: "boolean",
          description: "Optimize pick path route (default: true)",
          default: true,
        },
        tenantId: { type: "string" },
      },
      required: ["orderIds", "warehouseId", "tenantId"],
    },
    handler: createMCPToolHandler(
      "generate_picking_list",
      async (params, context) => {
        validateParams(params, ["orderIds", "warehouseId", "tenantId"]);

        try {
          const optimization =
            await warehouseOptimizationService.optimizePicking({
              orderIds: params.orderIds,
              warehouseId: params.warehouseId,
              tenantId: context.tenantId,
              strategy: params.strategy || "OPTIMIZED",
              batchPicking: params.batchPicking !== false,
              optimizeRoute: params.optimizeRoute !== false,
            });

          return {
            pickingList: optimization.pickingList.map((item) => ({
              sequence: item.sequence,
              locationId: item.locationId,
              skuId: item.skuId,
              quantity: item.quantity,
              orderId: item.orderId,
              zone: item.zone,
              area: item.area,
            })),
            pickPath: optimization.pickPath,
            estimatedTime: optimization.estimatedTime,
            totalDistance: optimization.totalDistance,
            optimizationMetrics: {
              efficiency: optimization.efficiency,
              travelDistance: optimization.travelDistance,
              batchSize: optimization.batchSize,
            },
          };
        } catch (error) {
          throw new Error(
            `Failed to generate picking list: ${sanitizeError(error)}`,
          );
        }
      },
      {
        timeout: 20000,
        retries: 1,
        requireTenant: true,
      },
    ),
  });

  /**
   * Calculate storage capacity - Calculate available storage capacity
   */
  server.registerTool({
    name: "calculate_storage_capacity",
    description:
      "Calculate available storage capacity for a warehouse including total capacity, used capacity, available capacity, and capacity by zone/area.",
    inputSchema: {
      type: "object",
      properties: {
        warehouseId: {
          type: "string",
          description: "Warehouse ID",
        },
        includeZones: {
          type: "boolean",
          description: "Include capacity breakdown by zones (default: true)",
          default: true,
        },
        includeAreas: {
          type: "boolean",
          description: "Include capacity breakdown by areas (default: false)",
          default: false,
        },
        tenantId: { type: "string" },
      },
      required: ["warehouseId", "tenantId"],
    },
    handler: createMCPToolHandler(
      "calculate_storage_capacity",
      async (params, context) => {
        validateParams(params, ["warehouseId", "tenantId"]);

        try {
          // Get warehouse areas
          const areas = await areaService.getAreas(
            params.warehouseId,
            context.tenantId,
          );

          let totalCapacity = 0;
          let usedCapacity = 0;
          const zoneCapacity: Record<string, any> = {};
          const areaCapacity: Record<string, any> = {};

          for (const area of areas) {
            // Calculate area capacity
            const areaStats = await areaService.getAreaStatistics(
              area.id,
              context.tenantId,
            );

            totalCapacity += areaStats.totalCapacity || 0;
            usedCapacity += areaStats.usedCapacity || 0;

            if (params.includeZones) {
              const zoneId = area.zoneId || "default";
              if (!zoneCapacity[zoneId]) {
                zoneCapacity[zoneId] = {
                  totalCapacity: 0,
                  usedCapacity: 0,
                  availableCapacity: 0,
                  utilization: 0,
                };
              }
              zoneCapacity[zoneId].totalCapacity +=
                areaStats.totalCapacity || 0;
              zoneCapacity[zoneId].usedCapacity += areaStats.usedCapacity || 0;
            }

            if (params.includeAreas) {
              areaCapacity[area.id] = {
                areaId: area.id,
                areaName: area.name,
                totalCapacity: areaStats.totalCapacity || 0,
                usedCapacity: areaStats.usedCapacity || 0,
                availableCapacity:
                  (areaStats.totalCapacity || 0) -
                  (areaStats.usedCapacity || 0),
                utilization: areaStats.utilization || 0,
              };
            }
          }

          const availableCapacity = totalCapacity - usedCapacity;
          const utilization =
            totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

          // Calculate zone utilization
          if (params.includeZones) {
            Object.keys(zoneCapacity).forEach((zoneId) => {
              const zone = zoneCapacity[zoneId];
              zone.availableCapacity = zone.totalCapacity - zone.usedCapacity;
              zone.utilization =
                zone.totalCapacity > 0
                  ? (zone.usedCapacity / zone.totalCapacity) * 100
                  : 0;
            });
          }

          return {
            warehouseId: params.warehouseId,
            capacity: {
              totalCapacity,
              usedCapacity,
              availableCapacity,
              utilization,
              unit: "cubic_meters",
            },
            zones: params.includeZones ? zoneCapacity : undefined,
            areas: params.includeAreas ? areaCapacity : undefined,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          throw new Error(
            `Failed to calculate storage capacity: ${sanitizeError(error)}`,
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

  /**
   * Track warehouse operations - Track warehouse operations and activities
   */
  server.registerTool({
    name: "track_warehouse_operations",
    description:
      "Track warehouse operations including inbound, outbound, putaway, picking, and inventory movements. Returns operation status and metrics.",
    inputSchema: {
      type: "object",
      properties: {
        warehouseId: {
          type: "string",
          description: "Warehouse ID",
        },
        operationType: {
          type: "string",
          enum: [
            "INBOUND",
            "OUTBOUND",
            "PUTAWAY",
            "PICKING",
            "CYCLE_COUNT",
            "TRANSFER",
            "ALL",
          ],
          description: "Operation type to track (default: ALL)",
          default: "ALL",
        },
        timeRange: {
          type: "object",
          description: "Time range for operations",
          properties: {
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
          },
        },
        includeMetrics: {
          type: "boolean",
          description: "Include operation metrics (default: true)",
          default: true,
        },
        tenantId: { type: "string" },
      },
      required: ["warehouseId", "tenantId"],
    },
    handler: createMCPToolHandler(
      "track_warehouse_operations",
      async (params, context) => {
        validateParams(params, ["warehouseId", "tenantId"]);

        try {
          // Get operations based on type
          const operations: any[] = [];
          const metrics: any = {};

          // This would integrate with actual WMS operation tracking
          // For now, return structure
          if (
            params.operationType === "ALL" ||
            params.operationType === "INBOUND"
          ) {
            // Get inbound operations
            // operations.push(...inboundOperations)
          }

          if (
            params.operationType === "ALL" ||
            params.operationType === "OUTBOUND"
          ) {
            // Get outbound operations
            // operations.push(...outboundOperations)
          }

          if (params.includeMetrics) {
            metrics.totalOperations = operations.length;
            metrics.completedOperations = operations.filter(
              (op) => op.status === "COMPLETED",
            ).length;
            metrics.inProgressOperations = operations.filter(
              (op) => op.status === "IN_PROGRESS",
            ).length;
            metrics.pendingOperations = operations.filter(
              (op) => op.status === "PENDING",
            ).length;
          }

          return {
            warehouseId: params.warehouseId,
            operationType: params.operationType,
            operations: operations.slice(0, 100), // Limit to 100 operations
            metrics: params.includeMetrics ? metrics : undefined,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          throw new Error(
            `Failed to track warehouse operations: ${sanitizeError(error)}`,
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

  /**
   * Get location details - Get details for a warehouse location
   */
  server.registerTool({
    name: "get_location_details",
    description:
      "Get detailed information for a warehouse location including current inventory, capacity, status, and location hierarchy.",
    inputSchema: {
      type: "object",
      properties: {
        locationId: {
          type: "string",
          description: "Location ID",
        },
        warehouseId: {
          type: "string",
          description: "Warehouse ID",
        },
        includeInventory: {
          type: "boolean",
          description: "Include current inventory at location (default: true)",
          default: true,
        },
        tenantId: { type: "string" },
      },
      required: ["locationId", "warehouseId", "tenantId"],
    },
    handler: createMCPToolHandler(
      "get_location_details",
      async (params, context) => {
        validateParams(params, ["locationId", "warehouseId", "tenantId"]);

        try {
          const location = await locationService.getLocation(
            params.locationId,
            params.warehouseId,
            context.tenantId,
          );

          const result: any = {
            locationId: location.id,
            locationCode: location.code,
            warehouseId: params.warehouseId,
            zone: location.zone,
            area: location.area,
            type: location.type,
            status: location.status,
            capacity: location.capacity,
            dimensions: location.dimensions,
          };

          if (params.includeInventory && location.inventory) {
            result.inventory = location.inventory.map((inv) => ({
              skuId: inv.skuId,
              quantity: inv.quantity,
              batchNumber: inv.batchNumber,
              expiryDate: inv.expiryDate,
            }));
          }

          return result;
        } catch (error) {
          throw new Error(
            `Failed to get location details: ${sanitizeError(error)}`,
          );
        }
      },
      {
        timeout: 10000,
        retries: 1,
        requireTenant: true,
      },
    ),
  });
}
