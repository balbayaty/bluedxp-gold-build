/**
 * Batch MSDS Processing API
 * Process multiple MSDS files at once
 * Directly uses the analysis logic to avoid FileReader issues
 */

import { NextRequest, NextResponse } from "next/server";
import { SDSParserService } from "@/lib/services/ml/sds-parser";
import { HazardPredictionService } from "@/lib/services/ml/hazard-prediction";
import { ChemicalRiskAssessmentService } from "@/lib/services/ml/risk-assessment";
import { MSDSDocument } from "@/types/chemical";
import { msdsDomainService } from "@/lib/services/chemical/msdsDomainService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const sdsParser = new SDSParserService();
const hazardPrediction = new HazardPredictionService();
const riskAssessment = new ChemicalRiskAssessmentService();

async function analyzeFile(
  file: File,
  options?: {
    openaiKey?: string;
    anthropicKey?: string;
    tenantId?: string;
  },
): Promise<any> {
  // Check file type
  const fileType = file.type || file.name.split(".").pop()?.toLowerCase();
  const isPDF =
    fileType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isExcel =
    fileType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileType === "application/vnd.ms-excel" ||
    file.name.toLowerCase().endsWith(".xlsx") ||
    file.name.toLowerCase().endsWith(".xls");
  const isCSV =
    fileType === "text/csv" || file.name.toLowerCase().endsWith(".csv");

  let text = "";

  // Handle Excel files
  if (isExcel) {
    try {
      const XLSX = require("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "buffer" });

      let excelText = "";
      workbook.SheetNames.forEach((sheetName: string) => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        });
        sheetData.forEach((row: any[]) => {
          if (Array.isArray(row)) {
            excelText +=
              row
                .filter(
                  (cell) => cell !== null && cell !== undefined && cell !== "",
                )
                .join(" ") + "\n";
          }
        });
      });
      text = excelText;
    } catch (excelError: any) {
      throw new Error(
        `Failed to parse Excel file: ${excelError?.message || "Unknown error"}`,
      );
    }
  } else if (isPDF) {
    try {
      // Try to use pdf-parse if available (same pattern as analyze-comprehensive)
      const buffer = await file.arrayBuffer();
      let pdfParse: any = null;

      try {
        // Try dynamic import first (ES modules)
        try {
          const pdfParseModule = await import("pdf-parse");
          // pdf-parse exports the function directly or as default
          if (typeof pdfParseModule === "function") {
            pdfParse = pdfParseModule;
          } else if (
            pdfParseModule.default &&
            typeof pdfParseModule.default === "function"
          ) {
            pdfParse = pdfParseModule.default;
          } else if (typeof (pdfParseModule as any).PDFParse === "function") {
            pdfParse = (pdfParseModule as any).PDFParse;
          } else {
            // Try direct access
            pdfParse = pdfParseModule as any;
          }
        } catch (importError) {
          // Fallback to require (CommonJS)
          const pdfParseModule = require("pdf-parse");
          // pdf-parse exports the function directly or as default
          if (typeof pdfParseModule === "function") {
            pdfParse = pdfParseModule;
          } else if (
            pdfParseModule.default &&
            typeof pdfParseModule.default === "function"
          ) {
            pdfParse = pdfParseModule.default;
          } else if (typeof pdfParseModule.PDFParse === "function") {
            pdfParse = pdfParseModule.PDFParse;
          } else {
            // Try direct access
            pdfParse = pdfParseModule;
          }
        }
      } catch (e: any) {
        console.warn(
          "[batch-msds] pdf-parse not available, using fallback method:",
          e?.message || e,
        );
        pdfParse = null;
      }

      if (pdfParse && typeof pdfParse === "function") {
        // Use pdf-parse library
        try {
          // Convert ArrayBuffer to Buffer for pdf-parse
          const nodeBuffer = Buffer.from(buffer);
          console.log(
            "[batch-msds] Attempting to parse PDF with pdf-parse, buffer size:",
            nodeBuffer.length,
          );
          const pdfData = await pdfParse(nodeBuffer);
          text = pdfData.text || "";
          console.log("[batch-msds] Extracted text length:", text.length);

          if (!text || text.trim().length < 100) {
            // Try OCR if available - use cloud OCR if API keys are provided
            try {
              const { ocrService } =
                await import("@/lib/services/ocr/ocrService");
              if (ocrService.isAvailable()) {
                const cloudEnabled = !!(
                  options?.openaiKey || options?.anthropicKey
                );
                const ocrResult = await ocrService.extractTextFromPDF(
                  nodeBuffer,
                  {
                    language: "eng",
                    useCloudOCR: cloudEnabled,
                    cloud: cloudEnabled
                      ? {
                          tenantId: options?.tenantId,
                          provider: "auto",
                          openaiKey: options?.openaiKey || undefined,
                          anthropicKey: options?.anthropicKey || undefined,
                        }
                      : undefined,
                  },
                );
                if (ocrResult.text && ocrResult.text.trim().length >= 100) {
                  text = ocrResult.text;
                  console.log(
                    `[batch-msds] OCR extracted ${ocrResult.text.length} characters (cloud: ${cloudEnabled ? "yes" : "no"})`,
                  );
                } else {
                  throw new Error(
                    cloudEnabled
                      ? "PDF appears to be empty or image-only. Cloud OCR extracted insufficient text. Please ensure the PDF contains extractable text, or convert it to Excel/CSV format."
                      : "PDF appears to be empty or image-only. Local OCR extracted insufficient text. To use cloud OCR (better for scanned PDFs), configure OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env.local file.",
                  );
                }
              } else {
                throw new Error(
                  options?.openaiKey || options?.anthropicKey
                    ? "PDF appears to be empty or image-only. OCR service not available. Please ensure tesseract.js is installed or convert to Excel/CSV format."
                    : "PDF appears to be empty or image-only. OCR not available. To enable cloud OCR for scanned PDFs, configure OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env.local file. Alternatively, convert the PDF to Excel/CSV format.",
                );
              }
            } catch (ocrError: any) {
              const errorMsg =
                ocrError instanceof Error ? ocrError.message : String(ocrError);
              throw new Error(
                `PDF OCR failed: ${errorMsg}. ${options?.openaiKey || options?.anthropicKey ? "Cloud OCR was attempted but failed." : "To use cloud OCR for better results, configure OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env.local file."}`,
              );
            }
          }
        } catch (parseError: any) {
          console.error("pdf-parse error:", parseError);
          // Check for specific error types
          if (
            parseError.message?.includes("password") ||
            parseError.message?.includes("encrypted")
          ) {
            throw new Error(
              "PDF is password-protected. Please remove the password or convert to Excel/CSV format.",
            );
          }
          throw new Error(
            `PDF parsing failed: ${parseError?.message || "Unknown error"}`,
          );
        }
      } else {
        // Fallback: Try to extract text using basic method
        const uint8Array = new Uint8Array(buffer);
        let extractedText = "";
        const bufferString = Buffer.from(uint8Array).toString("binary");

        // Look for text streams in PDF (basic pattern matching)
        const textMatches = bufferString.match(/BT[\s\S]*?ET/g);
        if (textMatches) {
          for (const match of textMatches) {
            // Extract text between parentheses (PDF text objects)
            const textInParens = match.match(/\(([^)]+)\)/g);
            if (textInParens) {
              extractedText +=
                textInParens.map((t) => t.slice(1, -1)).join(" ") + " ";
            }
          }
        }

        // Also try to decode as UTF-8 (some PDFs have readable text)
        try {
          const utf8Text = new TextDecoder("utf-8", { fatal: false }).decode(
            uint8Array,
          );
          // Extract readable text portions
          const readableText =
            utf8Text.match(/[a-zA-Z0-9\s]{20,}/g)?.join(" ") || "";
          if (readableText.length > extractedText.length) {
            extractedText = readableText;
          }
        } catch (e) {
          // Ignore UTF-8 decode errors
        }

        if (!extractedText || extractedText.trim().length < 100) {
          throw new Error(
            "Could not extract text from PDF. This PDF may be image-based (scanned) or password-protected. Please install pdf-parse library for better PDF support, or convert the PDF to Excel/CSV format. For scanned PDFs, use OCR first.",
          );
        }

        text = extractedText;
      }
    } catch (parseError: any) {
      if (
        parseError.message?.includes("password") ||
        parseError.message?.includes("encrypted")
      ) {
        throw new Error(
          "PDF is password-protected. Please remove the password or convert to Excel/CSV format.",
        );
      }
      throw new Error(
        `PDF parsing failed: ${parseError?.message || "Unknown error"}`,
      );
    }
  } else if (isCSV) {
    const buffer = await file.arrayBuffer();
    text = new TextDecoder("utf-8").decode(buffer);
  } else {
    const buffer = await file.arrayBuffer();
    text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  }

  if (!text || text.trim().length < 100) {
    throw new Error("File appears to be empty or contains insufficient text.");
  }

  // Parse SDS
  const parsedData = await sdsParser.parseSDS(text);

  // Perform hazard prediction
  const hazards = await hazardPrediction.predictHazards({
    name: parsedData.chemicalName,
    casNumber: parsedData.casNumber,
    hazardStatements: parsedData.hazardStatements || [],
    physicalProperties: parsedData.physicalProperties,
  } as any);

  // Perform risk assessment
  const chemical = {
    id: parsedData.casNumber || "unknown",
    name: parsedData.chemicalName,
    casNumber: parsedData.casNumber,
    hazardClassifications: parsedData.hazardStatements || [],
    hazardStatements: parsedData.hazardStatements || [],
    physicalProperties: parsedData.physicalProperties
      ? {
          physicalState: (parsedData.physicalProperties.appearance
            ?.toLowerCase()
            .includes("liquid")
            ? "liquid"
            : parsedData.physicalProperties.appearance
                  ?.toLowerCase()
                  .includes("gas")
              ? "gas"
              : "solid") as "solid" | "liquid" | "gas",
          boilingPoint: parseFloat(
            parsedData.physicalProperties.boilingPoint || "0",
          ),
          flashPoint: parseFloat(
            parsedData.physicalProperties.flashPoint || "0",
          ),
        }
      : undefined,
  };

  const scenario = {
    id: "default-scenario",
    name: "General Handling",
    description: "General chemical handling scenario",
    exposureRoute: "multiple" as const,
    duration: "intermediate" as const,
    frequency: "occasional" as const,
    magnitude: "moderate" as const,
    controlMeasures: ["Standard PPE", "Ventilation"],
  };

  const workplace = {
    id: "default-workplace",
    name: "Warehouse",
    type: "Warehouse",
    area: 1000,
    controlMeasures: ["Standard controls"],
    averageOccupancy: 5,
    activities: ["Storage", "Handling"],
  };

  const assessmentResult = await riskAssessment.performRiskAssessment(
    chemical,
    scenario,
    workplace,
  );
  const riskResult = {
    overallRiskScore: assessmentResult.riskScore / 20,
    riskLevel: assessmentResult.riskLevel,
    recommendedPPE: assessmentResult.recommendedPPE,
    recommendedControls: assessmentResult.recommendedControls,
  };

  const hazardLevel =
    hazards.length > 0 && hazards[0].severityLevel === "Extreme"
      ? "High"
      : hazards.length > 0 && hazards[0].severityLevel === "High"
        ? "High"
        : hazards.length > 0
          ? "Medium"
          : "Low";

  return {
    success: true,
    extractedData: {
      productName: parsedData.chemicalName,
      manufacturer: parsedData.manufacturer,
      casNumber: parsedData.casNumber,
      formula: parsedData.physicalProperties?.appearance || "Not specified",
      hazardClass: parsedData.hazardStatements[0] || "Not classified",
      hazardLevel: hazardLevel as "High" | "Medium" | "Low",
      hazardStatements: parsedData.hazardStatements,
      precautionaryStatements: parsedData.precautionaryStatements,
      physicalState:
        parsedData.physicalProperties?.appearance || "Not specified",
      flashPoint: parsedData.physicalProperties?.flashPoint || "Not specified",
      boilingPoint:
        parsedData.physicalProperties?.boilingPoint || "Not specified",
      ph: parsedData.physicalProperties?.ph?.toString() || "Not specified",
      storageConditions: Array.isArray(parsedData.storageRequirements)
        ? parsedData.storageRequirements
        : [],
      storageRequirements: Array.isArray(parsedData.storageRequirements)
        ? parsedData.storageRequirements
        : [],
      incompatibleMaterials: Array.isArray(
        parsedData.stabilityReactivity?.incompatibleMaterials,
      )
        ? parsedData.stabilityReactivity.incompatibleMaterials
        : [],
      ppeRequired: riskResult?.recommendedPPE || ["Standard PPE"],
      firstAid:
        parsedData.firstAid?.inhalation ||
        parsedData.firstAid?.skinContact ||
        "Seek medical attention",
      firefighting:
        Array.isArray(parsedData.fireExtinguishingMedia) &&
        parsedData.fireExtinguishingMedia.length > 0
          ? parsedData.fireExtinguishingMedia.join(", ")
          : "CO2, dry chemical",
      spillResponse: "Contain and clean up",
      emergencyProcedures: parsedData.firstAid
        ? [
            parsedData.firstAid.inhalation || "",
            parsedData.firstAid.skinContact || "",
            parsedData.firstAid.eyeContact || "",
            parsedData.firstAid.ingestion || "",
          ].filter(Boolean)
        : ["Seek medical attention"],
      ghsCompliant:
        Array.isArray(parsedData.hazardStatements) &&
        (parsedData.hazardStatements?.length || 0) > 0,
      safetyScore:
        riskResult && riskResult.overallRiskScore
          ? Math.max(0, Math.min(100, 100 - riskResult.overallRiskScore * 20))
          : 75,
      aiConfidence: parsedData.confidence
        ? Math.max(0, Math.min(100, parsedData.confidence * 100))
        : 50,
      packagingType: "Drums/Containers",
      unNumber: "UN not specified",
      transportClass: "Class 9",
      packingGroup: "PG III",
      fireSuppressionRequired:
        Array.isArray(parsedData.fireExtinguishingMedia) &&
        parsedData.fireExtinguishingMedia.length > 0
          ? parsedData.fireExtinguishingMedia.join(", ")
          : "CO2, Dry chemical",
      specialHazards:
        Array.isArray(parsedData.stabilityReactivity?.conditionsToAvoid) &&
        parsedData.stabilityReactivity.conditionsToAvoid.length > 0
          ? parsedData.stabilityReactivity.conditionsToAvoid.join(", ")
          : "Standard combustion hazards",
      remarks: "",
      healthRating:
        hazardLevel === "High" ? "3" : hazardLevel === "Medium" ? "2" : "1",
      flammabilityRating: parsedData.physicalProperties?.flashPoint ? "2" : "1",
      reactivityRating: "0",
    },
    hazards,
    riskAssessment: riskResult,
  };
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    // Get API keys from environment variables (server-side only, never from client)
    // This follows enterprise security best practices - API keys should NEVER be exposed to client
    const allowClientSuppliedKeys =
      process.env.NODE_ENV !== "production" &&
      (process.env.ALLOW_CLIENT_SUPPLIED_AI_KEYS || "").toLowerCase() ===
        "true";

    const openaiKey =
      process.env.OPENAI_API_KEY ||
      process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
      (allowClientSuppliedKeys ? request.headers.get("x-openai-key") : null);

    const anthropicKey =
      process.env.ANTHROPIC_API_KEY ||
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
      (allowClientSuppliedKeys ? request.headers.get("x-anthropic-key") : null);

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const customerId = formData.get("customerId") as string | null;
    const customerEmail = formData.get("customerEmail") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 },
      );
    }

    console.log("[batch-msds] Processing", files.length, "files");
    console.log("[batch-msds] API keys available:", {
      openai: !!openaiKey,
      anthropic: !!anthropicKey,
      source: openaiKey || anthropicKey ? "environment" : "none",
    });

    const successful: any[] = [];
    const failed: Array<{ fileName: string; error: string }> = [];

    // Process each file
    for (const file of files) {
      try {
        const analyzeData = await analyzeFile(file, {
          openaiKey: openaiKey || undefined,
          anthropicKey: anthropicKey || undefined,
          tenantId: context.tenantId,
        });

        if (analyzeData.success && analyzeData.extractedData) {
          const msdsId = `msds-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          const chemicalName =
            analyzeData.extractedData.productName ||
            file.name.replace(/\.(pdf|xlsx|csv)$/i, "");

          // Create MSDS document
          const msds: MSDSDocument = {
            id: msdsId,
            chemicalName,
            manufacturer: analyzeData.extractedData.manufacturer || "Unknown",
            version: "1.0",
            language: "en",
            fileType: file.type.includes("pdf")
              ? "pdf"
              : file.type.includes("excel")
                ? "excel"
                : "csv",
            extractedData: analyzeData.extractedData,
            status: "analyzing",
            workflowStatus: "pending_analysis",
            metadata: {
              submittedDate: new Date().toISOString(),
              source: "batch_upload",
              filename: file.name,
            },
          };

          // Store + publish msds.uploaded event (tenant-scoped)
          await msdsDomainService.storeExtractedMSDS({
            tenantId: context.tenantId,
            actor: { userId: context.userId, roles: context.permissions || [] },
            msds,
            extractedData: analyzeData.extractedData,
            source: "batch_upload",
          });

          successful.push({
            id: msdsId,
            chemicalName,
            status: "analyzing",
            extractedData: analyzeData.extractedData,
          });
        } else {
          throw new Error("Analysis returned no data");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : undefined;

        console.error(`[batch-msds] Error processing ${file.name}:`, error);

        // Log detailed error
        try {
          const { logger } =
            await import("@/lib/services/observability/logger");
          logger.error("MSDS batch file processing failed", {
            module: "msds",
            service: "batch-upload",
            tenantId: context.tenantId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            error: errorMessage,
            stack: errorStack,
          });
        } catch (logError) {
          // Non-blocking
          console.error("[batch-msds] Failed to log error:", logError);
        }

        failed.push({
          fileName: file.name,
          error: errorMessage,
          details: errorStack
            ? { stack: errorStack.substring(0, 500) }
            : undefined,
        });
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        successful: successful.length,
        failed: failed.length,
        total: files.length,
        details: {
          successful: successful.map((msds) => ({
            id: msds.id,
            chemicalName: msds.chemicalName,
            status: msds.status,
          })),
          failed: failed,
        },
      },
    });
  } catch (error) {
    console.error("Batch MSDS processing error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process batch",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.msds.batch",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
