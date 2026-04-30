/**
 * Enhanced WMS MCP Tools
 *
 * Enterprise-grade MCP tools with full metadata
 * Example of enhanced tool registration for WMS
 *
 * @module wms
 */

import { registerEnhancedWarehouseTool } from "@/lib/mcp/utils/enhancedToolRegistration";
import { inventoryService } from "./inventoryService";
import { warehouseOptimizationService } from "./warehouseOptimizationService";
import { locationService } from "./locationService";
import { areaService } from "./areaService";
import {
  createMCPToolHandler,
  validateParams,
  sanitizeError,
} from "@/lib/mcp/utils/baseTool";

/**
 * Register enhanced WMS MCP tools
 */
export function registerEnhancedMCPTools(): void {
  // Get Inventory Status - Enhanced with caching
  registerEnhancedWarehouseTool({
    name: "get_inventory_status",
    description:
      "Get real-time inventory status including available quantity, reserved quantity, on-hand quantity, and location details for one or more SKUs.",
    inputSchema: {
      type: "object",
      properties: {
        skuIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of SKU IDs to query",
        },
        warehouseId: {
          type: "string",
          description: "Warehouse ID",
        },
        includeLocations: {
          type: "boolean",
          description: "Include location details",
          default: true,
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
    metadata: {
      version: "1.0.0",
      tags: ["inventory", "stock", "warehouse", "real-time"],
      permissions: ["inventory:read"],
      rateLimit: {
        requests: 200,
        window: 60,
      },
      cacheable: true,
      cacheTTL: 10, // Cache for 10 seconds (inventory changes frequently)
      timeout: 15000,
      retries: 1,
      batchable: true,
      streaming: false,
      status: "ACTIVE",
    },
  });

  // Optimize Putaway - Enhanced with analytics
  registerEnhancedWarehouseTool({
    name: "optimize_putaway",
    description:
      "Get optimal putaway locations for incoming goods considering storage capacity, proximity to picking areas, product velocity, and storage requirements.",
    inputSchema: {
      type: "object",
      properties: {
        skuId: { type: "string" },
        quantity: { type: "number" },
        warehouseId: { type: "string" },
        constraints: {
          type: "object",
          properties: {
            temperatureZone: { type: "string" },
            hazmat: { type: "boolean" },
            requiresFIFO: { type: "boolean" },
            requiresFEFO: { type: "boolean" },
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
    metadata: {
      version: "1.0.0",
      tags: ["optimization", "putaway", "warehouse", "location"],
      permissions: ["putaway:read", "putaway:optimize"],
      rateLimit: {
        requests: 50,
        window: 60,
      },
      cacheable: false, // Optimization results shouldn't be cached
      timeout: 20000,
      retries: 1,
      batchable: false,
      streaming: false,
      status: "ACTIVE",
    },
  });
}
