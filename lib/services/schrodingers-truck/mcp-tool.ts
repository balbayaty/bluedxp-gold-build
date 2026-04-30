/**
 * MCP Tool Integration for Schrödinger's Truck
 *
 * Makes quantum state accessible via MCP (Model Context Protocol)
 * Allows AI agents to query and interact with quantum logistics
 *
 * @module schrodingers-truck
 */

import { schrodingersTruckService } from "./service";
import type { MCPTool } from "@/lib/mcp/server";

/**
 * Get shipment quantum state - MCP Tool
 */
export const getShipmentQuantumStateTool: MCPTool = {
  name: "get_shipment_quantum_state",
  description:
    "Get the current quantum state (COMMITTED, CONTINGENT, or PHANTOM) for a shipment. Returns probabilities, factors, and AI insights.",
  inputSchema: {
    type: "object",
    properties: {
      shipmentId: {
        type: "string",
        description: "The shipment ID to get quantum state for",
      },
    },
    required: ["shipmentId"],
  },
  handler: async (params: { shipmentId: string }) => {
    try {
      const state = await schrodingersTruckService.getQuantumState(
        params.shipmentId,
      );
      if (!state) {
        return {
          success: false,
          error: "Quantum state not found for this shipment",
        };
      }

      const insights = await schrodingersTruckService.getAIInsights(
        params.shipmentId,
      );

      return {
        success: true,
        data: {
          currentState: state.currentState,
          probabilities: state.probabilities,
          factors: state.factors,
          confidence: state.overallConfidence,
          collapsed: state.collapsed,
          aiInsights: insights,
          recommendations: insights?.recommendations || [],
          riskFactors: insights?.riskFactors || [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

/**
 * Collapse quantum state - MCP Tool
 */
export const collapseQuantumStateTool: MCPTool = {
  name: "collapse_quantum_state",
  description:
    "Trigger waveform collapse for a shipment quantum state. Updates probabilities based on observation.",
  inputSchema: {
    type: "object",
    properties: {
      shipmentId: {
        type: "string",
        description: "The shipment ID",
      },
      trigger: {
        type: "string",
        enum: [
          "WHATSAPP_PING",
          "GEOFENCE_ENTRY",
          "GEOFENCE_EXIT",
          "GPS_UPDATE",
          "MANUAL_UPDATE",
          "TIMEOUT",
          "WEATHER_ALERT",
          "TRAFFIC_ALERT",
          "CUSTOMER_CONFIRM",
          "VEHICLE_DIAGNOSTIC",
          "JOURNEY_TOUCHPOINT",
          "EXCEPTION_DETECTED",
        ],
        description: "The trigger that caused the collapse",
      },
      triggerData: {
        type: "object",
        description: "Additional data about the trigger",
      },
    },
    required: ["shipmentId", "trigger"],
  },
  handler: async (params: {
    shipmentId: string;
    trigger: string;
    triggerData?: Record<string, any>;
  }) => {
    try {
      const updatedState = await schrodingersTruckService.updateQuantumState(
        params.shipmentId,
        params.trigger as any,
        params.triggerData,
      );

      return {
        success: true,
        data: {
          previousState:
            updatedState.collapseHistory[
              updatedState.collapseHistory.length - 1
            ]?.previousState,
          newState: updatedState.currentState,
          probabilities: updatedState.probabilities,
          confidence: updatedState.overallConfidence,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

/**
 * Register MCP tools
 */
export function registerMCPTools(mcpServer: any): void {
  if (mcpServer && typeof mcpServer.registerTool === "function") {
    mcpServer.registerTool(getShipmentQuantumStateTool);
    mcpServer.registerTool(collapseQuantumStateTool);
    console.log("✅ Schrödinger's Truck MCP tools registered");
  }
}
