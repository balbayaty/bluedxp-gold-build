import type {
  CopilotToolId,
  CopilotToolExecutionResponse,
} from "@/types/copilotTools";
import { copilotToolRegistry } from "./toolRegistry";
import { BUILTIN_COPILOT_TOOLS } from "./builtins";

import { searchAllDomainKBs } from "@/lib/services/knowledge-base/domain-kbs";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { ocrService } from "@/lib/services/ocr/ocrService";
import { msdsExtractionRegistry } from "@/lib/services/chemical/extraction/msdsExtractionRegistry";
import { msdsDomainService } from "@/lib/services/chemical/msdsDomainService";
import type { MSDSDocument } from "@/types/chemical";
import {
  evidencePacketService,
  evidenceService,
} from "@/lib/services/evidence";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";
import type {
  CustomsDocument,
  CustomsInfo,
  ShipmentDocument,
  TransportMode,
} from "@/types/tms";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import { prisma } from "@/lib/services/database/prismaClient";
import {
  initializeCustomsDeclarationLifecycle,
  transitionCustomsDeclarationLifecycle,
} from "@/lib/services/transportation/customs/customsLifecycleIntegration";
import { asnService } from "@/lib/services/asn";

type ExecutionContext = {
  tenantId: string;
  userId: string;
  roles?: string[];
};

function requireObject(input: unknown, name: string): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`${name} must be an object`);
  }
  return input as Record<string, unknown>;
}

function requireString(v: unknown, name: string, maxLen = 200_000): string {
  if (typeof v !== "string" || v.trim().length === 0)
    throw new Error(`${name} is required`);
  if (v.length > maxLen) throw new Error(`${name} is too large`);
  return v;
}

function optionalString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v : undefined;
}

function optionalNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function redactSecrets(text: string): string {
  const openaiRedacted = text.replace(
    /\bsk-[A-Za-z0-9_-]{20,}\b/g,
    "sk-***REDACTED***",
  );
  return openaiRedacted.replace(
    /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,
    "sk-ant-***REDACTED***",
  );
}

function safePreview(value: unknown, max = 2000): string {
  try {
    const raw = typeof value === "string" ? value : JSON.stringify(value);
    return redactSecrets(raw).slice(0, max);
  } catch {
    return "[unserializable]";
  }
}

async function learnFromTool(params: {
  tenantId: string;
  userId: string;
  toolId: string;
  input: unknown;
  output: unknown;
  success: boolean;
  confidence: number;
}) {
  try {
    await knowledgeBaseService.learn({
      type: params.success ? "insight_generated" : "error_pattern",
      tenantId: params.tenantId,
      agentId: "hazalyze-copilot",
      trigger: `Copilot tool: ${params.toolId}`,
      input: params.input as any,
      output: params.output as any,
      success: params.success,
      confidence: params.confidence,
      metadata: {
        userId: params.userId,
        toolId: params.toolId,
        outputPreview: safePreview(params.output, 1000),
      },
    } as any);
  } catch {
    // Non-blocking: learning must never break tool execution
  }
}

function normalizeTransportMode(mode?: unknown): TransportMode | undefined {
  if (typeof mode !== "string") return undefined;
  const upper = mode.toUpperCase();
  const allowed: TransportMode[] = [
    "AIR",
    "SEA",
    "LAND",
    "RAIL",
    "MULTIMODAL",
    "EXPRESS",
    "COURIER",
  ];
  return (allowed as string[]).includes(upper)
    ? (upper as TransportMode)
    : undefined;
}

function computeRequiredCustomsDocs(params: {
  mode?: TransportMode;
  isImport?: boolean;
  isExport?: boolean;
  includeMSDS?: boolean;
}): Array<CustomsDocument["type"]> {
  const required: Array<CustomsDocument["type"]> = [
    "COMMERCIAL_INVOICE",
    "PACKING_LIST",
    "CERTIFICATE_OF_ORIGIN",
  ];

  const isImport = params.isImport === true;
  const isExport = params.isExport === true;
  if (isImport) required.push("IMPORT_LICENSE");
  if (isExport) required.push("EXPORT_LICENSE");

  if (params.mode === "SEA") required.push("BILL_OF_LADING");
  if (params.mode === "AIR") required.push("AIRWAY_BILL");

  if (params.includeMSDS) required.push("OTHER"); // store MSDS as OTHER + tag, unless you add MSDS to CustomsDocument union
  return Array.from(new Set(required));
}

// Register built-ins at module load
for (const t of BUILTIN_COPILOT_TOOLS) copilotToolRegistry.register(t);

export class CopilotToolExecutionService {
  listTools() {
    return copilotToolRegistry.list();
  }

