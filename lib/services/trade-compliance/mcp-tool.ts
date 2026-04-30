/**
 * Trade Compliance Service MCP Tools
 *
 * Enterprise-grade MCP tools for Trade Compliance and Regulatory Intelligence
 * Provides AI agents with access to trade compliance checking, risk analysis,
 * regulatory requirements, and document validation
 *
 * @module trade-compliance
 */

import type { MCPServer } from "@/lib/mcp/server";
import { tradeComplianceService } from "./tradeComplianceService";
import { decisionSupportService } from "./decisionSupportService";
import { predictiveAnalyticsService } from "./predictiveAnalyticsService";
import {
  createMCPToolHandler,
  validateParams,
  sanitizeError,
} from "@/lib/mcp/utils/baseTool";

/**
 * Register all Trade Compliance MCP tools
 */
export function registerMCPTools(server: MCPServer): void {
  /**
   * Check trade compliance - Comprehensive trade compliance check
   */
  server.registerTool({
    name: "check_trade_compliance",
    description:
      "Perform comprehensive trade compliance check including regulatory requirements, sanctions screening, tariff classification, and compliance risk assessment.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Product ID or SKU" },
        originCountry: { type: "string", description: "Origin country code" },
        destinationCountry: {
          type: "string",
          description: "Destination country code",
        },
        tradeFlow: {
          type: "string",
          enum: ["IMPORT", "EXPORT", "TRANSIT"],
          description: "Trade flow direction",
        },
        tenantId: { type: "string" },
      },
      required: [
        "productId",
        "originCountry",
        "destinationCountry",
        "tradeFlow",
        "tenantId",
      ],
    },
    handler: createMCPToolHandler(
      "check_trade_compliance",
      async (params, context) => {
        validateParams(params, [
          "productId",
          "originCountry",
          "destinationCountry",
          "tradeFlow",
          "tenantId",
        ]);

        try {
          const compliance = await tradeComplianceService.checkCompliance({
            productId: params.productId,
            originCountry: params.originCountry,
            destinationCountry: params.destinationCountry,
            tradeFlow: params.tradeFlow,
            tenantId: context.tenantId,
          });

          return {
            compliant: compliance.compliant,
            complianceStatus: compliance.status,
            requirements: compliance.requirements,
            restrictions: compliance.restrictions,
            licenses: compliance.licenses,
            certificates: compliance.certificates,
            riskLevel: compliance.riskLevel,
            recommendations: compliance.recommendations,
          };
        } catch (error) {
          throw new Error(
            `Failed to check trade compliance: ${sanitizeError(error)}`,
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
   * Analyze trade risks - Analyze trade risks and provide risk assessment
   */
  server.registerTool({
    name: "analyze_trade_risks",
    description:
      "Analyze trade risks including regulatory risks, financial risks, operational risks, and provide comprehensive risk assessment with mitigation recommendations.",
    inputSchema: {
      type: "object",
      properties: {
        shipmentId: { type: "string", description: "Shipment ID" },
        productId: { type: "string", description: "Product ID" },
        originCountry: { type: "string", description: "Origin country code" },
        destinationCountry: {
          type: "string",
          description: "Destination country code",
        },
        includePredictive: {
          type: "boolean",
          description: "Include predictive risk analysis (default: true)",
          default: true,
        },
        tenantId: { type: "string" },
      },
      required: [
        "productId",
        "originCountry",
        "destinationCountry",
        "tenantId",
      ],
    },
    handler: createMCPToolHandler(
      "analyze_trade_risks",
      async (params, context) => {
        validateParams(params, [
          "productId",
          "originCountry",
          "destinationCountry",
          "tenantId",
        ]);

        try {
          // Get risk analysis
          const riskAnalysis = await decisionSupportService.analyzeRisks({
            productId: params.productId,
            originCountry: params.originCountry,
            destinationCountry: params.destinationCountry,
            shipmentId: params.shipmentId,
            tenantId: context.tenantId,
          });

          let predictiveRisks = null;
          if (params.includePredictive) {
            try {
              const prediction = await predictiveAnalyticsService.predictRisks({
                productId: params.productId,
                originCountry: params.originCountry,
                destinationCountry: params.destinationCountry,
                tenantId: context.tenantId,
              });
              predictiveRisks = {
                predictedRisks: prediction.risks,
                riskProbability: prediction.probability,
                timeframe: prediction.timeframe,
                confidence: prediction.confidence,
              };
            } catch (error) {
              // Predictive analysis is optional
            }
          }

          return {
            riskLevel: riskAnalysis.riskLevel,
            overallRisk: riskAnalysis.overallRisk,
            riskFactors: riskAnalysis.riskFactors,
            regulatoryRisks: riskAnalysis.regulatoryRisks,
            financialRisks: riskAnalysis.financialRisks,
            operationalRisks: riskAnalysis.operationalRisks,
            mitigationStrategies: riskAnalysis.mitigationStrategies,
            predictiveRisks,
          };
        } catch (error) {
          throw new Error(
            `Failed to analyze trade risks: ${sanitizeError(error)}`,
          );
        }
      },
      {
        timeout: 25000,
        retries: 1,
        requireTenant: true,
      },
    ),
  });

  /**
   * Get regulatory requirements - Get regulatory requirements for a trade flow
   */
  server.registerTool({
    name: "get_regulatory_requirements",
    description:
      "Get comprehensive regulatory requirements for a trade flow including licenses, certificates, permits, and compliance obligations.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Product ID" },
        originCountry: { type: "string", description: "Origin country code" },
        destinationCountry: {
          type: "string",
          description: "Destination country code",
        },
        tradeFlow: {
          type: "string",
          enum: ["IMPORT", "EXPORT", "TRANSIT"],
        },
        includeCosts: {
          type: "boolean",
          description:
            "Include estimated costs for requirements (default: false)",
          default: false,
        },
        tenantId: { type: "string" },
      },
      required: [
        "productId",
        "originCountry",
        "destinationCountry",
        "tradeFlow",
        "tenantId",
      ],
    },
    handler: createMCPToolHandler(
      "get_regulatory_requirements",
      async (params, context) => {
        validateParams(params, [
          "productId",
          "originCountry",
          "destinationCountry",
          "tradeFlow",
          "tenantId",
        ]);

        try {
          const requirements =
            await tradeComplianceService.getRegulatoryRequirements({
              productId: params.productId,
              originCountry: params.originCountry,
              destinationCountry: params.destinationCountry,
              tradeFlow: params.tradeFlow,
              includeCosts: params.includeCosts,
              tenantId: context.tenantId,
            });

          return {
            requirements: requirements.requirements.map((req) => ({
              type: req.type,
              name: req.name,
              description: req.description,
              required: req.required,
              category: req.category,
              estimatedCost: req.estimatedCost,
              estimatedTime: req.estimatedTime,
            })),
            licenses: requirements.licenses,
            certificates: requirements.certificates,
            permits: requirements.permits,
            complianceObligations: requirements.complianceObligations,
            summary: {
              totalRequirements: requirements.requirements.length,
              requiredCount: requirements.requirements.filter((r) => r.required)
                .length,
              optionalCount: requirements.requirements.filter(
                (r) => !r.required,
              ).length,
            },
          };
        } catch (error) {
          throw new Error(
            `Failed to get regulatory requirements: ${sanitizeError(error)}`,
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
   * Validate trade documents - Validate trade compliance documents
   */
  server.registerTool({
    name: "validate_trade_documents",
    description:
      "Validate trade compliance documents including certificates, licenses, permits, and regulatory documents for completeness and compliance.",
    inputSchema: {
      type: "object",
      properties: {
        documentIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of document IDs to validate",
        },
        shipmentId: {
          type: "string",
          description: "Optional shipment ID for context",
        },
        tenantId: { type: "string" },
      },
      required: ["documentIds", "tenantId"],
    },
    handler: createMCPToolHandler(
      "validate_trade_documents",
      async (params, context) => {
        validateParams(params, ["documentIds", "tenantId"]);

        try {
          const validationResults = await Promise.all(
            params.documentIds.map(async (docId) => {
              const validation = await tradeComplianceService.validateDocument(
                docId,
                context.tenantId,
              );
              return {
                documentId: docId,
                valid: validation.valid,
                compliant: validation.compliant,
                errors: validation.errors,
                warnings: validation.warnings,
                expiryDate: validation.expiryDate,
                status: validation.status,
              };
            }),
          );

          const allValid = validationResults.every(
            (r) => r.valid && r.compliant,
          );
          const totalErrors = validationResults.reduce(
            (sum, r) => sum + r.errors.length,
            0,
          );

          return {
            valid: allValid,
            validationResults,
            summary: {
              totalDocuments: validationResults.length,
              validDocuments: validationResults.filter(
                (r) => r.valid && r.compliant,
              ).length,
              invalidDocuments: validationResults.filter(
                (r) => !r.valid || !r.compliant,
              ).length,
              totalErrors,
              expiredDocuments: validationResults.filter(
                (r) => r.expiryDate && new Date(r.expiryDate) < new Date(),
              ).length,
            },
          };
        } catch (error) {
          throw new Error(
            `Failed to validate trade documents: ${sanitizeError(error)}`,
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
}
