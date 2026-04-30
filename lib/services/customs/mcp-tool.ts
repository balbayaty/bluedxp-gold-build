/**
 * Customs Service MCP Tools
 *
 * Enterprise-grade MCP tools for Customs and Regulatory Compliance
 * Provides AI agents with access to customs declarations, document management,
 * compliance checking, and regulatory requirements
 *
 * @module customs
 */

import type { MCPServer } from "@/lib/mcp/server";
import { customsOrchestrator } from "./customsOrchestrator";
import { documentService } from "./documentService";
import { complianceService } from "./complianceService";
import {
  createMCPToolHandler,
  validateParams,
  sanitizeError,
} from "@/lib/mcp/utils/baseTool";

/**
 * Register all Customs MCP tools
 */
export function registerMCPTools(server: MCPServer): void {
  /**
   * Check customs requirements - Get customs requirements for a shipment
   */
  server.registerTool({
    name: "check_customs_requirements",
    description:
      "Check customs requirements for a shipment including required documents, certificates, licenses, and regulatory requirements based on origin, destination, and cargo type.",
    inputSchema: {
      type: "object",
      properties: {
        originCountry: {
          type: "string",
          description: "Origin country code (ISO 3166-1 alpha-2)",
        },
        destinationCountry: {
          type: "string",
          description: "Destination country code",
        },
        cargoType: {
          type: "string",
          description: "Cargo type (e.g., CHEMICAL, FOOD, ELECTRONICS)",
        },
        cargoValue: { type: "number", description: "Cargo value" },
        cargoWeight: { type: "number", description: "Cargo weight in kg" },
        hazmat: { type: "boolean", description: "Is hazardous material" },
        tenantId: { type: "string" },
      },
      required: [
        "originCountry",
        "destinationCountry",
        "cargoType",
        "tenantId",
      ],
    },
    handler: createMCPToolHandler(
      "check_customs_requirements",
      async (params, context) => {
        validateParams(params, [
          "originCountry",
          "destinationCountry",
          "cargoType",
          "tenantId",
        ]);

        try {
          const requirements = await complianceService.checkRequirements({
            originCountry: params.originCountry,
            destinationCountry: params.destinationCountry,
            cargoType: params.cargoType,
            cargoValue: params.cargoValue,
            cargoWeight: params.cargoWeight,
            hazmat: params.hazmat || false,
            tenantId: context.tenantId,
          });

          return {
            requirements: requirements.requirements.map((req) => ({
              type: req.type,
              name: req.name,
              description: req.description,
              required: req.required,
              category: req.category,
            })),
            documents: requirements.documents,
            certificates: requirements.certificates,
            licenses: requirements.licenses,
            complianceStatus: requirements.complianceStatus,
            recommendations: requirements.recommendations,
          };
        } catch (error) {
          throw new Error(
            `Failed to check customs requirements: ${sanitizeError(error)}`,
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
   * Generate customs declaration - Generate customs declaration for a shipment
   */
  server.registerTool({
    name: "generate_customs_declaration",
    description:
      "Generate customs declaration document for a shipment including all required information, documents, and compliance data.",
    inputSchema: {
      type: "object",
      properties: {
        shipmentId: { type: "string", description: "Shipment ID" },
        declarationType: {
          type: "string",
          enum: ["IMPORT", "EXPORT", "TRANSIT"],
          description: "Declaration type",
        },
        tenantId: { type: "string" },
        userId: { type: "string" },
      },
      required: ["shipmentId", "declarationType", "tenantId", "userId"],
    },
    handler: createMCPToolHandler(
      "generate_customs_declaration",
      async (params, context) => {
        validateParams(params, [
          "shipmentId",
          "declarationType",
          "tenantId",
          "userId",
        ]);

        try {
          const result = await customsOrchestrator.orchestrate({
            shipmentId: params.shipmentId,
            workflow: "DECLARATION_GENERATION",
            tenantId: context.tenantId,
            userId: context.userId || "system",
          });

          return {
            declarationId: result.declarationId,
            status: result.status,
            documents: result.documents,
            submissionDate: result.submissionDate,
            clearanceDate: result.clearanceDate,
            requirements: result.requirements,
          };
        } catch (error) {
          throw new Error(
            `Failed to generate customs declaration: ${sanitizeError(error)}`,
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
   * Validate customs documents - Validate customs documents for completeness and compliance
   */
  server.registerTool({
    name: "validate_customs_documents",
    description:
      "Validate customs documents for a shipment including completeness check, format validation, and compliance verification.",
    inputSchema: {
      type: "object",
      properties: {
        shipmentId: { type: "string", description: "Shipment ID" },
        documentIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of document IDs to validate",
        },
        tenantId: { type: "string" },
      },
      required: ["shipmentId", "documentIds", "tenantId"],
    },
    handler: createMCPToolHandler(
      "validate_customs_documents",
      async (params, context) => {
        validateParams(params, ["shipmentId", "documentIds", "tenantId"]);

        try {
          const validationResults = await Promise.all(
            params.documentIds.map(async (docId) => {
              const validation = await documentService.validateDocument(
                docId,
                context.tenantId,
              );
              return {
                documentId: docId,
                valid: validation.valid,
                errors: validation.errors,
                warnings: validation.warnings,
                compliance: validation.compliance,
              };
            }),
          );

          const allValid = validationResults.every((r) => r.valid);
          const totalErrors = validationResults.reduce(
            (sum, r) => sum + r.errors.length,
            0,
          );
          const totalWarnings = validationResults.reduce(
            (sum, r) => sum + r.warnings.length,
            0,
          );

          return {
            shipmentId: params.shipmentId,
            valid: allValid,
            validationResults,
            summary: {
              totalDocuments: validationResults.length,
              validDocuments: validationResults.filter((r) => r.valid).length,
              invalidDocuments: validationResults.filter((r) => !r.valid)
                .length,
              totalErrors,
              totalWarnings,
            },
          };
        } catch (error) {
          throw new Error(
            `Failed to validate customs documents: ${sanitizeError(error)}`,
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
   * Track customs status - Track customs clearance status for a shipment
   */
  server.registerTool({
    name: "track_customs_status",
    description:
      "Track customs clearance status for a shipment including declaration status, clearance progress, and timeline.",
    inputSchema: {
      type: "object",
      properties: {
        shipmentId: { type: "string", description: "Shipment ID" },
        declarationId: {
          type: "string",
          description: "Optional declaration ID",
        },
        tenantId: { type: "string" },
      },
      required: ["shipmentId", "tenantId"],
    },
    handler: createMCPToolHandler(
      "track_customs_status",
      async (params, context) => {
        validateParams(params, ["shipmentId", "tenantId"]);

        try {
          const status = await customsOrchestrator.getShipmentCustomsStatus(
            params.shipmentId,
            context.tenantId,
          );

          return {
            shipmentId: params.shipmentId,
            declarationId: status.declarationId,
            status: status.status,
            clearanceDate: status.clearanceDate,
            documents: status.documents,
            requirements: status.requirements,
            timeline: status.timeline,
            exceptions: status.exceptions,
          };
        } catch (error) {
          throw new Error(
            `Failed to track customs status: ${sanitizeError(error)}`,
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
