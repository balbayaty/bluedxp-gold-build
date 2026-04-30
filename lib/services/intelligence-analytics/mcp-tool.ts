/**
 * Intelligence Analytics Service MCP Tools
 *
 * Enterprise-grade MCP tools for Intelligence & Analytics
 * Provides AI agents with access to root cause analysis, data mining,
 * process mining, and intelligent insights
 *
 * @module intelligence-analytics
 */

import type { MCPServer } from "@/lib/mcp/server";
import { rootCauseAnalysisEngine } from "./root-cause/rootCauseAnalysisEngine";
import { dataMiningEngine } from "./data-mining/dataMiningEngine";
import { processMiningEngine } from "./process-mining/processMiningEngine";
import { unifiedIntelligenceService } from "./core/unifiedIntelligenceService";
import {
  createMCPToolHandler,
  validateParams,
  sanitizeError,
} from "@/lib/mcp/utils/baseTool";

/**
 * Register all Intelligence Analytics MCP tools
 */
export function registerMCPTools(server: MCPServer): void {
  /**
   * Analyze root cause - Perform root cause analysis for an issue
   */
  server.registerTool({
    name: "analyze_root_cause",
    description:
      "Perform comprehensive root cause analysis for an issue, problem, or incident. Uses AI-powered correlation, evidence collection, and pattern recognition to identify root causes.",
    inputSchema: {
      type: "object",
      properties: {
        issueId: {
          type: "string",
          description: "Issue ID or problem identifier",
        },
        issueType: {
          type: "string",
          enum: [
            "SHIPMENT_DELAY",
            "QUALITY_ISSUE",
            "COMPLIANCE_VIOLATION",
            "OPERATIONAL_INCIDENT",
            "CUSTOM",
          ],
          description: "Type of issue",
        },
        description: { type: "string", description: "Issue description" },
        includeEvidence: {
          type: "boolean",
          description: "Include evidence collection (default: true)",
          default: true,
        },
        includeRecommendations: {
          type: "boolean",
          description: "Include recommendations (default: true)",
          default: true,
        },
        tenantId: { type: "string" },
      },
      required: ["issueType", "description", "tenantId"],
    },
    handler: createMCPToolHandler(
      "analyze_root_cause",
      async (params, context) => {
        validateParams(params, ["issueType", "description", "tenantId"]);

        try {
          const analysis = await rootCauseAnalysisEngine.analyze({
            issueId: params.issueId,
            issueType: params.issueType,
            description: params.description,
            tenantId: context.tenantId,
            includeEvidence: params.includeEvidence !== false,
            includeRecommendations: params.includeRecommendations !== false,
          });

          return {
            rootCauses: analysis.rootCauses.map((rc) => ({
              cause: rc.cause,
              confidence: rc.confidence,
              evidence: rc.evidence,
              impact: rc.impact,
              category: rc.category,
            })),
            contributingFactors: analysis.contributingFactors,
            evidence: params.includeEvidence ? analysis.evidence : undefined,
            recommendations: params.includeRecommendations
              ? analysis.recommendations
              : undefined,
            analysisMetadata: {
              analysisId: analysis.analysisId,
              timestamp: analysis.timestamp,
              confidence: analysis.confidence,
            },
          };
        } catch (error) {
          throw new Error(
            `Failed to analyze root cause: ${sanitizeError(error)}`,
          );
        }
      },
      {
        timeout: 30000, // 30 seconds for comprehensive analysis
        retries: 1,
        requireTenant: true,
      },
    ),
  });

  /**
   * Mine data - Perform data mining to discover patterns and insights
   */
  server.registerTool({
    name: "mine_data",
    description:
      "Perform data mining to discover patterns, trends, anomalies, and insights from operational data. Supports multiple data sources and mining algorithms.",
    inputSchema: {
      type: "object",
      properties: {
        dataSource: {
          type: "string",
          enum: [
            "SHIPMENTS",
            "INVENTORY",
            "ORDERS",
            "WAREHOUSE_OPERATIONS",
            "CUSTOM",
          ],
          description: "Data source to mine",
        },
        miningType: {
          type: "string",
          enum: [
            "PATTERNS",
            "ANOMALIES",
            "TRENDS",
            "ASSOCIATIONS",
            "CLUSTERS",
            "ALL",
          ],
          description: "Type of mining to perform (default: ALL)",
          default: "ALL",
        },
        timeRange: {
          type: "object",
          description: "Time range for data mining",
          properties: {
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
          },
        },
        filters: {
          type: "object",
          description: "Additional filters for data mining",
        },
        tenantId: { type: "string" },
      },
      required: ["dataSource", "tenantId"],
    },
    handler: createMCPToolHandler(
      "mine_data",
      async (params, context) => {
        validateParams(params, ["dataSource", "tenantId"]);

        try {
          const results = await dataMiningEngine.mine({
            dataSource: params.dataSource,
            miningType: params.miningType || "ALL",
            timeRange: params.timeRange,
            filters: params.filters || {},
            tenantId: context.tenantId,
          });

          return {
            patterns: results.patterns,
            anomalies: results.anomalies,
            trends: results.trends,
            associations: results.associations,
            clusters: results.clusters,
            insights: results.insights,
            summary: {
              totalRecords: results.totalRecords,
              patternsFound: results.patterns?.length || 0,
              anomaliesFound: results.anomalies?.length || 0,
              trendsIdentified: results.trends?.length || 0,
            },
          };
        } catch (error) {
          throw new Error(`Failed to mine data: ${sanitizeError(error)}`);
        }
      },
      {
        timeout: 30000,
        retries: 1,
        requireTenant: true,
      },
    ),
  });

  /**
   * Mine process - Perform process mining to discover and optimize processes
   */
  server.registerTool({
    name: "mine_process",
    description:
      "Perform process mining to discover actual process flows, identify bottlenecks, optimize processes, and generate process insights.",
    inputSchema: {
      type: "object",
      properties: {
        processType: {
          type: "string",
          enum: [
            "INBOUND",
            "OUTBOUND",
            "PUTAWAY",
            "PICKING",
            "SHIPMENT",
            "CUSTOM",
          ],
          description: "Process type to mine",
        },
        processId: {
          type: "string",
          description: "Optional specific process ID",
        },
        timeRange: {
          type: "object",
          description: "Time range for process mining",
          properties: {
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
          },
        },
        includeOptimization: {
          type: "boolean",
          description:
            "Include process optimization recommendations (default: true)",
          default: true,
        },
        tenantId: { type: "string" },
      },
      required: ["processType", "tenantId"],
    },
    handler: createMCPToolHandler(
      "mine_process",
      async (params, context) => {
        validateParams(params, ["processType", "tenantId"]);

        try {
          const results = await processMiningEngine.mine({
            processType: params.processType,
            processId: params.processId,
            timeRange: params.timeRange,
            includeOptimization: params.includeOptimization !== false,
            tenantId: context.tenantId,
          });

          return {
            discoveredProcess: results.discoveredProcess,
            processFlow: results.processFlow,
            bottlenecks: results.bottlenecks,
            optimization: params.includeOptimization
              ? results.optimization
              : undefined,
            metrics: results.metrics,
            insights: results.insights,
            summary: {
              totalInstances: results.totalInstances,
              averageDuration: results.averageDuration,
              bottlenecksFound: results.bottlenecks?.length || 0,
              optimizationOpportunities:
                results.optimization?.opportunities?.length || 0,
            },
          };
        } catch (error) {
          throw new Error(`Failed to mine process: ${sanitizeError(error)}`);
        }
      },
      {
        timeout: 30000,
        retries: 1,
        requireTenant: true,
      },
    ),
  });

  /**
   * Generate insights - Generate intelligent insights from data
   */
  server.registerTool({
    name: "generate_insights",
    description:
      "Generate intelligent insights from operational data using AI/ML models. Provides actionable recommendations and predictions.",
    inputSchema: {
      type: "object",
      properties: {
        insightType: {
          type: "string",
          enum: [
            "OPERATIONAL",
            "FINANCIAL",
            "COMPLIANCE",
            "PERFORMANCE",
            "PREDICTIVE",
            "ALL",
          ],
          description: "Type of insights to generate (default: ALL)",
          default: "ALL",
        },
        dataSource: {
          type: "string",
          enum: [
            "SHIPMENTS",
            "INVENTORY",
            "ORDERS",
            "WAREHOUSE",
            "TRANSPORTATION",
            "ALL",
          ],
          description: "Data source (default: ALL)",
          default: "ALL",
        },
        timeRange: {
          type: "object",
          description: "Time range for insights",
          properties: {
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
          },
        },
        includePredictions: {
          type: "boolean",
          description: "Include predictive insights (default: true)",
          default: true,
        },
        tenantId: { type: "string" },
      },
      required: ["tenantId"],
    },
    handler: createMCPToolHandler(
      "generate_insights",
      async (params, context) => {
        validateParams(params, ["tenantId"]);

        try {
          const insights = await unifiedIntelligenceService.generateInsights({
            insightType: params.insightType || "ALL",
            dataSource: params.dataSource || "ALL",
            timeRange: params.timeRange,
            includePredictions: params.includePredictions !== false,
            tenantId: context.tenantId,
          });

          return {
            insights: insights.insights.map((insight) => ({
              type: insight.type,
              title: insight.title,
              description: insight.description,
              priority: insight.priority,
              impact: insight.impact,
              recommendations: insight.recommendations,
              confidence: insight.confidence,
            })),
            predictions: params.includePredictions
              ? insights.predictions
              : undefined,
            summary: {
              totalInsights: insights.insights.length,
              highPriority: insights.insights.filter(
                (i) => i.priority === "HIGH",
              ).length,
              mediumPriority: insights.insights.filter(
                (i) => i.priority === "MEDIUM",
              ).length,
              lowPriority: insights.insights.filter((i) => i.priority === "LOW")
                .length,
            },
          };
        } catch (error) {
          throw new Error(
            `Failed to generate insights: ${sanitizeError(error)}`,
          );
        }
      },
      {
        timeout: 30000,
        retries: 1,
        requireTenant: true,
      },
    ),
  });

  /**
   * Predict trends - Predict future trends using ML models
   */
  server.registerTool({
    name: "predict_trends",
    description:
      "Predict future trends using machine learning models including demand forecasting, performance predictions, and trend analysis.",
    inputSchema: {
      type: "object",
      properties: {
        predictionType: {
          type: "string",
          enum: ["DEMAND", "PERFORMANCE", "COST", "VOLUME", "CUSTOM"],
          description: "Type of prediction",
        },
        entityId: {
          type: "string",
          description: "Entity ID (SKU, warehouse, etc.)",
        },
        timeHorizon: {
          type: "string",
          enum: ["SHORT_TERM", "MEDIUM_TERM", "LONG_TERM"],
          description: "Prediction time horizon (default: MEDIUM_TERM)",
          default: "MEDIUM_TERM",
        },
        includeConfidence: {
          type: "boolean",
          description: "Include confidence intervals (default: true)",
          default: true,
        },
        tenantId: { type: "string" },
      },
      required: ["predictionType", "entityId", "tenantId"],
    },
    handler: createMCPToolHandler(
      "predict_trends",
      async (params, context) => {
        validateParams(params, ["predictionType", "entityId", "tenantId"]);

        try {
          const prediction = await unifiedIntelligenceService.predictTrends({
            predictionType: params.predictionType,
            entityId: params.entityId,
            timeHorizon: params.timeHorizon || "MEDIUM_TERM",
            includeConfidence: params.includeConfidence !== false,
            tenantId: context.tenantId,
          });

          return {
            predictions: prediction.predictions,
            trends: prediction.trends,
            confidence: prediction.confidence,
            confidenceIntervals: params.includeConfidence
              ? prediction.confidenceIntervals
              : undefined,
            factors: prediction.factors,
            metadata: {
              model: prediction.model,
              accuracy: prediction.accuracy,
              timestamp: prediction.timestamp,
            },
          };
        } catch (error) {
          throw new Error(`Failed to predict trends: ${sanitizeError(error)}`);
        }
      },
      {
        timeout: 25000,
        retries: 1,
        requireTenant: true,
      },
    ),
  });
}