  async execute(
    toolId: CopilotToolId,
    input: unknown,
    ctx: ExecutionContext,
  ): Promise<CopilotToolExecutionResponse> {
    const tool = copilotToolRegistry.get(toolId);

    switch (toolId) {
      case "kb.search": {
        const o = requireObject(input, "input");
        const query = requireString(o.query, "query", 1000);
        const limit =
          typeof o.limit === "number"
            ? Math.min(50, Math.max(1, Math.floor(o.limit)))
            : 10;
        const domainKBs = Array.isArray(o.domainKBs)
          ? (o.domainKBs.filter((x) => typeof x === "string") as any)
          : undefined;

        const results = await searchAllDomainKBs(
          ctx.tenantId,
          query,
          domainKBs,
          limit,
        );

        return {
          success: true,
          toolId,
          output: results.map((r) => ({
            domainKB: r.domainKB,
            score: r.score,
            id: r.entry.id,
            summary: r.entry.summary,
            category: r.entry.category,
            type: r.entry.type,
          })),
        };
      }

      case "ocr.extract_pdf_text": {
        const o = requireObject(input, "input");
        const base64Pdf = requireString(o.base64Pdf, "base64Pdf", 15_000_000); // ~11MB raw
        const language = optionalString(o.language) || "eng";
        const maxPages =
          typeof o.maxPages === "number"
            ? Math.min(3, Math.max(1, Math.floor(o.maxPages)))
            : 2;

        // Defensive: don't accept data: URLs
        if (base64Pdf.startsWith("data:")) {
          throw new Error("base64Pdf must NOT include a data: URL prefix");
        }

        const buf = Buffer.from(base64Pdf, "base64");
        // Ensure OCR service init (non-fatal if fails)
        try {
          await ocrService.initialize();
        } catch {
          // ignore
        }

        // Hack: pass maxPages/scale via config extension used inside service
        const result = await ocrService.extractTextFromPDF(buf, {
          language,
          psm: 6,
        } as any);

        // Evidence (lightweight)
        const evd = await evidenceService.create({
          tenantId: ctx.tenantId,
          type: "event",
          category: "compliance",
          title: "OCR extracted text from PDF",
          description: "Copilot tool execution: OCR PDF text extraction",
          content: JSON.stringify(
            {
              toolId,
              language,
              maxPages,
              bytes: buf.byteLength,
              resultPreview: safePreview(result.text, 2000),
              confidence: result.confidence,
            },
            null,
            2,
          ),
          createdBy: ctx.userId,
          metadata: {
            source: "copilot-tool",
            capturedAt: new Date().toISOString(),
            capturedMethod: "api",
          },
          tags: ["copilot", "ocr", "msds"],
        });

        await eventBus.publish(
          createEvent(
            "copilot.tool.executed",
            evd.id,
            "Evidence",
            { toolId, evidenceId: evd.id, tenantId: ctx.tenantId },
            1,
            { tenantId: ctx.tenantId, userId: ctx.userId, source: "copilot" },
          ),
        );

        return {
          success: true,
          toolId,
          evidenceId: evd.id,
          output: { ...result, text: result.text.slice(0, 30_000) },
        };
      }

      case "msds.ingest_from_text": {
        const o = requireObject(input, "input");
        const text = requireString(o.text, "text", 400_000);
        const language = optionalString(o.language) || "en";
        const fileUrl = optionalString(o.fileUrl);
        const fileType =
          (optionalString(o.fileType) as MSDSDocument["fileType"]) || "pdf";

        const adapter = msdsExtractionRegistry.getForTenant(ctx.tenantId);
        const extraction = await adapter.extractFromText(text, {
          tenantId: ctx.tenantId,
          language,
        });

        const msds: MSDSDocument = {
          id: `msds-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          chemicalName:
            optionalString(o.chemicalName) ||
            extraction.extractedData.productName ||
            "Unknown",
          manufacturer:
            optionalString(o.manufacturer) ||
            extraction.extractedData.manufacturer ||
            "Unknown",
          version: "1.0",
          language,
          fileUrl,
          fileType,
          extractedData: extraction.extractedData,
          status: "analyzing",
          workflowStatus: "pending_analysis",
          metadata: {
            submittedDate: new Date().toISOString(),
            source: "copilot",
          } as any,
        };

        const msdsId = await msdsDomainService.storeExtractedMSDS({
          tenantId: ctx.tenantId,
          actor: { userId: ctx.userId, roles: ctx.roles },
          msds,
          extractedData: extraction.extractedData,
          source: "api",
        });

        return {
          success: true,
          toolId,
          output: {
            msdsId,
            adapter: { id: adapter.id, name: adapter.name },
            confidence: extraction.confidence,
            issues: extraction.issues,
            extractedData: extraction.extractedData,
          },
        };
      }

      case "tms.customs.declaration.create": {
        const o = requireObject(input, "input");
        const now = new Date().toISOString();

        const declaration: CustomsInfo & { id: string; shipmentId?: string } = {
          status: "PENDING",
          declarationNumber: `CD-${Date.now()}`,
          documents: [],
          customsValue: typeof o.customsValue === "number" ? o.customsValue : 0,
          currency: optionalString(o.currency) || "SAR",
          countryOfOrigin: requireString(
            o.countryOfOrigin,
            "countryOfOrigin",
            120,
          ),
          countryOfDestination: requireString(
            o.countryOfDestination,
            "countryOfDestination",
            120,
          ),
          inspectionRequired: Boolean(o.inspectionRequired || false),
          brokerId: optionalString(o.brokerId),
          brokerName: optionalString(o.brokerName),
          brokerLicense: optionalString(o.brokerLicense),
          hsCode: optionalString(o.hsCode),
          duties: typeof o.duties === "number" ? o.duties : undefined,
          taxes: typeof o.taxes === "number" ? o.taxes : undefined,
          complianceStatus: "PENDING",
          complianceNotes: undefined,
          id: `CD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          shipmentId: optionalString(o.shipmentId),
        };

        await transportationDatabaseAdapterInstance.storeCustomsDeclaration(
          declaration as any,
          {
            tenantId: ctx.tenantId,
            createdBy: ctx.userId,
          },
        );

        // Process & Lifecycle integration (tenant-safe via composite entityId in helper)
        try {
          await initializeCustomsDeclarationLifecycle({
            tenantId: ctx.tenantId,
            declarationId: declaration.id,
            initialData: {
              declarationNumber: declaration.declarationNumber,
              shipmentId: declaration.shipmentId,
              createdBy: ctx.userId,
            },
          });
        } catch (e) {
          // Never fail the tool if lifecycle is temporarily unavailable
          console.warn(
            "[CopilotToolExecutionService] Failed to initialize customs lifecycle:",
            e,
          );
        }

        const evd = await evidenceService.create({
          tenantId: ctx.tenantId,
          type: "event",
          category: "compliance",
          title: `Customs declaration created: ${declaration.declarationNumber}`,
          description: "Copilot tool execution: customs declaration created",
          content: JSON.stringify(
            {
              declarationId: declaration.id,
              shipmentId: declaration.shipmentId,
              createdAt: now,
            },
            null,
            2,
          ),
          createdBy: ctx.userId,
          metadata: {
            source: "copilot-tool",
            capturedAt: now,
            capturedMethod: "api",
          },
          relatedEntities: [
            {
              entityId: declaration.id,
              entityType: "customs_declaration",
              relationship: "subject",
              addedAt: now,
            },
          ],
          tags: ["copilot", "tms", "customs", "declaration"],
        } as any);

        await eventBus.publish(
          createEvent(
            "transportation.customs.declaration.created",
            declaration.id,
            "CustomsDeclaration",
            {
              declarationId: declaration.id,
              shipmentId: declaration.shipmentId,
              evidenceId: evd.id,
            },
            1,
            {
              tenantId: ctx.tenantId,
              userId: ctx.userId,
              source: "copilot",
            } as any,
          ),
        );

        await learnFromTool({
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          toolId,
          input,
          output: { declarationId: declaration.id },
          success: true,
          confidence: 85,
        });

        return {
          success: true,
          toolId,
          evidenceId: evd.id,
          output: declaration,
        };
      }

      case "tms.customs.declaration.required_documents": {
        const o = requireObject(input, "input");
        const declarationId = requireString(
          o.declarationId,
          "declarationId",
          200,
        );
        const decl =
          await transportationDatabaseAdapterInstance.getCustomsDeclaration(
            ctx.tenantId,
            declarationId,
          );
        if (!decl) throw new Error("Declaration not found");

        const mode = normalizeTransportMode(o.transportMode);
        const includeMSDS = Boolean(o.includeMSDS || false);

        const declaredDocs: CustomsDocument[] = Array.isArray(
          (decl as any).documents,
        )
          ? ((decl as any).documents as any)
          : [];
        const shipmentId =
          typeof (decl as any).shipmentId === "string"
            ? (decl as any).shipmentId
            : undefined;
        const shipmentDocs: ShipmentDocument[] = shipmentId
          ? await transportationDatabaseAdapterInstance.listDocuments({
              tenantId: ctx.tenantId,
              shipmentId,
              limit: 500,
              offset: 0,
            })
          : [];

        const required = computeRequiredCustomsDocs({
          mode,
          isImport: typeof o.isImport === "boolean" ? o.isImport : undefined,
          isExport: typeof o.isExport === "boolean" ? o.isExport : undefined,
          includeMSDS,
        });

        const presentCustomsTypes = new Set(declaredDocs.map((d) => d.type));
        const presentShipmentTypes = new Set(
          shipmentDocs.map((d) => String(d.type)),
        );

        const missing = required.filter((t) => {
          if (presentCustomsTypes.has(t)) return false;
          // also accept presence via shipment docs with same type string
          if (presentShipmentTypes.has(t)) return false;
          return true;
        });

        const output = {
          declarationId,
          shipmentId,
          required,
          missing,
          present: Array.from(
            new Set([
              ...presentCustomsTypes,
              ...(Array.from(presentShipmentTypes) as any),
            ]),
          ),
          note: includeMSDS
            ? "MSDS is represented as OTHER unless you add MSDS to CustomsDocument types."
            : undefined,
        };

        await learnFromTool({
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          toolId,
          input,
          output,
          success: true,
          confidence: 80,
        });

        // Process & Lifecycle integration: mark that docs requirements were computed/known
        try {
          await transitionCustomsDeclarationLifecycle({
            tenantId: ctx.tenantId,
            declarationId,
            toStageId: "CUSTOMS_DOCS_REQUIRED",
            context: {
              missingCount: missing.length,
              requiredCount: required.length,
              computedAt: new Date().toISOString(),
            },
          });
        } catch (e) {
          console.warn(
            "[CopilotToolExecutionService] Failed to transition customs lifecycle (DOCS_REQUIRED):",
            e,
          );
        }

        return { success: true, toolId, output };
      }

      case "tms.customs.document.attach": {
        const o = requireObject(input, "input");
        const declarationId = requireString(
          o.declarationId,
          "declarationId",
          200,
        );
        const shipmentId = requireString(o.shipmentId, "shipmentId", 200);
        const docType = requireString(
          o.docType,
          "docType",
          80,
        ) as CustomsDocument["type"];
        const name = requireString(o.name, "name", 200);
        const fileUrl = requireString(o.fileUrl, "fileUrl", 2000);
        const now = new Date().toISOString();

        const doc: ShipmentDocument = {
          id: `TDOC-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          shipmentId,
          type: docType,
          name,
          fileUrl,
          uploadedBy: ctx.userId,
          uploadedAt: now,
          status: "PENDING",
          tags: ["customs", docType.toLowerCase()],
        };

        await transportationDatabaseAdapterInstance.storeDocument(doc, {
          tenantId: ctx.tenantId,
          createdBy: ctx.userId,
        });

        const decl =
          await transportationDatabaseAdapterInstance.getCustomsDeclaration(
            ctx.tenantId,
            declarationId,
          );
        if (!decl) throw new Error("Declaration not found");

        const existingDocs: CustomsDocument[] = Array.isArray(
          (decl as any).documents,
        )
          ? ((decl as any).documents as any)
          : [];
        const linked: CustomsDocument = {
          id: `CDOC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: docType,
          fileUrl,
          status: "RECEIVED",
          issueDate: now,
        };

        const updatedDocs = [
          ...existingDocs.filter((d) => d.type !== docType),
          linked,
        ];

        await transportationDatabaseAdapterInstance.updateCustomsDeclaration({
          tenantId: ctx.tenantId,
          id: declarationId,
          updatedBy: ctx.userId,
          patch: { documents: updatedDocs, status: "DOCUMENTS_SUBMITTED" },
        });

        const evd = await evidenceService.create({
          tenantId: ctx.tenantId,
          type: "event",
          category: "compliance",
          title: `Customs document attached: ${docType}`,
          description: "Copilot tool execution: customs document attached",
          content: JSON.stringify(
            { declarationId, shipmentId, docId: doc.id, fileUrl },
            null,
            2,
          ),
          createdBy: ctx.userId,
          metadata: {
            source: "copilot-tool",
            capturedAt: now,
            capturedMethod: "api",
          },
          relatedEntities: [
            {
              entityId: declarationId,
              entityType: "customs_declaration",
              relationship: "subject",
              addedAt: now,
            },
            {
              entityId: doc.id,
              entityType: "transport_document",
              relationship: "evidence",
              addedAt: now,
            },
          ],
          tags: ["copilot", "tms", "customs", "document"],
        } as any);

        await eventBus.publish(
          createEvent(
            "transportation.customs.document.attached",
            declarationId,
            "CustomsDeclaration",
            {
              declarationId,
              shipmentId,
              documentId: doc.id,
              evidenceId: evd.id,
            },
            1,
            {
              tenantId: ctx.tenantId,
              userId: ctx.userId,
              source: "copilot",
            } as any,
          ),
        );

        await learnFromTool({
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          toolId,
          input,
          output: { declarationId, shipmentId, documentId: doc.id },
          success: true,
          confidence: 85,
        });

        // Process & Lifecycle integration
        try {
          await transitionCustomsDeclarationLifecycle({
            tenantId: ctx.tenantId,
            declarationId,
            toStageId: "CUSTOMS_DOCS_ATTACHED",
            context: {
              docType,
              shipmentId,
              documentId: doc.id,
              attachedAt: now,
              userId: ctx.userId,
            },
          });
        } catch (e) {
          console.warn(
            "[CopilotToolExecutionService] Failed to transition customs lifecycle (DOCS_ATTACHED):",
            e,
          );
        }

        return {
          success: true,
          toolId,
          evidenceId: evd.id,
          output: {
            declarationId,
            shipmentId,
            document: doc,
            linkedCustomsDocument: linked,
          },
        };
      }

      case "tms.customs.declaration.submit": {
        const o = requireObject(input, "input");
        const declarationId = requireString(
          o.declarationId,
          "declarationId",
          200,
        );
        const now = new Date().toISOString();

        const existing =
          await transportationDatabaseAdapterInstance.getCustomsDeclaration(
            ctx.tenantId,
            declarationId,
          );
        if (!existing) throw new Error("Declaration not found");

        // Integration-first: do NOT hardcode portals here. Emit a request event for adapters/webhooks to handle.
        const patch: Record<string, unknown> = {
          status: "DOCUMENTS_SUBMITTED",
          complianceStatus: "PENDING",
          complianceNotes: `Submission requested via Copilot at ${now}`,
          integration: {
            requestedSystem: optionalString(o.system),
            requestedCountryCode: optionalString(o.countryCode),
            requestedAt: now,
          },
        };

        const updated =
          await transportationDatabaseAdapterInstance.updateCustomsDeclaration({
            tenantId: ctx.tenantId,
            id: declarationId,
            updatedBy: ctx.userId,
            patch,
          });

        const evd = await evidenceService.create({
          tenantId: ctx.tenantId,
          type: "event",
          category: "compliance",
          title: `Customs declaration submission requested: ${declarationId}`,
          description:
            "Copilot tool execution: submission requested (integration queue)",
          content: JSON.stringify({ declarationId, patch }, null, 2),
          createdBy: ctx.userId,
          metadata: {
            source: "copilot-tool",
            capturedAt: now,
            capturedMethod: "api",
          },
          relatedEntities: [
            {
              entityId: declarationId,
              entityType: "customs_declaration",
              relationship: "subject",
              addedAt: now,
            },
          ],
          tags: ["copilot", "tms", "customs", "submission"],
        } as any);

        await eventBus.publish(
          createEvent(
            "transportation.customs.declaration.submission_requested",
            declarationId,
            "CustomsDeclaration",
            {
              declarationId,
              evidenceId: evd.id,
              requestedAt: now,
              system: optionalString(o.system),
              countryCode: optionalString(o.countryCode),
            },
            1,
            {
              tenantId: ctx.tenantId,
              userId: ctx.userId,
              source: "copilot",
            } as any,
          ),
        );

        await learnFromTool({
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          toolId,
          input,
          output: { declarationId, status: "DOCUMENTS_SUBMITTED" },
          success: true,
          confidence: 80,
        });

        // Process & Lifecycle integration: submission requested (integration-first)
        try {
          await transitionCustomsDeclarationLifecycle({
            tenantId: ctx.tenantId,
            declarationId,
            toStageId: "CUSTOMS_SUBMISSION_REQUESTED",
            context: {
              requestedAt: now,
              system: optionalString(o.system),
              countryCode: optionalString(o.countryCode),
              userId: ctx.userId,
              evidenceId: evd.id,
            },
          });
        } catch (e) {
          console.warn(
            "[CopilotToolExecutionService] Failed to transition customs lifecycle (SUBMISSION_REQUESTED):",
            e,
          );
        }

        return { success: true, toolId, evidenceId: evd.id, output: updated };
      }

      case "tms.customs.declaration.evidence_packet": {
        const o = requireObject(input, "input");
        const declarationId = requireString(
          o.declarationId,
          "declarationId",
          200,
        );

        const packet = await evidencePacketService.generatePacket(
          {
            entityType: "CustomsDeclaration",
            entityId: declarationId,
            claimType: "customs_clearance",
          },
          {
            id: ctx.userId,
            name: "Copilot User",
            tenantId: ctx.tenantId,
            type: "user",
          },
        );

        await learnFromTool({
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          toolId,
          input,
          output: { packetId: packet.id, evidenceId: packet.evidenceId },
          success: true,
          confidence: 90,
        });

        // Process & Lifecycle integration: evidence packet generated
        try {
          await transitionCustomsDeclarationLifecycle({
            tenantId: ctx.tenantId,
            declarationId,
            toStageId: "CUSTOMS_EVIDENCE_PACKET",
            context: {
              packetId: packet.id,
              evidenceId: packet.evidenceId,
              generatedAt: new Date().toISOString(),
            },
          });
        } catch (e) {
          console.warn(
            "[CopilotToolExecutionService] Failed to transition customs lifecycle (EVIDENCE_PACKET):",
            e,
          );
        }

        return {
          success: true,
          toolId,
          output: packet,
          evidenceId: packet.evidenceId,
        };
      }

      case "proposals-rfq.proposal.create_draft": {
        const o = requireObject(input, "input");
        const title = requireString(o.title, "title", 300);
        const description = optionalString(o.description);
        const proposalType =
          optionalString(o.proposalType) || "SERVICE_PROPOSAL";
        const customerName = optionalString(o.customerName);
        const customerEmail = optionalString(o.customerEmail);
        const currency = optionalString(o.currency) || "SAR";

        const proposalNumber = `PROP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

        // Minimal DB-backed draft (sections/pricing as JSON)
        const created = await prisma.proposal.create({
          data: {
            tenantId: ctx.tenantId,
            proposalNumber,
            title,
            description,
            executiveSummary: null,
            proposalType,
            status: "DRAFT",
            customerId: null,
            customerName,
            customerEmail,
            rfqId: null,
            rfqReference: null,
            sections: [] as any,
            pricing: {} as any,
            totalAmount: null,
            currency,
            branding: null,
            validUntil: null,
            sentAt: null,
            acceptedAt: null,
            rejectedAt: null,
            expiresAt: null,
            recipients: null,
            metadata: { source: "copilot" } as any,
            tags: [],
            trackingEnabled: true,
            signatureRequired: false,
            signatureWorkflowId: null,
            createdBy: ctx.userId,
            updatedBy: null,
          },
        });

        const now = new Date().toISOString();
        const evd = await evidenceService.create({
          tenantId: ctx.tenantId,
          type: "event",
          category: "compliance",
          title: `Proposal draft created: ${proposalNumber}`,
          description: "Copilot tool execution: proposal draft created",
          content: JSON.stringify(
            { proposalId: created.id, proposalNumber, title },
            null,
            2,
          ),
          createdBy: ctx.userId,
          metadata: {
            source: "copilot-tool",
            capturedAt: now,
            capturedMethod: "api",
          },
          relatedEntities: [
            {
              entityId: created.id,
              entityType: "proposal",
              relationship: "subject",
              addedAt: now,
            },
          ],
          tags: ["copilot", "proposals", "rfq", "draft"],
        } as any);

        await eventBus.publish(
          createEvent(
            "proposals-rfq.proposal.created",
            created.id,
            "Proposal",
            {
              proposalId: created.id,
              proposalNumber,
              status: created.status,
              evidenceId: evd.id,
            },
            1,
            {
              tenantId: ctx.tenantId,
              userId: ctx.userId,
              source: "copilot",
            } as any,
          ),
        );

        await learnFromTool({
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          toolId,
          input,
          output: { proposalId: created.id, proposalNumber },
          success: true,
          confidence: 85,
        });

        return {
          success: true,
          toolId,
          evidenceId: evd.id,
          output: {
            ...created,
            message: `✅ Successfully created proposal ${proposalNumber}: ${title}`,
            // ADD NAVIGATION ACTION
            action: "navigate",
            path: `/proposals/rfq/${created.id}`,
            entityType: "Proposal",
            entityId: created.id,
          },
        };
      }

      case "proposals-rfq.proposal.get": {
        const o = requireObject(input, "input");
        const proposalId = requireString(o.proposalId, "proposalId", 200);

        const row = await prisma.proposal.findFirst({
          where: { id: proposalId, tenantId: ctx.tenantId },
        });
        if (!row) throw new Error("Proposal not found");

        await learnFromTool({
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          toolId,
          input,
          output: { proposalId },
          success: true,
          confidence: 90,
        });

        return { success: true, toolId, output: row };
      }

      case "proposals-rfq.proposal.list": {
        const o = requireObject(input, "input");
        const status = optionalString(o.status);
        const limit =
          typeof o.limit === "number"
            ? Math.min(50, Math.max(1, Math.floor(o.limit)))
            : 20;

        const rows = await prisma.proposal.findMany({
          where: { tenantId: ctx.tenantId, ...(status ? { status } : {}) },
          orderBy: { createdAt: "desc" },
          take: limit,
        });

        await learnFromTool({
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          toolId,
          input,
          output: { count: rows.length },
          success: true,
          confidence: 85,
        });

        return {
          success: true,
          toolId,
          output: rows.map((r) => ({
            id: r.id,
            proposalNumber: r.proposalNumber,
            title: r.title,
            status: r.status,
            proposalType: r.proposalType,
            customerName: r.customerName,
            createdAt: r.createdAt,
          })),
        };
      }

      case "evidence.generate_packet": {
        const o = requireObject(input, "input");
        const entityType = requireString(o.entityType, "entityType", 80);
        const entityId = requireString(o.entityId, "entityId", 200);
        const claimType = requireString(o.claimType, "claimType", 120);

        const packet = await evidencePacketService.generatePacket(
          { entityType, entityId, claimType },
          {
            id: ctx.userId,
            name: "Copilot User",
            tenantId: ctx.tenantId,
            type: "user",
          },
        );

        return {
          success: true,
          toolId,
          output: packet,
          evidenceId: packet.evidenceId,
        };
      }

      case "ui.navigate": {
        const o = requireObject(input, "input");
        const path = requireString(o.path, "path", 500);
        const description = optionalString(o.description);

        // Validate path starts with / for security
        if (!path.startsWith("/")) {
          return { success: false, toolId, error: "Path must start with /" };
        }

        // Return navigation instruction that the frontend will handle
        return {
          success: true,
          toolId,
          output: {
            action: "navigate",
            path,
            description: description || `Navigating to ${path}`,
            message: `✅ Navigating to ${path}...`,
          },
        };
      }

      case "ui.click": {
        const o = requireObject(input, "input");
        const selector = requireString(o.selector, "selector", 500);
        const description = optionalString(o.description);

        // Return click instruction that the frontend will handle
        return {
          success: true,
          toolId,
          output: {
            action: "click",
            selector,
            description: description || `Clicking ${selector}`,
            message: `✅ Attempting to click: ${selector}`,
          },
        };
      }

      case "wms.asn.create": {
        try {
          const o = requireObject(input, "input");

          console.log(
            "[CopilotToolExecutionService] Creating ASN with input:",
            o,
          );
          console.log("[CopilotToolExecutionService] Context:", {
            tenantId: ctx.tenantId,
            userId: ctx.userId,
          });

          // Generate test data if not provided - be proactive!
          const vendorName =
            optionalString(o.vendorName) ||
            `Test Vendor ${Math.floor(Math.random() * 1000)}`;
          const vendorNumber =
            optionalString(o.vendorNumber) ||
            `VND-TEST-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
          const documentNumber =
            optionalString(o.documentNumber) ||
            `ASN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

          // Default to tomorrow for delivery date
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const expectedDeliveryDate = o.expectedDeliveryDate
            ? new Date(o.expectedDeliveryDate as string).toISOString()
            : tomorrow.toISOString();

          const destination =
            optionalString(o.destination) || "DEFAULT_WAREHOUSE";
          const purchaseOrderNumber = optionalString(o.purchaseOrderNumber);
          const carrier = optionalString(o.carrier) || "Test Carrier";
          const trackingNumber =
            optionalString(o.trackingNumber) || `TRK-${Date.now()}`;
          const totalQuantity =
            optionalNumber(o.totalQuantity) ||
            Math.floor(Math.random() * 1000) + 100;
          const totalItems =
            optionalNumber(o.totalItems) || Math.floor(Math.random() * 10) + 1;
          const priority = (
            optionalString(o.priority) || "MEDIUM"
          ).toUpperCase() as "HIGH" | "MEDIUM" | "LOW";

          // Check if ASN service is available
          if (!asnService) {
            throw new Error(
              "ASN service is not available. Please check your ASN module configuration.",
            );
          }

          // CRITICAL FIX: Include tenantId - this was missing!
          if (!ctx.tenantId) {
            throw new Error(
              "Tenant ID is required to create ASN. Please ensure you are authenticated.",
            );
          }

          // Create ASN with test data - NOW WITH TENANTID
          const asn = await asnService.createASN({
            documentNumber,
            vendorNumber,
            vendorName,
            expectedDeliveryDate,
            destination,
            purchaseOrderNumber,
            carrier,
            trackingNumber,
            totalQuantity,
            totalItems,
            priority,
            processType: "INBOUND",
            status: "CREATED",
            complianceStatus: "UNDER_REVIEW",
            createdBy: ctx.userId,
            tenantId: ctx.tenantId, // CRITICAL: This was missing!
          });

          console.log(
            "[CopilotToolExecutionService] ✅ ASN created successfully:",
            {
              id: asn.id,
              documentNumber: asn.documentNumber,
              vendorName: asn.vendorName,
            },
          );

          // Create evidence
          let evd;
          try {
            evd = await evidenceService.createEvidence(
              {
                entityType: "ASN",
                entityId: asn.id,
                claimType: "asn_creation",
                claim: `ASN ${asn.documentNumber} created via copilot`,
                evidence: {
                  toolId,
                  input: o,
                  output: asn,
                  timestamp: new Date().toISOString(),
                },
              },
              {
                id: ctx.userId,
                name: "Copilot User",
                tenantId: ctx.tenantId,
                type: "user",
              },
            );
          } catch (evidenceError) {
            console.warn(
              "[CopilotToolExecutionService] Failed to create evidence for ASN:",
              evidenceError,
            );
            // Continue without evidence - non-blocking
          }

          // Learn from tool usage
          await learnFromTool({
            tenantId: ctx.tenantId,
            userId: ctx.userId,
            toolId,
            input: o,
            output: { asnId: asn.id, documentNumber: asn.documentNumber },
            success: true,
            confidence: 90,
          });

          return {
            success: true,
            toolId,
            evidenceId: evd?.id,
            output: {
              id: asn.id,
              documentNumber: asn.documentNumber,
              vendorName: asn.vendorName,
              vendorNumber: asn.vendorNumber,
              expectedDeliveryDate: asn.expectedDeliveryDate,
              status: asn.status,
              priority: asn.priority,
              message: `✅ Successfully created ASN ${asn.documentNumber} for ${asn.vendorName}`,
              // ADD NAVIGATION ACTION - CRITICAL FIX
              action: "navigate",
              path: `/warehouse/inbound?asnId=${asn.id}`,
              entityType: "ASN",
              entityId: asn.id,
            },
          };
        } catch (asnError: any) {
          console.error(
            "[CopilotToolExecutionService] ASN creation error:",
            asnError,
          );
          return {
            success: false,
            toolId,
            error:
              asnError instanceof Error
                ? asnError.message
                : "Failed to create ASN. Please check the ASN service configuration.",
          };
        }
      }

      case "iso-ims.capa.create": {
        try {
          const o = requireObject(input, "input");

          // Import CAPA service
          const { capaService } = await import("@/lib/services/iso-ims");

          // Generate test data if not provided - be proactive!
          // Use optionalString first, then fallback to test data
          const subject =
            optionalString(o.subject) || `Test CAPA ${Date.now()}`;
          const description =
            optionalString(o.description) ||
            `Test CAPA description for quality improvement`;
          const actionPlan =
            optionalString(o.actionPlan) ||
            `1. Investigate root cause\n2. Implement corrective measures\n3. Monitor effectiveness`;

          // Validate that we have at least subject and description
          if (!subject || subject.trim().length === 0) {
            throw new Error("Subject is required for CAPA creation");
          }
          if (!description || description.trim().length === 0) {
            throw new Error("Description is required for CAPA creation");
          }
          if (!actionPlan || actionPlan.trim().length === 0) {
            throw new Error("Action plan is required for CAPA creation");
          }

          // Map priority
          const priorityMap: Record<
            string,
            "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
          > = {
            LOW: "LOW",
            MEDIUM: "MEDIUM",
            HIGH: "HIGH",
            CRITICAL: "CRITICAL",
          };
          const priority =
            priorityMap[
              (optionalString(o.priority) || "MEDIUM").toUpperCase()
            ] || "MEDIUM";

          // Map CAPA type
          const typeMap: Record<
            string,
            "CORRECTIVE_ACTION" | "PREVENTIVE_ACTION"
          > = {
            CORRECTIVE_ACTION: "CORRECTIVE_ACTION",
            PREVENTIVE_ACTION: "PREVENTIVE_ACTION",
            CORRECTIVE: "CORRECTIVE_ACTION",
            PREVENTIVE: "PREVENTIVE_ACTION",
          };
          const capaType =
            typeMap[
              (optionalString(o.capaType) || "CORRECTIVE_ACTION").toUpperCase()
            ] || "CORRECTIVE_ACTION";

          // Map CAPA source
          const sourceMap: Record<
            string,
            | "NCR"
            | "AUDIT"
            | "RISK_ASSESSMENT"
            | "CUSTOMER_COMPLAINT"
            | "MANAGEMENT_REVIEW"
            | "INCIDENT"
            | "INTERNAL_REVIEW"
            | "OTHER"
          > = {
            NCR: "NCR",
            AUDIT: "AUDIT",
            RISK_ASSESSMENT: "RISK_ASSESSMENT",
            CUSTOMER_COMPLAINT: "CUSTOMER_COMPLAINT",
            MANAGEMENT_REVIEW: "MANAGEMENT_REVIEW",
            INCIDENT: "INCIDENT",
            INTERNAL_REVIEW: "INTERNAL_REVIEW",
            OTHER: "OTHER",
          };
          const capaSource =
            sourceMap[
              (optionalString(o.capaSource) || "AUDIT").toUpperCase()
            ] || "AUDIT";

          // Default to 30 days from now for target date
          const targetDate = o.targetDate
            ? new Date(o.targetDate as string)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          const assignedTo = optionalString(o.assignedTo) || ctx.userId;
          const department = optionalString(o.department) || "Quality";
          const rootCause = optionalString(o.rootCause);
          const resourcesRequired = optionalString(o.resourcesRequired);
          const linkedNCR = optionalString(o.linkedNCR);
          const linkedCustomer = optionalString(o.linkedCustomer);
          const linkedSupplier = optionalString(o.linkedSupplier);
          const linkedMaterial = optionalString(o.linkedMaterial);

          // Create CAPA
          const capa = await capaService.createCAPA({
            tenantId: ctx.tenantId,
            subject,
            description,
            actionPlan,
            priority,
            capaType,
            capaSource,
            assignedTo,
            department,
            owner: ctx.userId,
            targetDate,
            rootCause,
            resourcesRequired,
            linkedNCR,
            linkedCustomer,
            linkedSupplier,
            linkedMaterial,
            createdBy: ctx.userId,
          });

          // Create evidence
          let evd;
          try {
            evd = await evidenceService.create({
              tenantId: ctx.tenantId,
              type: "event",
              category: "compliance",
              title: `CAPA created: ${capa.capaNumber}`,
              description: "Copilot tool execution: CAPA created",
              content: JSON.stringify(
                {
                  capaId: capa.id,
                  capaNumber: capa.capaNumber,
                  subject,
                  createdAt: new Date().toISOString(),
                },
                null,
                2,
              ),
              createdBy: ctx.userId,
              metadata: {
                source: "copilot-tool",
                capturedAt: new Date().toISOString(),
                capturedMethod: "api",
              },
              relatedEntities: [
                {
                  entityId: capa.id,
                  entityType: "CAPA",
                  relationship: "subject",
                  addedAt: new Date().toISOString(),
                },
              ],
              tags: ["copilot", "iso-ims", "capa"],
            } as any);
          } catch (evidenceError) {
            console.warn(
              "[CopilotToolExecutionService] Failed to create evidence for CAPA:",
              evidenceError,
            );
            // Continue without evidence - non-blocking
          }

          // Learn from tool usage
          await learnFromTool({
            tenantId: ctx.tenantId,
            userId: ctx.userId,
            toolId,
            input: o,
            output: { capaId: capa.id, capaNumber: capa.capaNumber },
            success: true,
            confidence: 90,
          });

          return {
            success: true,
            toolId,
            evidenceId: evd?.id,
            output: {
              id: capa.id,
              capaNumber: capa.capaNumber,
              subject: capa.subject,
              message: `✅ Successfully created CAPA ${capa.capaNumber}: ${capa.subject}`,
              // ADD NAVIGATION ACTION
              action: "navigate",
              path: `/iso-ims/capa/${capa.id}`,
              entityType: "CAPA",
              entityId: capa.id,
              status: capa.status,
              priority: capa.priority,
              capaType: capa.capaType,
              capaSource: capa.capaSource,
              targetDate: capa.targetDate,
              message: `✅ Successfully created CAPA ${capa.capaNumber}: ${capa.subject}`,
            },
          };
        } catch (capaError: any) {
          console.error(
            "[CopilotToolExecutionService] CAPA creation error:",
            capaError,
          );
          return {
            success: false,
            toolId,
            error:
              capaError instanceof Error
                ? capaError.message
                : "Failed to create CAPA. Please check the CAPA service configuration.",
          };
        }
      }

      case "iso-ims.capa.get": {
        try {
          const o = requireObject(input, "input");
          const capaId = requireString(o.capaId, "capaId", 200);

          const { capaService } = await import("@/lib/services/iso-ims");

          const capa = await capaService.getCAPA(capaId, ctx.tenantId);

          if (!capa) {
            return {
              success: false,
              toolId,
              error: `CAPA ${capaId} not found`,
            };
          }

          await learnFromTool({
            tenantId: ctx.tenantId,
            userId: ctx.userId,
            toolId,
            input: o,
            output: { capaId: capa.id },
            success: true,
            confidence: 90,
          });

          return {
            success: true,
            toolId,
            output: capa,
          };
        } catch (capaError: any) {
          console.error(
            "[CopilotToolExecutionService] CAPA get error:",
            capaError,
          );
          return {
            success: false,
            toolId,
            error:
              capaError instanceof Error
                ? capaError.message
                : "Failed to retrieve CAPA",
          };
        }
      }

      case "iso-ims.capa.list": {
        try {
          const o = requireObject(input, "input");
          const status = optionalString(o.status);
          const priority = optionalString(o.priority);
          const limit =
            typeof o.limit === "number"
              ? Math.min(100, Math.max(1, Math.floor(o.limit)))
              : 20;
          const page =
            typeof o.page === "number" ? Math.max(1, Math.floor(o.page)) : 1;

          const { capaService } = await import("@/lib/services/iso-ims");

          const filters: any[] = [];
          if (status)
            filters.push({
              field: "status",
              operator: "equals",
              value: status,
            });
          if (priority)
            filters.push({
              field: "priority",
              operator: "equals",
              value: priority,
            });

          const query = {
            tenantId: ctx.tenantId,
            filters: filters.length > 0 ? filters : undefined,
            page,
            pageSize: limit,
            sortBy: "createdAt",
            sortOrder: "desc" as const,
          };

          const result = await capaService.getCAPAs(query);

          await learnFromTool({
            tenantId: ctx.tenantId,
            userId: ctx.userId,
            toolId,
            input: o,
            output: { count: result.capas.length, total: result.total },
            success: true,
            confidence: 85,
          });

          return {
            success: true,
            toolId,
            output: {
              capas: result.capas.map((c) => ({
                id: c.id,
                capaNumber: c.capaNumber,
                subject: c.subject,
                status: c.status,
                priority: c.priority,
                capaType: c.capaType,
                capaSource: c.capaSource,
                assignedTo: c.assignedTo,
                targetDate: c.targetDate,
                createdAt: c.createdAt,
              })),
              total: result.total,
              page,
              limit,
            },
          };
        } catch (capaError: any) {
          console.error(
            "[CopilotToolExecutionService] CAPA list error:",
            capaError,
          );
          return {
            success: false,
            toolId,
            error:
              capaError instanceof Error
                ? capaError.message
                : "Failed to list CAPAs",
          };
        }
      }

      default:
        return {
          success: false,
          toolId,
          error: `Tool not implemented: ${toolId}`,
        };
    }
  }
}

export const copilotToolExecutionService = new CopilotToolExecutionService();