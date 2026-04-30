/**
 * MCP Tool Integration for Arabic NLP
 *
 * Makes Arabic NLP accessible via MCP (Model Context Protocol)
 * Allows AI agents to analyze Arabic text
 *
 * @module arabic-nlp
 */

import { arabicNLPService } from "./service";
import type { MCPTool } from "@/lib/mcp/server";

/**
 * Analyze Arabic text - MCP Tool
 */
export const analyzeArabicTextTool: MCPTool = {
  name: "analyze_arabic_text",
  description:
    "Analyze Arabic text for sentiment, intent, cultural context, and Inshallah usage. Returns comprehensive analysis including commitment level for cargo psychology.",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The Arabic text to analyze",
      },
      includeSentiment: {
        type: "boolean",
        description: "Include sentiment analysis (default: true)",
      },
      includeIntent: {
        type: "boolean",
        description: "Include intent detection (default: true)",
      },
      includeCulturalContext: {
        type: "boolean",
        description: "Include cultural context analysis (default: true)",
      },
      includeInshallah: {
        type: "boolean",
        description: "Include Inshallah analysis (default: true)",
      },
      shipmentId: {
        type: "string",
        description: "Optional shipment ID for context",
      },
    },
    required: ["text"],
  },
  handler: async (params: {
    text: string;
    includeSentiment?: boolean;
    includeIntent?: boolean;
    includeCulturalContext?: boolean;
    includeInshallah?: boolean;
    shipmentId?: string;
  }) => {
    try {
      const analysis = await arabicNLPService.analyze(params.text, {
        includeSentiment: params.includeSentiment !== false,
        includeIntent: params.includeIntent !== false,
        includeCulturalContext: params.includeCulturalContext !== false,
        includeInshallah: params.includeInshallah !== false,
        context: {
          shipmentId: params.shipmentId,
        },
      });

      return {
        success: true,
        data: {
          language: analysis.language,
          dialect: analysis.dialect,
          sentiment: analysis.sentiment.sentiment,
          intent: analysis.intent.intent,
          intentConfidence: analysis.intent.confidence,
          commitmentLevel: analysis.commitmentLevel,
          inshallahDetected: analysis.inshallahAnalysis.detected,
          inshallahContext: analysis.inshallahAnalysis.context,
          formality: analysis.culturalContext.formality,
          overallConfidence: analysis.overallConfidence,
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
 * Detect intent in Arabic text - MCP Tool
 */
export const detectArabicIntentTool: MCPTool = {
  name: "detect_arabic_intent",
  description:
    "Detect business intent in Arabic communication. Returns intent type, confidence, and evidence.",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The Arabic text to analyze for intent",
      },
      shipmentId: {
        type: "string",
        description: "Optional shipment ID for context",
      },
    },
    required: ["text"],
  },
  handler: async (params: { text: string; shipmentId?: string }) => {
    try {
      const intent = await arabicNLPService.detectIntent(params.text);

      return {
        success: true,
        data: {
          intent: intent.intent,
          confidence: intent.confidence,
          alternatives: intent.alternatives,
          evidence: intent.evidence,
          entities: intent.entities.map((e) => ({
            type: e.type,
            text: e.text,
            value: e.value,
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
 * Analyze Inshallah usage - MCP Tool
 */
export const analyzeInshallahTool: MCPTool = {
  name: "analyze_inshallah",
  description:
    "Analyze Inshallah usage in Arabic text. Critical for cargo psychology - indicates commitment level.",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The Arabic text to analyze for Inshallah",
      },
    },
    required: ["text"],
  },
  handler: async (params: { text: string }) => {
    try {
      const analysis = await arabicNLPService.analyzeInshallah(params.text);

      return {
        success: true,
        data: {
          detected: analysis.detected,
          count: analysis.count,
          context: analysis.context,
          commitmentScore: analysis.commitmentScore,
          positions: analysis.positions,
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
    mcpServer.registerTool(analyzeArabicTextTool);
    mcpServer.registerTool(detectArabicIntentTool);
    mcpServer.registerTool(analyzeInshallahTool);
    console.log("✅ Arabic NLP MCP tools registered");
  }
}
