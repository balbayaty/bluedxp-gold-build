/**
 * MCP Tool Integration for Cargo Psychology
 *
 * Makes psychology state accessible via MCP (Model Context Protocol)
 * Allows AI agents to query and interact with cargo psychology
 *
 * @module cargo-psychology
 */

import { cargoPsychologyService } from "./service";
import type { MCPTool } from "@/lib/mcp/server";

/**
 * Get shipment psychology state - MCP Tool
 */
export const getShipmentPsychologyStateTool: MCPTool = {
  name: "get_shipment_psychology_state",
  description:
    "Get the current psychology state (COMMITTED, CONTINGENT, or PHANTOM) for a shipment. Returns psychology score, signals, and recommended interventions.",
  inputSchema: {
    type: "object",
    properties: {
      shipmentId: {
        type: "string",
        description: "The shipment ID to get psychology state for",
      },
    },
    required: ["shipmentId"],
  },
  handler: async (params: { shipmentId: string }) => {
    try {
      let state = await cargoPsychologyService.getPsychologyState(
        params.shipmentId,
      );

      // If not found, analyze
      if (!state) {
        state = await cargoPsychologyService.analyzeShipment(params.shipmentId);
      }

      return {
        success: true,
        data: {
          currentState: state.currentState,
          score: state.currentScore.score,
          confidence: state.currentScore.confidence,
          riskFactors: state.currentScore.riskFactors,
          positiveSignals: state.currentScore.positiveSignals,
          recommendedIntervention: state.currentScore.recommendedIntervention,
          signalAnalyses: state.currentScore.signalAnalyses.map((a) => ({
            signal: a.signal,
            riskScore: a.riskScore,
            value: a.value,
          })),
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
 * Execute psychology intervention - MCP Tool
 */
export const executePsychologyInterventionTool: MCPTool = {
  name: "execute_psychology_intervention",
  description:
    "Execute an intervention based on psychology state. Automatically selects appropriate action and channel.",
  inputSchema: {
    type: "object",
    properties: {
      shipmentId: {
        type: "string",
        description: "The shipment ID",
      },
      action: {
        type: "string",
        enum: [
          "STANDARD_CONFIRMATION",
          "PERSONALIZED_CALL",
          "DOCUMENT_REQUEST",
          "PAYMENT_REMINDER",
          "ALTERNATIVE_DATE_OFFER",
          "MANAGER_ESCALATION",
          "PREPAYMENT_REQUEST",
          "BACKUP_PREPARATION",
          "OVERBOOKING_PROTECTION",
          "DOCUMENT_INTERACTION",
        ],
        description: "The intervention action to execute",
      },
      channel: {
        type: "string",
        enum: ["WHATSAPP", "EMAIL", "PHONE", "SMS", "MULTI_CHANNEL"],
        description:
          "Communication channel (optional, will be auto-selected if not provided)",
      },
    },
    required: ["shipmentId", "action"],
  },
  handler: async (params: {
    shipmentId: string;
    action: string;
    channel?: string;
  }) => {
    try {
      const record = await cargoPsychologyService.executeIntervention(
        params.shipmentId,
        params.action as any,
        params.channel,
      );

      return {
        success: true,
        data: {
          interventionId: record.id,
          action: record.action,
          channel: record.channel,
          outcome: record.outcome,
          responseReceived: record.responseReceived,
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
    mcpServer.registerTool(getShipmentPsychologyStateTool);
    mcpServer.registerTool(executePsychologyInterventionTool);
    console.log("✅ Cargo Psychology MCP tools registered");
  }
}
